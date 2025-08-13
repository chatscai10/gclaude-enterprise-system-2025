/**
 * Express 緩存中介軟體
 * 提供API響應緩存功能
 */

const NodeCache = require('node-cache');

class ExpressCacheMiddleware {
    constructor(options = {}) {
        this.cache = new NodeCache({
            stdTTL: options.defaultTTL || 300, // 預設5分鐘
            checkperiod: options.checkPeriod || 60, // 每分鐘檢查過期
            useClones: false
        });
        
        this.options = {
            keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
            skipSuccessfulRequests: options.skipSuccessfulRequests || false,
            skipFailedRequests: options.skipFailedRequests || true,
            ...options
        };
    }

    // 預設快取鍵生成器
    defaultKeyGenerator(req) {
        return `${req.method}:${req.originalUrl}`;
    }

    // 主要快取中介軟體
    middleware(ttl = null) {
        return (req, res, next) => {
            // 只快取 GET 請求
            if (req.method !== 'GET') {
                return next();
            }

            const key = this.options.keyGenerator(req);
            const cachedResponse = this.cache.get(key);

            if (cachedResponse) {
                // 命中快取
                res.set({
                    'X-Cache': 'HIT',
                    'X-Cache-Key': key
                });
                return res.json(cachedResponse);
            }

            // 快取未命中，攔截響應
            const originalJson = res.json;
            res.json = (body) => {
                // 只快取成功的響應
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const cacheTTL = ttl || this.options.defaultTTL;
                    this.cache.set(key, body, cacheTTL);
                }

                res.set({
                    'X-Cache': 'MISS',
                    'X-Cache-Key': key
                });

                // 呼叫原始 json 方法
                return originalJson.call(res, body);
            };

            next();
        };
    }

    // 清除特定快取
    clearCache(pattern) {
        const keys = this.cache.keys();
        const matchingKeys = keys.filter(key => 
            pattern instanceof RegExp ? pattern.test(key) : key.includes(pattern)
        );
        
        matchingKeys.forEach(key => this.cache.del(key));
        return matchingKeys.length;
    }

    // 獲取快取統計
    getStats() {
        return {
            keys: this.cache.keys().length,
            hits: this.cache.getStats().hits,
            misses: this.cache.getStats().misses,
            ksize: this.cache.getStats().ksize,
            vsize: this.cache.getStats().vsize
        };
    }

    // 清空所有快取
    flushAll() {
        this.cache.flushAll();
    }
}

module.exports = ExpressCacheMiddleware;