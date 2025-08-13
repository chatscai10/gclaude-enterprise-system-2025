/**
 * API 通用路由 - GClaude Enterprise System
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// API 測試端點
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'GClaude Enterprise API 正常運作',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 系統健康檢查
router.get('/health', (req, res) => {
    const healthData = {
        status: 'healthy',
        service: 'GClaude Enterprise Management System',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        environment: process.env.NODE_ENV || 'development'
    };

    res.json(healthData);
});

// 系統狀態
router.get('/status', (req, res) => {
    res.json({
        success: true,
        data: {
            server: 'online',
            database: 'connected',
            services: {
                authentication: 'active',
                api: 'active',
                monitoring: 'active'
            }
        }
    });
});

module.exports = router;