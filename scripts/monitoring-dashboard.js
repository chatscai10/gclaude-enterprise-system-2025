/**
 * 監控儀表板
 * 即時監控數據展示和管理介面
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const MonitoringAlertingSystem = require('./monitoring-alerting-system');
const fs = require('fs');
const path = require('path');

class MonitoringDashboard {
    constructor(port = 3008) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        this.monitoringSystem = new MonitoringAlertingSystem();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
    }

    setupMiddleware() {
        this.app.use(express.static(path.join(__dirname, '..', 'monitoring', 'dashboard')));
        this.app.use(express.json());
        
        // CORS for development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            next();
        });
    }

    setupRoutes() {
        // API routes for monitoring data
        this.app.get('/api/monitoring/status', (req, res) => {
            res.json(this.monitoringSystem.getMonitoringStatus());
        });

        this.app.get('/api/monitoring/targets', (req, res) => {
            res.json({
                targets: this.monitoringSystem.config.targets,
                thresholds: this.monitoringSystem.config.thresholds
            });
        });

        this.app.get('/api/monitoring/reports', (req, res) => {
            const reportsDir = path.join(__dirname, '..', 'monitoring', 'reports');
            
            if (!fs.existsSync(reportsDir)) {
                return res.json([]);
            }
            
            const files = fs.readdirSync(reportsDir)
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const filePath = path.join(reportsDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        filename: file,
                        created: stats.mtime,
                        size: stats.size
                    };
                })
                .sort((a, b) => b.created - a.created);
            
            res.json(files);
        });

        this.app.get('/api/monitoring/reports/:filename', (req, res) => {
            const reportPath = path.join(__dirname, '..', 'monitoring', 'reports', req.params.filename);
            
            if (!fs.existsSync(reportPath)) {
                return res.status(404).json({ error: 'Report not found' });
            }
            
            try {
                const content = fs.readFileSync(reportPath, 'utf8');
                res.json(JSON.parse(content));
            } catch (error) {
                res.status(500).json({ error: 'Failed to read report' });
            }
        });

        this.app.get('/api/monitoring/logs/:type/:date', (req, res) => {
            const { type, date } = req.params;
            const logPath = path.join(__dirname, '..', 'monitoring', 'logs', `${type}-${date}.json`);
            
            if (!fs.existsSync(logPath)) {
                return res.status(404).json({ error: 'Log not found' });
            }
            
            try {
                const content = fs.readFileSync(logPath, 'utf8');
                res.json(JSON.parse(content));
            } catch (error) {
                res.status(500).json({ error: 'Failed to read log' });
            }
        });

        // Main dashboard route
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('📱 Dashboard client connected');
            
            // Send initial data
            socket.emit('monitoring-status', this.monitoringSystem.getMonitoringStatus());
            
            socket.on('start-monitoring', async () => {
                try {
                    await this.monitoringSystem.startMonitoring();
                    socket.emit('monitoring-status', this.monitoringSystem.getMonitoringStatus());
                } catch (error) {
                    socket.emit('error', error.message);
                }
            });
            
            socket.on('stop-monitoring', async () => {
                try {
                    await this.monitoringSystem.stopMonitoring();
                    socket.emit('monitoring-status', this.monitoringSystem.getMonitoringStatus());
                } catch (error) {
                    socket.emit('error', error.message);
                }
            });
            
            socket.on('disconnect', () => {
                console.log('📱 Dashboard client disconnected');
            });
        });
        
        // 定期廣播監控數據
        setInterval(() => {
            this.io.emit('monitoring-update', {
                status: this.monitoringSystem.getMonitoringStatus(),
                timestamp: new Date().toISOString()
            });
        }, 30000); // 每30秒更新
    }

    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GClaude Enterprise - 監控儀表板</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #f5f7fa; 
            color: #333; 
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.9; }
        
        .container { 
            max-width: 1400px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid #e9ecef;
        }
        
        .card h3 {
            margin-bottom: 15px;
            color: #495057;
            font-size: 1.3em;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f8f9fa;
        }
        
        .metric:last-child { border-bottom: none; }
        
        .metric-value {
            font-weight: bold;
            font-size: 1.2em;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-up { background: #28a745; }
        .status-down { background: #dc3545; }
        .status-unknown { background: #6c757d; }
        
        .control-panel {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
            transition: background 0.3s;
        }
        
        .btn:hover { background: #5a67d8; }
        .btn-danger { background: #dc3545; }
        .btn-danger:hover { background: #c82333; }
        
        .alerts-panel {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .alert {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 10px;
        }
        
        .chart-container {
            height: 300px;
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6c757d;
        }
        
        .timestamp {
            color: #6c757d;
            font-size: 0.9em;
            font-style: italic;
        }
        
        @media (max-width: 768px) {
            .dashboard-grid { grid-template-columns: 1fr; }
            .header h1 { font-size: 2em; }
            .container { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🖥️ 監控儀表板</h1>
        <p>GClaude Enterprise System - 即時系統監控</p>
        <p class="timestamp" id="currentTime"></p>
    </div>
    
    <div class="container">
        <div class="control-panel">
            <h3>📊 監控控制</h3>
            <button class="btn" id="startBtn" onclick="startMonitoring()">▶️ 開始監控</button>
            <button class="btn btn-danger" id="stopBtn" onclick="stopMonitoring()">⏹️ 停止監控</button>
            <button class="btn" onclick="refreshData()">🔄 刷新數據</button>
            <button class="btn" onclick="downloadReport()">📋 下載報告</button>
        </div>
        
        <div id="alertsPanel" class="alerts-panel" style="display: none;">
            <h3>🚨 最近告警</h3>
            <div id="alertsList"></div>
        </div>
        
        <div class="dashboard-grid">
            <div class="card">
                <h3>📈 系統狀態</h3>
                <div class="metric">
                    <span>監控狀態</span>
                    <span class="metric-value" id="monitoringStatus">未知</span>
                </div>
                <div class="metric">
                    <span>監控目標</span>
                    <span class="metric-value" id="targetCount">0</span>
                </div>
                <div class="metric">
                    <span>告警數量</span>
                    <span class="metric-value" id="alertCount">0</span>
                </div>
                <div class="metric">
                    <span>最後更新</span>
                    <span class="timestamp" id="lastUpdate">從未</span>
                </div>
            </div>
            
            <div class="card">
                <h3>🎯 服務狀態</h3>
                <div id="servicesStatus">
                    <div class="metric">
                        <span>Railway Production</span>
                        <span><span class="status-indicator status-unknown"></span>檢查中...</span>
                    </div>
                    <div class="metric">
                        <span>Render Production</span>
                        <span><span class="status-indicator status-unknown"></span>檢查中...</span>
                    </div>
                    <div class="metric">
                        <span>Local Development</span>
                        <span><span class="status-indicator status-unknown"></span>檢查中...</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>📊 效能指標</h3>
                <div class="metric">
                    <span>平均回應時間</span>
                    <span class="metric-value" id="avgResponseTime">-</span>
                </div>
                <div class="metric">
                    <span>服務可用性</span>
                    <span class="metric-value" id="uptime">-</span>
                </div>
                <div class="metric">
                    <span>成功檢查</span>
                    <span class="metric-value" id="successRate">-</span>
                </div>
                <div class="metric">
                    <span>失敗檢查</span>
                    <span class="metric-value" id="failureRate">-</span>
                </div>
            </div>
            
            <div class="card">
                <h3>🔍 監控配置</h3>
                <div class="metric">
                    <span>健康檢查間隔</span>
                    <span>5 分鐘</span>
                </div>
                <div class="metric">
                    <span>效能檢查間隔</span>
                    <span>15 分鐘</span>
                </div>
                <div class="metric">
                    <span>系統檢查間隔</span>
                    <span>30 分鐘</span>
                </div>
                <div class="metric">
                    <span>報告生成間隔</span>
                    <span>60 分鐘</span>
                </div>
            </div>
        </div>
        
        <div class="chart-container">
            <div>
                <h3>📈 即時監控圖表</h3>
                <p>圖表功能開發中... 可集成 Chart.js 或其他圖表庫</p>
            </div>
        </div>
    </div>
    
    <script>
        const socket = io();
        let monitoringStatus = {};
        
        // 更新時間顯示
        function updateTime() {
            document.getElementById('currentTime').textContent = new Date().toLocaleString('zh-TW');
        }
        setInterval(updateTime, 1000);
        updateTime();
        
        // Socket event handlers
        socket.on('monitoring-status', (status) => {
            monitoringStatus = status;
            updateDashboard(status);
        });
        
        socket.on('monitoring-update', (data) => {
            monitoringStatus = data.status;
            updateDashboard(data.status);
            document.getElementById('lastUpdate').textContent = new Date(data.timestamp).toLocaleString('zh-TW');
        });
        
        socket.on('error', (error) => {
            alert('錯誤: ' + error);
        });
        
        function updateDashboard(status) {
            document.getElementById('monitoringStatus').textContent = status.isMonitoring ? '運行中' : '已停止';
            document.getElementById('targetCount').textContent = status.targets || 0;
            document.getElementById('alertCount').textContent = status.alerts || 0;
            
            if (status.uptime) {
                document.getElementById('avgResponseTime').textContent = status.uptime.averageResponseTime || '-';
                document.getElementById('uptime').textContent = status.uptime.uptime || '-';
                document.getElementById('successRate').textContent = status.uptime.successfulChecks || '-';
                document.getElementById('failureRate').textContent = status.uptime.failedChecks || '-';
            }
        }
        
        function startMonitoring() {
            socket.emit('start-monitoring');
            document.getElementById('startBtn').disabled = true;
            document.getElementById('stopBtn').disabled = false;
        }
        
        function stopMonitoring() {
            socket.emit('stop-monitoring');
            document.getElementById('startBtn').disabled = false;
            document.getElementById('stopBtn').disabled = true;
        }
        
        function refreshData() {
            location.reload();
        }
        
        function downloadReport() {
            fetch('/api/monitoring/reports')
                .then(response => response.json())
                .then(reports => {
                    if (reports.length > 0) {
                        const latestReport = reports[0];
                        const link = document.createElement('a');
                        link.href = '/api/monitoring/reports/' + latestReport.filename;
                        link.download = latestReport.filename;
                        link.click();
                    } else {
                        alert('沒有可用的報告');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('下載報告失敗');
                });
        }
        
        // 初始化
        socket.emit('monitoring-status');
    </script>
</body>
</html>`;
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`🖥️ 監控儀表板啟動於: http://localhost:${this.port}`);
                    resolve({
                        port: this.port,
                        url: `http://localhost:${this.port}`
                    });
                }
            });
        });
    }

    async stop() {
        return new Promise((resolve) => {
            this.server.close(() => {
                console.log('🖥️ 監控儀表板已停止');
                resolve();
            });
        });
    }
}

async function startDashboard(port = 3008) {
    const dashboard = new MonitoringDashboard(port);
    return await dashboard.start();
}

if (require.main === module) {
    startDashboard()
        .then(info => {
            console.log(`🎉 監控儀表板已啟動！`);
            console.log(`📊 訪問地址: ${info.url}`);
            console.log('💡 可以通過瀏覽器查看即時監控數據');
        })
        .catch(console.error);
}

module.exports = MonitoringDashboard;