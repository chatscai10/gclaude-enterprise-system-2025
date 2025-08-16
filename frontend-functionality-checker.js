const fs = require('fs');
const path = require('path');

class FrontendFunctionalityChecker {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            employeePage: {
                sections: [],
                buttons: [],
                dataBinding: [],
                modals: [],
                issues: []
            },
            adminPage: {
                sections: [],
                buttons: [],
                dataBinding: [],
                modals: [],
                issues: []
            },
            summary: {
                totalIssues: 0,
                criticalIssues: 0,
                minorIssues: 0,
                successRate: 0
            }
        };
    }

    readFileContent(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            console.error(`無法讀取檔案: ${filePath}`, error.message);
            return '';
        }
    }

    // 檢查員工頁面功能
    checkEmployeePage() {
        console.log('🔍 開始檢查員工頁面功能...');
        
        const employeePagePath = path.join(__dirname, 'public', 'unified-employee-dashboard.html');
        const content = this.readFileContent(employeePagePath);
        
        if (!content) {
            this.results.employeePage.issues.push({
                type: 'critical',
                component: 'file',
                message: '員工頁面檔案不存在或無法讀取'
            });
            return;
        }

        // 檢查核心區段
        this.checkEmployeeSections(content);
        // 檢查按鈕功能
        this.checkEmployeeButtons(content);
        // 檢查數據綁定
        this.checkEmployeeDataBinding(content);
        // 檢查動態視窗
        this.checkEmployeeModals(content);
    }

    checkEmployeeSections(content) {
        const requiredSections = [
            { id: 'attendance', name: '打卡系統', required: true },
            { id: 'revenue', name: '營收系統', required: true },
            { id: 'orders', name: '叫貨系統', required: true },
            { id: 'schedule', name: '排班系統', required: true },
            { id: 'promotion', name: '升遷投票', required: true },
            { id: 'maintenance', name: '維修保養', required: true }
        ];

        requiredSections.forEach(section => {
            const sectionRegex = new RegExp(`id="${section.id}".*?class="section-content"`, 's');
            const exists = sectionRegex.test(content);
            
            this.results.employeePage.sections.push({
                id: section.id,
                name: section.name,
                exists: exists,
                required: section.required
            });

            if (section.required && !exists) {
                this.results.employeePage.issues.push({
                    type: 'critical',
                    component: 'section',
                    message: `缺少必要區段: ${section.name} (#${section.id})`
                });
            }
        });

        console.log(`✅ 員工頁面區段檢查完成: ${this.results.employeePage.sections.length} 個區段`);
    }

    checkEmployeeButtons(content) {
        const requiredButtons = [
            { id: 'clockInBtn', name: '上班打卡按鈕', function: 'handleClockIn' },
            { id: 'clockOutBtn', name: '下班打卡按鈕', function: 'handleClockOut' },
            { id: 'submitRevenueBtn', name: '提交營收按鈕', function: 'submitRevenue' },
            { id: 'submitOrderBtn', name: '提交叫貨按鈕', function: 'submitOrder' },
            { id: 'enterScheduleBtn', name: '進入排班按鈕', function: 'enterScheduleSystem' },
            { id: 'submitMaintenanceBtn', name: '提交維修按鈕', function: 'submitMaintenance' }
        ];

        requiredButtons.forEach(button => {
            const buttonExists = content.includes(`id="${button.id}"`);
            const functionExists = content.includes(`function ${button.function}`) || 
                                 content.includes(`${button.function}(`);

            this.results.employeePage.buttons.push({
                id: button.id,
                name: button.name,
                exists: buttonExists,
                functionExists: functionExists,
                function: button.function
            });

            if (!buttonExists) {
                this.results.employeePage.issues.push({
                    type: 'critical',
                    component: 'button',
                    message: `缺少按鈕: ${button.name} (#${button.id})`
                });
            }

            if (!functionExists) {
                this.results.employeePage.issues.push({
                    type: 'critical',
                    component: 'function',
                    message: `缺少按鈕功能: ${button.function} for ${button.name}`
                });
            }
        });

        console.log(`✅ 員工頁面按鈕檢查完成: ${requiredButtons.length} 個按鈕`);
    }

    checkEmployeeDataBinding(content) {
        const dataBindings = [
            { id: 'currentTime', name: '當前時間顯示', required: true },
            { id: 'workingHours', name: '工作時數顯示', required: true },
            { id: 'attendanceRecords', name: '打卡記錄容器', required: true },
            { id: 'revenueHistory', name: '營收記錄容器', required: false },
            { id: 'orderHistory', name: '叫貨記錄容器', required: false },
            { id: 'scheduleCalendar', name: '排班月曆容器', required: true }
        ];

        dataBindings.forEach(binding => {
            const exists = content.includes(`id="${binding.id}"`);
            
            this.results.employeePage.dataBinding.push({
                id: binding.id,
                name: binding.name,
                exists: exists,
                required: binding.required
            });

            if (binding.required && !exists) {
                this.results.employeePage.issues.push({
                    type: 'minor',
                    component: 'data-binding',
                    message: `缺少數據綁定容器: ${binding.name} (#${binding.id})`
                });
            }
        });

        console.log(`✅ 員工頁面數據綁定檢查完成: ${dataBindings.length} 個綁定點`);
    }

    checkEmployeeModals(content) {
        const modalPatterns = [
            { pattern: /modal.*fade.*order/gi, name: '叫貨操作動態視窗' },
            { pattern: /modal.*fade.*revenue/gi, name: '營收操作動態視窗' },
            { pattern: /modal.*fade.*schedule/gi, name: '排班操作動態視窗' },
            { pattern: /modal.*fade.*maintenance/gi, name: '維修操作動態視窗' }
        ];

        modalPatterns.forEach(modal => {
            const exists = modal.pattern.test(content);
            
            this.results.employeePage.modals.push({
                name: modal.name,
                exists: exists,
                pattern: modal.pattern.source
            });

            if (!exists) {
                this.results.employeePage.issues.push({
                    type: 'minor',
                    component: 'modal',
                    message: `建議添加動態視窗: ${modal.name}`
                });
            }
        });

        console.log(`✅ 員工頁面動態視窗檢查完成: ${modalPatterns.length} 個視窗檢查`);
    }

    // 檢查管理員頁面功能
    checkAdminPage() {
        console.log('🔍 開始檢查管理員頁面功能...');
        
        const adminPagePath = path.join(__dirname, 'public', 'unified-admin-dashboard.html');
        const content = this.readFileContent(adminPagePath);
        
        if (!content) {
            this.results.adminPage.issues.push({
                type: 'critical',
                component: 'file',
                message: '管理員頁面檔案不存在或無法讀取'
            });
            return;
        }

        // 檢查核心區段
        this.checkAdminSections(content);
        // 檢查按鈕功能
        this.checkAdminButtons(content);
        // 檢查數據綁定
        this.checkAdminDataBinding(content);
        // 檢查動態視窗
        this.checkAdminModals(content);
    }

    checkAdminSections(content) {
        const requiredSections = [
            { id: 'dashboard', name: '管理總覽', required: true },
            { id: 'employees', name: '員工管理', required: true },
            { id: 'stores', name: '分店管理', required: true },
            { id: 'attendance', name: '出勤管理', required: true },
            { id: 'revenue', name: '營收分析', required: true },
            { id: 'maintenance', name: '維修管理', required: true },
            { id: 'orders', name: '叫貨管理', required: true },
            { id: 'promotions', name: '升遷管理', required: true },
            { id: 'scheduling', name: '排班管理', required: true },
            { id: 'settings', name: '系統設定', required: true }
        ];

        requiredSections.forEach(section => {
            const sectionRegex = new RegExp(`id="${section.id}".*?class="section-content"`, 's');
            const exists = sectionRegex.test(content);
            
            this.results.adminPage.sections.push({
                id: section.id,
                name: section.name,
                exists: exists,
                required: section.required
            });

            if (section.required && !exists) {
                this.results.adminPage.issues.push({
                    type: 'critical',
                    component: 'section',
                    message: `缺少必要區段: ${section.name} (#${section.id})`
                });
            }
        });

        console.log(`✅ 管理員頁面區段檢查完成: ${this.results.adminPage.sections.length} 個區段`);
    }

    checkAdminButtons(content) {
        const requiredButtons = [
            { pattern: /loadEmployees|loadAllEmployees/g, name: '載入員工資料功能' },
            { pattern: /loadStores|loadAllStores/g, name: '載入分店資料功能' },
            { pattern: /loadAttendance|loadAllAttendance/g, name: '載入出勤資料功能' },
            { pattern: /loadRevenue|loadAllRevenue/g, name: '載入營收資料功能' },
            { pattern: /loadScheduling|loadSchedulingCalendar/g, name: '載入排班資料功能' },
            { pattern: /saveSettings|updateSettings/g, name: '儲存設定功能' }
        ];

        requiredButtons.forEach(button => {
            const exists = button.pattern.test(content);
            
            this.results.adminPage.buttons.push({
                name: button.name,
                exists: exists,
                pattern: button.pattern.source
            });

            if (!exists) {
                this.results.adminPage.issues.push({
                    type: 'critical',
                    component: 'function',
                    message: `缺少管理功能: ${button.name}`
                });
            }
        });

        console.log(`✅ 管理員頁面按鈕檢查完成: ${requiredButtons.length} 個功能`);
    }

    checkAdminDataBinding(content) {
        const dataBindings = [
            { id: 'employeesTable', name: '員工資料表格', required: true },
            { id: 'storesTable', name: '分店資料表格', required: true },
            { id: 'attendanceTable', name: '出勤資料表格', required: true },
            { id: 'revenueTable', name: '營收資料表格', required: true },
            { id: 'schedulingCalendar', name: '排班月曆', required: true },
            { id: 'systemStats', name: '系統統計資料', required: false }
        ];

        dataBindings.forEach(binding => {
            const exists = content.includes(`id="${binding.id}"`);
            
            this.results.adminPage.dataBinding.push({
                id: binding.id,
                name: binding.name,
                exists: exists,
                required: binding.required
            });

            if (binding.required && !exists) {
                this.results.adminPage.issues.push({
                    type: 'minor',
                    component: 'data-binding',
                    message: `缺少數據容器: ${binding.name} (#${binding.id})`
                });
            }
        });

        console.log(`✅ 管理員頁面數據綁定檢查完成: ${dataBindings.length} 個綁定點`);
    }

    checkAdminModals(content) {
        const modalPatterns = [
            { pattern: /modal.*employee.*edit/gi, name: '員工編輯動態視窗' },
            { pattern: /modal.*store.*edit/gi, name: '分店編輯動態視窗' },
            { pattern: /modal.*revenue.*approve/gi, name: '營收審核動態視窗' },
            { pattern: /modal.*maintenance.*update/gi, name: '維修更新動態視窗' },
            { pattern: /modal.*schedule.*assign/gi, name: '排班分配動態視窗' }
        ];

        modalPatterns.forEach(modal => {
            const exists = modal.pattern.test(content);
            
            this.results.adminPage.modals.push({
                name: modal.name,
                exists: exists,
                pattern: modal.pattern.source
            });

            if (!exists) {
                this.results.adminPage.issues.push({
                    type: 'minor',
                    component: 'modal',
                    message: `建議添加動態視窗: ${modal.name}`
                });
            }
        });

        console.log(`✅ 管理員頁面動態視窗檢查完成: ${modalPatterns.length} 個視窗檢查`);
    }

    calculateSummary() {
        const allIssues = [...this.results.employeePage.issues, ...this.results.adminPage.issues];
        
        this.results.summary.totalIssues = allIssues.length;
        this.results.summary.criticalIssues = allIssues.filter(issue => issue.type === 'critical').length;
        this.results.summary.minorIssues = allIssues.filter(issue => issue.type === 'minor').length;
        
        const totalChecks = 
            this.results.employeePage.sections.length + 
            this.results.employeePage.buttons.length + 
            this.results.adminPage.sections.length + 
            this.results.adminPage.buttons.length;
            
        const passedChecks = totalChecks - this.results.summary.criticalIssues;
        this.results.summary.successRate = Math.round((passedChecks / totalChecks) * 100);
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 前端功能完整性檢查報告');
        console.log('='.repeat(60));
        
        // 員工頁面報告
        console.log('\n🧑‍💼 員工頁面檢查結果:');
        console.log(`   📋 區段: ${this.results.employeePage.sections.filter(s => s.exists).length}/${this.results.employeePage.sections.length} 完成`);
        console.log(`   🔘 按鈕: ${this.results.employeePage.buttons.filter(b => b.exists && b.functionExists).length}/${this.results.employeePage.buttons.length} 功能正常`);
        console.log(`   📊 數據綁定: ${this.results.employeePage.dataBinding.filter(d => d.exists).length}/${this.results.employeePage.dataBinding.length} 已實現`);
        console.log(`   🗨️ 動態視窗: ${this.results.employeePage.modals.filter(m => m.exists).length}/${this.results.employeePage.modals.length} 已實現`);
        
        // 管理員頁面報告
        console.log('\n👨‍💼 管理員頁面檢查結果:');
        console.log(`   📋 區段: ${this.results.adminPage.sections.filter(s => s.exists).length}/${this.results.adminPage.sections.length} 完成`);
        console.log(`   🔘 按鈕: ${this.results.adminPage.buttons.filter(b => b.exists).length}/${this.results.adminPage.buttons.length} 功能正常`);
        console.log(`   📊 數據綁定: ${this.results.adminPage.dataBinding.filter(d => d.exists).length}/${this.results.adminPage.dataBinding.length} 已實現`);
        console.log(`   🗨️ 動態視窗: ${this.results.adminPage.modals.filter(m => m.exists).length}/${this.results.adminPage.modals.length} 已實現`);
        
        // 總結報告
        console.log('\n📈 總體檢查結果:');
        console.log(`   ✅ 成功率: ${this.results.summary.successRate}%`);
        console.log(`   🚨 嚴重問題: ${this.results.summary.criticalIssues} 個`);
        console.log(`   ⚠️ 輕微問題: ${this.results.summary.minorIssues} 個`);
        console.log(`   📊 總問題數: ${this.results.summary.totalIssues} 個`);

        // 問題詳情
        if (this.results.summary.criticalIssues > 0) {
            console.log('\n🚨 嚴重問題清單:');
            const criticalIssues = [...this.results.employeePage.issues, ...this.results.adminPage.issues]
                .filter(issue => issue.type === 'critical');
            criticalIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. [${issue.component}] ${issue.message}`);
            });
        }

        if (this.results.summary.minorIssues > 0) {
            console.log('\n⚠️ 輕微問題清單:');
            const minorIssues = [...this.results.employeePage.issues, ...this.results.adminPage.issues]
                .filter(issue => issue.type === 'minor');
            minorIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. [${issue.component}] ${issue.message}`);
            });
        }

        console.log('\n🎉 前端功能檢查完成！');
    }

    saveReport() {
        const reportPath = `frontend-functionality-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 詳細報告已保存: ${reportPath}`);
        return reportPath;
    }

    async runFullCheck() {
        console.log('🚀 開始執行前端功能完整性檢查...\n');

        // 檢查員工頁面
        this.checkEmployeePage();
        
        // 檢查管理員頁面  
        this.checkAdminPage();
        
        // 計算總結
        this.calculateSummary();
        
        // 生成報告
        this.generateReport();
        
        // 保存報告
        const reportPath = this.saveReport();
        
        return {
            results: this.results,
            reportPath: reportPath
        };
    }
}

// 執行檢查
if (require.main === module) {
    const checker = new FrontendFunctionalityChecker();
    checker.runFullCheck().catch(console.error);
}

module.exports = FrontendFunctionalityChecker;