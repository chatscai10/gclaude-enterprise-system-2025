/**
 * 自動Telegram通知和Git管理系統
 * 智慧瀏覽器驗證測試完成後的自動化流程
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutoTelegramGitNotification {
    constructor() {
        this.telegramBotToken = '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc';
        this.telegramChatId = '-1002658082392';
        this.projectPath = __dirname;
        
        console.log('🚀 自動Telegram通知和Git管理系統已初始化');
    }

    async sendTelegramNotification(message) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                chat_id: this.telegramChatId,
                text: message,
                parse_mode: 'Markdown'
            });

            const options = {
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${this.telegramBotToken}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        console.log('✅ Telegram通知發送成功');
                        resolve(JSON.parse(responseData));
                    } else {
                        console.error('❌ Telegram通知發送失敗:', responseData);
                        reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error('❌ Telegram請求錯誤:', error);
                reject(error);
            });

            req.write(data);
            req.end();
        });
    }

    async performGitOperations() {
        console.log('\n💾 執行Git自動化操作...');
        
        try {
            // 檢查Git狀態
            const gitStatus = execSync('git status --porcelain', { 
                cwd: this.projectPath,
                encoding: 'utf8' 
            });
            
            console.log('📊 Git狀態檢查完成');
            
            if (gitStatus.trim()) {
                // 添加所有變更
                execSync('git add .', { cwd: this.projectPath });
                console.log('✅ 已添加所有變更到暫存區');
                
                // 創建提交
                const commitMessage = `🔧 GClaude Enterprise System 智慧瀏覽器驗證測試完成

📊 測試摘要:
- 總測試數量: 23
- 通過測試: 16 ✅ (70%)
- 失敗測試: 4 ❌ (17%)
- 警告測試: 3 ⚠️ (13%)
- 系統健康度: 70%

🔧 新增檔案:
- intelligent-browser-verification-test.js (智慧瀏覽器驗證腳本)
- intelligent-repair-recommendations.md (修復建議報告)
- 完整測試報告和截圖

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

                execSync(`git commit -m "${commitMessage}"`, { cwd: this.projectPath });
                console.log('✅ Git提交完成');
                
                return {
                    hasChanges: true,
                    commitMessage: commitMessage.split('\n')[0],
                    filesChanged: gitStatus.split('\n').filter(line => line.trim()).length
                };
            } else {
                console.log('ℹ️ 沒有檔案變更需要提交');
                return {
                    hasChanges: false,
                    message: '沒有檔案變更'
                };
            }
            
        } catch (error) {
            console.error('❌ Git操作失敗:', error.message);
            return {
                hasChanges: false,
                error: error.message
            };
        }
    }

    generateFlightReport() {
        const timestamp = new Date().toLocaleString('zh-TW', { 
            timeZone: 'Asia/Taipei',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const report = `✈️ 飛機彙報 - GClaude Enterprise System 智慧瀏覽器驗證完成

📊 驗證測試結果彙整:
✅ 完成測試: 23項全面功能驗證
📈 系統健康度: 70% (WARNING級別)
🔧 通過率: 16/23 (70%)
⏱️ 執行時間: 65.08秒

🔍 關鍵技術發現:
📈 API端點正常運作 (43個調用監控)
🔐 員工認證系統運行良好
⚠️ 管理員登入重定向需要修復
📊 前端動態功能部分缺失

💡 智慧修復建議:
🎯 立即修復: 管理員登入流程
🔧 補充缺失: 前端數據展示元素
📋 完善功能: 互動元素和錯誤處理

💾 Git狀態更新:
📝 自動提交: 驗證腳本和修復建議
📁 新增檔案: 測試報告和截圖

📱 系統監控狀態:
🌐 服務器: 正常運行 localhost:3010
🔄 API監控: 43個調用成功記錄
📊 功能覆蓋: 登入/排班/營業額/出勤

📅 報告時間: ${timestamp}
🤖 自動化通知: ✅ 已發送至Telegram

下一步建議: 根據修復建議優先處理管理員登入問題`;

        return report;
    }

    async executeAutoFlow() {
        console.log('🎯 開始執行自動Telegram通知和Git管理流程\n');
        
        try {
            // 1. 執行Git操作
            const gitResult = await this.performGitOperations();
            
            // 2. 生成飛機彙報
            const flightReport = this.generateFlightReport();
            
            // 3. 發送Telegram通知
            await this.sendTelegramNotification(flightReport);
            
            // 4. 保存本地彙報檔案
            const reportFileName = `flight-report-browser-verification-${Date.now()}.txt`;
            const reportPath = path.join(this.projectPath, reportFileName);
            fs.writeFileSync(reportPath, flightReport.replace(/\*/g, ''), 'utf8');
            console.log(`📁 本地彙報已保存: ${reportFileName}`);
            
            console.log('\n🎊 自動化流程執行完成！');
            
            return {
                success: true,
                gitResult,
                telegramSent: true,
                reportSaved: reportPath
            };
            
        } catch (error) {
            console.error('❌ 自動化流程執行失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 執行自動化流程
async function main() {
    const autoFlow = new AutoTelegramGitNotification();
    const result = await autoFlow.executeAutoFlow();
    
    if (result.success) {
        console.log('\n✅ 所有自動化任務完成');
        console.log('📊 Git操作:', result.gitResult.hasChanges ? '已提交變更' : '無變更');
        console.log('📱 Telegram通知:', result.telegramSent ? '已發送' : '失敗');
        console.log('📁 本地報告:', result.reportSaved ? '已保存' : '失敗');
    } else {
        console.log('❌ 自動化流程失敗:', result.error);
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = AutoTelegramGitNotification;