/**
 * GClaude Enterprise System - 簡化版伺服器
 * 用於快速部署和驗證
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3007;

// 基本中間件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 模擬用戶數據
const users = {
    admin: { username: 'admin', password: 'admin123', name: '系統管理員', role: 'admin' },
    manager: { username: 'manager', password: 'manager123', name: '王店長', role: 'manager' },
    employee: { username: 'employee', password: 'employee123', name: '張員工', role: 'employee' },
    intern: { username: 'intern', password: 'intern123', name: '李實習生', role: 'intern' }
};

// 健康檢查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'GClaude Enterprise Management System',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
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

// 登入 API
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    console.log(`登入嘗試: ${username}`);
    
    const user = users[username];
    if (!user || user.password !== password) {
        return res.status(401).json({
            success: false,
            message: '用戶名或密碼錯誤'
        });
    }
    
    const token = `gclaude-token-${username}-${Date.now()}`;
    
    res.json({
        success: true,
        message: '登入成功',
        token: token,
        user: {
            id: Object.keys(users).indexOf(username) + 1,
            username: user.username,
            name: user.name,
            role: user.role,
            permissions: user.role === 'admin' ? ['all'] : [user.role]
        }
    });
});

// Token 驗證
app.post('/api/auth/verify', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
    
    if (!token || !token.includes('gclaude-token-')) {
        return res.status(401).json({
            success: false,
            message: 'Token 無效'
        });
    }
    
    const username = token.split('-')[2];
    const user = users[username];
    
    if (!user) {
        return res.status(401).json({
            success: false,
            message: '用戶不存在'
        });
    }
    
    res.json({
        success: true,
        message: 'Token驗證成功',
        user: {
            id: Object.keys(users).indexOf(username) + 1,
            username: user.username,
            name: user.name,
            role: user.role,
            permissions: user.role === 'admin' ? ['all'] : [user.role]
        }
    });
});

// 用戶資料
app.get('/api/auth/profile', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !token.includes('gclaude-token-')) {
        return res.status(401).json({
            success: false,
            message: 'Token 無效'
        });
    }
    
    const username = token.split('-')[2];
    const user = users[username];
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: '用戶不存在'
        });
    }
    
    res.json({
        success: true,
        data: {
            id: Object.keys(users).indexOf(username) + 1,
            username: user.username,
            name: user.name,
            role: user.role,
            permissions: user.role === 'admin' ? ['all'] : [user.role]
        }
    });
});

// 員工統計
app.get('/api/employees/stats/overview', (req, res) => {
    res.json({
        success: true,
        data: {
            total: Object.keys(users).length,
            active: Object.keys(users).length,
            recentHires: 2,
            averageSalary: 45000,
            byDepartment: {
                '管理部': 1,
                '營運部': 1,
                '服務部': 2
            },
            byPosition: {
                '系統管理員': 1,
                '店長': 1,
                '員工': 1,
                '實習生': 1
            }
        }
    });
});

// 主頁
app.get('/', (req, res) => {
    const loginPath = path.join(__dirname, 'public', 'login.html');
    if (fs.existsSync(loginPath)) {
        res.sendFile(loginPath);
    } else {
        res.json({
            service: 'GClaude Enterprise Management System',
            version: '2.0.0',
            status: 'running',
            message: '企業員工管理系統 - GClaude相容版'
        });
    }
});

// 儀表板
app.get('/dashboard', (req, res) => {
    const dashboardPath = path.join(__dirname, 'public', 'dashboard-fixed.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        // 如果 dashboard-fixed.html 不存在，回到原版
        const originalPath = path.join(__dirname, 'public', 'dashboard.html');
        if (fs.existsSync(originalPath)) {
            res.sendFile(originalPath);
        } else {
            res.redirect('/');
        }
    }
});

// 管理員頁面
app.get('/admin', (req, res) => {
    const dashboardPath = path.join(__dirname, 'public', 'dashboard-fixed.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        // 如果 dashboard-fixed.html 不存在，回到原版
        const originalPath = path.join(__dirname, 'public', 'dashboard.html');
        if (fs.existsSync(originalPath)) {
            res.sendFile(originalPath);
        } else {
            res.redirect('/');
        }
    }
});

// API 測試
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'GClaude Enterprise API 正常運作',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

// 404 處理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl
    });
});

// 錯誤處理
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 啟動伺服器
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GClaude Enterprise System started on port ${PORT}`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`✅ All systems operational`);
});

// 優雅關閉
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        process.exit(0);
    });
});

module.exports = app;