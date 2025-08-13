/**
 * Redis 緩存配置
 * 分散式緩存解決方案
 */

const redis = require('redis');

class RedisCacheManager {
    constructor(options = {}) {
        this.options = {
            host: options.host || process.env.REDIS_HOST || 'localhost',
            port: options.port || process.env.REDIS_PORT || 6379,
            password: options.password || process.env.REDIS_PASSWORD,
            db: options.db || 0,
            keyPrefix: options.keyPrefix || 'gclaude:',
            defaultTTL: options.defaultTTL || 300, // 5分鐘
            ...options
        };
        
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            this.client = redis.createClient({
                host: this.options.host,
                port: this.options.port,
                password: this.options.password,
                db: this.options.db
            });

            this.client.on('error', (err) => {
                console.error('Redis錯誤:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('✅ Redis連接成功');
                this.isConnected = true;
            });

            await this.client.connect();
            return true;

        } catch (error) {
            console.error('❌ Redis連接失敗:', error.message);
            return false;
        }
    }

    async set(key, value, ttl = null) {
        if (!this.isConnected) return false;
        
        try {
            const fullKey = this.options.keyPrefix + key;
            const serializedValue = JSON.stringify(value);
            
            if (ttl) {
                await this.client.setEx(fullKey, ttl, serializedValue);
            } else {
                await this.client.setEx(fullKey, this.options.defaultTTL, serializedValue);
            }
            
            return true;
        } catch (error) {
            console.error('Redis設值失敗:', error.message);
            return false;
        }
    }

    async get(key) {
        if (!this.isConnected) return null;
        
        try {
            const fullKey = this.options.keyPrefix + key;
            const value = await this.client.get(fullKey);
            
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Redis取值失敗:', error.message);
            return null;
        }
    }

    async del(key) {
        if (!this.isConnected) return false;
        
        try {
            const fullKey = this.options.keyPrefix + key;
            await this.client.del(fullKey);
            return true;
        } catch (error) {
            console.error('Redis刪除失敗:', error.message);
            return false;
        }
    }

    async exists(key) {
        if (!this.isConnected) return false;
        
        try {
            const fullKey = this.options.keyPrefix + key;
            const exists = await this.client.exists(fullKey);
            return exists === 1;
        } catch (error) {
            console.error('Redis檢查存在失敗:', error.message);
            return false;
        }
    }

    async flushAll() {
        if (!this.isConnected) return false;
        
        try {
            await this.client.flushAll();
            return true;
        } catch (error) {
            console.error('Redis清空失敗:', error.message);
            return false;
        }
    }

    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
        }
    }
}

module.exports = RedisCacheManager;