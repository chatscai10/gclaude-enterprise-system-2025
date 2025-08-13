/**
 * GClaude 企業管理系統深層驗證引擎
 * 基於智慧瀏覽器的全面功能驗證系統
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const IntelligentBrowserVerification = require('./intelligent-browser-verification');
const GClaudeTelegramFlightReporter = require('./gclaude-telegram-flight-reporter');

class GClaudeDeepVerification extends IntelligentBrowserVerification {
    constructor(options = {}) {
        super({
            baseUrl: options.baseUrl || 'http://localhost:3007',
            headless: options.headless !== false,
            timeout: options.timeout || 60000,
            screenshotDir: path.join(__dirname, '..', 'deep-verification-screenshots'),
            reportDir: path.join(__dirname, '..', 'deep-verification-reports'),
            ...options
        });

        // GClaude 特定的測試配置
        this.testUsers = [
            { username: 'admin', password: 'admin123', role: '系統管理員' },
            { username: 'manager', password: 'manager123', role: '店長' },
            { username: 'employee', password: 'employee123', role: '員工' },
            { username: 'intern', password: 'intern123', role: '實習生' }
        ];

        // 功能模組配置
        this.modules = {
            dashboard: { name: '🏢 儀表板', selector: '[data-module="dashboard"], .dashboard-section' },
            employees: { name: '👥 員工管理', selector: '[data-module="employees"], .employees-section' },
            attendance: { name: '⏰ 出勤管理', selector: '[data-module="attendance"], .attendance-section' },
            revenue: { name: '💰 營收分析', selector: '[data-module="revenue"], .revenue-section' },
            inventory: { name: '📦 庫存管理', selector: '[data-module="inventory"], .inventory-section' },
            scheduling: { name: '📅 智慧排程', selector: '[data-module="scheduling"], .scheduling-section' },
            promotion: { name: '🏆 升遷投票', selector: '[data-module="promotion"], .promotion-section' },
            maintenance: { name: '🔧 維修申請', selector: '[data-module="maintenance"], .maintenance-section' },
            reports: { name: '📊 報表系統', selector: '[data-module="reports"], .reports-section' }
        };

        this.deepTestResults = {
            moduleTests: [],
            interactionTests: [],
            permissionTests: [],
            performanceMetrics: [],
            userExperienceScore: 0
        };

        // 初始化 Telegram 飛機彙報系統
        this.flightReporter = new GClaudeTelegramFlightReporter({
            botToken: options.telegramBotToken,
            bossGroupId: options.telegramBossGroupId,
            employeeGroupId: options.telegramEmployeeGroupId
        });

        this.verificationStages = {
            INITIALIZATION: 1,
            BASIC_TESTS: 2,
            MODULE_TESTS: 3,
            INTERACTION_TESTS: 4,
            FINAL_ANALYSIS: 5
        };

        this.currentStage = this.verificationStages.INITIALIZATION;
    }

    async initialize() {
        await super.initialize();
        
        // 設置更詳細的錯誤監聽
        this.page.on('pageerror', error => {
            console.log(`💥 頁面錯誤: ${error.message}`);
            this.results.errors.push({
                type: 'page_error',
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            });
        });

        // 監聽未處理的 Promise 拒絕
        this.page.on('requestfailed', request => {
            console.log(`🚨 請求失敗: ${request.method()} ${request.url()} - ${request.failure().errorText}`);
            this.results.errors.push({
                type: 'request_failed',
                method: request.method(),
                url: request.url(),
                error: request.failure().errorText,
                timestamp: Date.now()
            });
        });

        // 測試 Telegram 連接
        console.log('🔗 測試 Telegram 飛機彙報系統連接...');
        try {
            const connected = await this.flightReporter.testConnection();
            if (connected) {
                console.log('✅ Telegram 飛機彙報系統連接成功');
            } else {
                console.log('⚠️ Telegram 飛機彙報系統連接失敗，將僅記錄本地報告');
            }
        } catch (error) {
            console.log(`⚠️ Telegram 連接測試失敗: ${error.message}`);
        }

        console.log('✅ GClaude 深層驗證引擎初始化完成');
    }

    // 深度登入並進入管理系統
    async deepLogin(user) {
        return await this.runTest(`深度登入測試: ${user.role} (${user.username})`, async (test) => {
            // 訪問登入頁面
            await this.page.goto(this.config.baseUrl, { waitUntil: 'networkidle0' });
            test.steps.push('訪問登入頁面');

            // 等待登入表單載入
            await this.page.waitForSelector('#username, input[name="username"]', { timeout: 10000 });
            await this.page.waitForSelector('#password, input[name="password"]', { timeout: 10000 });

            // 清除現有輸入並填寫新資料
            await this.page.click('#username, input[name="username"]', { clickCount: 3 });
            await this.page.type('#username, input[name="username"]', user.username);
            
            await this.page.click('#password, input[name="password"]', { clickCount: 3 });
            await this.page.type('#password, input[name="password"]', user.password);

            test.steps.push('表單填寫完成');
            await this.takeScreenshot(`deep-login-form-${user.username}`, `${user.role}登入表單`);

            // 提交表單
            await this.page.click('#loginBtn, button[type="submit"], .login-btn');
            test.steps.push('提交登入表單');

            // 等待登入完成
            try {
                await this.page.waitForFunction(() => {
                    return window.location.href !== window.location.origin + '/' && 
                           !document.body.textContent.includes('登入失敗');
                }, { timeout: 15000 });
            } catch (error) {
                await this.takeScreenshot(`deep-login-error-${user.username}`, '登入失敗截圖');
                throw new Error(`登入超時或失敗: ${error.message}`);
            }

            await this.takeScreenshot(`deep-login-success-${user.username}`, `${user.role}登入成功`);
            
            // 檢查是否成功進入管理系統
            const currentUrl = this.page.url();
            const hasMainNavigation = await this.page.$('.nav, .navigation, .sidebar, .menu') !== null;
            
            if (!hasMainNavigation) {
                throw new Error('未找到主導航，可能登入失敗');
            }

            test.steps.push(`成功登入 - URL: ${currentUrl}`);
            test.steps.push(`用戶角色: ${user.role}`);
        });
    }

    // 測試儀表板模組
    async testDashboardModule(user) {
        return await this.runTest(`儀表板模組測試 - ${user.role}`, async (test) => {
            // 尋找儀表板或首頁連結
            const dashboardSelectors = [
                'a[href*="dashboard"]',
                'a:contains("儀表板")',
                'a:contains("首頁")',
                '.nav-item:first-child a',
                '.menu-item:first-child a'
            ];

            let dashboardLink = null;
            for (const selector of dashboardSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 2000 });
                    dashboardLink = await this.page.$(selector);
                    if (dashboardLink) break;
                } catch (e) {
                    continue;
                }
            }

            if (dashboardLink) {
                await dashboardLink.click();
                test.steps.push('點擊儀表板連結');
                await this.page.waitForTimeout(2000);
            }

            await this.takeScreenshot(`dashboard-${user.username}`, `${user.role}的儀表板視圖`);

            // 檢查統計數據載入
            const statsElements = await this.page.$$('.stat, .statistics, .metric, .card, .widget');
            test.steps.push(`找到統計元件數量: ${statsElements.length}`);

            // 檢查圖表載入
            const chartElements = await this.page.$$('canvas, .chart, svg, .graph');
            test.steps.push(`找到圖表元件數量: ${chartElements.length}`);

            // 檢查數據是否載入（非零值）
            const hasData = await this.page.evaluate(() => {
                const elements = document.querySelectorAll('.stat, .statistics, .metric, .number, .value');
                let dataCount = 0;
                elements.forEach(el => {
                    const text = el.textContent.trim();
                    if (text && !isNaN(parseFloat(text)) && parseFloat(text) > 0) {
                        dataCount++;
                    }
                });
                return dataCount > 0;
            });

            test.steps.push(`統計數據載入狀態: ${hasData ? '✅ 有數據' : '⚠️ 無數據或載入中'}`);
        });
    }

    // 測試員工管理模組
    async testEmployeesModule(user) {
        return await this.runTest(`員工管理模組測試 - ${user.role}`, async (test) => {
            // 尋找員工管理連結
            const employeeSelectors = [
                'a[href*="employee"]',
                'a:contains("員工")',
                'a:contains("人事")',
                '.nav-item a[href*="staff"]'
            ];

            let found = false;
            for (const selector of employeeSelectors) {
                try {
                    const link = await this.page.$(selector);
                    if (link) {
                        await link.click();
                        test.steps.push('點擊員工管理連結');
                        await this.page.waitForTimeout(3000);
                        found = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!found) {
                test.steps.push('⚠️ 未找到員工管理連結，可能無權限訪問');
            }

            await this.takeScreenshot(`employees-${user.username}`, `${user.role}的員工管理視圖`);

            // 檢查員工列表
            const employeeList = await this.page.$$('tbody tr, .employee-item, .staff-card');
            test.steps.push(`員工列表項目數量: ${employeeList.length}`);

            // 檢查新增員工按鈕
            const addButton = await this.page.$('button:contains("新增"), .add-btn, .create-btn, [data-action="add"]');
            if (addButton) {
                test.steps.push('✅ 找到新增員工按鈕');
                
                // 測試新增員工表單
                try {
                    await addButton.click();
                    await this.page.waitForTimeout(2000);
                    
                    const modal = await this.page.$('.modal, .dialog, .popup, .form-container');
                    if (modal) {
                        test.steps.push('✅ 新增員工表單已開啟');
                        await this.takeScreenshot(`add-employee-form-${user.username}`, '新增員工表單');
                        
                        // 關閉表單
                        const closeBtn = await this.page.$('.close, .cancel, [data-dismiss="modal"]');
                        if (closeBtn) {
                            await closeBtn.click();
                            await this.page.waitForTimeout(1000);
                        }
                    }
                } catch (error) {
                    test.steps.push(`⚠️ 新增員工表單測試失敗: ${error.message}`);
                }
            } else {
                test.steps.push('⚠️ 未找到新增員工按鈕，可能無權限');
            }
        });
    }

    // 測試出勤管理模組
    async testAttendanceModule(user) {
        return await this.runTest(`出勤管理模組測試 - ${user.role}`, async (test) => {
            // 尋找出勤管理連結
            const attendanceSelectors = [
                'a[href*="attendance"]',
                'a:contains("出勤")',
                'a:contains("打卡")',
                'a:contains("考勤")'
            ];

            let found = false;
            for (const selector of attendanceSelectors) {
                try {
                    const link = await this.page.$(selector);
                    if (link) {
                        await link.click();
                        test.steps.push('點擊出勤管理連結');
                        await this.page.waitForTimeout(3000);
                        found = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!found) {
                test.steps.push('⚠️ 未找到出勤管理連結');
            }

            await this.takeScreenshot(`attendance-${user.username}`, `${user.role}的出勤管理視圖`);

            // 檢查GPS打卡功能
            const clockInBtn = await this.page.$('button:contains("打卡"), .clock-in, .punch-in, [data-action="clock-in"]');
            if (clockInBtn) {
                test.steps.push('✅ 找到打卡按鈕');
                
                // 測試GPS打卡（不實際執行，只檢查功能可用性）
                try {
                    const isEnabled = await this.page.evaluate(btn => !btn.disabled, clockInBtn);
                    test.steps.push(`打卡按鈕狀態: ${isEnabled ? '可用' : '禁用'}`);
                } catch (error) {
                    test.steps.push(`⚠️ 打卡按鈕檢查失敗: ${error.message}`);
                }
            } else {
                test.steps.push('⚠️ 未找到打卡按鈕');
            }

            // 檢查出勤記錄
            const attendanceRecords = await this.page.$$('.attendance-record, tbody tr, .record-item');
            test.steps.push(`出勤記錄數量: ${attendanceRecords.length}`);
        });
    }

    // 測試營收分析模組
    async testRevenueModule(user) {
        return await this.runTest(`營收分析模組測試 - ${user.role}`, async (test) => {
            // 尋找營收分析連結
            const revenueSelectors = [
                'a[href*="revenue"]',
                'a:contains("營收")',
                'a:contains("銷售")',
                'a:contains("收入")'
            ];

            let found = false;
            for (const selector of revenueSelectors) {
                try {
                    const link = await this.page.$(selector);
                    if (link) {
                        await link.click();
                        test.steps.push('點擊營收分析連結');
                        await this.page.waitForTimeout(3000);
                        found = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!found) {
                test.steps.push('⚠️ 未找到營收分析連結');
            }

            await this.takeScreenshot(`revenue-${user.username}`, `${user.role}的營收分析視圖`);

            // 檢查營收統計圖表
            const charts = await this.page.$$('canvas, .chart, svg');
            test.steps.push(`營收圖表數量: ${charts.length}`);

            // 檢查新增營收記錄按鈕
            const addRevenueBtn = await this.page.$('button:contains("新增"), .add-revenue, [data-action="add-revenue"]');
            if (addRevenueBtn) {
                test.steps.push('✅ 找到新增營收記錄按鈕');
            } else {
                test.steps.push('⚠️ 未找到新增營收記錄按鈕');
            }

            // 檢查篩選功能
            const filterElements = await this.page.$$('select, .filter, .date-picker, input[type="date"]');
            test.steps.push(`篩選元件數量: ${filterElements.length}`);
        });
    }

    // 測試庫存管理模組
    async testInventoryModule(user) {
        return await this.runTest(`庫存管理模組測試 - ${user.role}`, async (test) => {
            const inventorySelectors = [
                'a[href*="inventory"]',
                'a:contains("庫存")',
                'a:contains("進貨")',
                'a:contains("商品")'
            ];

            let found = false;
            for (const selector of inventorySelectors) {
                try {
                    const link = await this.page.$(selector);
                    if (link) {
                        await link.click();
                        test.steps.push('點擊庫存管理連結');
                        await this.page.waitForTimeout(3000);
                        found = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!found) {
                test.steps.push('⚠️ 未找到庫存管理連結');
            }

            await this.takeScreenshot(`inventory-${user.username}`, `${user.role}的庫存管理視圖`);

            // 檢查庫存清單
            const inventoryItems = await this.page.$$('.inventory-item, tbody tr, .product-card');
            test.steps.push(`庫存項目數量: ${inventoryItems.length}`);

            // 檢查叫貨功能
            const orderBtn = await this.page.$('button:contains("叫貨"), .order-btn, [data-action="order"]');
            if (orderBtn) {
                test.steps.push('✅ 找到叫貨功能');
            } else {
                test.steps.push('⚠️ 未找到叫貨功能');
            }

            // 檢查新增商品功能
            const addProductBtn = await this.page.$('button:contains("新增商品"), .add-product, [data-action="add-product"]');
            if (addProductBtn) {
                test.steps.push('✅ 找到新增商品功能');
            } else {
                test.steps.push('⚠️ 未找到新增商品功能');
            }
        });
    }

    // 測試智慧排程模組
    async testSchedulingModule(user) {
        return await this.runTest(`智慧排程模組測試 - ${user.role}`, async (test) => {
            const schedulingSelectors = [
                'a[href*="schedule"]',
                'a:contains("排程")',
                'a:contains("排班")',
                'a:contains("班表")'
            ];

            let found = false;
            for (const selector of schedulingSelectors) {
                try {
                    const link = await this.page.$(selector);
                    if (link) {
                        await link.click();
                        test.steps.push('點擊智慧排程連結');
                        await this.page.waitForTimeout(3000);
                        found = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!found) {
                test.steps.push('⚠️ 未找到智慧排程連結');
            }

            await this.takeScreenshot(`scheduling-${user.username}`, `${user.role}的智慧排程視圖`);

            // 檢查排班表
            const scheduleTable = await this.page.$('table, .schedule-grid, .calendar');
            if (scheduleTable) {
                test.steps.push('✅ 找到排班表');
            } else {
                test.steps.push('⚠️ 未找到排班表');
            }

            // 檢查新增排班功能
            const addScheduleBtn = await this.page.$('button:contains("新增排班"), .add-schedule, [data-action="add-schedule"]');
            if (addScheduleBtn) {
                test.steps.push('✅ 找到新增排班功能');
            } else {
                test.steps.push('⚠️ 未找到新增排班功能');
            }
        });
    }

    // 測試升遷投票模組
    async testPromotionModule(user) {
        return await this.runTest(`升遷投票模組測試 - ${user.role}`, async (test) => {
            const promotionSelectors = [
                'a[href*="promotion"]',
                'a:contains("升遷")',
                'a:contains("投票")',
                'a:contains("晉升")'
            ];

            let found = false;
            for (const selector of promotionSelectors) {
                try {
                    const link = await this.page.$(selector);
                    if (link) {
                        await link.click();
                        test.steps.push('點擊升遷投票連結');
                        await this.page.waitForTimeout(3000);
                        found = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!found) {
                test.steps.push('⚠️ 未找到升遷投票連結');
            }

            await this.takeScreenshot(`promotion-${user.username}`, `${user.role}的升遷投票視圖`);

            // 檢查投票列表
            const voteItems = await this.page.$$('.vote-item, .promotion-item, tbody tr');
            test.steps.push(`投票項目數量: ${voteItems.length}`);

            // 檢查發起投票功能
            const createVoteBtn = await this.page.$('button:contains("發起投票"), .create-vote, [data-action="create-vote"]');
            if (createVoteBtn) {
                test.steps.push('✅ 找到發起投票功能');
            } else {
                test.steps.push('⚠️ 未找到發起投票功能');
            }
        });
    }

    // 測試維修申請模組
    async testMaintenanceModule(user) {
        return await this.runTest(`維修申請模組測試 - ${user.role}`, async (test) => {
            const maintenanceSelectors = [
                'a[href*="maintenance"]',
                'a:contains("維修")',
                'a:contains("報修")',
                'a:contains("設備")'
            ];

            let found = false;
            for (const selector of maintenanceSelectors) {
                try {
                    const link = await this.page.$(selector);
                    if (link) {
                        await link.click();
                        test.steps.push('點擊維修申請連結');
                        await this.page.waitForTimeout(3000);
                        found = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!found) {
                test.steps.push('⚠️ 未找到維修申請連結');
            }

            await this.takeScreenshot(`maintenance-${user.username}`, `${user.role}的維修申請視圖`);

            // 檢查維修記錄列表
            const maintenanceRecords = await this.page.$$('.maintenance-record, tbody tr, .request-item');
            test.steps.push(`維修記錄數量: ${maintenanceRecords.length}`);

            // 檢查提交申請功能
            const submitBtn = await this.page.$('button:contains("提交申請"), .submit-request, [data-action="submit"]');
            if (submitBtn) {
                test.steps.push('✅ 找到提交申請功能');
            } else {
                test.steps.push('⚠️ 未找到提交申請功能');
            }
        });
    }

    // 測試報表系統模組
    async testReportsModule(user) {
        return await this.runTest(`報表系統模組測試 - ${user.role}`, async (test) => {
            const reportSelectors = [
                'a[href*="report"]',
                'a:contains("報表")',
                'a:contains("統計")',
                'a:contains("分析")'
            ];

            let found = false;
            for (const selector of reportSelectors) {
                try {
                    const link = await this.page.$(selector);
                    if (link) {
                        await link.click();
                        test.steps.push('點擊報表系統連結');
                        await this.page.waitForTimeout(3000);
                        found = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!found) {
                test.steps.push('⚠️ 未找到報表系統連結');
            }

            await this.takeScreenshot(`reports-${user.username}`, `${user.role}的報表系統視圖`);

            // 檢查報表選項
            const reportOptions = await this.page.$$('.report-option, .report-type, select option');
            test.steps.push(`報表選項數量: ${reportOptions.length}`);

            // 檢查報表生成功能
            const generateBtn = await this.page.$('button:contains("生成"), .generate-report, [data-action="generate"]');
            if (generateBtn) {
                test.steps.push('✅ 找到報表生成功能');
            } else {
                test.steps.push('⚠️ 未找到報表生成功能');
            }
        });
    }

    // 測試響應式設計
    async testResponsiveDesign() {
        return await this.runTest('深度響應式設計測試', async (test) => {
            const devices = [
                { name: 'Desktop', width: 1920, height: 1080, description: '桌面版本' },
                { name: 'Laptop', width: 1366, height: 768, description: '筆記型電腦' },
                { name: 'Tablet', width: 768, height: 1024, description: '平板版本' },
                { name: 'Mobile', width: 375, height: 667, description: '手機版本' },
                { name: 'Small-Mobile', width: 320, height: 568, description: '小尺寸手機' }
            ];

            for (const device of devices) {
                await this.page.setViewport({ 
                    width: device.width, 
                    height: device.height,
                    isMobile: device.width <= 768
                });
                
                await this.page.reload({ waitUntil: 'networkidle0' });
                await this.takeScreenshot(`responsive-${device.name}`, device.description);
                
                // 檢查導航選單在小螢幕上的行為
                if (device.width <= 768) {
                    const mobileMenu = await this.page.$('.mobile-menu, .hamburger, .menu-toggle, .navbar-toggle');
                    if (mobileMenu) {
                        test.steps.push(`${device.name}: ✅ 找到移動版選單`);
                    } else {
                        test.steps.push(`${device.name}: ⚠️ 未找到移動版選單`);
                    }
                }
                
                test.steps.push(`${device.description} 視圖測試完成 (${device.width}x${device.height})`);
            }

            // 恢復桌面視圖
            await this.page.setViewport({ width: 1920, height: 1080 });
        });
    }

    // 測試選單導航
    async testNavigationMenu(user) {
        return await this.runTest(`選單導航測試 - ${user.role}`, async (test) => {
            // 找到所有導航連結
            const navLinks = await this.page.$$('.nav a, .navigation a, .sidebar a, .menu a');
            test.steps.push(`找到導航連結數量: ${navLinks.length}`);

            let clickableLinks = 0;
            let workingLinks = 0;

            for (let i = 0; i < Math.min(navLinks.length, 10); i++) { // 限制最多測試10個連結
                try {
                    const link = navLinks[i];
                    const href = await this.page.evaluate(el => el.href, link);
                    const text = await this.page.evaluate(el => el.textContent.trim(), link);
                    
                    if (href && text && !text.includes('登出')) {
                        clickableLinks++;
                        
                        // 點擊連結
                        await link.click();
                        await this.page.waitForTimeout(2000);
                        
                        const currentUrl = this.page.url();
                        if (currentUrl !== href) {
                            workingLinks++;
                            test.steps.push(`✅ "${text}" 連結正常工作`);
                        } else {
                            test.steps.push(`⚠️ "${text}" 連結可能無反應`);
                        }
                    }
                } catch (error) {
                    test.steps.push(`❌ 導航連結測試失敗: ${error.message}`);
                }
            }

            test.steps.push(`可點擊連結: ${clickableLinks}, 正常工作: ${workingLinks}`);
            await this.takeScreenshot(`navigation-test-${user.username}`, `${user.role}導航測試結果`);
        });
    }

    // 發送階段飛機彙報
    async sendStageReport(stage, stageData = {}) {
        try {
            const stageNames = {
                1: '初始化與連接測試',
                2: '基礎系統驗證',
                3: '功能模組深度測試',
                4: '交互與導航測試', 
                5: '最終分析與報告'
            };

            const reportData = {
                stage,
                stageName: stageNames[stage] || `階段 ${stage}`,
                testResults: {
                    passed: this.results.tests.filter(t => t.status === 'passed').length,
                    failed: this.results.tests.filter(t => t.status === 'failed').length,
                    successRate: this.results.tests.length > 0 ? 
                        Math.round((this.results.tests.filter(t => t.status === 'passed').length / this.results.tests.length) * 100) : 0
                },
                systemHealth: {
                    stabilityScore: this.calculateStabilityScore(),
                    errorCount: this.results.errors.length
                },
                recommendations: this.generateCurrentRecommendations(),
                screenshots: this.results.screenshots.slice(-10), // 最新10張截圖
                executionTime: Date.now() - this.results.startTime,
                ...stageData
            };

            await this.flightReporter.sendFlightReport(reportData);
            console.log(`✈️ 階段 ${stage} 飛機彙報已發送`);
            
        } catch (error) {
            console.log(`⚠️ 階段 ${stage} 飛機彙報發送失敗: ${error.message}`);
        }
    }

    // 計算系統穩定性評分
    calculateStabilityScore() {
        const totalTests = this.results.tests.length;
        const passedTests = this.results.tests.filter(t => t.status === 'passed').length;
        const errorWeight = Math.min(this.results.errors.length * 5, 30); // 錯誤最多扣30分
        
        const baseScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        return Math.max(0, Math.round(baseScore - errorWeight));
    }

    // 生成當前建議
    generateCurrentRecommendations() {
        const recommendations = [];
        const failedTests = this.results.tests.filter(t => t.status === 'failed');
        
        if (failedTests.length > 0) {
            recommendations.push({ 
                title: `修復 ${failedTests.length} 個失敗的測試項目`,
                priority: 'high'
            });
        }
        
        if (this.results.errors.length > 5) {
            recommendations.push({
                title: `處理 ${this.results.errors.length} 個系統錯誤`,
                priority: 'high'
            });
        }

        const slowTests = this.results.tests.filter(t => t.duration > 15000);
        if (slowTests.length > 0) {
            recommendations.push({
                title: `優化 ${slowTests.length} 個緩慢操作的效能`,
                priority: 'medium'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({ 
                title: '系統運行穩定，繼續監控',
                priority: 'low'
            });
        }

        return recommendations.slice(0, 5); // 最多5個建議
    }

    // 執行完整的深度驗證
    async runDeepVerification() {
        console.log('\n🚀 開始執行 GClaude 企業管理系統深度驗證...');

        try {
            await this.initialize();

            // 階段一：基礎系統驗證
            console.log('\n📋 階段一：基礎系統驗證');
            this.currentStage = this.verificationStages.BASIC_TESTS;
            
            await this.testHomePage();
            await this.testAPIHealthCheck();
            
            // 發送階段一彙報
            await this.sendStageReport(this.verificationStages.BASIC_TESTS, {
                description: '完成基礎系統連接與健康檢查'
            });

            // 階段二：多用戶深度登入測試
            console.log('\n👥 階段二：多用戶深度登入測試');
            this.currentStage = this.verificationStages.MODULE_TESTS;
            
            let processedUsers = 0;
            for (const user of this.testUsers) {
                try {
                    await this.deepLogin(user);
                    
                    // 階段三：功能模組驗證
                    console.log(`\n🔍 階段三：${user.role}功能模組驗證`);
                    await this.testDashboardModule(user);
                    await this.testEmployeesModule(user);
                    await this.testAttendanceModule(user);
                    await this.testRevenueModule(user);
                    await this.testInventoryModule(user);
                    await this.testSchedulingModule(user);
                    await this.testPromotionModule(user);
                    await this.testMaintenanceModule(user);
                    await this.testReportsModule(user);

                    // 階段四：導航測試
                    console.log(`\n🧭 階段四：${user.role}導航測試`);
                    await this.testNavigationMenu(user);

                    processedUsers++;
                    
                    // 每完成一個用戶測試發送進度彙報
                    if (processedUsers % 2 === 0 || processedUsers === this.testUsers.length) {
                        await this.sendStageReport(this.verificationStages.MODULE_TESTS, {
                            description: `完成 ${processedUsers}/${this.testUsers.length} 個用戶角色的功能測試`,
                            currentUser: user.role,
                            progress: Math.round((processedUsers / this.testUsers.length) * 100)
                        });
                    }

                    // 登出
                    try {
                        const logoutBtn = await this.page.$('a:contains("登出"), .logout, [data-action="logout"]');
                        if (logoutBtn) {
                            await logoutBtn.click();
                            await this.page.waitForTimeout(2000);
                        } else {
                            // 清除 cookies 強制登出
                            await this.page.deleteCookie(...(await this.page.cookies()));
                        }
                    } catch (error) {
                        console.log(`⚠️ 登出過程中出現問題: ${error.message}`);
                        await this.page.deleteCookie(...(await this.page.cookies()));
                    }

                } catch (error) {
                    console.log(`❌ ${user.role}測試過程中發生錯誤: ${error.message}`);
                }
            }

            // 階段五：響應式設計測試
            console.log('\n📱 階段五：響應式設計測試');
            this.currentStage = this.verificationStages.INTERACTION_TESTS;
            await this.testResponsiveDesign();
            
            // 發送交互測試彙報
            await this.sendStageReport(this.verificationStages.INTERACTION_TESTS, {
                description: '完成響應式設計與交互功能驗證'
            });

            // 生成深度報告
            console.log('\n📊 生成深度驗證報告...');
            this.currentStage = this.verificationStages.FINAL_ANALYSIS;
            const report = await this.generateReport();
            
            // 發送最終分析彙報
            await this.sendStageReport(this.verificationStages.FINAL_ANALYSIS, {
                description: '完成所有驗證測試，生成最終分析報告',
                finalReport: {
                    totalTests: report.results.summary.totalTests,
                    passedTests: report.results.summary.passedTests,
                    failedTests: report.results.summary.failedTests,
                    totalDuration: report.results.summary.totalDuration,
                    stabilityScore: report.deepAnalysis?.systemStability?.overallStabilityScore || 0
                }
            });

            return report;

        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    // 重寫報告生成方法，增加 GClaude 特定的分析
    async generateReport() {
        const report = await super.generateReport();
        
        // 增加深度分析
        report.deepAnalysis = {
            moduleTestResults: this.analyzeModuleTests(),
            userRoleAnalysis: this.analyzeUserRoles(),
            systemStability: this.analyzeSystemStability(),
            recommendedImprovements: this.generateImprovements()
        };

        return report;
    }

    analyzeModuleTests() {
        const modules = ['dashboard', 'employees', 'attendance', 'revenue', 'inventory', 'scheduling', 'promotion', 'maintenance', 'reports'];
        const analysis = {};

        modules.forEach(module => {
            const moduleTests = this.results.tests.filter(test => 
                test.name.toLowerCase().includes(module) || 
                test.name.includes(this.modules[module]?.name)
            );
            
            analysis[module] = {
                totalTests: moduleTests.length,
                passedTests: moduleTests.filter(t => t.status === 'passed').length,
                failedTests: moduleTests.filter(t => t.status === 'failed').length,
                averageTestTime: moduleTests.reduce((sum, t) => sum + (t.duration || 0), 0) / moduleTests.length || 0
            };
        });

        return analysis;
    }

    analyzeUserRoles() {
        const roleAnalysis = {};
        
        this.testUsers.forEach(user => {
            const userTests = this.results.tests.filter(test => test.name.includes(user.username) || test.name.includes(user.role));
            
            roleAnalysis[user.role] = {
                username: user.username,
                totalTests: userTests.length,
                passedTests: userTests.filter(t => t.status === 'passed').length,
                failedTests: userTests.filter(t => t.status === 'failed').length,
                averageTestTime: userTests.reduce((sum, t) => sum + (t.duration || 0), 0) / userTests.length || 0
            };
        });

        return roleAnalysis;
    }

    analyzeSystemStability() {
        const totalTests = this.results.tests.length;
        const passedTests = this.results.tests.filter(t => t.status === 'passed').length;
        const errorCount = this.results.errors.length;
        
        const stabilityScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        
        return {
            overallStabilityScore: Math.round(stabilityScore * 100) / 100,
            totalErrors: errorCount,
            criticalIssues: this.results.tests.filter(t => t.status === 'failed' && t.name.includes('登入')).length,
            performanceIssues: this.results.tests.filter(t => t.duration > 15000).length
        };
    }

    generateImprovements() {
        const improvements = [];
        
        // 基於測試結果生成改進建議
        const failedTests = this.results.tests.filter(t => t.status === 'failed');
        
        if (failedTests.length > 0) {
            improvements.push({
                type: 'critical',
                title: '修復失敗的核心功能',
                description: `有 ${failedTests.length} 個測試失敗，需要立即處理`,
                priority: 'high',
                affectedModules: failedTests.map(t => t.name)
            });
        }

        if (this.results.errors.length > 5) {
            improvements.push({
                type: 'stability',
                title: '改善系統穩定性',
                description: `系統產生了 ${this.results.errors.length} 個錯誤，建議進行錯誤處理優化`,
                priority: 'high'
            });
        }

        const slowTests = this.results.tests.filter(t => t.duration > 10000);
        if (slowTests.length > 0) {
            improvements.push({
                type: 'performance',
                title: '優化系統效能',
                description: `有 ${slowTests.length} 個操作響應時間超過10秒，建議進行效能優化`,
                priority: 'medium',
                affectedOperations: slowTests.map(t => t.name)
            });
        }

        return improvements;
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    const verification = new GClaudeDeepVerification({
        baseUrl: process.env.BASE_URL || 'http://localhost:3007',
        headless: process.env.HEADLESS !== 'false'
    });

    verification.runDeepVerification()
        .then(report => {
            console.log('\n✨ GClaude 企業管理系統深度驗證完成!');
            console.log('\n📊 深度驗證結果摘要:');
            console.log(`   總測試數: ${report.results.summary.totalTests}`);
            console.log(`   通過測試: ${report.results.summary.passedTests} ✅`);
            console.log(`   失敗測試: ${report.results.summary.failedTests} ❌`);
            console.log(`   系統穩定性評分: ${report.deepAnalysis?.systemStability?.overallStabilityScore || 0}%`);
            console.log(`   總耗時: ${Math.round(report.results.summary.totalDuration / 1000)}秒`);
            console.log(`   截圖數量: ${report.results.summary.totalScreenshots}`);

            if (report.results.summary.failedTests === 0) {
                console.log('\n🎉 所有深度驗證測試都通過了!');
                process.exit(0);
            } else {
                console.log('\n⚠️  有測試失敗，請查看詳細報告了解問題');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 深度驗證過程中發生嚴重錯誤:', error.message);
            console.error(error.stack);
            process.exit(1);
        });
}

module.exports = GClaudeDeepVerification;