/**
 * 監控系統啟動腳本
 * 提供便捷的監控系統啟動和管理功能
 */

const MonitoringAlertingSystem = require('./monitoring-alerting-system');
const MonitoringDashboard = require('./monitoring-dashboard');
const MonitoringConfigManager = require('./monitoring-config');

class MonitoringSystemManager {
    constructor() {
        this.configManager = new MonitoringConfigManager();
        this.monitoringSystem = null;
        this.dashboard = null;
        this.isRunning = false;
    }

    async startAll() {
        console.log('🚀 啟動完整監控系統...\n');

        try {
            // 1. 驗證配置
            console.log('📋 驗證監控配置...');
            const validation = this.configManager.validateConfig();
            if (!validation.valid) {
                console.log('⚠️ 配置驗證警告:');
                validation.errors.forEach(error => console.log(`  - ${error}`));
                console.log('💡 系統將使用預設配置繼續運行\n');
            } else {
                console.log('✅ 監控配置驗證通過\n');
            }

            // 2. 啟動監控系統 (後台運行)
            console.log('📊 啟動監控和告警系統...');
            this.monitoringSystem = new MonitoringAlertingSystem();
            
            // 更新配置
            const config = this.configManager.getConfig();
            this.monitoringSystem.config.targets = this.configManager.getEnabledTargets();
            this.monitoringSystem.config.thresholds = config.thresholds;
            this.monitoringSystem.config.alerts = config.alerting;
            this.monitoringSystem.config.intervals = config.intervals;

            // 啟動監控 (非阻塞)
            setTimeout(async () => {
                try {
                    await this.monitoringSystem.startMonitoring();
                    console.log('✅ 監控系統已在後台啟動');
                } catch (error) {
                    console.error('❌ 監控系統啟動失敗:', error.message);
                }
            }, 1000);

            // 3. 啟動監控儀表板
            console.log('🖥️ 啟動監控儀表板...');
            this.dashboard = new MonitoringDashboard(config.dashboard.port);
            await this.dashboard.start();

            this.isRunning = true;

            console.log('\n🎉 監控系統啟動完成！');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📊 監控儀表板: http://localhost:${config.dashboard.port}`);
            console.log(`🎯 監控目標: ${this.configManager.getEnabledTargets().length} 個`);
            console.log(`⏰ 健康檢查間隔: ${config.intervals.healthCheck} 分鐘`);
            console.log(`📱 Telegram 告警: ${config.alerting.telegram.enabled ? '啟用' : '停用'}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('\n💡 使用說明:');
            console.log('  - 按 Ctrl+C 停止監控系統');
            console.log('  - 訪問儀表板查看即時監控數據');
            console.log('  - 告警將自動發送到 Telegram 群組');

            return {
                status: 'running',
                dashboard: `http://localhost:${config.dashboard.port}`,
                targets: this.configManager.getEnabledTargets().length,
                config: config
            };

        } catch (error) {
            console.error('❌ 監控系統啟動失敗:', error.message);
            throw error;
        }
    }

    async stop() {
        console.log('\n🛑 停止監控系統...');

        try {
            if (this.monitoringSystem) {
                await this.monitoringSystem.stopMonitoring();
                console.log('✅ 監控系統已停止');
            }

            if (this.dashboard) {
                await this.dashboard.stop();
                console.log('✅ 監控儀表板已停止');
            }

            this.isRunning = false;
            console.log('🎉 監控系統已完全停止');

        } catch (error) {
            console.error('❌ 停止監控系統時發生錯誤:', error.message);
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            targets: this.configManager.getEnabledTargets().length,
            configValid: this.configManager.validateConfig().valid,
            dashboard: this.dashboard ? `http://localhost:${this.configManager.getConfig().dashboard.port}` : null
        };
    }
}

// 優雅關閉處理
let systemManager = null;

process.on('SIGINT', async () => {
    console.log('\n\n📡 接收到停止信號，正在優雅關閉...');
    
    if (systemManager) {
        await systemManager.stop();
    }
    
    console.log('👋 再見！');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n📡 接收到終止信號，正在優雅關閉...');
    
    if (systemManager) {
        await systemManager.stop();
    }
    
    process.exit(0);
});

// 主函數
async function main() {
    systemManager = new MonitoringSystemManager();
    
    try {
        await systemManager.startAll();
        
        // 保持運行
        console.log('\n⏳ 監控系統正在運行中...');
        console.log('   按 Ctrl+C 停止系統\n');
        
        // 定期顯示狀態
        setInterval(() => {
            const status = systemManager.getStatus();
            const timestamp = new Date().toLocaleString('zh-TW');
            console.log(`[${timestamp}] 📊 監控狀態: ${status.isRunning ? '運行中' : '已停止'} | 目標: ${status.targets} 個`);
        }, 300000); // 每5分鐘顯示一次

    } catch (error) {
        console.error('❌ 啟動失敗:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = MonitoringSystemManager;