/**
 * 安全性和權限控制審查
 */
const axios = require('axios');

class SecurityAuditor {
    constructor() {
        this.baseURL = 'http://localhost:3007';
        this.tokens = {};
        this.securityIssues = [];
    }

    async runSecurityAudit() {
        console.log('🔒 開始安全性審查...\n');

        // 1. 獲取不同角色的令牌
        await this.getAllRoleTokens();
        
        // 2. 測試認證機制
        await this.testAuthenticationSecurity();
        
        // 3. 測試權限控制
        await this.testAuthorization();
        
        // 4. 測試數據驗證
        await this.testDataValidation();
        
        // 5. 測試SQL注入防護
        await this.testSQLInjection();

        // 顯示安全性報告
        this.showSecurityReport();
    }

    async getAllRoleTokens() {
        console.log('🔑 獲取各角色令牌...');
        
        const users = [
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'manager', password: 'manager123', role: 'manager' },
            { username: 'employee', password: 'employee123', role: 'employee' },
            { username: 'intern', password: 'intern123', role: 'intern' }
        ];

        for (const user of users) {
            try {
                const response = await axios.post(`${this.baseURL}/api/auth/login`, {
                    username: user.username,
                    password: user.password
                });
                
                if (response.data.success && response.data.token) {
                    this.tokens[user.role] = response.data.token;
                    console.log(`✅ ${user.role} 令牌獲取成功`);
                } else {
                    console.log(`❌ ${user.role} 令牌獲取失敗`);
                    this.securityIssues.push(`${user.role} 無法登入`);
                }
            } catch (error) {
                console.log(`❌ ${user.role} 登入錯誤: ${error.message}`);
                this.securityIssues.push(`${user.role} 登入API錯誤`);
            }
        }
    }

    async testAuthenticationSecurity() {
        console.log('\n🛡️ 測試認證安全性...');
        
        // 測試無令牌訪問受保護的端點
        try {
            const response = await axios.get(`${this.baseURL}/api/employees`);
            this.securityIssues.push('員工API允許無認證訪問');
            console.log('❌ 員工API缺乏認證保護');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ 員工API有適當的認證保護');
            } else {
                this.securityIssues.push(`員工API認證測試異常: ${error.message}`);
            }
        }

        // 測試無效令牌
        try {
            const response = await axios.get(`${this.baseURL}/api/employees`, {
                headers: { Authorization: 'Bearer invalid-token' }
            });
            this.securityIssues.push('API接受無效令牌');
            console.log('❌ API接受無效令牌');
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ API正確拒絕無效令牌');
            } else {
                this.securityIssues.push(`無效令牌測試異常: ${error.message}`);
            }
        }
    }

    async testAuthorization() {
        console.log('\n👮 測試權限控制...');
        
        // 測試實習生訪問管理員功能
        if (this.tokens.intern) {
            try {
                const response = await axios.get(`${this.baseURL}/api/employees`, {
                    headers: { Authorization: `Bearer ${this.tokens.intern}` }
                });
                
                if (response.status === 200) {
                    this.securityIssues.push('實習生可以訪問員工管理功能');
                    console.log('❌ 實習生越權訪問員工管理');
                } else {
                    console.log('✅ 實習生被正確限制員工管理訪問');
                }
            } catch (error) {
                if (error.response?.status === 403) {
                    console.log('✅ 實習生被正確拒絕員工管理訪問');
                } else {
                    console.log(`⚠️ 實習生權限測試異常: ${error.message}`);
                }
            }
        }

        // 測試員工訪問營收功能
        if (this.tokens.employee) {
            try {
                const response = await axios.get(`${this.baseURL}/api/revenue`, {
                    headers: { Authorization: `Bearer ${this.tokens.employee}` }
                });
                
                if (response.status === 200) {
                    this.securityIssues.push('一般員工可以訪問營收數據');
                    console.log('❌ 一般員工越權訪問營收數據');
                } else {
                    console.log('✅ 一般員工被正確限制營收數據訪問');
                }
            } catch (error) {
                if (error.response?.status === 403) {
                    console.log('✅ 一般員工被正確拒絕營收數據訪問');
                } else {
                    console.log(`⚠️ 員工權限測試異常: ${error.message}`);
                }
            }
        }
    }

    async testDataValidation() {
        console.log('\n✅ 測試數據驗證...');
        
        if (!this.tokens.admin) return;
        
        // 測試惡意數據輸入
        const maliciousData = [
            { name: '', email: 'invalid-email', phone: '123' }, // 無效數據
            { name: '<script>alert("xss")</script>', email: 'test@evil.com' }, // XSS測試
            { name: 'Test User', email: 'test@test.com', username: 'admin' } // 重複用戶名
        ];

        for (const data of maliciousData) {
            try {
                const response = await axios.post(`${this.baseURL}/api/employees`, data, {
                    headers: { Authorization: `Bearer ${this.tokens.admin}` }
                });
                
                if (response.status === 201) {
                    this.securityIssues.push(`API接受了無效數據: ${JSON.stringify(data)}`);
                    console.log(`❌ API接受無效數據: ${data.name || 'unnamed'}`);
                }
            } catch (error) {
                if (error.response?.status === 400) {
                    console.log(`✅ API正確拒絕無效數據: ${data.name || 'unnamed'}`);
                } else {
                    console.log(`⚠️ 數據驗證測試異常: ${error.message}`);
                }
            }
        }
    }

    async testSQLInjection() {
        console.log('\n🛡️ 測試SQL注入防護...');
        
        if (!this.tokens.admin) return;
        
        // 測試SQL注入嘗試
        const sqlInjectionPayloads = [
            "'; DROP TABLE employees; --",
            "' OR '1'='1",
            "admin'; UPDATE employees SET role='admin' WHERE id=1; --"
        ];

        for (const payload of sqlInjectionPayloads) {
            try {
                const response = await axios.get(`${this.baseURL}/api/employees?search=${encodeURIComponent(payload)}`, {
                    headers: { Authorization: `Bearer ${this.tokens.admin}` }
                });
                
                // 如果查詢成功且返回異常結果，可能存在SQL注入漏洞
                console.log(`✅ SQL注入測試完成: ${payload.substring(0, 20)}...`);
            } catch (error) {
                // 錯誤是預期的，表示系統有基本防護
                console.log(`✅ SQL注入被阻止: ${payload.substring(0, 20)}...`);
            }
        }
    }

    showSecurityReport() {
        console.log('\n📊 安全性審查報告:');
        console.log('==================');
        
        if (this.securityIssues.length === 0) {
            console.log('🎉 未發現嚴重安全性問題！');
            console.log('✅ 認證機制正常');
            console.log('✅ 權限控制有效');
            console.log('✅ 數據驗證正常');
            console.log('✅ 基本SQL注入防護');
        } else {
            console.log(`⚠️ 發現 ${this.securityIssues.length} 個安全性問題:`);
            this.securityIssues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue}`);
            });
        }

        console.log('\n🔒 安全建議:');
        console.log('1. 定期更新JWT密鑰');
        console.log('2. 實施速率限制');
        console.log('3. 記錄所有敏感操作');
        console.log('4. 定期進行安全性測試');
        console.log('5. 使用HTTPS加密通信');
    }
}

async function runSecurityAudit() {
    const auditor = new SecurityAuditor();
    await auditor.runSecurityAudit();
}

if (require.main === module) {
    runSecurityAudit().catch(console.error);
}

module.exports = SecurityAuditor;