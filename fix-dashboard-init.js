/**
 * 修復儀表板初始化問題
 * 改善錯誤處理和調試信息
 */

// 更強健的儀表板初始化函數
const improvedInitialization = `
// 改善版儀表板初始化
async function initializeDashboard() {
    console.log('🔧 開始儀表板初始化...');
    
    try {
        console.log('1. 載入用戶資訊...');
        await loadUserInfo();
        console.log('✅ 用戶資訊載入完成');
        
        console.log('2. 更新當前日期...');
        updateCurrentDate();
        console.log('✅ 日期更新完成');
        
        console.log('3. 綁定事件監聽器...');
        bindEventListeners();
        console.log('✅ 事件監聽器綁定完成');
        
        console.log('4. 載入儀表板數據...');
        await loadDashboardData();
        console.log('✅ 儀表板數據載入完成');
        
        console.log('🎉 儀表板初始化成功完成！');
        
    } catch (error) {
        console.error('❌ 儀表板初始化失敗:', error);
        console.error('錯誤詳情:', error.stack);
        
        // 不要立即跳轉，先嘗試基本功能
        showError('儀表板部分功能載入失敗，但基本功能仍可使用');
        
        // 設置最小功能
        try {
            updateCurrentDate();
            console.log('✅ 基本功能設置完成');
        } catch (basicError) {
            console.error('❌ 連基本功能都無法設置:', basicError);
            redirectToLogin();
        }
    }
}

// 改善版載入儀表板數據
async function loadDashboardData() {
    console.log('📊 開始載入儀表板數據...');
    
    const dataPromises = [];
    
    try {
        // 分別嘗試載入各項數據
        console.log('  - 嘗試載入統計資料...');
        const statsPromise = loadStats().then(() => {
            console.log('  ✅ 統計資料載入成功');
        }).catch(error => {
            console.warn('  ⚠️ 統計資料載入失敗:', error.message);
            return Promise.resolve(); // 不阻斷其他載入
        });
        
        console.log('  - 嘗試載入快速操作...');
        const actionsPromise = loadQuickActions().then(() => {
            console.log('  ✅ 快速操作載入成功');
        }).catch(error => {
            console.warn('  ⚠️ 快速操作載入失敗:', error.message);
            return Promise.resolve(); // 不阻斷其他載入
        });
        
        dataPromises.push(statsPromise, actionsPromise);
        
        await Promise.allSettled(dataPromises);
        console.log('📊 儀表板數據載入過程完成');
        
    } catch (error) {
        console.error('❌ 載入儀表板數據時發生未預期錯誤:', error);
        throw error;
    }
}

// 改善版錯誤處理
window.addEventListener('error', function(event) {
    console.error('🚨 全域JavaScript錯誤:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 未處理的Promise拒絕:', event.reason);
});
`;

console.log('儀表板初始化修復代碼已準備');
console.log('\n建議的修復步驟:');
console.log('1. 在dashboard.html中替換initializeDashboard函數');
console.log('2. 添加更詳細的錯誤日誌');
console.log('3. 使用Promise.allSettled避免單一失敗阻斷整個初始化');
console.log('4. 提供降級功能確保基本可用性');

module.exports = improvedInitialization;