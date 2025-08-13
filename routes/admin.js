/**
 * 管理員路由 - GClaude Enterprise System
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 模擬數據
const mockStats = {
    totalEmployees: 25,
    activeEmployees: 23,
    totalRevenue: 1250000,
    monthlyGrowth: 8.5,
    pendingTasks: 12,
    systemHealth: 'excellent'
};

const mockInventory = [
    { id: 1, name: '筆記型電腦', quantity: 15, status: '正常' },
    { id: 2, name: '辦公椅', quantity: 25, status: '正常' },
    { id: 3, name: '投影機', quantity: 3, status: '維修中' }
];

// 管理員統計資料
router.get('/stats', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
    try {
        logger.business('Admin stats requested', { userId: req.user.id });
        
        res.json({
            success: true,
            data: mockStats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Get admin stats error:', error);
        res.status(500).json({
            success: false,
            message: '獲取統計資料失敗'
        });
    }
});

// 庫存管理
router.get('/inventory', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
    try {
        res.json({
            success: true,
            data: mockInventory,
            total: mockInventory.length
        });
    } catch (error) {
        logger.error('Get inventory error:', error);
        res.status(500).json({
            success: false,
            message: '獲取庫存資料失敗'
        });
    }
});

// 營收管理
router.get('/revenue', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
    try {
        const mockRevenue = [
            { date: '2025-08-01', amount: 50000, store: '台北店' },
            { date: '2025-08-02', amount: 45000, store: '台中店' },
            { date: '2025-08-03', amount: 52000, store: '高雄店' }
        ];

        res.json({
            success: true,
            data: mockRevenue,
            total: mockRevenue.length,
            totalAmount: mockRevenue.reduce((sum, r) => sum + r.amount, 0)
        });
    } catch (error) {
        logger.error('Get revenue error:', error);
        res.status(500).json({
            success: false,
            message: '獲取營收資料失敗'
        });
    }
});

module.exports = router;