/**
 * 檢查分店打卡範圍設定
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'enterprise_system.db');
const db = new sqlite3.Database(dbPath);

console.log('🏪 檢查分店打卡範圍設定...\n');

db.all("SELECT * FROM stores ORDER BY id", (err, stores) => {
    if (err) {
        console.error('查詢分店資料失敗:', err);
        return;
    }
    
    console.log('📋 現有分店設定:');
    console.log('═══════════════════════════════════════════════════════');
    
    stores.forEach(store => {
        console.log(`🏪 ${store.name}`);
        console.log(`   ID: ${store.id}`);
        console.log(`   地址: ${store.address || '未設定'}`);
        console.log(`   座標: ${store.latitude}, ${store.longitude}`);
        console.log(`   打卡範圍: ${store.radius} 公尺`);
        
        // 範圍分析
        if (store.radius > 10000) {
            console.log(`   ⚠️  範圍異常大: ${(store.radius/1000).toFixed(1)}公里 - 可能是測試設定`);
        } else if (store.radius > 1000) {
            console.log(`   ⚠️  範圍較大: ${(store.radius/1000).toFixed(1)}公里`);
        } else if (store.radius > 200) {
            console.log(`   ✅ 範圍正常: ${store.radius}公尺`);
        } else {
            console.log(`   ⚠️  範圍較小: ${store.radius}公尺 - 可能過於嚴格`);
        }
        console.log('');
    });
    
    console.log('💡 建議打卡範圍:');
    console.log('   • 一般分店: 50-200公尺 (店面周圍)');
    console.log('   • 大型店面: 200-500公尺 (含停車場)');
    console.log('   • 測試用途: 可設定較大範圍');
    console.log('   • 嚴格控制: 30-50公尺 (店面內部)');
    
    db.close();
});