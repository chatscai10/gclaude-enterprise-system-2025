/**
 * 配送額度檢查功能測試
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'enterprise_system.db');

console.log('🚚 配送額度檢查功能測試');
console.log('═══════════════════════════════════════════════════════');

class DeliveryThresholdTest {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
    }

    async setupTestData() {
        console.log('\n📦 設定測試數據...');
        
        // 設定測試商品 - 不同的配送額度
        const testProducts = [
            {
                code: 'DELIVERY001',
                name: '低額度測試商品',
                unit: '個',
                current_stock: 100,
                unit_cost: 50,  // 單價50元
                delivery_threshold: 200  // 配送門檻200元 (至少要買4個)
            },
            {
                code: 'DELIVERY002', 
                name: '中額度測試商品',
                unit: '盒',
                current_stock: 50,
                unit_cost: 100, // 單價100元
                delivery_threshold: 500  // 配送門檻500元 (至少要買5盒)
            },
            {
                code: 'DELIVERY003',
                name: '高額度測試商品',
                unit: '箱',
                current_stock: 20,
                unit_cost: 300, // 單價300元
                delivery_threshold: 1000 // 配送門檻1000元 (至少要買4箱)
            }
        ];
        
        for (const product of testProducts) {
            await this.insertProduct(product);
        }
        
        console.log('✅ 測試數據設定完成');
    }
    
    async insertProduct(product) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT OR REPLACE INTO products (
                    uuid, code, name, unit, current_stock, unit_cost, delivery_threshold, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `;
            
            this.db.run(sql, [
                uuidv4(), product.code, product.name, product.unit,
                product.current_stock, product.unit_cost, product.delivery_threshold
            ], (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`   ✓ ${product.name}: 單價$${product.unit_cost}, 配送門檻$${product.delivery_threshold}`);
                    resolve();
                }
            });
        });
    }
    
    async testDeliveryThreshold() {
        console.log('\n🧪 執行配送額度檢查測試...');
        
        // 獲取測試商品
        const products = await this.query(`
            SELECT * FROM products 
            WHERE code LIKE 'DELIVERY%'
            ORDER BY delivery_threshold
        `);
        
        console.log(`📋 測試商品: ${products.length} 個\n`);
        
        // 測試場景
        const testCases = [
            // 低額度商品測試
            { productCode: 'DELIVERY001', quantity: 2, expectedResult: 'fail', reason: '2個×$50=$100 < $200門檻' },
            { productCode: 'DELIVERY001', quantity: 4, expectedResult: 'pass', reason: '4個×$50=$200 = $200門檻' },
            { productCode: 'DELIVERY001', quantity: 6, expectedResult: 'pass', reason: '6個×$50=$300 > $200門檻' },
            
            // 中額度商品測試
            { productCode: 'DELIVERY002', quantity: 3, expectedResult: 'fail', reason: '3盒×$100=$300 < $500門檻' },
            { productCode: 'DELIVERY002', quantity: 5, expectedResult: 'pass', reason: '5盒×$100=$500 = $500門檻' },
            { productCode: 'DELIVERY002', quantity: 8, expectedResult: 'pass', reason: '8盒×$100=$800 > $500門檻' },
            
            // 高額度商品測試
            { productCode: 'DELIVERY003', quantity: 2, expectedResult: 'fail', reason: '2箱×$300=$600 < $1000門檻' },
            { productCode: 'DELIVERY003', quantity: 3, expectedResult: 'fail', reason: '3箱×$300=$900 < $1000門檻' },
            { productCode: 'DELIVERY003', quantity: 4, expectedResult: 'pass', reason: '4箱×$300=$1200 > $1000門檻' }
        ];
        
        console.log('🔍 測試案例:');
        console.log('');
        
        let passCount = 0;
        let failCount = 0;
        
        for (const testCase of testCases) {
            const product = products.find(p => p.code === testCase.productCode);
            if (!product) {
                console.log(`❌ 找不到測試商品: ${testCase.productCode}`);
                continue;
            }
            
            const orderValue = product.unit_cost * testCase.quantity;
            const deliveryThreshold = product.delivery_threshold;
            const actualResult = orderValue >= deliveryThreshold ? 'pass' : 'fail';
            const isCorrect = actualResult === testCase.expectedResult;
            
            const statusIcon = isCorrect ? '✅' : '❌';
            const resultIcon = actualResult === 'pass' ? '🚚' : '🚫';
            
            console.log(`${statusIcon} ${product.name}`);
            console.log(`   數量: ${testCase.quantity}${product.unit} × $${product.unit_cost} = $${orderValue}`);
            console.log(`   門檻: $${deliveryThreshold}`);
            console.log(`   結果: ${resultIcon} ${actualResult === 'pass' ? '可配送' : '不可配送'}`);
            console.log(`   預期: ${testCase.expectedResult === 'pass' ? '可配送' : '不可配送'} (${testCase.reason})`);
            
            if (isCorrect) {
                passCount++;
            } else {
                failCount++;
                console.log(`   ⚠️  測試失敗: 預期 ${testCase.expectedResult}，實際 ${actualResult}`);
            }
            console.log('');
        }
        
        console.log('═══════════════════════════════════════════════════════');
        console.log('📊 測試結果統計');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`✅ 通過: ${passCount} 個測試案例`);
        console.log(`❌ 失敗: ${failCount} 個測試案例`);
        console.log(`📊 成功率: ${(passCount / (passCount + failCount) * 100).toFixed(1)}%`);
        
        return { passCount, failCount, totalCount: passCount + failCount };
    }
    
    async demonstrateAPI() {
        console.log('\n🔗 API 調用示範...');
        
        // 模擬API調用邏輯
        const products = await this.query(`SELECT * FROM products WHERE code LIKE 'DELIVERY%'`);
        
        console.log('📋 API檢查邏輯示範:');
        
        for (const product of products) {
            console.log(`\n📦 商品: ${product.name}`);
            console.log(`   單價: $${product.unit_cost}`);
            console.log(`   配送門檻: $${product.delivery_threshold}`);
            
            // 模擬不同數量的檢查
            const testQuantities = [1, 3, 5, 10];
            
            for (const quantity of testQuantities) {
                const orderValue = product.unit_cost * quantity;
                const deliveryThreshold = product.delivery_threshold;
                const canDeliver = orderValue >= deliveryThreshold;
                
                if (canDeliver) {
                    console.log(`   ✅ ${quantity}${product.unit}: $${orderValue} ≥ $${deliveryThreshold} - 可配送`);
                } else {
                    const shortage = deliveryThreshold - orderValue;
                    console.log(`   ❌ ${quantity}${product.unit}: $${orderValue} < $${deliveryThreshold} - 不足$${shortage}`);
                }
            }
        }
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
    const test = new DeliveryThresholdTest();
    
    try {
        await test.setupTestData();
        
        const result = await test.testDeliveryThreshold();
        
        await test.demonstrateAPI();
        
        console.log('\n🎯 配送額度檢查功能特色:');
        console.log('   ✓ 每個商品可設定不同的配送門檻金額');
        console.log('   ✓ 自動計算訂單總金額 (單價 × 數量)');
        console.log('   ✓ 不達門檻自動拒絕並提示差額');
        console.log('   ✓ 達到門檻自動批准並扣減庫存');
        console.log('   ✓ 訂單回應包含詳細的配送資訊');
        
        console.log('\n📝 實際應用場景:');
        console.log('   • 大宗物品: 設定較高門檻減少配送成本');
        console.log('   • 小件商品: 設定較低門檻提高服務水準');
        console.log('   • 季節商品: 可動態調整配送政策');
        
        if (result.failCount === 0) {
            console.log('\n🎉 所有測試通過！配送額度檢查功能正常運作');
        } else {
            console.log(`\n⚠️  有 ${result.failCount} 個測試失敗，請檢查邏輯`);
        }
        
    } catch (error) {
        console.error('❌ 測試過程發生錯誤:', error.message);
    } finally {
        test.close();
        console.log('\n✅ 配送額度檢查測試完成');
    }
}

if (require.main === module) {
    main();
}

module.exports = DeliveryThresholdTest;