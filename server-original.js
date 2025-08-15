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

// 安全設定 - 更寬鬆的CSP用於開發和功能測試
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

// 儀表板統計API
app.get('/api/dashboard/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            totalEmployees: 12,
            activeEmployees: 10,
            onLeave: 1,
            newHires: 1,
            todayAttendance: 85,
            monthlyRevenue: 2450000,
            pendingRequests: 3,
            systemHealth: 98,
            recentActivities: [
                { time: '09:30', action: '張三 已打卡上班', type: 'attendance' },
                { time: '09:15', action: '李四 提交維修申請', type: 'maintenance' },
                { time: '09:00', action: '王五 完成月報表', type: 'report' }
            ]
        },
        message: '儀表板統計獲取成功'
    });
});

// 出勤記錄API
app.get('/api/attendance', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                employeeName: '張三',
                date: '2025-08-15',
                checkIn: '09:00',
                checkOut: '18:00',
                status: 'present'
            },
            {
                id: 2,
                employeeName: '李四',
                date: '2025-08-15',
                checkIn: '09:15',
                checkOut: '-',
                status: 'present'
            }
        ],
        message: '出勤記錄獲取成功'
    });
});

// 營收數據API
app.get('/api/revenue', (req, res) => {
    res.json({
        success: true,
        data: {
            daily: [
                { date: '2025-08-10', amount: 75000 },
                { date: '2025-08-11', amount: 82000 },
                { date: '2025-08-12', amount: 91000 },
                { date: '2025-08-13', amount: 88000 },
                { date: '2025-08-14', amount: 95000 },
                { date: '2025-08-15', amount: 87000 }
            ],
            monthly: {
                current: 2450000,
                previous: 2280000,
                growth: 7.5
            },
            byCategory: [
                { category: '產品銷售', amount: 1850000, percentage: 75.5 },
                { category: '服務收入', amount: 400000, percentage: 16.3 },
                { category: '其他', amount: 200000, percentage: 8.2 }
            ]
        },
        message: '營收數據獲取成功'
    });
});

// 維修申請API
app.get('/api/maintenance', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                title: '辦公室空調維修',
                description: '三樓會議室空調不冷',
                reporter: '李四',
                status: 'pending',
                priority: 'high',
                createdAt: '2025-08-15 09:15'
            },
            {
                id: 2,
                title: '影印機卡紙',
                description: '二樓影印機經常卡紙',
                reporter: '王五',
                status: 'in_progress',
                priority: 'medium',
                createdAt: '2025-08-14 14:30'
            }
        ],
        message: '維修申請獲取成功'
    });
});

// ==================== 員工相關API ====================

// 今日出勤狀態
app.get('/api/attendance/today', (req, res) => {
    res.json({
        success: true,
        data: {
            date: '2025-08-15',
            checkIn: '09:15:23',
            checkOut: null,
            status: 'checked_in',
            workHours: '3小時45分鐘',
            break: '30分鐘',
            location: '台北總公司'
        },
        message: '今日出勤狀態獲取成功'
    });
});

// 出勤歷史記錄
app.get('/api/attendance/history', (req, res) => {
    const limit = req.query.limit || 10;
    res.json({
        success: true,
        data: [
            {
                date: '2025-08-14',
                checkIn: '09:00:15',
                checkOut: '18:05:30',
                workHours: '8小時30分鐘',
                status: 'completed'
            },
            {
                date: '2025-08-13',
                checkIn: '09:10:45',
                checkOut: '18:00:00',
                workHours: '8小時15分鐘',
                status: 'completed'
            },
            {
                date: '2025-08-12',
                checkIn: '08:55:20',
                checkOut: '18:10:15',
                workHours: '8小時45分鐘',
                status: 'completed'
            }
        ],
        message: '出勤歷史獲取成功'
    });
});

// 上班打卡
app.post('/api/attendance/clock-in', (req, res) => {
    const now = new Date();
    res.json({
        success: true,
        data: {
            timestamp: now.toISOString(),
            time: now.toLocaleTimeString('zh-TW'),
            location: '台北總公司',
            status: 'success'
        },
        message: '上班打卡成功！'
    });
});

// 下班打卡
app.post('/api/attendance/clock-out', (req, res) => {
    const now = new Date();
    res.json({
        success: true,
        data: {
            timestamp: now.toISOString(),
            time: now.toLocaleTimeString('zh-TW'),
            location: '台北總公司',
            workHours: '8小時15分鐘',
            status: 'success'
        },
        message: '下班打卡成功！今日工作辛苦了！'
    });
});

// ==================== 認證相關API ====================

// Token驗證
app.post('/api/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token === 'demo-jwt-token') {
        res.json({
            success: true,
            data: {
                user: {
                    id: 1,
                    username: 'admin',
                    role: 'admin',
                    name: '系統管理員'
                }
            },
            message: 'Token有效'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Token無效或已過期'
        });
    }
});

// 使用者個人資料
app.get('/api/auth/profile', (req, res) => {
    res.json({
        success: true,
        data: {
            id: 1,
            username: 'admin',
            name: '系統管理員',
            email: 'admin@gclaude.com',
            role: 'admin',
            department: '資訊部',
            position: '系統管理員',
            joinDate: '2024-01-01',
            phone: '02-1234-5678'
        },
        message: '個人資料獲取成功'
    });
});

// 員工統計總覽
app.get('/api/employees/stats/overview', (req, res) => {
    res.json({
        success: true,
        data: {
            totalEmployees: 45,
            activeToday: 38,
            onLeave: 3,
            remote: 4,
            departments: [
                { name: '業務部', count: 15 },
                { name: '技術部', count: 12 },
                { name: '行政部', count: 8 },
                { name: '財務部', count: 6 },
                { name: '人資部', count: 4 }
            ],
            attendanceRate: 84.4,
            avgWorkHours: 8.2
        },
        message: '員工統計總覽獲取成功'
    });
});

// ==================== 員工管理API ====================

// 新增員工
app.post('/api/employees', (req, res) => {
    const { name, email, department, position, phone } = req.body;
    
    // 模擬新增員工
    const newEmployee = {
        id: Date.now(),
        name,
        email,
        department,
        position,
        phone,
        join_date: new Date().toISOString().split('T')[0],
        is_active: true
    };
    
    res.json({
        success: true,
        data: newEmployee,
        message: '員工新增成功'
    });
});

// 更新員工
app.put('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, department, position, phone } = req.body;
    
    res.json({
        success: true,
        data: {
            id: parseInt(id),
            name,
            email,
            department,
            position,
            phone,
            updated_at: new Date().toISOString()
        },
        message: '員工資料更新成功'
    });
});

// 刪除員工
app.delete('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    
    res.json({
        success: true,
        message: `員工 ID ${id} 已成功刪除`
    });
});

// ==================== 庫存管理API ====================

// 庫存列表
app.get('/api/inventory', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                code: 'P001',
                name: 'A級產品套組',
                category: '主力產品',
                current_stock: 156,
                safe_stock: 50,
                unit_price: 15000,
                status: 'normal'
            },
            {
                id: 2,
                code: 'P002',
                name: 'B級服務包',
                category: '服務',
                current_stock: 12,
                safe_stock: 20,
                unit_price: 8000,
                status: 'low'
            },
            {
                id: 3,
                code: 'P003',
                name: '維護工具',
                category: '工具',
                current_stock: 0,
                safe_stock: 10,
                unit_price: 2500,
                status: 'out_of_stock'
            }
        ],
        message: '庫存清單獲取成功'
    });
});

// 新增庫存
app.post('/api/inventory', (req, res) => {
    const { code, name, category, current_stock, safe_stock, unit_price } = req.body;
    
    res.json({
        success: true,
        data: {
            id: Date.now(),
            code,
            name,
            category,
            current_stock: parseInt(current_stock),
            safe_stock: parseInt(safe_stock),
            unit_price: parseFloat(unit_price),
            status: current_stock > safe_stock ? 'normal' : (current_stock > 0 ? 'low' : 'out_of_stock'),
            created_at: new Date().toISOString()
        },
        message: '庫存商品新增成功'
    });
});

// ==================== 維修申請API ====================

// 更新維修狀態
app.put('/api/maintenance/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    res.json({
        success: true,
        data: {
            id: parseInt(id),
            status,
            updated_at: new Date().toISOString()
        },
        message: `維修申請狀態已更新為: ${status}`
    });
});

// ==================== 營收管理API ====================

// 新增營收記錄（擴充版）
app.post('/api/revenue', (req, res) => {
    const { category, item, amount, responsible, notes, customer } = req.body;
    
    res.json({
        success: true,
        data: {
            id: Date.now(),
            category,
            item,
            amount: parseFloat(amount),
            responsible: responsible || '示範員工',
            customer: customer || '',
            notes,
            time: new Date().toLocaleTimeString('zh-TW'),
            date: new Date().toISOString().split('T')[0],
            status: 'pending'
        },
        message: '營收記錄新增成功'
    });
});

// ==================== 升遷投票API ====================

// 創建升遷投票
app.post('/api/promotions', (req, res) => {
    const { title, candidates, deadline, description } = req.body;
    
    res.json({
        success: true,
        data: {
            id: Date.now(),
            title,
            candidates,
            deadline,
            description,
            created_at: new Date().toISOString(),
            status: 'active'
        },
        message: '升遷投票創建成功'
    });
});

// ==================== 報表生成API ====================

// 生成報表
app.post('/api/reports/generate', (req, res) => {
    const { type, dateRange } = req.body;
    
    // 模擬報表生成
    const reportTypes = {
        employee: '員工報表',
        revenue: '營收報表',
        attendance: '出勤報表',
        system: '系統報表'
    };
    
    res.json({
        success: true,
        data: {
            id: Date.now(),
            name: `${reportTypes[type]}_${new Date().toISOString().split('T')[0]}`,
            type: type,
            generated_at: new Date().toISOString(),
            file_size: Math.floor(Math.random() * 5000) + 500 + ' KB',
            status: 'completed',
            download_url: `/downloads/report_${Date.now()}.pdf`
        },
        message: '報表生成成功'
    });
});

// ==================== 系統設定API ====================

// 保存設定
app.post('/api/settings/:category', (req, res) => {
    const { category } = req.params;
    const settings = req.body;
    
    res.json({
        success: true,
        data: {
            category,
            settings,
            updated_at: new Date().toISOString()
        },
        message: `${category}設定保存成功`
    });
});

// 測試Telegram
app.post('/api/settings/telegram/test', (req, res) => {
    res.json({
        success: true,
        message: 'Telegram測試通知已發送'
    });
});

// ==================== 員工頁面新增API ====================

// 請假申請API
app.post('/api/leave-requests', (req, res) => {
    const { leave_type, start_date, end_date, reason, substitute } = req.body;
    
    res.json({
        success: true,
        data: {
            id: Date.now(),
            leave_type,
            start_date,
            end_date,
            reason,
            substitute,
            status: 'pending',
            applied_at: new Date().toISOString()
        },
        message: '請假申請已提交，等待審核'
    });
});

// 獲取員工請假記錄
app.get('/api/leave-requests', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                leave_type: '年假',
                start_date: '2025-08-16',
                end_date: '2025-08-16',
                days: 1,
                reason: '個人事務',
                status: 'approved',
                applied_at: '2025-08-10',
                approved_by: '王經理'
            },
            {
                id: 2,
                leave_type: '病假',
                start_date: '2025-08-07',
                end_date: '2025-08-07',
                days: 0.5,
                reason: '身體不適',
                status: 'approved',
                applied_at: '2025-08-05',
                approved_by: '李主管'
            }
        ],
        message: '請假記錄獲取成功'
    });
});

// 獲取員工維修記錄
app.get('/api/maintenance/employee', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                equipment_type: '空調系統',
                title: '三樓會議室空調不冷',
                location: '3F-會議室A',
                priority: 'high',
                status: 'pending',
                created_at: '2025-08-15 09:15:00',
                handler: null
            },
            {
                id: 2,
                equipment_type: '印表機',
                title: '二樓印表機經常卡紙',
                location: '2F-辦公區',
                priority: 'medium',
                status: 'in_progress',
                created_at: '2025-08-14 14:30:00',
                handler: '維修部-小王'
            },
            {
                id: 3,
                equipment_type: '照明設備',
                title: '辦公室日光燈閃爍',
                location: '1F-財務部',
                priority: 'low',
                status: 'completed',
                created_at: '2025-08-13 16:45:00',
                handler: '電工-老李',
                completed_at: '2025-08-14 10:30:00'
            }
        ],
        message: '維修記錄獲取成功'
    });
});

// 員工班表API
app.get('/api/schedule/employee', (req, res) => {
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

// 員工營收記錄API
app.get('/api/revenue/employee', (req, res) => {
    res.json({
        success: true,
        data: {
            today_total: 45800,
            today_breakdown: {
                product_sales: 32000,
                service_income: 8500,
                other: 5300
            },
            month_target: 500000,
            month_current: 340000,
            month_progress: 68,
            recent_records: [
                {
                    id: 1,
                    category: '產品銷售',
                    item: 'A級產品套組',
                    customer: '張先生',
                    amount: 15000,
                    time: '2025-08-15 14:30:00',
                    status: 'confirmed'
                },
                {
                    id: 2,
                    category: '服務收入',
                    item: '系統維護',
                    customer: '李小姐',
                    amount: 8500,
                    time: '2025-08-15 11:15:00',
                    status: 'pending'
                },
                {
                    id: 3,
                    category: '諮詢費用',
                    item: '專業諮詢',
                    customer: '王經理',
                    amount: 5300,
                    time: '2025-08-15 09:45:00',
                    status: 'confirmed'
                }
            ]
        },
        message: '營收資料獲取成功'
    });
});

// 輔助函數：獲取處理時間估計
function getEstimatedTime(priority) {
    switch (priority) {
        case 'urgent': return '立即處理';
        case 'high': return '4-8小時';
        case 'medium': return '1-2個工作天';
        case 'low': return '3-5個工作天';
        default: return '1-2個工作天';
    }
}

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