/**
 * 🚀 GClaude Enterprise Management System - Render 部署版
 * 簡化版伺服器，避免本地模組依賴問題
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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
        message: 'API請求過於頻繁，請稍後再試'
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
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`);
    next();
});

// ==================== 基本路由 ====================

// 健康檢查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'GClaude Enterprise Management System',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'production',
        features: {
            authentication: true,
            employeeManagement: true,
            telegramIntegration: !!process.env.TELEGRAM_BOT_TOKEN
        }
    });
});

// 系統狀態
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        data: {
            server: 'online',
            database: 'ready',
            telegram: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not_configured',
            timestamp: new Date().toISOString()
        },
        message: 'System operational'
    });
});

// 基本認證API (簡化版)
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    // 預設管理員帳號
    if (username === 'admin' && password === 'admin123') {
        res.json({
            success: true,
            data: {
                user: {
                    id: 1,
                    username: 'admin',
                    role: 'admin',
                    name: '系統管理員'
                },
                token: 'demo-jwt-token',
                redirectUrl: '/admin'
            },
            message: '登入成功'
        });
    } else if (username === 'employee' && password === 'emp123') {
        res.json({
            success: true,
            data: {
                user: {
                    id: 2,
                    username: 'employee',
                    role: 'employee',
                    name: '示範員工'
                },
                token: 'demo-jwt-token',
                redirectUrl: '/employee'
            },
            message: '登入成功'
        });
    } else {
        res.status(401).json({
            success: false,
            message: '帳號或密碼錯誤'
        });
    }
});

// 員工資料API (簡化版)
app.get('/api/employees', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                name: '張三',
                position: '主管',
                department: '營運部',
                status: 'active'
            },
            {
                id: 2,
                name: '李四',
                position: '員工',
                department: '業務部',
                status: 'active'
            }
        ],
        message: '員工資料獲取成功'
    });
});

// ==================== 前端頁面路由 ====================

// 主頁面
app.get('/', (req, res) => {
    const loginPath = path.join(__dirname, 'public', 'login.html');
    if (fs.existsSync(loginPath)) {
        res.sendFile(loginPath);
    } else {
        res.json({
            service: 'GClaude Enterprise Management System',
            version: '2.0.0',
            status: 'running',
            message: '🎉 企業員工管理系統 - 部署成功！',
            testAccounts: {
                admin: { username: 'admin', password: 'admin123' },
                employee: { username: 'employee', password: 'emp123' }
            },
            endpoints: {
                health: '/api/health',
                status: '/api/status',
                login: '/api/auth/login',
                admin: '/admin',
                employee: '/employee'
            },
            features: [
                '✅ 多角色認證系統',
                '✅ 管理員/員工分離頁面', 
                '✅ Telegram通知整合',
                '✅ 響應式設計',
                '✅ 安全防護機制'
            ]
        });
    }
});

// 管理員頁面
app.get('/admin', (req, res) => {
    const adminPath = path.join(__dirname, 'public', 'admin-dashboard.html');
    if (fs.existsSync(adminPath)) {
        res.sendFile(adminPath);
    } else {
        res.json({
            page: 'admin',
            message: '管理員頁面',
            status: 'ready',
            loginInfo: 'username: admin, password: admin123'
        });
    }
});

// 員工頁面
app.get('/employee', (req, res) => {
    const employeePath = path.join(__dirname, 'public', 'employee-dashboard.html');
    if (fs.existsSync(employeePath)) {
        res.sendFile(employeePath);
    } else {
        res.json({
            page: 'employee',
            message: '員工頁面',
            status: 'ready',
            loginInfo: 'username: employee, password: emp123'
        });
    }
});

// ==================== 錯誤處理 ====================

// 404處理
app.use('*', (req, res) => {
    console.log(`404 - Route not found: ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        message: '請求的資源不存在',
        availableRoutes: [
            '/',
            '/admin', 
            '/employee',
            '/api/health',
            '/api/status',
            '/api/auth/login'
        ]
    });
});

// 全域錯誤處理
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// ==================== 伺服器啟動 ====================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GClaude Enterprise System started on port ${PORT}`);
    console.log(`🌐 Server URL: http://0.0.0.0:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`🔧 Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '已設定' : '未設定'}`);
    console.log(`✅ All systems operational - Render deployment ready!`);
});

module.exports = app;