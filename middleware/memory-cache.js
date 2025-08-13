/**
 * 記憶體緩存實作
 * 輕量級本地緩存解決方案
 */

class MemoryCacheManager {
    constructor(options = {}) {
        this.cache = new Map();
        this.timers = new Map();
        this.options = {
            maxSize: options.maxSize || 1000,
            defaultTTL: options.defaultTTL || 300000, // 5分鐘 (毫秒)
            checkInterval: options.checkInterval || 60000, // 1分鐘檢查間隔
            ...options
        };
        
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0
        };
        
        // 啟動清理定時器
        this.startCleanupTimer();
    }

    set(key, value, ttl = null) {
        // 檢查容量限制
        if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }

        // 清除現有的定時器
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }

        // 設定快取項目
        const item = {
            value: value,
            timestamp: Date.now(),
            accessCount: 0,
            ttl: ttl || this.options.defaultTTL
        };

        this.cache.set(key, item);
        this.stats.sets++;

        // 設定過期定時器
        const timeoutId = setTimeout(() => {
            this.delete(key);
        }, item.ttl);

        this.timers.set(key, timeoutId);
        return true;
    }

    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            this.stats.misses++;
            return null;
        }

        // 檢查是否過期
        if (Date.now() - item.timestamp > item.ttl) {
            this.delete(key);
            this.stats.misses++;
            return null;
        }

        // 更新訪問統計
        item.accessCount++;
        this.stats.hits++;
        
        return item.value;
    }

    has(key) {
        const item = this.cache.get(key);
        
        if (!item) return false;
        
        // 檢查是否過期
        if (Date.now() - item.timestamp > item.ttl) {
            this.delete(key);
            return false;
        }
        
        return true;
    }

    delete(key) {
        const deleted = this.cache.delete(key);
        
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
        
        if (deleted) {
            this.stats.deletes++;
        }
        
        return deleted;
    }

    clear() {
        // 清除所有定時器
        for (const timeoutId of this.timers.values()) {
            clearTimeout(timeoutId);
        }
        
        this.cache.clear();
        this.timers.clear();
        
        // 重置統計
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0
        };
    }

    // LRU 淘汰策略
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [key, item] of this.cache.entries()) {
            if (item.timestamp < oldestTime) {
                oldestTime = item.timestamp;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.delete(oldestKey);
            this.stats.evictions++;
        }
    }

    // 清理過期項目
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];
        
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                expiredKeys.push(key);
            }
        }
        
        expiredKeys.forEach(key => this.delete(key));
        return expiredKeys.length;
    }

    // 啟動清理定時器
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.options.checkInterval);
    }

    // 停止清理定時器
    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }

    // 獲取快取統計
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;
        
        return {
            ...this.stats,
            hitRate: parseFloat(hitRate),
            size: this.cache.size,
            maxSize: this.options.maxSize
        };
    }

    // 獲取快取內容概覽
    getOverview() {
        const items = [];
        const now = Date.now();
        
        for (const [key, item] of this.cache.entries()) {
            items.push({
                key: key,
                size: JSON.stringify(item.value).length,
                age: now - item.timestamp,
                ttl: item.ttl,
                accessCount: item.accessCount,
                expired: now - item.timestamp > item.ttl
            });
        }
        
        return items.sort((a, b) => b.accessCount - a.accessCount);
    }
}

module.exports = MemoryCacheManager;