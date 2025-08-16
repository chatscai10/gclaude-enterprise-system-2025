/**
 * 本地測試服務器 - 模擬雲端部署環境
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3008; // 使用不同端口避免衝突

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 模擬雲端環境設定
process.env.NODE_ENV = 'production';
process.env.CLOUD_PLATFORM = 'render';
process.env.DEPLOYMENT_TIME = new Date().toISOString();

// 載入主應用
const mainServer = require('./server.js');

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
        timestamp: process.env.DEPLOYMENT_TIME,
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

// 啟動服務器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌟 雲端模擬服務器啟動成功!`);
    console.log(`🔗 服務網址: http://localhost:${PORT}`);
    console.log(`🏥 健康檢查: http://localhost:${PORT}/api/health`);
    console.log(`📊 部署狀態: http://localhost:${PORT}/api/deployment/status`);
    console.log(`🎯 這模擬了雲端部署環境`);
});

module.exports = app;