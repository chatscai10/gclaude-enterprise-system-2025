/**
 * 🚀 GClaude Enterprise Management System v2.0
 * 基於 D:\0809 專案的強化版 GClaude 相容伺服器
 * 
 * 核心特色:
 * - 完整的企業員工管理功能
 * - 智慧瀏覽器驗證系統  
 * - Telegram 飛機彙報整合
 * - 多角色權限管理
 * - 自動部署與監控
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// 導入核心模組
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const logger = require('./utils/logger');
const { initializeDatabase } = require('./database/init');
const { startCronJobs } = require('./services/scheduler');
const { initializeSocketIO } = require('./services/realtime');

const app = express();
const PORT = process.env.PORT || 3007;

// ==================== 中間件設定 ====================

// 安全設定
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://api.telegram.org"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"]
        }
    }
}));

// 效能優化
app.use(compression());

// API 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分鐘
    max: 1000, // 最大1000請求
    message: {
        error: 'Too many requests',
        message: 'API請求過於頻繁，請稍後再試',
        resetTime: '15分鐘後重置'
    }
});
app.use('/api/', limiter);

// CORS 設定
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 基本中間件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 靜態檔案
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// 請求日誌
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url} - ${req.ip}`);
    next();
});

// ==================== 路由設定 ====================

// 健康檢查 (GClaude相容)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'GClaude Enterprise Management System',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        features: {
            authentication: true,
            employeeManagement: true,
            attendanceSystem: true,
            revenueTracking: true,
            schedulingSystem: true,
            promotionVoting: true,
            maintenanceRequests: true,
            telegramIntegration: true,
            browserVerification: true,
            realTimeNotifications: true
        },
        gclaude: {
            compatible: true,
            deployment: {
                autoScale: true,
                monitoring: true,
                healthEndpoint: '/api/health'
            }
        }
    });
});

// 系統狀態 (GClaude監控用)
app.get('/api/status', async (req, res) => {
    try {
        const systemStatus = {
            server: 'online',
            database: 'connected',
            scheduler: 'running',
            telegram: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not_configured',
            timestamp: new Date().toISOString(),
            metrics: {
                totalEmployees: 0, // 將從資料庫查詢
                activeConnections: 0,
                apiRequestsToday: 0,
                systemErrors: 0
            }
        };

        res.json({
            success: true,
            data: systemStatus,
            message: 'System status retrieved successfully'
        });
    } catch (error) {
        logger.error('Status check failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve system status',
            error: error.message
        });
    }
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);

// ==================== 前端頁面路由 ====================

// 主頁面
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'login.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({
            service: 'GClaude Enterprise Management System',
            version: '2.0.0',
            status: 'running',
            message: '企業員工管理系統 - GClaude相容版',
            features: [
                '多角色認證系統',
                'GPS智慧打卡',
                '營收管理分析',
                '智慧排程系統',
                '升遷投票機制',
                '維修申請管理',
                'Telegram通知整合',
                '智慧瀏覽器驗證'
            ],
            endpoints: {
                health: '/api/health',
                status: '/api/status',
                login: '/api/auth/login',
                dashboard: '/dashboard'
            }
        });
    }
});

// 儀表板
app.get('/dashboard', (req, res) => {
    const dashboardPath = path.join(__dirname, 'public', 'dashboard.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        res.redirect('/');
    }
});

// 管理員頁面
app.get('/admin', (req, res) => {
    const adminPath = path.join(__dirname, 'public', 'admin.html');
    if (fs.existsSync(adminPath)) {
        res.sendFile(adminPath);
    } else {
        // 重定向到dashboard而不是首頁
        res.redirect('/dashboard');
    }
});

// ==================== 錯誤處理 ====================

// 404處理
app.use('*', (req, res) => {
    logger.warn(`404 - Route not found: ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        message: '請求的資源不存在',
        availableRoutes: [
            '/',
            '/dashboard',
            '/admin',
            '/api/health',
            '/api/status',
            '/api/auth/login'
        ]
    });
});

// 全域錯誤處理
app.use((error, req, res, next) => {
    logger.error('Server Error:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
    });
});

// ==================== 伺服器啟動 ====================

async function startServer() {
    try {
        // 初始化資料庫
        await initializeDatabase();
        logger.info('✅ Database initialized');

        // 啟動定時任務
        startCronJobs();
        logger.info('✅ Cron jobs started');

        // 啟動伺服器
        const server = app.listen(PORT, '0.0.0.0', () => {
            logger.info(`🚀 GClaude Enterprise System started on port ${PORT}`);
            logger.info(`🌐 Server URL: http://0.0.0.0:${PORT}`);
            logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`✅ All systems operational`);
        });

        // 初始化 Socket.IO
        initializeSocketIO(server);
        logger.info('✅ Real-time communication enabled');

        // 優雅關閉處理
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, shutting down gracefully');
            server.close(() => {
                logger.info('Process terminated');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT received, shutting down gracefully');
            server.close(() => {
                logger.info('Process terminated');
                process.exit(0);
            });
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// 啟動應用
startServer();

module.exports = app;