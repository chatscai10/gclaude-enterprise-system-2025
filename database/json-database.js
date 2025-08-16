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
            order_items: 'order_items.json',
            positions: 'positions.json',
            promotions: 'promotions.json',
            promotion_votes: 'promotion_votes.json',
            schedules: 'schedules.json',
            schedule_settings: 'schedule_settings.json'
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
                    position_id: null,
                    position_start_date: '2024-01-01',
                    line_user_id: null,
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
                    position_id: 1,
                    position_start_date: '2024-06-01',
                    line_user_id: null,
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
                    delivery_threshold: 1000,
                    frequent_order_days: 1,
                    rare_order_days: 7,
                    supplier_contact: '02-12345678',
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
                    delivery_threshold: 500,
                    frequent_order_days: 2,
                    rare_order_days: 14,
                    supplier_contact: '03-98765432',
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
                    delivery_threshold: 800,
                    frequent_order_days: 1,
                    rare_order_days: 3,
                    supplier_contact: '04-87654321',
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
                    delivery_threshold: 200,
                    frequent_order_days: 3,
                    rare_order_days: 21,
                    supplier_contact: '07-76543210',
                    is_active: true,
                    created_at: new Date().toISOString()
                }
            ]);

            // 初始化職位階級資料表
            await this.initializeTable('positions', [
                {
                    id: 1,
                    name: '實習生',
                    level: 1,
                    salary: 28000,
                    bonus_rate: 0.05,
                    quota: 10,
                    required_days: 0,
                    failure_buffer_days: 30,
                    approval_rate: 0.6,
                    voting_duration_days: 5,
                    late_limit_minutes: 60,
                    punishment: '口頭警告',
                    description: '新進員工，學習基礎技能',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    name: '正職員工',
                    level: 2,
                    salary: 32000,
                    bonus_rate: 0.08,
                    quota: 8,
                    required_days: 90,
                    failure_buffer_days: 60,
                    approval_rate: 0.65,
                    voting_duration_days: 5,
                    late_limit_minutes: 45,
                    punishment: '記小過',
                    description: '熟悉基本作業流程',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    name: '資深員工',
                    level: 3,
                    salary: 36000,
                    bonus_rate: 0.12,
                    quota: 6,
                    required_days: 180,
                    failure_buffer_days: 90,
                    approval_rate: 0.7,
                    voting_duration_days: 5,
                    late_limit_minutes: 30,
                    punishment: '記大過',
                    description: '能獨立處理複雜問題',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 4,
                    name: '組長',
                    level: 4,
                    salary: 42000,
                    bonus_rate: 0.15,
                    quota: 4,
                    required_days: 365,
                    failure_buffer_days: 120,
                    approval_rate: 0.75,
                    voting_duration_days: 7,
                    late_limit_minutes: 20,
                    punishment: '調職處分',
                    description: '帶領小組完成任務',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 5,
                    name: '主任',
                    level: 5,
                    salary: 48000,
                    bonus_rate: 0.18,
                    quota: 2,
                    required_days: 540,
                    failure_buffer_days: 180,
                    approval_rate: 0.8,
                    voting_duration_days: 7,
                    late_limit_minutes: 15,
                    punishment: '降職處分',
                    description: '負責部門管理',
                    is_active: true,
                    created_at: new Date().toISOString()
                }
            ]);

            // 初始化排班設定表
            await this.initializeTable('schedule_settings', [{
                id: 1,
                schedule_month: '2025-09',
                max_leave_days_per_person: 8,
                max_leave_people_per_day: 2,
                max_weekend_leave_days: 3,
                max_same_store_leave_per_day: 1,
                max_backup_leave_per_day: 1,
                max_parttime_leave_per_day: 1,
                operation_time_minutes: 5,
                system_open_date: '2025-08-16',
                system_open_time: '02:00',
                system_close_date: '2025-08-21',
                system_close_time: '02:00',
                current_status: 'closed',
                current_user: null,
                current_start_time: null,
                current_end_time: null,
                store_holidays: {
                    "1": ["2025-09-15", "2025-09-30"],
                    "2": ["2025-09-10", "2025-09-25"],
                    "3": ["2025-09-05", "2025-09-20"]
                },
                store_forbidden_days: {
                    "1": ["2025-09-01", "2025-09-14"],
                    "2": ["2025-09-07", "2025-09-21"],
                    "3": ["2025-09-03", "2025-09-28"]
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);

            // 初始化其他空白資料表
            const emptyTables = ['attendance', 'revenue', 'maintenance', 'leave_requests', 'inventory_logs', 'orders', 'order_items', 'promotions', 'promotion_votes', 'schedules'];
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

    // ==================== GPS打卡相關操作 ====================
    
    async clockInWithGPS(clockInData) {
        const attendance = await this.readTable('attendance');
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        
        // 檢查今日是否已有打卡記錄
        const existingRecord = attendance.find(record => 
            record.employee_id === clockInData.employee_id && 
            record.date === today
        );
        
        if (existingRecord && existingRecord.clock_in) {
            throw new Error('今日已完成上班打卡');
        }
        
        const newRecord = {
            id: Date.now(),
            employee_id: clockInData.employee_id,
            store_id: clockInData.store_id,
            date: today,
            clock_in: now.toISOString(),
            clock_in_time: now.toLocaleTimeString('zh-TW'),
            clock_out: null,
            clock_out_time: null,
            location: clockInData.location,
            latitude: clockInData.latitude,
            longitude: clockInData.longitude,
            gps_accuracy: clockInData.gps_accuracy,
            device_fingerprint: clockInData.device_fingerprint,
            ip_address: clockInData.ip_address,
            user_agent: clockInData.user_agent,
            status: 'checked_in',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        attendance.push(newRecord);
        await this.writeTable('attendance', attendance);
        
        // 記錄設備指紋歷史
        await this.recordDeviceFingerprint(clockInData.employee_id, clockInData.device_fingerprint, 'clock_in');
        
        return { id: newRecord.id };
    }
    
    async clockOutWithGPS(clockOutData) {
        const attendance = await this.readTable('attendance');
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        
        const index = attendance.findIndex(record => 
            record.employee_id === clockOutData.employee_id && 
            record.date === today && 
            record.clock_in && 
            !record.clock_out
        );
        
        if (index === -1) {
            throw new Error('找不到今日上班打卡記錄，請先完成上班打卡');
        }
        
        // 計算工作時數
        const clockInTime = new Date(attendance[index].clock_in);
        const workMinutes = Math.floor((now - clockInTime) / 1000 / 60);
        const workHours = (workMinutes / 60).toFixed(2);
        
        attendance[index].clock_out = now.toISOString();
        attendance[index].clock_out_time = now.toLocaleTimeString('zh-TW');
        attendance[index].work_minutes = workMinutes;
        attendance[index].work_hours = workHours;
        attendance[index].out_location = clockOutData.location;
        attendance[index].out_latitude = clockOutData.latitude;
        attendance[index].out_longitude = clockOutData.longitude;
        attendance[index].out_gps_accuracy = clockOutData.gps_accuracy;
        attendance[index].out_device_fingerprint = clockOutData.device_fingerprint;
        attendance[index].out_ip_address = clockOutData.ip_address;
        attendance[index].out_user_agent = clockOutData.user_agent;
        attendance[index].status = 'completed';
        attendance[index].updated_at = new Date().toISOString();
        
        await this.writeTable('attendance', attendance);
        
        // 記錄設備指紋歷史
        await this.recordDeviceFingerprint(clockOutData.employee_id, clockOutData.device_fingerprint, 'clock_out');
        
        return { 
            id: attendance[index].id, 
            work_hours: workHours,
            work_minutes: workMinutes
        };
    }
    
    // 記錄設備指紋
    async recordDeviceFingerprint(employeeId, deviceFingerprint, actionType) {
        try {
            let deviceHistory = [];
            try {
                deviceHistory = await this.readTable('device_fingerprints');
            } catch (error) {
                // 如果表不存在，初始化空陣列
                deviceHistory = [];
            }
            
            const newRecord = {
                id: Date.now(),
                employee_id: employeeId,
                device_fingerprint: deviceFingerprint,
                action_type: actionType, // 'clock_in' 或 'clock_out'
                timestamp: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0]
            };
            
            deviceHistory.push(newRecord);
            await this.writeTable('device_fingerprints', deviceHistory);
            
        } catch (error) {
            console.error('記錄設備指紋失敗:', error);
            // 不影響主要打卡流程
        }
    }
    
    // 檢查設備異常
    async checkDeviceAnomalies(employeeId, currentDeviceFingerprint) {
        try {
            const deviceHistory = await this.readTable('device_fingerprints');
            const employeeDevices = deviceHistory.filter(record => record.employee_id === employeeId);
            
            if (employeeDevices.length === 0) {
                return []; // 第一次打卡，無異常
            }
            
            // 檢查最近7天的設備使用記錄
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const recentDevices = employeeDevices.filter(record => 
                new Date(record.timestamp) >= sevenDaysAgo
            );
            
            const uniqueDevices = [...new Set(recentDevices.map(r => r.device_fingerprint))];
            
            const anomalies = [];
            
            // 異常1: 新設備檢測
            if (!uniqueDevices.includes(currentDeviceFingerprint)) {
                anomalies.push({
                    type: 'new_device',
                    severity: 'warning',
                    message: '檢測到新設備打卡',
                    details: `員工使用新設備進行打卡，設備ID: ${currentDeviceFingerprint.substring(0, 16)}...`
                });
            }
            
            // 異常2: 多設備使用檢測
            if (uniqueDevices.length > 3) {
                anomalies.push({
                    type: 'multiple_devices',
                    severity: 'alert',
                    message: '多設備使用警告',
                    details: `員工在7天內使用了 ${uniqueDevices.length} 個不同設備`
                });
            }
            
            // 異常3: 同日多次設備變更
            const today = new Date().toISOString().split('T')[0];
            const todayDevices = employeeDevices.filter(record => record.date === today);
            const todayUniqueDevices = [...new Set(todayDevices.map(r => r.device_fingerprint))];
            
            if (todayUniqueDevices.length > 2) {
                anomalies.push({
                    type: 'device_switching',
                    severity: 'alert',
                    message: '當日設備切換異常',
                    details: `員工今日已使用 ${todayUniqueDevices.length} 個不同設備打卡`
                });
            }
            
            return anomalies;
            
        } catch (error) {
            console.error('設備異常檢查失敗:', error);
            return [];
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

    async createMaintenanceWithPhotos(maintenanceData) {
        const maintenance = await this.readTable('maintenance');
        const newRecord = {
            id: Date.now(),
            employee_id: maintenanceData.employee_id,
            store_id: maintenanceData.store_id,
            equipment_type: maintenanceData.equipment_type,
            title: maintenanceData.title,
            description: maintenanceData.description,
            location: maintenanceData.location,
            contact_phone: maintenanceData.contact_phone,
            priority: maintenanceData.priority,
            photos: maintenanceData.photos || [],
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        maintenance.push(newRecord);
        await this.writeTable('maintenance', maintenance);
        return { id: newRecord.id };
    }

    async updateMaintenanceStatus(maintenanceId, status, notes = '') {
        const maintenance = await this.readTable('maintenance');
        const index = maintenance.findIndex(record => record.id === parseInt(maintenanceId));
        
        if (index === -1) {
            throw new Error('維修記錄不存在');
        }
        
        maintenance[index].status = status;
        maintenance[index].admin_notes = notes;
        maintenance[index].updated_at = new Date().toISOString();
        
        if (status === 'completed') {
            maintenance[index].completed_at = new Date().toISOString();
        }
        
        await this.writeTable('maintenance', maintenance);
        return { id: maintenanceId, status, notes };
    }

    async getAllMaintenanceRecords(limit = 50, offset = 0) {
        const maintenance = await this.readTable('maintenance');
        return maintenance
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(offset, offset + limit);
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
        
        // 1. 按供應商分組檢查配送額度
        const supplierGroups = {};
        let totalAmount = 0;
        
        // 先計算總金額並按供應商分組
        for (const item of orderItems) {
            const product = await this.getProductById(item.product_id);
            if (!product) {
                throw new Error(`商品ID ${item.product_id} 不存在`);
            }
            
            // 檢查庫存
            if (product.current_stock < item.quantity) {
                throw new Error(`商品 ${product.name} 庫存不足，目前庫存：${product.current_stock}，需要：${item.quantity}`);
            }
            
            const itemTotal = item.quantity * product.unit_price;
            totalAmount += itemTotal;
            
            // 按供應商分組
            if (!supplierGroups[product.supplier]) {
                supplierGroups[product.supplier] = {
                    total: 0,
                    items: [],
                    delivery_threshold: product.delivery_threshold
                };
            }
            
            supplierGroups[product.supplier].total += itemTotal;
            supplierGroups[product.supplier].items.push({
                ...item,
                product_name: product.name,
                unit_price: product.unit_price,
                total_price: itemTotal
            });
        }
        
        // 2. 檢查各供應商配送額度
        const deliveryFailures = [];
        for (const [supplier, group] of Object.entries(supplierGroups)) {
            if (group.total < group.delivery_threshold) {
                const shortfall = group.delivery_threshold - group.total;
                deliveryFailures.push({
                    supplier,
                    current: group.total,
                    required: group.delivery_threshold,
                    shortfall
                });
            }
        }
        
        if (deliveryFailures.length > 0) {
            const failureMessage = deliveryFailures.map(f => 
                `${f.supplier}: 需要 $${f.required}，目前 $${f.current}，差額 $${f.shortfall}`
            ).join('\n');
            throw new Error(`配送額度不足：\n${failureMessage}`);
        }
        
        // 3. 創建訂單主檔
        const newOrder = {
            id: orderId,
            employee_id: employeeId,
            store_id: storeId,
            order_date: new Date().toISOString().split('T')[0],
            status: 'pending',
            total_amount: totalAmount,
            notes: notes,
            supplier_breakdown: supplierGroups,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // 4. 創建訂單明細並扣減庫存
        for (const item of orderItems) {
            const product = await this.getProductById(item.product_id);
            const itemTotal = item.quantity * product.unit_price;
            
            // 新增訂單明細
            orderItemsTable.push({
                id: Date.now() + Math.random(),
                order_id: orderId,
                product_id: item.product_id,
                product_name: product.name,
                supplier: product.supplier,
                quantity: item.quantity,
                unit_price: product.unit_price,
                total_price: itemTotal,
                created_at: new Date().toISOString()
            });
            
            // 自動扣減庫存
            const newStock = product.current_stock - item.quantity;
            await this.updateProductStock(
                item.product_id, 
                newStock, 
                'order_deduction', 
                employeeId, 
                `訂單 #${orderId} 扣減庫存`
            );
        }
        
        orders.push(newOrder);
        
        await this.writeTable('orders', orders);
        await this.writeTable('order_items', orderItemsTable);
        
        // 5. 檢查異常訂購並生成警告
        const anomalies = await this.detectOrderingAnomalies(employeeId, 30);
        
        return { 
            orderId, 
            totalAmount,
            supplierBreakdown: supplierGroups,
            message: '叫貨訂單創建成功',
            lowStockWarnings: await this.checkLowStockProducts(),
            orderingAnomalies: anomalies
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

    // ==================== 升遷投票系統操作 ====================
    
    async getAllPositions() {
        return await this.readTable('positions');
    }

    async getPositionById(positionId) {
        const positions = await this.readTable('positions');
        return positions.find(p => p.id === parseInt(positionId));
    }

    async getActivePromotions() {
        const promotions = await this.readTable('promotions');
        const now = new Date();
        return promotions.filter(p => 
            p.status === 'active' && 
            new Date(p.voting_end_date) > now
        );
    }

    async canEmployeeStartPromotion(employeeId) {
        const employee = await this.getEmployeeById(employeeId);
        if (!employee || !employee.position_id) {
            return { canStart: false, reason: '員工資料不完整' };
        }

        const currentPosition = await this.getPositionById(employee.position_id);
        if (!currentPosition) {
            return { canStart: false, reason: '找不到目前職位資料' };
        }

        // 檢查是否有下一個階級
        const positions = await this.getAllPositions();
        const nextPosition = positions.find(p => p.level === currentPosition.level + 1 && p.is_active);
        if (!nextPosition) {
            return { canStart: false, reason: '已達最高職位' };
        }

        // 檢查在目前職位的天數
        const positionStartDate = new Date(employee.position_start_date);
        const now = new Date();
        const daysInPosition = Math.floor((now - positionStartDate) / (1000 * 60 * 60 * 24));
        
        if (daysInPosition < nextPosition.required_days) {
            const remainingDays = nextPosition.required_days - daysInPosition;
            return { 
                canStart: false, 
                reason: `需在${currentPosition.name}職位任職${nextPosition.required_days}天，還需${remainingDays}天` 
            };
        }

        // 檢查是否在緩衝期內
        const promotions = await this.readTable('promotions');
        const lastFailedPromotion = promotions
            .filter(p => p.employee_id === employeeId && p.status === 'failed')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

        if (lastFailedPromotion) {
            const failedDate = new Date(lastFailedPromotion.created_at);
            const bufferEnd = new Date(failedDate.getTime() + nextPosition.failure_buffer_days * 24 * 60 * 60 * 1000);
            
            if (now < bufferEnd) {
                const remainingBufferDays = Math.ceil((bufferEnd - now) / (1000 * 60 * 60 * 24));
                return { 
                    canStart: false, 
                    reason: `在緩衝期內，還需等待${remainingBufferDays}天` 
                };
            }
        }

        // 檢查名額是否已滿
        const currentActivePromotions = await this.getActivePromotions();
        const promotionsToSamePosition = currentActivePromotions.filter(p => p.target_position_id === nextPosition.id);
        
        if (promotionsToSamePosition.length >= nextPosition.quota) {
            return { 
                canStart: false, 
                reason: `${nextPosition.name}職位名額已滿` 
            };
        }

        return { 
            canStart: true, 
            currentPosition,
            nextPosition,
            daysInPosition 
        };
    }

    async startPromotion(employeeId) {
        const canStartResult = await this.canEmployeeStartPromotion(employeeId);
        if (!canStartResult.canStart) {
            throw new Error(canStartResult.reason);
        }

        const { currentPosition, nextPosition, daysInPosition } = canStartResult;
        const employee = await this.getEmployeeById(employeeId);
        
        const promotions = await this.readTable('promotions');
        const promotionVotes = await this.readTable('promotion_votes');
        
        const promotionId = Date.now();
        const now = new Date();
        const votingEndDate = new Date(now.getTime() + nextPosition.voting_duration_days * 24 * 60 * 60 * 1000);

        // 創建升遷申請
        const newPromotion = {
            id: promotionId,
            employee_id: employeeId,
            employee_name: employee.name,
            current_position_id: currentPosition.id,
            current_position_name: currentPosition.name,
            target_position_id: nextPosition.id,
            target_position_name: nextPosition.name,
            days_in_position: daysInPosition,
            voting_start_date: now.toISOString(),
            voting_end_date: votingEndDate.toISOString(),
            required_approval_rate: nextPosition.approval_rate,
            status: 'active',
            created_at: now.toISOString()
        };

        promotions.push(newPromotion);

        // 為所有在職員工創建投票記錄（預設反對）
        const allEmployees = await this.getAllEmployees();
        const activeEmployees = allEmployees.filter(emp => emp.is_active && emp.status === '在職');

        for (const emp of activeEmployees) {
            promotionVotes.push({
                id: Date.now() + Math.random(),
                promotion_id: promotionId,
                voter_employee_id: emp.id,
                voter_name: emp.name,
                vote: 'disagree',
                vote_date: null,
                daily_changes_count: 0,
                created_at: now.toISOString()
            });
        }

        await this.writeTable('promotions', promotions);
        await this.writeTable('promotion_votes', promotionVotes);

        return {
            promotionId,
            message: '升遷投票已發起',
            votingEndDate: votingEndDate.toISOString(),
            totalVoters: activeEmployees.length
        };
    }

    async getEmployeeById(employeeId) {
        const employees = await this.readTable('employees');
        return employees.find(emp => emp.id === parseInt(employeeId));
    }

    async castVote(promotionId, voterEmployeeId, vote) {
        const promotionVotes = await this.readTable('promotion_votes');
        const voteIndex = promotionVotes.findIndex(v => 
            v.promotion_id === parseInt(promotionId) && 
            v.voter_employee_id === parseInt(voterEmployeeId)
        );

        if (voteIndex === -1) {
            throw new Error('投票記錄不存在');
        }

        const voteRecord = promotionVotes[voteIndex];
        const today = new Date().toISOString().split('T')[0];
        const lastVoteDate = voteRecord.vote_date ? voteRecord.vote_date.split('T')[0] : null;

        // 檢查今日修改次數限制
        if (lastVoteDate === today && voteRecord.daily_changes_count >= 3) {
            throw new Error('今日投票修改次數已達上限');
        }

        // 更新投票
        promotionVotes[voteIndex] = {
            ...voteRecord,
            vote: vote,
            vote_date: new Date().toISOString(),
            daily_changes_count: lastVoteDate === today ? voteRecord.daily_changes_count + 1 : 1
        };

        await this.writeTable('promotion_votes', promotionVotes);
        return { success: true, message: '投票已更新' };
    }

    async getPromotionVotingStatus(promotionId) {
        const promotions = await this.readTable('promotions');
        const promotionVotes = await this.readTable('promotion_votes');
        
        const promotion = promotions.find(p => p.id === parseInt(promotionId));
        if (!promotion) {
            throw new Error('升遷申請不存在');
        }

        const votes = promotionVotes.filter(v => v.promotion_id === parseInt(promotionId));
        const agreeVotes = votes.filter(v => v.vote === 'agree').length;
        const totalVotes = votes.length;
        const currentApprovalRate = totalVotes > 0 ? agreeVotes / totalVotes : 0;

        return {
            promotion,
            votes,
            agreeVotes,
            totalVotes,
            currentApprovalRate,
            requiredRate: promotion.required_approval_rate,
            isApproved: currentApprovalRate >= promotion.required_approval_rate,
            votingEnded: new Date() > new Date(promotion.voting_end_date)
        };
    }

    async completePromotion(promotionId) {
        const status = await this.getPromotionVotingStatus(promotionId);
        const { promotion, isApproved, votingEnded } = status;

        if (!votingEnded) {
            throw new Error('投票期間尚未結束');
        }

        const promotions = await this.readTable('promotions');
        const promotionIndex = promotions.findIndex(p => p.id === parseInt(promotionId));
        
        if (promotionIndex === -1) {
            throw new Error('升遷申請不存在');
        }

        // 更新升遷狀態
        promotions[promotionIndex].status = isApproved ? 'approved' : 'failed';
        promotions[promotionIndex].completed_at = new Date().toISOString();

        if (isApproved) {
            // 升遷成功，更新員工職位
            const employees = await this.readTable('employees');
            const employeeIndex = employees.findIndex(emp => emp.id === promotion.employee_id);
            
            if (employeeIndex !== -1) {
                const nextDay = new Date();
                nextDay.setDate(nextDay.getDate() + 1);
                
                employees[employeeIndex].position = promotion.target_position_name;
                employees[employeeIndex].position_id = promotion.target_position_id;
                employees[employeeIndex].position_start_date = nextDay.toISOString().split('T')[0];
                
                await this.writeTable('employees', employees);
            }
        }

        await this.writeTable('promotions', promotions);

        return {
            success: isApproved,
            message: isApproved ? '升遷成功！' : '升遷失敗',
            finalApprovalRate: status.currentApprovalRate
        };
    }

    // ==================== 排班系統操作 ====================
    
    async getScheduleSettings() {
        const settings = await this.readTable('schedule_settings');
        return settings[0] || null;
    }

    async updateScheduleSettings(newSettings) {
        const settings = await this.readTable('schedule_settings');
        if (settings.length > 0) {
            settings[0] = {
                ...settings[0],
                ...newSettings,
                updated_at: new Date().toISOString()
            };
        } else {
            settings.push({
                id: 1,
                ...newSettings,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }
        await this.writeTable('schedule_settings', settings);
        return settings[0];
    }

    async canAccessScheduleSystem(employeeId) {
        const settings = await this.getScheduleSettings();
        if (!settings) {
            return { canAccess: false, reason: '排班設定不存在' };
        }

        const now = new Date();
        const openDateTime = new Date(`${settings.system_open_date}T${settings.system_open_time}:00`);
        const closeDateTime = new Date(`${settings.system_close_date}T${settings.system_close_time}:00`);

        // 檢查是否在開放時間內
        if (now < openDateTime) {
            const timeDiff = openDateTime - now;
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            return { 
                canAccess: false, 
                reason: `排班系統將於 ${daysLeft} 天後開啟`,
                openDate: openDateTime.toISOString()
            };
        }

        if (now > closeDateTime) {
            return { 
                canAccess: false, 
                reason: '排班系統已關閉',
                nextOpenDate: this.getNextScheduleOpenDate(settings)
            };
        }

        // 檢查是否有其他人正在使用
        if (settings.current_status === 'in_use' && settings.current_user !== employeeId) {
            const userEndTime = new Date(settings.current_end_time);
            if (now < userEndTime) {
                const employee = await this.getEmployeeById(settings.current_user);
                return { 
                    canAccess: false, 
                    reason: `${employee?.name || '其他員工'} 正在使用排班系統`,
                    endTime: userEndTime.toISOString()
                };
            }
        }

        // 檢查員工是否已經排過班
        const employeeSchedule = await this.getEmployeeSchedule(employeeId, settings.schedule_month);
        if (employeeSchedule && employeeSchedule.status === 'completed') {
            return { 
                canAccess: false, 
                reason: '您已完成本月排班' 
            };
        }

        return { canAccess: true, settings };
    }

    getNextScheduleOpenDate(settings) {
        // 計算下個月的開放日期
        const currentMonth = new Date(settings.schedule_month);
        const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        const nextOpenDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 16);
        return nextOpenDate.toISOString();
    }

    async enterScheduleSystem(employeeId) {
        const canAccessResult = await this.canAccessScheduleSystem(employeeId);
        if (!canAccessResult.canAccess) {
            throw new Error(canAccessResult.reason);
        }

        const settings = canAccessResult.settings;
        const now = new Date();
        const endTime = new Date(now.getTime() + settings.operation_time_minutes * 60 * 1000);

        // 更新系統狀態
        await this.updateScheduleSettings({
            current_status: 'in_use',
            current_user: employeeId,
            current_start_time: now.toISOString(),
            current_end_time: endTime.toISOString()
        });

        return {
            success: true,
            endTime: endTime.toISOString(),
            operationMinutes: settings.operation_time_minutes
        };
    }

    async exitScheduleSystem(employeeId) {
        const settings = await this.getScheduleSettings();
        if (settings && settings.current_user === employeeId) {
            await this.updateScheduleSettings({
                current_status: 'open',
                current_user: null,
                current_start_time: null,
                current_end_time: null
            });
            return { success: true };
        }
        return { success: false, reason: '無權限退出系統' };
    }

    async getEmployeeSchedule(employeeId, month) {
        const schedules = await this.readTable('schedules');
        return schedules.find(s => s.employee_id === employeeId && s.schedule_month === month);
    }

    async saveEmployeeSchedule(employeeId, scheduleData) {
        const settings = await this.getScheduleSettings();
        if (!settings || settings.current_user !== employeeId) {
            throw new Error('無權限保存排班');
        }

        // 驗證排班規則
        const validation = await this.validateSchedule(employeeId, scheduleData, settings);
        if (!validation.isValid) {
            throw new Error(validation.errors.join('\n'));
        }

        const schedules = await this.readTable('schedules');
        const existingIndex = schedules.findIndex(s => 
            s.employee_id === employeeId && 
            s.schedule_month === settings.schedule_month
        );

        const newSchedule = {
            id: existingIndex >= 0 ? schedules[existingIndex].id : Date.now(),
            employee_id: employeeId,
            employee_name: (await this.getEmployeeById(employeeId)).name,
            schedule_month: settings.schedule_month,
            leave_dates: scheduleData.leaveDates,
            total_leave_days: scheduleData.leaveDates.length,
            status: 'completed',
            created_at: existingIndex >= 0 ? schedules[existingIndex].created_at : new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            schedules[existingIndex] = newSchedule;
        } else {
            schedules.push(newSchedule);
        }

        await this.writeTable('schedules', schedules);

        // 完成排班後自動退出系統
        await this.exitScheduleSystem(employeeId);

        return { success: true, schedule: newSchedule };
    }

    async validateSchedule(employeeId, scheduleData, settings) {
        const errors = [];
        const { leaveDates } = scheduleData;

        // 1. 檢查總休假天數
        if (leaveDates.length > settings.max_leave_days_per_person) {
            errors.push(`休假天數超過限制，最多 ${settings.max_leave_days_per_person} 天`);
        }

        // 2. 檢查週末休假天數
        const weekendDays = leaveDates.filter(date => {
            const dayOfWeek = new Date(date).getDay();
            return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0; // 五六日
        });
        if (weekendDays.length > settings.max_weekend_leave_days) {
            errors.push(`週末休假天數超過限制，最多 ${settings.max_weekend_leave_days} 天`);
        }

        // 3. 檢查禁休日
        const employee = await this.getEmployeeById(employeeId);
        const storeId = employee.store_id.toString();
        const forbiddenDays = settings.store_forbidden_days[storeId] || [];
        const violatedForbiddenDays = leaveDates.filter(date => forbiddenDays.includes(date));
        if (violatedForbiddenDays.length > 0) {
            errors.push(`包含禁休日：${violatedForbiddenDays.join(', ')}`);
        }

        // 4. 檢查公休日（公休日會自動計入休假額度）
        const holidays = settings.store_holidays[storeId] || [];
        const holidayDays = leaveDates.filter(date => holidays.includes(date));
        if (holidayDays.length > 0) {
            // 公休日算在休假額度內，只是提醒
            errors.push(`包含公休日：${holidayDays.join(', ')}（計入休假額度）`);
        }

        // 5. 檢查每日休假人數限制
        const allSchedules = await this.readTable('schedules');
        const monthSchedules = allSchedules.filter(s => 
            s.schedule_month === settings.schedule_month && 
            s.employee_id !== employeeId
        );

        for (const date of leaveDates) {
            const sameDayLeaves = monthSchedules.filter(s => 
                s.leave_dates.includes(date)
            ).length;

            if (sameDayLeaves >= settings.max_leave_people_per_day) {
                errors.push(`${date} 休假人數已滿（${sameDayLeaves}/${settings.max_leave_people_per_day}）`);
            }

            // 檢查同分店每日休假限制
            const sameStoreLeaves = monthSchedules.filter(s => {
                const emp = this.getEmployeeById(s.employee_id);
                return emp && emp.store_id === employee.store_id && s.leave_dates.includes(date);
            }).length;

            if (sameStoreLeaves >= settings.max_same_store_leave_per_day) {
                errors.push(`${date} 同分店休假人數已滿`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async getMonthSchedules(month) {
        const schedules = await this.readTable('schedules');
        return schedules.filter(s => s.schedule_month === month);
    }

    async deleteEmployeeSchedule(employeeId, month) {
        const schedules = await this.readTable('schedules');
        const filteredSchedules = schedules.filter(s => 
            !(s.employee_id === employeeId && s.schedule_month === month)
        );
        await this.writeTable('schedules', filteredSchedules);
        return { success: true };
    }

    // 退出排班系統
    async exitScheduleSystem(employeeId) {
        const settings = await this.readTable('schedule_settings');
        if (settings.length === 0) return;
        
        settings[0].current_user_id = null;
        settings[0].session_start_time = null;
        
        await this.writeTable('schedule_settings', settings);
    }

    // 獲取用戶排班紀錄
    async getUserScheduleRecords(employeeId) {
        const schedules = await this.readTable('schedules');
        const userSchedules = schedules
            .filter(s => s.employee_id === employeeId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        return userSchedules.map(schedule => ({
            ...schedule,
            leave_dates: JSON.parse(schedule.leave_dates_json || '[]')
        }));
    }

    // 作廢排班紀錄
    async voidScheduleRecord(scheduleId, employeeId) {
        const schedules = await this.readTable('schedules');
        const schedule = schedules.find(s => s.id === scheduleId && s.employee_id === employeeId);
        
        if (!schedule) {
            throw new Error('找不到排班紀錄或無權限操作');
        }
        
        if (schedule.status === 'voided') {
            throw new Error('排班紀錄已經作廢');
        }
        
        schedule.status = 'voided';
        schedule.voided_at = new Date().toISOString();
        
        await this.writeTable('schedules', schedules);
        return { success: true };
    }

    // ==================== 營收系統 ====================

    async createRevenueRecord(data) {
        const revenues = await this.readTable('revenue');
        const stores = await this.readTable('stores');
        const employees = await this.readTable('employees');
        
        // 獲取分店和員工資訊
        const store = stores.find(s => s.id === data.store_id);
        const employee = employees.find(e => e.id === data.employee_id);
        
        const newRevenue = {
            id: revenues.length > 0 ? Math.max(...revenues.map(r => r.id)) + 1 : 1,
            date: data.date,
            store_id: data.store_id,
            store_name: store ? store.name : '未知分店',
            employee_id: data.employee_id,
            employee_name: employee ? employee.name : '未知員工',
            bonus_type: data.bonus_type,
            order_count: data.order_count,
            revenue_items: JSON.stringify(data.revenue_items),
            expense_items: JSON.stringify(data.expense_items),
            notes: data.notes,
            total_revenue: data.total_revenue,
            total_expense: data.total_expense,
            net_revenue: data.net_revenue,
            bonus_amount: data.bonus_amount,
            shortage_amount: data.shortage_amount,
            achievement_rate: data.achievement_rate,
            target: data.target,
            photos: JSON.stringify(data.photos),
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        revenues.push(newRevenue);
        await this.writeTable('revenue', revenues);
        
        return {
            id: newRevenue.id,
            message: '營收記錄創建成功'
        };
    }

    async getRevenueRecords(filters = {}) {
        const revenues = await this.readTable('revenue');
        
        let filteredRevenues = revenues.filter(r => r.status === 'active');
        
        // 按分店篩選
        if (filters.store_id) {
            filteredRevenues = filteredRevenues.filter(r => r.store_id === filters.store_id);
        }
        
        // 按日期篩選
        if (filters.date) {
            filteredRevenues = filteredRevenues.filter(r => r.date === filters.date);
        }
        
        // 排序：最新的在前
        filteredRevenues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // 分頁
        const offset = filters.offset || 0;
        const limit = filters.limit || 50;
        filteredRevenues = filteredRevenues.slice(offset, offset + limit);
        
        // 解析JSON字段
        return filteredRevenues.map(revenue => ({
            ...revenue,
            revenue_items: JSON.parse(revenue.revenue_items || '[]'),
            expense_items: JSON.parse(revenue.expense_items || '[]'),
            photos: JSON.parse(revenue.photos || '[]')
        }));
    }

    async voidRevenueRecord(recordId, employeeId, reason) {
        const revenues = await this.readTable('revenue');
        const revenue = revenues.find(r => r.id === recordId);
        
        if (!revenue) {
            throw new Error('找不到營收記錄');
        }
        
        if (revenue.status === 'voided') {
            throw new Error('記錄已經作廢');
        }
        
        // 更新記錄狀態
        revenue.status = 'voided';
        revenue.voided_by = employeeId;
        revenue.void_reason = reason;
        revenue.voided_at = new Date().toISOString();
        revenue.updated_at = new Date().toISOString();
        
        await this.writeTable('revenue', revenues);
        
        return {
            success: true,
            message: '營收記錄已作廢'
        };
    }

    async getRevenueStats(filters = {}) {
        const revenues = await this.readTable('revenue');
        const activeRevenues = revenues.filter(r => r.status === 'active');
        
        // 按條件篩選
        let filteredRevenues = activeRevenues;
        
        if (filters.store_id) {
            filteredRevenues = filteredRevenues.filter(r => r.store_id === filters.store_id);
        }
        
        if (filters.employee_id) {
            filteredRevenues = filteredRevenues.filter(r => r.employee_id === filters.employee_id);
        }
        
        // 按期間篩選
        const now = new Date();
        let startDate;
        
        switch (filters.period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        filteredRevenues = filteredRevenues.filter(r => new Date(r.date) >= startDate);
        
        // 計算統計
        const stats = {
            total_records: filteredRevenues.length,
            total_revenue: filteredRevenues.reduce((sum, r) => sum + (r.total_revenue || 0), 0),
            total_expense: filteredRevenues.reduce((sum, r) => sum + (r.total_expense || 0), 0),
            total_bonus: filteredRevenues.reduce((sum, r) => sum + (r.bonus_amount || 0), 0),
            achieved_records: filteredRevenues.filter(r => r.bonus_amount > 0).length,
            weekday_records: filteredRevenues.filter(r => r.bonus_type === 'weekday').length,
            holiday_records: filteredRevenues.filter(r => r.bonus_type === 'holiday').length,
            average_revenue: filteredRevenues.length > 0 ? 
                filteredRevenues.reduce((sum, r) => sum + (r.total_revenue || 0), 0) / filteredRevenues.length : 0,
            best_store: this.calculateBestStore(filteredRevenues),
            recent_records: filteredRevenues
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10)
                .map(r => ({
                    ...r,
                    revenue_items: JSON.parse(r.revenue_items || '[]'),
                    expense_items: JSON.parse(r.expense_items || '[]')
                }))
        };
        
        return stats;
    }

    calculateBestStore(revenues) {
        const storeStats = {};
        
        revenues.forEach(revenue => {
            if (!storeStats[revenue.store_name]) {
                storeStats[revenue.store_name] = {
                    name: revenue.store_name,
                    total_revenue: 0,
                    count: 0
                };
            }
            
            storeStats[revenue.store_name].total_revenue += revenue.total_revenue || 0;
            storeStats[revenue.store_name].count += 1;
        });
        
        let bestStore = null;
        let maxRevenue = 0;
        
        Object.values(storeStats).forEach(store => {
            if (store.total_revenue > maxRevenue) {
                maxRevenue = store.total_revenue;
                bestStore = store.name;
            }
        });
        
        return bestStore || '暫無數據';
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