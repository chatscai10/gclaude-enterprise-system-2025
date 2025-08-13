/**
 * Jest 測試設定檔
 */

// 設定測試超時時間
jest.setTimeout(30000);

// 全域測試變數
global.testConfig = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3007',
    timeout: 30000,
    database: process.env.NODE_ENV === 'test' ? ':memory:' : 'test.db'
};

// 測試前設定
beforeAll(async () => {
    // 初始化測試資料庫
    if (process.env.NODE_ENV === 'test') {
        const database = require('../../database');
        // 可以在這裡設定測試資料
    }
});

// 測試後清理
afterAll(async () => {
    // 清理測試資料
});

// 每個測試前的設定
beforeEach(() => {
    // 重置狀態
});

// 每個測試後的清理
afterEach(() => {
    // 清理狀態
});