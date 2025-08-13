/**
 * GClaude Enterprise System - 完整API路由
 * 替換所有硬編碼數據，提供真實的資料庫操作
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const database = require('../database');
const router = express.Router();

// JWT密鑰 (生產環境應該使用環境變數)
const JWT_SECRET = process.env.JWT_SECRET || 'gclaude-enterprise-jwt-secret-key-2025';

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

        res.json({
            success: true,
            message: '登入成功',
            token: token,
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

// 新增營收記錄
router.post('/revenue', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const {
            record_date, amount, payment_method, category,
            description, receipt_number, customer_count
        } = req.body;

        if (!record_date || !amount || !payment_method) {
            return res.status(400).json({
                success: false,
                message: '日期、金額和付款方式為必填欄位'
            });
        }

        const result = await database.run(`
            INSERT INTO revenue (
                uuid, record_date, amount, payment_method, category,
                description, recorded_by, receipt_number, customer_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            uuidv4(), record_date, amount, payment_method, category,
            description, req.user.id, receipt_number, customer_count || 1
        ]);

        res.status(201).json({
            success: true,
            message: '營收記錄新增成功',
            data: { id: result.id }
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

// 新增叫貨申請
router.post('/orders', authenticateToken, async (req, res) => {
    try {
        const { product_id, requested_quantity, reason, urgency } = req.body;

        if (!product_id || !requested_quantity) {
            return res.status(400).json({
                success: false,
                message: '商品和數量為必填欄位'
            });
        }

        // 生成訂單編號
        const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;

        const result = await database.run(`
            INSERT INTO orders (
                uuid, order_number, product_id, requested_quantity,
                reason, urgency, requested_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            uuidv4(), orderNumber, product_id, requested_quantity,
            reason, urgency || 'normal', req.user.id
        ]);

        res.status(201).json({
            success: true,
            message: '叫貨申請提交成功',
            data: { 
                id: result.id,
                order_number: orderNumber
            }
        });

    } catch (error) {
        console.error('新增叫貨申請錯誤:', error);
        res.status(500).json({
            success: false,
            message: '新增叫貨申請失敗'
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

module.exports = router;