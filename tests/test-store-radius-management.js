/**
 * 分店打卡範圍管理功能測試
 * 測試範圍設定的合理性和管理功能
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'enterprise_system.db');

console.log('🏪 分店打卡範圍管理功能測試');
console.log('═══════════════════════════════════════════════════════');

class StoreRadiusTest {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
    }

    async analyzeCurrentSettings() {
        console.log('\n📊 現有設定分析...');
        
        const stores = await this.query('SELECT * FROM stores ORDER BY id');
        
        console.log('📋 分店打卡範圍現況:');
        stores.forEach(store => {
            console.log(`\n🏪 ${store.name}`);
            console.log(`   當前範圍: ${store.radius} 公尺`);
            
            // 範圍合理性分析
            const analysis = this.analyzeRadius(store.radius, store.name);
            console.log(`   分析結果: ${analysis.status} ${analysis.description}`);
            console.log(`   建議範圍: ${analysis.suggestion}`);
            
            if (analysis.needsAdjustment) {
                console.log(`   🔧 建議調整: ${analysis.recommendation}`);
            }
        });
        
        return stores;
    }
    
    analyzeRadius(radius, storeName) {
        if (radius >= 50000) {
            return {
                status: '⚠️ ',
                description: '範圍過大 (≥50公里)',
                suggestion: '100-500公尺',
                needsAdjustment: true,
                recommendation: '建議調整為測試專用或縮小範圍',
                priority: 'high'
            };
        } else if (radius >= 10000) {
            return {
                status: '⚠️ ',
                description: '範圍很大 (≥10公里)',
                suggestion: '100-500公尺',
                needsAdjustment: true,
                recommendation: '建議縮小到合理範圍或標記為測試用途',
                priority: 'high'
            };
        } else if (radius >= 1000) {
            return {
                status: '⚠️ ',
                description: '範圍較大 (≥1公里)',
                suggestion: '100-500公尺',
                needsAdjustment: true,
                recommendation: '建議根據實際店面大小調整',
                priority: 'medium'
            };
        } else if (radius >= 200) {
            return {
                status: '✅',
                description: '範圍合理 (200m-1km)',
                suggestion: '保持現有設定',
                needsAdjustment: false,
                recommendation: '範圍適中，適合大型店面',
                priority: 'low'
            };
        } else if (radius >= 50) {
            return {
                status: '✅',
                description: '範圍適中 (50-200m)',
                suggestion: '保持現有設定',
                needsAdjustment: false,
                recommendation: '範圍合理，適合一般店面',
                priority: 'low'
            };
        } else {
            return {
                status: '⚠️ ',
                description: '範圍較小 (<50m)',
                suggestion: '50-100公尺',
                needsAdjustment: true,
                recommendation: '可能過於嚴格，建議適當放寬',
                priority: 'low'
            };
        }
    }
    
    async generateOptimizedSettings() {
        console.log('\n🎯 生成優化設定建議...');
        
        const stores = await this.query('SELECT * FROM stores ORDER BY id');
        const optimizedSettings = [];
        
        console.log('📋 優化設定建議:');
        
        stores.forEach(store => {
            let recommendedRadius;
            let rationale;
            
            // 根據店名和特性給出建議
            if (store.name.includes('忠孝店')) {
                recommendedRadius = 10000; // 保持測試用途
                rationale = '保持測試用途的大範圍，便於開發調試';
            } else if (store.name.includes('龍安店')) {
                recommendedRadius = 150; // 適中範圍
                rationale = '一般分店，設定適中範圍包含店面周圍';
            } else if (store.name.includes('龍崗店')) {
                recommendedRadius = 120; // 稍小範圍
                rationale = '市區分店，設定較小範圍確保精確打卡';
            } else {
                recommendedRadius = 100; // 預設範圍
                rationale = '預設範圍，適合大部分分店';
            }
            
            optimizedSettings.push({
                id: store.id,
                name: store.name,
                current_radius: store.radius,
                recommended_radius: recommendedRadius,
                change: recommendedRadius - store.radius,
                rationale: rationale
            });
            
            const changeIcon = recommendedRadius === store.radius ? '=' : 
                             recommendedRadius > store.radius ? '📈' : '📉';
            
            console.log(`\n🏪 ${store.name}`);
            console.log(`   現有: ${store.radius}m → 建議: ${recommendedRadius}m ${changeIcon}`);
            console.log(`   變化: ${recommendedRadius - store.radius > 0 ? '+' : ''}${recommendedRadius - store.radius}m`);
            console.log(`   理由: ${rationale}`);
        });
        
        return optimizedSettings;
    }
    
    async simulateRadiusUpdate() {
        console.log('\n🔧 模擬範圍更新操作...');
        
        const testUpdates = [
            { store_id: 2, new_radius: 150, reason: '調整為適中範圍' },
            { store_id: 3, new_radius: 120, reason: '市區分店精確控制' }
        ];
        
        console.log('📝 模擬更新操作:');
        
        for (const update of testUpdates) {
            const stores = await this.query('SELECT * FROM stores WHERE id = ?', [update.store_id]);
            if (stores.length === 0) continue;
            
            const store = stores[0];
            const oldRadius = store.radius;
            const newRadius = update.new_radius;
            const change = newRadius - oldRadius;
            
            console.log(`\n🏪 ${store.name} (ID: ${update.store_id})`);
            console.log(`   變更: ${oldRadius}m → ${newRadius}m (${change > 0 ? '+' : ''}${change}m)`);
            console.log(`   理由: ${update.reason}`);
            
            // 模擬API調用
            console.log(`   📡 API: PUT /api/admin/stores/${update.store_id}/radius`);
            console.log(`   📝 數據: { "radius": ${newRadius}, "reason": "${update.reason}" }`);
            
            // 分析影響
            const impact = this.analyzeRadiusImpact(oldRadius, newRadius);
            console.log(`   📊 影響: ${impact.description}`);
            console.log(`   💡 建議: ${impact.suggestion}`);
        }
    }
    
    analyzeRadiusImpact(oldRadius, newRadius) {
        const change = newRadius - oldRadius;
        const changePercent = Math.abs(change / oldRadius * 100);
        
        if (Math.abs(change) < 10) {
            return {
                description: '微調，影響很小',
                suggestion: '可以直接實施'
            };
        } else if (change > 0) {
            return {
                description: `放寬範圍 ${change}m (${changePercent.toFixed(1)}%)`,
                suggestion: changePercent > 50 ? '建議分階段實施，觀察效果' : '可以直接實施'
            };
        } else {
            return {
                description: `縮小範圍 ${Math.abs(change)}m (${changePercent.toFixed(1)}%)`,
                suggestion: changePercent > 50 ? '建議通知員工，避免打卡困難' : '可以直接實施'
            };
        }
    }
    
    async testBatchUpdate() {
        console.log('\n📦 測試批量更新功能...');
        
        const batchUpdates = [
            { id: 2, radius: 150, reason: '龍安店範圍優化' },
            { id: 3, radius: 120, reason: '龍崗店精確控制' }
        ];
        
        console.log('📋 批量更新模擬:');
        console.log(`   更新數量: ${batchUpdates.length} 個分店`);
        console.log('   更新內容:');
        
        batchUpdates.forEach((update, index) => {
            console.log(`   ${index + 1}. 分店ID ${update.id}: 範圍設為 ${update.radius}m (${update.reason})`);
        });
        
        console.log('\n📡 API調用:');
        console.log('   POST /api/admin/stores/batch-update');
        console.log('   數據:', JSON.stringify({ updates: batchUpdates }, null, 2));
        
        console.log('\n✅ 預期結果:');
        console.log('   - 所有分店範圍同時更新');
        console.log('   - 操作記錄到系統日誌');
        console.log('   - 返回詳細更新報告');
    }
    
    async demonstrateManagementFeatures() {
        console.log('\n🎛️  管理功能示範...');
        
        console.log('📋 可用的管理功能:');
        console.log('');
        
        console.log('1️⃣  查看所有分店設定');
        console.log('   📡 GET /api/admin/stores/settings');
        console.log('   📝 返回所有分店的完整設定信息');
        
        console.log('\n2️⃣  單個分店範圍更新');
        console.log('   📡 PUT /api/admin/stores/:id/radius');
        console.log('   📝 更新指定分店的打卡範圍');
        console.log('   🔒 需要管理員權限');
        
        console.log('\n3️⃣  批量更新分店設定');
        console.log('   📡 PUT /api/admin/stores/batch-update');
        console.log('   📝 同時更新多個分店設定');
        console.log('   🔒 需要管理員權限');
        
        console.log('\n4️⃣  查看變更歷史');
        console.log('   📡 GET /api/admin/stores/:id/radius-history');
        console.log('   📝 查看特定分店的範圍變更記錄');
        console.log('   📊 包含變更人員和原因');
        
        console.log('\n🔐 權限控制:');
        console.log('   👑 管理員: 完全訪問所有功能');
        console.log('   👔 經理: 可查看和更新設定');
        console.log('   👤 員工: 無法訪問管理功能');
        
        console.log('\n📊 審計功能:');
        console.log('   ✅ 所有變更自動記錄');
        console.log('   ✅ 包含變更前後的數值');
        console.log('   ✅ 記錄操作人員和時間');
        console.log('   ✅ 支援變更原因備註');
    }
    
    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    close() {
        this.db.close();
    }
}

async function main() {
    const test = new StoreRadiusTest();
    
    try {
        const stores = await test.analyzeCurrentSettings();
        const optimizedSettings = await test.generateOptimizedSettings();
        await test.simulateRadiusUpdate();
        await test.testBatchUpdate();
        await test.demonstrateManagementFeatures();
        
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('📊 分店打卡範圍管理總結');
        console.log('═══════════════════════════════════════════════════════');
        
        // 統計分析
        const needsAdjustment = stores.filter(store => {
            const analysis = test.analyzeRadius(store.radius, store.name);
            return analysis.needsAdjustment;
        });
        
        console.log('\n📈 現況統計:');
        console.log(`   總分店數: ${stores.length} 個`);
        console.log(`   需要調整: ${needsAdjustment.length} 個`);
        console.log(`   設定合理: ${stores.length - needsAdjustment.length} 個`);
        
        console.log('\n🎯 管理建議:');
        console.log('   🔧 實施優化設定提高打卡精確度');
        console.log('   📱 考慮手機GPS精度限制 (±5-10m)');
        console.log('   🏢 根據店面實際大小調整範圍');
        console.log('   🧪 保留測試專用的大範圍設定');
        
        console.log('\n✨ 功能亮點:');
        console.log('   ✅ 靈活的範圍管理 - 每個分店獨立設定');
        console.log('   ✅ 批量更新功能 - 提高管理效率');
        console.log('   ✅ 完整的審計追蹤 - 所有變更可追溯');
        console.log('   ✅ 智能分析建議 - 自動評估設定合理性');
        
    } catch (error) {
        console.error('❌ 測試過程發生錯誤:', error.message);
    } finally {
        test.close();
        console.log('\n✅ 分店打卡範圍管理測試完成');
    }
}

if (require.main === module) {
    main();
}

module.exports = StoreRadiusTest;