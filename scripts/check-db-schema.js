/**
 * 檢查資料庫表結構
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'enterprise_system.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 檢查資料庫表結構...\n');

// 檢查products表
db.all("PRAGMA table_info(products)", (err, columns) => {
    if (err) {
        console.error('檢查products表失敗:', err);
        return;
    }
    
    console.log('📋 Products表結構:');
    console.log('═══════════════════════════════════════');
    columns.forEach(col => {
        console.log(`${col.name.padEnd(25)} ${col.type.padEnd(15)} ${col.notnull ? 'NOT NULL' : 'NULL'.padEnd(8)} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    const hasFrequentDays = columns.some(col => col.name === 'frequent_order_days');
    const hasRareDays = columns.some(col => col.name === 'rare_order_days');
    const hasDeliveryThreshold = columns.some(col => col.name === 'delivery_threshold');
    
    console.log('\n🔍 異常檢查欄位檢查:');
    console.log(`   frequent_order_days: ${hasFrequentDays ? '✅' : '❌'}`);
    console.log(`   rare_order_days: ${hasRareDays ? '✅' : '❌'}`);
    console.log(`   delivery_threshold: ${hasDeliveryThreshold ? '✅' : '❌'}`);
    
    // 檢查orders表
    db.all("PRAGMA table_info(orders)", (err, columns) => {
        if (err) {
            console.error('檢查orders表失敗:', err);
            return;
        }
        
        console.log('\n📋 Orders表結構:');
        console.log('═══════════════════════════════════════');
        columns.forEach(col => {
            console.log(`${col.name.padEnd(25)} ${col.type.padEnd(15)} ${col.notnull ? 'NOT NULL' : 'NULL'.padEnd(8)} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
        });
        
        const hasStoreId = columns.some(col => col.name === 'store_id');
        
        console.log('\n🔍 orders表欄位檢查:');
        console.log(`   store_id: ${hasStoreId ? '✅' : '❌'}`);
        
        // 檢查所有表
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
            if (err) {
                console.error('獲取表列表失敗:', err);
                return;
            }
            
            console.log('\n📋 資料庫中的所有表:');
            console.log('═══════════════════════════════════════');
            tables.forEach(table => {
                console.log(`   - ${table.name}`);
            });
            
            db.close();
        });
    });
});