/**
 * 靜態資源緩存配置
 * Express 靜態資源優化
 */

const express = require('express');
const compression = require('compression');
const path = require('path');

class StaticResourceOptimizer {
    constructor(app) {
        this.app = app;
        this.setupCompression();
        this.setupCacheHeaders();
    }

    setupCompression() {
        // 啟用 Gzip 壓縮
        this.app.use(compression({
            filter: (req, res) => {
                // 檢查是否應該壓縮
                if (req.headers['x-no-compression']) {
                    return false;
                }
                
                // 使用壓縮預設過濾器
                return compression.filter(req, res);
            },
            level: 6, // 壓縮級別 (1-9)
            threshold: 1024, // 只壓縮大於1KB的響應
            memLevel: 8 // 記憶體使用級別
        }));
    }

    setupCacheHeaders() {
        // 長期快取靜態資源
        this.app.use('/public', (req, res, next) => {
            const ext = path.extname(req.path).toLowerCase();
            
            // 根據檔案類型設定快取
            if (['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg'].includes(ext)) {
                // 靜態資源 - 長期快取
                res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1年
                res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
            } else if (['.html', '.htm'].includes(ext)) {
                // HTML檔案 - 短期快取
                res.setHeader('Cache-Control', 'public, max-age=300'); // 5分鐘
            } else {
                // 其他檔案 - 中等快取
                res.setHeader('Cache-Control', 'public, max-age=3600'); // 1小時
            }
            
            next();
        });

        // API 快取標頭
        this.app.use('/api', (req, res, next) => {
            // API 響應不快取或短期快取
            if (req.method === 'GET') {
                // GET 請求可以短期快取
                res.setHeader('Cache-Control', 'public, max-age=60'); // 1分鐘
            } else {
                // POST, PUT, DELETE 不快取
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }
            
            next();
        });
    }

    // 設定 ETags
    enableETags() {
        this.app.set('etag', 'strong'); // 啟用強 ETag
    }

    // 預載入關鍵資源
    preloadCriticalResources() {
        this.app.use((req, res, next) => {
            if (req.path === '/' || req.path === '/index.html') {
                // 預載入關鍵CSS和JS
                res.setHeader('Link', [
                    '</public/styles.css>; rel=preload; as=style',
                    '</public/script.js>; rel=preload; as=script'
                ].join(', '));
            }
            next();
        });
    }

    // 資源提示
    addResourceHints() {
        this.app.use((req, res, next) => {
            if (req.path === '/' || req.path === '/index.html') {
                // DNS 預取和預連接
                res.setHeader('Link', [
                    '<https://fonts.googleapis.com>; rel=dns-prefetch',
                    '<https://cdn.jsdelivr.net>; rel=preconnect'
                ].join(', '));
            }
            next();
        });
    }
}

module.exports = StaticResourceOptimizer;