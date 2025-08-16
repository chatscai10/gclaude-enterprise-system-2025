/**
 * JSON 字符串清理工具
 * 解決 Unicode 代理對問題
 */

class JsonSanitizer {
    /**
     * 清理字符串中的無效 Unicode 字符
     * @param {string} str - 需要清理的字符串
     * @returns {string} - 清理後的字符串
     */
    static sanitizeString(str) {
        if (typeof str !== 'string') {
            return str;
        }

        // 移除或替換無效的 Unicode 代理對
        return str.replace(/[\uD800-\uDFFF]/g, (match, offset, string) => {
            const charCode = match.charCodeAt(0);
            
            // 檢查是否為高代理
            if (charCode >= 0xD800 && charCode <= 0xDBFF) {
                const nextChar = string.charAt(offset + 1);
                const nextCharCode = nextChar.charCodeAt(0);
                
                // 檢查是否有對應的低代理
                if (nextCharCode >= 0xDC00 && nextCharCode <= 0xDFFF) {
                    // 這是有效的代理對，保留
                    return match + nextChar;
                } else {
                    // 無效的高代理，移除
                    return '';
                }
            }
            
            // 檢查是否為低代理
            if (charCode >= 0xDC00 && charCode <= 0xDFFF) {
                const prevChar = string.charAt(offset - 1);
                const prevCharCode = prevChar.charCodeAt(0);
                
                // 檢查前一個字符是否為高代理
                if (prevCharCode >= 0xD800 && prevCharCode <= 0xDBFF) {
                    // 這是有效代理對的一部分，已經在上面處理過了
                    return '';
                } else {
                    // 無效的低代理，移除
                    return '';
                }
            }
            
            return '';
        });
    }

    /**
     * 遞歸清理對象中的所有字符串
     * @param {any} obj - 需要清理的對象
     * @returns {any} - 清理後的對象
     */
    static sanitizeObject(obj) {
        if (typeof obj === 'string') {
            return this.sanitizeString(obj);
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }
        
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                const cleanKey = this.sanitizeString(key);
                sanitized[cleanKey] = this.sanitizeObject(value);
            }
            return sanitized;
        }
        
        return obj;
    }

    /**
     * 安全的 JSON.stringify
     * @param {any} obj - 需要序列化的對象
     * @param {function} replacer - 替換函數
     * @param {number|string} space - 縮進
     * @returns {string} - 清理後的 JSON 字符串
     */
    static safeStringify(obj, replacer = null, space = null) {
        try {
            // 先清理對象
            const sanitized = this.sanitizeObject(obj);
            
            // 使用自定義的 replacer 來進一步處理問題字符
            const safeReplacer = (key, value) => {
                if (typeof value === 'string') {
                    // 確保字符串是有效的
                    const cleaned = this.sanitizeString(value);
                    return replacer ? replacer(key, cleaned) : cleaned;
                }
                return replacer ? replacer(key, value) : value;
            };
            
            return JSON.stringify(sanitized, safeReplacer, space);
        } catch (error) {
            console.error('JSON.stringify 錯誤:', error.message);
            
            // 如果還是失敗，嘗試更激進的清理
            try {
                const stringified = JSON.stringify(obj, (key, value) => {
                    if (typeof value === 'string') {
                        // 移除所有非標準 ASCII 字符以外的問題字符
                        return value.replace(/[\u0000-\u001F\u007F-\u009F\uD800-\uDFFF]/g, '');
                    }
                    return value;
                }, space);
                
                console.warn('使用激進清理模式成功序列化');
                return stringified;
            } catch (fallbackError) {
                console.error('激進清理也失敗:', fallbackError.message);
                return '{"error": "JSON serialization failed"}';
            }
        }
    }

    /**
     * 安全的 JSON.parse
     * @param {string} str - JSON 字符串
     * @param {function} reviver - 恢復函數
     * @returns {any} - 解析後的對象
     */
    static safeParse(str, reviver = null) {
        try {
            // 先清理字符串
            const cleaned = this.sanitizeString(str);
            return JSON.parse(cleaned, reviver);
        } catch (error) {
            console.error('JSON.parse 錯誤:', error.message);
            throw new Error(`JSON 解析失敗: ${error.message}`);
        }
    }
}

module.exports = JsonSanitizer;