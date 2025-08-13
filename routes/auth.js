/**
 * 認證路由 - GClaude Enterprise System
 * 提供多角色認證功能
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const logger = require('../utils/logger');

// 模擬用戶數據 (生產環境應從資料庫查詢)
const users = [
    {
        id: 1,
        username: 'admin',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RKWPGQyFu', // admin123
        name: '系統管理員',
        role: 'admin',
        position: '系統管理員',
        permissions: ['all']
    },
    {
        id: 2,
        username: 'manager',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RKWPGQyFu', // manager123
        name: '王店長',
        role: 'manager',
        position: '店長',
        permissions: ['management', 'reports']
    },
    {
        id: 3,
        username: 'employee',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RKWPGQyFu', // employee123
        name: '張員工',
        role: 'employee',
        position: '員工',
        permissions: ['basic']
    },
    {
        id: 4,
        username: 'intern',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RKWPGQyFu', // intern123
        name: '李實習生',
        role: 'intern',
        position: '實習生',
        permissions: ['limited']
    }
];

// 驗證中間件
const validateLogin = [
    body('username')
        .notEmpty()
        .withMessage('用戶名不能為空')
        .isLength({ min: 3, max: 50 })
        .withMessage('用戶名長度必須在3-50字符之間'),
    body('password')
        .notEmpty()
        .withMessage('密碼不能為空')
        .isLength({ min: 6 })
        .withMessage('密碼長度至少6字符')
];

// JWT Token 生成
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role,
            permissions: user.permissions
        },
        process.env.JWT_SECRET || 'gclaude-enterprise-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

// 用戶登入
router.post('/login', validateLogin, async (req, res) => {
    try {
        // 驗證輸入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '輸入驗證失敗',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;
        logger.info(`Login attempt for username: ${username}`);

        // 查找用戶
        const user = users.find(u => u.username === username);
        if (!user) {
            logger.warn(`Login failed - user not found: ${username}`);
            return res.status(401).json({
                success: false,
                message: '用戶名或密碼錯誤',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // 驗證密碼
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            logger.warn(`Login failed - invalid password for user: ${username}`);
            return res.status(401).json({
                success: false,
                message: '用戶名或密碼錯誤',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // 生成 Token
        const token = generateToken(user);

        // 返回成功結果
        const userInfo = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            position: user.position,
            permissions: user.permissions
        };

        logger.info(`Login successful for user: ${username}, role: ${user.role}`);

        res.json({
            success: true,
            message: '登入成功',
            token: token,
            user: userInfo,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: '登入過程中發生錯誤',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Token 驗證
router.post('/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未提供認證令牌',
                code: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gclaude-enterprise-secret-key');
        
        // 查找用戶詳細資訊
        const user = users.find(u => u.id === decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用戶不存在',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            message: 'Token驗證成功',
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                position: user.position,
                permissions: user.permissions
            },
            tokenExpiry: new Date(decoded.exp * 1000).toISOString()
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token已過期',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '無效的Token',
                code: 'INVALID_TOKEN'
            });
        }

        logger.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Token驗證過程中發生錯誤'
        });
    }
});

// 獲取用戶資料
router.get('/profile', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未提供認證令牌'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gclaude-enterprise-secret-key');
        const user = users.find(u => u.id === decoded.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用戶不存在'
            });
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                position: user.position,
                permissions: user.permissions,
                lastLogin: new Date().toISOString() // 實際應從資料庫獲取
            }
        });

    } catch (error) {
        logger.error('Profile retrieval error:', error);
        res.status(401).json({
            success: false,
            message: 'Token無效或已過期'
        });
    }
});

// 用戶登出
router.post('/logout', (req, res) => {
    // 前端應該刪除Token，後端可以維護黑名單（可選）
    res.json({
        success: true,
        message: '登出成功',
        timestamp: new Date().toISOString()
    });
});

// 密碼重設請求
router.post('/reset-password', [
    body('username').notEmpty().withMessage('用戶名不能為空')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: '輸入驗證失敗',
            errors: errors.array()
        });
    }

    const { username } = req.body;
    const user = users.find(u => u.username === username);
    
    if (!user) {
        // 即使用戶不存在，也返回成功消息（安全考慮）
        return res.json({
            success: true,
            message: '如果該用戶存在，重設密碼的說明已發送到相關聯絡方式'
        });
    }

    // 這裡應該實現實際的密碼重設邏輯（發送郵件等）
    logger.info(`Password reset requested for user: ${username}`);
    
    res.json({
        success: true,
        message: '密碼重設請求已處理，請查收相關通知'
    });
});

module.exports = router;