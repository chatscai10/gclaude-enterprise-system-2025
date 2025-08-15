/**
 * 改進的叫貨API - 支援批量叫貨和廠商分組配送額度檢查
 * 修正配送額度邏輯：按廠商分組計算總金額，而非單品項金額
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const database = require('../database');
const router = express.Router();

// 中間件：身份驗證
function authenticateToken(req, res, next) {
    // 這裡應該使用實際的JWT驗證邏輯
    // 為了示例，假設用戶已通過驗證
    req.user = { id: 1, name: '測試員工', role: 'employee' };
    next();
}

// 改進的叫貨API - 支援批量叫貨和廠商分組配送額度檢查
router.post('/orders/batch', authenticateToken, async (req, res) => {
    try {
        const { items, delivery_date, notes, store_id } = req.body;
        
        // 驗證必填欄位
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: '請提供有效的商品清單'
            });
        }

        if (!store_id) {
            return res.status(400).json({
                success: false,
                message: '分店ID為必填欄位'
            });
        }

        // 1. 檢查所有商品並取得詳細資訊
        const productDetails = {};
        const supplierOrders = {}; // 按廠商分組

        for (const item of items) {
            if (!item.product_id || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: '每個商品都必須包含有效的 product_id 和 quantity'
                });
            }

            const products = await database.all(
                'SELECT * FROM products WHERE id = ? AND is_active = 1',
                [item.product_id]
            );

            if (products.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `商品ID ${item.product_id} 不存在或已停用`
                });
            }

            const product = products[0];
            productDetails[item.product_id] = product;

            // 2. 檢查庫存是否足夠
            if (product.current_stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `商品「${product.name}」庫存不足！目前庫存: ${product.current_stock}，申請數量: ${item.quantity}`
                });
            }

            // 3. 按廠商分組計算總金額
            const supplier = product.supplier || '未指定廠商';
            if (!supplierOrders[supplier]) {
                supplierOrders[supplier] = {
                    items: [],
                    totalAmount: 0,
                    deliveryThreshold: product.delivery_threshold || 1000
                };
            }

            const itemTotal = product.unit_cost * item.quantity;
            supplierOrders[supplier].items.push({
                ...item,
                product: product,
                itemTotal: itemTotal
            });
            supplierOrders[supplier].totalAmount += itemTotal;
        }

        // 4. 檢查各廠商是否達到配送額度 (正確的邏輯)
        const failedSuppliers = [];
        const successfulSuppliers = [];

        for (const [supplier, orderData] of Object.entries(supplierOrders)) {
            if (orderData.totalAmount < orderData.deliveryThreshold) {
                failedSuppliers.push({
                    supplier: supplier,
                    currentAmount: orderData.totalAmount,
                    requiredAmount: orderData.deliveryThreshold,
                    shortage: orderData.deliveryThreshold - orderData.totalAmount,
                    items: orderData.items.map(item => ({
                        name: item.product.name,
                        quantity: item.quantity,
                        unit: item.product.unit,
                        unitCost: item.product.unit_cost,
                        itemTotal: item.itemTotal
                    }))
                });
            } else {
                successfulSuppliers.push({
                    supplier: supplier,
                    totalAmount: orderData.totalAmount,
                    deliveryThreshold: orderData.deliveryThreshold,
                    surplus: orderData.totalAmount - orderData.deliveryThreshold,
                    items: orderData.items.map(item => ({
                        name: item.product.name,
                        quantity: item.quantity,
                        unit: item.product.unit,
                        unitCost: item.product.unit_cost,
                        itemTotal: item.itemTotal
                    }))
                });
            }
        }

        // 如果有廠商不符配送標準，返回詳細錯誤信息
        if (failedSuppliers.length > 0) {
            return res.status(400).json({
                success: false,
                message: '部分廠商訂單金額不足配送標準！',
                data: {
                    failed_suppliers: failedSuppliers,
                    successful_suppliers: successfulSuppliers,
                    summary: {
                        total_suppliers: Object.keys(supplierOrders).length,
                        failed_count: failedSuppliers.length,
                        successful_count: successfulSuppliers.length
                    },
                    suggestions: failedSuppliers.map(supplier => ({
                        supplier: supplier.supplier,
                        suggestion: `需要再增加 $${supplier.shortage} 才能達到配送標準`
                    }))
                }
            });
        }

        // 5. 全部廠商都符合配送標準，開始處理訂單
        await database.run('BEGIN TRANSACTION');

        try {
            const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;
            const orderResults = [];

            // 6. 逐一處理每個商品
            for (const item of items) {
                const product = productDetails[item.product_id];

                // 扣減庫存
                await database.run(
                    'UPDATE products SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [item.quantity, item.product_id]
                );

                // 記錄庫存異動
                await database.run(`
                    INSERT INTO inventory_transactions (
                        uuid, product_id, transaction_type, quantity, reason,
                        reference_no, performed_by, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    uuidv4(), item.product_id, 'outbound', item.quantity,
                    `批量叫貨 - 廠商配送`,
                    orderNumber, req.user.id,
                    `自動扣減庫存 - 分店ID: ${store_id}, 廠商: ${product.supplier}`
                ]);

                // 創建訂單記錄
                const orderResult = await database.run(`
                    INSERT INTO orders (
                        uuid, order_number, product_id, requested_quantity, approved_quantity,
                        unit_cost, total_cost, status, urgency, reason, requested_by,
                        approved_by, approved_date, delivery_date, supplier, store_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    uuidv4(), `${orderNumber}-${item.product_id}`, item.product_id, 
                    item.quantity, item.quantity, product.unit_cost, 
                    product.unit_cost * item.quantity, 'approved', 'normal', 
                    '批量叫貨申請', req.user.id, req.user.id, 
                    new Date().toISOString(), delivery_date || new Date().toISOString(), 
                    product.supplier, store_id
                ]);

                orderResults.push({
                    product_id: item.product_id,
                    product_name: product.name,
                    quantity: item.quantity,
                    unit_cost: product.unit_cost,
                    total_cost: product.unit_cost * item.quantity,
                    supplier: product.supplier,
                    order_id: orderResult.lastID
                });
            }

            await database.run('COMMIT');

            // 7. 返回成功結果
            res.json({
                success: true,
                message: '批量叫貨申請成功！',
                data: {
                    order_number: orderNumber,
                    total_items: items.length,
                    supplier_summary: successfulSuppliers,
                    order_details: orderResults,
                    delivery_date: delivery_date || new Date().toISOString(),
                    notes: notes
                }
            });

        } catch (error) {
            await database.run('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('批量叫貨處理錯誤:', error);
        res.status(500).json({
            success: false,
            message: '批量叫貨處理失敗',
            error: error.message
        });
    }
});

// 配送額度檢查API (不實際下單，僅檢查)
router.post('/orders/check-delivery', authenticateToken, async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: '請提供有效的商品清單'
            });
        }

        const supplierOrders = {};

        // 按廠商分組計算金額
        for (const item of items) {
            const products = await database.all(
                'SELECT * FROM products WHERE id = ? AND is_active = 1',
                [item.product_id]
            );

            if (products.length === 0) continue;

            const product = products[0];
            const supplier = product.supplier || '未指定廠商';
            
            if (!supplierOrders[supplier]) {
                supplierOrders[supplier] = {
                    items: [],
                    totalAmount: 0,
                    deliveryThreshold: product.delivery_threshold || 1000
                };
            }

            const itemTotal = product.unit_cost * item.quantity;
            supplierOrders[supplier].items.push({
                name: product.name,
                quantity: item.quantity,
                unit: product.unit,
                unitCost: product.unit_cost,
                itemTotal: itemTotal
            });
            supplierOrders[supplier].totalAmount += itemTotal;
        }

        // 分析配送狀況
        const deliveryAnalysis = [];
        for (const [supplier, orderData] of Object.entries(supplierOrders)) {
            const canDeliver = orderData.totalAmount >= orderData.deliveryThreshold;
            
            deliveryAnalysis.push({
                supplier: supplier,
                totalAmount: orderData.totalAmount,
                deliveryThreshold: orderData.deliveryThreshold,
                canDeliver: canDeliver,
                difference: canDeliver ? 
                    orderData.totalAmount - orderData.deliveryThreshold : 
                    orderData.deliveryThreshold - orderData.totalAmount,
                status: canDeliver ? '✅ 可配送' : '❌ 金額不足',
                items: orderData.items
            });
        }

        res.json({
            success: true,
            message: '配送額度檢查完成',
            data: {
                total_suppliers: deliveryAnalysis.length,
                can_deliver_count: deliveryAnalysis.filter(s => s.canDeliver).length,
                cannot_deliver_count: deliveryAnalysis.filter(s => !s.canDeliver).length,
                suppliers: deliveryAnalysis
            }
        });

    } catch (error) {
        console.error('配送檢查錯誤:', error);
        res.status(500).json({
            success: false,
            message: '配送檢查失敗',
            error: error.message
        });
    }
});

module.exports = router;