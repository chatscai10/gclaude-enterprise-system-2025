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
            schedule_settings: 'schedule_settings.json',
            income_items: 'income_items.json',
            expense_items: 'expense_items.json',
            revenue_params: 'revenue_params.json',
            item_anomaly_settings: 'item_anomaly_settings.json'
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
            
            // 初始化用戶資料 - 添加所有測試用戶
            await this.initializeTable('users', [
                // 管理員用戶
                {
                    id: 1,
                    username: 'admin',
                    password: 'admin123',
                    role: 'admin',
                    employee_id: 1,
                    store_id: 1,
                    employee_name: '系統管理員A',
                    store_name: '總公司',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    username: 'admin2',
                    password: 'admin123',
                    role: 'admin',
                    employee_id: 2,
                    store_id: 1,
                    employee_name: '系統管理員B',
                    store_name: '總公司',
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    username: 'admin3',
                    password: 'admin123',
                    role: 'admin',
                    employee_id: 3,
                    store_id: 1,
                    employee_name: '系統管理員C',
                    store_name: '總公司',
                    created_at: new Date().toISOString()
                },
                // 店長用戶
                {
                    id: 4,
                    username: 'manager',
                    password: 'manager123',
                    role: 'manager',
                    employee_id: 4,
                    store_id: 1,
                    employee_name: '店長A',
                    store_name: '總公司',
                    created_at: new Date().toISOString()
                },
                {
                    id: 5,
                    username: 'manager2',
                    password: 'manager123',
                    role: 'manager',
                    employee_id: 5,
                    store_id: 1,
                    employee_name: '店長B',
                    store_name: '總公司',
                    created_at: new Date().toISOString()
                },
                {
                    id: 6,
                    username: 'manager3',
                    password: 'manager123',
                    role: 'manager',
                    employee_id: 6,
                    store_id: 1,
                    employee_name: '店長C',
                    store_name: '總公司',
                    created_at: new Date().toISOString()
                },
                // 員工用戶
                {
                    id: 7,
                    username: 'employee',
                    password: 'employee123',
                    role: 'employee',
                    employee_id: 7,
                    store_id: 1,
                    employee_name: '員工A',
                    store_name: '總公司',
                    created_at: new Date().toISOString()
                },
                {
                    id: 8,
                    username: 'employee2',
                    password: 'employee123',
                    role: 'employee',
                    employee_id: 8,
                    store_id: 1,
                    employee_name: '員工B',
                    store_name: '總公司',
                    created_at: new Date().toISOString()
                },
                {
                    id: 9,
                    username: 'employee3',
                    password: 'employee123',
                    role: 'employee',
                    employee_id: 9,
                    store_id: 1,
                    employee_name: '員工C',
                    store_name: '總公司',
                    created_at: new Date().toISOString()
                },
                // 實習生用戶
                {
                    id: 10,
                    username: 'intern',
                    password: 'intern123',
                    role: 'intern',
                    employee_id: 10,
                    store_id: 1,
                    employee_name: '實習生A',
                    store_name: '總公司',
                    created_at: new Date().toISOString()
                },
                {
                    id: 11,
                    username: 'intern2',
                    password: 'intern123',
                    role: 'intern',
                    employee_id: 11,
                    store_id: 1,
                    employee_name: '實習生B',
                    store_name: '總公司',
                    created_at: new Date().toISOString()
                },
                {
                    id: 12,
                    username: 'intern3',
                    password: 'intern123',
                    role: 'intern',
                    employee_id: 12,
                    store_id: 1,
                    employee_name: '實習生C',
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

            // 初始化品項異常設定
            await this.initializeTable('item_anomaly_settings', [
                {
                    id: 1,
                    product_name: '牛肉',
                    min_days: 1,  // 少於1天重複叫貨算頻繁
                    max_days: 5,  // 超過5天沒叫貨算久未叫貨
                    store_id: 1,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    product_name: '豬肉',
                    min_days: 2,  // 少於2天重複叫貨算頻繁
                    max_days: 7,  // 超過7天沒叫貨算久未叫貨
                    store_id: 1,
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    product_name: '雞肉',
                    min_days: 1,  // 少於1天重複叫貨算頻繁
                    max_days: 4,  // 超過4天沒叫貨算久未叫貨
                    store_id: 1,
                    created_at: new Date().toISOString()
                },
                {
                    id: 4,
                    product_name: '魚肉',
                    min_days: 0,  // 當天重複叫貨算頻繁
                    max_days: 3,  // 超過3天沒叫貨算久未叫貨
                    store_id: 1,
                    created_at: new Date().toISOString()
                },
                {
                    id: 5,
                    product_name: '麵條',
                    min_days: 3,  // 少於3天重複叫貨算頻繁
                    max_days: 10, // 超過10天沒叫貨算久未叫貨
                    store_id: 1,
                    created_at: new Date().toISOString()
                },
                {
                    id: 6,
                    product_name: '米',
                    min_days: 5,  // 少於5天重複叫貨算頻繁
                    max_days: 15, // 超過15天沒叫貨算久未叫貨
                    store_id: 1,
                    created_at: new Date().toISOString()
                },
                {
                    id: 7,
                    product_name: '油',
                    min_days: 7,  // 少於7天重複叫貨算頻繁
                    max_days: 20, // 超過20天沒叫貨算久未叫貨
                    store_id: 1,
                    created_at: new Date().toISOString()
                }
            ]);

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

    async getEmployeeByIdCard(idCard) {
        const employees = await this.readTable('employees');
        return employees.find(emp => emp.id_card === idCard);
    }

    async getEmployeeByName(name) {
        const employees = await this.readTable('employees');
        return employees.find(emp => emp.name === name);
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

        // GPS距離驗證
        let distanceMeters = null;
        let isLocationValid = true;
        
        if (clockInData.latitude && clockInData.longitude) {
            // 取得分店GPS座標（這裡先用預設值，實際應從stores表取得）
            const storeCoords = await this.getStoreCoordinates(clockInData.store_id);
            if (storeCoords) {
                distanceMeters = this.calculateHaversineDistance(
                    clockInData.latitude, 
                    clockInData.longitude,
                    storeCoords.latitude, 
                    storeCoords.longitude
                );
                
                // 檢查距離是否在允許範圍內 (預設100公尺)
                const maxDistance = 100;
                isLocationValid = distanceMeters <= maxDistance;
                
                if (!isLocationValid) {
                    throw new Error(`打卡位置距離分店過遠 (${Math.round(distanceMeters)}公尺)，請到分店附近打卡`);
                }
            }
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
            distance_meters: distanceMeters,
            is_location_valid: isLocationValid,
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
        
        return { 
            id: newRecord.id, 
            distance_meters: distanceMeters,
            is_location_valid: isLocationValid
        };
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
        
        // 自動計算獎金（確保一致性）
        const bonusCalculation = this.calculateBonusAmount({
            total_revenue: data.total_revenue,
            total_expense: data.total_expense,
            date: data.date,
            created_at: new Date().toISOString()
        });

        const newRevenue = {
            id: revenues.length > 0 ? Math.max(...revenues.map(r => r.id)) + 1 : 1,
            date: data.date,
            store_id: data.store_id,
            store_name: store ? store.name : '未知分店',
            employee_id: data.employee_id,
            employee_name: employee ? employee.name : '未知員工',
            bonus_type: bonusCalculation.type, // 使用計算出的獎金類型
            order_count: data.order_count,
            revenue_items: JSON.stringify(data.revenue_items),
            expense_items: JSON.stringify(data.expense_items),
            notes: data.notes,
            total_revenue: data.total_revenue,
            total_expense: data.total_expense,
            net_revenue: data.total_revenue - data.total_expense, // 重新計算淨營收
            bonus_amount: bonusCalculation.amount, // 使用計算出的獎金
            bonus_reason: bonusCalculation.reason, // 新增獎金原因
            shortage_amount: data.shortage_amount,
            achievement_rate: data.achievement_rate,
            target: data.target,
            photos: JSON.stringify(data.photos),
            status: 'pending', // 新記錄預設為pending，需管理員審核
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
        
        // 狀態篩選（支援多種狀態）
        let filteredRevenues = revenues;
        if (filters.status) {
            filteredRevenues = filteredRevenues.filter(r => r.status === filters.status);
        } else {
            // 預設只返回active記錄，但管理員可以看到所有
            filteredRevenues = filteredRevenues.filter(r => ['active', 'pending'].includes(r.status));
        }
        
        // 按分店篩選
        if (filters.store_id) {
            filteredRevenues = filteredRevenues.filter(r => r.store_id === filters.store_id);
        }
        
        // 按員工篩選
        if (filters.employee_id) {
            filteredRevenues = filteredRevenues.filter(r => r.employee_id === filters.employee_id);
        }
        
        // 按日期篩選
        if (filters.date) {
            filteredRevenues = filteredRevenues.filter(r => r.date === filters.date);
        }
        
        // 按日期範圍篩選
        if (filters.date_from) {
            filteredRevenues = filteredRevenues.filter(r => r.date >= filters.date_from);
        }
        if (filters.date_to) {
            filteredRevenues = filteredRevenues.filter(r => r.date <= filters.date_to);
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
    
    async updateRevenueStatus(revenueId, action, reason, reviewerId) {
        const revenues = await this.readTable('revenue');
        const revenue = revenues.find(r => r.id === revenueId);
        
        if (!revenue) {
            throw new Error('找不到營收記錄');
        }
        
        // 更新狀態
        const newStatus = action === 'approve' ? 'active' : 'rejected';
        revenue.status = newStatus;
        revenue.reviewed_by = reviewerId;
        revenue.review_reason = reason;
        revenue.reviewed_at = new Date().toISOString();
        revenue.updated_at = new Date().toISOString();
        
        await this.writeTable('revenue', revenues);
        
        return {
            id: revenue.id,
            status: newStatus,
            employee_name: revenue.employee_name,
            total_revenue: revenue.total_revenue,
            bonus_amount: revenue.bonus_amount
        };
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
        // 包含pending和active記錄在統計中
        const validRevenues = revenues.filter(r => r.status === 'active' || r.status === 'pending');
        
        // 按條件篩選
        let filteredRevenues = validRevenues;
        
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
        
        // 重新計算所有記錄的獎金（確保邏輯一致）
        filteredRevenues = filteredRevenues.map(record => {
            const updatedRecord = { ...record };
            const bonus = this.calculateBonusAmount(record);
            updatedRecord.bonus_amount = bonus.amount;
            updatedRecord.bonus_type = bonus.type;
            updatedRecord.bonus_reason = bonus.reason;
            return updatedRecord;
        });
        
        // 按狀態分組統計
        const activeRecords = filteredRevenues.filter(r => r.status === 'active');
        const pendingRecords = filteredRevenues.filter(r => r.status === 'pending');
        
        // 計算統計
        const stats = {
            total_records: filteredRevenues.length,
            active_records: activeRecords.length,
            pending_records: pendingRecords.length,
            total_revenue: filteredRevenues.reduce((sum, r) => sum + (r.total_revenue || 0), 0),
            total_expense: filteredRevenues.reduce((sum, r) => sum + (r.total_expense || 0), 0),
            total_profit: filteredRevenues.reduce((sum, r) => sum + ((r.total_revenue || 0) - (r.total_expense || 0)), 0),
            total_bonus: filteredRevenues.reduce((sum, r) => sum + (r.bonus_amount || 0), 0),
            achieved_records: filteredRevenues.filter(r => r.bonus_amount > 0).length,
            weekday_records: filteredRevenues.filter(r => r.bonus_type === 'weekday').length,
            holiday_records: filteredRevenues.filter(r => r.bonus_type === 'holiday').length,
            perfect_records: filteredRevenues.filter(r => r.bonus_type === 'perfect').length,
            average_revenue: filteredRevenues.length > 0 ? 
                filteredRevenues.reduce((sum, r) => sum + (r.total_revenue || 0), 0) / filteredRevenues.length : 0,
            average_profit: filteredRevenues.length > 0 ? 
                filteredRevenues.reduce((sum, r) => sum + ((r.total_revenue || 0) - (r.total_expense || 0)), 0) / filteredRevenues.length : 0,
            best_store: this.calculateBestStore(filteredRevenues),
            status_breakdown: {
                active: {
                    count: activeRecords.length,
                    revenue: activeRecords.reduce((sum, r) => sum + (r.total_revenue || 0), 0),
                    bonus: activeRecords.reduce((sum, r) => sum + (r.bonus_amount || 0), 0)
                },
                pending: {
                    count: pendingRecords.length,
                    revenue: pendingRecords.reduce((sum, r) => sum + (r.total_revenue || 0), 0),
                    bonus: pendingRecords.reduce((sum, r) => sum + (r.bonus_amount || 0), 0)
                }
            },
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

    // ==================== 獎金計算邏輯 ====================
    
    calculateBonusAmount(revenueRecord) {
        // 根據系統邏輯.txt的正確獎金計算方式
        const revenueItems = revenueRecord.revenue_items ? 
            (typeof revenueRecord.revenue_items === 'string' ? 
                JSON.parse(revenueRecord.revenue_items) : revenueRecord.revenue_items) : [];
        
        const bonusType = revenueRecord.bonus_type || '平日獎金';
        
        // 計算調整後收入（扣除服務費）
        let adjustedIncome = 0;
        revenueItems.forEach(item => {
            const amount = item.amount || 0;
            const serviceFee = item.serviceFee || 0;
            
            if (item.name === '現場營業額' || serviceFee === 0) {
                // 現場營業額不扣服務費
                adjustedIncome += amount;
            } else {
                // 外送平台扣除服務費
                adjustedIncome += amount * ((100 - serviceFee) / 100);
            }
        });
        
        let bonusAmount = 0;
        let bonusReason = '';
        
        if (bonusType === '平日獎金') {
            // 平日獎金：現場+熊貓(35%服務費)+UBER(35%服務費) 大於13000的30%
            if (adjustedIncome > 13000) {
                bonusAmount = Math.round((adjustedIncome - 13000) * 0.30);
                bonusReason = `平日獎金計算: 調整後收入 $${adjustedIncome.toLocaleString()} 大於 $13,000，獎金 = ($${adjustedIncome.toLocaleString()} - $13,000) × 30% = $${bonusAmount.toLocaleString()}`;
            } else {
                const shortage = 13000 - adjustedIncome;
                bonusReason = `平日獎金未達標: 調整後收入 $${adjustedIncome.toLocaleString()}，差距 $${shortage.toLocaleString()} 達標`;
            }
        } else {
            // 假日獎金：項目總和大於等於0的38%
            if (adjustedIncome >= 0) {
                bonusAmount = Math.round(adjustedIncome * 0.38);
                bonusReason = `假日獎金計算: 調整後收入 $${adjustedIncome.toLocaleString()} × 38% = $${bonusAmount.toLocaleString()}`;
            } else {
                bonusReason = `假日獎金計算: 調整後收入為負數 $${adjustedIncome.toLocaleString()}`;
            }
        }
        
        return { 
            amount: bonusAmount,
            type: bonusType,
            reason: bonusReason,
            adjustedIncome: adjustedIncome
        };
    }
    
    isHolidayOrWeekend(date) {
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        
        // 週末判斷
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return true;
        }
        
        // 國定假日判斷（簡化版）
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // 常見假日
        const holidays = [
            '1-1',   // 元旦
            '2-28',  // 和平紀念日
            '4-4',   // 兒童節
            '4-5',   // 清明節
            '5-1',   // 勞動節
            '10-10', // 國慶日
            '12-25'  // 聖誕節
        ];
        
        const dateKey = `${month}-${day}`;
        return holidays.includes(dateKey);
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

    // ==================== 管理員設定相關方法 ====================
    
    async getAllEmployees() {
        const employees = await this.readTable('employees');
        const stores = await this.readTable('stores');
        
        // 合併員工和分店資料
        return employees.map(employee => {
            const store = stores.find(s => s.id === employee.store_id);
            return {
                ...employee,
                store_name: store ? store.name : '未知分店'
            };
        });
    }

    async saveStoreSettings(storesData) {
        try {
            // 驗證和清理資料
            const validStores = storesData.map((store, index) => ({
                id: store.id || (index + 1),
                name: store.name || '未命名分店',
                people: parseInt(store.people) || 2,
                open: store.open || '1500-0200',
                latitude: parseFloat(store.latitude) || 25.0330,
                longitude: parseFloat(store.longitude) || 121.5654,
                radius: parseInt(store.radius) || 100,
                address: store.address || '地址待設定',
                created_at: store.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            await this.writeTable('stores', validStores);
            return validStores;
        } catch (error) {
            console.error('儲存分店設定失敗:', error);
            throw error;
        }
    }

    async saveScheduleSettings(scheduleSettings) {
        try {
            const settings = {
                id: 1,
                max_leave: parseInt(scheduleSettings.maxLeave) || 8,
                max_daily_leave: parseInt(scheduleSettings.maxDailyLeave) || 2,
                max_weekend_leave: parseInt(scheduleSettings.maxWeekendLeave) || 3,
                schedule_time_limit: parseInt(scheduleSettings.scheduleTimeLimit) || 5,
                system_open_day: parseInt(scheduleSettings.systemOpenDay) || 16,
                system_close_day: parseInt(scheduleSettings.systemCloseDay) || 21,
                forbidden_dates: scheduleSettings.forbiddenDates || '{}',
                holiday_dates: scheduleSettings.holidayDates || '{}',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const existingSettings = await this.readTable('schedule_settings');
            let updatedSettings;
            
            if (existingSettings.length > 0) {
                // 更新現有設定
                updatedSettings = existingSettings.map(s => s.id === 1 ? settings : s);
            } else {
                // 新增設定
                updatedSettings = [settings];
            }

            await this.writeTable('schedule_settings', updatedSettings);
            return settings;
        } catch (error) {
            console.error('儲存排班設定失敗:', error);
            throw error;
        }
    }

    async savePositionSettings(positionsData) {
        try {
            const validPositions = positionsData.map((position, index) => ({
                id: position.id || (index + 1),
                level: position.level || '未命名職位',
                salary: parseInt(position.salary) || 25000,
                bonus_rate: parseFloat(position.bonusRate) || 0.5,
                quota: parseInt(position.quota) || 1,
                required_days: parseInt(position.requiredDays) || 30,
                cooldown_days: parseInt(position.cooldownDays) || 30,
                approval_rate: parseFloat(position.approvalRate) || 0.6,
                voting_days: parseInt(position.votingDays) || 5,
                late_limit: parseInt(position.lateLimit) || 120,
                punishment: position.punishment || '警告',
                notes: position.notes || '',
                created_at: position.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            await this.writeTable('positions', validPositions);
            return validPositions;
        } catch (error) {
            console.error('儲存職位設定失敗:', error);
            throw error;
        }
    }

    async saveProductSettings(productsData) {
        try {
            const validProducts = productsData.map((product, index) => ({
                id: product.id || (index + 1),
                category: product.category || '未分類',
                name: product.name || '未命名產品',
                supplier: product.supplier || '未知供應商',
                price: parseFloat(product.price) || 0,
                cost: parseFloat(product.cost) || 0,
                unit: product.unit || '個',
                anomaly_days: parseInt(product.anomalyDays) || 2,
                status: product.status || '上架',
                created_at: product.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            await this.writeTable('products', validProducts);
            return validProducts;
        } catch (error) {
            console.error('儲存產品設定失敗:', error);
            throw error;
        }
    }

    async saveSystemSettings(systemSettings) {
        try {
            const settings = {
                id: 1,
                telegram_bot_token: systemSettings.telegramBotToken || '',
                telegram_boss_group: systemSettings.telegramBossGroup || '',
                telegram_employee_group: systemSettings.telegramEmployeeGroup || '',
                backup_interval: parseInt(systemSettings.backupInterval) || 5,
                backup_email: systemSettings.backupEmail || '',
                backup_scope: systemSettings.backupScope || 'all',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // 可以保存到獨立的設定檔案或系統設定表
            // 這裡先保存到一個系統設定JSON檔案
            const settingsPath = path.join(this.dataDir, 'system_settings.json');
            await fs.writeFile(settingsPath, JSON.stringify([settings], null, 2), 'utf8');
            
            return settings;
        } catch (error) {
            console.error('儲存系統設定失敗:', error);
            throw error;
        }
    }

    async saveFinanceSettings(financeSettings) {
        try {
            // 處理收入項目
            const validIncomeItems = financeSettings.incomeItems.map((item, index) => ({
                id: item.id || (index + 1),
                name: item.name || '未命名收入項目',
                category: item.category || '銷售收入',
                status: item.status || '啟用',
                created_at: item.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            // 處理支出項目
            const validExpenseItems = financeSettings.expenseItems.map((item, index) => ({
                id: item.id || (index + 1),
                name: item.name || '未命名支出項目',
                category: item.category || '營運成本',
                status: item.status || '啟用',
                created_at: item.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            // 處理營收參數
            const revenueParams = {
                id: 1,
                weekday_target: parseFloat(financeSettings.revenueParams?.weekdayTarget) || 50000,
                holiday_target: parseFloat(financeSettings.revenueParams?.holidayTarget) || 80000,
                bonus_threshold: parseFloat(financeSettings.revenueParams?.bonusThreshold) || 90,
                base_bonus_amount: parseFloat(financeSettings.revenueParams?.baseBonusAmount) || 1000,
                weekday_bonus_rate: parseFloat(financeSettings.revenueParams?.weekdayBonusRate) || 2.0,
                holiday_bonus_rate: parseFloat(financeSettings.revenueParams?.holidayBonusRate) || 3.0,
                over_target_multiplier: parseFloat(financeSettings.revenueParams?.overTargetMultiplier) || 1.5,
                cost_deduction_rate: parseFloat(financeSettings.revenueParams?.costDeductionRate) || 70,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // 保存到對應的表格
            await Promise.all([
                this.writeTable('income_items', validIncomeItems),
                this.writeTable('expense_items', validExpenseItems),
                this.writeTable('revenue_params', [revenueParams])
            ]);

            return {
                incomeItems: validIncomeItems,
                expenseItems: validExpenseItems,
                revenueParams: revenueParams
            };
        } catch (error) {
            console.error('儲存財務設定失敗:', error);
            throw error;
        }
    }

    async getFinanceSettings() {
        try {
            const [incomeItems, expenseItems, revenueParams] = await Promise.all([
                this.readTable('income_items'),
                this.readTable('expense_items'),
                this.readTable('revenue_params')
            ]);

            return {
                incomeItems: incomeItems || [],
                expenseItems: expenseItems || [],
                revenueParams: revenueParams.length > 0 ? revenueParams[0] : {}
            };
        } catch (error) {
            console.error('獲取財務設定失敗:', error);
            throw error;
        }
    }

    // ==================== 管理員排班分配功能 ====================
    
    // 取得所有員工
    async getAllEmployees() {
        try {
            const employees = await this.readTable('employees');
            return employees.filter(emp => emp.status === 'active');
        } catch (error) {
            console.error('取得員工列表失敗:', error);
            throw error;
        }
    }

    // 取得所有分店
    async getAllStores() {
        try {
            const stores = await this.readTable('stores');
            return stores;
        } catch (error) {
            console.error('取得分店列表失敗:', error);
            throw error;
        }
    }

    // 取得指定分店的員工
    async getEmployeesByStore(storeId) {
        try {
            const employees = await this.readTable('employees');
            return employees.filter(emp => 
                emp.store_id === storeId && emp.status === 'active'
            );
        } catch (error) {
            console.error('取得分店員工失敗:', error);
            throw error;
        }
    }

    // 取得排班資料
    async getScheduleData(year, month, storeId) {
        try {
            const schedules = await this.readTable('schedules');
            const key = `${year}-${month}-${storeId}`;
            
            const schedule = schedules.find(s => 
                s.year === year && 
                s.month === month && 
                s.store_id === storeId
            );
            
            return schedule ? schedule.schedule_data : {};
        } catch (error) {
            console.error('取得排班資料失敗:', error);
            return {};
        }
    }

    // 儲存排班資料
    async saveScheduleData(scheduleInfo) {
        try {
            const schedules = await this.readTable('schedules');
            const { store_id, year, month, schedule_data, updated_by, updated_at } = scheduleInfo;
            
            // 查找現有記錄
            const existingIndex = schedules.findIndex(s => 
                s.year === year && 
                s.month === month && 
                s.store_id === store_id
            );
            
            const scheduleRecord = {
                id: existingIndex >= 0 ? schedules[existingIndex].id : this.generateId(),
                store_id,
                year,
                month,
                schedule_data,
                updated_by,
                updated_at,
                created_at: existingIndex >= 0 ? schedules[existingIndex].created_at : updated_at
            };
            
            if (existingIndex >= 0) {
                schedules[existingIndex] = scheduleRecord;
            } else {
                schedules.push(scheduleRecord);
            }
            
            await this.writeTable('schedules', schedules);
            return scheduleRecord;
        } catch (error) {
            console.error('儲存排班資料失敗:', error);
            throw error;
        }
    }

    // 智能排班分配算法
    async generateAutoSchedule({ store_id, year, month, employees, existing_schedule }) {
        try {
            const daysInMonth = new Date(year, month, 0).getDate();
            const autoSchedule = {};
            
            // 基本排班邏輯：輪流分配
            let employeeIndex = 0;
            const activeEmployees = employees.filter(emp => !emp.on_vacation);
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dayKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const dayOfWeek = new Date(year, month - 1, day).getDay();
                
                // 週末需要更多人手
                const requiredStaff = (dayOfWeek === 0 || dayOfWeek === 6) ? 
                    Math.min(3, activeEmployees.length) : 
                    Math.min(2, activeEmployees.length);
                
                autoSchedule[dayKey] = [];
                
                for (let i = 0; i < requiredStaff; i++) {
                    if (activeEmployees.length > 0) {
                        const employee = activeEmployees[employeeIndex % activeEmployees.length];
                        autoSchedule[dayKey].push({
                            employee_id: employee.id,
                            employee_name: employee.name
                        });
                        employeeIndex++;
                    }
                }
            }
            
            return autoSchedule;
        } catch (error) {
            console.error('智能排班分配失敗:', error);
            throw error;
        }
    }

    // ==================== GPS距離計算功能 ====================

    // Haversine距離計算公式
    calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // 地球半徑（公尺）
        const φ1 = lat1 * Math.PI/180; // φ, λ in radians
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        const distance = R * c; // 距離（公尺）
        return distance;
    }

    // 取得分店GPS座標
    async getStoreCoordinates(storeId) {
        try {
            const stores = await this.readTable('stores');
            const store = stores.find(s => s.id === storeId);
            
            if (store && store.latitude && store.longitude) {
                return {
                    latitude: store.latitude,
                    longitude: store.longitude
                };
            }
            
            // 如果分店沒有設定GPS座標，使用預設座標（台北市政府）
            return {
                latitude: 25.0378,
                longitude: 121.5645
            };
        } catch (error) {
            console.error('取得分店座標失敗:', error);
            // 返回預設座標
            return {
                latitude: 25.0378,
                longitude: 121.5645
            };
        }
    }

    // ==================== 排班系統時間控制功能 ====================

    // 獲取排班系統狀態
    async getScheduleSystemStatus() {
        try {
            const now = new Date();
            const currentDay = now.getDate();
            const currentHour = now.getHours();
            
            // 排班開放時間：每月16號02:00 - 21號02:00
            let isOpen = false;
            let statusText = '系統關閉';
            let nextOpenTime = '';
            let inUse = false;
            let currentUser = null;
            
            // 檢查時間範圍
            if (currentDay >= 16 && currentDay <= 21) {
                if (currentDay === 16 && currentHour >= 2) {
                    isOpen = true;
                } else if (currentDay > 16 && currentDay < 21) {
                    isOpen = true;
                } else if (currentDay === 21 && currentHour < 2) {
                    isOpen = true;
                }
            }
            
            if (isOpen) {
                statusText = '系統開放中';
                
                // 檢查是否有人正在使用
                const scheduleSettings = await this.readTable('schedule_settings');
                const currentSession = scheduleSettings.find(s => s.key === 'current_session');
                
                if (currentSession && currentSession.value) {
                    const session = JSON.parse(currentSession.value);
                    const sessionStart = new Date(session.start_time);
                    const fiveMinutesLater = new Date(sessionStart.getTime() + 5 * 60 * 1000);
                    
                    if (now < fiveMinutesLater) {
                        inUse = true;
                        currentUser = session.employee_name;
                        statusText = '系統使用中';
                    } else {
                        // 超時，清除session
                        await this.clearScheduleSession();
                    }
                }
                
                // 計算關閉時間
                const closeDate = new Date(now.getFullYear(), now.getMonth(), 21, 2, 0);
                if (now < closeDate) {
                    nextOpenTime = closeDate.toLocaleString('zh-TW');
                }
            } else {
                // 計算下次開放時間
                let nextOpen;
                if (currentDay < 16) {
                    nextOpen = new Date(now.getFullYear(), now.getMonth(), 16, 2, 0);
                } else {
                    nextOpen = new Date(now.getFullYear(), now.getMonth() + 1, 16, 2, 0);
                }
                nextOpenTime = nextOpen.toLocaleString('zh-TW');
            }
            
            return {
                is_open: isOpen,
                status: statusText,
                next_open_time: nextOpenTime,
                current_user: currentUser,
                in_use: inUse,
                remaining_time: inUse ? this.calculateRemainingTime(currentSession?.value) : 0
            };
        } catch (error) {
            console.error('獲取排班系統狀態失敗:', error);
            throw error;
        }
    }

    // 獲取員工排班記錄
    async getEmployeeSchedule(employeeId) {
        try {
            const schedules = await this.readTable('schedules');
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM格式
            
            const employeeSchedule = schedules.find(s => 
                s.employee_id === employeeId && 
                s.schedule_month === currentMonth
            );
            
            return employeeSchedule || null;
        } catch (error) {
            console.error('獲取員工排班記錄失敗:', error);
            throw error;
        }
    }

    // 清除排班session
    async clearScheduleSession() {
        try {
            const scheduleSettings = await this.readTable('schedule_settings');
            const index = scheduleSettings.findIndex(s => s.key === 'current_session');
            
            if (index >= 0) {
                scheduleSettings[index].value = null;
                scheduleSettings[index].updated_at = new Date().toISOString();
                await this.writeTable('schedule_settings', scheduleSettings);
            }
        } catch (error) {
            console.error('清除排班session失敗:', error);
            throw error;
        }
    }

    // 計算剩餘時間
    calculateRemainingTime(sessionValue) {
        if (!sessionValue) return 0;
        
        try {
            const session = JSON.parse(sessionValue);
            const sessionStart = new Date(session.start_time);
            const fiveMinutesLater = new Date(sessionStart.getTime() + 5 * 60 * 1000);
            const now = new Date();
            
            const remaining = Math.max(0, Math.floor((fiveMinutesLater - now) / 1000));
            return remaining;
        } catch (error) {
            return 0;
        }
    }

    // 提交排班請假日期
    async submitSchedule(employeeId, scheduleData) {
        try {
            const schedules = await this.readTable('schedules');
            const settings = await this.getScheduleSettings();
            const scheduleMonth = settings?.schedule_month || new Date().toISOString().slice(0, 7);
            
            // 檢查是否已存在排班記錄
            const existingIndex = schedules.findIndex(s => 
                s.employee_id === employeeId && 
                s.schedule_month === scheduleMonth
            );
            
            const scheduleRecord = {
                employee_id: employeeId,
                schedule_month: scheduleMonth,
                leave_dates: scheduleData.leaveDates || [],
                submitted_at: new Date().toISOString(),
                status: 'submitted'
            };
            
            if (existingIndex >= 0) {
                // 更新現有記錄
                schedules[existingIndex] = { ...schedules[existingIndex], ...scheduleRecord };
            } else {
                // 新增記錄
                scheduleRecord.id = schedules.length > 0 ? Math.max(...schedules.map(s => s.id || 0)) + 1 : 1;
                schedules.push(scheduleRecord);
            }
            
            await this.writeTable('schedules', schedules);
            
            return {
                id: scheduleRecord.id || existingIndex + 1,
                success: true,
                message: '排班提交成功'
            };
        } catch (error) {
            console.error('提交排班失敗:', error);
            throw error;
        }
    }

    // 獲取月營收統計
    async getRevenueByMonth(month) {
        try {
            // 確保revenue_records.json文件存在
            const path = require('path');
            const fs = require('fs').promises;
            const revenueFile = path.join(this.dataDir, 'revenue_records.json');
            
            let revenues = [];
            try {
                const data = await fs.readFile(revenueFile, 'utf-8');
                revenues = JSON.parse(data) || [];
            } catch (fileError) {
                // 文件不存在則返回空數組
                revenues = [];
            }
            
            const monthlyRevenues = revenues.filter(revenue => {
                return revenue.date && revenue.date.startsWith(month);
            });
            
            const summary = {
                month: month,
                total_revenue: monthlyRevenues.reduce((sum, r) => sum + (r.total_revenue || 0), 0),
                total_records: monthlyRevenues.length,
                records: monthlyRevenues.slice(0, 10) // 最近10筆記錄
            };
            
            return summary;
        } catch (error) {
            console.error('獲取月營收統計失敗:', error);
            throw error;
        }
    }

    // ==================== 品項異常設定相關方法 ====================
    
    // 獲取品項異常設定
    async getItemAnomalySettings(storeId = null) {
        try {
            const settings = await this.readTable('item_anomaly_settings');
            if (storeId) {
                return settings.filter(s => s.store_id === storeId);
            }
            return settings;
        } catch (error) {
            console.error('獲取品項異常設定失敗:', error);
            return [];
        }
    }
    
    // 獲取特定品項的異常設定
    async getItemAnomalySetting(productName, storeId) {
        try {
            const settings = await this.readTable('item_anomaly_settings');
            const setting = settings.find(s => 
                s.product_name === productName && s.store_id === storeId
            );
            
            // 如果沒有設定，返回預設值
            if (!setting) {
                return {
                    product_name: productName,
                    min_days: 1,  // 預設：少於1天算頻繁
                    max_days: 7,  // 預設：超過7天算久未叫貨
                    store_id: storeId
                };
            }
            
            return setting;
        } catch (error) {
            console.error('獲取品項異常設定失敗:', error);
            // 返回預設設定
            return {
                product_name: productName,
                min_days: 1,
                max_days: 7,
                store_id: storeId
            };
        }
    }
    
    // 更新品項異常設定
    async updateItemAnomalySetting(productName, storeId, minDays, maxDays) {
        try {
            const settings = await this.readTable('item_anomaly_settings');
            const existingIndex = settings.findIndex(s => 
                s.product_name === productName && s.store_id === storeId
            );
            
            const settingData = {
                product_name: productName,
                min_days: minDays,
                max_days: maxDays,
                store_id: storeId,
                updated_at: new Date().toISOString()
            };
            
            if (existingIndex >= 0) {
                // 更新現有設定
                settings[existingIndex] = { ...settings[existingIndex], ...settingData };
            } else {
                // 新增設定
                settingData.id = Date.now();
                settingData.created_at = new Date().toISOString();
                settings.push(settingData);
            }
            
            await this.writeTable('item_anomaly_settings', settings);
            return settingData;
        } catch (error) {
            console.error('更新品項異常設定失敗:', error);
            throw error;
        }
    }
    
    // 刪除品項異常設定
    async deleteItemAnomalySetting(productName, storeId) {
        try {
            const settings = await this.readTable('item_anomaly_settings');
            const filteredSettings = settings.filter(s => 
                !(s.product_name === productName && s.store_id === storeId)
            );
            
            await this.writeTable('item_anomaly_settings', filteredSettings);
            return true;
        } catch (error) {
            console.error('刪除品項異常設定失敗:', error);
            throw error;
        }
    }

    close() {
        console.log('JSON資料庫連接已關閉');
    }
}

module.exports = JsonDatabase;