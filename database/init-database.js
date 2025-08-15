/**
 * 🗄️ GClaude Enterprise System - 完整資料庫初始化
 * 根據系統邏輯文檔建立所有必要的資料表
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 確保資料庫目錄存在
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(__dirname, 'gclaude_enterprise.db');

class DatabaseInitializer {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
    }

    async initializeDatabase() {
        console.log('🚀 開始初始化 GClaude Enterprise 資料庫...');
        
        try {
            // 啟用外鍵約束
            await this.runQuery('PRAGMA foreign_keys = ON');
            
            // 創建所有資料表
            await this.createUsersTable();
            await this.createEmployeesTable();
            await this.createStoresTable();
            await this.createAttendanceTable();
            await this.createSchedulesTable();
            await this.createRevenueTable();
            await this.createExpensesTable();
            await this.createProductsTable();
            await this.createOrdersTable();
            await this.createInventoryTable();
            await this.createMaintenanceTable();
            await this.createPhotosTable();
            await this.createVotingTable();
            await this.createLeaveRequestsTable();
            await this.createSystemSettingsTable();
            await this.createNotificationLogsTable();
            
            // 插入初始數據
            await this.insertInitialData();
            
            console.log('✅ 資料庫初始化完成！');
            
        } catch (error) {
            console.error('❌ 資料庫初始化失敗:', error);
            throw error;
        }
    }

    // 將 callback 風格的 db.run 轉換為 Promise
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

    // 用戶認證表
    async createUsersTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'employee',
                employee_id INTEGER,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id)
            )
        `;
        await this.runQuery(sql);
        console.log('📋 users 表創建完成');
    }

    // 員工資料表
    async createEmployeesTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                id_card TEXT UNIQUE NOT NULL,
                birth_date DATE NOT NULL,
                gender TEXT NOT NULL,
                has_license BOOLEAN DEFAULT 0,
                phone TEXT NOT NULL,
                address TEXT NOT NULL,
                emergency_contact TEXT NOT NULL,
                emergency_relationship TEXT NOT NULL,
                emergency_phone TEXT NOT NULL,
                join_date DATE NOT NULL,
                store_id INTEGER DEFAULT 1,
                position TEXT DEFAULT '實習生',
                line_user_id TEXT,
                status TEXT DEFAULT '審核中',
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (store_id) REFERENCES stores(id)
            )
        `;
        await this.runQuery(sql);
        console.log('👥 employees 表創建完成');
    }

    // 分店資料表
    async createStoresTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS stores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                min_staff INTEGER DEFAULT 2,
                open_hours TEXT NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                radius INTEGER DEFAULT 100,
                address TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await this.runQuery(sql);
        console.log('🏪 stores 表創建完成');
    }

    // 出勤記錄表
    async createAttendanceTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                store_id INTEGER NOT NULL,
                date DATE NOT NULL,
                clock_in DATETIME,
                clock_out DATETIME,
                break_start DATETIME,
                break_end DATETIME,
                work_hours DECIMAL(4, 2),
                overtime_hours DECIMAL(4, 2) DEFAULT 0,
                location_in TEXT,
                location_out TEXT,
                status TEXT DEFAULT 'normal',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id),
                FOREIGN KEY (store_id) REFERENCES stores(id)
            )
        `;
        await this.runQuery(sql);
        console.log('⏰ attendance 表創建完成');
    }

    // 排班表
    async createSchedulesTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                store_id INTEGER NOT NULL,
                schedule_date DATE NOT NULL,
                shift_type TEXT NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                is_holiday BOOLEAN DEFAULT 0,
                status TEXT DEFAULT 'scheduled',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id),
                FOREIGN KEY (store_id) REFERENCES stores(id)
            )
        `;
        await this.runQuery(sql);
        console.log('📅 schedules 表創建完成');
    }

    // 營收記錄表
    async createRevenueTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS revenue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                store_id INTEGER NOT NULL,
                category TEXT NOT NULL,
                item TEXT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                service_fee DECIMAL(4, 3) DEFAULT 0,
                include_in_bonus BOOLEAN DEFAULT 1,
                customer_name TEXT,
                receipt_photo TEXT,
                notes TEXT,
                revenue_date DATE NOT NULL,
                status TEXT DEFAULT 'pending',
                verified_by INTEGER,
                verified_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id),
                FOREIGN KEY (store_id) REFERENCES stores(id),
                FOREIGN KEY (verified_by) REFERENCES employees(id)
            )
        `;
        await this.runQuery(sql);
        console.log('💰 revenue 表創建完成');
    }

    // 支出記錄表
    async createExpensesTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                store_id INTEGER NOT NULL,
                category TEXT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                description TEXT NOT NULL,
                receipt_photo TEXT,
                expense_date DATE NOT NULL,
                status TEXT DEFAULT 'pending',
                approved_by INTEGER,
                approved_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id),
                FOREIGN KEY (store_id) REFERENCES stores(id),
                FOREIGN KEY (approved_by) REFERENCES employees(id)
            )
        `;
        await this.runQuery(sql);
        console.log('💸 expenses 表創建完成');
    }

    // 商品資料表
    async createProductsTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                unit TEXT NOT NULL,
                supplier_price DECIMAL(10, 2) NOT NULL,
                supplier_contact TEXT,
                delivery_threshold DECIMAL(10, 2) DEFAULT 1000,
                frequent_order_days INTEGER DEFAULT 1,
                rare_order_days INTEGER DEFAULT 7,
                current_stock INTEGER DEFAULT 0,
                safe_stock INTEGER DEFAULT 10,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await this.runQuery(sql);
        console.log('📦 products 表創建完成');
    }

    // 訂貨記錄表
    async createOrdersTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                store_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                order_date DATE NOT NULL,
                delivery_date DATE,
                status TEXT DEFAULT 'pending',
                notes TEXT,
                approved_by INTEGER,
                approved_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id),
                FOREIGN KEY (store_id) REFERENCES stores(id),
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (approved_by) REFERENCES employees(id)
            )
        `;
        await this.runQuery(sql);
        console.log('🛒 orders 表創建完成');
    }

    // 庫存異動記錄表
    async createInventoryTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS inventory_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                before_stock INTEGER NOT NULL,
                after_stock INTEGER NOT NULL,
                reference_id INTEGER,
                reference_type TEXT,
                operated_by INTEGER,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (operated_by) REFERENCES employees(id)
            )
        `;
        await this.runQuery(sql);
        console.log('📊 inventory_logs 表創建完成');
    }

    // 維修申請表
    async createMaintenanceTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS maintenance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                store_id INTEGER NOT NULL,
                equipment_type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                location TEXT NOT NULL,
                contact_phone TEXT NOT NULL,
                priority TEXT NOT NULL DEFAULT 'medium',
                photos TEXT,
                status TEXT DEFAULT 'pending',
                assigned_to INTEGER,
                assigned_at DATETIME,
                completed_at DATETIME,
                cost DECIMAL(10, 2),
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id),
                FOREIGN KEY (store_id) REFERENCES stores(id),
                FOREIGN KEY (assigned_to) REFERENCES employees(id)
            )
        `;
        await this.runQuery(sql);
        console.log('🔧 maintenance 表創建完成');
    }

    // 照片管理表
    async createPhotosTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT UNIQUE NOT NULL,
                original_name TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                category TEXT NOT NULL,
                system_type TEXT NOT NULL,
                store_id INTEGER,
                employee_id INTEGER,
                upload_date DATE NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                is_deleted BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (store_id) REFERENCES stores(id),
                FOREIGN KEY (employee_id) REFERENCES employees(id)
            )
        `;
        await this.runQuery(sql);
        console.log('📸 photos 表創建完成');
    }

    // 投票系統表
    async createVotingTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS voting (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                candidates TEXT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                min_tenure_months INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES employees(id)
            )
        `;
        await this.runQuery(sql);

        const votesSql = `
            CREATE TABLE IF NOT EXISTS votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                voting_id INTEGER NOT NULL,
                employee_id INTEGER NOT NULL,
                candidate TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (voting_id) REFERENCES voting(id),
                FOREIGN KEY (employee_id) REFERENCES employees(id),
                UNIQUE(voting_id, employee_id)
            )
        `;
        await this.runQuery(votesSql);
        console.log('🗳️ voting 和 votes 表創建完成');
    }

    // 請假申請表
    async createLeaveRequestsTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS leave_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                leave_type TEXT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                days DECIMAL(3, 1) NOT NULL,
                reason TEXT NOT NULL,
                substitute_id INTEGER,
                status TEXT DEFAULT 'pending',
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                approved_by INTEGER,
                approved_at DATETIME,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id),
                FOREIGN KEY (substitute_id) REFERENCES employees(id),
                FOREIGN KEY (approved_by) REFERENCES employees(id)
            )
        `;
        await this.runQuery(sql);
        console.log('🏖️ leave_requests 表創建完成');
    }

    // 系統設定表
    async createSystemSettingsTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS system_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(category, key)
            )
        `;
        await this.runQuery(sql);
        console.log('⚙️ system_settings 表創建完成');
    }

    // 通知記錄表
    async createNotificationLogsTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS notification_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                platform TEXT NOT NULL,
                recipient TEXT NOT NULL,
                title TEXT,
                message TEXT NOT NULL,
                status TEXT DEFAULT 'sent',
                response_data TEXT,
                sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await this.runQuery(sql);
        console.log('📢 notification_logs 表創建完成');
    }

    // 插入初始數據
    async insertInitialData() {
        console.log('📋 開始插入初始數據...');

        // 插入分店數據
        const storesData = [
            {
                name: '內壢 忠孝店',
                min_staff: 2,
                open_hours: '1500-0200',
                latitude: 24.9748412,
                longitude: 121.2556713,
                radius: 100000,
                address: '桃園市中壢區忠孝路93-1號'
            },
            {
                name: '桃園 龍安店',
                min_staff: 2,
                open_hours: '1500-0200',
                latitude: 24.9880023,
                longitude: 121.2812737,
                radius: 100,
                address: '桃園市桃園區龍安街38-8號'
            },
            {
                name: '中壢 龍崗店',
                min_staff: 2,
                open_hours: '1500-0200',
                latitude: 24.9298502,
                longitude: 121.2529472,
                radius: 100,
                address: '桃園市中壢區龍東路190號正對面'
            }
        ];

        for (const store of storesData) {
            await this.runQuery(`
                INSERT OR IGNORE INTO stores (name, min_staff, open_hours, latitude, longitude, radius, address)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [store.name, store.min_staff, store.open_hours, store.latitude, store.longitude, store.radius, store.address]);
        }

        // 插入系統管理員
        await this.runQuery(`
            INSERT OR IGNORE INTO employees (name, id_card, birth_date, gender, phone, address, emergency_contact, emergency_relationship, emergency_phone, join_date, position, status)
            VALUES ('系統管理員', 'A123456789', '1990-01-01', '男', '0912345678', '系統地址', '系統聯絡人', '系統', '0987654321', '2024-01-01', '管理員', '在職')
        `);

        // 插入管理員帳號
        await this.runQuery(`
            INSERT OR IGNORE INTO users (username, password, role, employee_id)
            VALUES ('admin', 'admin123', 'admin', 1)
        `);

        // 插入示範員工
        await this.runQuery(`
            INSERT OR IGNORE INTO employees (name, id_card, birth_date, gender, phone, address, emergency_contact, emergency_relationship, emergency_phone, join_date, position, status)
            VALUES ('示範員工', 'B123456789', '1995-05-05', '女', '0923456789', '員工地址', '員工聯絡人', '家人', '0987654321', '2024-06-01', '員工', '在職')
        `);

        // 插入員工帳號
        await this.runQuery(`
            INSERT OR IGNORE INTO users (username, password, role, employee_id)
            VALUES ('employee', 'emp123', 'employee', 2)
        `);

        // 插入示範商品
        const products = [
            { code: 'P001', name: 'A級產品套組', category: '主力產品', unit: '組', supplier_price: 15000, current_stock: 156, safe_stock: 50 },
            { code: 'P002', name: 'B級服務包', category: '服務', unit: '包', supplier_price: 8000, current_stock: 12, safe_stock: 20 },
            { code: 'P003', name: '維護工具', category: '工具', unit: '個', supplier_price: 2500, current_stock: 0, safe_stock: 10 }
        ];

        for (const product of products) {
            await this.runQuery(`
                INSERT OR IGNORE INTO products (code, name, category, unit, supplier_price, current_stock, safe_stock)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [product.code, product.name, product.category, product.unit, product.supplier_price, product.current_stock, product.safe_stock]);
        }

        // 插入系統設定
        const settings = [
            { category: 'telegram', key: 'bot_token', value: process.env.TELEGRAM_BOT_TOKEN || '', description: 'Telegram Bot API Token' },
            { category: 'telegram', key: 'boss_group_id', value: process.env.TELEGRAM_GROUP_ID || '', description: 'Telegram 老闆群組 Chat ID' },
            { category: 'telegram', key: 'employee_group_id', value: process.env.TELEGRAM_GROUP_ID || '', description: 'Telegram 員工群組 Chat ID' },
            { category: 'schedule', key: 'max_leave_days', value: '8', description: '每人休假上限天數' },
            { category: 'schedule', key: 'max_daily_leave', value: '2', description: '每日休假總上限人數' },
            { category: 'schedule', key: 'max_weekend_leave', value: '3', description: '週末休假上限天數' }
        ];

        for (const setting of settings) {
            await this.runQuery(`
                INSERT OR IGNORE INTO system_settings (category, key, value, description)
                VALUES (?, ?, ?, ?)
            `, [setting.category, setting.key, setting.value, setting.description]);
        }

        console.log('✅ 初始數據插入完成');
    }

    close() {
        this.db.close();
    }
}

// 導出類和初始化函數
module.exports = { DatabaseInitializer, dbPath };

// 如果直接執行此文件，則初始化資料庫
if (require.main === module) {
    const init = new DatabaseInitializer();
    init.initializeDatabase()
        .then(() => {
            console.log('🎉 資料庫初始化完成！');
            init.close();
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 資料庫初始化失敗:', error);
            init.close();
            process.exit(1);
        });
}