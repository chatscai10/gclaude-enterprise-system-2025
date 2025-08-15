/**
 * 強制重建資料庫以確保schema正確
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'enterprise_system.db');

console.log('🗑️  刪除現有資料庫...');
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ 舊資料庫已刪除');
}

const db = new sqlite3.Database(dbPath);

console.log('🔧 建立新資料庫與表格...');

// 表格建立順序很重要，必須先建立被外鍵引用的表
const tables = [
    // 1. 部門表
    {
        name: 'departments',
        sql: `CREATE TABLE departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            manager_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    },
    
    // 2. 分店表
    {
        name: 'stores',
        sql: `CREATE TABLE stores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            name TEXT UNIQUE NOT NULL,
            address TEXT,
            phone TEXT,
            latitude REAL,
            longitude REAL,
            radius INTEGER DEFAULT 100,
            manager_id INTEGER,
            operating_hours TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    },
    
    // 3. 用戶表
    {
        name: 'users',
        sql: `CREATE TABLE users (
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
        )`
    },
    
    // 4. 商品表 (包含異常檢查欄位)
    {
        name: 'products',
        sql: `CREATE TABLE products (
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
            supplier_contact TEXT,
            delivery_threshold DECIMAL(10,2) DEFAULT 1000,
            frequent_order_days INTEGER DEFAULT 1,
            rare_order_days INTEGER DEFAULT 7,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    },
    
    // 5. 叫貨申請表 (包含store_id)
    {
        name: 'orders',
        sql: `CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            order_number TEXT UNIQUE NOT NULL,
            product_id INTEGER NOT NULL,
            store_id INTEGER,
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
            FOREIGN KEY (store_id) REFERENCES stores(id),
            FOREIGN KEY (requested_by) REFERENCES users(id),
            FOREIGN KEY (approved_by) REFERENCES users(id)
        )`
    },
    
    // 6. 其他必要表格
    {
        name: 'attendance',
        sql: `CREATE TABLE attendance (
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
        )`
    },
    
    {
        name: 'revenue',
        sql: `CREATE TABLE revenue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            record_date DATE NOT NULL,
            store_id INTEGER NOT NULL,
            bonus_type TEXT NOT NULL,
            order_count INTEGER DEFAULT 0,
            income_items TEXT,
            expense_items TEXT,
            total_income DECIMAL(15,2) DEFAULT 0,
            total_expense DECIMAL(15,2) DEFAULT 0,
            bonus_amount DECIMAL(15,2) DEFAULT 0,
            notes TEXT,
            recorded_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (recorded_by) REFERENCES users(id),
            FOREIGN KEY (store_id) REFERENCES stores(id)
        )`
    },
    
    {
        name: 'inventory_transactions',
        sql: `CREATE TABLE inventory_transactions (
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
        )`
    },
    
    {
        name: 'photos',
        sql: `CREATE TABLE photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            original_name TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            category TEXT NOT NULL,
            system_type TEXT NOT NULL,
            store_id INTEGER,
            upload_date DATE NOT NULL,
            is_deleted BOOLEAN DEFAULT 0,
            FOREIGN KEY (store_id) REFERENCES stores(id)
        )`
    },
    
    {
        name: 'system_logs',
        sql: `CREATE TABLE system_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            user_id INTEGER,
            action TEXT NOT NULL,
            target_type TEXT,
            target_id TEXT,
            details TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`
    }
];

async function createTablesSequentially() {
    for (const table of tables) {
        await new Promise((resolve, reject) => {
            db.run(table.sql, (err) => {
                if (err) {
                    console.error(`❌ 建立表格 ${table.name} 失敗:`, err.message);
                    reject(err);
                } else {
                    console.log(`✅ 表格 ${table.name} 建立完成`);
                    resolve();
                }
            });
        });
    }
}

async function insertBasicData() {
    const { v4: uuidv4 } = require('uuid');
    
    // 插入基本分店數據
    const stores = [
        { name: '內壢忠孝店', latitude: 24.9652, longitude: 121.2565, radius: 100000, address: '桃園市中壢區忠孝路123號' },
        { name: '桃園龍安店', latitude: 24.9935, longitude: 121.3010, radius: 100, address: '桃園市桃園區龍安街456號' },
        { name: '中壢龍崗店', latitude: 24.9530, longitude: 121.2237, radius: 100, address: '桃園市中壢區龍崗路789號' }
    ];
    
    for (const store of stores) {
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO stores (uuid, name, address, latitude, longitude, radius) VALUES (?, ?, ?, ?, ?, ?)',
                [uuidv4(), store.name, store.address, store.latitude, store.longitude, store.radius],
                (err) => {
                    if (err) {
                        console.error(`插入分店 ${store.name} 失敗:`, err.message);
                        reject(err);
                    } else {
                        console.log(`✅ 分店數據已插入: ${store.name}`);
                        resolve();
                    }
                }
            );
        });
    }
    
    // 插入測試品項(包含異常檢查參數)
    const products = [
        {
            code: 'TEST001',
            name: '測試雞排',
            category: '食材',
            unit: '包',
            current_stock: 50,
            min_stock: 10,
            unit_cost: 100,
            supplier: '測試供應商',
            frequent_order_days: 1,
            rare_order_days: 3,
            delivery_threshold: 1000
        },
        {
            code: 'TEST002', 
            name: '測試珍奶',
            category: '飲料',
            unit: '杯',
            current_stock: 30,
            min_stock: 5,
            unit_cost: 50,
            supplier: '飲料供應商',
            frequent_order_days: 2,
            rare_order_days: 7,
            delivery_threshold: 500
        }
    ];
    
    for (const product of products) {
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO products (uuid, code, name, category, unit, current_stock, min_stock, unit_cost, supplier, frequent_order_days, rare_order_days, delivery_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [uuidv4(), product.code, product.name, product.category, product.unit, product.current_stock, product.min_stock, product.unit_cost, product.supplier, product.frequent_order_days, product.rare_order_days, product.delivery_threshold],
                (err) => {
                    if (err) {
                        console.error(`插入商品 ${product.name} 失敗:`, err.message);
                        reject(err);
                    } else {
                        console.log(`✅ 商品數據已插入: ${product.name}`);
                        resolve();
                    }
                }
            );
        });
    }
}

async function main() {
    try {
        await createTablesSequentially();
        console.log('\n📝 插入基本測試數據...');
        await insertBasicData();
        console.log('\n🎉 資料庫重建完成！');
        
        // 驗證表結構
        db.all("PRAGMA table_info(products)", (err, columns) => {
            if (err) {
                console.error('檢查products表失敗:', err);
                return;
            }
            
            console.log('\n📋 Products表欄位驗證:');
            const hasFrequentDays = columns.some(col => col.name === 'frequent_order_days');
            const hasRareDays = columns.some(col => col.name === 'rare_order_days');
            const hasDeliveryThreshold = columns.some(col => col.name === 'delivery_threshold');
            
            console.log(`   frequent_order_days: ${hasFrequentDays ? '✅' : '❌'}`);
            console.log(`   rare_order_days: ${hasRareDays ? '✅' : '❌'}`);
            console.log(`   delivery_threshold: ${hasDeliveryThreshold ? '✅' : '❌'}`);
            
            db.all("PRAGMA table_info(orders)", (err, columns) => {
                if (err) {
                    console.error('檢查orders表失敗:', err);
                    return;
                }
                
                console.log('\n📋 Orders表欄位驗證:');
                const hasStoreId = columns.some(col => col.name === 'store_id');
                console.log(`   store_id: ${hasStoreId ? '✅' : '❌'}`);
                
                db.close();
                console.log('\n✅ 資料庫重建與驗證完成');
            });
        });
        
    } catch (error) {
        console.error('❌ 資料庫重建失敗:', error);
        db.close();
    }
}

main();