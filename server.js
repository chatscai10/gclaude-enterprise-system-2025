/**
 * 🚀 GClaude Enterprise Management System - Render 雲端部署版
 * 使用JSON檔案存儲，完全相容雲端環境
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();

// 使用JSON檔案資料庫而非SQLite
const DatabaseOperations = require('./database/json-database');

// Telegram通知系統
const TelegramNotifier = require('./modules/telegram-notifier');

const app = express();
const PORT = process.env.PORT || 4006;
const JWT_SECRET = process.env.JWT_SECRET || 'gclaude-enterprise-secret-key';

// 初始化資料庫和通知系統
const db = new DatabaseOperations();
const telegramNotifier = new TelegramNotifier();

// 配置multer用於檔案上傳
const storage = multer.memoryStorage(); // 使用記憶體存儲，雲端環境友好
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB限制
        files: 5 // 最多5個檔案
    },
    fileFilter: (req, file, cb) => {
        // 只允許圖片檔案
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只能上傳圖片檔案'), false);
        }
    }
});

// ==================== 中間件設定 ====================

// 安全設定
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            styleSrcElem: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://api.telegram.org"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"]
        }
    }
}));

// 修復：正確配置compression中間件
app.use(compression({
    filter: (req, res) => {
        // 不壓縮已經壓縮的內容
        if (req.headers['x-no-compression']) {
            return false;
        }
        // 使用compression的預設過濾器
        return compression.filter(req, res);
    },
    threshold: 1024, // 只壓縮大於1KB的回應
    level: 6 // 壓縮等級 (1-9, 6是平衡點)
}));

// API 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        error: 'Too many requests',
        message: 'API請求過於頻繁，請稍後再試'
    }
});
app.use('/api/', limiter);

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// ==================== JWT 認證中間件 ====================

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '存取令牌缺失'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: '存取令牌無效或已過期'
            });
        }
        req.user = user;
        next();
    });
}

// ==================== 基本路由 ====================

// 健康檢查
app.get('/api/health', async (req, res) => {
    try {
        const stats = await db.getDashboardStats();
        
        res.json({
            status: 'healthy',
            service: 'GClaude Enterprise Management System',
            version: '4.1.0',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'production',
            database: 'JSON File Database - Cloud Compatible',
            features: {
                authentication: true,
                employeeManagement: true,
                telegramIntegration: !!process.env.TELEGRAM_BOT_TOKEN,
                dataPersistence: true,
                cloudCompatible: true
            },
            stats
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ==================== 認證相關API ====================

// 員工註冊
app.post('/api/employee/register', async (req, res) => {
    try {
        const registrationData = req.body;
        
        // 驗證必填欄位
        const requiredFields = ['name', 'id_card', 'birth_date', 'gender', 'phone', 'address', 
                               'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation'];
        
        for (let field of requiredFields) {
            if (!registrationData[field] || registrationData[field].toString().trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: `請填寫 ${field}`
                });
            }
        }
        
        // 檢查身分證號是否已存在
        const existingEmployee = await db.getEmployeeByIdCard(registrationData.id_card);
        if (existingEmployee) {
            return res.status(409).json({
                success: false,
                message: '此身分證號已註冊過，請確認資料或聯繫管理員'
            });
        }
        
        // 檢查姓名是否已存在
        const existingName = await db.getEmployeeByName(registrationData.name);
        if (existingName) {
            return res.status(409).json({
                success: false,
                message: '此姓名已註冊過，請確認資料或聯繫管理員'
            });
        }
        
        // 新增員工資料
        const employeeData = {
            ...registrationData,
            status: 'pending', // 待審核狀態
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const result = await db.createEmployee(employeeData);
        
        // 發送 Telegram 通知給管理員
        try {
            await telegramNotifier.notifyEmployeeRegistration({
                name: registrationData.name,
                id_card: registrationData.id_card,
                phone: registrationData.phone,
                created_at: employeeData.created_at
            });
        } catch (notificationError) {
            console.error('員工註冊通知發送失敗:', notificationError);
        }
        
        res.status(201).json({
            success: true,
            data: { id: result.id },
            message: '員工註冊申請已提交，請等待管理員審核'
        });
        
    } catch (error) {
        console.error('員工註冊錯誤:', error);
        res.status(500).json({
            success: false,
            message: '註冊過程發生錯誤，請稍後再試'
        });
    }
});

// 用戶登入
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // 首先嘗試系統邏輯要求：姓名當帳號，身分證當密碼
        let user = await db.getUserByNameAndIdCard(username, password);
        
        // 如果姓名+身分證登入失敗，回退到舊的username系統（向後相容）
        if (!user) {
            user = await db.getUserByUsername(username);
            if (!user || password !== user.password) {
                return res.status(401).json({
                    success: false,
                    message: '帳號或密碼錯誤'
                });
            }
        }

        const token = jwt.sign(
            { 
                id: user.id,
                username: user.username,
                role: user.role,
                employee_id: user.employee_id,
                store_id: user.store_id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const redirectUrl = user.role === 'admin' ? '/admin' : '/employee';

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    name: user.employee_name,
                    store_name: user.store_name
                },
                token,
                redirectUrl
            },
            message: '登入成功'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: '登入過程發生錯誤'
        });
    }
});

// 員工專用登入端點
app.post('/api/employee/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: '請提供姓名和身分證號碼'
        });
    }
    
    try {
        // 使用系統邏輯要求：姓名當帳號，身分證當密碼
        const user = await db.getUserByNameAndIdCard(username, password);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '姓名或身分證號碼錯誤'
            });
        }
        
        // 檢查是否為員工角色
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: '請使用管理員登入頁面'
            });
        }

        const token = jwt.sign(
            { 
                id: user.id,
                username: user.username,
                role: user.role,
                employee_id: user.employee_id,
                store_id: user.store_id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    name: user.employee_name,
                    store_name: user.store_name
                },
                token,
                redirectUrl: '/employee-dashboard'
            },
            message: '員工登入成功'
        });

    } catch (error) {
        console.error('Employee login error:', error);
        res.status(500).json({
            success: false,
            message: '員工登入過程發生錯誤'
        });
    }
});

// 管理員專用登入端點
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: '請提供管理員帳號和密碼'
        });
    }
    
    try {
        // 管理員可以使用姓名+身分證或username+password
        let user = await db.getUserByNameAndIdCard(username, password);
        
        if (!user) {
            user = await db.getUserByUsername(username);
            if (!user || password !== user.password) {
                return res.status(401).json({
                    success: false,
                    message: '管理員帳號或密碼錯誤'
                });
            }
        }
        
        // 檢查是否為管理員角色
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '您沒有管理員權限，請使用員工登入'
            });
        }

        const token = jwt.sign(
            { 
                id: user.id,
                username: user.username,
                role: user.role,
                employee_id: user.employee_id,
                store_id: user.store_id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    name: user.employee_name || user.username,
                    store_name: user.store_name
                },
                token,
                redirectUrl: '/admin-dashboard'
            },
            message: '管理員登入成功'
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: '管理員登入過程發生錯誤'
        });
    }
});

// Token驗證 - 支援GET請求
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
        const user = await db.getUserByUsername(req.user.username);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用戶不存在'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    name: user.employee_name,
                    store_name: user.store_name
                }
            },
            message: 'Token有效'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Token驗證失敗'
        });
    }
});

// ==================== 員工管理API ====================

app.get('/api/employees', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const employees = await db.getAllEmployees();
        res.json({
            success: true,
            data: employees,
            message: '員工資料獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取員工資料失敗'
        });
    }
});

app.post('/api/employees', authenticateToken, async (req, res) => {
    try {
        const result = await db.createEmployee(req.body);
        res.json({
            success: true,
            data: { id: result.id, ...req.body },
            message: '員工新增成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '員工新增失敗: ' + error.message
        });
    }
});

app.put('/api/employees/:id', authenticateToken, async (req, res) => {
    try {
        await db.updateEmployee(req.params.id, req.body);
        res.json({
            success: true,
            data: { id: parseInt(req.params.id), ...req.body },
            message: '員工資料更新成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '員工資料更新失敗: ' + error.message
        });
    }
});

app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
    try {
        await db.deleteEmployee(req.params.id);
        res.json({
            success: true,
            message: `員工 ID ${req.params.id} 已成功刪除`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '員工刪除失敗: ' + error.message
        });
    }
});

// ==================== 出勤管理API ====================

app.get('/api/attendance/today', authenticateToken, async (req, res) => {
    try {
        const attendance = await db.getTodayAttendance(req.user.employee_id);
        res.json({
            success: true,
            data: attendance || {
                date: new Date().toISOString().split('T')[0],
                clock_in: null,
                clock_out: null,
                status: 'not_started'
            },
            message: '今日出勤狀態獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取出勤狀態失敗'
        });
    }
});

app.get('/api/attendance/history', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const history = await db.getAttendanceHistory(req.user.employee_id, limit);
        res.json({
            success: true,
            data: history,
            message: '出勤歷史獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取出勤歷史失敗'
        });
    }
});

app.post('/api/attendance/clock-in', authenticateToken, async (req, res) => {
    try {
        const { location, device_fingerprint, accuracy, gps_coords } = req.body;
        
        // 打卡資料
        const clockInData = {
            employee_id: req.user.employee_id,
            store_id: req.user.store_id,
            location: location || '系統位置',
            device_fingerprint: device_fingerprint || 'unknown',
            gps_accuracy: accuracy || null,
            latitude: gps_coords ? gps_coords.latitude : null,
            longitude: gps_coords ? gps_coords.longitude : null,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        };
        
        const result = await db.clockInWithGPS(clockInData);
        
        // 發送Telegram通知
        try {
            const attendanceData = {
                employee_name: req.user.name || '未知員工',
                store_name: req.user.store_name || '未知分店',
                clock_type: 'in',
                timestamp: new Date().toISOString(),
                location: location,
                gps_accuracy: accuracy,
                distance_meters: result.distance_meters,
                device_info: device_fingerprint ? device_fingerprint.substring(0, 16) + '...' : 'unknown'
            };
            
            // 檢查設備異常
            const deviceAnomalies = await db.checkDeviceAnomalies(req.user.employee_id, device_fingerprint);
            
            await telegramNotifier.notifyAttendance(attendanceData, deviceAnomalies);
        } catch (notificationError) {
            console.error('Telegram通知發送失敗:', notificationError);
            // 不影響主要打卡流程
        }
        
        res.json({
            success: true,
            data: {
                id: result.id,
                timestamp: new Date().toISOString(),
                time: new Date().toLocaleTimeString('zh-TW'),
                location: location || '系統位置',
                accuracy: accuracy,
                status: 'success'
            },
            message: '上班打卡成功！'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '上班打卡失敗: ' + error.message
        });
    }
});

app.post('/api/attendance/clock-out', authenticateToken, async (req, res) => {
    try {
        const { location, device_fingerprint, accuracy, gps_coords } = req.body;
        
        // 打卡資料
        const clockOutData = {
            employee_id: req.user.employee_id,
            location: location || '系統位置',
            device_fingerprint: device_fingerprint || 'unknown',
            gps_accuracy: accuracy || null,
            latitude: gps_coords ? gps_coords.latitude : null,
            longitude: gps_coords ? gps_coords.longitude : null,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        };
        
        const result = await db.clockOutWithGPS(clockOutData);
        
        // 發送Telegram通知
        try {
            const attendanceData = {
                employee_name: req.user.name || '未知員工',
                store_name: req.user.store_name || '未知分店',
                clock_type: 'out',
                timestamp: new Date().toISOString(),
                location: location,
                gps_accuracy: accuracy,
                device_info: device_fingerprint ? device_fingerprint.substring(0, 16) + '...' : 'unknown',
                work_hours: result.work_hours || null
            };
            
            // 檢查設備異常
            const deviceAnomalies = await db.checkDeviceAnomalies(req.user.employee_id, device_fingerprint);
            
            await telegramNotifier.notifyAttendance(attendanceData, deviceAnomalies);
        } catch (notificationError) {
            console.error('Telegram通知發送失敗:', notificationError);
            // 不影響主要打卡流程
        }
        
        res.json({
            success: true,
            data: {
                id: result.id,
                timestamp: new Date().toISOString(),
                time: new Date().toLocaleTimeString('zh-TW'),
                location: location || '系統位置',
                accuracy: accuracy,
                work_hours: result.work_hours,
                status: 'success'
            },
            message: '下班打卡成功！今日工作辛苦了！'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '下班打卡失敗: ' + error.message
        });
    }
});

// ==================== 營收管理API ====================

app.post('/api/revenue', authenticateToken, async (req, res) => {
    try {
        const revenueData = {
            employee_id: req.user.employee_id,
            store_id: req.user.store_id,
            category: req.body.category,
            item: req.body.item,
            amount: parseFloat(req.body.amount),
            customer_name: req.body.customer,
            revenue_date: new Date().toISOString().split('T')[0],
            notes: req.body.notes
        };
        
        const result = await db.createRevenue(revenueData);
        
        res.json({
            success: true,
            data: {
                id: result.id,
                ...revenueData,
                time: new Date().toLocaleTimeString('zh-TW'),
                status: 'pending'
            },
            message: '營收記錄新增成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '營收記錄新增失敗: ' + error.message
        });
    }
});

app.get('/api/revenue/employee', authenticateToken, async (req, res) => {
    try {
        const [revenueRecords, todayStats] = await Promise.all([
            db.getRevenueByEmployee(req.user.employee_id),
            db.getTodayRevenue(req.user.employee_id)
        ]);
        
        res.json({
            success: true,
            data: {
                today_total: todayStats.total || 0,
                today_breakdown: {
                    product_sales: todayStats.product_sales || 0,
                    service_income: todayStats.service_income || 0,
                    other: todayStats.other || 0
                },
                month_target: 500000,
                month_current: (todayStats.total || 0) * 20,
                month_progress: Math.round((todayStats.total || 0) * 20 / 500000 * 100),
                recent_records: revenueRecords
            },
            message: '營收資料獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取營收資料失敗'
        });
    }
});

// ==================== 維修申請API ====================

app.post('/api/maintenance', authenticateToken, upload.array('photos', 5), async (req, res) => {
    try {
        // 處理上傳的照片
        let photoData = [];
        if (req.files && req.files.length > 0) {
            photoData = req.files.map(file => ({
                filename: `maintenance_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.mimetype.split('/')[1]}`,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                data: file.buffer.toString('base64') // 轉換為Base64存儲
            }));
        }

        const maintenanceData = {
            employee_id: req.user.employee_id,
            store_id: req.user.store_id,
            equipment_type: req.body.equipment_type,
            title: req.body.title,
            description: req.body.description,
            location: req.body.location || '',
            contact_phone: req.body.contact_phone || '',
            priority: req.body.priority,
            photos: photoData
        };
        
        const result = await db.createMaintenanceWithPhotos(maintenanceData);
        
        // 發送Telegram通知
        try {
            const notificationData = {
                employee_name: req.user.name || '未知員工',
                store_name: req.user.store_name || '未知分店',
                equipment_type: req.body.equipment_type,
                title: req.body.title,
                description: req.body.description,
                location: req.body.location || '',
                priority: req.body.priority,
                contact_phone: req.body.contact_phone || '',
                photo_count: photoData.length,
                created_at: new Date().toISOString()
            };
            
            await telegramNotifier.notifyMaintenance(notificationData);
        } catch (notificationError) {
            console.error('Telegram維修通知發送失敗:', notificationError);
            // 不影響主要業務流程
        }
        
        res.json({
            success: true,
            data: {
                id: result.id,
                ...maintenanceData,
                status: 'pending',
                created_at: new Date().toISOString(),
                photo_count: photoData.length
            },
            message: '維修申請已提交，將於24小時內處理'
        });
    } catch (error) {
        console.error('維修申請提交失敗:', error);
        res.status(500).json({
            success: false,
            message: '維修申請提交失敗: ' + error.message
        });
    }
});

app.get('/api/maintenance/employee', authenticateToken, async (req, res) => {
    try {
        const maintenanceRecords = await db.getMaintenanceByEmployee(req.user.employee_id);
        res.json({
            success: true,
            data: maintenanceRecords,
            message: '維修記錄獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取維修記錄失敗'
        });
    }
});

// ==================== 請假申請API ====================

app.post('/api/leave-requests', authenticateToken, async (req, res) => {
    try {
        const leaveData = {
            employee_id: req.user.employee_id,
            leave_type: req.body.leave_type,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            days: calculateLeaveDays(req.body.start_date, req.body.end_date),
            reason: req.body.reason,
            substitute_id: req.body.substitute_id || null
        };
        
        const result = await db.createLeaveRequest(leaveData);
        
        res.json({
            success: true,
            data: {
                id: result.id,
                ...leaveData,
                status: 'pending',
                applied_at: new Date().toISOString()
            },
            message: '請假申請已提交，等待審核'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '請假申請提交失敗: ' + error.message
        });
    }
});

function calculateLeaveDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
}

// ==================== 儀表板統計API ====================

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await db.getDashboardStats();
        
        res.json({
            success: true,
            data: {
                totalEmployees: stats.employees.total_employees,
                activeEmployees: stats.employees.active_employees,
                newHires: stats.employees.new_hires,
                todayAttendance: Math.round((stats.attendance.checked_in / Math.max(stats.attendance.total_attendance, 1)) * 100),
                monthlyRevenue: stats.revenue.total_revenue || 0,
                pendingRequests: stats.maintenance.pending_maintenance,
                systemHealth: 98,
                recentActivities: [
                    { time: '09:30', action: '系統運行正常', type: 'system' },
                    { time: '09:15', action: '資料庫連接正常', type: 'database' },
                    { time: '09:00', action: '系統啟動完成', type: 'startup' }
                ]
            },
            message: '儀表板統計獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取統計數據失敗'
        });
    }
});

// ==================== 管理員專用API ====================

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '權限不足，需要管理員權限'
        });
    }
    next();
}

// 獲取所有出勤記錄（管理員用）
app.get('/api/admin/attendance', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const attendanceData = await db.readTable('attendance');
        
        // 按日期排序，取最近100筆記錄
        const sortedAttendance = attendanceData
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 100);

        // 為每筆記錄添加員工資訊
        const employees = await db.readTable('employees');
        const enrichedAttendance = sortedAttendance.map(record => {
            const employee = employees.find(emp => emp.id === record.employee_id);
            return {
                ...record,
                employee_name: employee ? employee.name : '未知員工',
                employee_position: employee ? employee.position : '未知職位'
            };
        });
        
        res.json({
            success: true,
            data: enrichedAttendance,
            message: '出勤記錄獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取出勤記錄失敗: ' + error.message
        });
    }
});

// ==================== 叫貨系統API ====================

// 獲取商品列表
app.get('/api/products', authenticateToken, async (req, res) => {
    try {
        const { category } = req.query;
        const products = await db.getProductsByCategory(category);
        
        res.json({
            success: true,
            data: products,
            message: '商品列表獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取商品列表失敗: ' + error.message
        });
    }
});

// 獲取庫存警告
app.get('/api/products/low-stock', authenticateToken, async (req, res) => {
    try {
        const lowStockProducts = await db.checkLowStockProducts();
        
        res.json({
            success: true,
            data: lowStockProducts,
            message: '庫存警告獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取庫存警告失敗: ' + error.message
        });
    }
});

// 創建叫貨訂單
app.post('/api/orders', authenticateToken, upload.array('photos', 10), async (req, res) => {
    try {
        // 處理上傳的照片
        let photoData = [];
        if (req.files && req.files.length > 0) {
            photoData = req.files.map(file => ({
                filename: `order_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.mimetype.split('/')[1]}`,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                buffer: file.buffer.toString('base64') // 轉為base64存儲
            }));
        }

        const { store_id, priority, needed_date, contact, items, photo_category, total_items, notes } = req.body;
        
        if (!store_id) {
            return res.status(400).json({
                success: false,
                message: '請選擇分店'
            });
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: '購物車不能為空'
            });
        }
        
        if (!needed_date || !contact) {
            return res.status(400).json({
                success: false,
                message: '請填寫到貨日期和聯絡人員'
            });
        }

        // 轉換新格式的商品項目為舊格式
        const formattedItems = items.map(item => ({
            product_name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            spec: item.spec,
            supplier: '待指定',
            unit_price: 0 // 價格由採購部門填寫
        }));

        const result = await db.createOrder(
            req.user.employee_id,
            store_id,
            formattedItems,
            notes || ''
        );

        // 發送Telegram通知
        try {
            const orderData = {
                created_at: new Date().toISOString(),
                employee_name: req.user.name || '未知員工',
                store_name: req.user.store_name || '未知分店',
                store_id: store_id,
                priority: priority,
                needed_date: needed_date,
                contact: contact,
                total_items: total_items,
                photo_category: photo_category,
                photo_count: photoData.length,
                items: formattedItems,
                notes: notes || ''
            };

            // 檢查進貨異常
            const anomalies = await db.checkOrderingAnomalies(store_id, formattedItems);
            
            await telegramNotifier.notifyOrdering(orderData, anomalies);
        } catch (notificationError) {
            console.error('Telegram通知發送失敗:', notificationError);
            // 不影響主要業務流程
        }

        res.json({
            success: true,
            data: {
                order_id: result.orderId,
                total_amount: result.totalAmount,
                low_stock_warnings: result.lowStockWarnings
            },
            message: result.message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '訂單創建失敗: ' + error.message
        });
    }
});

// 獲取員工訂單歷史
app.get('/api/orders/employee', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const orders = await db.getOrdersByEmployee(req.user.employee_id, limit);
        
        res.json({
            success: true,
            data: orders,
            message: '訂單歷史獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取訂單歷史失敗: ' + error.message
        });
    }
});

// 獲取異常偵測報告
app.get('/api/orders/anomalies', authenticateToken, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const anomalies = await db.detectOrderingAnomalies(req.user.employee_id, days);
        
        res.json({
            success: true,
            data: {
                anomalies,
                period_days: days,
                total_anomalies: anomalies.length,
                has_alerts: anomalies.some(a => a.severity === 'alert')
            },
            message: '異常偵測分析完成'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '異常偵測失敗: ' + error.message
        });
    }
});

// 管理員用：獲取所有訂單歷史
app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const orders = await db.getOrderHistory(limit);
        
        res.json({
            success: true,
            data: orders,
            message: '所有訂單歷史獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取訂單歷史失敗: ' + error.message
        });
    }
});

// 管理員審核叫貨訂單（新增）
app.post('/api/admin/orders/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { action, reason } = req.body; // action: 'approve' 或 'reject'
        
        const result = await db.updateOrderStatus(orderId, action, reason);
        
        res.json({
            success: true,
            data: result,
            message: `訂單已${action === 'approve' ? '批准' : '拒絕'}`
        });
    } catch (error) {
        console.error('處理訂單失敗:', error);
        res.status(500).json({
            success: false,
            message: '處理訂單失敗: ' + error.message
        });
    }
});

// 管理員查看庫存統計（新增）
app.get('/api/admin/inventory/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const products = await db.readTable('products');
        const orders = await db.readTable('orders');
        
        // 計算庫存統計
        const totalProducts = products.length;
        const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock).length;
        const outOfStockProducts = products.filter(p => p.current_stock === 0).length;
        
        // 本月訂單統計
        const currentMonth = new Date().toISOString().substring(0, 7);
        const monthlyOrders = orders.filter(o => o.created_at.startsWith(currentMonth));
        
        const stats = {
            inventory: {
                totalProducts,
                lowStockProducts,
                outOfStockProducts,
                stockValue: products.reduce((sum, p) => sum + (p.current_stock * p.cost_price || 0), 0)
            },
            orders: {
                monthlyTotal: monthlyOrders.length,
                pendingOrders: orders.filter(o => o.status === 'pending').length,
                approvedOrders: orders.filter(o => o.status === 'approved').length
            },
            lowStockList: products.filter(p => p.current_stock <= p.min_stock)
        };
        
        res.json({
            success: true,
            data: stats,
            message: '庫存統計獲取成功'
        });
    } catch (error) {
        console.error('獲取庫存統計失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取庫存統計失敗: ' + error.message
        });
    }
});

// 分店列表API (公共端點)
app.get('/api/stores', async (req, res) => {
    try {
        const stores = await db.getStores();
        res.json(stores);
    } catch (error) {
        console.error('獲取分店列表失敗:', error);
        res.status(500).json({ error: '獲取分店列表失敗' });
    }
});

// ==================== 升遷投票系統API ====================

// 獲取職位階級列表
app.get('/api/positions', authenticateToken, async (req, res) => {
    try {
        const positions = await db.getAllPositions();
        
        res.json({
            success: true,
            data: positions,
            message: '職位階級獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取職位階級失敗: ' + error.message
        });
    }
});

// 檢查員工是否可以發起升遷
// ==================== 管理員排班分配 API ====================

// 取得分店員工列表
app.get('/api/admin/employees', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const storeId = req.query.store;
        let employees = await db.getAllEmployees();
        
        if (storeId) {
            employees = employees.filter(emp => emp.store_id === storeId);
        }
        
        res.json({
            success: true,
            data: employees
        });
    } catch (error) {
        console.error('取得員工列表失敗:', error);
        res.status(500).json({
            success: false,
            message: '取得員工列表失敗'
        });
    }
});

// 取得分店列表
app.get('/api/admin/stores', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stores = await db.getAllStores();
        res.json({
            success: true,
            data: stores
        });
    } catch (error) {
        console.error('取得分店列表失敗:', error);
        res.status(500).json({
            success: false,
            message: '取得分店列表失敗'
        });
    }
});

// 取得指定月份排班資料
app.get('/api/admin/schedule/:year/:month', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { year, month } = req.params;
        const storeId = req.query.store;
        
        const scheduleData = await db.getScheduleData(year, month, storeId);
        
        res.json({
            success: true,
            data: scheduleData
        });
    } catch (error) {
        console.error('取得排班資料失敗:', error);
        res.status(500).json({
            success: false,
            message: '取得排班資料失敗'
        });
    }
});

// 儲存排班資料
app.post('/api/admin/schedule', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { store_id, year, month, schedule_data } = req.body;
        
        const result = await db.saveScheduleData({
            store_id,
            year,
            month,
            schedule_data,
            updated_by: req.user.id,
            updated_at: new Date().toISOString()
        });
        
        // 發送Telegram通知
        if (telegramNotifier) {
            await telegramNotifier.notifyScheduleUpdate({
                store_id,
                year,
                month,
                admin_name: req.user.name,
                total_assignments: Object.keys(schedule_data).length
            });
        }
        
        res.json({
            success: true,
            message: '排班資料儲存成功',
            data: result
        });
    } catch (error) {
        console.error('儲存排班資料失敗:', error);
        res.status(500).json({
            success: false,
            message: '儲存排班資料失敗'
        });
    }
});

// 智能排班分配
app.post('/api/admin/schedule/auto-assign', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { store_id, year, month } = req.body;
        
        // 取得分店員工和基本排班資料
        const employees = await db.getEmployeesByStore(store_id);
        const existingSchedule = await db.getScheduleData(year, month, store_id);
        
        // 智能分配邏輯
        const autoAssignedSchedule = await db.generateAutoSchedule({
            store_id,
            year,
            month,
            employees,
            existing_schedule: existingSchedule
        });
        
        res.json({
            success: true,
            message: '智能排班分配完成',
            data: {
                schedule_data: autoAssignedSchedule
            }
        });
    } catch (error) {
        console.error('智能排班分配失敗:', error);
        res.status(500).json({
            success: false,
            message: '智能排班分配失敗'
        });
    }
});

// ==================== 排班系統時間控制 API ====================

// 檢查排班系統狀態
app.get('/api/schedule/status', authenticateToken, async (req, res) => {
    try {
        const scheduleStatus = await db.getScheduleSystemStatus();
        
        res.json({
            success: true,
            data: scheduleStatus
        });
    } catch (error) {
        console.error('檢查排班系統狀態失敗:', error);
        res.status(500).json({
            success: false,
            message: '檢查排班系統狀態失敗'
        });
    }
});

// 獲取我的排班記錄
app.get('/api/schedule/my-schedule', authenticateToken, async (req, res) => {
    try {
        const mySchedule = await db.getEmployeeSchedule(req.user.employee_id);
        
        res.json({
            success: true,
            data: mySchedule
        });
    } catch (error) {
        console.error('獲取排班記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取排班記錄失敗'
        });
    }
});

// ==================== 升遷系統 API ====================

// 獲取職位階級列表
app.get('/api/promotion/position-levels', async (req, res) => {
    try {
        const positions = await db.getAllPositions();
        
        res.json({
            success: true,
            data: positions,
            message: '職位階級獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取職位階級失敗: ' + error.message
        });
    }
});

app.get('/api/promotion/check-eligibility', authenticateToken, async (req, res) => {
    try {
        const result = await db.canEmployeeStartPromotion(req.user.employee_id);
        
        res.json({
            success: true,
            data: result,
            message: result.canStart ? '可以發起升遷投票' : result.reason
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '檢查升遷資格失敗: ' + error.message
        });
    }
});

// 發起升遷投票
app.post('/api/promotion/start', authenticateToken, async (req, res) => {
    try {
        const result = await db.startPromotion(req.user.employee_id);
        
        // 發送Telegram通知
        try {
            if (result.promotion) {
                await telegramNotifier.notifyPromotionStart(result.promotion);
            }
        } catch (notificationError) {
            console.error('升遷投票通知發送失敗:', notificationError);
        }
        
        res.json({
            success: true,
            data: result,
            message: result.message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '發起升遷投票失敗: ' + error.message
        });
    }
});

// 獲取目前活躍的升遷投票
app.get('/api/promotion/active', authenticateToken, async (req, res) => {
    try {
        const activePromotions = await db.getActivePromotions();
        
        res.json({
            success: true,
            data: activePromotions,
            message: '活躍升遷投票獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取活躍升遷投票失敗: ' + error.message
        });
    }
});

// 投票
app.post('/api/promotion/:id/vote', authenticateToken, async (req, res) => {
    try {
        const { vote } = req.body;
        
        if (!['agree', 'disagree'].includes(vote)) {
            return res.status(400).json({
                success: false,
                message: '投票選項無效'
            });
        }

        const result = await db.castVote(req.params.id, req.user.employee_id, vote);
        
        res.json({
            success: true,
            data: result,
            message: result.message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '投票失敗: ' + error.message
        });
    }
});

// 獲取投票狀態
app.get('/api/promotion/:id/status', authenticateToken, async (req, res) => {
    try {
        const status = await db.getPromotionVotingStatus(req.params.id);
        
        res.json({
            success: true,
            data: status,
            message: '投票狀態獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取投票狀態失敗: ' + error.message
        });
    }
});

// 管理員用：完成投票（開票）
app.post('/api/admin/promotion/:id/complete', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.completePromotion(req.params.id);
        
        res.json({
            success: true,
            data: result,
            message: result.message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '完成投票失敗: ' + error.message
        });
    }
});

// 管理員查看所有升遷投票（新增）
app.get('/api/admin/promotions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const promotions = await db.readTable('promotions');
        const employees = await db.readTable('employees');
        const votes = await db.readTable('promotion_votes');
        
        // 為升遷記錄添加員工資訊和投票統計
        const enrichedPromotions = promotions.map(promotion => {
            const employee = employees.find(emp => emp.id === promotion.employee_id);
            const promotionVotes = votes.filter(vote => vote.promotion_id === promotion.id);
            
            const agreeVotes = promotionVotes.filter(vote => vote.vote === 'agree').length;
            const disagreeVotes = promotionVotes.filter(vote => vote.vote === 'disagree').length;
            const totalVotes = promotionVotes.length;
            
            return {
                ...promotion,
                employee_name: employee ? employee.name : '未知員工',
                employee_position: employee ? employee.position : '未知職位',
                voting_stats: {
                    agreeVotes,
                    disagreeVotes,
                    totalVotes,
                    agreeRate: totalVotes > 0 ? Math.round((agreeVotes / totalVotes) * 100) : 0
                }
            };
        });
        
        // 按狀態分類
        const activePromotions = enrichedPromotions.filter(p => p.status === 'active');
        const completedPromotions = enrichedPromotions.filter(p => p.status === 'completed');
        
        res.json({
            success: true,
            data: {
                all: enrichedPromotions,
                active: activePromotions,
                completed: completedPromotions,
                statistics: {
                    total: enrichedPromotions.length,
                    active: activePromotions.length,
                    completed: completedPromotions.length
                }
            },
            message: '升遷投票資料獲取成功'
        });
    } catch (error) {
        console.error('獲取升遷投票資料失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取升遷投票資料失敗: ' + error.message
        });
    }
});

// ==================== 排班系統API ====================

// 排班系統API路由
const scheduleAPI = require('./routes/schedule-api');
app.use('/api/schedule', scheduleAPI);

// 添加排班提交API別名，兼容前端調用
app.post('/api/schedule/submit', authenticateToken, async (req, res) => {
    try {
        // 重定向到實際的排班保存API
        const result = await db.saveSchedule(req.user.employee_id, req.body);
        res.json({
            success: true,
            data: result,
            message: '排班提交成功'
        });
    } catch (error) {
        console.error('排班提交錯誤:', error);
        res.status(500).json({
            success: false,
            message: '排班提交失敗'
        });
    }
});

// 添加營收提交API別名，兼容前端調用
app.post('/api/revenue/submit', authenticateToken, async (req, res) => {
    try {
        const revenueData = {
            employee_id: req.user.employee_id,
            amount: req.body.amount,
            description: req.body.description || req.body.note,
            date: req.body.date || new Date().toISOString().split('T')[0],
            time: req.body.time || new Date().toTimeString().slice(0, 8),
            category: req.body.category || 'general',
            payment_method: req.body.payment_method || 'cash',
            store_id: req.user.store_id || 1
        };
        
        const result = await db.addRevenue(revenueData);
        res.json({
            success: true,
            data: result,
            message: '營收記錄提交成功'
        });
    } catch (error) {
        console.error('營收提交錯誤:', error);
        res.status(500).json({
            success: false,
            message: '營收提交失敗'
        });
    }
});

// 獲取排班設定和狀態
app.get('/api/schedule/settings', authenticateToken, async (req, res) => {
    try {
        const settings = await db.getScheduleSettings();
        const canAccess = await db.canAccessScheduleSystem(req.user.employee_id);
        
        res.json({
            success: true,
            data: {
                settings,
                canAccess
            },
            message: '排班設定獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取排班設定失敗: ' + error.message
        });
    }
});

// 進入排班系統
app.post('/api/schedule/enter', authenticateToken, async (req, res) => {
    try {
        const result = await db.enterScheduleSystem(req.user.employee_id);
        
        res.json({
            success: true,
            data: result,
            message: '成功進入排班系統'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '進入排班系統失敗: ' + error.message
        });
    }
});

// 退出排班系統
app.post('/api/schedule/exit', authenticateToken, async (req, res) => {
    try {
        const result = await db.exitScheduleSystem(req.user.employee_id);
        
        res.json({
            success: true,
            data: result,
            message: result.success ? '已退出排班系統' : result.reason
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '退出排班系統失敗: ' + error.message
        });
    }
});

// 獲取我的排班記錄
app.get('/api/schedule/my-schedule', authenticateToken, async (req, res) => {
    try {
        const settings = await db.getScheduleSettings();
        const schedule = await db.getEmployeeSchedule(req.user.employee_id, settings.schedule_month);
        
        res.json({
            success: true,
            data: {
                schedule,
                settings
            },
            message: '排班記錄獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取排班記錄失敗: ' + error.message
        });
    }
});

// 保存排班
app.post('/api/schedule/save', authenticateToken, async (req, res) => {
    try {
        const { leaveDates } = req.body;
        
        if (!Array.isArray(leaveDates)) {
            return res.status(400).json({
                success: false,
                message: '休假日期格式錯誤'
            });
        }

        const result = await db.saveEmployeeSchedule(req.user.employee_id, { leaveDates });
        
        // 發送Telegram通知
        try {
            const scheduleData = {
                employee_name: req.user.name || '未知員工',
                store_name: req.user.store_name || '未知分店',
                leave_dates: leaveDates
            };
            
            await telegramNotifier.notifyScheduleCompleted(scheduleData);
        } catch (notificationError) {
            console.error('排班完成通知發送失敗:', notificationError);
        }
        
        res.json({
            success: true,
            data: result,
            message: '排班保存成功'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '排班保存失敗: ' + error.message
        });
    }
});

// 獲取月份排班統計
app.get('/api/schedule/month-stats', authenticateToken, async (req, res) => {
    try {
        const { month } = req.query;
        const settings = await db.getScheduleSettings();
        const targetMonth = month || settings.schedule_month;
        
        const schedules = await db.getMonthSchedules(targetMonth);
        
        // 統計每日休假人數
        const dailyStats = {};
        schedules.forEach(schedule => {
            schedule.leave_dates.forEach(date => {
                if (!dailyStats[date]) {
                    dailyStats[date] = 0;
                }
                dailyStats[date]++;
            });
        });
        
        res.json({
            success: true,
            data: {
                schedules,
                dailyStats,
                totalEmployees: schedules.length,
                settings
            },
            message: '月份排班統計獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取月份排班統計失敗: ' + error.message
        });
    }
});

// 作廢我的排班（只能作廢自己的）
app.delete('/api/schedule/my-schedule', authenticateToken, async (req, res) => {
    try {
        const settings = await db.getScheduleSettings();
        const result = await db.deleteEmployeeSchedule(req.user.employee_id, settings.schedule_month);
        
        res.json({
            success: true,
            data: result,
            message: '排班記錄已作廢'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '作廢排班記錄失敗: ' + error.message
        });
    }
});

// 管理員用：更新排班設定
app.put('/api/admin/schedule/settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.updateScheduleSettings(req.body);
        
        res.json({
            success: true,
            data: result,
            message: '排班設定更新成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '更新排班設定失敗: ' + error.message
        });
    }
});

// 退出排班系統
app.post('/api/schedule/exit', authenticateToken, async (req, res) => {
    try {
        await db.exitScheduleSystem(req.user.employee_id);
        
        res.json({
            success: true,
            message: '已退出排班系統'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '退出排班系統失敗: ' + error.message
        });
    }
});

// 獲取我的排班紀錄
app.get('/api/schedule/my-records', authenticateToken, async (req, res) => {
    try {
        const records = await db.getUserScheduleRecords(req.user.employee_id);
        
        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取排班紀錄失敗: ' + error.message
        });
    }
});

// 作廢排班紀錄
app.post('/api/schedule/:id/void', authenticateToken, async (req, res) => {
    try {
        const scheduleId = parseInt(req.params.id);
        await db.voidScheduleRecord(scheduleId, req.user.employee_id);
        
        res.json({
            success: true,
            message: '排班紀錄已作廢'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '作廢排班紀錄失敗: ' + error.message
        });
    }
});

// ==================== Telegram通知APIs ====================

// 測試Telegram通知
app.post('/api/test-telegram', authenticateToken, async (req, res) => {
    try {
        const result = await telegramNotifier.testNotification();
        
        res.json({
            success: true,
            message: 'Telegram通知測試成功',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Telegram通知測試失敗: ' + error.message
        });
    }
});

// 手動發送訂單異常提醒
app.post('/api/notify-order-anomalies', authenticateToken, async (req, res) => {
    try {
        const { storeId } = req.body;
        const anomalies = await db.checkAllOrderingAnomalies(storeId);
        
        if (anomalies.length > 0) {
            const orderData = {
                created_at: new Date().toISOString(),
                employee_name: '系統自動檢查',
                store_name: req.user.store_name || '未知分店',
                items: []
            };
            
            await telegramNotifier.notifyOrdering(orderData, anomalies);
        }
        
        res.json({
            success: true,
            message: `檢查到 ${anomalies.length} 個異常項目`,
            data: { anomalies_count: anomalies.length }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '異常檢查失敗: ' + error.message
        });
    }
});

// ==================== 營收系統APIs ====================

// 創建營收記錄
app.post('/api/revenue', authenticateToken, async (req, res) => {
    try {
        const {
            date,
            store_id,
            bonus_type,
            order_count,
            revenue_items,
            expense_items,
            notes,
            total_revenue,
            total_expense,
            net_revenue,
            bonus_amount,
            shortage_amount,
            achievement_rate,
            target,
            photos
        } = req.body;
        
        if (!date || !store_id || !bonus_type || !revenue_items || revenue_items.length === 0) {
            return res.status(400).json({
                success: false,
                message: '請填寫所有必填欄位'
            });
        }
        
        const result = await db.createRevenueRecord({
            date,
            store_id,
            employee_id: req.user.employee_id,
            bonus_type,
            order_count: order_count || 0,
            revenue_items,
            expense_items: expense_items || [],
            notes: notes || '',
            total_revenue: total_revenue || 0,
            total_expense: total_expense || 0,
            net_revenue: net_revenue || 0,
            bonus_amount: bonus_amount || 0,
            shortage_amount: shortage_amount || 0,
            achievement_rate: achievement_rate || 0,
            target: target || 0,
            photos: photos || []
        });
        
        // 發送Telegram通知
        try {
            const revenueData = {
                date: date,
                store_name: req.user.store_name || '未知分店',
                employee_name: req.user.name || '未知員工',
                day_type: bonus_type,
                amount: total_revenue,
                target: target,
                achievement_rate: achievement_rate,
                bonus: bonus_amount,
                shortage_amount: shortage_amount,
                notes: notes
            };
            
            await telegramNotifier.notifyRevenue(revenueData);
        } catch (notificationError) {
            console.error('營收Telegram通知發送失敗:', notificationError);
        }
        
        res.json({
            success: true,
            data: result,
            message: '營收記錄創建成功'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '營收記錄創建失敗: ' + error.message
        });
    }
});

// 獲取營收記錄
app.get('/api/revenue/records', authenticateToken, async (req, res) => {
    try {
        const { store_id, date, limit = 50, offset = 0 } = req.query;
        
        const records = await db.getRevenueRecords({
            store_id: store_id ? parseInt(store_id) : null,
            date: date || null,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({
            success: true,
            data: records,
            message: '營收記錄獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取營收記錄失敗: ' + error.message
        });
    }
});

// 作廢營收記錄
app.post('/api/revenue/:id/void', authenticateToken, async (req, res) => {
    try {
        const recordId = parseInt(req.params.id);
        const { reason } = req.body;
        
        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: '請提供作廢原因'
            });
        }
        
        const result = await db.voidRevenueRecord(recordId, req.user.employee_id, reason.trim());
        
        // 發送Telegram通知
        try {
            const voidData = {
                employee_name: req.user.name || '未知員工',
                store_name: req.user.store_name || '未知分店',
                data_type: '營收記錄',
                reason: reason.trim(),
                record_id: recordId
            };
            
            await telegramNotifier.notifyDataVoid(voidData);
        } catch (notificationError) {
            console.error('作廢通知發送失敗:', notificationError);
        }
        
        res.json({
            success: true,
            data: result,
            message: '營收記錄已作廢'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '作廢營收記錄失敗: ' + error.message
        });
    }
});

// 獲取營收統計
app.get('/api/revenue/stats', authenticateToken, async (req, res) => {
    try {
        const { period = 'month', store_id } = req.query;
        
        const stats = await db.getRevenueStats({
            period,
            store_id: store_id ? parseInt(store_id) : null,
            employee_id: req.user.role === 'admin' ? null : req.user.employee_id
        });
        
        res.json({
            success: true,
            data: stats,
            message: '營收統計獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取營收統計失敗: ' + error.message
        });
    }
});

// 獲取月營收統計 (前端需要的端點)
app.get('/api/revenue/monthly', async (req, res) => {
    try {
        const { month, year } = req.query;
        const searchMonth = month && year ? `${year}-${month.padStart(2, '0')}` : new Date().toISOString().slice(0, 7);
        
        const revenues = await db.getRevenueByMonth(searchMonth);
        
        res.json({
            success: true,
            data: revenues,
            message: '月營收統計獲取成功'
        });
    } catch (error) {
        console.error('獲取月營收統計失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取月營收統計失敗: ' + error.message
        });
    }
});

// 管理員審核營收記錄
app.post('/api/admin/revenue/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { action, reason } = req.body; // action: 'approve' 或 'reject'
        const revenueId = parseInt(req.params.id);
        
        if (!action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: '請提供有效的審核操作 (approve/reject)'
            });
        }
        
        const result = await db.updateRevenueStatus(revenueId, action, reason, req.user.id);
        
        // 發送Telegram通知
        try {
            await telegramNotifier.notifyRevenueApproval({
                revenue_id: revenueId,
                action,
                reason,
                reviewer: req.user.name,
                employee_name: result.employee_name
            });
        } catch (notificationError) {
            console.error('營收審核Telegram通知發送失敗:', notificationError);
        }
        
        res.json({
            success: true,
            data: result,
            message: action === 'approve' ? '營收記錄已核准' : '營收記錄已拒絕'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '營收記錄審核失敗: ' + error.message
        });
    }
});

// 管理員查看所有營收記錄（包含待審核）
app.get('/api/admin/revenue/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, store_id, employee_id, date_from, date_to } = req.query;
        
        const filters = {
            status, // 可以是 'pending', 'active', 'rejected'
            store_id: store_id ? parseInt(store_id) : null,
            employee_id: employee_id ? parseInt(employee_id) : null,
            date_from,
            date_to
        };
        
        const revenues = await db.getRevenueRecords(filters);
        
        // 重新計算所有記錄的獎金（確保一致性）
        const enrichedRevenues = revenues.map(record => {
            const bonus = db.calculateBonusAmount(record);
            return {
                ...record,
                calculated_bonus: bonus.amount,
                calculated_bonus_type: bonus.type,
                calculated_bonus_reason: bonus.reason,
                revenue_items: JSON.parse(record.revenue_items || '[]'),
                expense_items: JSON.parse(record.expense_items || '[]'),
                photos: JSON.parse(record.photos || '[]')
            };
        });
        
        res.json({
            success: true,
            data: {
                revenues: enrichedRevenues,
                summary: {
                    total: enrichedRevenues.length,
                    pending: enrichedRevenues.filter(r => r.status === 'pending').length,
                    active: enrichedRevenues.filter(r => r.status === 'active').length,
                    rejected: enrichedRevenues.filter(r => r.status === 'rejected').length,
                    total_revenue: enrichedRevenues.reduce((sum, r) => sum + (r.total_revenue || 0), 0),
                    total_bonus: enrichedRevenues.reduce((sum, r) => sum + (r.bonus_amount || 0), 0)
                }
            },
            message: '管理員營收記錄獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取管理員營收記錄失敗: ' + error.message
        });
    }
});

// ==================== 其他APIs ====================

// 員工班表API
app.get('/api/schedule/employee', authenticateToken, async (req, res) => {
    res.json({
        success: true,
        data: {
            week_schedule: {
                monday: { shift: '早班', time: '09:00-17:00', status: 'scheduled' },
                tuesday: { shift: '早班', time: '09:00-17:00', status: 'scheduled' },
                wednesday: { shift: '早班', time: '09:00-17:00', status: 'scheduled' },
                thursday: { shift: '早班', time: '09:00-17:00', status: 'scheduled' },
                friday: { shift: '早班', time: '09:00-17:00', status: 'scheduled' },
                saturday: { shift: '休假', time: '-', status: 'off' },
                sunday: { shift: '休假', time: '-', status: 'off' }
            },
            month_summary: {
                work_days: 22,
                estimated_hours: 176,
                off_days: 8,
                overtime_days: 2
            },
            leave_balance: {
                annual_leave: 7,
                sick_leave: 3,
                personal_leave: 2
            }
        },
        message: '班表資料獲取成功'
    });
});

// ==================== 前端頁面路由 ====================

app.get('/', (req, res) => {
    const loginPath = path.join(__dirname, 'public', 'login.html');
    if (fs.existsSync(loginPath)) {
        res.sendFile(loginPath);
    } else {
        res.json({
            service: 'GClaude Enterprise Management System',
            version: '4.0.0 - Cloud Version',
            status: 'running',
            message: '🎉 企業員工管理系統 - 雲端版本！',
            testAccounts: {
                admin: { username: 'admin', password: 'admin123' },
                employee: { username: 'employee', password: 'emp123' }
            },
            features: [
                '✅ JSON檔案資料庫',
                '✅ 雲端完全相容',
                '✅ 多角色認證系統',
                '✅ 完整數據持久化',
                '✅ JWT令牌認證',
                '✅ 響應式設計'
            ]
        });
    }
});

app.get('/admin', (req, res) => {
    const unifiedAdminPath = path.join(__dirname, 'public', 'unified-admin-dashboard.html');
    if (fs.existsSync(unifiedAdminPath)) {
        res.sendFile(unifiedAdminPath);
    } else {
        // 如果管理員頁面不存在，重定向到主頁面
        res.redirect('/dashboard?role=admin');
    }
});

// 統一工作台路由
app.get('/dashboard', (req, res) => {
    const unifiedDashboardPath = path.join(__dirname, 'public', 'unified-employee-dashboard.html');
    if (fs.existsSync(unifiedDashboardPath)) {
        res.sendFile(unifiedDashboardPath);
    } else {
        res.json({
            page: 'dashboard',
            message: '統一工作台頁面不存在'
        });
    }
});

app.get('/employee', (req, res) => {
    // 重定向到統一工作台
    res.redirect('/dashboard');
});

// 員工登入頁面路由
app.get('/employee-login', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>員工登入 - GClaude Enterprise System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100vh; display: flex; align-items: center; }
        .login-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 15px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-4">
                <div class="card login-card">
                    <div class="card-body p-5">
                        <div class="text-center mb-4">
                            <h2 class="fw-bold text-primary">員工登入</h2>
                            <p class="text-muted">GClaude Enterprise System</p>
                        </div>
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="employee-username" class="form-label">用戶名</label>
                                <input type="text" class="form-control" id="employee-username" required>
                            </div>
                            <div class="mb-3">
                                <label for="employee-password" class="form-label">密碼</label>
                                <input type="password" class="form-control" id="employee-password" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">登入</button>
                        </form>
                        <div class="text-center mt-3">
                            <small class="text-muted">測試帳號: testuser / password123</small>
                        </div>
                        <div class="text-center mt-2">
                            <a href="/" class="text-decoration-none">返回首頁</a> | 
                            <a href="/admin-login" class="text-decoration-none">管理員登入</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('employee-username').value;
            const password = document.getElementById('employee-password').value;
            
            try {
                const response = await fetch('/api/employee/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    localStorage.setItem('jwt_token', data.token);
                    window.location.href = '/employee-dashboard';
                } else {
                    alert('登入失敗: ' + data.message);
                }
            } catch (error) {
                alert('登入錯誤: ' + error.message);
            }
        });
    </script>
</body>
</html>
    `);
});

// 管理員登入頁面路由
app.get('/admin-login', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理員登入 - GClaude Enterprise System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); height: 100vh; display: flex; align-items: center; }
        .login-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 15px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-4">
                <div class="card login-card">
                    <div class="card-body p-5">
                        <div class="text-center mb-4">
                            <h2 class="fw-bold text-danger">管理員登入</h2>
                            <p class="text-muted">GClaude Enterprise System</p>
                        </div>
                        <form id="adminLoginForm">
                            <div class="mb-3">
                                <label for="admin-username" class="form-label">管理員帳號</label>
                                <input type="text" class="form-control" id="admin-username" required>
                            </div>
                            <div class="mb-3">
                                <label for="admin-password" class="form-label">密碼</label>
                                <input type="password" class="form-control" id="admin-password" required>
                            </div>
                            <button type="submit" class="btn btn-danger w-100">登入</button>
                        </form>
                        <div class="text-center mt-3">
                            <small class="text-muted">測試帳號: admin / admin123</small>
                        </div>
                        <div class="text-center mt-2">
                            <a href="/" class="text-decoration-none">返回首頁</a> | 
                            <a href="/employee-login" class="text-decoration-none">員工登入</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            
            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    localStorage.setItem('jwt_token', data.token);
                    window.location.href = '/admin-dashboard';
                } else {
                    alert('登入失敗: ' + data.message);
                }
            } catch (error) {
                alert('登入錯誤: ' + error.message);
            }
        });
    </script>
</body>
</html>
    `);
});

// 員工儀表板路由
app.get('/employee-dashboard', (req, res) => {
    const dashboardPath = path.join(__dirname, 'public', 'unified-employee-dashboard.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        res.redirect('/dashboard');
    }
});

// 管理員儀表板路由
app.get('/admin-dashboard', (req, res) => {
    const adminPath = path.join(__dirname, 'public', 'unified-admin-dashboard.html');
    if (fs.existsSync(adminPath)) {
        res.sendFile(adminPath);
    } else {
        res.redirect('/admin');
    }
});

// ==================== 管理員設定APIs ====================

// 獲取所有員工資料
app.get('/api/admin/employees', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const employees = await db.getAllEmployees();
        
        res.json({
            success: true,
            data: employees,
            message: '員工資料獲取成功'
        });
    } catch (error) {
        console.error('獲取員工資料失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取員工資料失敗: ' + error.message
        });
    }
});

// 管理員審核員工申請（新增）
app.post('/api/admin/employees/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const employeeId = parseInt(req.params.id);
        const { action, position, store_id, join_date, reason } = req.body;
        
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: '無效的審核動作'
            });
        }

        const employees = await db.readTable('employees');
        const employee = employees.find(emp => emp.id === employeeId);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: '找不到該員工'
            });
        }

        if (action === 'approve') {
            // 審核通過：更新員工狀態和資料
            employee.status = '在職';
            employee.position = position || '實習生';
            employee.store_id = store_id || 1;
            employee.join_date = join_date || new Date().toISOString().split('T')[0];
            employee.updated_at = new Date().toISOString();
            
            await db.writeTable('employees', employees);
            
            // 發送歡迎通知
            try {
                await telegramNotifier.notifyEmployeeApproved({
                    ...employee,
                    store_name: '內壢忠孝店'
                });
            } catch (notificationError) {
                console.error('員工審核通過通知發送失敗:', notificationError);
            }
        } else {
            // 審核拒絕：更新狀態
            employee.status = '拒絕';
            employee.reject_reason = reason || '不符合錄用條件';
            employee.updated_at = new Date().toISOString();
            
            await db.writeTable('employees', employees);
        }
        
        res.json({
            success: true,
            data: employee,
            message: `員工申請已${action === 'approve' ? '批准' : '拒絕'}`
        });
    } catch (error) {
        console.error('審核員工申請失敗:', error);
        res.status(500).json({
            success: false,
            message: '審核員工申請失敗: ' + error.message
        });
    }
});

// 管理員查看待審核員工（新增）
app.get('/api/admin/employees/pending', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const employees = await db.readTable('employees');
        const pendingEmployees = employees.filter(emp => emp.status === 'pending');
        
        res.json({
            success: true,
            data: {
                employees: pendingEmployees,
                count: pendingEmployees.length
            },
            message: '待審核員工列表獲取成功'
        });
    } catch (error) {
        console.error('獲取待審核員工失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取待審核員工失敗: ' + error.message
        });
    }
});

// Telegram連線測試
app.post('/api/telegram/test', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await telegramNotifier.testNotification();
        
        res.json({
            success: true,
            message: 'Telegram連線測試成功',
            data: result
        });
    } catch (error) {
        console.error('Telegram測試失敗:', error);
        res.status(500).json({
            success: false,
            message: 'Telegram連線測試失敗: ' + error.message
        });
    }
});

// 儲存分店設定
app.post('/api/admin/stores/save', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const storesData = req.body;
        
        // 驗證資料格式
        if (!Array.isArray(storesData)) {
            return res.status(400).json({
                success: false,
                message: '分店資料格式錯誤'
            });
        }

        // 保存到設定檔案或資料庫
        await db.saveStoreSettings(storesData);
        
        res.json({
            success: true,
            message: '分店設定已成功儲存',
            data: storesData
        });
    } catch (error) {
        console.error('儲存分店設定失敗:', error);
        res.status(500).json({
            success: false,
            message: '儲存分店設定失敗: ' + error.message
        });
    }
});

// 儲存排班參數設定
app.post('/api/admin/schedule/save-settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const scheduleSettings = req.body;
        
        // 驗證JSON格式
        try {
            if (scheduleSettings.forbiddenDates) {
                JSON.parse(scheduleSettings.forbiddenDates);
            }
            if (scheduleSettings.holidayDates) {
                JSON.parse(scheduleSettings.holidayDates);
            }
        } catch (e) {
            return res.status(400).json({
                success: false,
                message: 'JSON格式錯誤，請檢查禁休日期和公休日期設定'
            });
        }

        // 保存設定
        await db.saveScheduleSettings(scheduleSettings);
        
        res.json({
            success: true,
            message: '排班參數設定已成功儲存',
            data: scheduleSettings
        });
    } catch (error) {
        console.error('儲存排班設定失敗:', error);
        res.status(500).json({
            success: false,
            message: '儲存排班設定失敗: ' + error.message
        });
    }
});

// 管理員查看所有員工排班（新增）
app.get('/api/admin/schedule/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { month } = req.query;
        const settings = await db.getScheduleSettings();
        const targetMonth = month || settings.schedule_month;
        
        const schedules = await db.getMonthSchedules(targetMonth);
        const employees = await db.readTable('employees');
        
        // 為排班記錄添加員工詳細資訊
        const enrichedSchedules = schedules.map(schedule => {
            const employee = employees.find(emp => emp.id === schedule.employee_id);
            return {
                ...schedule,
                employee_name: employee ? employee.name : '未知員工',
                employee_position: employee ? employee.position : '未知職位',
                store_name: employee ? employee.store_name : '未知分店'
            };
        });
        
        // 統計資訊
        const totalEmployees = employees.filter(emp => emp.status === '在職').length;
        const submittedCount = schedules.length;
        const pendingCount = totalEmployees - submittedCount;
        
        // 每日休假統計
        const dailyStats = {};
        schedules.forEach(schedule => {
            if (schedule.leave_dates && Array.isArray(schedule.leave_dates)) {
                schedule.leave_dates.forEach(date => {
                    if (!dailyStats[date]) {
                        dailyStats[date] = 0;
                    }
                    dailyStats[date]++;
                });
            }
        });
        
        res.json({
            success: true,
            data: {
                schedules: enrichedSchedules,
                statistics: {
                    totalEmployees,
                    submittedCount,
                    pendingCount,
                    submissionRate: Math.round((submittedCount / totalEmployees) * 100)
                },
                dailyStats,
                settings,
                targetMonth
            },
            message: '管理員排班資料獲取成功'
        });
    } catch (error) {
        console.error('獲取管理員排班資料失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取排班資料失敗: ' + error.message
        });
    }
});

// 儲存職位階級設定
app.post('/api/admin/positions/save', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const positionsData = req.body;
        
        // 驗證資料格式
        if (!Array.isArray(positionsData)) {
            return res.status(400).json({
                success: false,
                message: '職位資料格式錯誤'
            });
        }

        // 保存職位設定
        await db.savePositionSettings(positionsData);
        
        res.json({
            success: true,
            message: '職位階級設定已成功儲存',
            data: positionsData
        });
    } catch (error) {
        console.error('儲存職位設定失敗:', error);
        res.status(500).json({
            success: false,
            message: '儲存職位設定失敗: ' + error.message
        });
    }
});

// 儲存產品設定
app.post('/api/admin/products/save', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const productsData = req.body;
        
        // 驗證資料格式
        if (!Array.isArray(productsData)) {
            return res.status(400).json({
                success: false,
                message: '產品資料格式錯誤'
            });
        }

        // 保存產品設定
        await db.saveProductSettings(productsData);
        
        res.json({
            success: true,
            message: '產品設定已成功儲存',
            data: productsData
        });
    } catch (error) {
        console.error('儲存產品設定失敗:', error);
        res.status(500).json({
            success: false,
            message: '儲存產品設定失敗: ' + error.message
        });
    }
});

// 儲存系統全域設定
app.post('/api/admin/system/save', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const systemSettings = req.body;
        
        // 保存系統設定
        await db.saveSystemSettings(systemSettings);
        
        res.json({
            success: true,
            message: '系統設定已成功儲存',
            data: systemSettings
        });
    } catch (error) {
        console.error('儲存系統設定失敗:', error);
        res.status(500).json({
            success: false,
            message: '儲存系統設定失敗: ' + error.message
        });
    }
});

// 儲存財務項目設定
app.post('/api/admin/finance/save', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const financeSettings = req.body;
        
        // 驗證資料格式
        if (!financeSettings.incomeItems || !Array.isArray(financeSettings.incomeItems)) {
            return res.status(400).json({
                success: false,
                message: '收入項目資料格式錯誤'
            });
        }

        if (!financeSettings.expenseItems || !Array.isArray(financeSettings.expenseItems)) {
            return res.status(400).json({
                success: false,
                message: '支出項目資料格式錯誤'
            });
        }

        // 保存財務設定
        await db.saveFinanceSettings(financeSettings);
        
        res.json({
            success: true,
            message: '財務項目設定已成功儲存',
            data: financeSettings
        });
    } catch (error) {
        console.error('儲存財務設定失敗:', error);
        res.status(500).json({
            success: false,
            message: '儲存財務設定失敗: ' + error.message
        });
    }
});

// 獲取財務項目設定
app.get('/api/admin/finance/settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const financeSettings = await db.getFinanceSettings();
        
        res.json({
            success: true,
            data: financeSettings,
            message: '財務設定獲取成功'
        });
    } catch (error) {
        console.error('獲取財務設定失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取財務設定失敗: ' + error.message
        });
    }
});

// 管理員設定頁面路由
app.get('/admin-settings', (req, res) => {
    const settingsPath = path.join(__dirname, 'public', 'admin-settings.html');
    if (fs.existsSync(settingsPath)) {
        res.sendFile(settingsPath);
    } else {
        res.status(404).json({
            success: false,
            message: '管理員設定頁面不存在'
        });
    }
});

// ==================== 缺失的API端點 ====================

// 出勤記錄API (模擬實現)
app.get('/api/attendance/records', authenticateToken, async (req, res) => {
    try {
        const records = await db.readTable('attendance') || [];
        
        const userRecords = records
            .filter(record => record.employee_id === req.user.employee_id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 50);
            
        res.json({
            success: true,
            data: userRecords,
            message: '出勤記錄獲取成功'
        });
    } catch (error) {
        console.error('出勤記錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取出勤記錄失敗'
        });
    }
});

// 排班資料API (模擬實現)
app.get('/api/schedule/current', authenticateToken, async (req, res) => {
    try {
        const schedules = await db.readTable('schedules') || [];
        
        const userSchedule = schedules.find(schedule => 
            schedule.employee_id === req.user.employee_id &&
            new Date(schedule.date) >= new Date().setHours(0,0,0,0)
        );
        
        res.json({
            success: true,
            data: userSchedule || null,
            message: '排班資料獲取成功'
        });
    } catch (error) {
        console.error('排班資料錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取排班資料失敗'
        });
    }
});

// 系統設定API (管理員專用)
app.get('/api/settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                companyName: 'GClaude 企業管理系統',
                version: '2.0.0',
                timezone: 'Asia/Taipei',
                features: {
                    attendance: true,
                    revenue: true,
                    schedule: true,
                    promotion: true
                }
            },
            message: '系統設定獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取系統設定失敗'
        });
    }
});

// 報告匯出API (管理員專用)
app.get('/api/reports/export', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { type, format } = req.query;
        
        // 模擬報告產生
        const reportData = {
            type: type || 'monthly',
            format: format || 'json',
            generated_at: new Date().toISOString(),
            data: {
                employees: await db.readTable('employees') || [],
                attendance: await db.readTable('attendance') || [],
                revenue: await db.readTable('revenue') || []
            }
        };
        
        res.json({
            success: true,
            data: reportData,
            message: '報告匯出成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '報告匯出失敗'
        });
    }
});

// 員工排班管理API (店長專用)
app.get('/api/schedule/manage', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '權限不足，需要店長或管理員權限'
            });
        }
        
        const schedules = await db.readTable('schedules') || [];
        const teamSchedules = schedules.filter(schedule => 
            schedule.store_id === req.user.store_id
        );
        
        res.json({
            success: true,
            data: teamSchedules,
            message: '排班管理資料獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取排班管理資料失敗'
        });
    }
});

// 團隊出勤查看API (店長專用)
app.get('/api/attendance/team', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '權限不足，需要店長或管理員權限'
            });
        }
        
        const attendance = await db.readTable('attendance') || [];
        const teamAttendance = attendance.filter(record => 
            record.store_id === req.user.store_id
        );
        
        res.json({
            success: true,
            data: teamAttendance,
            message: '團隊出勤資料獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取團隊出勤資料失敗'
        });
    }
});

// 團隊業績統計API (店長專用)
app.get('/api/revenue/team', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '權限不足，需要店長或管理員權限'
            });
        }
        
        const revenue = await db.readTable('revenue') || [];
        const teamRevenue = revenue.filter(record => 
            record.store_id === req.user.store_id
        );
        
        const totalRevenue = teamRevenue.reduce((sum, record) => sum + (record.amount || 0), 0);
        
        res.json({
            success: true,
            data: {
                total: totalRevenue,
                records: teamRevenue,
                count: teamRevenue.length
            },
            message: '團隊業績統計獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取團隊業績統計失敗'
        });
    }
});

// 個人排班查看API
app.get('/api/schedule/my', authenticateToken, async (req, res) => {
    try {
        const schedules = await db.readTable('schedules') || [];
        const mySchedules = schedules.filter(schedule => 
            schedule.employee_id === req.user.employee_id
        );
        
        res.json({
            success: true,
            data: mySchedules,
            message: '個人排班查看成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取個人排班失敗'
        });
    }
});

// 升遷投票API
app.post('/api/promotion/vote', authenticateToken, async (req, res) => {
    try {
        const { promotion_id, vote_decision, comment } = req.body;
        
        const votes = await db.readTable('promotion_votes') || [];
        const newVote = {
            id: votes.length + 1,
            promotion_id,
            voter_id: req.user.employee_id,
            voter_name: req.user.employee_name,
            vote_decision,
            comment: comment || '',
            created_at: new Date().toISOString()
        };
        
        votes.push(newVote);
        await db.writeTable('promotion_votes', votes);
        
        res.json({
            success: true,
            data: newVote,
            message: '升遷投票成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '升遷投票失敗'
        });
    }
});

// 學習進度API (實習生專用)
app.get('/api/learning/progress', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'intern') {
            return res.status(403).json({
                success: false,
                message: '權限不足，需要實習生權限'
            });
        }
        
        // 模擬學習進度資料
        const progress = {
            total_hours: 160,
            completed_hours: 85,
            completion_rate: 53.1,
            courses: [
                { name: '系統介紹', completed: true, hours: 8 },
                { name: '出勤管理', completed: true, hours: 16 },
                { name: '客戶服務', completed: true, hours: 24 },
                { name: '業績管理', completed: false, hours: 32 },
                { name: '團隊協作', completed: false, hours: 40 }
            ]
        };
        
        res.json({
            success: true,
            data: progress,
            message: '學習進度獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取學習進度失敗'
        });
    }
});

// ==================== 營業額管理API ====================

// 提交營業額記錄
app.post('/api/revenue/submit', authenticateToken, async (req, res) => {
    try {
        const {
            store_id,
            date,
            order_count,
            total_revenue,
            total_expense,
            bonus_amount,
            day_type,
            notes
        } = req.body;

        // 創建營業額記錄
        const revenueData = {
            id: Date.now(),
            employee_id: req.user.employee_id,
            employee_name: req.user.name,
            store_id: store_id || req.user.store_id,
            store_name: req.user.store_name,
            date,
            order_count: order_count || 0,
            total_revenue: total_revenue || 0,
            total_expense: total_expense || 0,
            bonus_amount: bonus_amount || 0,
            day_type: day_type || 'weekday',
            notes: notes || '',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // 保存到資料庫
        await db.writeToTable('revenue', revenueData);

        // 發送Telegram通知
        if (telegramNotifier) {
            try {
                await telegramNotifier.notifyRevenue(revenueData);
            } catch (telegramError) {
                console.error('Telegram通知失敗:', telegramError);
            }
        }

        res.json({
            success: true,
            data: revenueData,
            message: '營業額提交成功'
        });
    } catch (error) {
        console.error('營業額提交失敗:', error);
        res.status(500).json({
            success: false,
            message: '營業額提交失敗: ' + error.message
        });
    }
});

// 獲取營業額記錄
app.get('/api/revenue/records', authenticateToken, async (req, res) => {
    try {
        const records = await db.readTable('revenue');
        const userRecords = records.filter(r => r.employee_id === req.user.employee_id);
        
        res.json({
            success: true,
            data: userRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
            message: '營業額記錄獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取營業額記錄失敗'
        });
    }
});

// 營業額審核 (管理員)
app.post('/api/admin/revenue/:id/review', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body;
        
        const records = await db.readTable('revenue');
        const recordIndex = records.findIndex(r => r.id == id);
        
        if (recordIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '營業額記錄不存在'
            });
        }
        
        records[recordIndex].status = action === 'approve' ? 'approved' : 'rejected';
        records[recordIndex].review_reason = reason || '';
        records[recordIndex].reviewed_by = req.user.id;
        records[recordIndex].reviewed_at = new Date().toISOString();
        
        await db.writeTable('revenue', records);
        
        // 發送審核通知
        if (telegramNotifier) {
            try {
                await telegramNotifier.notifyRevenueApproval({
                    revenue_id: id,
                    employee_name: records[recordIndex].employee_name,
                    action,
                    reason,
                    reviewer: req.user.name
                });
            } catch (telegramError) {
                console.error('Telegram審核通知失敗:', telegramError);
            }
        }
        
        res.json({
            success: true,
            message: `營業額記錄已${action === 'approve' ? '核准' : '拒絕'}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '營業額審核失敗'
        });
    }
});

// ==================== 叫貨管理API ====================

// 提交叫貨記錄
app.post('/api/orders/submit', authenticateToken, async (req, res) => {
    try {
        const {
            store_id,
            delivery_date,
            items,
            notes
        } = req.body;

        // 創建叫貨記錄
        const orderData = {
            id: Date.now(),
            employee_id: req.user.employee_id,
            employee_name: req.user.name,
            store_id: store_id || req.user.store_id,
            store_name: req.user.store_name,
            delivery_date,
            items: items || [],
            notes: notes || '',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // 保存到資料庫
        await db.writeToTable('orders', orderData);

        // 分析叫貨異常
        const anomalies = await analyzeOrderingAnomalies(orderData, req.user.store_id);

        // 發送Telegram通知
        if (telegramNotifier) {
            try {
                await telegramNotifier.notifyOrdering(orderData, anomalies);
            } catch (telegramError) {
                console.error('Telegram通知失敗:', telegramError);
            }
        }

        res.json({
            success: true,
            data: orderData,
            message: '叫貨記錄提交成功'
        });
    } catch (error) {
        console.error('叫貨提交失敗:', error);
        res.status(500).json({
            success: false,
            message: '叫貨提交失敗: ' + error.message
        });
    }
});

// 獲取叫貨記錄
app.get('/api/orders/records', authenticateToken, async (req, res) => {
    try {
        const records = await db.readTable('orders');
        const userRecords = records.filter(r => r.employee_id === req.user.employee_id);
        
        res.json({
            success: true,
            data: userRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
            message: '叫貨記錄獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取叫貨記錄失敗'
        });
    }
});

// 叫貨審核 (管理員)
app.post('/api/admin/orders/:id/review', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body;
        
        const records = await db.readTable('orders');
        const recordIndex = records.findIndex(r => r.id == id);
        
        if (recordIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '叫貨記錄不存在'
            });
        }
        
        records[recordIndex].status = action === 'approve' ? 'approved' : 'rejected';
        records[recordIndex].review_reason = reason || '';
        records[recordIndex].reviewed_by = req.user.id;
        records[recordIndex].reviewed_at = new Date().toISOString();
        
        await db.writeTable('orders', records);
        
        res.json({
            success: true,
            message: `叫貨記錄已${action === 'approve' ? '核准' : '拒絕'}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '叫貨審核失敗'
        });
    }
});

// 叫貨異常分析函數
async function analyzeOrderingAnomalies(currentOrder, storeId) {
    try {
        const allOrders = await db.readTable('orders');
        const storeOrders = allOrders.filter(o => o.store_id === storeId);
        const anomalies = [];
        
        // 檢查每個商品的叫貨頻率
        for (const item of currentOrder.items) {
            const productName = item.product_name;
            const productOrders = storeOrders.filter(order => 
                order.items && order.items.some(i => i.product_name === productName)
            ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            if (productOrders.length > 1) {
                const lastOrder = productOrders[1]; // 上一次叫貨記錄
                const daysSince = Math.floor((new Date(currentOrder.created_at) - new Date(lastOrder.created_at)) / (1000 * 60 * 60 * 24));
                
                const lastItem = lastOrder.items.find(i => i.product_name === productName);
                
                if (daysSince >= 3 || daysSince <= 1) {
                    anomalies.push({
                        product_name: productName,
                        days_since_last_order: daysSince,
                        last_order_date: lastOrder.created_at,
                        last_quantity: lastItem ? lastItem.quantity : 0,
                        unit: item.unit || '個'
                    });
                }
            }
        }
        
        return anomalies;
    } catch (error) {
        console.error('叫貨異常分析失敗:', error);
        return [];
    }
}

// ==================== 測試用API ====================

// 測試端點 - 重新初始化資料庫
app.post('/api/test/reset-database', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await db.initializeData();
        res.json({
            success: true,
            message: '資料庫重新初始化成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '資料庫重新初始化失敗'
        });
    }
});

// ==================== 錯誤處理 ====================

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        message: '請求的資源不存在'
    });
});

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
    console.log(`🚀 GClaude Enterprise System (Cloud Version) started on port ${PORT}`);
    console.log(`🌐 Server URL: http://0.0.0.0:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`🗄️ Database: JSON File Database (Cloud Compatible)`);
    console.log(`🔧 Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '已設定' : '未設定'}`);
    console.log(`✅ All systems operational - Cloud deployment ready!`);
});

// 優雅關閉
process.on('SIGINT', () => {
    console.log('\n🔄 正在關閉伺服器...');
    db.close();
    process.exit(0);
});

module.exports = app;
// 觸發Render.com重新部署 - 緊急修復營業額和叫貨API - 西元2025年08月17日 (星期日) 14時06分00秒    
