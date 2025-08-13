/**
 * GClaude 企業管理系統 Telegram 飛機彙報系統
 * 基於通知模板的完整自動化通知引擎
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class GClaudeTelegramFlightReporter {
    constructor(options = {}) {
        // Telegram Bot 配置 (已驗證可用)
        this.botToken = options.botToken || '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc';
        this.bossGroupId = options.bossGroupId || '-1002658082392';
        this.employeeGroupId = options.employeeGroupId || '-1002658082392'; // 可設定不同群組
        
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
        
        // 通知模板配置
        this.templates = {
            boss: {}, // 老闆群組通知模板
            employee: {} // 員工群組通知模板
        };

        this.flightReports = [];
        this.notificationLog = [];
        
        this.initializeTemplates();
    }

    // 初始化所有通知模板
    initializeTemplates() {
        // 老闆群組通知模板
        this.templates.boss = {
            // 新員工註冊
            newEmployee: (data) => `🆕 新員工註冊
👤 姓名: ${data.name || '未提供'}
🆔 身分證: ${data.idCard || '未提供'}
📅 出生日期: ${data.birthday || '未提供'}
⚧ 性別: ${data.gender || '未提供'}
🚗 駕照: ${data.license || '未提供'}
📞 聯絡電話: ${data.phone || '未提供'}
🏠 聯絡地址: ${data.address || '未提供'}
🚨 緊急聯絡人: ${data.emergencyContact || '未提供'}
👥 關係: ${data.relationship || '未提供'}
📞 緊急聯絡電話: ${data.emergencyPhone || '未提供'}
📆 到職日: ${data.startDate || '未提供'}
🏪 分店: ${data.store || '未提供'}
💼 職位: ${data.position || '未提供'}
📱 狀態: ${data.status || '已核准'}`,

            // 員工打卡記錄
            attendance: (data) => `🕐 員工打卡記錄
👤 員工: ${data.employeeName || '未知員工'}
⏰ 時間: ${data.timestamp || new Date().toLocaleString('zh-TW')}
🏪 分店: ${data.store || '未知分店'}
📍 座標: ${data.latitude || '0'}, ${data.longitude || '0'}
📏 距離: ${data.distance || '未知'}公尺
📱 設備: ${data.device || '未知設備'}
✅ 狀態: ${data.status || '打卡成功'}
${data.isLate ? `⏰ 遲到：${data.lateMinutes}分鐘，本月累計共${data.monthlyLateMinutes}分鐘` : ''}
${data.fingerprint ? `🔒 指紋驗證: ${data.fingerprint}` : ''}
${data.anomaly ? `⚠️ 異常檢測: ${data.anomaly}` : ''}`,

            // 營業額提交
            revenue: (data) => `💰 營業額提交
🏪 分店: ${data.store || '未知分店'}
👤 提交人: ${data.submitter || '未知'}
📅 日期: ${data.date || new Date().toISOString().split('T')[0]}
📝 現場訂單: ${data.localOrders || 0} 張

💸 收入明細:
• 現場訂單: $${(data.localRevenue || 0).toLocaleString()}
• 外送訂單: $${(data.deliveryRevenue || 0).toLocaleString()}

💳 支出明細:
• 材料成本: $${(data.materialCost || 0).toLocaleString()}
• 人力成本: $${(data.laborCost || 0).toLocaleString()}
• 雜項支出: $${(data.miscCost || 0).toLocaleString()}
• 其他費用: $${(data.otherCost || 0).toLocaleString()}

📊 財務統計:
收入總額: $${((data.localRevenue || 0) + (data.deliveryRevenue || 0)).toLocaleString()}
支出總額: $${((data.materialCost || 0) + (data.laborCost || 0) + (data.miscCost || 0) + (data.otherCost || 0)).toLocaleString()}
淨收入: $${(data.netIncome || 0).toLocaleString()}

🎯 獎金資訊:
獎金類別: ${data.bonusType || '平日獎金'}
今日獎金: $${(data.todayBonus || 0).toLocaleString()}
訂單平均: $${data.averageOrder || 0}/單
📋 備註: ${data.notes || '無'}`,

            // 叫貨記錄
            ordering: (data) => {
                let message = `🛒 叫貨記錄
👤 叫貨人員: ${data.orderer || '未知'}
📅 送貨日期: ${data.deliveryDate || new Date().toISOString().split('T')[0]}
🏪 分店: ${data.store || '未知分店'}
💰 總金額: $${(data.totalAmount || 0).toLocaleString()}

📦 依廠商分類:`;

                // 按廠商分類的商品
                if (data.supplierItems && Array.isArray(data.supplierItems)) {
                    data.supplierItems.forEach(supplier => {
                        message += `\n🏭 ${supplier.name || '未知廠商'}`;
                        if (supplier.items && Array.isArray(supplier.items)) {
                            supplier.items.forEach(item => {
                                message += `\n  • ${item.brand || ''} ${item.name || '未知商品'} ${item.quantity || 0} ${item.unit || '個'}`;
                            });
                        }
                    });
                }

                // 異常分析
                if (data.anomalies && Array.isArray(data.anomalies)) {
                    message += `\n\n⚠️ 異常分析:`;
                    data.anomalies.forEach(anomaly => {
                        message += `\n🔍 ${anomaly.item} ${anomaly.type === 'missing' ? `已經${anomaly.days}天沒有叫貨` : `${anomaly.days}天內頻繁叫貨`}`;
                        message += `\n📅 上次叫貨: ${anomaly.lastOrderDate} - ${anomaly.item} ${anomaly.lastQuantity}${anomaly.unit || '個'}`;
                    });
                }

                return message;
            },

            // 升遷投票
            promotion: (data) => `🗳️ 升遷投票發起
👤 候選人: ${data.candidateName || '未知'}
📅 到職日期: ${data.joinDate || '未知'}，任職總天數: ${data.totalDays || 0} 天
💼 目前職位: ${data.currentPosition || '未知'}
📈 目標職位: ${data.targetPosition || '未知'}
⏰ 投票結束: ${data.endDate || '未設定'}
📋 詳細資料: 請查看系統
🔗 投票連結: ${data.voteLink || '請至系統查看'}`,

            // 維修申請
            maintenance: (data) => `🔧 維修申請
📅 日期: ${data.date || new Date().toLocaleString('zh-TW')}
🏪 分店: ${data.store || '未知分店'}
👤 申請人: ${data.applicant || '未知'}
🛠️ 設備: ${data.equipment || '未知設備'}
⚠️ 緊急程度: ${data.urgency || '一般'}
🏷️ 類別: ${data.category || '未分類'}
❗ 問題: ${data.problem || '未描述'}
📷 照片: ${data.photoCount || 0}張
💰 預估費用: ${data.estimatedCost ? `$${data.estimatedCost.toLocaleString()}` : '待評估'}`,

            // 強制排班系統
            forceScheduling: (data) => `🚨 強制排班系統已開啟
⏰ 開放時間: ${data.duration || 30}分鐘
👤 開啟者: ${data.opener || '系統管理員'}
📅 開啟時間: ${data.startTime || new Date().toLocaleString('zh-TW')}
📅 結束時間: ${data.endTime || '未設定'}
📋 說明: 請所有員工立即完成排班作業`,

            // 排班設定提醒
            schedulingReminder: (data) => `🚨 排班系統準備開啟
📅 提醒: 請即時設定各店公休日、禁休日
⏰ 開放天數: ${data.remainingDays || 5}天
📅 開啟時間: ${data.startTime || '未設定'}
📅 結束時間: ${data.endTime || '未設定'}
🏪 適用分店: ${data.stores ? data.stores.join(', ') : '全店'}`,

            // 明日值班提醒
            tomorrowSchedule: (data) => {
                let message = `📅 明日值班提醒
📆 日期: ${data.date || new Date().toISOString().split('T')[0]}

📋 值班安排:`;

                if (data.schedules && Array.isArray(data.schedules)) {
                    data.schedules.forEach(schedule => {
                        message += `\n🏪 ${schedule.store || '未知分店'}`;
                        message += `\n👥 值班: ${schedule.working ? schedule.working.join('、') : '無'}`;
                        message += `\n🏠 休假: ${schedule.offDay ? schedule.offDay.join('、') : '無'}`;
                    });
                }

                if (data.nextDayPreview && Array.isArray(data.nextDayPreview)) {
                    message += `\n\n📆 後天預告:`;
                    data.nextDayPreview.forEach(preview => {
                        message += `\n🏪 ${preview.store}: ${preview.working ? preview.working.join('、') : '無'}`;
                    });
                }

                message += `\n\n⏰ 每日18:00自動發送\n🔄 資料來源: 排班系統`;
                return message;
            },

            // 當月生日清單
            monthlyBirthdays: (data) => {
                let message = `📅 本月生日清單
📆 ${data.month || new Date().getFullYear() + '年' + (new Date().getMonth() + 1) + '月'}

🎂 本月壽星 (${data.birthdays ? data.birthdays.length : 0}位):`;

                if (data.birthdays && Array.isArray(data.birthdays)) {
                    data.birthdays.forEach(birthday => {
                        message += `\n🎈 ${birthday.date} - ${birthday.name} (${birthday.age}歲)`;
                    });
                }

                message += `\n\n📱 請各分店主管注意員工生日，適時表達關懷`;
                message += `\n🎁 建議為生日員工準備小禮物或祝福`;
                message += `\n⏰ 每月1號10:00自動發送`;
                message += `\n🔄 資料來源: 員工管理系統`;
                return message;
            },

            // 本週生日提醒
            weeklyBirthdays: (data) => {
                let message = `🗓️ 本週生日提醒
📅 ${data.weekRange || '本週'}

🎂 本週壽星 (${data.birthdays ? data.birthdays.length : 0}位):`;

                if (data.birthdays && Array.isArray(data.birthdays)) {
                    data.birthdays.forEach(birthday => {
                        message += `\n🎈 ${birthday.date} (${birthday.dayOfWeek}) - ${birthday.name} (${birthday.age}歲)`;
                    });
                }

                message += `\n\n📱 請提前準備生日祝福和小禮物`;
                message += `\n🎁 建議在生日當天給予特別關懷`;
                message += `\n⏰ 每週一08:00自動發送`;
                message += `\n🔄 資料來源: 員工管理系統`;
                return message;
            },

            // 系統驗證報告
            systemReport: (data) => `🚀 GClaude 系統驗證報告
📊 測試概況:
✅ 通過測試: ${data.passedTests || 0}
❌ 失敗測試: ${data.failedTests || 0}
⏱️ 總耗時: ${data.totalTime || 0}秒
📸 截圖數量: ${data.screenshots || 0}

🔍 功能模組測試:
${data.moduleResults ? Object.entries(data.moduleResults).map(([module, result]) => 
    `• ${module}: ${result.status === 'passed' ? '✅' : '❌'} ${result.status}`
).join('\n') : '無測試結果'}

💡 系統建議:
${data.recommendations ? data.recommendations.map(rec => `• ${rec.title}`).join('\n') : '系統運行正常'}

📱 詳細報告請查看系統管理介面`
        };

        // 員工群組通知模板 (簡化版)
        this.templates.employee = {
            newEmployee: (data) => `👋 ${data.name || '新員工'} 新人資料已登錄`,
            
            attendance: (data) => `👋 ${data.employeeName || '員工'} 到 ${data.store || '分店'} 上班了~`,
            
            revenue: (data) => `💰 ${data.store || '分店'} 營業額紀錄成功
🏪 分店: ${data.store || '未知'}
📅 日期: ${data.date || new Date().toISOString().split('T')[0]}
🎯 獎金類別: ${data.bonusType || '平日獎金'}
💵 今日獎金: $${(data.todayBonus || 0).toLocaleString()}`,

            ordering: (data) => `🛒 ${data.date || new Date().toISOString().split('T')[0]} ${data.store || '分店'}
📦 叫貨品項: ${data.itemCount || 0}項
💰 總價: $${(data.totalAmount || 0).toLocaleString()}`,

            promotion: (data) => `🗳️ ${data.candidateName || '員工'} 要準備升遷了，請協助投票`,

            maintenance: (data) => `🔧 ${data.store || '分店'} 維修申請
🛠️ 設備: ${data.equipment || '設備'}
⚠️ ${data.urgency || '一般'}
❗ 原因: ${data.problem || '未描述'}`,

            dataVoided: (data) => `❌ ${data.date || new Date().toISOString().split('T')[0]} ${data.store || '分店'} ${data.dataType || '資料'}作廢`,

            forceScheduling: () => `🚨 強制排班系統已開啟，請盡快完成排班！`,

            schedulingOpen: () => `🚨 排班系統準備開啟，請抽空排班！`,

            schedulingClose: () => `🚨 排班系統準備關閉，請盡快排班！`,

            birthdayWish: (data) => `🎂 生日快樂！
🎉 ${data.name || '員工'} 生日快樂！
🎈 今天是您的 ${data.age || ''}歲生日
🎁 祝您生日快樂，工作順利！
💝 公司全體同仁祝您生日快樂！

⭐ 今天是您的特別日子，享受美好的一天！
🎂 ${data.name || '員工'} 生日快樂！🎉`
        };
    }

    // 發送 Telegram 訊息
    async sendTelegramMessage(chatId, message, options = {}) {
        try {
            const payload = {
                chat_id: chatId,
                text: message,
                parse_mode: options.parseMode || 'HTML',
                disable_web_page_preview: options.disablePreview || true,
                ...options
            };

            const response = await axios.post(`${this.baseUrl}/sendMessage`, payload);
            
            if (response.data.ok) {
                console.log(`✅ Telegram 訊息發送成功 - Chat ID: ${chatId}`);
                this.notificationLog.push({
                    timestamp: new Date().toISOString(),
                    chatId,
                    message: message.substring(0, 100) + '...',
                    success: true,
                    messageId: response.data.result.message_id
                });
                return response.data.result;
            } else {
                throw new Error(`Telegram API Error: ${response.data.description}`);
            }
        } catch (error) {
            console.error(`❌ Telegram 訊息發送失敗:`, error.message);
            this.notificationLog.push({
                timestamp: new Date().toISOString(),
                chatId,
                message: message.substring(0, 100) + '...',
                success: false,
                error: error.message
            });
            throw error;
        }
    }

    // 發送老闆群組通知
    async sendBossNotification(type, data = {}) {
        if (!this.templates.boss[type]) {
            throw new Error(`未找到老闆群組通知模板: ${type}`);
        }

        const message = this.templates.boss[type](data);
        return await this.sendTelegramMessage(this.bossGroupId, message);
    }

    // 發送員工群組通知
    async sendEmployeeNotification(type, data = {}) {
        if (!this.templates.employee[type]) {
            throw new Error(`未找到員工群組通知模板: ${type}`);
        }

        const message = this.templates.employee[type](data);
        return await this.sendTelegramMessage(this.employeeGroupId, message);
    }

    // 發送飛機彙報 (系統驗證專用)
    async sendFlightReport(reportData) {
        const timestamp = new Date().toISOString();
        const reportId = `flight-${Date.now()}`;

        const flightReport = {
            id: reportId,
            timestamp,
            stage: reportData.stage || 1,
            testResults: reportData.testResults || {},
            systemHealth: reportData.systemHealth || {},
            recommendations: reportData.recommendations || [],
            screenshots: reportData.screenshots || [],
            executionTime: reportData.executionTime || 0
        };

        // 生成飛機彙報訊息
        const reportMessage = `✈️ GClaude 飛機彙報 - 階段 ${flightReport.stage}
┌─────────────────────────────────────────────┐
│ 📊 驗證進度彙整                                │
│ ✅ 完成測試: ${flightReport.testResults.passed || 0}項  │
│ ❌ 失敗測試: ${flightReport.testResults.failed || 0}項  │
│ 📈 成功率: ${flightReport.testResults.successRate || 0}%   │
│ ⏱️ 執行時間: ${Math.round(flightReport.executionTime / 1000)}秒      │
│                                           │
│ 🔍 系統健康度分析:                            │
│ 💚 穩定性評分: ${flightReport.systemHealth.stabilityScore || 0}%    │
│ 🚨 錯誤數量: ${flightReport.systemHealth.errorCount || 0}個        │
│ 📱 截圖記錄: ${flightReport.screenshots.length || 0}張        │
│                                           │
│ 💡 重要發現:                                  │
│ ${flightReport.recommendations.slice(0, 3).map(rec => `📌 ${rec.title || '無'}`).join('\n│ ') || '📌 系統運行正常'}     │
│                                           │
│ 🎯 下一步行動:                                │
│ 📋 繼續執行深度功能驗證                         │
│ 🔧 優化發現的問題點                           │
│                                           │
│ 📊 報告編號: ${reportId}                      │
│ 📅 生成時間: ${new Date(timestamp).toLocaleString('zh-TW')} │
│ 🤖 自動生成 by GClaude 智慧驗證系統              │
└─────────────────────────────────────────────┘

🚀 Generated with Claude Code
✈️ 飛機彙報系統 v2.0 - 全自動智慧監控`;

        try {
            // 發送到老闆群組
            await this.sendTelegramMessage(this.bossGroupId, reportMessage);
            
            // 保存飛機彙報記錄
            this.flightReports.push(flightReport);
            
            // 保存本地檔案
            const reportDir = path.join(__dirname, '..', 'flight-reports');
            if (!fs.existsSync(reportDir)) {
                fs.mkdirSync(reportDir, { recursive: true });
            }
            
            const reportFile = path.join(reportDir, `flight-report-${reportId}.json`);
            fs.writeFileSync(reportFile, JSON.stringify(flightReport, null, 2));
            
            const reportTextFile = path.join(reportDir, `flight-report-${reportId}.txt`);
            fs.writeFileSync(reportTextFile, reportMessage);

            console.log(`✈️ 飛機彙報已發送並保存 - 報告編號: ${reportId}`);
            console.log(`📁 報告檔案: ${reportFile}`);
            
            return flightReport;
            
        } catch (error) {
            console.error(`❌ 飛機彙報發送失敗:`, error.message);
            throw error;
        }
    }

    // 驗證 Telegram Bot 連接
    async testConnection() {
        try {
            const response = await axios.get(`${this.baseUrl}/getMe`);
            
            if (response.data.ok) {
                console.log(`✅ Telegram Bot 連接成功:`);
                console.log(`   Bot 名稱: ${response.data.result.first_name}`);
                console.log(`   Bot 用戶名: @${response.data.result.username}`);
                console.log(`   Bot ID: ${response.data.result.id}`);
                return true;
            } else {
                throw new Error(`Bot 驗證失敗: ${response.data.description}`);
            }
        } catch (error) {
            console.error(`❌ Telegram Bot 連接失敗:`, error.message);
            return false;
        }
    }

    // 發送測試訊息
    async sendTestMessage() {
        const testMessage = `🧪 GClaude 系統測試訊息
⏰ 時間: ${new Date().toLocaleString('zh-TW')}
🤖 來源: GClaude 智慧驗證系統
📱 狀態: 通知系統正常運作

✅ 所有通知功能已就緒
🚀 準備執行深度系統驗證`;

        try {
            await this.sendTelegramMessage(this.bossGroupId, testMessage);
            return true;
        } catch (error) {
            console.error('測試訊息發送失敗:', error.message);
            return false;
        }
    }

    // 獲取通知統計
    getNotificationStats() {
        const total = this.notificationLog.length;
        const successful = this.notificationLog.filter(log => log.success).length;
        const failed = total - successful;

        return {
            total,
            successful,
            failed,
            successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
            flightReports: this.flightReports.length
        };
    }
}

// 如果直接執行此腳本，進行連接測試
if (require.main === module) {
    const reporter = new GClaudeTelegramFlightReporter();
    
    console.log('🚀 正在測試 GClaude Telegram 飛機彙報系統...');
    
    reporter.testConnection()
        .then(connected => {
            if (connected) {
                return reporter.sendTestMessage();
            } else {
                throw new Error('Bot 連接失敗');
            }
        })
        .then(sent => {
            if (sent) {
                console.log('✅ 測試完成！通知系統正常運作');
                
                // 發送示例飛機彙報
                return reporter.sendFlightReport({
                    stage: 1,
                    testResults: { passed: 8, failed: 2, successRate: 80 },
                    systemHealth: { stabilityScore: 85, errorCount: 3 },
                    recommendations: [
                        { title: '修復登入模組問題' },
                        { title: '優化頁面載入速度' },
                        { title: '加強錯誤處理機制' }
                    ],
                    screenshots: ['test1.png', 'test2.png'],
                    executionTime: 45000
                });
            }
        })
        .then(() => {
            console.log('🎉 飛機彙報系統測試完成！');
            console.log('\n📊 通知統計:', reporter.getNotificationStats());
        })
        .catch(error => {
            console.error('💥 測試失敗:', error.message);
            process.exit(1);
        });
}

module.exports = GClaudeTelegramFlightReporter;