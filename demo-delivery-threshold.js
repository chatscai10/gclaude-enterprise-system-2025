/**
 * 配送額度檢查功能完整示範
 * 展示API和前端整合的配送額度檢查
 */

console.log('🚚 GClaude企業系統 - 配送額度檢查功能完整示範');
console.log('═══════════════════════════════════════════════════════');

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'enterprise_system.db');

class DeliveryThresholdDemo {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
    }

    async setupDemoScenarios() {
        console.log('\n📦 設定配送額度示範場景...');
        
        // 不同配送策略的示範商品
        const demoProducts = [
            {
                code: 'FOOD001',
                name: '冷凍雞排',
                category: '冷凍食品',
                unit: '包',
                current_stock: 50,
                unit_cost: 120,
                supplier: '食品供應商A',
                delivery_threshold: 500,  // 低門檻 - 鼓勵常購買
                description: '常用主食商品，設定較低門檻便於補貨'
            },
            {
                code: 'DRINK001', 
                name: '珍珠奶茶原料',
                category: '飲料原料',
                unit: '盒',
                current_stock: 30,
                unit_cost: 200,
                supplier: '飲料原料商B',
                delivery_threshold: 800,  // 中門檻 - 平衡成本效益
                description: '專業原料，設定中等門檻控制配送頻率'
            },
            {
                code: 'EQUIP001',
                name: '大型烤箱設備',
                category: '設備用品',
                unit: '台',
                current_stock: 5,
                unit_cost: 1500,
                supplier: '設備供應商C',
                delivery_threshold: 3000, // 高門檻 - 大型設備少量高價
                description: '昂貴設備，設定高門檻減少小額配送'
            },
            {
                code: 'SUPPLY001',
                name: '一次性餐具',
                category: '消耗用品',
                unit: '箱',
                current_stock: 100,
                unit_cost: 50,
                supplier: '餐具供應商D',
                delivery_threshold: 300,  // 低門檻 - 消耗品需要常補充
                description: '快速消耗品，低門檻確保充足庫存'
            }
        ];
        
        for (const product of demoProducts) {
            await this.insertProduct(product);
        }
        
        console.log('✅ 示範場景設定完成');
    }
    
    async insertProduct(product) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT OR REPLACE INTO products (
                    uuid, code, name, category, unit, current_stock, unit_cost, 
                    supplier, delivery_threshold, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `;
            
            this.db.run(sql, [
                uuidv4(), product.code, product.name, product.category, product.unit,
                product.current_stock, product.unit_cost, product.supplier, product.delivery_threshold
            ], (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`   ✓ ${product.name}: $${product.unit_cost}/${product.unit}, 門檻$${product.delivery_threshold}`);
                    console.log(`     策略: ${product.description}`);
                    resolve();
                }
            });
        });
    }
    
    async simulateOrderScenarios() {
        console.log('\n🎯 模擬不同訂單場景...');
        
        const products = await this.query(`
            SELECT * FROM products 
            WHERE code LIKE 'FOOD%' OR code LIKE 'DRINK%' OR code LIKE 'EQUIP%' OR code LIKE 'SUPPLY%'
            ORDER BY delivery_threshold
        `);
        
        console.log(`📋 測試產品: ${products.length} 個\n`);
        
        // 模擬各種訂單場景
        const orderScenarios = [
            {
                title: '📱 手機端小額訂單',
                description: '員工用手機快速叫貨，通常數量較少',
                orders: [
                    { code: 'FOOD001', quantity: 2, store: '內壢忠孝店' },
                    { code: 'SUPPLY001', quantity: 3, store: '桃園龍安店' }
                ]
            },
            {
                title: '💻 電腦端正常訂單',
                description: '管理員或資深員工進行的標準補貨',
                orders: [
                    { code: 'FOOD001', quantity: 5, store: '內壢忠孝店' },
                    { code: 'DRINK001', quantity: 4, store: '中壢龍崗店' }
                ]
            },
            {
                title: '🏢 大宗採購訂單',
                description: '月底或促銷前的大量補貨',
                orders: [
                    { code: 'EQUIP001', quantity: 2, store: '內壢忠孝店' },
                    { code: 'SUPPLY001', quantity: 10, store: '桃園龍安店' }
                ]
            },
            {
                title: '🚨 緊急補貨訂單',
                description: '庫存告急時的即時補貨',
                orders: [
                    { code: 'FOOD001', quantity: 1, store: '中壢龍崗店' },
                    { code: 'DRINK001', quantity: 2, store: '內壢忠孝店' }
                ]
            }
        ];
        
        for (const scenario of orderScenarios) {
            console.log(`\n${scenario.title}`);
            console.log(`📝 ${scenario.description}`);
            console.log('─'.repeat(50));
            
            for (const order of scenario.orders) {
                const product = products.find(p => p.code === order.code);
                if (!product) continue;
                
                const orderValue = product.unit_cost * order.quantity;
                const deliveryThreshold = product.delivery_threshold;
                const canDeliver = orderValue >= deliveryThreshold;
                const shortage = deliveryThreshold - orderValue;
                
                console.log(`📦 ${product.name}`);
                console.log(`   分店: ${order.store}`);
                console.log(`   訂單: ${order.quantity}${product.unit} × $${product.unit_cost} = $${orderValue}`);
                console.log(`   門檻: $${deliveryThreshold}`);
                
                if (canDeliver) {
                    const surplus = orderValue - deliveryThreshold;
                    console.log(`   結果: ✅ 可配送 (超出門檻 $${surplus})`);
                    console.log(`   狀態: 🚚 自動批准，庫存已扣減`);
                } else {
                    console.log(`   結果: ❌ 不可配送 (不足 $${shortage})`);
                    console.log(`   狀態: 🚫 訂單被拒絕`);
                    console.log(`   建議: 增加至少 ${Math.ceil(shortage / product.unit_cost)} ${product.unit}可達配送標準`);
                }
                console.log('');
            }
        }
    }
    
    async demonstrateBusinessLogic() {
        console.log('\n💼 配送額度商業邏輯示範...');
        
        const products = await this.query(`SELECT * FROM products WHERE code LIKE 'FOOD%' OR code LIKE 'DRINK%' OR code LIKE 'EQUIP%' OR code LIKE 'SUPPLY%'`);
        
        console.log('📊 配送策略分析:');
        console.log('');
        
        // 按配送門檻分組
        const lowThreshold = products.filter(p => p.delivery_threshold <= 500);
        const mediumThreshold = products.filter(p => p.delivery_threshold > 500 && p.delivery_threshold <= 1000);
        const highThreshold = products.filter(p => p.delivery_threshold > 1000);
        
        console.log('🟢 低門檻商品 (≤$500) - 便民策略');
        console.log('   特色: 鼓勵頻繁補貨，確保基本商品充足');
        lowThreshold.forEach(product => {
            const minQuantity = Math.ceil(product.delivery_threshold / product.unit_cost);
            console.log(`   • ${product.name}: 最少${minQuantity}${product.unit} ($${product.delivery_threshold})`);
        });
        
        console.log('\n🟡 中門檻商品 ($500-$1000) - 平衡策略');
        console.log('   特色: 平衡配送成本與庫存管理');
        mediumThreshold.forEach(product => {
            const minQuantity = Math.ceil(product.delivery_threshold / product.unit_cost);
            console.log(`   • ${product.name}: 最少${minQuantity}${product.unit} ($${product.delivery_threshold})`);
        });
        
        console.log('\n🔴 高門檻商品 (>$1000) - 成本控制策略');
        console.log('   特色: 減少小額配送，專注大宗採購');
        highThreshold.forEach(product => {
            const minQuantity = Math.ceil(product.delivery_threshold / product.unit_cost);
            console.log(`   • ${product.name}: 最少${minQuantity}${product.unit} ($${product.delivery_threshold})`);
        });
    }
    
    async simulateAPIResponse() {
        console.log('\n🔗 API 回應示範...');
        
        // 模擬成功和失敗的API回應
        const testCases = [
            {
                product_code: 'FOOD001',
                quantity: 6,
                expected: 'success'
            },
            {
                product_code: 'DRINK001',
                quantity: 3,
                expected: 'fail'
            },
            {
                product_code: 'EQUIP001',
                quantity: 2,
                expected: 'success'
            }
        ];
        
        for (const testCase of testCases) {
            const product = await this.query('SELECT * FROM products WHERE code = ?', [testCase.product_code]);
            if (product.length === 0) continue;
            
            const p = product[0];
            const orderValue = p.unit_cost * testCase.quantity;
            const canDeliver = orderValue >= p.delivery_threshold;
            
            console.log(`\n📡 POST /api/orders`);
            console.log(`📝 請求數據:`);
            console.log(`   {`);
            console.log(`     "product_id": ${p.id},`);
            console.log(`     "requested_quantity": ${testCase.quantity},`);
            console.log(`     "store_id": 1`);
            console.log(`   }`);
            
            if (canDeliver) {
                console.log(`✅ 200 OK - 訂單成功`);
                console.log(`📦 回應數據:`);
                console.log(`   {`);
                console.log(`     "success": true,`);
                console.log(`     "message": "叫貨申請提交成功，庫存已自動扣減",`);
                console.log(`     "data": {`);
                console.log(`       "order_number": "ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-123456",`);
                console.log(`       "total_cost": ${orderValue},`);
                console.log(`       "delivery_threshold": ${p.delivery_threshold},`);
                console.log(`       "delivery_qualified": true,`);
                console.log(`       "delivery_info": "✅ 訂單金額 $${orderValue} 已達配送標準 (最低: $${p.delivery_threshold})"`);
                console.log(`     }`);
                console.log(`   }`);
            } else {
                const shortage = p.delivery_threshold - orderValue;
                console.log(`❌ 400 Bad Request - 配送額度不足`);
                console.log(`📦 回應數據:`);
                console.log(`   {`);
                console.log(`     "success": false,`);
                console.log(`     "message": "訂單金額不足配送標準！目前金額: $${orderValue}，最低配送額度: $${p.delivery_threshold}",`);
                console.log(`     "data": {`);
                console.log(`       "current_amount": ${orderValue},`);
                console.log(`       "required_amount": ${p.delivery_threshold},`);
                console.log(`       "shortage": ${shortage}`);
                console.log(`     }`);
                console.log(`   }`);
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
    const demo = new DeliveryThresholdDemo();
    
    try {
        await demo.setupDemoScenarios();
        await demo.simulateOrderScenarios();
        await demo.demonstrateBusinessLogic();
        await demo.simulateAPIResponse();
        
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('🎯 配送額度檢查功能總結');
        console.log('═══════════════════════════════════════════════════════');
        
        console.log('\n🔧 技術實現:');
        console.log('   ✓ 後端API自動檢查配送額度');
        console.log('   ✓ 前端即時顯示配送狀態');
        console.log('   ✓ 資料庫儲存每個商品的配送門檻');
        console.log('   ✓ 訂單金額自動計算 (單價 × 數量)');
        
        console.log('\n📊 商業價值:');
        console.log('   💰 控制配送成本 - 避免小額配送');
        console.log('   📈 提高訂單價值 - 鼓勵批量採購');
        console.log('   ⚡ 提升效率 - 減少配送頻率');
        console.log('   🎯 靈活策略 - 不同商品不同門檻');
        
        console.log('\n🎨 用戶體驗:');
        console.log('   🚦 即時狀態顯示 - 綠色可配送，紅色不足額');
        console.log('   💡 智能建議 - 顯示達到門檻需要的數量');
        console.log('   📱 響應式設計 - 手機電腦都支援');
        console.log('   🔔 清楚提示 - 明確告知不足金額');
        
        console.log('\n🚀 擴展功能建議:');
        console.log('   📅 時間段配送門檻 - 促銷期間降低門檻');
        console.log('   👥 會員等級門檻 - VIP分店享受優惠門檻');
        console.log('   🌍 地區差異門檻 - 偏遠地區提高門檻');
        console.log('   📊 動態調整門檻 - 基於歷史數據優化');
        
    } catch (error) {
        console.error('❌ 示範過程發生錯誤:', error.message);
    } finally {
        demo.close();
        console.log('\n✅ 配送額度檢查功能示範完成');
    }
}

if (require.main === module) {
    main();
}

module.exports = DeliveryThresholdDemo;