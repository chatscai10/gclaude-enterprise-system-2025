#!/usr/bin/env node

/**
 * 測試運行腳本
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
    constructor() {
        this.results = {
            unit: null,
            integration: null,
            e2e: null,
            performance: null
        };
    }
    
    async runAllTests() {
        console.log('🧪 開始執行完整測試流程...\n');
        
        try {
            // 1. 執行單元測試
            await this.runUnitTests();
            
            // 2. 執行整合測試
            await this.runIntegrationTests();
            
            // 3. 執行端到端測試
            await this.runE2ETests();
            
            // 4. 執行效能測試
            await this.runPerformanceTests();
            
            // 5. 生成測試報告
            await this.generateTestReport();
            
            console.log('\n✅ 所有測試完成');
            
        } catch (error) {
            console.error('❌ 測試執行失敗:', error.message);
            process.exit(1);
        }
    }
    
    async runUnitTests() {
        console.log('🔬 執行單元測試...');
        
        try {
            const output = execSync('npm run test:unit', {
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            console.log('✅ 單元測試通過');
            this.results.unit = { success: true, output: output };
            
        } catch (error) {
            console.log('⚠️ 單元測試部分失敗');
            this.results.unit = { success: false, error: error.message };
        }
    }
    
    async runIntegrationTests() {
        console.log('🔗 執行整合測試...');
        
        try {
            const output = execSync('npm run test:integration', {
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            console.log('✅ 整合測試通過');
            this.results.integration = { success: true, output: output };
            
        } catch (error) {
            console.log('⚠️ 整合測試部分失敗');
            this.results.integration = { success: false, error: error.message };
        }
    }
    
    async runE2ETests() {
        console.log('🎭 執行端到端測試...');
        
        try {
            const output = execSync('npm run test:e2e', {
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            console.log('✅ 端到端測試通過');
            this.results.e2e = { success: true, output: output };
            
        } catch (error) {
            console.log('⚠️ 端到端測試部分失敗');
            this.results.e2e = { success: false, error: error.message };
        }
    }
    
    async runPerformanceTests() {
        console.log('⚡ 執行效能測試...');
        
        try {
            const output = execSync('npm run test:performance', {
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            console.log('✅ 效能測試通過');
            this.results.performance = { success: true, output: output };
            
        } catch (error) {
            console.log('⚠️ 效能測試部分失敗');
            this.results.performance = { success: false, error: error.message };
        }
    }
    
    async generateTestReport() {
        console.log('📊 生成測試報告...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: 4,
                passed: Object.values(this.results).filter(r => r?.success).length,
                failed: Object.values(this.results).filter(r => r && !r.success).length
            },
            results: this.results
        };
        
        // 保存報告
        const reportPath = path.join(__dirname, '..', 'test-results', 
            `test-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📄 測試報告已保存: ${reportPath}`);
        
        // 顯示摘要
        console.log('\n📊 測試摘要:');
        console.log(`  總計: ${report.summary.total}`);
        console.log(`  通過: ${report.summary.passed}`);
        console.log(`  失敗: ${report.summary.failed}`);
        
        return reportPath;
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests();
}

module.exports = TestRunner;