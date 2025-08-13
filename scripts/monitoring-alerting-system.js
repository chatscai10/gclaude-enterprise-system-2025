/**
 * 監控和告警系統
 * 生產環境健康監控、效能分析、錯誤追蹤和告警通知系統
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MonitoringAlertingSystem {
    constructor() {
        this.config = {
            // 監控目標
            targets: [
                {
                    name: 'Railway Production',
                    url: 'https://gclaude-enterprise.railway.app',
                    type: 'web',
                    timeout: 10000
                },
                {
                    name: 'Render Production',
                    url: 'https://gclaude-enterprise.onrender.com',
                    type: 'web',
                    timeout: 10000
                },
                {
                    name: 'Local Development',
                    url: 'http://localhost:3007',
                    type: 'web',
                    timeout: 5000,
                    optional: true
                }
            ],
            
            // 監控指標閾值
            thresholds: {
                responseTime: 2000, // ms
                errorRate: 5, // %
                uptime: 99, // %
                memoryUsage: 80, // %
                cpuUsage: 70 // %
            },
            
            // 告警配置
            alerts: {
                telegram: {
                    botToken: '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc',
                    chatId: '-1002658082392',
                    enabled: true
                },
                email: {
                    enabled: false, // 可以擴展郵件通知
                    recipients: []
                }
            },
            
            // 監控間隔 (分鐘)
            intervals: {
                healthCheck: 5,
                performanceCheck: 15,
                systemCheck: 30,
                reportGeneration: 60
            }
        };
        
        this.monitoringData = {
            uptime: new Map(),
            responseTime: new Map(),
            errors: [],
            alerts: [],
            systemMetrics: []
        };
        
        this.isMonitoring = false;
    }

    async startMonitoring() {
        console.log('🚀 啟動監控和告警系統...\n');
        
        // 初始化監控系統
        await this.initializeMonitoring();
        
        // 啟動各種監控任務
        this.startHealthMonitoring();
        this.startPerformanceMonitoring();
        this.startSystemMonitoring();
        this.startReportGeneration();
        
        this.isMonitoring = true;
        console.log('✅ 監控系統已啟動');
        
        return {
            status: 'running',
            targets: this.config.targets.length,
            monitoring: true
        };
    }

    async initializeMonitoring() {
        console.log('📦 初始化監控系統...');
        
        // 創建監控數據目錄
        const monitoringDir = path.join(__dirname, '..', 'monitoring');
        if (!fs.existsSync(monitoringDir)) {
            fs.mkdirSync(monitoringDir, { recursive: true });
        }
        
        // 創建日誌目錄
        const logsDir = path.join(monitoringDir, 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        // 創建報告目錄
        const reportsDir = path.join(monitoringDir, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        // 初始化監控狀態文件
        const statusFile = path.join(monitoringDir, 'monitoring-status.json');
        const initialStatus = {
            startTime: new Date().toISOString(),
            targets: this.config.targets.map(t => ({
                name: t.name,
                url: t.url,
                status: 'unknown',
                lastCheck: null
            })),
            alerts: [],
            metrics: {
                uptime: 0,
                totalChecks: 0,
                failedChecks: 0
            }
        };
        
        fs.writeFileSync(statusFile, JSON.stringify(initialStatus, null, 2));
        console.log('✅ 監控系統初始化完成');
    }

    startHealthMonitoring() {
        console.log(`🏥 啟動健康檢查監控 (每 ${this.config.intervals.healthCheck} 分鐘)`);
        
        // 立即執行一次
        this.performHealthCheck();
        
        // 設定定期執行
        setInterval(() => {
            this.performHealthCheck();
        }, this.config.intervals.healthCheck * 60 * 1000);
    }

    async performHealthCheck() {
        console.log('🔍 執行健康檢查...');
        
        const results = [];
        
        for (const target of this.config.targets) {
            try {
                const startTime = Date.now();
                const response = await axios.get(target.url + '/api/health', {
                    timeout: target.timeout
                });
                const responseTime = Date.now() - startTime;
                
                const result = {
                    target: target.name,
                    url: target.url,
                    status: 'up',
                    responseTime: responseTime,
                    statusCode: response.status,
                    timestamp: new Date().toISOString()
                };
                
                results.push(result);
                this.updateUptimeData(target.name, true, responseTime);
                
                console.log(`✅ ${target.name}: ${responseTime}ms`);
                
            } catch (error) {
                const result = {
                    target: target.name,
                    url: target.url,
                    status: 'down',
                    responseTime: null,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
                
                results.push(result);
                this.updateUptimeData(target.name, false, null);
                
                console.log(`❌ ${target.name}: ${error.message}`);
                
                // 如果不是可選的目標，發送告警
                if (!target.optional) {
                    await this.sendAlert('health', `服務異常: ${target.name} - ${error.message}`);
                }
            }
        }
        
        // 記錄健康檢查結果
        this.logMonitoringData('health-check', results);
        
        return results;
    }

    startPerformanceMonitoring() {
        console.log(`📈 啟動效能監控 (每 ${this.config.intervals.performanceCheck} 分鐘)`);
        
        setInterval(() => {
            this.performPerformanceCheck();
        }, this.config.intervals.performanceCheck * 60 * 1000);
    }

    async performPerformanceCheck() {
        console.log('📊 執行效能檢查...');
        
        const results = [];
        
        for (const target of this.config.targets) {
            try {
                // 測試多個端點的回應時間
                const endpoints = [
                    '/api/health',
                    '/api/auth/validate',
                    '/api/employees',
                    '/api/attendance/stats'
                ];
                
                const targetResults = {
                    target: target.name,
                    url: target.url,
                    timestamp: new Date().toISOString(),
                    endpoints: []
                };
                
                for (const endpoint of endpoints) {
                    try {
                        const startTime = Date.now();
                        await axios.get(target.url + endpoint, {
                            timeout: target.timeout,
                            headers: {
                                'Authorization': 'Bearer test-token' // 可能需要有效的測試token
                            }
                        });
                        const responseTime = Date.now() - startTime;
                        
                        targetResults.endpoints.push({
                            path: endpoint,
                            responseTime: responseTime,
                            status: 'success'
                        });
                        
                        // 檢查是否超過閾值
                        if (responseTime > this.config.thresholds.responseTime) {
                            await this.sendAlert('performance', 
                                `回應時間過慢: ${target.name}${endpoint} - ${responseTime}ms`);
                        }
                        
                    } catch (error) {
                        targetResults.endpoints.push({
                            path: endpoint,
                            error: error.message,
                            status: 'failed'
                        });
                    }
                }
                
                results.push(targetResults);
                
            } catch (error) {
                console.log(`❌ ${target.name} 效能檢查失敗:`, error.message);
            }
        }
        
        this.logMonitoringData('performance-check', results);
        return results;
    }

    startSystemMonitoring() {
        console.log(`🖥️ 啟動系統監控 (每 ${this.config.intervals.systemCheck} 分鐘)`);
        
        setInterval(() => {
            this.performSystemCheck();
        }, this.config.intervals.systemCheck * 60 * 1000);
    }

    async performSystemCheck() {
        console.log('🔧 執行系統檢查...');
        
        const systemMetrics = {
            timestamp: new Date().toISOString(),
            node: {
                version: process.version,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage()
            },
            system: {}
        };
        
        try {
            // 嘗試獲取系統資訊 (在支持的平台上)
            if (process.platform !== 'win32') {
                systemMetrics.system.loadAverage = require('os').loadavg();
                systemMetrics.system.freeMemory = require('os').freemem();
                systemMetrics.system.totalMemory = require('os').totalmem();
            }
            
            // 檢查磁碟空間
            systemMetrics.system.diskSpace = this.checkDiskSpace();
            
        } catch (error) {
            console.log('⚠️ 系統指標收集部分失敗:', error.message);
        }
        
        this.monitoringData.systemMetrics.push(systemMetrics);
        this.logMonitoringData('system-check', systemMetrics);
        
        return systemMetrics;
    }

    checkDiskSpace() {
        try {
            // 簡單的磁碟空間檢查
            const stats = fs.statSync(path.join(__dirname, '..'));
            return {
                available: true,
                size: stats.size || 'unknown'
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }

    startReportGeneration() {
        console.log(`📋 啟動報告生成 (每 ${this.config.intervals.reportGeneration} 分鐘)`);
        
        setInterval(() => {
            this.generateMonitoringReport();
        }, this.config.intervals.reportGeneration * 60 * 1000);
    }

    async generateMonitoringReport() {
        console.log('📊 生成監控報告...');
        
        const report = {
            timestamp: new Date().toISOString(),
            period: `Last ${this.config.intervals.reportGeneration} minutes`,
            summary: this.calculateSummaryMetrics(),
            targets: this.calculateTargetMetrics(),
            alerts: this.getRecentAlerts(60), // 過去1小時的告警
            recommendations: this.generateRecommendations()
        };
        
        // 保存報告
        const reportPath = path.join(__dirname, '..', 'monitoring', 'reports', 
            `monitoring-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // 生成HTML報告
        const htmlReport = this.generateHTMLReport(report);
        const htmlPath = path.join(__dirname, '..', 'monitoring', 'reports', 
            `monitoring-report-${Date.now()}.html`);
        fs.writeFileSync(htmlPath, htmlReport);
        
        console.log(`✅ 監控報告已生成: ${reportPath}`);
        
        return report;
    }

    calculateSummaryMetrics() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        let totalChecks = 0;
        let successfulChecks = 0;
        let totalResponseTime = 0;
        let responseTimeCount = 0;
        
        for (const [target, data] of this.monitoringData.uptime.entries()) {
            const recentData = data.filter(d => (now - new Date(d.timestamp).getTime()) < oneHour);
            totalChecks += recentData.length;
            successfulChecks += recentData.filter(d => d.status === 'up').length;
            
            for (const d of recentData) {
                if (d.responseTime) {
                    totalResponseTime += d.responseTime;
                    responseTimeCount++;
                }
            }
        }
        
        return {
            uptime: totalChecks > 0 ? (successfulChecks / totalChecks * 100).toFixed(2) + '%' : '0%',
            averageResponseTime: responseTimeCount > 0 ? 
                Math.round(totalResponseTime / responseTimeCount) + 'ms' : 'N/A',
            totalChecks: totalChecks,
            successfulChecks: successfulChecks,
            failedChecks: totalChecks - successfulChecks
        };
    }

    calculateTargetMetrics() {
        const metrics = {};
        
        for (const [target, data] of this.monitoringData.uptime.entries()) {
            const recentData = data.slice(-20); // 最近20次檢查
            
            if (recentData.length > 0) {
                const successful = recentData.filter(d => d.status === 'up').length;
                const avgResponseTime = recentData
                    .filter(d => d.responseTime)
                    .reduce((sum, d, _, arr) => sum + d.responseTime / arr.length, 0);
                
                metrics[target] = {
                    uptime: (successful / recentData.length * 100).toFixed(2) + '%',
                    averageResponseTime: Math.round(avgResponseTime) + 'ms',
                    lastCheck: recentData[recentData.length - 1].timestamp,
                    status: recentData[recentData.length - 1].status
                };
            }
        }
        
        return metrics;
    }

    getRecentAlerts(minutes) {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        return this.monitoringData.alerts.filter(alert => 
            new Date(alert.timestamp).getTime() > cutoff
        );
    }

    generateRecommendations() {
        const recommendations = [];
        
        // 基於監控數據生成建議
        const summary = this.calculateSummaryMetrics();
        
        if (parseFloat(summary.uptime) < this.config.thresholds.uptime) {
            recommendations.push({
                type: 'uptime',
                severity: 'high',
                message: `服務可用性低於閾值 (${summary.uptime} < ${this.config.thresholds.uptime}%)`
            });
        }
        
        if (parseInt(summary.averageResponseTime) > this.config.thresholds.responseTime) {
            recommendations.push({
                type: 'performance',
                severity: 'medium',
                message: `平均回應時間過慢 (${summary.averageResponseTime} > ${this.config.thresholds.responseTime}ms)`
            });
        }
        
        return recommendations;
    }

    generateHTMLReport(report) {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>系統監控報告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
        .metric { background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .alert { background: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; margin: 5px 0; border-radius: 5px; }
        .success { color: #28a745; } .warning { color: #ffc107; } .danger { color: #dc3545; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🖥️ 系統監控報告</h1>
            <p class="timestamp">生成時間: ${report.timestamp}</p>
            <p>監控週期: ${report.period}</p>
        </div>
        
        <div class="section">
            <h2>📊 總體指標</h2>
            <div class="metric">
                <strong>服務可用性:</strong> <span class="${parseFloat(report.summary.uptime) > 95 ? 'success' : 'danger'}">${report.summary.uptime}</span>
            </div>
            <div class="metric">
                <strong>平均回應時間:</strong> <span class="${parseInt(report.summary.averageResponseTime) < 1000 ? 'success' : 'warning'}">${report.summary.averageResponseTime}</span>
            </div>
            <div class="metric">
                <strong>檢查統計:</strong> ${report.summary.totalChecks} 次檢查 (成功: ${report.summary.successfulChecks}, 失敗: ${report.summary.failedChecks})
            </div>
        </div>
        
        <div class="section">
            <h2>🎯 目標狀態</h2>
            ${Object.entries(report.targets).map(([target, metrics]) => `
                <div class="metric">
                    <h4>${target}</h4>
                    <p>可用性: <span class="${parseFloat(metrics.uptime) > 95 ? 'success' : 'danger'}">${metrics.uptime}</span></p>
                    <p>回應時間: ${metrics.averageResponseTime}</p>
                    <p>最後檢查: ${metrics.lastCheck}</p>
                    <p>狀態: <span class="${metrics.status === 'up' ? 'success' : 'danger'}">${metrics.status}</span></p>
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2>🚨 最近告警</h2>
            ${report.alerts.length === 0 ? '<p class="success">無告警記錄</p>' : 
                report.alerts.map(alert => `
                    <div class="alert">
                        <strong>${alert.type}:</strong> ${alert.message}
                        <span class="timestamp">(${alert.timestamp})</span>
                    </div>
                `).join('')}
        </div>
        
        <div class="section">
            <h2>💡 建議</h2>
            ${report.recommendations.length === 0 ? '<p class="success">系統運行正常，無特別建議</p>' :
                report.recommendations.map(rec => `
                    <div class="metric">
                        <strong class="${rec.severity === 'high' ? 'danger' : 'warning'}">${rec.type}:</strong> ${rec.message}
                    </div>
                `).join('')}
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #6c757d;">
            <p>🤖 Generated by GClaude Enterprise Monitoring System</p>
        </div>
    </div>
</body>
</html>`;
    }

    updateUptimeData(target, isUp, responseTime) {
        if (!this.monitoringData.uptime.has(target)) {
            this.monitoringData.uptime.set(target, []);
        }
        
        const data = this.monitoringData.uptime.get(target);
        data.push({
            timestamp: new Date().toISOString(),
            status: isUp ? 'up' : 'down',
            responseTime: responseTime
        });
        
        // 保留最近100條記錄
        if (data.length > 100) {
            data.splice(0, data.length - 100);
        }
    }

    async sendAlert(type, message) {
        const alert = {
            type: type,
            message: message,
            timestamp: new Date().toISOString(),
            sent: false
        };
        
        this.monitoringData.alerts.push(alert);
        
        // 發送Telegram告警
        if (this.config.alerts.telegram.enabled) {
            try {
                const telegramMessage = `🚨 系統告警\n\n類型: ${type}\n訊息: ${message}\n時間: ${alert.timestamp}`;
                
                const url = `https://api.telegram.org/bot${this.config.alerts.telegram.botToken}/sendMessage`;
                await axios.post(url, {
                    chat_id: this.config.alerts.telegram.chatId,
                    text: telegramMessage,
                    parse_mode: 'HTML'
                });
                
                alert.sent = true;
                console.log('📱 告警通知已發送');
                
            } catch (error) {
                console.error('❌ 告警通知發送失敗:', error.message);
            }
        }
    }

    logMonitoringData(type, data) {
        const logDir = path.join(__dirname, '..', 'monitoring', 'logs');
        const logFile = path.join(logDir, `${type}-${new Date().toISOString().split('T')[0]}.json`);
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: type,
            data: data
        };
        
        // 讀取現有日誌或創建新的
        let logs = [];
        if (fs.existsSync(logFile)) {
            try {
                const content = fs.readFileSync(logFile, 'utf8');
                logs = JSON.parse(content);
            } catch (error) {
                logs = [];
            }
        }
        
        logs.push(logEntry);
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    }

    async stopMonitoring() {
        console.log('🛑 停止監控系統...');
        this.isMonitoring = false;
        // 這裡可以清理定時器等資源
        console.log('✅ 監控系統已停止');
    }

    getMonitoringStatus() {
        return {
            isMonitoring: this.isMonitoring,
            targets: this.config.targets.length,
            alerts: this.monitoringData.alerts.length,
            uptime: this.calculateSummaryMetrics()
        };
    }
}

async function startMonitoring() {
    const monitor = new MonitoringAlertingSystem();
    return await monitor.startMonitoring();
}

if (require.main === module) {
    startMonitoring()
        .then(status => {
            console.log('\n🎉 監控和告警系統已啟動！');
            console.log(`📊 監控目標: ${status.targets} 個`);
            console.log('💡 系統將持續監控並在異常時發送告警');
        })
        .catch(console.error);
}

module.exports = MonitoringAlertingSystem;