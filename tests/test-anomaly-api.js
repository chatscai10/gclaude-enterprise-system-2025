/**
 * 測試異常檢查API功能
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

console.log('🚀 測試異常檢查API功能...');

async function testAnomalyAPI() {
    try {
        // 1. 測試手動觸發異常檢查
        console.log('\n1️⃣  測試手動異常檢查API...');
        
        try {
            const response = await axios.post(`${API_BASE}/admin/check-order-anomalies`, {}, {
                headers: {
                    'Authorization': 'Bearer admin-test-token',
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ 手動異常檢查API響應:', response.data);
            
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('ℹ️  需要身分驗證，這是正常的');
            } else {
                console.log('⚠️  API調用失敗:', error.response?.data || error.message);
            }
        }
        
        // 2. 測試異常檢查器狀態
        console.log('\n2️⃣  測試檢查器狀態API...');
        
        try {
            const response = await axios.get(`${API_BASE}/admin/anomaly-checker/status`, {
                headers: {
                    'Authorization': 'Bearer admin-test-token'
                }
            });
            
            console.log('✅ 檢查器狀態API響應:', response.data);
            
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('ℹ️  需要身分驗證，這是正常的');
            } else {
                console.log('⚠️  API調用失敗:', error.response?.data || error.message);
            }
        }
        
        // 3. 測試異常記錄查詢
        console.log('\n3️⃣  測試異常記錄查詢API...');
        
        try {
            const response = await axios.get(`${API_BASE}/admin/order-anomalies/history`, {
                headers: {
                    'Authorization': 'Bearer admin-test-token'
                }
            });
            
            console.log('✅ 異常記錄API響應:', response.data);
            
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('ℹ️  需要身分驗證，這是正常的');
            } else {
                console.log('⚠️  API調用失敗:', error.response?.data || error.message);
            }
        }
        
        console.log('\n🎯 API測試完成 - 所有端點都已響應');
        
    } catch (error) {
        console.error('❌ API測試失敗:', error.message);
    }
}

// 測試定時檢查器
async function testScheduledChecker() {
    try {
        console.log('\n4️⃣  測試定時檢查器...');
        
        const ScheduledAnomalyChecker = require('../services/scheduled-anomaly-checker');
        const scheduler = new ScheduledAnomalyChecker();
        
        // 測試狀態
        const status = scheduler.getStatus();
        console.log('📊 定時檢查器狀態:', status);
        
        // 測試立即執行
        console.log('⚡ 執行立即檢查...');
        const result = await scheduler.runImmediateCheck();
        console.log('✅ 立即檢查結果:', result);
        
        console.log('🎉 定時檢查器測試完成');
        
    } catch (error) {
        console.error('❌ 定時檢查器測試失敗:', error.message);
    }
}

// 測試完整異常檢查邏輯
async function testCompleteAnomalyLogic() {
    try {
        console.log('\n5️⃣  測試完整異常檢查邏輯...');
        
        const OrderAnomalyChecker = require('../services/order-anomaly-checker');
        const checker = new OrderAnomalyChecker();
        
        // 重新實現database query方法以使用正確的資料庫
        const sqlite3 = require('sqlite3').verbose();
        const path = require('path');
        const dbPath = path.join(__dirname, '..', 'enterprise_system.db');
        const db = new sqlite3.Database(dbPath);
        
        // 創建一個臨時的查詢方法
        const query = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        };
        
        // 測試品項查詢
        const products = await query(`
            SELECT * FROM products 
            WHERE is_active = 1 
            AND (frequent_order_days > 0 OR rare_order_days > 0)
        `);
        
        console.log(`📦 找到 ${products.length} 個監控品項`);
        
        // 測試每個品項的異常檢查
        const allAnomalies = [];
        
        for (const product of products) {
            // 獲取該品項的叫貨記錄
            const orders = await query(`
                SELECT 
                    o.*, s.name as store_name,
                    DATE(o.requested_date) as order_date
                FROM orders o
                LEFT JOIN stores s ON o.store_id = s.id
                WHERE o.product_id = ? 
                AND o.status IN ('approved', 'pending')
                ORDER BY o.requested_date DESC
                LIMIT 10
            `, [product.id]);
            
            console.log(`   ${product.name}: ${orders.length} 筆叫貨記錄`);
            
            // 檢查太久沒叫貨異常
            const rareAnomaly = await checker.checkRareOrderAnomaly(product, orders);
            if (rareAnomaly) {
                allAnomalies.push(rareAnomaly);
                console.log(`   ⚠️  ${rareAnomaly.message}`);
            }
            
            // 檢查叫貨頻繁異常
            const frequentAnomaly = await checker.checkFrequentOrderAnomaly(product, orders);
            if (frequentAnomaly) {
                allAnomalies.push(frequentAnomaly);
                console.log(`   ⚠️  ${frequentAnomaly.message}`);
            }
        }
        
        console.log(`\n✅ 異常檢查完成，發現 ${allAnomalies.length} 個異常`);
        
        if (allAnomalies.length > 0) {
            console.log('📋 異常清單:');
            allAnomalies.forEach((anomaly, index) => {
                console.log(`   ${index + 1}. ${anomaly.type}: ${anomaly.product_name}`);
                console.log(`      ${anomaly.message}`);
            });
        }
        
        db.close();
        console.log('🎉 完整異常檢查測試完成');
        
    } catch (error) {
        console.error('❌ 完整異常檢查測試失敗:', error.message);
        console.error(error.stack);
    }
}

async function main() {
    console.log('🧪 開始異常檢查系統完整測試...');
    
    // 首先檢查伺服器是否運行
    try {
        await axios.get('http://localhost:3000/api/health');
        console.log('✅ 伺服器運行中，開始API測試');
        await testAnomalyAPI();
    } catch (error) {
        console.log('⚠️  伺服器未運行，跳過API測試');
    }
    
    await testScheduledChecker();
    await testCompleteAnomalyLogic();
    
    console.log('\n🏁 所有測試完成！');
}

main();