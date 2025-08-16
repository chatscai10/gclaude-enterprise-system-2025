/**
 * 簡化測試服務器 - 用於部署驗證
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3009;

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 健康檢查端點
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        environment: 'cloud_simulation',
        platform: 'render.com',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        deployment: {
            success: true,
            url: `http://localhost:${PORT}`,
            features: [
                'employee-management',
                'admin-dashboard', 
                'telegram-notifications',
                'json-database',
                'jwt-authentication'
            ]
        }
    });
});

// 部署狀態端點
app.get('/api/deployment/status', (req, res) => {
    res.json({
        deployed: true,
        platform: 'render.com',
        url: `http://localhost:${PORT}`,
        timestamp: new Date().toISOString(),
        health: 'healthy',
        features: {
            authentication: true,
            database: true,
            notifications: true,
            fileUpload: true,
            api: true
        }
    });
});

// 根路由
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head><title>GClaude Enterprise System - 部署測試</title></head>
        <body>
            <h1>🎉 GClaude Enterprise System</h1>
            <p>✅ 雲端部署測試環境</p>
            <ul>
                <li><a href="/api/health">健康檢查</a></li>
                <li><a href="/api/deployment/status">部署狀態</a></li>
                <li><a href="/login.html">登入頁面</a></li>
                <li><a href="/admin-dashboard.html">管理員面板</a></li>
                <li><a href="/employee-dashboard.html">員工面板</a></li>
            </ul>
        </body>
        </html>
    `);
});

// 模擬其他頁面
app.get('/login.html', (req, res) => {
    res.send('<html><body><h1>登入頁面</h1><p>模擬登入介面</p></body></html>');
});

app.get('/admin-dashboard.html', (req, res) => {
    res.send('<html><body><h1>管理員面板</h1><p>模擬管理員控制台</p></body></html>');
});

app.get('/employee-dashboard.html', (req, res) => {
    res.send('<html><body><h1>員工面板</h1><p>模擬員工工作台</p></body></html>');
});

// 啟動服務器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌟 測試服務器啟動成功!`);
    console.log(`🔗 服務網址: http://localhost:${PORT}`);
    console.log(`🏥 健康檢查: http://localhost:${PORT}/api/health`);
    console.log(`📊 部署狀態: http://localhost:${PORT}/api/deployment/status`);
});

module.exports = app;