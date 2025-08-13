/**
 * 日誌系統 - GClaude Enterprise System
 * 基於 Winston 的統一日誌管理
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 確保日誌目錄存在
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// 定義日誌格式
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            logMessage += ` ${JSON.stringify(meta)}`;
        }
        
        return logMessage;
    })
);

// 創建 Winston Logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
        service: 'gclaude-enterprise-system'
    },
    transports: [
        // 錯誤日誌文件
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            tailable: true
        }),
        
        // 組合日誌文件
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 10,
            tailable: true
        }),
        
        // 應用日誌文件
        new winston.transports.File({
            filename: path.join(logDir, 'app.log'),
            level: 'info',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 7,
            tailable: true
        })
    ],
    
    // 未捕獲異常處理
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, 'exceptions.log')
        })
    ],
    
    // 未處理的 Promise 拒絕
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, 'rejections.log')
        })
    ]
});

// 開發環境添加控制台輸出
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level}]: ${message}`;
            })
        )
    }));
}

// 擴展日誌功能
const extendedLogger = {
    ...logger,
    
    // API 請求日誌
    apiRequest: (req, res, duration) => {
        logger.info('API Request', {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            user: req.user ? req.user.username : 'anonymous'
        });
    },
    
    // API 錯誤日誌
    apiError: (req, error) => {
        logger.error('API Error', {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            error: error.message,
            stack: error.stack,
            user: req.user ? req.user.username : 'anonymous'
        });
    },
    
    // 安全事件日誌
    security: (event, details = {}) => {
        logger.warn('Security Event', {
            event,
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // 業務邏輯日誌
    business: (action, details = {}) => {
        logger.info('Business Action', {
            action,
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // 系統監控日誌
    monitor: (metric, value, details = {}) => {
        logger.info('System Monitor', {
            metric,
            value,
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // 用戶行為日誌
    userAction: (userId, action, details = {}) => {
        logger.info('User Action', {
            userId,
            action,
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // 部署相關日誌
    deployment: (stage, status, details = {}) => {
        logger.info('Deployment', {
            stage,
            status,
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // 效能監控日誌
    performance: (operation, duration, details = {}) => {
        const level = duration > 5000 ? 'warn' : 'info';
        logger[level]('Performance', {
            operation,
            duration: `${duration}ms`,
            slow: duration > 5000,
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // Telegram 通知日誌
    telegram: (action, result, details = {}) => {
        logger.info('Telegram', {
            action,
            result,
            timestamp: new Date().toISOString(),
            ...details
        });
    },
    
    // 資料庫操作日誌
    database: (operation, table, details = {}) => {
        logger.info('Database', {
            operation,
            table,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
};

// 定期清理舊日誌文件
const cleanupLogs = () => {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30天
    const now = Date.now();
    
    fs.readdir(logDir, (err, files) => {
        if (err) return;
        
        files.forEach(file => {
            const filePath = path.join(logDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlink(filePath, (err) => {
                        if (!err) {
                            logger.info(`Cleaned up old log file: ${file}`);
                        }
                    });
                }
            });
        });
    });
};

// 每天清理一次舊日誌
setInterval(cleanupLogs, 24 * 60 * 60 * 1000);

// 應用啟動時記錄
extendedLogger.info('Logger initialized', {
    logLevel: process.env.LOG_LEVEL || 'info',
    environment: process.env.NODE_ENV || 'development',
    logDirectory: logDir
});

module.exports = extendedLogger;