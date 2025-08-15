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
            inventory_logs: 'inventory_logs.json',
            orders: 'orders.json',
            order_items: 'order_items.json'
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

            // 初始化商品資料表
            await this.initializeTable('products', [
                {
                    id: 1,
                    name: '精緻咖啡豆',
                    category: '原料',
                    supplier: '台灣精品咖啡',
                    current_stock: 50,
                    min_threshold: 10,
                    max_threshold: 100,
                    unit_price: 450,
                    unit: '包',
                    description: '阿里山高山咖啡豆',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    name: '一次性咖啡杯',
                    category: '包材',
                    supplier: '環保包材有限公司',
                    current_stock: 200,
                    min_threshold: 50,
                    max_threshold: 500,
                    unit_price: 12,
                    unit: '個',
                    description: '16oz環保紙杯',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    name: '有機牛奶',
                    category: '原料',
                    supplier: '純淨乳品公司',
                    current_stock: 25,
                    min_threshold: 10,
                    max_threshold: 50,
                    unit_price: 85,
                    unit: '瓶',
                    description: '1000ml有機全脂牛奶',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 4,
                    name: '糖包',
                    category: '配料',
                    supplier: '甜蜜調味公司',
                    current_stock: 300,
                    min_threshold: 100,
                    max_threshold: 1000,
                    unit_price: 2,
                    unit: '包',
                    description: '5g白砂糖包',
                    is_active: true,
                    created_at: new Date().toISOString()
                }
            ]);

            // 初始化其他空白資料表
            const emptyTables = ['attendance', 'revenue', 'maintenance', 'leave_requests', 'inventory_logs', 'orders', 'order_items'];
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

    // 根據系統邏輯要求：姓名當帳號，身分證當密碼
    async getUserByNameAndIdCard(name, idCard) {
        const employees = await this.readTable('employees');
        const employee = employees.find(emp => emp.name === name && emp.id_card === idCard && emp.is_active);
        
        if (!employee) return null;
        
        // 轉換為用戶格式
        return {
            id: employee.id,
            username: employee.name,
            password: employee.id_card,
            role: employee.position === '系統管理員' ? 'admin' : 'employee',
            employee_id: employee.id,
            store_id: employee.store_id,
            employee_name: employee.name,
            store_name: await this.getStoreName(employee.store_id)
        };
    }
    
    async getStoreName(storeId) {
        const stores = await this.readTable('stores');
        const store = stores.find(s => s.id === storeId);
        return store ? store.name : '未知分店';
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

    async getProductsByCategory(category = null) {
        const products = await this.readTable('products');
        if (category) {
            return products.filter(p => p.category === category && p.is_active);
        }
        return products.filter(p => p.is_active);
    }

    async getProductById(productId) {
        const products = await this.readTable('products');
        return products.find(p => p.id === parseInt(productId));
    }

    async updateProductStock(productId, newStock, operationType, operatedBy, notes) {
        const products = await this.readTable('products');
        const index = products.findIndex(p => p.id === parseInt(productId));
        
        if (index !== -1) {
            const oldStock = products[index].current_stock;
            products[index].current_stock = newStock;
            products[index].updated_at = new Date().toISOString();
            await this.writeTable('products', products);

            // 記錄庫存異動
            const logs = await this.readTable('inventory_logs');
            logs.push({
                id: Date.now(),
                product_id: parseInt(productId),
                operation_type: operationType,
                old_stock: oldStock,
                new_stock: newStock,
                quantity_change: newStock - oldStock,
                operated_by: operatedBy,
                notes: notes,
                created_at: new Date().toISOString()
            });
            await this.writeTable('inventory_logs', logs);
            
            return { success: true, oldStock, newStock };
        }
        return { success: false, message: '商品不存在' };
    }

    async checkLowStockProducts() {
        const products = await this.readTable('products');
        return products.filter(p => 
            p.is_active && 
            p.current_stock <= p.min_threshold
        );
    }

    // ==================== 叫貨系統操作 ====================
    
    async createOrder(employeeId, storeId, orderItems, notes = '') {
        const orders = await this.readTable('orders');
        const orderItemsTable = await this.readTable('order_items');
        
        const orderId = Date.now();
        
        // 創建訂單主檔
        const newOrder = {
            id: orderId,
            employee_id: employeeId,
            store_id: storeId,
            order_date: new Date().toISOString().split('T')[0],
            status: 'pending',
            total_amount: 0,
            notes: notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        let totalAmount = 0;
        
        // 創建訂單明細並檢查庫存
        for (const item of orderItems) {
            const product = await this.getProductById(item.product_id);
            if (!product) {
                throw new Error(`商品ID ${item.product_id} 不存在`);
            }
            
            const itemTotal = item.quantity * product.unit_price;
            totalAmount += itemTotal;
            
            // 新增訂單明細
            orderItemsTable.push({
                id: Date.now() + Math.random(),
                order_id: orderId,
                product_id: item.product_id,
                product_name: product.name,
                quantity: item.quantity,
                unit_price: product.unit_price,
                total_price: itemTotal,
                created_at: new Date().toISOString()
            });
            
            // 自動扣減庫存
            const newStock = product.current_stock - item.quantity;
            if (newStock < 0) {
                throw new Error(`商品 ${product.name} 庫存不足，目前庫存：${product.current_stock}，需要：${item.quantity}`);
            }
            
            await this.updateProductStock(
                item.product_id, 
                newStock, 
                'order_deduction', 
                employeeId, 
                `訂單 #${orderId} 扣減庫存`
            );
        }
        
        newOrder.total_amount = totalAmount;
        orders.push(newOrder);
        
        await this.writeTable('orders', orders);
        await this.writeTable('order_items', orderItemsTable);
        
        return { 
            orderId, 
            totalAmount,
            message: '叫貨訂單創建成功',
            lowStockWarnings: await this.checkLowStockProducts()
        };
    }

    async getOrdersByEmployee(employeeId, limit = 10) {
        const orders = await this.readTable('orders');
        const orderItems = await this.readTable('order_items');
        
        const employeeOrders = orders
            .filter(order => order.employee_id === employeeId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
            
        // 為每個訂單加入明細
        for (const order of employeeOrders) {
            order.items = orderItems.filter(item => item.order_id === order.id);
        }
        
        return employeeOrders;
    }

    async getOrderHistory(limit = 50) {
        const orders = await this.readTable('orders');
        const orderItems = await this.readTable('order_items');
        
        const recentOrders = orders
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
            
        // 為每個訂單加入明細
        for (const order of recentOrders) {
            order.items = orderItems.filter(item => item.order_id === order.id);
        }
        
        return recentOrders;
    }

    // ==================== 異常偵測系統 ====================
    
    async detectOrderingAnomalies(employeeId, days = 30) {
        const orders = await this.readTable('orders');
        const orderItems = await this.readTable('order_items');
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const recentOrders = orders.filter(order => 
            order.employee_id === employeeId && 
            new Date(order.created_at) >= cutoffDate
        );
        
        const anomalies = [];
        
        // 1. 頻率異常檢測
        if (recentOrders.length > days * 0.8) { // 平均每天超過0.8次訂購
            anomalies.push({
                type: 'high_frequency',
                message: `${days}天內訂購次數過於頻繁 (${recentOrders.length}次)`,
                severity: 'warning'
            });
        }
        
        // 2. 金額異常檢測
        const amounts = recentOrders.map(o => o.total_amount);
        if (amounts.length > 0) {
            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const maxAmount = Math.max(...amounts);
            
            if (maxAmount > avgAmount * 3) {
                anomalies.push({
                    type: 'high_amount',
                    message: `發現異常高額訂購 (${maxAmount}元，平均：${avgAmount.toFixed(0)}元)`,
                    severity: 'alert'
                });
            }
        }
        
        // 3. 數量異常檢測
        const allItems = recentOrders.flatMap(order => 
            orderItems.filter(item => item.order_id === order.id)
        );
        
        const productQuantities = {};
        allItems.forEach(item => {
            if (!productQuantities[item.product_id]) {
                productQuantities[item.product_id] = [];
            }
            productQuantities[item.product_id].push(item.quantity);
        });
        
        for (const [productId, quantities] of Object.entries(productQuantities)) {
            if (quantities.length > 1) {
                const avg = quantities.reduce((a, b) => a + b, 0) / quantities.length;
                const max = Math.max(...quantities);
                
                if (max > avg * 5) {
                    const product = await this.getProductById(parseInt(productId));
                    anomalies.push({
                        type: 'unusual_quantity',
                        message: `${product?.name || '未知商品'} 訂購數量異常 (${max}個，平均：${avg.toFixed(1)}個)`,
                        severity: 'warning'
                    });
                }
            }
        }
        
        return anomalies;
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

module.exports = JsonDatabase;