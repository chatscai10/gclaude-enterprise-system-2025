/**
 * GClaude Enterprise System - 真實資料庫連接
 * SQLite 資料庫實現，包含完整的數據模型和測試數據
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class DatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'enterprise.db');
        this.db = null;
        this.initializeDatabase();
    }

    // 初始化資料庫
    async initializeDatabase() {
        // 確保資料夾存在
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // 連接資料庫
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('❌ 資料庫連接失敗:', err.message);
            } else {
                console.log('✅ SQLite資料庫連接成功');
                this.createTables();
            }
        });
    }

    // 建立所有資料表
    createTables() {
        const tables = [
            // 用戶表
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                birth_date DATE,
                gender TEXT,
                address TEXT,
                hire_date DATE,
                salary INTEGER,
                department_id INTEGER,
                emergency_contact_name TEXT,
                emergency_contact_relation TEXT,
                emergency_contact_phone TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (department_id) REFERENCES departments(id)
            )`,

            // 部門表
            `CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                manager_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (manager_id) REFERENCES users(id)
            )`,

            // 出勤記錄表
            `CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                check_in_time DATETIME,
                check_out_time DATETIME,
                work_date DATE NOT NULL,
                check_in_location TEXT,
                check_out_location TEXT,
                check_in_gps_lat REAL,
                check_in_gps_lng REAL,
                check_out_gps_lat REAL,
                check_out_gps_lng REAL,
                work_hours REAL,
                overtime_hours REAL DEFAULT 0,
                status TEXT DEFAULT 'normal',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            // 營收記錄表
            `CREATE TABLE IF NOT EXISTS revenue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                record_date DATE NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                payment_method TEXT NOT NULL,
                category TEXT,
                description TEXT,
                recorded_by INTEGER NOT NULL,
                receipt_number TEXT,
                customer_count INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (recorded_by) REFERENCES users(id)
            )`,

            // 庫存商品表
            `CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                category TEXT,
                description TEXT,
                unit TEXT DEFAULT '個',
                current_stock INTEGER DEFAULT 0,
                min_stock INTEGER DEFAULT 10,
                max_stock INTEGER DEFAULT 1000,
                unit_cost DECIMAL(10,2),
                selling_price DECIMAL(10,2),
                supplier TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // 庫存異動記錄表
            `CREATE TABLE IF NOT EXISTS inventory_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                product_id INTEGER NOT NULL,
                transaction_type TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                reason TEXT,
                reference_no TEXT,
                performed_by INTEGER NOT NULL,
                transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (performed_by) REFERENCES users(id)
            )`,

            // 叫貨申請表
            `CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                order_number TEXT UNIQUE NOT NULL,
                product_id INTEGER NOT NULL,
                requested_quantity INTEGER NOT NULL,
                approved_quantity INTEGER,
                unit_cost DECIMAL(10,2),
                total_cost DECIMAL(15,2),
                status TEXT DEFAULT 'pending',
                urgency TEXT DEFAULT 'normal',
                reason TEXT,
                requested_by INTEGER NOT NULL,
                approved_by INTEGER,
                requested_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                approved_date DATETIME,
                delivery_date DATETIME,
                supplier TEXT,
                notes TEXT,
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (requested_by) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )`,

            // 排程表
            `CREATE TABLE IF NOT EXISTS schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                schedule_date DATE NOT NULL,
                shift_type TEXT NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                position TEXT,
                status TEXT DEFAULT 'scheduled',
                created_by INTEGER NOT NULL,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // 升遷投票表
            `CREATE TABLE IF NOT EXISTS promotion_votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                candidate_id INTEGER NOT NULL,
                voter_id INTEGER NOT NULL,
                vote_session_id TEXT NOT NULL,
                vote_value INTEGER NOT NULL,
                vote_reason TEXT,
                vote_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_anonymous BOOLEAN DEFAULT 1,
                vote_hash TEXT,
                FOREIGN KEY (candidate_id) REFERENCES users(id),
                FOREIGN KEY (voter_id) REFERENCES users(id)
            )`,

            // 升遷投票會話表
            `CREATE TABLE IF NOT EXISTS promotion_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                session_id TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                candidate_id INTEGER NOT NULL,
                target_position TEXT NOT NULL,
                description TEXT,
                created_by INTEGER NOT NULL,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                status TEXT DEFAULT 'active',
                total_votes INTEGER DEFAULT 0,
                average_score DECIMAL(3,2) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (candidate_id) REFERENCES users(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // 維修申請表
            `CREATE TABLE IF NOT EXISTS maintenance_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                request_number TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                location TEXT NOT NULL,
                urgency TEXT NOT NULL,
                category TEXT,
                requested_by INTEGER NOT NULL,
                assigned_to INTEGER,
                status TEXT DEFAULT 'pending',
                estimated_cost DECIMAL(10,2),
                actual_cost DECIMAL(10,2),
                estimated_completion DATETIME,
                actual_completion DATETIME,
                photos TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (requested_by) REFERENCES users(id),
                FOREIGN KEY (assigned_to) REFERENCES users(id)
            )`,

            // 系統設定表
            `CREATE TABLE IF NOT EXISTS system_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                description TEXT,
                category TEXT DEFAULT 'general',
                updated_by INTEGER,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (updated_by) REFERENCES users(id)
            )`,

            // 系統日誌表
            `CREATE TABLE IF NOT EXISTS system_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                user_id INTEGER,
                action TEXT NOT NULL,
                target_type TEXT,
                target_id TEXT,
                ip_address TEXT,
                user_agent TEXT,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`
        ];

        // 執行所有建表語句
        tables.forEach((sql, index) => {
            this.db.run(sql, (err) => {
                if (err) {
                    console.error(`❌ 建立表格 ${index + 1} 失敗:`, err.message);
                } else {
                    console.log(`✅ 表格 ${index + 1} 建立完成`);
                }
            });
        });

        // 建表完成後，插入測試數據
        setTimeout(() => {
            this.insertTestData();
        }, 2000);
    }

    // 插入測試數據
    async insertTestData() {
        console.log('📝 開始插入測試數據...');

        try {
            // 插入部門數據
            await this.insertDepartments();
            
            // 插入用戶數據
            await this.insertUsers();
            
            // 插入商品數據
            await this.insertProducts();
            
            // 插入出勤記錄
            await this.insertAttendanceRecords();
            
            // 插入營收記錄
            await this.insertRevenueRecords();
            
            // 插入庫存異動
            await this.insertInventoryTransactions();
            
            // 插入排程記錄
            await this.insertSchedules();
            
            // 插入維修申請
            await this.insertMaintenanceRequests();
            
            // 插入升遷投票會話
            await this.insertPromotionSessions();
            
            // 插入系統設定
            await this.insertSystemSettings();
            
            console.log('✅ 測試數據插入完成！');
            
        } catch (error) {
            console.error('❌ 測試數據插入失敗:', error);
        }
    }

    // 插入部門數據
    insertDepartments() {
        const departments = [
            { uuid: uuidv4(), name: '管理部', description: '公司管理與行政事務' },
            { uuid: uuidv4(), name: '營運部', description: '日常營運與業務管理' },
            { uuid: uuidv4(), name: '服務部', description: '客戶服務與支援' },
            { uuid: uuidv4(), name: '技術部', description: '技術支援與系統維護' }
        ];

        const sql = `INSERT OR IGNORE INTO departments (uuid, name, description) VALUES (?, ?, ?)`;
        
        departments.forEach(dept => {
            this.db.run(sql, [dept.uuid, dept.name, dept.description], (err) => {
                if (err) {
                    console.error('插入部門數據失敗:', err.message);
                }
            });
        });
    }

    // 插入用戶數據
    async insertUsers() {
        const users = [
            {
                uuid: uuidv4(),
                username: 'admin',
                password: await bcrypt.hash('admin123', 10),
                name: '系統管理員',
                role: 'admin',
                email: 'admin@gclaude.com',
                phone: '02-12345678',
                birth_date: '1980-01-01',
                gender: '男',
                address: '台北市信義區松智路1號',
                hire_date: '2020-01-01',
                salary: 80000,
                department_id: 1
            },
            {
                uuid: uuidv4(),
                username: 'manager',
                password: await bcrypt.hash('manager123', 10),
                name: '王店長',
                role: 'manager',
                email: 'manager@gclaude.com',
                phone: '02-87654321',
                birth_date: '1985-05-15',
                gender: '男',
                address: '台北市大安區仁愛路二段',
                hire_date: '2021-03-01',
                salary: 65000,
                department_id: 2,
                emergency_contact_name: '王太太',
                emergency_contact_relation: '配偶',
                emergency_contact_phone: '0912345678'
            },
            {
                uuid: uuidv4(),
                username: 'employee',
                password: await bcrypt.hash('employee123', 10),
                name: '張員工',
                role: 'employee',
                email: 'employee@gclaude.com',
                phone: '02-11223344',
                birth_date: '1990-08-20',
                gender: '女',
                address: '台北市中山區南京東路三段',
                hire_date: '2022-06-15',
                salary: 45000,
                department_id: 3,
                emergency_contact_name: '張媽媽',
                emergency_contact_relation: '母親',
                emergency_contact_phone: '0987654321'
            },
            {
                uuid: uuidv4(),
                username: 'intern',
                password: await bcrypt.hash('intern123', 10),
                name: '李實習生',
                role: 'intern',
                email: 'intern@gclaude.com',
                phone: '02-99887766',
                birth_date: '2000-12-10',
                gender: '男',
                address: '台北市文山區指南路二段',
                hire_date: '2025-07-01',
                salary: 28000,
                department_id: 4,
                emergency_contact_name: '李爸爸',
                emergency_contact_relation: '父親',
                emergency_contact_phone: '0911222333'
            }
        ];

        const sql = `INSERT OR IGNORE INTO users (uuid, username, password, name, role, email, phone, birth_date, gender, address, hire_date, salary, department_id, emergency_contact_name, emergency_contact_relation, emergency_contact_phone) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        for (const user of users) {
            await new Promise((resolve, reject) => {
                this.db.run(sql, [
                    user.uuid, user.username, user.password, user.name, user.role,
                    user.email, user.phone, user.birth_date, user.gender, user.address,
                    user.hire_date, user.salary, user.department_id,
                    user.emergency_contact_name, user.emergency_contact_relation, user.emergency_contact_phone
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    }

    // 插入商品數據
    insertProducts() {
        const products = [
            { uuid: uuidv4(), code: 'P001', name: '紙巾包', category: '清潔用品', current_stock: 150, min_stock: 20, unit_cost: 25.5, selling_price: 35.0, supplier: '清潔用品供應商' },
            { uuid: uuidv4(), code: 'P002', name: '垃圾袋', category: '清潔用品', current_stock: 80, min_stock: 15, unit_cost: 45.0, selling_price: 65.0, supplier: '清潔用品供應商' },
            { uuid: uuidv4(), code: 'P003', name: '洗手液', category: '個人護理', current_stock: 45, min_stock: 10, unit_cost: 120.0, selling_price: 180.0, supplier: '個護產品供應商' },
            { uuid: uuidv4(), code: 'P004', name: '辦公紙', category: '辦公用品', current_stock: 200, min_stock: 30, unit_cost: 15.5, selling_price: 25.0, supplier: '辦公用品供應商' },
            { uuid: uuidv4(), code: 'P005', name: '原子筆', category: '辦公用品', current_stock: 120, min_stock: 25, unit_cost: 8.5, selling_price: 15.0, supplier: '辦公用品供應商' }
        ];

        const sql = `INSERT OR IGNORE INTO products (uuid, code, name, category, current_stock, min_stock, unit_cost, selling_price, supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        products.forEach(product => {
            this.db.run(sql, [product.uuid, product.code, product.name, product.category, product.current_stock, product.min_stock, product.unit_cost, product.selling_price, product.supplier], (err) => {
                if (err) {
                    console.error('插入商品數據失敗:', err.message);
                }
            });
        });
    }

    // 插入出勤記錄
    insertAttendanceRecords() {
        const records = [];
        const now = new Date();
        
        // 生成過去30天的出勤記錄
        for (let i = 30; i >= 1; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // 跳過周末
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            
            // 為每個用戶生成記錄
            for (let userId = 1; userId <= 4; userId++) {
                const checkIn = new Date(date);
                checkIn.setHours(9, Math.floor(Math.random() * 30), 0); // 9:00-9:30間打卡
                
                const checkOut = new Date(date);
                checkOut.setHours(18, Math.floor(Math.random() * 60), 0); // 18:00-19:00間打卡
                
                const workHours = (checkOut - checkIn) / (1000 * 60 * 60);
                
                records.push({
                    uuid: uuidv4(),
                    user_id: userId,
                    check_in_time: checkIn.toISOString(),
                    check_out_time: checkOut.toISOString(),
                    work_date: date.toISOString().split('T')[0],
                    check_in_location: '台北市信義區松智路1號',
                    check_out_location: '台北市信義區松智路1號',
                    check_in_gps_lat: 25.0330 + (Math.random() - 0.5) * 0.001,
                    check_in_gps_lng: 121.5654 + (Math.random() - 0.5) * 0.001,
                    work_hours: workHours,
                    overtime_hours: Math.max(0, workHours - 8),
                    status: Math.random() > 0.9 ? 'late' : 'normal'
                });
            }
        }

        const sql = `INSERT OR IGNORE INTO attendance (uuid, user_id, check_in_time, check_out_time, work_date, check_in_location, check_out_location, check_in_gps_lat, check_in_gps_lng, work_hours, overtime_hours, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        records.forEach(record => {
            this.db.run(sql, [
                record.uuid, record.user_id, record.check_in_time, record.check_out_time, 
                record.work_date, record.check_in_location, record.check_out_location,
                record.check_in_gps_lat, record.check_in_gps_lng, record.work_hours, record.overtime_hours, record.status
            ], (err) => {
                if (err) {
                    console.error('插入出勤記錄失敗:', err.message);
                }
            });
        });
    }

    // 插入營收記錄
    insertRevenueRecords() {
        const records = [];
        const now = new Date();
        const paymentMethods = ['現金', '信用卡', '轉帳', 'LINE Pay', '街口支付'];
        const categories = ['餐飲', '零售', '服務', '其他'];
        
        // 生成過去30天的營收記錄
        for (let i = 30; i >= 1; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // 每天生成3-8筆營收記錄
            const dailyRecords = Math.floor(Math.random() * 6) + 3;
            
            for (let j = 0; j < dailyRecords; j++) {
                records.push({
                    uuid: uuidv4(),
                    record_date: date.toISOString().split('T')[0],
                    amount: (Math.random() * 5000 + 100).toFixed(2),
                    payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                    category: categories[Math.floor(Math.random() * categories.length)],
                    description: `交易記錄 ${date.getMonth() + 1}/${date.getDate()} #${j + 1}`,
                    recorded_by: Math.floor(Math.random() * 2) + 1, // admin or manager
                    receipt_number: `R${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${(j + 1).toString().padStart(3, '0')}`,
                    customer_count: Math.floor(Math.random() * 4) + 1
                });
            }
        }

        const sql = `INSERT OR IGNORE INTO revenue (uuid, record_date, amount, payment_method, category, description, recorded_by, receipt_number, customer_count) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        records.forEach(record => {
            this.db.run(sql, [
                record.uuid, record.record_date, record.amount, record.payment_method,
                record.category, record.description, record.recorded_by, record.receipt_number, record.customer_count
            ], (err) => {
                if (err) {
                    console.error('插入營收記錄失敗:', err.message);
                }
            });
        });
    }

    // 插入庫存異動記錄
    insertInventoryTransactions() {
        const transactions = [
            { uuid: uuidv4(), product_id: 1, transaction_type: 'in', quantity: 50, reason: '進貨補充', performed_by: 1, reference_no: 'PO2025001' },
            { uuid: uuidv4(), product_id: 2, transaction_type: 'out', quantity: 20, reason: '日常使用', performed_by: 2, reference_no: 'OUT2025001' },
            { uuid: uuidv4(), product_id: 3, transaction_type: 'in', quantity: 30, reason: '緊急補貨', performed_by: 1, reference_no: 'PO2025002' },
            { uuid: uuidv4(), product_id: 4, transaction_type: 'out', quantity: 15, reason: '辦公室使用', performed_by: 3, reference_no: 'OUT2025002' },
            { uuid: uuidv4(), product_id: 5, transaction_type: 'adjustment', quantity: -5, reason: '盤點調整', performed_by: 1, reference_no: 'ADJ2025001' }
        ];

        const sql = `INSERT OR IGNORE INTO inventory_transactions (uuid, product_id, transaction_type, quantity, reason, performed_by, reference_no) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        transactions.forEach(tx => {
            this.db.run(sql, [tx.uuid, tx.product_id, tx.transaction_type, tx.quantity, tx.reason, tx.performed_by, tx.reference_no], (err) => {
                if (err) {
                    console.error('插入庫存異動記錄失敗:', err.message);
                }
            });
        });
    }

    // 插入排程記錄
    insertSchedules() {
        const schedules = [];
        const now = new Date();
        const shifts = [
            { type: '早班', start: '09:00', end: '17:00' },
            { type: '晚班', start: '13:00', end: '21:00' },
            { type: '全日', start: '09:00', end: '18:00' }
        ];
        
        // 生成未來14天的排程
        for (let i = 1; i <= 14; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() + i);
            
            // 跳過周末
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            
            // 為每個用戶安排班次
            for (let userId = 1; userId <= 4; userId++) {
                const shift = shifts[Math.floor(Math.random() * shifts.length)];
                schedules.push({
                    uuid: uuidv4(),
                    user_id: userId,
                    schedule_date: date.toISOString().split('T')[0],
                    shift_type: shift.type,
                    start_time: shift.start,
                    end_time: shift.end,
                    position: userId <= 2 ? '管理職' : '服務人員',
                    created_by: 1
                });
            }
        }

        const sql = `INSERT OR IGNORE INTO schedules (uuid, user_id, schedule_date, shift_type, start_time, end_time, position, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        schedules.forEach(schedule => {
            this.db.run(sql, [schedule.uuid, schedule.user_id, schedule.schedule_date, schedule.shift_type, schedule.start_time, schedule.end_time, schedule.position, schedule.created_by], (err) => {
                if (err) {
                    console.error('插入排程記錄失敗:', err.message);
                }
            });
        });
    }

    // 插入維修申請
    insertMaintenanceRequests() {
        const requests = [
            {
                uuid: uuidv4(),
                request_number: 'MR-20250813-001',
                title: '收銀機故障',
                description: '收銀機無法正常啟動，螢幕出現錯誤訊息',
                location: '一樓收銀台',
                urgency: '緊急',
                category: '設備維修',
                requested_by: 3,
                status: '處理中',
                estimated_cost: 3000,
                estimated_completion: new Date(Date.now() + 8*60*60*1000).toISOString()
            },
            {
                uuid: uuidv4(),
                request_number: 'MR-20250812-002',
                title: '空調系統檢修',
                description: '辦公室空調溫度控制異常，需要專業檢修',
                location: '二樓辦公室',
                urgency: '中等',
                category: '空調維修',
                requested_by: 2,
                status: '待處理',
                estimated_cost: 5000,
                estimated_completion: new Date(Date.now() + 3*24*60*60*1000).toISOString()
            },
            {
                uuid: uuidv4(),
                request_number: 'MR-20250811-003',
                title: '門鎖更換',
                description: '員工入口門鎖老化，需要更換新的電子門鎖',
                location: '員工入口',
                urgency: '一般',
                category: '設施維修',
                requested_by: 4,
                status: '已完成',
                estimated_cost: 8000,
                actual_cost: 7500,
                actual_completion: new Date(Date.now() - 24*60*60*1000).toISOString()
            }
        ];

        const sql = `INSERT OR IGNORE INTO maintenance_requests (uuid, request_number, title, description, location, urgency, category, requested_by, status, estimated_cost, actual_cost, estimated_completion, actual_completion) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        requests.forEach(req => {
            this.db.run(sql, [req.uuid, req.request_number, req.title, req.description, req.location, req.urgency, req.category, req.requested_by, req.status, req.estimated_cost, req.actual_cost, req.estimated_completion, req.actual_completion], (err) => {
                if (err) {
                    console.error('插入維修申請失敗:', err.message);
                }
            });
        });
    }

    // 插入升遷投票會話
    insertPromotionSessions() {
        const sessions = [
            {
                uuid: uuidv4(),
                session_id: `VOTE-${Date.now()}-001`,
                title: '張員工升任組長投票',
                candidate_id: 3,
                target_position: '服務組組長',
                description: '張員工工作表現優異，具備組長職責能力，現開放升遷投票',
                created_by: 2,
                start_date: new Date(Date.now() - 3*24*60*60*1000).toISOString(),
                end_date: new Date(Date.now() + 4*24*60*60*1000).toISOString(),
                status: 'active'
            }
        ];

        const sql = `INSERT OR IGNORE INTO promotion_sessions (uuid, session_id, title, candidate_id, target_position, description, created_by, start_date, end_date, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        sessions.forEach(session => {
            this.db.run(sql, [session.uuid, session.session_id, session.title, session.candidate_id, session.target_position, session.description, session.created_by, session.start_date, session.end_date, session.status], (err) => {
                if (err) {
                    console.error('插入升遷會話失敗:', err.message);
                }
            });
        });
    }

    // 插入系統設定
    insertSystemSettings() {
        const settings = [
            { key: 'system_name', value: 'GClaude 企業管理系統', description: '系統名稱', category: 'general' },
            { key: 'company_name', value: 'GClaude Enterprise', description: '公司名稱', category: 'general' },
            { key: 'working_hours_start', value: '09:00', description: '工作開始時間', category: 'attendance' },
            { key: 'working_hours_end', value: '18:00', description: '工作結束時間', category: 'attendance' },
            { key: 'gps_range_meters', value: '50', description: 'GPS打卡範圍(公尺)', category: 'attendance' },
            { key: 'overtime_rate', value: '1.5', description: '加班費倍率', category: 'payroll' },
            { key: 'notification_telegram_enabled', value: 'true', description: '啟用Telegram通知', category: 'notification' },
            { key: 'notification_telegram_token', value: '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc', description: 'Telegram Bot Token', category: 'notification' },
            { key: 'notification_telegram_chat_id', value: '-1002658082392', description: 'Telegram 群組ID', category: 'notification' }
        ];

        const sql = `INSERT OR IGNORE INTO system_settings (key, value, description, category, updated_by) VALUES (?, ?, ?, ?, ?)`;
        
        settings.forEach(setting => {
            this.db.run(sql, [setting.key, setting.value, setting.description, setting.category, 1], (err) => {
                if (err) {
                    console.error('插入系統設定失敗:', err.message);
                }
            });
        });
    }

    // 通用查詢方法
    query(sql, params = []) {
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

    // 通用執行方法
    run(sql, params = []) {
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

    // 關閉數據庫連接
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ 資料庫連接已關閉');
                    resolve();
                }
            });
        });
    }
}

// 創建數據庫實例
const database = new DatabaseManager();

module.exports = database;