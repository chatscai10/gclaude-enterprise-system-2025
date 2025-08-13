/**
 * 員工管理路由 - GClaude Enterprise System
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const logger = require('../utils/logger');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 模擬員工數據
let employees = [
    {
        id: 1,
        name: '系統管理員',
        username: 'admin',
        position: '系統管理員',
        department: '管理部',
        email: 'admin@company.com',
        phone: '0912-345-678',
        hireDate: '2024-01-01',
        status: '在職',
        salary: 80000,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
        id: 2,
        name: '王店長',
        username: 'manager',
        position: '店長',
        department: '營運部',
        email: 'manager@company.com',
        phone: '0912-345-679',
        hireDate: '2024-02-01',
        status: '在職',
        salary: 60000,
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z'
    },
    {
        id: 3,
        name: '張員工',
        username: 'employee',
        position: '員工',
        department: '服務部',
        email: 'employee@company.com',
        phone: '0912-345-680',
        hireDate: '2024-03-01',
        status: '在職',
        salary: 40000,
        createdAt: '2024-03-01T00:00:00.000Z',
        updatedAt: '2024-03-01T00:00:00.000Z'
    },
    {
        id: 4,
        name: '李實習生',
        username: 'intern',
        position: '實習生',
        department: '服務部',
        email: 'intern@company.com',
        phone: '0912-345-681',
        hireDate: '2024-07-01',
        status: '在職',
        salary: 25000,
        createdAt: '2024-07-01T00:00:00.000Z',
        updatedAt: '2024-07-01T00:00:00.000Z'
    }
];

// 員工驗證規則
const validateEmployee = [
    body('name')
        .notEmpty()
        .withMessage('姓名不能為空')
        .isLength({ min: 2, max: 50 })
        .withMessage('姓名長度必須在2-50字符之間'),
    body('username')
        .notEmpty()
        .withMessage('用戶名不能為空')
        .isLength({ min: 3, max: 30 })
        .withMessage('用戶名長度必須在3-30字符之間'),
    body('position')
        .notEmpty()
        .withMessage('職位不能為空'),
    body('department')
        .notEmpty()
        .withMessage('部門不能為空'),
    body('email')
        .isEmail()
        .withMessage('請提供有效的電子郵件地址'),
    body('phone')
        .matches(/^09\d{8}$/)
        .withMessage('請提供有效的手機號碼')
];

// 獲取員工列表
router.get('/', authenticateToken, (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            department,
            position,
            status = '在職'
        } = req.query;

        let filteredEmployees = [...employees];

        // 搜尋過濾
        if (search) {
            filteredEmployees = filteredEmployees.filter(emp =>
                emp.name.includes(search) ||
                emp.username.includes(search) ||
                emp.email.includes(search)
            );
        }

        // 部門過濾
        if (department) {
            filteredEmployees = filteredEmployees.filter(emp =>
                emp.department === department
            );
        }

        // 職位過濾
        if (position) {
            filteredEmployees = filteredEmployees.filter(emp =>
                emp.position === position
            );
        }

        // 狀態過濾
        if (status) {
            filteredEmployees = filteredEmployees.filter(emp =>
                emp.status === status
            );
        }

        // 分頁
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

        // 統計資訊
        const stats = {
            total: filteredEmployees.length,
            active: employees.filter(emp => emp.status === '在職').length,
            byDepartment: {},
            byPosition: {}
        };

        // 統計各部門人數
        employees.forEach(emp => {
            stats.byDepartment[emp.department] = (stats.byDepartment[emp.department] || 0) + 1;
            stats.byPosition[emp.position] = (stats.byPosition[emp.position] || 0) + 1;
        });

        res.json({
            success: true,
            data: paginatedEmployees,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: filteredEmployees.length,
                pages: Math.ceil(filteredEmployees.length / parseInt(limit))
            },
            stats,
            filters: { search, department, position, status }
        });

    } catch (error) {
        logger.error('Get employees error:', error);
        res.status(500).json({
            success: false,
            message: '獲取員工列表失敗'
        });
    }
});

// 獲取單個員工
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const employeeId = parseInt(req.params.id);
        const employee = employees.find(emp => emp.id === employeeId);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: '找不到指定員工'
            });
        }

        res.json({
            success: true,
            data: employee
        });

    } catch (error) {
        logger.error('Get employee error:', error);
        res.status(500).json({
            success: false,
            message: '獲取員工資料失敗'
        });
    }
});

// 新增員工
router.post('/', authenticateToken, requireRole(['admin', 'manager']), validateEmployee, (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '輸入驗證失敗',
                errors: errors.array()
            });
        }

        // 檢查用戶名是否重複
        const existingEmployee = employees.find(emp => emp.username === req.body.username);
        if (existingEmployee) {
            return res.status(400).json({
                success: false,
                message: '用戶名已存在'
            });
        }

        // 檢查郵箱是否重複
        const existingEmail = employees.find(emp => emp.email === req.body.email);
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: '電子郵件已存在'
            });
        }

        const newEmployee = {
            id: Math.max(...employees.map(emp => emp.id)) + 1,
            ...req.body,
            status: req.body.status || '在職',
            salary: req.body.salary || 30000,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        employees.push(newEmployee);

        logger.info(`Employee created: ${newEmployee.name} (ID: ${newEmployee.id})`);

        res.status(201).json({
            success: true,
            message: '員工新增成功',
            data: newEmployee
        });

    } catch (error) {
        logger.error('Create employee error:', error);
        res.status(500).json({
            success: false,
            message: '新增員工失敗'
        });
    }
});

// 更新員工
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
    try {
        const employeeId = parseInt(req.params.id);
        const employeeIndex = employees.findIndex(emp => emp.id === employeeId);

        if (employeeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '找不到指定員工'
            });
        }

        // 如果更新用戶名，檢查是否重複
        if (req.body.username) {
            const existingEmployee = employees.find(emp => 
                emp.username === req.body.username && emp.id !== employeeId
            );
            if (existingEmployee) {
                return res.status(400).json({
                    success: false,
                    message: '用戶名已存在'
                });
            }
        }

        // 如果更新郵箱，檢查是否重複
        if (req.body.email) {
            const existingEmail = employees.find(emp => 
                emp.email === req.body.email && emp.id !== employeeId
            );
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: '電子郵件已存在'
                });
            }
        }

        employees[employeeIndex] = {
            ...employees[employeeIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        logger.info(`Employee updated: ${employees[employeeIndex].name} (ID: ${employeeId})`);

        res.json({
            success: true,
            message: '員工資料更新成功',
            data: employees[employeeIndex]
        });

    } catch (error) {
        logger.error('Update employee error:', error);
        res.status(500).json({
            success: false,
            message: '更新員工資料失敗'
        });
    }
});

// 刪除員工
router.delete('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
    try {
        const employeeId = parseInt(req.params.id);
        const employeeIndex = employees.findIndex(emp => emp.id === employeeId);

        if (employeeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '找不到指定員工'
            });
        }

        const deletedEmployee = employees.splice(employeeIndex, 1)[0];

        logger.warn(`Employee deleted: ${deletedEmployee.name} (ID: ${employeeId})`);

        res.json({
            success: true,
            message: '員工刪除成功',
            data: deletedEmployee
        });

    } catch (error) {
        logger.error('Delete employee error:', error);
        res.status(500).json({
            success: false,
            message: '刪除員工失敗'
        });
    }
});

// 獲取員工統計
router.get('/stats/overview', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
    try {
        const stats = {
            total: employees.length,
            active: employees.filter(emp => emp.status === '在職').length,
            byDepartment: {},
            byPosition: {},
            recentHires: employees
                .filter(emp => {
                    const hireDate = new Date(emp.hireDate);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return hireDate >= thirtyDaysAgo;
                })
                .length,
            averageSalary: Math.round(
                employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length
            )
        };

        employees.forEach(emp => {
            stats.byDepartment[emp.department] = (stats.byDepartment[emp.department] || 0) + 1;
            stats.byPosition[emp.position] = (stats.byPosition[emp.position] || 0) + 1;
        });

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Get employee stats error:', error);
        res.status(500).json({
            success: false,
            message: '獲取員工統計失敗'
        });
    }
});

module.exports = router;