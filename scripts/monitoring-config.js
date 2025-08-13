/**
 * 監控系統配置管理器
 * 提供監控系統的配置管理、閾值設定、告警規則配置等功能
 */

const fs = require('fs');
const path = require('path');

class MonitoringConfigManager {
    constructor() {
        this.configPath = path.join(__dirname, '..', 'monitoring', 'config');
        this.defaultConfig = this.getDefaultConfig();
        this.currentConfig = null;
        
        this.ensureConfigDirectory();
        this.loadConfig();
    }

    getDefaultConfig() {
        return {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            
            // 監控目標配置
            targets: {
                production: [
                    {
                        name: 'Railway Production',
                        url: 'https://gclaude-enterprise.railway.app',
                        type: 'web',
                        timeout: 10000,
                        enabled: true,
                        priority: 'high',
                        tags: ['production', 'web', 'railway']
                    },
                    {
                        name: 'Render Production',
                        url: 'https://gclaude-enterprise.onrender.com',
                        type: 'web',
                        timeout: 10000,
                        enabled: true,
                        priority: 'high',
                        tags: ['production', 'web', 'render']
                    }
                ],
                staging: [
                    {
                        name: 'Staging Environment',
                        url: 'https://gclaude-enterprise-staging.herokuapp.com',
                        type: 'web',
                        timeout: 10000,
                        enabled: false,
                        priority: 'medium',
                        tags: ['staging', 'web']
                    }
                ],
                development: [
                    {
                        name: 'Local Development',
                        url: 'http://localhost:3007',
                        type: 'web',
                        timeout: 5000,
                        enabled: false,
                        priority: 'low',
                        tags: ['development', 'local']
                    }
                ]
            },
            
            // 監控間隔設定 (分鐘)
            intervals: {
                healthCheck: 5,        // 健康檢查
                performanceCheck: 15,  // 效能檢查
                systemCheck: 30,       // 系統檢查
                reportGeneration: 60,  // 報告生成
                alertCooldown: 10      // 告警冷卻時間
            },
            
            // 監控閾值設定
            thresholds: {
                // 回應時間閾值 (毫秒)
                responseTime: {
                    warning: 1500,
                    critical: 3000
                },
                
                // 錯誤率閾值 (百分比)
                errorRate: {
                    warning: 3,
                    critical: 10
                },
                
                // 可用性閾值 (百分比)
                uptime: {
                    warning: 98,
                    critical: 95
                },
                
                // 系統資源閾值 (百分比)
                system: {
                    memoryUsage: {
                        warning: 80,
                        critical: 90
                    },
                    cpuUsage: {
                        warning: 70,
                        critical: 85
                    },
                    diskUsage: {
                        warning: 80,
                        critical: 90
                    }
                }
            },
            
            // 告警配置
            alerting: {
                // Telegram 告警
                telegram: {
                    enabled: true,
                    botToken: '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc',
                    chatId: '-1002658082392',
                    silentHours: {
                        enabled: false,
                        start: '22:00',
                        end: '08:00',
                        timezone: 'Asia/Taipei'
                    }
                },
                
                // 郵件告警 (未實現)
                email: {
                    enabled: false,
                    smtp: {
                        host: 'smtp.example.com',
                        port: 587,
                        secure: false,
                        auth: {
                            user: '',
                            pass: ''
                        }
                    },
                    recipients: []
                },
                
                // Webhook 告警
                webhook: {
                    enabled: false,
                    urls: [],
                    timeout: 5000,
                    retryCount: 3
                }
            },
            
            // 告警規則
            alertRules: [
                {
                    name: 'Service Down',
                    condition: 'target_status == "down"',
                    severity: 'critical',
                    cooldown: 5, // 分鐘
                    enabled: true,
                    description: '服務無法訪問時觸發'
                },
                {
                    name: 'High Response Time',
                    condition: 'response_time > thresholds.responseTime.critical',
                    severity: 'warning',
                    cooldown: 15,
                    enabled: true,
                    description: '回應時間過長時觸發'
                },
                {
                    name: 'Low Uptime',
                    condition: 'uptime < thresholds.uptime.warning',
                    severity: 'warning',
                    cooldown: 30,
                    enabled: true,
                    description: '可用性低於閾值時觸發'
                },
                {
                    name: 'High Error Rate',
                    condition: 'error_rate > thresholds.errorRate.warning',
                    severity: 'warning',
                    cooldown: 10,
                    enabled: true,
                    description: '錯誤率高於閾值時觸發'
                }
            ],
            
            // 監控數據保留設定
            dataRetention: {
                // 原始監控數據保留時間 (天)
                rawData: 30,
                
                // 彙總數據保留時間 (天)
                aggregatedData: 365,
                
                // 告警記錄保留時間 (天)
                alertHistory: 90,
                
                // 報告保留時間 (天)
                reports: 180
            },
            
            // 監控端點配置
            endpoints: {
                // 要監控的API端點
                healthCheck: '/api/health',
                authentication: '/api/auth/validate',
                userManagement: '/api/employees',
                attendance: '/api/attendance/stats',
                revenue: '/api/revenue/summary'
            },
            
            // 監控儀表板配置
            dashboard: {
                port: 3008,
                refreshInterval: 30, // 秒
                theme: 'light', // light, dark
                charts: {
                    enabled: true,
                    type: 'line', // line, bar, area
                    dataPoints: 50
                }
            }
        };
    }

    ensureConfigDirectory() {
        if (!fs.existsSync(this.configPath)) {
            fs.mkdirSync(this.configPath, { recursive: true });
        }
    }

    loadConfig() {
        const configFile = path.join(this.configPath, 'monitoring-config.json');
        
        try {
            if (fs.existsSync(configFile)) {
                const content = fs.readFileSync(configFile, 'utf8');
                this.currentConfig = { ...this.defaultConfig, ...JSON.parse(content) };
                console.log('✅ 監控配置已載入');
            } else {
                this.currentConfig = { ...this.defaultConfig };
                this.saveConfig();
                console.log('📄 使用預設監控配置並已保存');
            }
        } catch (error) {
            console.error('❌ 載入監控配置失敗:', error.message);
            this.currentConfig = { ...this.defaultConfig };
        }
    }

    saveConfig() {
        const configFile = path.join(this.configPath, 'monitoring-config.json');
        
        try {
            this.currentConfig.lastUpdated = new Date().toISOString();
            fs.writeFileSync(configFile, JSON.stringify(this.currentConfig, null, 2));
            console.log('✅ 監控配置已保存');
            return true;
        } catch (error) {
            console.error('❌ 保存監控配置失敗:', error.message);
            return false;
        }
    }

    getConfig() {
        return this.currentConfig;
    }

    updateConfig(updates) {
        try {
            // 深度合併配置
            this.currentConfig = this.deepMerge(this.currentConfig, updates);
            return this.saveConfig();
        } catch (error) {
            console.error('❌ 更新監控配置失敗:', error.message);
            return false;
        }
    }

    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    // 獲取啟用的監控目標
    getEnabledTargets() {
        const targets = [];
        
        for (const environment in this.currentConfig.targets) {
            const envTargets = this.currentConfig.targets[environment];
            targets.push(...envTargets.filter(target => target.enabled));
        }
        
        return targets;
    }

    // 獲取特定環境的目標
    getTargetsByEnvironment(environment) {
        return this.currentConfig.targets[environment] || [];
    }

    // 更新目標狀態
    updateTargetStatus(targetName, enabled) {
        let updated = false;
        
        for (const environment in this.currentConfig.targets) {
            const targets = this.currentConfig.targets[environment];
            const target = targets.find(t => t.name === targetName);
            
            if (target) {
                target.enabled = enabled;
                updated = true;
                break;
            }
        }
        
        if (updated) {
            return this.saveConfig();
        }
        
        return false;
    }

    // 添加新的監控目標
    addTarget(environment, targetConfig) {
        if (!this.currentConfig.targets[environment]) {
            this.currentConfig.targets[environment] = [];
        }
        
        // 檢查目標是否已存在
        const exists = this.currentConfig.targets[environment].some(
            target => target.name === targetConfig.name || target.url === targetConfig.url
        );
        
        if (!exists) {
            this.currentConfig.targets[environment].push({
                enabled: true,
                priority: 'medium',
                tags: [environment],
                ...targetConfig
            });
            
            return this.saveConfig();
        }
        
        return false;
    }

    // 移除監控目標
    removeTarget(targetName) {
        let removed = false;
        
        for (const environment in this.currentConfig.targets) {
            const targets = this.currentConfig.targets[environment];
            const index = targets.findIndex(t => t.name === targetName);
            
            if (index !== -1) {
                targets.splice(index, 1);
                removed = true;
                break;
            }
        }
        
        if (removed) {
            return this.saveConfig();
        }
        
        return false;
    }

    // 更新閾值設定
    updateThresholds(thresholdUpdates) {
        this.currentConfig.thresholds = { 
            ...this.currentConfig.thresholds, 
            ...thresholdUpdates 
        };
        return this.saveConfig();
    }

    // 更新告警配置
    updateAlertConfig(alertUpdates) {
        this.currentConfig.alerting = { 
            ...this.currentConfig.alerting, 
            ...alertUpdates 
        };
        return this.saveConfig();
    }

    // 獲取告警規則
    getAlertRules() {
        return this.currentConfig.alertRules.filter(rule => rule.enabled);
    }

    // 添加告警規則
    addAlertRule(ruleConfig) {
        const rule = {
            enabled: true,
            cooldown: 10,
            severity: 'warning',
            ...ruleConfig
        };
        
        this.currentConfig.alertRules.push(rule);
        return this.saveConfig();
    }

    // 更新告警規則
    updateAlertRule(ruleName, updates) {
        const rule = this.currentConfig.alertRules.find(r => r.name === ruleName);
        
        if (rule) {
            Object.assign(rule, updates);
            return this.saveConfig();
        }
        
        return false;
    }

    // 驗證配置
    validateConfig() {
        const errors = [];
        
        // 檢查必要的配置
        if (!this.currentConfig.alerting.telegram.botToken) {
            errors.push('Telegram Bot Token 未配置');
        }
        
        if (!this.currentConfig.alerting.telegram.chatId) {
            errors.push('Telegram Chat ID 未配置');
        }
        
        // 檢查監控目標
        const targets = this.getEnabledTargets();
        if (targets.length === 0) {
            errors.push('沒有啟用的監控目標');
        }
        
        // 檢查閾值設定
        const thresholds = this.currentConfig.thresholds;
        if (thresholds.responseTime.warning >= thresholds.responseTime.critical) {
            errors.push('回應時間警告閾值應小於關鍵閾值');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // 重置為預設配置
    resetToDefaults() {
        this.currentConfig = { ...this.defaultConfig };
        return this.saveConfig();
    }

    // 導出配置
    exportConfig(filePath) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(this.currentConfig, null, 2));
            console.log(`✅ 配置已導出至: ${filePath}`);
            return true;
        } catch (error) {
            console.error('❌ 導出配置失敗:', error.message);
            return false;
        }
    }

    // 導入配置
    importConfig(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const importedConfig = JSON.parse(content);
            
            // 驗證導入的配置
            const validation = this.validateImportedConfig(importedConfig);
            if (!validation.valid) {
                console.error('❌ 導入的配置無效:', validation.errors);
                return false;
            }
            
            this.currentConfig = { ...this.defaultConfig, ...importedConfig };
            const saved = this.saveConfig();
            
            if (saved) {
                console.log(`✅ 配置已從 ${filePath} 導入`);
            }
            
            return saved;
            
        } catch (error) {
            console.error('❌ 導入配置失敗:', error.message);
            return false;
        }
    }

    validateImportedConfig(config) {
        const errors = [];
        
        // 基本結構檢查
        const requiredSections = ['targets', 'intervals', 'thresholds', 'alerting'];
        for (const section of requiredSections) {
            if (!config[section]) {
                errors.push(`缺少必要配置段落: ${section}`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// 測試功能
async function testConfigManager() {
    console.log('🧪 測試監控配置管理器...\n');
    
    const configManager = new MonitoringConfigManager();
    
    // 測試配置載入
    console.log('📋 當前配置狀態:');
    console.log(`- 監控目標數量: ${configManager.getEnabledTargets().length}`);
    console.log(`- 告警規則數量: ${configManager.getAlertRules().length}`);
    
    // 測試配置驗證
    const validation = configManager.validateConfig();
    console.log(`\n✅ 配置驗證: ${validation.valid ? '通過' : '失敗'}`);
    if (!validation.valid) {
        console.log('錯誤:', validation.errors);
    }
    
    // 測試添加監控目標
    const newTarget = {
        name: 'Test Target',
        url: 'https://test.example.com',
        type: 'web',
        timeout: 5000
    };
    
    const added = configManager.addTarget('testing', newTarget);
    console.log(`\n📝 添加測試目標: ${added ? '成功' : '失敗'}`);
    
    // 清理測試目標
    configManager.removeTarget('Test Target');
    
    return configManager;
}

if (require.main === module) {
    testConfigManager()
        .then(configManager => {
            console.log('\n🎉 監控配置管理器測試完成！');
        })
        .catch(console.error);
}

module.exports = MonitoringConfigManager;