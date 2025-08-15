/**
 * 🗄️ GClaude Enterprise System - 資料庫操作類
 * 提供完整的數據持久化支持
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { dbPath } = require('./init-database');

class DatabaseOperations {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
        this.db.run('PRAGMA foreign_keys = ON');
    }

    // 將 callback 風格轉換為 Promise
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    getQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    allQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // ==================== 用戶認證相關 ====================

    async getUserByUsername(username) {
        const sql = `
            SELECT u.*, e.name as employee_name, e.store_id, s.name as store_name
            FROM users u
            LEFT JOIN employees e ON u.employee_id = e.id
            LEFT JOIN stores s ON e.store_id = s.id
            WHERE u.username = ? AND u.is_active = 1
        `;
        return await this.getQuery(sql, [username]);
    }

    async createUser(userData) {
        const sql = `
            INSERT INTO users (username, password, role, employee_id)
            VALUES (?, ?, ?, ?)
        `;
        return await this.runQuery(sql, [userData.username, userData.password, userData.role, userData.employee_id]);
    }

    // ==================== 員工管理相關 ====================

    async getAllEmployees() {
        const sql = `
            SELECT e.*, s.name as store_name
            FROM employees e
            LEFT JOIN stores s ON e.store_id = s.id
            WHERE e.is_active = 1
            ORDER BY e.join_date DESC
        `;
        return await this.allQuery(sql);
    }

    async getEmployeeById(id) {
        const sql = `
            SELECT e.*, s.name as store_name
            FROM employees e
            LEFT JOIN stores s ON e.store_id = s.id
            WHERE e.id = ? AND e.is_active = 1
        `;
        return await this.getQuery(sql, [id]);
    }

    async createEmployee(employeeData) {
        const sql = `
            INSERT INTO employees (
                name, id_card, birth_date, gender, has_license, phone, address,
                emergency_contact, emergency_relationship, emergency_phone,
                join_date, store_id, position, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            employeeData.name, employeeData.id_card, employeeData.birth_date,
            employeeData.gender, employeeData.has_license, employeeData.phone,
            employeeData.address, employeeData.emergency_contact,
            employeeData.emergency_relationship, employeeData.emergency_phone,
            employeeData.join_date, employeeData.store_id, employeeData.position,
            employeeData.status
        ];
        return await this.runQuery(sql, params);
    }

    async updateEmployee(id, employeeData) {
        const sql = `
            UPDATE employees SET
                name = ?, phone = ?, address = ?, emergency_contact = ?,
                emergency_relationship = ?, emergency_phone = ?, store_id = ?,
                position = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const params = [
            employeeData.name, employeeData.phone, employeeData.address,
            employeeData.emergency_contact, employeeData.emergency_relationship,
            employeeData.emergency_phone, employeeData.store_id,
            employeeData.position, employeeData.status, id
        ];
        return await this.runQuery(sql, params);
    }

    async deleteEmployee(id) {
        const sql = `UPDATE employees SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        return await this.runQuery(sql, [id]);
    }

    // ==================== 出勤管理相關 ====================

    async getTodayAttendance(employeeId) {
        const today = new Date().toISOString().split('T')[0];
        const sql = `
            SELECT * FROM attendance
            WHERE employee_id = ? AND date = ?
        `;
        return await this.getQuery(sql, [employeeId, today]);
    }

    async getAttendanceHistory(employeeId, limit = 10) {
        const sql = `
            SELECT a.*, s.name as store_name
            FROM attendance a
            LEFT JOIN stores s ON a.store_id = s.id
            WHERE a.employee_id = ?
            ORDER BY a.date DESC
            LIMIT ?
        `;
        return await this.allQuery(sql, [employeeId, limit]);
    }

    async clockIn(employeeId, storeId, location) {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();
        
        // 檢查今天是否已經打卡
        const existing = await this.getTodayAttendance(employeeId);
        
        if (existing) {
            // 更新上班時間
            const sql = `
                UPDATE attendance SET
                    clock_in = ?, location_in = ?, updated_at = CURRENT_TIMESTAMP
                WHERE employee_id = ? AND date = ?
            `;
            return await this.runQuery(sql, [now, location, employeeId, today]);
        } else {
            // 新增出勤記錄
            const sql = `
                INSERT INTO attendance (employee_id, store_id, date, clock_in, location_in)
                VALUES (?, ?, ?, ?, ?)
            `;
            return await this.runQuery(sql, [employeeId, storeId, today, now, location]);
        }
    }

    async clockOut(employeeId, location) {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();
        
        const sql = `
            UPDATE attendance SET
                clock_out = ?, location_out = ?, updated_at = CURRENT_TIMESTAMP
            WHERE employee_id = ? AND date = ? AND clock_in IS NOT NULL
        `;
        return await this.runQuery(sql, [now, location, employeeId, today]);
    }

    // ==================== 營收管理相關 ====================

    async createRevenue(revenueData) {
        const sql = `
            INSERT INTO revenue (
                employee_id, store_id, category, item, amount, customer_name,
                revenue_date, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            revenueData.employee_id, revenueData.store_id, revenueData.category,
            revenueData.item, revenueData.amount, revenueData.customer_name,
            revenueData.revenue_date, revenueData.notes, 'pending'
        ];
        return await this.runQuery(sql, params);
    }

    async getRevenueByEmployee(employeeId, limit = 20) {
        const sql = `
            SELECT r.*, s.name as store_name
            FROM revenue r
            LEFT JOIN stores s ON r.store_id = s.id
            WHERE r.employee_id = ?
            ORDER BY r.created_at DESC
            LIMIT ?
        `;
        return await this.allQuery(sql, [employeeId, limit]);
    }

    async getTodayRevenue(employeeId) {
        const today = new Date().toISOString().split('T')[0];
        const sql = `
            SELECT 
                COUNT(*) as count,
                SUM(amount) as total,
                SUM(CASE WHEN category = '產品銷售' THEN amount ELSE 0 END) as product_sales,
                SUM(CASE WHEN category = '服務收入' THEN amount ELSE 0 END) as service_income,
                SUM(CASE WHEN category NOT IN ('產品銷售', '服務收入') THEN amount ELSE 0 END) as other
            FROM revenue
            WHERE employee_id = ? AND revenue_date = ?
        `;
        return await this.getQuery(sql, [employeeId, today]);
    }

    // ==================== 維修申請相關 ====================

    async createMaintenance(maintenanceData) {
        const sql = `
            INSERT INTO maintenance (
                employee_id, store_id, equipment_type, title, description,
                location, contact_phone, priority, photos
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            maintenanceData.employee_id, maintenanceData.store_id,
            maintenanceData.equipment_type, maintenanceData.title,
            maintenanceData.description, maintenanceData.location,
            maintenanceData.contact_phone, maintenanceData.priority,
            maintenanceData.photos || null
        ];
        return await this.runQuery(sql, params);
    }

    async getMaintenanceByEmployee(employeeId) {
        const sql = `
            SELECT m.*, s.name as store_name, a.name as assigned_to_name
            FROM maintenance m
            LEFT JOIN stores s ON m.store_id = s.id
            LEFT JOIN employees a ON m.assigned_to = a.id
            WHERE m.employee_id = ?
            ORDER BY m.created_at DESC
        `;
        return await this.allQuery(sql, [employeeId]);
    }

    async updateMaintenanceStatus(id, status, assignedTo = null) {
        let sql, params;
        
        if (assignedTo) {
            sql = `
                UPDATE maintenance SET
                    status = ?, assigned_to = ?, assigned_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            params = [status, assignedTo, id];
        } else {
            sql = `
                UPDATE maintenance SET
                    status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            params = [status, id];
        }
        
        return await this.runQuery(sql, params);
    }

    // ==================== 請假申請相關 ====================

    async createLeaveRequest(leaveData) {
        const sql = `
            INSERT INTO leave_requests (
                employee_id, leave_type, start_date, end_date, days, reason, substitute_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            leaveData.employee_id, leaveData.leave_type, leaveData.start_date,
            leaveData.end_date, leaveData.days, leaveData.reason, leaveData.substitute_id
        ];
        return await this.runQuery(sql, params);
    }

    async getLeaveRequestsByEmployee(employeeId) {
        const sql = `
            SELECT lr.*, s.name as substitute_name, a.name as approved_by_name
            FROM leave_requests lr
            LEFT JOIN employees s ON lr.substitute_id = s.id
            LEFT JOIN employees a ON lr.approved_by = a.id
            WHERE lr.employee_id = ?
            ORDER BY lr.applied_at DESC
        `;
        return await this.allQuery(sql, [employeeId]);
    }

    // ==================== 商品和庫存管理 ====================

    async getAllProducts() {
        const sql = `
            SELECT * FROM products
            WHERE is_active = 1
            ORDER BY category, name
        `;
        return await this.allQuery(sql);
    }

    async getProductById(id) {
        const sql = `SELECT * FROM products WHERE id = ? AND is_active = 1`;
        return await this.getQuery(sql, [id]);
    }

    async createProduct(productData) {
        const sql = `
            INSERT INTO products (
                code, name, category, unit, supplier_price, supplier_contact,
                delivery_threshold, current_stock, safe_stock
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            productData.code, productData.name, productData.category,
            productData.unit, productData.supplier_price, productData.supplier_contact,
            productData.delivery_threshold, productData.current_stock, productData.safe_stock
        ];
        return await this.runQuery(sql, params);
    }

    async updateProductStock(productId, newStock, operationType, operatedBy, notes = '') {
        const product = await this.getProductById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        // 開始事務
        await this.runQuery('BEGIN TRANSACTION');

        try {
            // 更新庫存
            await this.runQuery(
                'UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newStock, productId]
            );

            // 記錄庫存異動
            await this.runQuery(`
                INSERT INTO inventory_logs (
                    product_id, type, quantity, before_stock, after_stock, operated_by, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                productId, operationType, Math.abs(newStock - product.current_stock),
                product.current_stock, newStock, operatedBy, notes
            ]);

            await this.runQuery('COMMIT');
            return { success: true };
        } catch (error) {
            await this.runQuery('ROLLBACK');
            throw error;
        }
    }

    // ==================== 分店管理 ====================

    async getAllStores() {
        const sql = `SELECT * FROM stores WHERE is_active = 1 ORDER BY name`;
        return await this.allQuery(sql);
    }

    async getStoreById(id) {
        const sql = `SELECT * FROM stores WHERE id = ? AND is_active = 1`;
        return await this.getQuery(sql, [id]);
    }

    async updateStoreRadius(storeId, radius) {
        const sql = `
            UPDATE stores SET radius = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        return await this.runQuery(sql, [radius, storeId]);
    }

    // ==================== 系統設定 ====================

    async getSettingsByCategory(category) {
        const sql = `
            SELECT * FROM system_settings
            WHERE category = ? AND is_active = 1
            ORDER BY key
        `;
        return await this.allQuery(sql, [category]);
    }

    async updateSetting(category, key, value) {
        const sql = `
            INSERT OR REPLACE INTO system_settings (category, key, value, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `;
        return await this.runQuery(sql, [category, key, value]);
    }

    // ==================== 通知記錄 ====================

    async logNotification(type, platform, recipient, title, message, status = 'sent', responseData = null) {
        const sql = `
            INSERT INTO notification_logs (type, platform, recipient, title, message, status, response_data)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        return await this.runQuery(sql, [type, platform, recipient, title, message, status, responseData]);
    }

    // ==================== 統計數據 ====================

    async getDashboardStats() {
        const today = new Date().toISOString().split('T')[0];
        
        // 員工統計
        const employeeStats = await this.getQuery(`
            SELECT 
                COUNT(*) as total_employees,
                COUNT(CASE WHEN status = '在職' THEN 1 END) as active_employees,
                COUNT(CASE WHEN join_date = ? THEN 1 END) as new_hires
            FROM employees WHERE is_active = 1
        `, [today]);

        // 今日出勤統計
        const attendanceStats = await this.getQuery(`
            SELECT 
                COUNT(*) as total_attendance,
                COUNT(CASE WHEN clock_in IS NOT NULL THEN 1 END) as checked_in,
                COUNT(CASE WHEN clock_out IS NOT NULL THEN 1 END) as checked_out
            FROM attendance WHERE date = ?
        `, [today]);

        // 今日營收統計
        const revenueStats = await this.getQuery(`
            SELECT 
                COUNT(*) as total_records,
                SUM(amount) as total_revenue
            FROM revenue WHERE revenue_date = ?
        `, [today]);

        // 待處理維修申請
        const maintenanceStats = await this.getQuery(`
            SELECT COUNT(*) as pending_maintenance
            FROM maintenance WHERE status = 'pending'
        `);

        return {
            employees: employeeStats,
            attendance: attendanceStats,
            revenue: revenueStats,
            maintenance: maintenanceStats
        };
    }

    // 關閉資料庫連接
    close() {
        this.db.close();
    }
}

module.exports = DatabaseOperations;