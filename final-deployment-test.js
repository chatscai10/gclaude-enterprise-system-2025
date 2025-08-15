/**
 * 最終部署測試 - 端到端真實環境驗證
 * 模擬真實用戶場景和部署流程
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class FinalDeploymentTest {
    constructor() {
        this.browser = null;
        this.testResults = {
            scenarios: [],
            deploymentChecks: [],
            performanceMetrics: {},
            securityChecks: [],
            summary: {}
        };
    }

    async initialize() {
        console.log('🚀 啟動最終部署測試...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized'],
            devtools: false
        });
    }

    // 測試場景1: 完整的員工工作流程
    async testEmployeeWorkflow() {
        console.log('\n📝 測試場景1: 員工工作流程');
        
        const page = await this.browser.newPage();
        const scenario = { name: '員工工作流程', steps: [], success: true };
        
        try {
            // 步驟1: 員工登入
            await page.goto('http://localhost:3007', { waitUntil: 'networkidle2' });
            await page.type('#username', 'employee');
            await page.type('#password', 'employee123');
            await page.click('#loginBtn');
            await page.waitForTimeout(3000);
            
            scenario.steps.push({ step: '員工登入', success: page.url().includes('dashboard') });
            
            // 步驟2: GPS打卡
            const attendanceLink = await page.$('a[data-section="attendance"]');
            if (attendanceLink) {
                await attendanceLink.click();
                await page.waitForTimeout(1000);
                
                const clockInBtn = await page.$('button[onclick*="gpsClockIn"]');
                if (clockInBtn) {
                    scenario.steps.push({ step: 'GPS打卡功能', success: true });
                } else {
                    scenario.steps.push({ step: 'GPS打卡功能', success: false });
                }
            }
            
            // 步驟3: 查看庫存
            const inventoryLink = await page.$('a[data-section="inventory"]');
            if (inventoryLink) {
                await inventoryLink.click();
                await page.waitForTimeout(1000);
                
                const inventoryTable = await page.$('#inventory-section table');
                scenario.steps.push({ step: '查看庫存', success: !!inventoryTable });
            }
            
            // 步驟4: 提交叫貨申請
            const orderBtn = await page.$('button[data-bs-target="#orderModal"]');
            if (orderBtn) {
                await orderBtn.click();
                await page.waitForTimeout(1000);
                
                const modal = await page.$('#orderModal.show');
                scenario.steps.push({ step: '叫貨申請', success: !!modal });
                
                if (modal) {
                    await page.click('#orderModal .btn-secondary');
                    await page.waitForTimeout(500);
                }
            }
            
        } catch (error) {
            scenario.success = false;
            scenario.error = error.message;
        } finally {
            await page.close();
        }
        
        this.testResults.scenarios.push(scenario);
        console.log(`  結果: ${scenario.success ? '✅ 成功' : '❌ 失敗'}`);
    }

    // 測試場景2: 管理員營運流程
    async testManagerWorkflow() {
        console.log('\n📝 測試場景2: 管理員營運流程');
        
        const page = await this.browser.newPage();
        const scenario = { name: '管理員營運流程', steps: [], success: true };
        
        try {
            // 步驟1: 管理員登入
            await page.goto('http://localhost:3007', { waitUntil: 'networkidle2' });
            await page.type('#username', 'admin');
            await page.type('#password', 'admin123');
            await page.click('#loginBtn');
            await page.waitForTimeout(3000);
            
            scenario.steps.push({ step: '管理員登入', success: page.url().includes('admin') });
            
            // 步驟2: 查看員工管理
            const employeeLink = await page.$('a[data-section="employees"]');
            if (employeeLink) {
                await employeeLink.click();
                await page.waitForTimeout(1000);
                
                const employeeTable = await page.$('#employees-section table');
                scenario.steps.push({ step: '員工管理', success: !!employeeTable });
                
                // 測試編輯員工
                const editBtn = await page.$('button[onclick*="editEmployee"]');
                if (editBtn) {
                    await editBtn.click();
                    await page.waitForTimeout(2000);
                    
                    const editModal = await page.evaluate(() => {
                        const modal = document.getElementById('editEmployeeModal');
                        return modal && modal.classList.contains('show');
                    });
                    
                    scenario.steps.push({ step: '編輯員工', success: editModal });
                    
                    if (editModal) {
                        await page.click('#editEmployeeModal .btn-secondary');
                        await page.waitForTimeout(500);
                    }
                }
            }
            
            // 步驟3: 營收管理
            const revenueLink = await page.$('a[data-section="revenue"]');
            if (revenueLink) {
                await revenueLink.click();
                await page.waitForTimeout(1000);
                
                const addRevenueBtn = await page.$('button[data-bs-target="#addRevenueModal"]');
                if (addRevenueBtn) {
                    await addRevenueBtn.click();
                    await page.waitForTimeout(1000);
                    
                    // 測試新的營收輸入格式
                    const onSiteSalesInput = await page.$('#onSiteSales');
                    const storeSelect = await page.$('#revenueStore');
                    
                    scenario.steps.push({ 
                        step: '營收輸入新格式', 
                        success: !!(onSiteSalesInput && storeSelect) 
                    });
                    
                    await page.click('#addRevenueModal .btn-secondary');
                    await page.waitForTimeout(500);
                }
            }
            
            // 步驟4: 系統報告
            const reportsLink = await page.$('a[data-section="reports"]');
            if (reportsLink) {
                await reportsLink.click();
                await page.waitForTimeout(1000);
                
                const reportsSection = await page.$('#reports-section');
                scenario.steps.push({ step: '系統報告', success: !!reportsSection });
            }
            
        } catch (error) {
            scenario.success = false;
            scenario.error = error.message;
        } finally {
            await page.close();
        }
        
        this.testResults.scenarios.push(scenario);
        console.log(`  結果: ${scenario.success ? '✅ 成功' : '❌ 失敗'}`);
    }

    // 部署檢查
    async performDeploymentChecks() {
        console.log('\n🔍 執行部署檢查...');
        
        const checks = [
            { name: '生產配置文件', check: () => fs.existsSync('./production-configs/.env.production') },
            { name: 'PM2配置文件', check: () => fs.existsSync('./production-configs/ecosystem.config.js') },
            { name: 'Nginx配置文件', check: () => fs.existsSync('./production-configs/nginx.conf') },
            { name: 'Docker配置文件', check: () => fs.existsSync('./production-configs/Dockerfile') },
            { name: '部署腳本', check: () => fs.existsSync('./production-configs/deploy.sh') },
            { name: '監控腳本', check: () => fs.existsSync('./production-configs/monitor.sh') },
            { name: '備份腳本', check: () => fs.existsSync('./production-configs/backup.sh') },
            { name: '一鍵部署腳本', check: () => fs.existsSync('./deployment-scripts/one-click-deploy.sh') },
            { name: '數據庫文件', check: () => fs.existsSync('./data/enterprise.db') },
            { name: 'Telegram通知模組', check: () => fs.existsSync('./modules/telegram-notifications.js') }
        ];
        
        for (const check of checks) {
            try {
                const result = check.check();
                this.testResults.deploymentChecks.push({
                    name: check.name,
                    success: result
                });
                console.log(`  ${check.name}: ${result ? '✅' : '❌'}`);
            } catch (error) {
                this.testResults.deploymentChecks.push({
                    name: check.name,
                    success: false,
                    error: error.message
                });
                console.log(`  ${check.name}: ❌ (${error.message})`);
            }
        }
    }

    // 性能測試
    async performanceTest() {
        console.log('\n⚡ 執行性能測試...');
        
        const page = await this.browser.newPage();
        
        try {
            // 測試頁面載入時間
            const startTime = Date.now();
            await page.goto('http://localhost:3007', { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;
            
            this.testResults.performanceMetrics.pageLoadTime = loadTime;
            console.log(`  頁面載入時間: ${loadTime}ms`);
            
            // 測試登入性能
            const loginStartTime = Date.now();
            await page.type('#username', 'admin');
            await page.type('#password', 'admin123');
            await page.click('#loginBtn');
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            const loginTime = Date.now() - loginStartTime;
            
            this.testResults.performanceMetrics.loginTime = loginTime;
            console.log(`  登入時間: ${loginTime}ms`);
            
            // 測試API響應時間
            const apiStartTime = Date.now();
            const response = await page.evaluate(async () => {
                const token = localStorage.getItem('authToken');
                const response = await fetch('/api/employees/stats/overview', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                return response.ok;
            });
            const apiTime = Date.now() - apiStartTime;
            
            this.testResults.performanceMetrics.apiResponseTime = apiTime;
            console.log(`  API響應時間: ${apiTime}ms`);
            
        } catch (error) {
            console.log(`  ❌ 性能測試錯誤: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    // 安全檢查
    async securityChecks() {
        console.log('\n🔒 執行安全檢查...');
        
        const page = await this.browser.newPage();
        
        try {
            await page.goto('http://localhost:3007', { waitUntil: 'networkidle2' });
            
            // 檢查HTTPS重定向 (在生產環境中)
            const isHTTPS = page.url().startsWith('https://');
            this.testResults.securityChecks.push({
                name: 'HTTPS使用',
                success: isHTTPS || page.url().includes('localhost'),
                note: isHTTPS ? 'HTTPS已啟用' : '本地測試環境'
            });
            
            // 檢查安全標頭
            const response = await page.goto('http://localhost:3007');
            const headers = response.headers();
            
            const securityHeaders = [
                'x-frame-options',
                'x-content-type-options',
                'x-xss-protection'
            ];
            
            securityHeaders.forEach(header => {
                this.testResults.securityChecks.push({
                    name: `安全標頭: ${header}`,
                    success: !!headers[header],
                    value: headers[header] || '未設置'
                });
            });
            
            // 檢查未授權訪問
            await page.evaluate(() => localStorage.removeItem('authToken'));
            await page.goto('http://localhost:3007/admin', { waitUntil: 'networkidle2' });
            
            const redirectedToLogin = page.url().includes('login') || page.url() === 'http://localhost:3007/';
            this.testResults.securityChecks.push({
                name: '未授權訪問保護',
                success: redirectedToLogin
            });
            
        } catch (error) {
            console.log(`  ❌ 安全檢查錯誤: ${error.message}`);
        } finally {
            await page.close();
        }
        
        this.testResults.securityChecks.forEach(check => {
            console.log(`  ${check.name}: ${check.success ? '✅' : '❌'} ${check.note || check.value || ''}`);
        });
    }

    // 生成最終報告
    generateFinalReport() {
        console.log('\n📊 生成最終測試報告...');
        
        const scenariosPassed = this.testResults.scenarios.filter(s => s.success).length;
        const deploymentChecksPassed = this.testResults.deploymentChecks.filter(c => c.success).length;
        const securityChecksPassed = this.testResults.securityChecks.filter(c => c.success).length;
        
        this.testResults.summary = {
            scenarios: {
                total: this.testResults.scenarios.length,
                passed: scenariosPassed,
                successRate: `${((scenariosPassed / this.testResults.scenarios.length) * 100).toFixed(2)}%`
            },
            deploymentChecks: {
                total: this.testResults.deploymentChecks.length,
                passed: deploymentChecksPassed,
                successRate: `${((deploymentChecksPassed / this.testResults.deploymentChecks.length) * 100).toFixed(2)}%`
            },
            securityChecks: {
                total: this.testResults.securityChecks.length,
                passed: securityChecksPassed,
                successRate: `${((securityChecksPassed / this.testResults.securityChecks.length) * 100).toFixed(2)}%`
            },
            overallStatus: (scenariosPassed === this.testResults.scenarios.length && 
                           deploymentChecksPassed === this.testResults.deploymentChecks.length &&
                           securityChecksPassed >= this.testResults.securityChecks.length * 0.8) ? 'READY' : 'NEEDS_ATTENTION'
        };

        // 保存報告
        const reportPath = path.join(__dirname, 'final-deployment-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
        
        // 顯示總結
        console.log('\n📋 最終測試總結:');
        console.log('=====================================');
        console.log(`🎯 用戶場景測試: ${scenariosPassed}/${this.testResults.scenarios.length} (${this.testResults.summary.scenarios.successRate})`);
        console.log(`📦 部署配置檢查: ${deploymentChecksPassed}/${this.testResults.deploymentChecks.length} (${this.testResults.summary.deploymentChecks.successRate})`);
        console.log(`🔒 安全檢查: ${securityChecksPassed}/${this.testResults.securityChecks.length} (${this.testResults.summary.securityChecks.successRate})`);
        
        console.log(`\n⚡ 性能指標:`);
        if (this.testResults.performanceMetrics.pageLoadTime) {
            console.log(`   頁面載入: ${this.testResults.performanceMetrics.pageLoadTime}ms`);
        }
        if (this.testResults.performanceMetrics.loginTime) {
            console.log(`   登入時間: ${this.testResults.performanceMetrics.loginTime}ms`);
        }
        if (this.testResults.performanceMetrics.apiResponseTime) {
            console.log(`   API響應: ${this.testResults.performanceMetrics.apiResponseTime}ms`);
        }
        
        console.log(`\n🎉 整體狀態: ${this.testResults.summary.overallStatus === 'READY' ? '✅ 準備部署' : '⚠️ 需要關注'}`);
        
        if (this.testResults.summary.overallStatus === 'READY') {
            console.log('\n🚀 系統已準備好進行生產部署！');
            console.log('\n📋 部署建議:');
            console.log('1. 使用 ./deployment-scripts/one-click-deploy.sh 進行部署');
            console.log('2. 確保修改所有預設密碼');
            console.log('3. 配置 SSL 憑證');
            console.log('4. 設定定期備份');
            console.log('5. 配置監控和警報');
        } else {
            console.log('\n⚠️ 發現一些問題需要修復：');
            
            this.testResults.scenarios.forEach(scenario => {
                if (!scenario.success) {
                    console.log(`   - 用戶場景"${scenario.name}"失敗`);
                }
            });
            
            this.testResults.deploymentChecks.forEach(check => {
                if (!check.success) {
                    console.log(`   - 部署檢查"${check.name}"失敗`);
                }
            });
        }
        
        console.log(`\n📄 詳細報告已保存至: ${reportPath}`);
        
        return this.testResults.summary.overallStatus === 'READY';
    }

    async run() {
        await this.initialize();
        
        try {
            await this.testEmployeeWorkflow();
            await this.testManagerWorkflow();
            await this.performDeploymentChecks();
            await this.performanceTest();
            await this.securityChecks();
            
            const isReady = this.generateFinalReport();
            
            console.log('\n⏳ 瀏覽器將保持開啟30秒供最終檢查...');
            await new Promise(resolve => setTimeout(resolve, 30000));
            
            return isReady;
            
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

if (require.main === module) {
    const test = new FinalDeploymentTest();
    test.run().catch(console.error);
}

module.exports = FinalDeploymentTest;