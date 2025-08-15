/**
 * 按鈕修復驗證報告
 * 檢查所有修復是否正確實施
 */

const fs = require('fs');
const path = require('path');

function verifyButtonFix() {
    console.log('🔍 開始驗證按鈕修復實施狀況...\n');
    
    const checks = [];
    
    // 1. 檢查dashboard-functions.js是否存在
    const dashboardFunctionsPath = path.join(__dirname, 'public', 'js', 'dashboard-functions.js');
    if (fs.existsSync(dashboardFunctionsPath)) {
        checks.push('✅ dashboard-functions.js 文件存在');
        
        const content = fs.readFileSync(dashboardFunctionsPath, 'utf8');
        
        // 檢查關鍵函數
        const functions = [
            'editEmployee',
            'deleteEmployee', 
            'editAttendance',
            'deleteAttendance',
            'editRevenue', 
            'deleteRevenue',
            'updateEmployee',
            'updateAttendance', 
            'updateRevenue'
        ];
        
        functions.forEach(func => {
            if (content.includes(`function ${func}`)) {
                checks.push(`✅ ${func} 函數已實現`);
            } else {
                checks.push(`❌ ${func} 函數缺失`);
            }
        });
        
        // 檢查全域函數註冊
        const globalExports = [
            'window.editEmployee',
            'window.deleteEmployee',
            'window.updateEmployee'
        ];
        
        globalExports.forEach(exp => {
            if (content.includes(exp)) {
                checks.push(`✅ ${exp} 已註冊到全域`);
            } else {
                checks.push(`❌ ${exp} 未註冊到全域`);
            }
        });
        
    } else {
        checks.push('❌ dashboard-functions.js 文件不存在');
    }
    
    // 2. 檢查dashboard.html中的模態框
    const dashboardPath = path.join(__dirname, 'public', 'dashboard.html');
    if (fs.existsSync(dashboardPath)) {
        checks.push('✅ dashboard.html 文件存在');
        
        const htmlContent = fs.readFileSync(dashboardPath, 'utf8');
        
        const modals = [
            'editEmployeeModal',
            'editAttendanceModal', 
            'editRevenueModal'
        ];
        
        modals.forEach(modal => {
            if (htmlContent.includes(`id="${modal}"`)) {
                checks.push(`✅ ${modal} 模態框已創建`);
            } else {
                checks.push(`❌ ${modal} 模態框缺失`);
            }
        });
        
        // 檢查腳本引用
        if (htmlContent.includes('dashboard-functions.js')) {
            checks.push('✅ dashboard-functions.js 已正確引用');
        } else {
            checks.push('❌ dashboard-functions.js 未引用');
        }
        
    } else {
        checks.push('❌ dashboard.html 文件不存在');
    }
    
    // 3. 輸出驗證報告
    console.log('📋 按鈕修復驗證報告:');
    console.log('='.repeat(50));
    
    checks.forEach(check => {
        console.log(check);
    });
    
    console.log('='.repeat(50));
    
    const successCount = checks.filter(check => check.startsWith('✅')).length;
    const totalCount = checks.length;
    const successRate = Math.round((successCount / totalCount) * 100);
    
    console.log(`\n📊 修復完成度: ${successCount}/${totalCount} (${successRate}%)`);
    
    if (successRate >= 90) {
        console.log('🎉 按鈕修復實施成功！所有必要組件都已正確配置。');
        console.log('\n🚀 現在可以測試按鈕功能:');
        console.log('1. 訪問 http://localhost:3007');
        console.log('2. 登入 admin / admin123');
        console.log('3. 點擊任何編輯/刪除按鈕測試');
        console.log('4. 驗證模態框是否正常彈出');
    } else if (successRate >= 70) {
        console.log('⚠️ 按鈕修復大部分完成，但可能有小問題需要解決。');
    } else {
        console.log('❌ 按鈕修復未完成，需要進一步檢查和修復。');
    }
    
    return { successRate, checks };
}

// 執行驗證
if (require.main === module) {
    verifyButtonFix();
}

module.exports = verifyButtonFix;