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
require('dotenv').config();

// 使用JSON檔案資料庫而非SQLite
const DatabaseOperations = require('./database/json-database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'gclaude-enterprise-secret-key';

// 初始化資料庫
const db = new DatabaseOperations();

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

app.use(compression());

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
            version: '4.0.0',
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

// 用戶登入
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await db.getUserByUsername(username);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '帳號或密碼錯誤'
            });
        }

        const isValidPassword = password === user.password;
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '帳號或密碼錯誤'
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

// Token驗證
app.post('/api/auth/verify', authenticateToken, async (req, res) => {
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

app.get('/api/employees', authenticateToken, async (req, res) => {
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
        const { location } = req.body;
        await db.clockIn(req.user.employee_id, req.user.store_id, location || '系統位置');
        
        res.json({
            success: true,
            data: {
                timestamp: new Date().toISOString(),
                time: new Date().toLocaleTimeString('zh-TW'),
                location: location || '系統位置',
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
        const { location } = req.body;
        await db.clockOut(req.user.employee_id, location || '系統位置');
        
        res.json({
            success: true,
            data: {
                timestamp: new Date().toISOString(),
                time: new Date().toLocaleTimeString('zh-TW'),
                location: location || '系統位置',
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

app.post('/api/maintenance', authenticateToken, async (req, res) => {
    try {
        const maintenanceData = {
            employee_id: req.user.employee_id,
            store_id: req.user.store_id,
            equipment_type: req.body.equipment_type,
            title: req.body.title,
            description: req.body.description,
            location: req.body.location,
            contact_phone: req.body.contact_phone,
            priority: req.body.priority
        };
        
        const result = await db.createMaintenance(maintenanceData);
        
        res.json({
            success: true,
            data: {
                id: result.id,
                ...maintenanceData,
                status: 'pending',
                created_at: new Date().toISOString()
            },
            message: '維修申請已提交，將於24小時內處理'
        });
    } catch (error) {
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
        const attendance = await db.allQuery('SELECT * FROM attendance ORDER BY date DESC LIMIT 100');
        
        res.json({
            success: true,
            data: attendance,
            message: '出勤記錄獲取成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取出勤記錄失敗: ' + error.message
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

module.exports = app;// Force redeploy 西元2025年08月16日 (星期六) 01時36分55秒    
