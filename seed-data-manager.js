/**
 * 種子數據管理器
 * 確保數據庫有完整的測試數據
 */

const database = require('./database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class SeedDataManager {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // 數據庫已經自動初始化，直接設置標記
            this.isInitialized = true;
            console.log('✅ 數據庫連接已建立');
        } catch (error) {
            console.error('❌ 數據庫連接失敗:', error);
            throw error;
        }
    }

    async checkExistingData() {
        console.log('🔍 檢查現有數據...');
        
        const tables = ['users', 'stores', 'departments', 'products', 'attendance', 'revenue'];
        const counts = {};
        
        for (const table of tables) {
            try {
                const result = await database.query(`SELECT COUNT(*) as count FROM ${table}`);
                counts[table] = result[0].count;
                console.log(`  ${table}: ${counts[table]} 條記錄`);
            } catch (error) {
                console.log(`  ${table}: 表格不存在或錯誤`);
                counts[table] = 0;
            }
        }
        
        return counts;
    }

    async seedUsers() {
        console.log('👥 創建用戶數據...');
        
        const users = [
            {
                uuid: uuidv4(),
                username: 'admin',
                password: await bcrypt.hash('admin123', 10),
                name: '系統管理員',
                role: 'admin',
                email: 'admin@gclaude.com',
                phone: '0912-345-678',
                department_id: 1,
                hire_date: '2023-01-01',
                salary: 80000
            },
            {
                uuid: uuidv4(),
                username: 'manager',
                password: await bcrypt.hash('manager123', 10),
                name: '王店長',
                role: 'manager',
                email: 'manager@gclaude.com',
                phone: '0923-456-789',
                department_id: 1,
                hire_date: '2023-02-01',
                salary: 60000
            },
            {
                uuid: uuidv4(),
                username: 'employee',
                password: await bcrypt.hash('employee123', 10),
                name: '張員工',
                role: 'employee',
                email: 'employee@gclaude.com',
                phone: '0934-567-890',
                department_id: 2,
                hire_date: '2023-03-01',
                salary: 45000
            },
            {
                uuid: uuidv4(),
                username: 'intern',
                password: await bcrypt.hash('intern123', 10),
                name: '李實習生',
                role: 'intern',
                email: 'intern@gclaude.com',
                phone: '0945-678-901',
                department_id: 2,
                hire_date: '2023-07-01',
                salary: 30000
            }
        ];

        for (const user of users) {
            try {
                await database.run(`
                    INSERT OR REPLACE INTO users (
                        uuid, username, password, name, role, email, phone,
                        department_id, hire_date, salary, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `, [
                    user.uuid, user.username, user.password, user.name,
                    user.role, user.email, user.phone, user.department_id,
                    user.hire_date, user.salary
                ]);
                console.log(`  ✅ 創建用戶: ${user.name}`);
            } catch (error) {
                console.log(`  ❌ 創建用戶失敗: ${user.name} - ${error.message}`);
            }
        }
    }

    async seedStores() {
        console.log('🏪 創建分店數據...');
        
        const stores = [
            {
                name: '內壢忠孝店',
                latitude: 24.9735,
                longitude: 121.2593,
                address: '桃園市中壢區忠孝路123號'
            },
            {
                name: '桃園龍安店',
                latitude: 24.9939,
                longitude: 121.3008,
                address: '桃園市桃園區龍安街456號'
            },
            {
                name: '中壢龍崗店',
                latitude: 24.9561,
                longitude: 121.2248,
                address: '桃園市中壢區龍崗路789號'
            }
        ];

        for (const store of stores) {
            try {
                await database.run(`
                    INSERT OR REPLACE INTO stores (name, latitude, longitude, address)
                    VALUES (?, ?, ?, ?)
                `, [store.name, store.latitude, store.longitude, store.address]);
                console.log(`  ✅ 創建分店: ${store.name}`);
            } catch (error) {
                console.log(`  ❌ 創建分店失敗: ${store.name} - ${error.message}`);
            }
        }
    }

    async seedDepartments() {
        console.log('🏢 創建部門數據...');
        
        const departments = [
            { name: '管理部', description: '負責整體營運管理' },
            { name: '營運部', description: '負責日常營運業務' },
            { name: '財務部', description: '負責財務會計' },
            { name: '人事部', description: '負責人力資源管理' }
        ];

        for (const dept of departments) {
            try {
                await database.run(`
                    INSERT OR REPLACE INTO departments (name, description)
                    VALUES (?, ?)
                `, [dept.name, dept.description]);
                console.log(`  ✅ 創建部門: ${dept.name}`);
            } catch (error) {
                console.log(`  ❌ 創建部門失敗: ${dept.name} - ${error.message}`);
            }
        }
    }

    async seedProducts() {
        console.log('📦 創建商品數據...');
        
        const products = [
            {
                uuid: uuidv4(),
                name: '香雞排',
                category: '主食',
                current_stock: 50,
                min_stock: 10,
                unit_price: 65,
                supplier: '食材供應商A'
            },
            {
                uuid: uuidv4(),
                name: '鹽酥雞',
                category: '主食',
                current_stock: 35,
                min_stock: 8,
                unit_price: 70,
                supplier: '食材供應商A'
            },
            {
                uuid: uuidv4(),
                name: '奶茶',
                category: '飲料',
                current_stock: 120,
                min_stock: 20,
                unit_price: 45,
                supplier: '飲料供應商B'
            },
            {
                uuid: uuidv4(),
                name: '紅茶',
                category: '飲料',
                current_stock: 80,
                min_stock: 15,
                unit_price: 35,
                supplier: '飲料供應商B'
            }
        ];

        for (const product of products) {
            try {
                await database.run(`
                    INSERT OR REPLACE INTO products (
                        uuid, name, category, current_stock, min_stock,
                        unit_price, supplier, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                `, [
                    product.uuid, product.name, product.category,
                    product.current_stock, product.min_stock,
                    product.unit_price, product.supplier
                ]);
                console.log(`  ✅ 創建商品: ${product.name}`);
            } catch (error) {
                console.log(`  ❌ 創建商品失敗: ${product.name} - ${error.message}`);
            }
        }
    }

    async seedSampleData() {
        console.log('📊 創建範例出勤和營收數據...');
        
        // 範例出勤記錄
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const attendanceRecords = [
            {
                uuid: uuidv4(),
                user_id: 2, // 王店長
                work_date: today,
                check_in_time: `${today}T08:00:00.000Z`,
                check_in_location: '桃園龍安店',
                check_in_gps_lat: 24.9939,
                check_in_gps_lng: 121.3008
            },
            {
                uuid: uuidv4(),
                user_id: 3, // 張員工
                work_date: yesterday,
                check_in_time: `${yesterday}T08:30:00.000Z`,
                check_out_time: `${yesterday}T17:30:00.000Z`,
                check_in_location: '中壢龍崗店',
                check_out_location: '中壢龍崗店',
                check_in_gps_lat: 24.9561,
                check_in_gps_lng: 121.2248,
                check_out_gps_lat: 24.9561,
                check_out_gps_lng: 121.2248,
                work_hours: 9.0,
                overtime_hours: 1.0
            }
        ];

        for (const record of attendanceRecords) {
            try {
                await database.run(`
                    INSERT OR REPLACE INTO attendance (
                        uuid, user_id, work_date, check_in_time, check_out_time,
                        check_in_location, check_out_location,
                        check_in_gps_lat, check_in_gps_lng,
                        check_out_gps_lat, check_out_gps_lng,
                        work_hours, overtime_hours
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    record.uuid, record.user_id, record.work_date,
                    record.check_in_time, record.check_out_time || null,
                    record.check_in_location, record.check_out_location || null,
                    record.check_in_gps_lat, record.check_in_gps_lng,
                    record.check_out_gps_lat || null, record.check_out_gps_lng || null,
                    record.work_hours || null, record.overtime_hours || null
                ]);
                console.log(`  ✅ 創建出勤記錄: ${record.work_date}`);
            } catch (error) {
                console.log(`  ❌ 創建出勤記錄失敗: ${error.message}`);
            }
        }

        // 範例營收記錄
        const revenueRecords = [
            {
                uuid: uuidv4(),
                record_date: yesterday,
                store_id: 1,
                bonus_type: '平日獎金',
                order_count: 85,
                income_items: JSON.stringify({
                    on_site_sales: 120000,
                    panda_orders: 35000,
                    uber_orders: 15000,
                    oil_recycling: 500
                }),
                expense_items: JSON.stringify({
                    gas: 8000,
                    utilities: 4500,
                    supplies: 12000,
                    cleaning: 2000
                }),
                total_income: 170500,
                total_expense: 26500,
                bonus_amount: 15600,
                notes: '營業狀況良好',
                recorded_by: 2
            }
        ];

        for (const record of revenueRecords) {
            try {
                await database.run(`
                    INSERT OR REPLACE INTO revenue (
                        uuid, record_date, store_id, bonus_type, order_count,
                        income_items, expense_items, total_income, total_expense,
                        bonus_amount, notes, recorded_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `, [
                    record.uuid, record.record_date, record.store_id,
                    record.bonus_type, record.order_count, record.income_items,
                    record.expense_items, record.total_income, record.total_expense,
                    record.bonus_amount, record.notes, record.recorded_by
                ]);
                console.log(`  ✅ 創建營收記錄: ${record.record_date}`);
            } catch (error) {
                console.log(`  ❌ 創建營收記錄失敗: ${error.message}`);
            }
        }
    }

    async seedAll() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log('🌱 開始創建種子數據...\n');

        const existingCounts = await this.checkExistingData();
        
        await this.seedDepartments();
        await this.seedStores();
        await this.seedUsers();
        await this.seedProducts();
        await this.seedSampleData();

        console.log('\n✅ 種子數據創建完成！');
        
        const newCounts = await this.checkExistingData();
        
        console.log('\n📊 數據統計:');
        Object.keys(newCounts).forEach(table => {
            const before = existingCounts[table] || 0;
            const after = newCounts[table] || 0;
            const added = after - before;
            console.log(`  ${table}: ${before} → ${after} (+${added})`);
        });
    }

    async verifyData() {
        console.log('\n🔍 驗證數據完整性...');
        
        // 驗證用戶登入
        const users = await database.query('SELECT username, role FROM users WHERE is_active = 1');
        console.log(`  活躍用戶: ${users.length} 人`);
        users.forEach(user => {
            console.log(`    - ${user.username} (${user.role})`);
        });

        // 驗證分店
        const stores = await database.query('SELECT name FROM stores');
        console.log(`  分店: ${stores.length} 個`);
        stores.forEach(store => {
            console.log(`    - ${store.name}`);
        });

        // 驗證商品
        const products = await database.query('SELECT name, current_stock FROM products WHERE is_active = 1');
        console.log(`  商品: ${products.length} 項`);
        products.forEach(product => {
            console.log(`    - ${product.name} (庫存: ${product.current_stock})`);
        });

        console.log('\n✅ 數據驗證完成！');
    }
}

if (require.main === module) {
    const seedManager = new SeedDataManager();
    seedManager.seedAll()
        .then(() => seedManager.verifyData())
        .catch(console.error);
}

module.exports = SeedDataManager;