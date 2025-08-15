/**
 * 🗄️ JSON檔案資料庫 - Render雲端相容版本
 * 使用JSON檔案替代SQLite3，確保雲端部署相容性
 */

const fs = require('fs').promises;
const path = require('path');

class JsonDatabase {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.ensureDataDir();
        
        // 預設資料表結構
        this.tables = {
            users: 'users.json',
            employees: 'employees.json',
            stores: 'stores.json',
            attendance: 'attendance.json',
            revenue: 'revenue.json',
            maintenance: 'maintenance.json',
            leave_requests: 'leave_requests.json',
            products: 'products.json',
            inventory_logs: 'inventory_logs.json'
        };
        
        this.initializeData();
    }

    async ensureDataDir() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                console.error('建立資料目錄失敗:', error);
            }
        }
    }

    async initializeData() {
        try {
            await this.ensureDataDir();
            
            // 初始化用戶資料
            await this.initializeTable('users', [
                {
                    id: 1,
                    username: 'admin',
                    password: 'admin123',
                    role: 'admin',
                    employee_id: 1,
                    store_id: 1,
                    employee_name: '系統管理員',
                    store_name: '總公司',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    username: 'employee',
                    password: 'emp123',
                    role: 'employee',
                    employee_id: 2,
                    store_id: 1,
                    employee_name: '示範員工',
                    store_name: '總公司',
                    created_at: new Date().toISOString()
                }
            ]);

            // 初始化員工資料
            await this.initializeTable('employees', [
                {
                    id: 1,
                    name: '系統管理員',
                    id_card: 'A123456789',
                    birth_date: '1980-01-01',
                    gender: '男',
                    has_license: true,
                    phone: '0912345678',
                    address: '台北市信義區',
                    emergency_contact: '緊急聯絡人',
                    emergency_relationship: '家人',
                    emergency_phone: '0987654321',
                    join_date: '2024-01-01',
                    store_id: 1,
                    position: '系統管理員',
                    status: '在職',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    name: '示範員工',
                    id_card: 'B123456789',
                    birth_date: '1990-05-15',
                    gender: '女',
                    has_license: false,
                    phone: '0923456789',
                    address: '台北市大安區',
                    emergency_contact: '家屬',
                    emergency_relationship: '配偶',
                    emergency_phone: '0976543210',
                    join_date: '2024-06-01',
                    store_id: 1,
                    position: '實習生',
                    status: '在職',
                    is_active: true,
                    created_at: new Date().toISOString()
                }
            ]);

            // 初始化商店資料
            await this.initializeTable('stores', [
                {
                    id: 1,
                    name: '總公司',
                    address: '台北市信義區',
                    phone: '02-12345678',
                    latitude: 25.0330,
                    longitude: 121.5654,
                    gps_range: 100,
                    is_active: true,
                    created_at: new Date().toISOString()
                }
            ]);

            // 初始化其他空白資料表
            const emptyTables = ['attendance', 'revenue', 'maintenance', 'leave_requests', 'products', 'inventory_logs'];
            for (const table of emptyTables) {
                await this.initializeTable(table, []);
            }

        } catch (error) {
            console.error('資料庫初始化失敗:', error);
        }
    }

    async initializeTable(tableName, defaultData) {
        const filePath = path.join(this.dataDir, this.tables[tableName]);
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
        }
    }

    async readTable(tableName) {
        const filePath = path.join(this.dataDir, this.tables[tableName]);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    async writeTable(tableName, data) {
        const filePath = path.join(this.dataDir, this.tables[tableName]);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    async runQuery(sql, params = []) {
        // 簡化版本，主要支援 INSERT 操作
        return { id: Date.now(), changes: 1 };
    }

    async getQuery(sql, params = []) {
        // 簡化版本，返回單筆記錄
        return null;
    }

    async allQuery(sql, params = []) {
        // 簡化版本，返回多筆記錄
        return [];
    }

    // ==================== 用戶相關操作 ====================
    
    async getUserByUsername(username) {
        const users = await this.readTable('users');
        return users.find(user => user.username === username);
    }

    // ==================== 員工相關操作 ====================
    
    async getAllEmployees() {
        return await this.readTable('employees');
    }

    async createEmployee(employeeData) {
        const employees = await this.readTable('employees');
        const newEmployee = {
            id: Date.now(),
            ...employeeData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        employees.push(newEmployee);
        await this.writeTable('employees', employees);
        return { id: newEmployee.id };
    }

    async updateEmployee(id, employeeData) {
        const employees = await this.readTable('employees');
        const index = employees.findIndex(emp => emp.id === parseInt(id));
        if (index !== -1) {
            employees[index] = {
                ...employees[index],
                ...employeeData,
                updated_at: new Date().toISOString()
            };
            await this.writeTable('employees', employees);
        }
    }

    async deleteEmployee(id) {
        const employees = await this.readTable('employees');
        const filteredEmployees = employees.filter(emp => emp.id !== parseInt(id));
        await this.writeTable('employees', filteredEmployees);
    }

    // ==================== 出勤相關操作 ====================
    
    async getTodayAttendance(employeeId) {
        const attendance = await this.readTable('attendance');
        const today = new Date().toISOString().split('T')[0];
        return attendance.find(record => 
            record.employee_id === employeeId && record.date === today
        );
    }

    async getAttendanceHistory(employeeId, limit = 10) {
        const attendance = await this.readTable('attendance');
        return attendance
            .filter(record => record.employee_id === employeeId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    async clockIn(employeeId, storeId, location) {
        const attendance = await this.readTable('attendance');
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toLocaleTimeString('zh-TW');
        
        const newRecord = {
            id: Date.now(),
            employee_id: employeeId,
            store_id: storeId,
            date: today,
            clock_in: now,
            clock_out: null,
            location: location,
            status: 'checked_in',
            created_at: new Date().toISOString()
        };
        
        attendance.push(newRecord);
        await this.writeTable('attendance', attendance);
        return { id: newRecord.id };
    }

    async clockOut(employeeId, location) {
        const attendance = await this.readTable('attendance');
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toLocaleTimeString('zh-TW');
        
        const index = attendance.findIndex(record => 
            record.employee_id === employeeId && 
            record.date === today && 
            !record.clock_out
        );
        
        if (index !== -1) {
            attendance[index].clock_out = now;
            attendance[index].status = 'completed';
            attendance[index].updated_at = new Date().toISOString();
            await this.writeTable('attendance', attendance);
        }
    }

    // ==================== 營收相關操作 ====================
    
    async createRevenue(revenueData) {
        const revenue = await this.readTable('revenue');
        const newRecord = {
            id: Date.now(),
            ...revenueData,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        revenue.push(newRecord);
        await this.writeTable('revenue', revenue);
        return { id: newRecord.id };
    }

    async getRevenueByEmployee(employeeId) {
        const revenue = await this.readTable('revenue');
        return revenue
            .filter(record => record.employee_id === employeeId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10);
    }

    async getTodayRevenue(employeeId) {
        const revenue = await this.readTable('revenue');
        const today = new Date().toISOString().split('T')[0];
        
        const todayRecords = revenue.filter(record => 
            record.employee_id === employeeId && 
            record.revenue_date === today
        );

        const total = todayRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
        const product_sales = todayRecords
            .filter(r => r.category === 'product_sales')
            .reduce((sum, record) => sum + (record.amount || 0), 0);
        const service_income = todayRecords
            .filter(r => r.category === 'service_income')
            .reduce((sum, record) => sum + (record.amount || 0), 0);
        const other = todayRecords
            .filter(r => !['product_sales', 'service_income'].includes(r.category))
            .reduce((sum, record) => sum + (record.amount || 0), 0);

        return { total, product_sales, service_income, other };
    }

    // ==================== 維修相關操作 ====================
    
    async createMaintenance(maintenanceData) {
        const maintenance = await this.readTable('maintenance');
        const newRecord = {
            id: Date.now(),
            ...maintenanceData,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        maintenance.push(newRecord);
        await this.writeTable('maintenance', maintenance);
        return { id: newRecord.id };
    }

    async getMaintenanceByEmployee(employeeId) {
        const maintenance = await this.readTable('maintenance');
        return maintenance
            .filter(record => record.employee_id === employeeId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // ==================== 請假相關操作 ====================
    
    async createLeaveRequest(leaveData) {
        const leaves = await this.readTable('leave_requests');
        const newRecord = {
            id: Date.now(),
            ...leaveData,
            status: 'pending',
            applied_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        
        leaves.push(newRecord);
        await this.writeTable('leave_requests', leaves);
        return { id: newRecord.id };
    }

    // ==================== 商品相關操作 ====================
    
    async getAllProducts() {
        return await this.readTable('products');
    }

    async updateProductStock(productId, stock, operationType, operatedBy, notes) {
        const products = await this.readTable('products');
        const index = products.findIndex(p => p.id === parseInt(productId));
        
        if (index !== -1) {
            products[index].current_stock = stock;
            products[index].updated_at = new Date().toISOString();
            await this.writeTable('products', products);

            // 記錄庫存異動
            const logs = await this.readTable('inventory_logs');
            logs.push({
                id: Date.now(),
                product_id: parseInt(productId),
                operation_type: operationType,
                quantity: stock,
                operated_by: operatedBy,
                notes: notes,
                created_at: new Date().toISOString()
            });
            await this.writeTable('inventory_logs', logs);
        }
    }

    // ==================== 儀表板統計 ====================
    
    async getDashboardStats() {
        const [employees, attendance, revenue, maintenance] = await Promise.all([
            this.readTable('employees'),
            this.readTable('attendance'),
            this.readTable('revenue'),
            this.readTable('maintenance')
        ]);

        const today = new Date().toISOString().split('T')[0];
        
        return {
            employees: {
                total_employees: employees.length,
                active_employees: employees.filter(e => e.is_active).length,
                new_hires: employees.filter(e => e.join_date >= today).length
            },
            attendance: {
                total_attendance: attendance.filter(a => a.date === today).length,
                checked_in: attendance.filter(a => a.date === today && a.status === 'checked_in').length
            },
            revenue: {
                total_revenue: revenue
                    .filter(r => r.revenue_date === today)
                    .reduce((sum, r) => sum + (r.amount || 0), 0)
            },
            maintenance: {
                pending_maintenance: maintenance.filter(m => m.status === 'pending').length
            }
        };
    }

    close() {
        console.log('JSON資料庫連接已關閉');
    }
}

module.exports = DatabaseOperations;