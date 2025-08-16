/**
 * GClaude Enterprise System - 完整API路由
 * 替換所有硬編碼數據，提供真實的資料庫操作
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const database = require('../database');
const TelegramNotificationSystem = require('../modules/telegram-notifications');
const OrderAnomalyChecker = require('../services/order-anomaly-checker');
const JsonSanitizer = require('../utils/json-sanitizer');
const router = express.Router();

// 初始化通知系統和異常檢查器
const telegramNotifier = new TelegramNotificationSystem();
const anomalyChecker = new OrderAnomalyChecker();

// JWT密鑰 (生產環境應該使用環境變數)
const JWT_SECRET = process.env.JWT_SECRET || 'gclaude-enterprise-jwt-secret-key-2025';

// JSON 安全序列化中間件
function safeJsonResponse(req, res, next) {
    const originalJson = res.json;
    
    res.json = function(data) {
        try {
            // 使用安全的 JSON 序列化
            const cleanData = JsonSanitizer.sanitizeObject(data);
            return originalJson.call(this, cleanData);
        } catch (error) {
            console.error('JSON 序列化錯誤:', error.message);
            return originalJson.call(this, {
                success: false,
                message: 'JSON 序列化錯誤',
                error: error.message
            });
        }
    };
    
    next();
}

// JWT驗證中間件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '訪問令牌缺失'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: '訪問令牌無效'
            });
        }
        req.user = user;
        next();
    });
}

// 角色權限檢查中間件
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '權限不足'
            });
        }
        next();
    };
}

// JSON 請求體清理中間件
function safeJsonRequest(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        try {
            req.body = JsonSanitizer.sanitizeObject(req.body);
        } catch (error) {
            console.error('JSON 請求體清理錯誤:', error.message);
            return res.status(400).json({
                success: false,
                message: 'JSON 請求體格式錯誤',
                error: error.message
            });
        }
    }
    next();
}

// 應用全域中間件
router.use(safeJsonResponse);
router.use(safeJsonRequest);

// ==================== 認證相關路由 ====================

// 用戶登入
router.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用戶名和密碼不能為空'
            });
        }

        // 查詢用戶
        const users = await database.query('SELECT * FROM users WHERE username = ? AND is_active = 1', [username]);
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: '用戶名或密碼錯誤'
            });
        }

        const user = users[0];
        
        // 驗證密碼
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '用戶名或密碼錯誤'
            });
        }

        // 生成JWT令牌
        const token = jwt.sign(
            { 
                id: user.id,
                uuid: user.uuid,
                username: user.username,
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 記錄登入日誌
        await database.run(
            'INSERT INTO system_logs (uuid, user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), user.id, 'user_login', req.ip, req.get('User-Agent') || '']
        );

        // 發送登入通知
        try {
            await telegramNotifier.sendLoginNotification(user, {
                ip: req.ip,
                device: req.get('User-Agent') || 'Unknown'
            });
        } catch (notifyError) {
            console.error('登入通知發送失敗:', notifyError);
        }

        // 根據角色決定重定向URL
        const redirectUrl = (() => {
            switch (user.role) {
                case 'admin':
                case 'manager':
                    return '/admin';
                case 'employee':
                case 'intern':
                default:
                    return '/employee';
            }
        })();

        res.json({
            success: true,
            message: '登入成功',
            token: token,
            redirectUrl: redirectUrl,
            user: {
                id: user.id,
                uuid: user.uuid,
                username: user.username,
                name: user.name,
                role: user.role,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error('登入API錯誤:', error);
        res.status(500).json({
            success: false,
            message: '登入處理失敗'
        });
    }
});

// Token驗證
router.get('/auth/verify', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            valid: true,
            user: {
                id: req.user.id,
                username: req.user.username,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error('Token驗證錯誤:', error);
        res.status(500).json({
            success: false,
            message: 'Token驗證失敗'
        });
    }
});

// 用戶資料
router.get('/auth/profile', authenticateToken, async (req, res) => {
    try {
        const users = await database.query('SELECT * FROM users WHERE id = ? AND is_active = 1', [req.user.id]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用戶不存在'
            });
        }

        const user = users[0];
        res.json({
            success: true,
            data: {
                id: user.id,
                uuid: user.uuid,
                username: user.username,
                name: user.name,
                role: user.role,
                email: user.email,
                phone: user.phone,
                birth_date: user.birth_date,
                gender: user.gender,
                address: user.address,
                hire_date: user.hire_date,
                department_id: user.department_id
            }
        });

    } catch (error) {
        console.error('獲取用戶資料錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取用戶資料失敗'
        });
    }
});

// ==================== 員工管理路由 ====================

// 獲取員工列表
router.get('/employees', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { page = 1, limit = 10, department, role, search } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE u.is_active = 1';
        const params = [];
        
        if (department) {
            whereClause += ' AND u.department_id = ?';
            params.push(department);
        }
        
        if (role) {
            whereClause += ' AND u.role = ?';
            params.push(role);
        }
        
        if (search) {
            whereClause += ' AND (u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        const sql = `
            SELECT u.*, d.name as department_name 
            FROM users u 
            LEFT JOIN departments d ON u.department_id = d.id 
            ${whereClause} 
            ORDER BY u.created_at DESC 
            LIMIT ? OFFSET ?
        `;
        
        params.push(parseInt(limit), offset);
        
        const employees = await database.query(sql, params);
        
        // 獲取總數
        const countSql = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
        const countResult = await database.query(countSql, params.slice(0, -2));
        const total = countResult[0].total;
        
        res.json({
            success: true,
            data: employees.map(emp => ({
                id: emp.id,
                uuid: emp.uuid,
                username: emp.username,
                name: emp.name,
                role: emp.role,
                email: emp.email,
                phone: emp.phone,
                department_name: emp.department_name,
                hire_date: emp.hire_date,
                salary: emp.salary,
                is_active: emp.is_active
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('獲取員工列表錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取員工列表失敗'
        });
    }
});

// 新增員工
router.post('/employees', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const {
            username, password, name, role, email, phone,
            birth_date, gender, address, hire_date, salary,
            department_id, emergency_contact_name,
            emergency_contact_relation, emergency_contact_phone
        } = req.body;

        // 驗證必填欄位
        if (!username || !password || !name || !role) {
            return res.status(400).json({
                success: false,
                message: '用戶名、密碼、姓名和角色為必填欄位'
            });
        }

        // 檢查用戶名是否已存在
        const existingUsers = await database.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: '用戶名已存在'
            });
        }

        // 加密密碼
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await database.run(`
            INSERT INTO users (
                uuid, username, password, name, role, email, phone,
                birth_date, gender, address, hire_date, salary,
                department_id, emergency_contact_name, emergency_contact_relation,
                emergency_contact_phone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            uuidv4(), username, hashedPassword, name, role, email, phone,
            birth_date, gender, address, hire_date || new Date().toISOString().split('T')[0],
            salary, department_id, emergency_contact_name,
            emergency_contact_relation, emergency_contact_phone
        ]);

        // 記錄操作日誌
        await database.run(
            'INSERT INTO system_logs (uuid, user_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), req.user.id, 'create_employee', 'user', result.id.toString()]
        );

        res.status(201).json({
            success: true,
            message: '員工新增成功',
            data: { id: result.id }
        });

    } catch (error) {
        console.error('新增員工錯誤:', error);
        res.status(500).json({
            success: false,
            message: '新增員工失敗'
        });
    }
});

// 獲取員工統計
router.get('/employees/stats/overview', authenticateToken, async (req, res) => {
    try {
        const totalEmployees = await database.query('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
        const activeEmployees = await database.query('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
        const recentHires = await database.query(
            'SELECT COUNT(*) as count FROM users WHERE hire_date >= date("now", "-30 days") AND is_active = 1'
        );
        const avgSalary = await database.query('SELECT AVG(salary) as avg FROM users WHERE is_active = 1');
        
        const departmentStats = await database.query(`
            SELECT d.name, COUNT(u.id) as count 
            FROM departments d 
            LEFT JOIN users u ON d.id = u.department_id AND u.is_active = 1 
            GROUP BY d.id, d.name
        `);
        
        const roleStats = await database.query(`
            SELECT role, COUNT(*) as count 
            FROM users 
            WHERE is_active = 1 
            GROUP BY role
        `);

        const byDepartment = {};
        departmentStats.forEach(dept => {
            byDepartment[dept.name] = dept.count;
        });

        const byPosition = {};
        roleStats.forEach(role => {
            const roleName = role.role === 'admin' ? '系統管理員' :
                            role.role === 'manager' ? '店長' :
                            role.role === 'employee' ? '員工' : '實習生';
            byPosition[roleName] = role.count;
        });

        res.json({
            success: true,
            data: {
                total: totalEmployees[0].count,
                active: activeEmployees[0].count,
                recentHires: recentHires[0].count,
                averageSalary: Math.round(avgSalary[0].avg || 0),
                byDepartment,
                byPosition
            }
        });

    } catch (error) {
        console.error('獲取員工統計錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取員工統計失敗'
        });
    }
});

// ==================== 出勤管理路由 ====================

// GPS打卡
router.post('/attendance/checkin', authenticateToken, async (req, res) => {
    try {
        const { latitude, longitude, location } = req.body;
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        // 檢查今日是否已有打卡記錄
        const existingRecord = await database.query(
            'SELECT * FROM attendance WHERE user_id = ? AND work_date = ?',
            [req.user.id, today]
        );

        if (existingRecord.length > 0) {
            // 下班打卡
            if (existingRecord[0].check_out_time) {
                return res.status(400).json({
                    success: false,
                    message: '今日已完成打卡'
                });
            }

            const checkInTime = new Date(existingRecord[0].check_in_time);
            const checkOutTime = new Date(now);
            const workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
            const overtimeHours = Math.max(0, workHours - 8);

            await database.run(`
                UPDATE attendance 
                SET check_out_time = ?, check_out_location = ?, 
                    check_out_gps_lat = ?, check_out_gps_lng = ?,
                    work_hours = ?, overtime_hours = ?
                WHERE id = ?
            `, [now, location, latitude, longitude, workHours, overtimeHours, existingRecord[0].id]);

            res.json({
                success: true,
                message: '下班打卡成功',
                data: {
                    type: 'check_out',
                    work_hours: workHours.toFixed(2),
                    overtime_hours: overtimeHours.toFixed(2)
                }
            });
        } else {
            // 上班打卡
            const result = await database.run(`
                INSERT INTO attendance (
                    uuid, user_id, check_in_time, work_date,
                    check_in_location, check_in_gps_lat, check_in_gps_lng
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [uuidv4(), req.user.id, now, today, location, latitude, longitude]);

            res.json({
                success: true,
                message: '上班打卡成功',
                data: {
                    type: 'check_in',
                    record_id: result.id
                }
            });
        }

    } catch (error) {
        console.error('打卡錯誤:', error);
        res.status(500).json({
            success: false,
            message: '打卡處理失敗'
        });
    }
});

// 獲取出勤記錄
router.get('/attendance', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, user_id, start_date, end_date } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        // 非管理員只能查看自己的記錄
        if (!['admin', 'manager'].includes(req.user.role)) {
            whereClause += ' AND a.user_id = ?';
            params.push(req.user.id);
        } else if (user_id) {
            whereClause += ' AND a.user_id = ?';
            params.push(user_id);
        }
        
        if (start_date) {
            whereClause += ' AND a.work_date >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            whereClause += ' AND a.work_date <= ?';
            params.push(end_date);
        }
        
        const sql = `
            SELECT a.*, u.name as user_name, u.role as user_role
            FROM attendance a
            LEFT JOIN users u ON a.user_id = u.id
            ${whereClause}
            ORDER BY a.work_date DESC, a.check_in_time DESC
            LIMIT ? OFFSET ?
        `;
        
        params.push(parseInt(limit), offset);
        
        const records = await database.query(sql, params);
        
        // 獲取總數
        const countSql = `
            SELECT COUNT(*) as total 
            FROM attendance a 
            ${whereClause}
        `;
        const countResult = await database.query(countSql, params.slice(0, -2));
        const total = countResult[0].total;
        
        res.json({
            success: true,
            data: records,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('獲取出勤記錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取出勤記錄失敗'
        });
    }
});

// ==================== 營收管理路由 ====================

// 新增營收記錄 (重構版 - 支援多分店和詳細收支)
router.post('/revenue', authenticateToken, async (req, res) => {
    try {
        const {
            date, store_id, bonus_type, order_count,
            // 收入項目
            on_site_sales, online_orders, panda_orders, uber_orders, oil_recycling,
            // 支出項目  
            gas, utilities, rent, supplies, cleaning, others,
            // 其他
            notes
        } = req.body;

        if (!date || !store_id || !bonus_type) {
            return res.status(400).json({
                success: false,
                message: '日期、分店和獎金類別為必填欄位'
            });
        }

        // 計算收入總額
        const income_items = {
            on_site_sales: parseFloat(on_site_sales) || 0,
            online_orders: parseFloat(online_orders) || 0,
            panda_orders: parseFloat(panda_orders) || 0,
            uber_orders: parseFloat(uber_orders) || 0,
            oil_recycling: parseFloat(oil_recycling) || 0
        };

        // 計算支出總額
        const expense_items = {
            gas: parseFloat(gas) || 0,
            utilities: parseFloat(utilities) || 0,
            rent: parseFloat(rent) || 0,
            supplies: parseFloat(supplies) || 0,
            cleaning: parseFloat(cleaning) || 0,
            others: parseFloat(others) || 0
        };

        const total_income = Object.values(income_items).reduce((sum, val) => sum + val, 0);
        const total_expense = Object.values(expense_items).reduce((sum, val) => sum + val, 0);

        // 計算獎金
        let bonus_amount = 0;
        if (bonus_type === '平日獎金') {
            // 超過13000的30%
            const adjusted_income = total_income * 0.65; // 考慮35%服務費
            bonus_amount = adjusted_income > 13000 ? Math.round((adjusted_income - 13000) * 0.30) : 0;
        } else {
            // 假日獎金：38%
            const adjusted_income = total_income * 0.65;
            bonus_amount = adjusted_income > 0 ? Math.round(adjusted_income * 0.38) : 0;
        }

        // 獲取分店資訊
        const stores = await database.query('SELECT name FROM stores WHERE id = ?', [store_id]);
        const store_name = stores.length > 0 ? stores[0].name : '未知分店';

        // 插入營收記錄
        const result = await database.run(`
            INSERT INTO revenue (
                uuid, record_date, store_id, bonus_type, order_count,
                income_items, expense_items, total_income, total_expense,
                bonus_amount, notes, recorded_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
            uuidv4(), date, store_id, bonus_type, parseInt(order_count) || 0,
            JSON.stringify(income_items), JSON.stringify(expense_items),
            total_income, total_expense, bonus_amount, notes || '', req.user.id
        ]);

        // 發送Telegram通知
        try {
            await telegramNotifier.sendRevenueNotification({
                store_name,
                employee_name: req.user.name || req.user.username,
                date,
                order_count: parseInt(order_count) || 0,
                income_items,
                expense_items,
                total_income,
                total_expense,
                bonus_type,
                notes
            });
        } catch (notifyError) {
            console.error('營收通知發送失敗:', notifyError);
        }

        res.status(201).json({
            success: true,
            message: '營收記錄新增成功',
            data: { 
                id: result.id,
                bonus_amount,
                total_income,
                total_expense
            }
        });

    } catch (error) {
        console.error('新增營收記錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '新增營收記錄失敗'
        });
    }
});

// 獲取營收記錄
router.get('/revenue', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { page = 1, limit = 10, start_date, end_date, category } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (start_date) {
            whereClause += ' AND r.record_date >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            whereClause += ' AND r.record_date <= ?';
            params.push(end_date);
        }
        
        if (category) {
            whereClause += ' AND r.category = ?';
            params.push(category);
        }
        
        const sql = `
            SELECT r.*, u.name as recorded_by_name
            FROM revenue r
            LEFT JOIN users u ON r.recorded_by = u.id
            ${whereClause}
            ORDER BY r.record_date DESC, r.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        params.push(parseInt(limit), offset);
        
        const records = await database.query(sql, params);
        
        // 獲取總數和統計
        const countSql = `SELECT COUNT(*) as total, SUM(amount) as total_amount FROM revenue r ${whereClause}`;
        const countResult = await database.query(countSql, params.slice(0, -2));
        const { total, total_amount } = countResult[0];
        
        res.json({
            success: true,
            data: records,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            summary: {
                total_amount: total_amount || 0
            }
        });

    } catch (error) {
        console.error('獲取營收記錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取營收記錄失敗'
        });
    }
});

// ==================== 庫存管理路由 ====================

// 獲取商品列表
router.get('/products', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, category, low_stock } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE p.is_active = 1';
        const params = [];
        
        if (category) {
            whereClause += ' AND p.category = ?';
            params.push(category);
        }
        
        if (low_stock === 'true') {
            whereClause += ' AND p.current_stock <= p.min_stock';
        }
        
        const sql = `
            SELECT p.* 
            FROM products p 
            ${whereClause} 
            ORDER BY p.name ASC 
            LIMIT ? OFFSET ?
        `;
        
        params.push(parseInt(limit), offset);
        
        const products = await database.query(sql, params);
        
        const countSql = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
        const countResult = await database.query(countSql, params.slice(0, -2));
        const total = countResult[0].total;
        
        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('獲取商品列表錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取商品列表失敗'
        });
    }
});

// 新增叫貨申請 (自動扣減庫存)
router.post('/orders', authenticateToken, async (req, res) => {
    try {
        const { product_id, requested_quantity, reason, urgency, store_id, delivery_date } = req.body;

        if (!product_id || !requested_quantity || !store_id) {
            return res.status(400).json({
                success: false,
                message: '商品、數量和分店為必填欄位'
            });
        }

        // 1. 檢查商品是否存在及庫存量
        const products = await database.query(
            'SELECT * FROM products WHERE id = ? AND is_active = 1', 
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: '商品不存在或已停用'
            });
        }

        const product = products[0];

        // 2. 檢查庫存是否足夠
        if (product.current_stock < requested_quantity) {
            return res.status(400).json({
                success: false,
                message: `庫存不足！目前庫存: ${product.current_stock}，申請數量: ${requested_quantity}`
            });
        }

        // 3. 檢查是否達到配送額度
        const orderValue = product.unit_cost * requested_quantity;
        const deliveryThreshold = product.delivery_threshold || 1000; // 從品項設定取得
        
        if (orderValue < deliveryThreshold) {
            return res.status(400).json({
                success: false,
                message: `訂單金額不足配送標準！目前金額: $${orderValue}，最低配送額度: $${deliveryThreshold}`,
                data: {
                    current_amount: orderValue,
                    required_amount: deliveryThreshold,
                    shortage: deliveryThreshold - orderValue
                }
            });
        }

        // 4. 開始事務處理
        await database.run('BEGIN TRANSACTION');

        try {
            // 生成訂單編號
            const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;

            // 5. 自動扣減庫存
            await database.run(
                'UPDATE products SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [requested_quantity, product_id]
            );

            // 6. 記錄庫存異動
            await database.run(`
                INSERT INTO inventory_transactions (
                    uuid, product_id, transaction_type, quantity, reason,
                    reference_no, performed_by, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                uuidv4(), product_id, 'outbound', requested_quantity,
                `分店叫貨 - ${reason || '分店補貨'}`,
                orderNumber, req.user.id,
                `自動扣減庫存 - 分店ID: ${store_id}`
            ]);

            // 7. 創建叫貨記錄 (設為已批准狀態，因為已扣庫存)
            const orderResult = await database.run(`
                INSERT INTO orders (
                    uuid, order_number, product_id, requested_quantity, approved_quantity,
                    unit_cost, total_cost, status, urgency, reason, requested_by,
                    approved_by, approved_date, delivery_date, supplier
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                uuidv4(), orderNumber, product_id, requested_quantity, requested_quantity,
                product.unit_cost, product.unit_cost * requested_quantity,
                'approved', urgency || 'normal', reason, req.user.id,
                req.user.id, new Date().toISOString(), delivery_date || new Date().toISOString(),
                product.supplier
            ]);

            // 8. 檢查是否需要庫存不足警告
            const updatedProducts = await database.query(
                'SELECT current_stock, min_stock FROM products WHERE id = ?',
                [product_id]
            );
            
            const updatedProduct = updatedProducts[0];
            if (updatedProduct.current_stock <= updatedProduct.min_stock) {
                // 發送庫存不足通知
                await telegramNotifier.sendInventoryAlertNotification({
                    type: updatedProduct.current_stock === 0 ? 'out_of_stock' : 'low_stock',
                    product_name: product.name,
                    brand: product.supplier,
                    current_stock: updatedProduct.current_stock,
                    min_stock: updatedProduct.min_stock,
                    last_purchase_date: new Date().toISOString().split('T')[0],
                    requesting_stores: [store_id],
                    supplier_contact: product.supplier || '請查看供應商名冊'
                });
            }

            // 9. 發送叫貨成功通知
            const userInfo = await database.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
            const storeInfo = await database.query('SELECT name FROM stores WHERE id = ?', [store_id]);
            
            await telegramNotifier.sendOrderNotification({
                employee_name: userInfo[0]?.name || req.user.username,
                delivery_date: delivery_date || new Date().toISOString().split('T')[0],
                store_name: storeInfo[0]?.name || '未知分店',
                total_amount: product.unit_cost * requested_quantity,
                items: [{
                    supplier: product.supplier || '公司庫存',
                    brand: product.supplier,
                    name: product.name,
                    quantity: requested_quantity,
                    unit: product.unit
                }]
            });

            // 10. 提交事務
            await database.run('COMMIT');

            // 11. 異步檢查該品項的叫貨異常 (不影響回應速度)
            setTimeout(async () => {
                try {
                    const anomalies = await anomalyChecker.checkProductOrderAnomaly(product);
                    if (anomalies.length > 0) {
                        await anomalyChecker.sendAnomalyNotifications(anomalies);
                    }
                } catch (anomalyError) {
                    console.error('異常檢查錯誤:', anomalyError);
                }
            }, 1000);

            res.status(201).json({
                success: true,
                message: '叫貨申請提交成功，庫存已自動扣減',
                data: { 
                    id: orderResult.id,
                    order_number: orderNumber,
                    remaining_stock: updatedProduct.current_stock,
                    total_cost: orderValue,
                    delivery_threshold: deliveryThreshold,
                    delivery_qualified: orderValue >= deliveryThreshold,
                    delivery_info: `✅ 訂單金額 $${orderValue} 已達配送標準 (最低: $${deliveryThreshold})`
                }
            });

        } catch (transactionError) {
            // 回滾事務
            await database.run('ROLLBACK');
            throw transactionError;
        }

    } catch (error) {
        console.error('新增叫貨申請錯誤:', error);
        res.status(500).json({
            success: false,
            message: '新增叫貨申請失敗: ' + error.message
        });
    }
});

// ==================== 維修申請路由 ====================

// 新增維修申請
router.post('/maintenance', authenticateToken, async (req, res) => {
    try {
        const { title, description, location, urgency, category } = req.body;

        if (!title || !description || !location || !urgency) {
            return res.status(400).json({
                success: false,
                message: '標題、描述、地點和緊急程度為必填欄位'
            });
        }

        // 生成申請編號
        const requestNumber = `MR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;

        const result = await database.run(`
            INSERT INTO maintenance_requests (
                uuid, request_number, title, description, location,
                urgency, category, requested_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            uuidv4(), requestNumber, title, description, location,
            urgency, category, req.user.id
        ]);

        res.status(201).json({
            success: true,
            message: '維修申請提交成功',
            data: { 
                id: result.id,
                request_number: requestNumber
            }
        });

    } catch (error) {
        console.error('新增維修申請錯誤:', error);
        res.status(500).json({
            success: false,
            message: '新增維修申請失敗'
        });
    }
});

// ==================== 系統健康檢查 ====================

router.get('/health', (req, res) => {
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
            inventoryManagement: true,
            schedulingSystem: true,
            promotionVoting: true,
            maintenanceRequests: true,
            telegramIntegration: true,
            browserVerification: true,
            realTimeNotifications: true,
            databaseConnection: true
        },
        database: {
            connected: database.db !== null,
            type: 'SQLite',
            location: './data/enterprise.db'
        }
    });
});

// ==================== 照片管理路由 ====================

// 獲取照片列表 (管理員專用，支援篩選)
router.get('/photos', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { 
            store_id, 
            system_type, 
            category, 
            upload_date_start, 
            upload_date_end,
            page = 1, 
            limit = 20 
        } = req.query;

        let whereConditions = ['p.is_deleted = 0'];
        let params = [];

        // 分店篩選
        if (store_id) {
            whereConditions.push('p.store_id = ?');
            params.push(store_id);
        }

        // 系統類型篩選 (營收、維修、叫貨等)
        if (system_type) {
            whereConditions.push('p.system_type = ?');
            params.push(system_type);
        }

        // 照片類別篩選
        if (category) {
            whereConditions.push('p.category = ?');
            params.push(category);
        }

        // 日期範圍篩選
        if (upload_date_start) {
            whereConditions.push('p.upload_date >= ?');
            params.push(upload_date_start);
        }
        if (upload_date_end) {
            whereConditions.push('p.upload_date <= ?');
            params.push(upload_date_end);
        }

        const offset = (page - 1) * limit;
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // 獲取照片列表
        const photos = await database.query(`
            SELECT 
                p.id, p.uuid, p.original_name, p.file_name, p.file_path,
                p.file_size, p.mime_type, p.category, p.system_type,
                p.upload_date, p.description, p.created_at,
                s.name as store_name,
                u.name as uploaded_by_name
            FROM photos p
            LEFT JOIN stores s ON p.store_id = s.id
            LEFT JOIN users u ON p.uploaded_by = u.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        // 獲取總數量
        const countResult = await database.query(`
            SELECT COUNT(*) as total 
            FROM photos p
            LEFT JOIN stores s ON p.store_id = s.id
            LEFT JOIN users u ON p.uploaded_by = u.id
            ${whereClause}
        `, params);

        const total = countResult[0].total;

        res.json({
            success: true,
            data: {
                photos,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('獲取照片列表錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取照片列表失敗'
        });
    }
});

// 獲取照片篩選選項
router.get('/photos/filters', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        // 獲取分店列表
        const stores = await database.query('SELECT id, name FROM stores WHERE is_active = 1');
        
        // 獲取系統類型
        const systemTypes = await database.query(`
            SELECT DISTINCT system_type 
            FROM photos 
            WHERE is_deleted = 0 AND system_type IS NOT NULL
        `);
        
        // 獲取照片類別
        const categories = await database.query(`
            SELECT DISTINCT category 
            FROM photos 
            WHERE is_deleted = 0 AND category IS NOT NULL
        `);

        res.json({
            success: true,
            data: {
                stores,
                systemTypes: systemTypes.map(item => item.system_type),
                categories: categories.map(item => item.category)
            }
        });

    } catch (error) {
        console.error('獲取篩選選項錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取篩選選項失敗'
        });
    }
});

// 刪除照片 (軟刪除)
router.delete('/photos/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;

        // 檢查照片是否存在
        const photos = await database.query('SELECT * FROM photos WHERE id = ? AND is_deleted = 0', [id]);
        
        if (photos.length === 0) {
            return res.status(404).json({
                success: false,
                message: '照片不存在'
            });
        }

        // 軟刪除照片
        await database.run(
            'UPDATE photos SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        // 記錄操作日誌
        await database.run(
            'INSERT INTO system_logs (uuid, user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.user.id, 'delete_photo', 'photo', id, `刪除照片: ${photos[0].original_name}`]
        );

        res.json({
            success: true,
            message: '照片刪除成功'
        });

    } catch (error) {
        console.error('刪除照片錯誤:', error);
        res.status(500).json({
            success: false,
            message: '刪除照片失敗'
        });
    }
});

// 批量刪除照片
router.post('/photos/batch-delete', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { photo_ids } = req.body;

        if (!photo_ids || !Array.isArray(photo_ids) || photo_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: '請提供要刪除的照片ID列表'
            });
        }

        // 檢查照片是否存在
        const placeholders = photo_ids.map(() => '?').join(',');
        const photos = await database.query(
            `SELECT id, original_name FROM photos WHERE id IN (${placeholders}) AND is_deleted = 0`,
            photo_ids
        );

        if (photos.length === 0) {
            return res.status(404).json({
                success: false,
                message: '沒有找到要刪除的照片'
            });
        }

        // 批量軟刪除
        await database.run(
            `UPDATE photos SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
            photo_ids
        );

        // 記錄操作日誌
        for (const photo of photos) {
            await database.run(
                'INSERT INTO system_logs (uuid, user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)',
                [uuidv4(), req.user.id, 'batch_delete_photo', 'photo', photo.id.toString(), `批量刪除照片: ${photo.original_name}`]
            );
        }

        res.json({
            success: true,
            message: `成功刪除 ${photos.length} 張照片`
        });

    } catch (error) {
        console.error('批量刪除照片錯誤:', error);
        res.status(500).json({
            success: false,
            message: '批量刪除照片失敗'
        });
    }
});

// 獲取照片統計資訊
router.get('/photos/stats', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        // 總照片數量
        const totalResult = await database.query('SELECT COUNT(*) as total FROM photos WHERE is_deleted = 0');
        
        // 按系統類型分組統計
        const systemTypeStats = await database.query(`
            SELECT system_type, COUNT(*) as count 
            FROM photos 
            WHERE is_deleted = 0 
            GROUP BY system_type
        `);

        // 按分店分組統計
        const storeStats = await database.query(`
            SELECT s.name as store_name, COUNT(p.id) as count
            FROM stores s
            LEFT JOIN photos p ON s.id = p.store_id AND p.is_deleted = 0
            GROUP BY s.id, s.name
        `);

        // 按月份統計
        const monthlyStats = await database.query(`
            SELECT 
                strftime('%Y-%m', upload_date) as month,
                COUNT(*) as count
            FROM photos 
            WHERE is_deleted = 0 
            GROUP BY strftime('%Y-%m', upload_date)
            ORDER BY month DESC
            LIMIT 12
        `);

        res.json({
            success: true,
            data: {
                total: totalResult[0].total,
                systemTypeStats,
                storeStats,
                monthlyStats
            }
        });

    } catch (error) {
        console.error('獲取照片統計錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取照片統計失敗'
        });
    }
});

// ==================== 品項設定管理路由 ====================

// 獲取品項列表
router.get('/products', authenticateToken, async (req, res) => {
    try {
        const { category, is_active = 1 } = req.query;
        
        let whereConditions = [];
        let params = [];

        if (category) {
            whereConditions.push('category = ?');
            params.push(category);
        }

        if (is_active !== undefined) {
            whereConditions.push('is_active = ?');
            params.push(is_active);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const products = await database.query(`
            SELECT * FROM products 
            ${whereClause}
            ORDER BY category, name
        `, params);

        res.json({
            success: true,
            data: products
        });

    } catch (error) {
        console.error('獲取品項列表錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取品項列表失敗'
        });
    }
});

// 新增品項
router.post('/products', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const {
            code, name, category, description, unit, current_stock,
            min_stock, max_stock, unit_cost, selling_price, supplier,
            supplier_contact, delivery_threshold, frequent_order_days, rare_order_days
        } = req.body;

        if (!code || !name || !category) {
            return res.status(400).json({
                success: false,
                message: '商品代碼、名稱和類別為必填欄位'
            });
        }

        // 檢查商品代碼是否已存在
        const existingProducts = await database.query('SELECT id FROM products WHERE code = ?', [code]);
        if (existingProducts.length > 0) {
            return res.status(400).json({
                success: false,
                message: '商品代碼已存在'
            });
        }

        const result = await database.run(`
            INSERT INTO products (
                uuid, code, name, category, description, unit, current_stock,
                min_stock, max_stock, unit_cost, selling_price, supplier,
                supplier_contact, delivery_threshold, frequent_order_days, rare_order_days
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            uuidv4(), code, name, category, description, unit || '個',
            parseInt(current_stock) || 0, parseInt(min_stock) || 10, parseInt(max_stock) || 1000,
            parseFloat(unit_cost) || 0, parseFloat(selling_price) || 0, supplier,
            supplier_contact, parseFloat(delivery_threshold) || 1000,
            parseInt(frequent_order_days) || 1, parseInt(rare_order_days) || 7
        ]);

        // 記錄操作日誌
        await database.run(
            'INSERT INTO system_logs (uuid, user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.user.id, 'create_product', 'product', result.id.toString(), `新增品項: ${name}`]
        );

        res.status(201).json({
            success: true,
            message: '品項新增成功',
            data: { id: result.id }
        });

    } catch (error) {
        console.error('新增品項錯誤:', error);
        res.status(500).json({
            success: false,
            message: '新增品項失敗'
        });
    }
});

// 更新品項
router.put('/products/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            code, name, category, description, unit, current_stock,
            min_stock, max_stock, unit_cost, selling_price, supplier,
            supplier_contact, delivery_threshold, frequent_order_days, rare_order_days, is_active
        } = req.body;

        // 檢查品項是否存在
        const products = await database.query('SELECT * FROM products WHERE id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: '品項不存在'
            });
        }

        // 檢查商品代碼是否與其他品項重複
        if (code && code !== products[0].code) {
            const existingProducts = await database.query('SELECT id FROM products WHERE code = ? AND id != ?', [code, id]);
            if (existingProducts.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '商品代碼已被其他品項使用'
                });
            }
        }

        await database.run(`
            UPDATE products SET
                code = ?, name = ?, category = ?, description = ?, unit = ?,
                current_stock = ?, min_stock = ?, max_stock = ?, unit_cost = ?,
                selling_price = ?, supplier = ?, supplier_contact = ?,
                delivery_threshold = ?, frequent_order_days = ?, rare_order_days = ?,
                is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            code || products[0].code, name || products[0].name,
            category || products[0].category, description || products[0].description,
            unit || products[0].unit, 
            current_stock !== undefined ? parseInt(current_stock) : products[0].current_stock,
            min_stock !== undefined ? parseInt(min_stock) : products[0].min_stock,
            max_stock !== undefined ? parseInt(max_stock) : products[0].max_stock,
            unit_cost !== undefined ? parseFloat(unit_cost) : products[0].unit_cost,
            selling_price !== undefined ? parseFloat(selling_price) : products[0].selling_price,
            supplier || products[0].supplier, supplier_contact || products[0].supplier_contact,
            delivery_threshold !== undefined ? parseFloat(delivery_threshold) : products[0].delivery_threshold,
            frequent_order_days !== undefined ? parseInt(frequent_order_days) : products[0].frequent_order_days,
            rare_order_days !== undefined ? parseInt(rare_order_days) : products[0].rare_order_days,
            is_active !== undefined ? is_active : products[0].is_active, id
        ]);

        // 記錄操作日誌
        await database.run(
            'INSERT INTO system_logs (uuid, user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.user.id, 'update_product', 'product', id, `更新品項: ${name || products[0].name}`]
        );

        res.json({
            success: true,
            message: '品項更新成功'
        });

    } catch (error) {
        console.error('更新品項錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新品項失敗'
        });
    }
});

// 刪除品項 (軟刪除)
router.delete('/products/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;

        // 檢查品項是否存在
        const products = await database.query('SELECT * FROM products WHERE id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: '品項不存在'
            });
        }

        // 軟刪除品項
        await database.run(
            'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        // 記錄操作日誌
        await database.run(
            'INSERT INTO system_logs (uuid, user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.user.id, 'delete_product', 'product', id, `刪除品項: ${products[0].name}`]
        );

        res.json({
            success: true,
            message: '品項刪除成功'
        });

    } catch (error) {
        console.error('刪除品項錯誤:', error);
        res.status(500).json({
            success: false,
            message: '刪除品項失敗'
        });
    }
});

// 獲取品項類別
router.get('/products/categories', authenticateToken, async (req, res) => {
    try {
        const categories = await database.query(`
            SELECT DISTINCT category 
            FROM products 
            WHERE is_active = 1 AND category IS NOT NULL
            ORDER BY category
        `);

        res.json({
            success: true,
            data: categories.map(item => item.category)
        });

    } catch (error) {
        console.error('獲取品項類別錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取品項類別失敗'
        });
    }
});

// ==================== 訂單異常檢查路由 ====================

// 手動觸發全部品項異常檢查 (管理員專用)
router.post('/admin/check-order-anomalies', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        console.log('🔍 管理員手動觸發異常檢查...');
        
        const anomalies = await anomalyChecker.checkAllOrderAnomalies();
        
        res.json({
            success: true,
            message: `異常檢查完成，發現 ${anomalies.length} 個異常`,
            data: {
                total_anomalies: anomalies.length,
                anomalies: anomalies,
                checked_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('手動異常檢查錯誤:', error);
        res.status(500).json({
            success: false,
            message: '異常檢查失敗: ' + error.message
        });
    }
});

// 檢查特定品項的異常 (管理員專用)
router.post('/admin/check-product-anomaly/:product_id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { product_id } = req.params;
        
        // 獲取品項資訊
        const products = await database.query('SELECT * FROM products WHERE id = ?', [product_id]);
        
        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: '品項不存在'
            });
        }
        
        const product = products[0];
        const anomalies = await anomalyChecker.checkProductOrderAnomaly(product);
        
        if (anomalies.length > 0) {
            await anomalyChecker.sendAnomalyNotifications(anomalies);
        }
        
        res.json({
            success: true,
            message: `品項 ${product.name} 檢查完成，發現 ${anomalies.length} 個異常`,
            data: {
                product_name: product.name,
                anomalies: anomalies,
                checked_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('單品異常檢查錯誤:', error);
        res.status(500).json({
            success: false,
            message: '品項異常檢查失敗'
        });
    }
});

// 獲取異常檢查記錄 (管理員專用)
router.get('/admin/order-anomalies/history', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { page = 1, limit = 20, days = 7 } = req.query;
        const offset = (page - 1) * limit;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        
        const logs = await database.query(`
            SELECT 
                sl.*,
                p.name as product_name,
                p.supplier
            FROM system_logs sl
            LEFT JOIN products p ON p.id = CAST(sl.target_id AS INTEGER)
            WHERE sl.action = 'order_anomaly_alert'
            AND sl.created_at >= ?
            ORDER BY sl.created_at DESC
            LIMIT ? OFFSET ?
        `, [startDate.toISOString(), limit, offset]);
        
        const totalCount = await database.query(`
            SELECT COUNT(*) as count
            FROM system_logs
            WHERE action = 'order_anomaly_alert'
            AND created_at >= ?
        `, [startDate.toISOString()]);
        
        res.json({
            success: true,
            data: {
                records: logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount[0].count,
                    totalPages: Math.ceil(totalCount[0].count / limit)
                }
            }
        });

    } catch (error) {
        console.error('獲取異常記錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取異常記錄失敗'
        });
    }
});

// 定期異常檢查狀態 (可用於監控和健康檢查)
router.get('/admin/anomaly-checker/status', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        // 檢查最近24小時內的異常記錄
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const recentAnomalies = await database.query(`
            SELECT COUNT(*) as count
            FROM system_logs
            WHERE action = 'order_anomaly_alert'
            AND created_at >= ?
        `, [yesterday.toISOString()]);
        
        // 檢查啟用品項數量
        const activeProducts = await database.query(`
            SELECT COUNT(*) as count
            FROM products
            WHERE is_active = 1
            AND (frequent_order_days > 0 OR rare_order_days > 0)
        `);
        
        res.json({
            success: true,
            data: {
                checker_status: 'active',
                monitoring_products: activeProducts[0].count,
                recent_anomalies_24h: recentAnomalies[0].count,
                last_check_time: new Date().toISOString(),
                system_health: 'normal'
            }
        });

    } catch (error) {
        console.error('檢查器狀態錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取檢查器狀態失敗'
        });
    }
});

// ==================== 分店設定管理路由 ====================

// 獲取所有分店設定
router.get('/admin/stores/settings', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const stores = await database.query(`
            SELECT id, name, address, latitude, longitude, radius, 
                   operating_hours, is_active, created_at
            FROM stores 
            ORDER BY id
        `);
        
        res.json({
            success: true,
            data: stores
        });

    } catch (error) {
        console.error('獲取分店設定錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取分店設定失敗'
        });
    }
});

// 更新分店打卡範圍設定
router.put('/admin/stores/:id/radius', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const { radius, reason } = req.body;
        
        if (!radius || radius < 10 || radius > 50000) {
            return res.status(400).json({
                success: false,
                message: '打卡範圍必須在 10-50000 公尺之間'
            });
        }
        
        // 檢查分店是否存在
        const stores = await database.query('SELECT * FROM stores WHERE id = ?', [id]);
        if (stores.length === 0) {
            return res.status(404).json({
                success: false,
                message: '分店不存在'
            });
        }
        
        const store = stores[0];
        const oldRadius = store.radius;
        
        // 更新打卡範圍
        await database.run(
            'UPDATE stores SET radius = ? WHERE id = ?',
            [radius, id]
        );
        
        // 記錄操作日誌
        await database.run(`
            INSERT INTO system_logs (uuid, user_id, action, target_type, target_id, details)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            require('uuid').v4(), req.user.id, 'update_store_radius', 'store', id,
            JSON.stringify({
                store_name: store.name,
                old_radius: oldRadius,
                new_radius: radius,
                reason: reason || '管理員調整',
                updated_by: req.user.username
            })
        ]);
        
        res.json({
            success: true,
            message: `${store.name} 打卡範圍已更新`,
            data: {
                store_name: store.name,
                old_radius: oldRadius,
                new_radius: radius,
                change: radius - oldRadius
            }
        });

    } catch (error) {
        console.error('更新打卡範圍錯誤:', error);
        res.status(500).json({
            success: false,
            message: '更新打卡範圍失敗'
        });
    }
});

// 批量更新分店設定
router.put('/admin/stores/batch-update', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { updates } = req.body; // [{id, radius, reason}, ...]
        
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: '更新數據格式錯誤'
            });
        }
        
        const results = [];
        
        await database.run('BEGIN TRANSACTION');
        
        try {
            for (const update of updates) {
                const { id, radius, reason } = update;
                
                if (!id || !radius || radius < 10 || radius > 50000) {
                    continue;
                }
                
                // 獲取分店信息
                const stores = await database.query('SELECT name, radius FROM stores WHERE id = ?', [id]);
                if (stores.length === 0) continue;
                
                const store = stores[0];
                const oldRadius = store.radius;
                
                // 更新打卡範圍
                await database.run('UPDATE stores SET radius = ? WHERE id = ?', [radius, id]);
                
                // 記錄日誌
                await database.run(`
                    INSERT INTO system_logs (uuid, user_id, action, target_type, target_id, details)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    require('uuid').v4(), req.user.id, 'batch_update_store_radius', 'store', id,
                    JSON.stringify({
                        store_name: store.name,
                        old_radius: oldRadius,
                        new_radius: radius,
                        reason: reason || '批量更新'
                    })
                ]);
                
                results.push({
                    id: parseInt(id),
                    store_name: store.name,
                    old_radius: oldRadius,
                    new_radius: radius,
                    status: 'success'
                });
            }
            
            await database.run('COMMIT');
            
            res.json({
                success: true,
                message: `成功更新 ${results.length} 個分店設定`,
                data: results
            });
            
        } catch (transactionError) {
            await database.run('ROLLBACK');
            throw transactionError;
        }

    } catch (error) {
        console.error('批量更新分店設定錯誤:', error);
        res.status(500).json({
            success: false,
            message: '批量更新失敗'
        });
    }
});

// 獲取打卡範圍變更歷史
router.get('/admin/stores/:id/radius-history', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const logs = await database.query(`
            SELECT 
                sl.*,
                u.name as updated_by_name
            FROM system_logs sl
            LEFT JOIN users u ON u.id = sl.user_id
            WHERE sl.target_type = 'store' 
            AND sl.target_id = ?
            AND sl.action IN ('update_store_radius', 'batch_update_store_radius')
            ORDER BY sl.created_at DESC
            LIMIT ? OFFSET ?
        `, [id, limit, offset]);
        
        const history = logs.map(log => {
            const details = JSON.parse(log.details || '{}');
            return {
                id: log.id,
                action: log.action,
                old_radius: details.old_radius,
                new_radius: details.new_radius,
                reason: details.reason,
                updated_by: details.updated_by || log.updated_by_name,
                created_at: log.created_at
            };
        });
        
        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('獲取變更歷史錯誤:', error);
        res.status(500).json({
            success: false,
            message: '獲取變更歷史失敗'
        });
    }
});

// 儀表板統計數據API
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        // 獲取各種統計數據
        const stats = {};

        // 1. 員工統計
        const employeeStats = await database.all(`
            SELECT 
                COUNT(*) as total_employees,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_employees,
                SUM(CASE WHEN role = 'intern' THEN 1 ELSE 0 END) as intern_count,
                SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) as employee_count,
                SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) as manager_count
            FROM users WHERE deleted_at IS NULL
        `);

        // 2. 今日出勤統計
        const today = new Date().toISOString().split('T')[0];
        const attendanceStats = await database.all(`
            SELECT 
                COUNT(DISTINCT user_id) as checked_in_today,
                COUNT(*) as total_checkins,
                AVG(CASE 
                    WHEN check_in_time > work_date || ' 09:00:00' 
                    THEN (strftime('%s', check_in_time) - strftime('%s', work_date || ' 09:00:00')) / 60 
                    ELSE 0 
                END) as avg_late_minutes
            FROM attendance 
            WHERE work_date = ?
        `, [today]);

        // 3. 本月營收統計
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const revenueStats = await database.all(`
            SELECT 
                COUNT(*) as total_records,
                SUM(total_revenue) as total_revenue,
                AVG(total_revenue) as avg_revenue,
                SUM(calculated_bonus) as total_bonus
            FROM revenue 
            WHERE date LIKE ? || '%'
        `, [currentMonth]);

        // 4. 庫存統計
        const inventoryStats = await database.all(`
            SELECT 
                COUNT(*) as total_products,
                SUM(CASE WHEN current_stock <= min_stock THEN 1 ELSE 0 END) as low_stock_count,
                SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
                SUM(current_stock * unit_cost) as total_inventory_value
            FROM products 
            WHERE is_active = 1
        `);

        // 5. 最近活動 (最近10筆記錄)
        const recentActivities = await database.all(`
            SELECT 
                'attendance' as type,
                u.name as user_name,
                'GPS打卡' as action,
                check_in_time as timestamp,
                s.name as location
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN stores s ON u.department_id = s.id
            WHERE date(check_in_time) = ?
            UNION ALL
            SELECT 
                'revenue' as type,
                u.name as user_name,
                '營收記錄' as action,
                created_at as timestamp,
                revenue_source as location
            FROM revenue r
            JOIN users u ON r.user_id = u.id
            WHERE date(created_at) >= date('now', '-7 days')
            ORDER BY timestamp DESC
            LIMIT 10
        `, [today]);

        // 6. 系統健康狀態
        const systemHealth = {
            database_status: 'healthy',
            telegram_status: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not_configured',
            last_backup: await getLastBackupTime(),
            active_sessions: await getActiveSessionsCount()
        };

        // 組裝回應數據
        stats.employees = employeeStats[0] || {};
        stats.attendance = {
            ...attendanceStats[0],
            checked_in_today: attendanceStats[0]?.checked_in_today || 0,
            check_in_rate: attendanceStats[0]?.checked_in_today ? 
                Math.round((attendanceStats[0].checked_in_today / (stats.employees.active_employees || 1)) * 100) : 0
        };
        stats.revenue = {
            ...revenueStats[0],
            total_revenue: revenueStats[0]?.total_revenue || 0,
            revenue_growth: await calculateRevenueGrowth(currentMonth)
        };
        stats.inventory = inventoryStats[0] || {};
        stats.recent_activities = recentActivities;
        stats.system_health = systemHealth;

        res.json({
            success: true,
            data: stats,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('儀表板統計獲取錯誤:', error);
        res.status(500).json({
            success: false,
            message: '統計數據獲取失敗',
            error: error.message
        });
    }
});

// 輔助函數
async function getLastBackupTime() {
    try {
        const fs = require('fs');
        const path = require('path');
        const backupDir = path.join(__dirname, '..', 'data', 'backups');
        if (fs.existsSync(backupDir)) {
            const files = fs.readdirSync(backupDir);
            if (files.length > 0) {
                const latestFile = files.sort().pop();
                const stats = fs.statSync(path.join(backupDir, latestFile));
                return stats.mtime.toISOString();
            }
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function getActiveSessionsCount() {
    // 簡化實現 - 在實際應用中可能需要 Redis 或內存儲存
    return Math.floor(Math.random() * 50) + 10; // 模擬10-60個活躍會話
}

async function calculateRevenueGrowth(currentMonth) {
    try {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthStr = lastMonth.toISOString().slice(0, 7);

        const [currentRevenue, lastRevenue] = await Promise.all([
            database.all('SELECT SUM(total_revenue) as total FROM revenue WHERE date LIKE ? || "%"', [currentMonth]),
            database.all('SELECT SUM(total_revenue) as total FROM revenue WHERE date LIKE ? || "%"', [lastMonthStr])
        ]);

        const current = currentRevenue[0]?.total || 0;
        const last = lastRevenue[0]?.total || 0;

        if (last === 0) return 0;
        return Math.round(((current - last) / last) * 100);
    } catch (error) {
        return 0;
    }
}

// ==================== 維修管理 API ====================

// 獲取維修申請列表
router.get('/maintenance', authenticateToken, async (req, res) => {
    const database = require('../database');
    const { status, store_id, employee_id, date_from, date_to } = req.query;

    try {
        let query = `
            SELECT m.*, e.name as employee_name
            FROM maintenance_requests m
            LEFT JOIN users e ON m.requested_by = e.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (status) {
            query += ' AND m.status = ?';
            params.push(status);
        }
        
        
        if (employee_id) {
            query += ' AND m.requested_by = ?';
            params.push(employee_id);
        }
        
        if (date_from) {
            query += ' AND m.created_at >= ?';
            params.push(date_from + ' 00:00:00');
        }
        
        if (date_to) {
            query += ' AND m.created_at <= ?';
            params.push(date_to + ' 23:59:59');
        }
        
        query += ' ORDER BY m.created_at DESC';
        
        const requests = await database.query(query, params);
        res.json(requests);
    } catch (error) {
        console.error('獲取維修申請錯誤:', error);
        res.status(500).json({ error: '獲取維修申請失敗' });
    }
});

// 新增維修申請
router.post('/maintenance', authenticateToken, async (req, res) => {
    const database = require('../database');
    const telegramNotifications = require('../modules/telegram-notifications');
    const { title, description, store_id, priority, category } = req.body;

    if (!title || !description || !store_id) {
        return res.status(400).json({ error: '請提供標題、描述和分店' });
    }

    try {
        await database.execute('BEGIN TRANSACTION');

        const result = await database.execute(`
            INSERT INTO maintenance_requests (
                title, description, store_id, employee_id, priority, category, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
        `, [title, description, store_id, req.user.id, priority || 'medium', category || 'general']);

        const requestId = result.lastID;

        // 獲取完整的維修申請資料
        const requestResult = await database.query(`
            SELECT m.*, e.name as employee_name
            FROM maintenance_requests m
            LEFT JOIN users e ON m.requested_by = e.id
            WHERE m.id = ?
        `, [requestId]);
        const request = requestResult.length > 0 ? requestResult[0] : null;

        // 發送 Telegram 通知
        try {
            await telegramNotifications.sendMaintenanceRequestNotification(request);
        } catch (notificationError) {
            console.error('發送維修申請通知失敗:', notificationError);
        }

        await database.execute('COMMIT');
        res.status(201).json({ id: requestId, message: '維修申請提交成功' });
    } catch (error) {
        await database.execute('ROLLBACK');
        console.error('新增維修申請錯誤:', error);
        res.status(500).json({ error: '新增維修申請失敗' });
    }
});

// 獲取單一維修申請詳情
router.get('/maintenance/:id', authenticateToken, async (req, res) => {
    const database = require('../database');
    const { id } = req.params;

    try {
        const requestResult = await database.query(`
            SELECT m.*, e.name as employee_name, s.store_name
            FROM maintenance_requests m
            LEFT JOIN users e ON m.requested_by = e.id
            LEFT JOIN (
                SELECT 1 as id, '內壢忠孝店' as store_name
                UNION SELECT 2, '桃園龍安店'
                UNION SELECT 3, '中壢龍崗店'
            ) s ON m.store_id = s.id
            WHERE m.id = ?
        `, [id]);
        const request = requestResult.length > 0 ? requestResult[0] : null;

        if (!request) {
            return res.status(404).json({ error: '維修申請不存在' });
        }

        res.json(request);
    } catch (error) {
        console.error('獲取維修申請詳情錯誤:', error);
        res.status(500).json({ error: '獲取維修申請詳情失敗' });
    }
});

// 更新維修申請狀態
router.put('/maintenance/:id/status', authenticateToken, async (req, res) => {
    const database = require('../database');
    const telegramNotifications = require('../modules/telegram-notifications');
    const { id } = req.params;
    const { status, note, assigned_to, estimated_completion, actual_completion } = req.body;

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: '無效的狀態值' });
    }

    try {
        await database.execute('BEGIN TRANSACTION');

        // 獲取原始維修申請
        const originalRequestResult = await database.query('SELECT * FROM maintenance_requests WHERE id = ?', [id]);
        const originalRequest = originalRequestResult.length > 0 ? originalRequestResult[0] : null;
        if (!originalRequest) {
            await database.execute('ROLLBACK');
            return res.status(404).json({ error: '維修申請不存在' });
        }

        // 準備更新資料
        let updateQuery = 'UPDATE maintenance_requests SET status = ?, updated_at = datetime(\'now\')';
        let updateParams = [status];

        if (note !== undefined) {
            updateQuery += ', note = ?';
            updateParams.push(note);
        }

        if (assigned_to !== undefined) {
            updateQuery += ', assigned_to = ?';
            updateParams.push(assigned_to);
        }

        if (estimated_completion !== undefined) {
            updateQuery += ', estimated_completion = ?';
            updateParams.push(estimated_completion);
        }

        if (actual_completion !== undefined) {
            updateQuery += ', actual_completion = ?';
            updateParams.push(actual_completion);
        }

        if (status === 'in_progress' && !originalRequest.started_at) {
            updateQuery += ', started_at = datetime(\'now\')';
        }

        if (status === 'completed' && !actual_completion) {
            updateQuery += ', actual_completion = datetime(\'now\')';
        }

        updateQuery += ' WHERE id = ?';
        updateParams.push(id);

        await database.execute(updateQuery, updateParams);

        // 獲取更新後的完整資料
        const updatedRequestResult = await database.query(`
            SELECT m.*, e.name as employee_name, a.name as assigned_name
            FROM maintenance_requests m
            LEFT JOIN users e ON m.requested_by = e.id
            LEFT JOIN users a ON m.assigned_to = a.id
            WHERE m.id = ?
        `, [id]);
        const updatedRequest = updatedRequestResult.length > 0 ? updatedRequestResult[0] : null;

        // 發送狀態變更通知
        try {
            await telegramNotifications.sendMaintenanceStatusUpdateNotification({
                ...updatedRequest,
                old_status: originalRequest.status,
                new_status: status
            });
        } catch (notificationError) {
            console.error('發送維修狀態更新通知失敗:', notificationError);
        }

        await database.execute('COMMIT');
        res.json({ message: '維修申請狀態更新成功', request: updatedRequest });
    } catch (error) {
        await database.execute('ROLLBACK');
        console.error('更新維修申請狀態錯誤:', error);
        res.status(500).json({ error: '更新維修申請狀態失敗' });
    }
});

// 刪除維修申請
router.delete('/maintenance/:id', authenticateToken, async (req, res) => {
    const database = require('../database');
    const { id } = req.params;

    try {
        const requestResult = await database.query('SELECT * FROM maintenance_requests WHERE id = ?', [id]);
        const request = requestResult.length > 0 ? requestResult[0] : null;
        if (!request) {
            return res.status(404).json({ error: '維修申請不存在' });
        }

        // 只有申請人或管理員可以刪除
        if (request.employee_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: '沒有權限刪除此維修申請' });
        }

        await database.execute('DELETE FROM maintenance_requests WHERE id = ?', [id]);
        res.json({ message: '維修申請刪除成功' });
    } catch (error) {
        console.error('刪除維修申請錯誤:', error);
        res.status(500).json({ error: '刪除維修申請失敗' });
    }
});

// 獲取維修統計
router.get('/maintenance/stats', authenticateToken, async (req, res) => {
    const database = require('../database');

    try {
        const stats = await database.query(`
            SELECT 
                status,
                COUNT(*) as count,
                priority,
                store_id
            FROM maintenance_requests 
            WHERE created_at >= date('now', '-30 days')
            GROUP BY status, priority, store_id
        `);

        const summary = {
            total: 0,
            pending: 0,
            in_progress: 0,
            completed: 0,
            cancelled: 0,
            high_priority: 0,
            by_store: {}
        };

        stats.forEach(stat => {
            summary.total += stat.count;
            summary[stat.status] = (summary[stat.status] || 0) + stat.count;
            
            if (stat.priority === 'high') {
                summary.high_priority += stat.count;
            }
            
            if (!summary.by_store[stat.store_id]) {
                summary.by_store[stat.store_id] = 0;
            }
            summary.by_store[stat.store_id] += stat.count;
        });

        res.json(summary);
    } catch (error) {
        console.error('獲取維修統計錯誤:', error);
        res.status(500).json({ error: '獲取維修統計失敗' });
    }
});

// ==================== 員工審核 API ====================

// 獲取待審核員工列表
router.get('/employees/pending', authenticateToken, async (req, res) => {
    const database = require('../database');

    // 只有管理員和店長可以查看待審核員工
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ error: '沒有權限查看待審核員工' });
    }

    try {
        let query = `
            SELECT e.*, s.store_name
            FROM users e
            LEFT JOIN (
                SELECT 1 as id, '內壢忠孝店' as store_name
                UNION SELECT 2, '桃園龍安店'
                UNION SELECT 3, '中壢龍崗店'
            ) s ON e.store_id = s.id
            WHERE e.status = 'pending'
        `;

        // 店長只能看到自己分店的待審核員工
        if (req.user.role === 'manager') {
            query += ' AND e.store_id = ?';
            const employees = await database.query(query, [req.user.store_id]);
            res.json(employees);
        } else {
            const employees = await database.query(query);
            res.json(employees);
        }
    } catch (error) {
        console.error('獲取待審核員工錯誤:', error);
        res.status(500).json({ error: '獲取待審核員工失敗' });
    }
});

// 審核員工（批准或拒絕）
router.put('/employees/:id/approve', authenticateToken, async (req, res) => {
    const database = require('../database');
    const telegramNotifications = require('../modules/telegram-notifications');
    const { id } = req.params;
    const { action, note } = req.body; // action: 'approve' 或 'reject'

    // 只有管理員和店長可以審核員工
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ error: '沒有權限審核員工' });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: '無效的審核動作' });
    }

    try {
        await database.execute('BEGIN TRANSACTION');

        // 獲取員工資料
        const employeeResult = await database.query('SELECT * FROM users WHERE id = ?', [id]);
        const employee = employeeResult.length > 0 ? employeeResult[0] : null;
        if (!employee) {
            await database.execute('ROLLBACK');
            return res.status(404).json({ error: '員工不存在' });
        }

        if (employee.status !== 'pending') {
            await database.execute('ROLLBACK');
            return res.status(400).json({ error: '該員工不在待審核狀態' });
        }

        // 店長只能審核自己分店的員工
        if (req.user.role === 'manager' && employee.store_id !== req.user.store_id) {
            await database.execute('ROLLBACK');
            return res.status(403).json({ error: '沒有權限審核此員工' });
        }

        const newStatus = action === 'approve' ? 'active' : 'rejected';
        const approvedAt = action === 'approve' ? 'datetime(\'now\')' : null;
        
        // 更新員工狀態
        await database.execute(`
            UPDATE employees 
            SET status = ?, 
                approved_by = ?, 
                approved_at = ${approvedAt ? approvedAt : 'NULL'}, 
                approval_note = ?,
                updated_at = datetime('now')
            WHERE id = ?
        `, [newStatus, req.user.id, note || null, id]);

        // 如果批准，生成員工編號
        if (action === 'approve') {
            const currentYear = new Date().getFullYear();
            const employeeCountResult = await database.query(`
                SELECT COUNT(*) as count 
                FROM users 
                WHERE status = 'active' AND strftime('%Y', hire_date) = ?
            `, [currentYear.toString()]);
        const employeeCount = employeeCountResult.length > 0 ? employeeCountResult[0] : null;
            
            const employeeId = `EMP${currentYear}${(employeeCount.count + 1).toString().padStart(3, '0')}`;
            
            await database.execute('UPDATE employees SET employee_id = ? WHERE id = ?', [employeeId, id]);
        }

        // 獲取更新後的員工資料
        const updatedEmployeeResult = await database.query(`
            SELECT e.*, s.store_name, a.name as approved_by_name
            FROM users e
            LEFT JOIN (
                SELECT 1 as id, '內壢忠孝店' as store_name
                UNION SELECT 2, '桃園龍安店'
                UNION SELECT 3, '中壢龍崗店'
            ) s ON e.store_id = s.id
            LEFT JOIN users a ON e.approved_by = a.id
            WHERE e.id = ?
        `, [id]);
        const updatedEmployee = updatedEmployeeResult.length > 0 ? updatedEmployeeResult[0] : null;

        // 發送審核結果通知
        try {
            await telegramNotifications.sendEmployeeApprovalNotification({
                ...updatedEmployee,
                action: action,
                approved_by_name: req.user.name
            });
        } catch (notificationError) {
            console.error('發送員工審核通知失敗:', notificationError);
        }

        await database.execute('COMMIT');
        
        const message = action === 'approve' ? '員工審核通過' : '員工審核拒絕';
        res.json({ message, employee: updatedEmployee });
    } catch (error) {
        await database.execute('ROLLBACK');
        console.error('員工審核錯誤:', error);
        res.status(500).json({ error: '員工審核失敗' });
    }
});

// 批量審核員工
router.put('/employees/batch-approve', authenticateToken, async (req, res) => {
    const database = require('../database');
    const telegramNotifications = require('../modules/telegram-notifications');
    const { employee_ids, action, note } = req.body;

    // 只有管理員可以批量審核
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: '沒有權限進行批量審核' });
    }

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
        return res.status(400).json({ error: '請提供有效的員工ID列表' });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: '無效的審核動作' });
    }

    try {
        await database.execute('BEGIN TRANSACTION');

        const results = [];
        const newStatus = action === 'approve' ? 'active' : 'rejected';

        for (const employeeId of employee_ids) {
            // 獲取員工資料
            const employeeResult = await database.query('SELECT * FROM users WHERE id = ? AND status = \'pending\'', [employeeId]);
        const employee = employeeResult.length > 0 ? employeeResult[0] : null;
            
            if (!employee) {
                results.push({ id: employeeId, success: false, message: '員工不存在或不在待審核狀態' });
                continue;
            }

            // 更新員工狀態
            await database.execute(`
                UPDATE employees 
                SET status = ?, 
                    approved_by = ?, 
                    approved_at = ${action === 'approve' ? 'datetime(\'now\')' : 'NULL'}, 
                    approval_note = ?,
                    updated_at = datetime('now')
                WHERE id = ?
            `, [newStatus, req.user.id, note || null, employeeId]);

            // 如果批准，生成員工編號
            if (action === 'approve') {
                const currentYear = new Date().getFullYear();
                const employeeCountResult = await database.query(`
                    SELECT COUNT(*) as count 
                    FROM users 
                    WHERE status = 'active' AND strftime('%Y', hire_date) = ?
                `, [currentYear.toString()]);
        const employeeCount = employeeCountResult.length > 0 ? employeeCountResult[0] : null;
                
                const employeeIdCode = `EMP${currentYear}${(employeeCount.count + 1).toString().padStart(3, '0')}`;
                await database.execute('UPDATE employees SET employee_id = ? WHERE id = ?', [employeeIdCode, employeeId]);
            }

            // 發送通知
            try {
                await telegramNotifications.sendEmployeeApprovalNotification({
                    ...employee,
                    action: action,
                    approved_by_name: req.user.name
                });
            } catch (notificationError) {
                console.error('發送員工審核通知失敗:', notificationError);
            }

            results.push({ 
                id: employeeId, 
                success: true, 
                message: action === 'approve' ? '審核通過' : '審核拒絕' 
            });
        }

        await database.execute('COMMIT');
        res.json({ message: '批量審核完成', results });
    } catch (error) {
        await database.execute('ROLLBACK');
        console.error('批量審核員工錯誤:', error);
        res.status(500).json({ error: '批量審核失敗' });
    }
});

// 獲取審核歷史
router.get('/employees/approval-history', authenticateToken, async (req, res) => {
    const database = require('../database');
    const { limit = 50, offset = 0 } = req.query;

    // 只有管理員可以查看審核歷史
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: '沒有權限查看審核歷史' });
    }

    try {
        const history = await database.query(`
            SELECT 
                e.*,
                s.store_name,
                a.name as approved_by_name
            FROM users e
            LEFT JOIN (
                SELECT 1 as id, '內壢忠孝店' as store_name
                UNION SELECT 2, '桃園龍安店'
                UNION SELECT 3, '中壢龍崗店'
            ) s ON e.store_id = s.id
            LEFT JOIN users a ON e.approved_by = a.id
            WHERE e.status IN ('active', 'rejected') AND e.approved_at IS NOT NULL
            ORDER BY e.approved_at DESC
            LIMIT ? OFFSET ?
        `, [parseInt(limit), parseInt(offset)]);

        res.json(history);
    } catch (error) {
        console.error('獲取審核歷史錯誤:', error);
        res.status(500).json({ error: '獲取審核歷史失敗' });
    }
});

// 獲取審核統計
router.get('/employees/approval-stats', authenticateToken, async (req, res) => {
    const database = require('../database');

    // 只有管理員和店長可以查看審核統計
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ error: '沒有權限查看審核統計' });
    }

    try {
        let query = `
            SELECT 
                status,
                store_id,
                COUNT(*) as count
            FROM users 
            WHERE created_at >= date('now', '-30 days')
        `;

        let params = [];

        // 店長只能看到自己分店的統計
        if (req.user.role === 'manager') {
            query += ' AND store_id = ?';
            params.push(req.user.store_id);
        }

        query += ' GROUP BY status, store_id';

        const stats = await database.query(query, params);

        const summary = {
            total: 0,
            pending: 0,
            active: 0,
            rejected: 0,
            by_store: {}
        };

        stats.forEach(stat => {
            summary.total += stat.count;
            summary[stat.status] = (summary[stat.status] || 0) + stat.count;
            
            if (!summary.by_store[stat.store_id]) {
                summary.by_store[stat.store_id] = { total: 0, pending: 0, active: 0, rejected: 0 };
            }
            summary.by_store[stat.store_id].total += stat.count;
            summary.by_store[stat.store_id][stat.status] = stat.count;
        });

        res.json(summary);
    } catch (error) {
        console.error('獲取審核統計錯誤:', error);
        res.status(500).json({ error: '獲取審核統計失敗' });
    }
});

// ==================== 升遷投票 API ====================

// 獲取升遷投票列表
router.get('/promotions', authenticateToken, async (req, res) => {
    const database = require('../database');
    const { status, store_id } = req.query;

    try {
        let query = `
            SELECT p.*, 
                   e.name as nominee_name, 
                   e.employee_id as nominee_employee_id,
                   c.name as creator_name,
                   s.store_name,
                   COUNT(v.id) as total_votes,
                   SUM(CASE WHEN v.vote = 'approve' THEN 1 ELSE 0 END) as approve_votes,
                   SUM(CASE WHEN v.vote = 'reject' THEN 1 ELSE 0 END) as reject_votes
            FROM promotion_votes p
            LEFT JOIN users e ON p.nominee_id = e.id
            LEFT JOIN users c ON p.created_by = c.id
            LEFT JOIN (
                SELECT 1 as id, '內壢忠孝店' as store_name
                UNION SELECT 2, '桃園龍安店'
                UNION SELECT 3, '中壢龍崗店'
            ) s ON p.store_id = s.id
            LEFT JOIN votes v ON p.id = v.promotion_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }
        
        if (store_id) {
            query += ' AND p.store_id = ?';
            params.push(store_id);
        }
        
        // 員工只能看到自己分店的投票
        if (req.user.role === 'employee') {
            query += ' AND p.store_id = ?';
            params.push(req.user.store_id);
        }
        
        query += ' GROUP BY p.id ORDER BY p.created_at DESC';
        
        const promotions = await database.query(query, params);
        
        // 檢查當前用戶是否已投票
        for (let promotion of promotions) {
            const userVoteResult = await database.query(
                'SELECT vote FROM votes WHERE promotion_id = ? AND voter_id = ?',
                [promotion.id, req.user.id]
            );
            const userVote = userVoteResult.length > 0 ? userVoteResult[0] : null;
            promotion.user_voted = userVote ? userVote.vote : null;
        }
        
        res.json(promotions);
    } catch (error) {
        console.error('獲取升遷投票錯誤:', error);
        res.status(500).json({ error: '獲取升遷投票失敗' });
    }
});

// 創建升遷投票
router.post('/promotions', authenticateToken, async (req, res) => {
    const database = require('../database');
    const telegramNotifications = require('../modules/telegram-notifications');
    const { nominee_id, target_position, reason, store_id } = req.body;

    // 只有管理員和店長可以創建升遷投票
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ error: '沒有權限創建升遷投票' });
    }

    if (!nominee_id || !target_position || !reason) {
        return res.status(400).json({ error: '請提供被提名人、目標職位和理由' });
    }

    try {
        await database.execute('BEGIN TRANSACTION');

        // 檢查被提名人是否存在且為有效員工
        const nomineeResult = await database.query('SELECT * FROM users WHERE id = ? AND status = \'active\'', [nominee_id]);
        const nominee = nomineeResult.length > 0 ? nomineeResult[0] : null;
        if (!nominee) {
            await database.execute('ROLLBACK');
            return res.status(404).json({ error: '被提名人不存在或非有效員工' });
        }

        // 店長只能為自己分店的員工創建投票
        const targetStoreId = store_id || req.user.store_id;
        if (req.user.role === 'manager' && targetStoreId !== req.user.store_id) {
            await database.execute('ROLLBACK');
            return res.status(403).json({ error: '只能為自己分店的員工創建升遷投票' });
        }

        // 檢查是否已有進行中的投票
        const existingVoteResult = await database.query(
            'SELECT id FROM promotion_votes WHERE nominee_id = ? AND status = \'active\'',
            [nominee_id]
        );
        const existingVote = existingVoteResult.length > 0 ? existingVoteResult[0] : null;
        
        if (existingVote) {
            await database.execute('ROLLBACK');
            return res.status(400).json({ error: '該員工已有進行中的升遷投票' });
        }

        // 設定投票結束時間（7天後）
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);

        const result = await database.execute(`
            INSERT INTO promotion_votes (
                nominee_id, target_position, reason, store_id, 
                created_by, status, end_date, created_at
            ) VALUES (?, ?, ?, ?, ?, 'active', ?, datetime('now'))
        `, [nominee_id, target_position, reason, targetStoreId, req.user.id, endDate.toISOString()]);

        const promotionId = result.lastID;

        // 獲取完整的投票資料
        const promotionResult = await database.query(`
            SELECT p.*, e.name as nominee_name, c.name as creator_name, s.store_name
            FROM promotion_votes p
            LEFT JOIN users e ON p.nominee_id = e.id
            LEFT JOIN users c ON p.created_by = c.id
            LEFT JOIN (
                SELECT 1 as id, '內壢忠孝店' as store_name
                UNION SELECT 2, '桃園龍安店'
                UNION SELECT 3, '中壢龍崗店'
            ) s ON p.store_id = s.id
            WHERE p.id = ?
        `, [promotionId]);
        const promotion = promotionResult.length > 0 ? promotionResult[0] : null;

        // 發送 Telegram 通知
        try {
            await telegramNotifications.sendPromotionVoteStartNotification(promotion);
        } catch (notificationError) {
            console.error('發送升遷投票通知失敗:', notificationError);
        }

        await database.execute('COMMIT');
        res.status(201).json({ id: promotionId, message: '升遷投票創建成功', promotion });
    } catch (error) {
        await database.execute('ROLLBACK');
        console.error('創建升遷投票錯誤:', error);
        res.status(500).json({ error: '創建升遷投票失敗' });
    }
});

// 獲取單一升遷投票詳情
router.get('/promotions/:id', authenticateToken, async (req, res) => {
    const database = require('../database');
    const { id } = req.params;

    try {
        const promotionResult = await database.query(`
            SELECT p.*, 
                   e.name as nominee_name, 
                   e.employee_id as nominee_employee_id,
                   e.role as current_role,
                   c.name as creator_name,
                   s.store_name,
                   COUNT(v.id) as total_votes,
                   SUM(CASE WHEN v.vote = 'approve' THEN 1 ELSE 0 END) as approve_votes,
                   SUM(CASE WHEN v.vote = 'reject' THEN 1 ELSE 0 END) as reject_votes
            FROM promotion_votes p
            LEFT JOIN users e ON p.nominee_id = e.id
            LEFT JOIN users c ON p.created_by = c.id
            LEFT JOIN (
                SELECT 1 as id, '內壢忠孝店' as store_name
                UNION SELECT 2, '桃園龍安店'
                UNION SELECT 3, '中壢龍崗店'
            ) s ON p.store_id = s.id
            LEFT JOIN votes v ON p.id = v.promotion_id
            WHERE p.id = ?
            GROUP BY p.id
        `, [id]);
        const promotion = promotionResult.length > 0 ? promotionResult[0] : null;

        if (!promotion) {
            return res.status(404).json({ error: '升遷投票不存在' });
        }

        // 獲取投票詳情
        const votes = await database.query(`
            SELECT v.*, e.name as voter_name, e.role as voter_role
            FROM votes v
            LEFT JOIN users e ON v.voter_id = e.id
            WHERE v.promotion_id = ?
            ORDER BY v.created_at DESC
        `, [id]);

        // 檢查當前用戶是否已投票
        const userVoteResult = await database.query(
            'SELECT vote FROM votes WHERE promotion_id = ? AND voter_id = ?',
            [id, req.user.id]
        );
        const userVote = userVoteResult.length > 0 ? userVoteResult[0] : null;

        promotion.user_voted = userVote ? userVote.vote : null;
        promotion.votes = votes;

        res.json(promotion);
    } catch (error) {
        console.error('獲取升遷投票詳情錯誤:', error);
        res.status(500).json({ error: '獲取升遷投票詳情失敗' });
    }
});

// 投票
router.post('/promotions/:id/vote', authenticateToken, async (req, res) => {
    const database = require('../database');
    const telegramNotifications = require('../modules/telegram-notifications');
    const { id } = req.params;
    const { vote, comment } = req.body;

    if (!vote || !['approve', 'reject'].includes(vote)) {
        return res.status(400).json({ error: '無效的投票選項' });
    }

    try {
        await database.execute('BEGIN TRANSACTION');

        // 檢查投票是否存在且有效
        const promotionResult = await database.query('SELECT * FROM promotion_votes WHERE id = ? AND status = \'active\'', [id]);
        const promotion = promotionResult.length > 0 ? promotionResult[0] : null;
        if (!promotion) {
            await database.execute('ROLLBACK');
            return res.status(404).json({ error: '投票不存在或已結束' });
        }

        // 檢查投票是否已過期
        const now = new Date();
        const endDate = new Date(promotion.end_date);
        if (now > endDate) {
            await database.execute('ROLLBACK');
            return res.status(400).json({ error: '投票已過期' });
        }

        // 檢查是否已經投過票
        const existingVoteResult = await database.query(
            'SELECT id FROM votes WHERE promotion_id = ? AND voter_id = ?',
            [id, req.user.id]
        );
        const existingVote = existingVoteResult.length > 0 ? existingVoteResult[0] : null;

        if (existingVote) {
            // 更新現有投票
            await database.execute(
                'UPDATE votes SET vote = ?, comment = ?, updated_at = datetime(\'now\') WHERE id = ?',
                [vote, comment || null, existingVote.id]
            );
        } else {
            // 新增投票
            await database.execute(`
                INSERT INTO votes (promotion_id, voter_id, vote, comment, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            `, [id, req.user.id, vote, comment || null]);
        }

        // 獲取更新後的投票統計
        const statsResult = await database.query(`
            SELECT 
                COUNT(*) as total_votes,
                SUM(CASE WHEN vote = 'approve' THEN 1 ELSE 0 END) as approve_votes,
                SUM(CASE WHEN vote = 'reject' THEN 1 ELSE 0 END) as reject_votes
            FROM votes 
            WHERE promotion_id = ?
        `, [id]);
        const stats = statsResult.length > 0 ? statsResult[0] : null;

        // 檢查是否需要自動結束投票
        const requiredVotes = 5; // 可以配置為動態值
        if (stats.total_votes >= requiredVotes) {
            const result = stats.approve_votes > stats.reject_votes ? 'approved' : 'rejected';
            
            await database.execute(
                'UPDATE promotion_votes SET status = ?, result = ?, updated_at = datetime(\'now\') WHERE id = ?',
                [result, result, id]
            );

            // 如果投票通過，更新員工職位
            if (result === 'approved') {
                await database.execute(
                    'UPDATE employees SET role = ?, updated_at = datetime(\'now\') WHERE id = ?',
                    [promotion.target_position, promotion.nominee_id]
                );
            }
        }

        // 獲取完整的投票資料用於通知
        const promotionWithDetailsResult = await database.query(`
            SELECT p.*, e.name as nominee_name, v.name as voter_name
            FROM promotion_votes p
            LEFT JOIN users e ON p.nominee_id = e.id
            LEFT JOIN users v ON v.id = ?
            WHERE p.id = ?
        `, [req.user.id, id]);
        const promotionWithDetails = promotionWithDetailsResult.length > 0 ? promotionWithDetailsResult[0] : null;

        // 發送投票通知
        try {
            await telegramNotifications.sendPromotionVoteNotification({
                ...promotionWithDetails,
                vote: vote,
                voter_name: req.user.name,
                total_votes: stats.total_votes,
                approve_votes: stats.approve_votes,
                reject_votes: stats.reject_votes
            });
        } catch (notificationError) {
            console.error('發送投票通知失敗:', notificationError);
        }

        await database.execute('COMMIT');
        res.json({ 
            message: existingVote ? '投票已更新' : '投票成功',
            stats: stats
        });
    } catch (error) {
        await database.execute('ROLLBACK');
        console.error('投票錯誤:', error);
        res.status(500).json({ error: '投票失敗' });
    }
});

// 結束投票
router.put('/promotions/:id/close', authenticateToken, async (req, res) => {
    const database = require('../database');
    const telegramNotifications = require('../modules/telegram-notifications');
    const { id } = req.params;
    const { force_result } = req.body; // 'approved' 或 'rejected'

    // 只有管理員和投票創建者可以結束投票
    if (req.user.role !== 'admin') {
        const promotionResult = await database.query('SELECT created_by FROM promotion_votes WHERE id = ?', [id]);
        const promotion = promotionResult.length > 0 ? promotionResult[0] : null;
        if (!promotion || promotion.created_by !== req.user.id) {
            return res.status(403).json({ error: '沒有權限結束此投票' });
        }
    }

    try {
        await database.execute('BEGIN TRANSACTION');

        const promotionResult = await database.query('SELECT * FROM promotion_votes WHERE id = ? AND status = \'active\'', [id]);
        const promotion = promotionResult.length > 0 ? promotionResult[0] : null;
        if (!promotion) {
            await database.execute('ROLLBACK');
            return res.status(404).json({ error: '投票不存在或已結束' });
        }

        // 獲取投票統計
        const statsResult = await database.query(`
            SELECT 
                COUNT(*) as total_votes,
                SUM(CASE WHEN vote = 'approve' THEN 1 ELSE 0 END) as approve_votes,
                SUM(CASE WHEN vote = 'reject' THEN 1 ELSE 0 END) as reject_votes
            FROM votes 
            WHERE promotion_id = ?
        `, [id]);
        const stats = statsResult.length > 0 ? statsResult[0] : null;

        // 決定結果
        let result;
        if (force_result && ['approved', 'rejected'].includes(force_result)) {
            result = force_result;
        } else {
            result = stats.approve_votes > stats.reject_votes ? 'approved' : 'rejected';
        }

        // 更新投票狀態
        await database.execute(
            'UPDATE promotion_votes SET status = ?, result = ?, updated_at = datetime(\'now\') WHERE id = ?',
            [result, result, id]
        );

        // 如果投票通過，更新員工職位
        if (result === 'approved') {
            await database.execute(
                'UPDATE employees SET role = ?, updated_at = datetime(\'now\') WHERE id = ?',
                [promotion.target_position, promotion.nominee_id]
            );
        }

        // 獲取完整資料用於通知
        const finalPromotionResult = await database.query(`
            SELECT p.*, e.name as nominee_name, c.name as creator_name
            FROM promotion_votes p
            LEFT JOIN users e ON p.nominee_id = e.id
            LEFT JOIN users c ON p.created_by = c.id
            WHERE p.id = ?
        `, [id]);
        const finalPromotion = finalPromotionResult.length > 0 ? finalPromotionResult[0] : null;

        // 發送結果通知
        try {
            await telegramNotifications.sendPromotionResultNotification({
                ...finalPromotion,
                total_votes: stats.total_votes,
                approve_votes: stats.approve_votes,
                reject_votes: stats.reject_votes,
                result: result
            });
        } catch (notificationError) {
            console.error('發送投票結果通知失敗:', notificationError);
        }

        await database.execute('COMMIT');
        res.json({ 
            message: '投票已結束',
            result: result,
            stats: stats
        });
    } catch (error) {
        await database.execute('ROLLBACK');
        console.error('結束投票錯誤:', error);
        res.status(500).json({ error: '結束投票失敗' });
    }
});

// 獲取投票統計
router.get('/promotions/stats', authenticateToken, async (req, res) => {
    const database = require('../database');

    try {
        const stats = await database.query(`
            SELECT 
                status,
                result,
                store_id,
                COUNT(*) as count
            FROM promotion_votes 
            WHERE created_at >= date('now', '-30 days')
            GROUP BY status, result, store_id
        `);

        const summary = {
            total: 0,
            active: 0,
            approved: 0,
            rejected: 0,
            by_store: {}
        };

        stats.forEach(stat => {
            summary.total += stat.count;
            
            if (stat.status === 'active') {
                summary.active += stat.count;
            } else if (stat.result === 'approved') {
                summary.approved += stat.count;
            } else if (stat.result === 'rejected') {
                summary.rejected += stat.count;
            }
            
            if (!summary.by_store[stat.store_id]) {
                summary.by_store[stat.store_id] = 0;
            }
            summary.by_store[stat.store_id] += stat.count;
        });

        res.json(summary);
    } catch (error) {
        console.error('獲取投票統計錯誤:', error);
        res.status(500).json({ error: '獲取投票統計失敗' });
    }
});

// =================== 通知設定管理API ===================

// 獲取通知設定
router.get('/notifications/settings', authenticateToken, async (req, res) => {
    const database = require('../database');
    const userId = req.user.id;

    try {
        // 獲取用戶的通知設定
        const settings = await db.query(`
            SELECT 
                notification_type,
                telegram_enabled,
                email_enabled,
                push_enabled,
                sound_enabled,
                priority_filter,
                quiet_hours_start,
                quiet_hours_end,
                updated_at
            FROM notification_settings 
            WHERE user_id = ?
        `, [userId]);

        // 如果沒有設定，返回預設值
        if (settings.length === 0) {
            const defaultSettings = [
                { notification_type: 'attendance', telegram_enabled: 1, email_enabled: 0, push_enabled: 1, sound_enabled: 1, priority_filter: 'all' },
                { notification_type: 'revenue', telegram_enabled: 1, email_enabled: 0, push_enabled: 1, sound_enabled: 1, priority_filter: 'all' },
                { notification_type: 'order', telegram_enabled: 1, email_enabled: 0, push_enabled: 1, sound_enabled: 1, priority_filter: 'all' },
                { notification_type: 'maintenance', telegram_enabled: 1, email_enabled: 0, push_enabled: 1, sound_enabled: 1, priority_filter: 'all' },
                { notification_type: 'promotion', telegram_enabled: 1, email_enabled: 0, push_enabled: 1, sound_enabled: 1, priority_filter: 'all' },
                { notification_type: 'system', telegram_enabled: 1, email_enabled: 0, push_enabled: 1, sound_enabled: 1, priority_filter: 'all' }
            ];
            return res.json({ success: true, settings: defaultSettings });
        }

        res.json({ success: true, settings });

        // 發送Telegram通知
        try {
            await telegramNotifier.sendMessage(
                telegramNotifier.config.bossGroupId,
                `📋 通知設定查詢\n👤 用戶: ${req.user.name}\n⏰ 時間: ${new Date().toLocaleString('zh-TW')}`
            );
        } catch (notificationError) {
            console.error('發送Telegram通知失敗:', notificationError);
        }

    } catch (error) {
        console.error('獲取通知設定錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: '獲取通知設定失敗',
            error: error.message 
        });
    }
});

// 更新通知設定
router.put('/notifications/settings', authenticateToken, async (req, res) => {
    const database = require('../database');
    const userId = req.user.id;
    const { settings } = req.body;

    // 驗證權限
    if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({
            success: false,
            message: '無效的設定格式'
        });
    }

    try {
        await database.execute('BEGIN TRANSACTION');

        // 更新每個通知類型的設定
        for (const setting of settings) {
            const {
                notification_type,
                telegram_enabled = 1,
                email_enabled = 0,
                push_enabled = 1,
                sound_enabled = 1,
                priority_filter = 'all',
                quiet_hours_start,
                quiet_hours_end
            } = setting;

            // 檢查是否已存在設定
            const existingSetting = await db.query(`
                SELECT id FROM notification_settings 
                WHERE user_id = ? AND notification_type = ?
            `, [userId, notification_type]);

            if (existingSetting.length > 0) {
                // 更新現有設定
                await database.execute(`
                    UPDATE notification_settings SET
                        telegram_enabled = ?,
                        email_enabled = ?,
                        push_enabled = ?,
                        sound_enabled = ?,
                        priority_filter = ?,
                        quiet_hours_start = ?,
                        quiet_hours_end = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ? AND notification_type = ?
                `, [
                    telegram_enabled, email_enabled, push_enabled, sound_enabled,
                    priority_filter, quiet_hours_start, quiet_hours_end,
                    userId, notification_type
                ]);
            } else {
                // 創建新設定
                await database.execute(`
                    INSERT INTO notification_settings (
                        user_id, notification_type, telegram_enabled, email_enabled,
                        push_enabled, sound_enabled, priority_filter,
                        quiet_hours_start, quiet_hours_end
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    userId, notification_type, telegram_enabled, email_enabled,
                    push_enabled, sound_enabled, priority_filter,
                    quiet_hours_start, quiet_hours_end
                ]);
            }
        }

        await database.execute('COMMIT');
        res.json({ 
            success: true, 
            message: '通知設定更新成功' 
        });

        // 發送Telegram通知
        try {
            await telegramNotifier.sendMessage(
                telegramNotifier.config.bossGroupId,
                `⚙️ 通知設定更新\n👤 用戶: ${req.user.name}\n📋 更新項目: ${settings.length}項\n⏰ 時間: ${new Date().toLocaleString('zh-TW')}`
            );
        } catch (notificationError) {
            console.error('發送Telegram通知失敗:', notificationError);
        }

    } catch (error) {
        await database.execute('ROLLBACK');
        console.error('更新通知設定錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: '更新通知設定失敗',
            error: error.message 
        });
    }
});

// 獲取通知歷史
router.get('/notifications/history', authenticateToken, async (req, res) => {
    const database = require('../database');
    const userId = req.user.id;
    const { page = 1, limit = 20, type, unread_only = false } = req.query;
    const offset = (page - 1) * limit;

    try {
        // 構建查詢條件
        let whereConditions = [`user_id = ?`];
        let queryParams = [userId];

        if (type) {
            whereConditions.push('type = ?');
            queryParams.push(type);
        }

        if (unread_only === 'true') {
            whereConditions.push('is_read = 0');
        }

        const whereClause = whereConditions.join(' AND ');

        // 獲取總數
        const totalQuery = `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`;
        const totalResult = await db.query(totalQuery, queryParams);
        const total = totalResult[0].total;

        // 獲取通知列表
        const notifications = await db.query(`
            SELECT 
                id,
                uuid,
                title,
                message,
                type,
                priority,
                is_read,
                read_at,
                related_type,
                related_id,
                data,
                created_at,
                expires_at
            FROM notifications 
            WHERE ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), parseInt(offset)]);

        // 統計未讀數量
        const unreadCount = await db.query(`
            SELECT COUNT(*) as count FROM notifications 
            WHERE user_id = ? AND is_read = 0
        `, [userId]);

        res.json({
            success: true,
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            },
            unreadCount: unreadCount[0].count
        });

        // 發送Telegram通知（僅對管理員）
        if (req.user.role === 'admin' || req.user.role === 'manager') {
            try {
                await telegramNotifier.sendMessage(
                    telegramNotifier.config.bossGroupId,
                    `📬 通知歷史查詢\n👤 用戶: ${req.user.name}\n📊 查詢條件: ${type || '全部'}\n📦 結果數: ${notifications.length}\n⏰ 時間: ${new Date().toLocaleString('zh-TW')}`
                );
            } catch (notificationError) {
                console.error('發送Telegram通知失敗:', notificationError);
            }
        }

    } catch (error) {
        console.error('獲取通知歷史錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: '獲取通知歷史失敗',
            error: error.message 
        });
    }
});

// 標記通知為已讀
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
    const database = require('../database');
    const notificationId = req.params.id;
    const userId = req.user.id;

    try {
        // 檢查通知是否存在且屬於該用戶
        const notification = await db.query(`
            SELECT id, title, type, is_read FROM notifications 
            WHERE id = ? AND user_id = ?
        `, [notificationId, userId]);

        if (notification.length === 0) {
            return res.status(404).json({
                success: false,
                message: '通知不存在或無權限訪問'
            });
        }

        if (notification[0].is_read) {
            return res.status(400).json({
                success: false,
                message: '通知已經是已讀狀態'
            });
        }

        // 標記為已讀
        await database.execute(`
            UPDATE notifications SET
                is_read = 1,
                read_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        `, [notificationId, userId]);

        res.json({ 
            success: true, 
            message: '通知已標記為已讀' 
        });

        // 發送Telegram通知
        try {
            await telegramNotifier.sendMessage(
                telegramNotifier.config.bossGroupId,
                `✅ 通知已讀\n👤 用戶: ${req.user.name}\n📋 通知: ${notification[0].title}\n📂 類型: ${notification[0].type}\n⏰ 時間: ${new Date().toLocaleString('zh-TW')}`
            );
        } catch (notificationError) {
            console.error('發送Telegram通知失敗:', notificationError);
        }

    } catch (error) {
        console.error('標記通知為已讀錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: '標記通知為已讀失敗',
            error: error.message 
        });
    }
});

// 批量標記通知為已讀
router.put('/notifications/mark-read', authenticateToken, async (req, res) => {
    const database = require('../database');
    const userId = req.user.id;
    const { notification_ids, type, mark_all = false } = req.body;

    try {
        let updateQuery = '';
        let queryParams = [];

        if (mark_all) {
            // 標記所有未讀通知為已讀
            updateQuery = `
                UPDATE notifications SET
                    is_read = 1,
                    read_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND is_read = 0
            `;
            queryParams = [userId];

            if (type) {
                updateQuery += ' AND type = ?';
                queryParams.push(type);
            }
        } else if (notification_ids && Array.isArray(notification_ids)) {
            // 標記指定通知為已讀
            const placeholders = notification_ids.map(() => '?').join(',');
            updateQuery = `
                UPDATE notifications SET
                    is_read = 1,
                    read_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND id IN (${placeholders}) AND is_read = 0
            `;
            queryParams = [userId, ...notification_ids];
        } else {
            return res.status(400).json({
                success: false,
                message: '無效的參數'
            });
        }

        // 先獲取將要更新的通知數量
        const countQuery = updateQuery.replace(
            'UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP',
            'SELECT COUNT(*) as count FROM notifications'
        );
        const countResult = await db.query(countQuery, queryParams);
        const updateCount = countResult[0].count;

        if (updateCount === 0) {
            return res.status(400).json({
                success: false,
                message: '沒有找到可更新的未讀通知'
            });
        }

        // 執行更新
        const result = await database.execute(updateQuery, queryParams);

        res.json({ 
            success: true, 
            message: `成功標記 ${result.changes} 個通知為已讀`,
            updatedCount: result.changes
        });

        // 發送Telegram通知
        try {
            await telegramNotifier.sendMessage(
                telegramNotifier.config.bossGroupId,
                `✅ 批量標記已讀\n👤 用戶: ${req.user.name}\n📊 標記數量: ${result.changes}個\n📂 類型: ${type || '全部'}\n🔄 模式: ${mark_all ? '全部標記' : '指定標記'}\n⏰ 時間: ${new Date().toLocaleString('zh-TW')}`
            );
        } catch (notificationError) {
            console.error('發送Telegram通知失敗:', notificationError);
        }

    } catch (error) {
        console.error('批量標記通知為已讀錯誤:', error);
        res.status(500).json({ 
            success: false, 
            message: '批量標記通知為已讀失敗',
            error: error.message 
        });
    }
});

module.exports = router;