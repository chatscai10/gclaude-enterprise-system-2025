/**
 * 認證中間件 - GClaude Enterprise System
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// JWT Token 驗證中間件
const authenticateToken = (req, res, next) => {
    try {
        // 從多個來源獲取 token
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7)
            : req.query.token || req.body.token;

        if (!token) {
            logger.security('Authentication failed', {
                reason: 'No token provided',
                ip: req.ip,
                url: req.originalUrl
            });
            
            return res.status(401).json({
                success: false,
                message: '需要提供認證令牌',
                code: 'NO_TOKEN'
            });
        }

        // 驗證 token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gclaude-enterprise-secret-key');
        
        // 將用戶資訊添加到請求對象
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
            permissions: decoded.permissions || []
        };

        logger.userAction(req.user.id, 'authenticated_request', {
            url: req.originalUrl,
            method: req.method,
            role: req.user.role
        });

        next();

    } catch (error) {
        let errorCode = 'TOKEN_ERROR';
        let message = 'Token 驗證失敗';

        if (error.name === 'TokenExpiredError') {
            errorCode = 'TOKEN_EXPIRED';
            message = 'Token 已過期，請重新登入';
        } else if (error.name === 'JsonWebTokenError') {
            errorCode = 'INVALID_TOKEN';
            message = 'Token 無效';
        }

        logger.security('Token verification failed', {
            error: error.message,
            errorType: error.name,
            ip: req.ip,
            url: req.originalUrl
        });

        return res.status(401).json({
            success: false,
            message,
            code: errorCode
        });
    }
};

// 角色權限檢查中間件
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '用戶未認證',
                    code: 'NOT_AUTHENTICATED'
                });
            }

            const userRole = req.user.role;
            
            // 管理員擁有所有權限
            if (userRole === 'admin') {
                return next();
            }

            // 檢查用戶角色是否在允許列表中
            if (!allowedRoles.includes(userRole)) {
                logger.security('Access denied', {
                    userId: req.user.id,
                    userRole,
                    requiredRoles: allowedRoles,
                    url: req.originalUrl,
                    ip: req.ip
                });

                return res.status(403).json({
                    success: false,
                    message: '權限不足，無法訪問此資源',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    required: allowedRoles,
                    current: userRole
                });
            }

            next();

        } catch (error) {
            logger.error('Role check error:', error);
            return res.status(500).json({
                success: false,
                message: '權限檢查過程中發生錯誤'
            });
        }
    };
};

// 權限檢查中間件
const requirePermission = (requiredPermissions) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '用戶未認證',
                    code: 'NOT_AUTHENTICATED'
                });
            }

            const userPermissions = req.user.permissions || [];
            
            // 檢查是否有 'all' 權限
            if (userPermissions.includes('all')) {
                return next();
            }

            // 檢查是否有所需權限
            const hasPermission = requiredPermissions.some(permission =>
                userPermissions.includes(permission)
            );

            if (!hasPermission) {
                logger.security('Permission denied', {
                    userId: req.user.id,
                    userPermissions,
                    requiredPermissions,
                    url: req.originalUrl,
                    ip: req.ip
                });

                return res.status(403).json({
                    success: false,
                    message: '缺少所需權限',
                    code: 'MISSING_PERMISSIONS',
                    required: requiredPermissions,
                    current: userPermissions
                });
            }

            next();

        } catch (error) {
            logger.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: '權限檢查過程中發生錯誤'
            });
        }
    };
};

// API 速率限制中間件
const createRateLimiter = (windowMs, max, message) => {
    const requests = new Map();

    return (req, res, next) => {
        const key = req.ip + (req.user ? `_${req.user.id}` : '');
        const now = Date.now();
        const windowStart = now - windowMs;

        // 清理過期記錄
        const userRequests = requests.get(key) || [];
        const validRequests = userRequests.filter(time => time > windowStart);

        if (validRequests.length >= max) {
            logger.security('Rate limit exceeded', {
                ip: req.ip,
                userId: req.user ? req.user.id : null,
                requestCount: validRequests.length,
                limit: max,
                url: req.originalUrl
            });

            return res.status(429).json({
                success: false,
                message: message || 'API 請求過於頻繁，請稍後再試',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // 記錄當前請求
        validRequests.push(now);
        requests.set(key, validRequests);

        // 設置響應頭
        res.set({
            'X-RateLimit-Limit': max,
            'X-RateLimit-Remaining': Math.max(0, max - validRequests.length),
            'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
        });

        next();
    };
};

// 可選認證中間件（不強制需要 token）
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7)
        : req.query.token || req.body.token;

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gclaude-enterprise-secret-key');
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
            permissions: decoded.permissions || []
        };
    } catch (error) {
        // Token 無效但不阻止請求
        logger.warn('Optional auth failed', {
            error: error.message,
            ip: req.ip
        });
    }

    next();
};

// 檢查用戶是否為資源擁有者
const requireOwnership = (req, res, next) => {
    const resourceUserId = parseInt(req.params.userId || req.params.id);
    const currentUserId = req.user ? req.user.id : null;

    // 管理員可以訪問所有資源
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    // 用戶只能訪問自己的資源
    if (currentUserId !== resourceUserId) {
        logger.security('Ownership check failed', {
            currentUserId,
            resourceUserId,
            url: req.originalUrl,
            ip: req.ip
        });

        return res.status(403).json({
            success: false,
            message: '只能訪問自己的資源',
            code: 'NOT_RESOURCE_OWNER'
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    requireRole,
    requirePermission,
    createRateLimiter,
    optionalAuth,
    requireOwnership
};