/**
 * Telegram 通知系統模組
 * 按照系統邏輯.txt和通知模板.txt規格實現
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class TelegramNotificationSystem {
    constructor() {
        this.config = {
            botToken: process.env.TELEGRAM_BOT_TOKEN || '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc',
            bossGroupId: process.env.TELEGRAM_BOSS_GROUP_ID || '-1002658082392',
            employeeGroupId: process.env.TELEGRAM_EMPLOYEE_GROUP_ID || '-1002658082392'
        };
    }

    // 發送訊息到指定群組
    async sendMessage(chatId, message, options = {}) {
        try {
            const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
            
            const messageData = {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                ...options
            };

            const response = await axios.post(url, messageData);
            
            if (response.data.ok) {
                console.log(`✅ Telegram訊息發送成功: ${chatId}`);
                return true;
            } else {
                console.error(`❌ Telegram訊息發送失敗:`, response.data);
                return false;
            }

        } catch (error) {
            console.error('❌ Telegram發送錯誤:', error.message);
            return false;
        }
    }

    // 登入通知
    async sendLoginNotification(user, location = {}) {
        const loginTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        // 老闆群組通知 (詳細)
        const bossMessage = `🔐 員工登入記錄
👤 員工: ${user.name}
⏰ 時間: ${loginTime}
🏪 分店: ${user.department_name || '未指定'}
💼 職位: ${this.getRoleText(user.role)}
📱 設備: ${location.device || 'Unknown'}
📍 IP位置: ${location.ip || 'Unknown'}`;

        // 只發送給老闆群組
        await this.sendMessage(this.config.bossGroupId, bossMessage);
    }

    // 營收提交通知
    async sendRevenueNotification(data) {
        const submitTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        // 計算獎金
        const bonusInfo = this.calculateBonus(data);

        // 老闆群組通知 (詳細)
        const bossMessage = `💰 營業額提交記錄

分店: ${data.store_name}
提交人: ${data.employee_name}
日期: ${data.date}
現場訂單: ${data.order_count || 0} 張

收入明細:
${this.formatIncomeDetails(data.income_items)}

支出明細:
${this.formatExpenseDetails(data.expense_items)}

收入總額: $${data.total_income?.toLocaleString() || 0}
支出總額: $${data.total_expense?.toLocaleString() || 0}
淨收入: $${(data.total_income - data.total_expense)?.toLocaleString() || 0}

獎金類別: ${data.bonus_type}
今日獎金: ${bonusInfo.amount >= 0 ? `$${bonusInfo.amount.toLocaleString()}` : `未達標，差距 $${Math.abs(bonusInfo.amount).toLocaleString()}`}
訂單平均: $${data.order_count > 0 ? Math.round(data.total_income / data.order_count).toLocaleString() : 0}/單
備註: ${data.notes || '無'}

提交時間: ${submitTime}`;

        // 員工群組通知 (簡化)
        const employeeMessage = `💰 ${data.store_name} 營業額記錄成功
分店: ${data.store_name}
日期: ${data.date}
獎金類別: ${data.bonus_type}
今日獎金: ${bonusInfo.amount >= 0 ? `$${bonusInfo.amount.toLocaleString()}` : `未達標，差距 $${Math.abs(bonusInfo.amount).toLocaleString()}`}`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 叫貨記錄通知
    async sendOrderNotification(orderData) {
        const submitTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        // 按廠商分類
        const supplierGroups = this.groupOrdersBySupplier(orderData.items);

        // 老闆群組通知 (詳細 + 異常分析)
        let bossMessage = `🛒 叫貨記錄
叫貨人員: ${orderData.employee_name}
📅 送貨日期: ${orderData.delivery_date}
🏪 分店: ${orderData.store_name}
💰 總金額: $${orderData.total_amount?.toLocaleString() || 0}

`;

        // 添加廠商分類
        for (const [supplier, items] of Object.entries(supplierGroups)) {
            bossMessage += `🏭 ${supplier}\n`;
            items.forEach(item => {
                bossMessage += `  • ${item.brand} ${item.name} ${item.quantity} ${item.unit}\n`;
            });
        }

        // 添加異常分析
        const anomalies = await this.analyzeOrderAnomalies(orderData);
        if (anomalies.length > 0) {
            bossMessage += '\n📊 異常分析:\n';
            anomalies.forEach(anomaly => {
                bossMessage += `⚠️ ${anomaly.message}\n`;
            });
        }

        // 員工群組通知 (簡化)
        const employeeMessage = `🛒 叫貨記錄
📅 送貨日期: ${orderData.delivery_date}
🏪 分店: ${orderData.store_name}
💰 總金額: $${orderData.total_amount?.toLocaleString() || 0}

📦 叫貨品項: ${orderData.items.length}項
💰 總價: $${orderData.total_amount?.toLocaleString() || 0}`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 打卡通知
    async sendAttendanceNotification(attendanceData) {
        // 安全的日期處理，避免Invalid Date錯誤
        let clockTime;
        try {
            const timestamp = attendanceData.timestamp || attendanceData.clock_time || new Date();
            clockTime = new Date(timestamp).toLocaleString('zh-TW', {
                timeZone: 'Asia/Taipei',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            clockTime = new Date().toLocaleString('zh-TW', {
                timeZone: 'Asia/Taipei'
            });
        }

        // 計算遲到分鐘數
        const lateInfo = this.calculateLateMinutes(attendanceData);

        // 老闆群組通知 (詳細)
        const bossMessage = `🕐 員工打卡記錄
👤 員工: ${attendanceData.employee_name || attendanceData.username || '未知員工'}
⏰ 時間: ${clockTime}
🏪 分店: ${attendanceData.store_name || attendanceData.department_name || '未指定分店'}
📍 座標: ${attendanceData.latitude || 'N/A'}, ${attendanceData.longitude || 'N/A'}
📏 距離: ${attendanceData.distance || 'N/A'}公尺
📱 設備: ${attendanceData.device_info || attendanceData.user_agent || '未知設備'}
✅ 狀態: ${attendanceData.status === 'check_in' ? '上班打卡' : '下班打卡'}
${lateInfo ? `⏰ 遲到：${lateInfo}` : ''}`;

        // 員工群組通知 (簡化)
        const employeeName = attendanceData.employee_name || attendanceData.username || '員工';
        const storeName = attendanceData.store_name || attendanceData.department_name || '分店';
        const employeeMessage = `👋 ${employeeName} 到 ${storeName} ${attendanceData.status === 'check_in' ? '上班了~' : '下班了~'}`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 維修申請通知
    async sendMaintenanceNotification(maintenanceData) {
        const submitTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        // 老闆群組通知 (詳細)
        const bossMessage = `🔧 維修申請
📅 日期: ${submitTime}
🏪 分店: ${maintenanceData.store_name}
👤 申請人: ${maintenanceData.employee_name}
🛠️ 設備: ${maintenanceData.equipment}
⚠️ 緊急程度: ${maintenanceData.urgency}
🏷️ 類別: ${maintenanceData.category}
❗ 問題: ${maintenanceData.description}
📷 照片: ${maintenanceData.photo_count || 0}張`;

        // 員工群組通知 (簡化)
        const employeeMessage = `🔧 ${maintenanceData.store_name} 維修申請
🛠️ 設備: ${maintenanceData.equipment}
⚠️ ${maintenanceData.urgency}
❗ 原因: ${maintenanceData.description}`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 作廢通知
    async sendCancellationNotification(cancellationData) {
        const cancelTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        // 老闆群組通知
        const bossMessage = `❌ 數據作廢記錄
📅 日期: ${cancelTime}
👤 員工: ${cancellationData.employee_name}
🏪 分店: ${cancellationData.store_name}
📋 類型: ${cancellationData.data_type}
💭 原因: ${cancellationData.reason}
📄 原始數據: ${cancellationData.original_data}`;

        // 員工群組通知
        const employeeMessage = `❌ ${cancelTime.split(' ')[0]} ${cancellationData.store_name} ${cancellationData.data_type}作廢`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 輔助方法
    getRoleText(role) {
        const roleMap = {
            'admin': '系統管理員',
            'manager': '經理',
            'supervisor': '主管',
            'employee': '員工',
            'intern': '實習生'
        };
        return roleMap[role] || role;
    }

    formatIncomeDetails(incomeItems) {
        if (!incomeItems || typeof incomeItems !== 'object') return '• 無收入記錄';
        
        return Object.entries(incomeItems)
            .filter(([key, value]) => value > 0)
            .map(([key, value]) => `• ${this.getIncomeItemName(key)}: $${value.toLocaleString()}`)
            .join('\n');
    }

    formatExpenseDetails(expenseItems) {
        if (!expenseItems || typeof expenseItems !== 'object') return '• 無支出記錄';
        
        return Object.entries(expenseItems)
            .filter(([key, value]) => value > 0)
            .map(([key, value]) => `• ${this.getExpenseItemName(key)}: $${value.toLocaleString()}`)
            .join('\n');
    }

    getIncomeItemName(key) {
        const incomeMap = {
            'on_site_sales': '現場營業額',
            'online_orders': '線上點餐',
            'panda_orders': '熊貓點餐',
            'uber_orders': 'uber點餐',
            'oil_recycling': '廢油回收'
        };
        return incomeMap[key] || key;
    }

    getExpenseItemName(key) {
        const expenseMap = {
            'gas': '瓦斯',
            'utilities': '水電',
            'rent': '房租',
            'supplies': '貨款',
            'cleaning': '清潔費',
            'others': '其他'
        };
        return expenseMap[key] || key;
    }

    calculateBonus(revenueData) {
        // 實現獎金計算邏輯
        const totalIncome = revenueData.total_income || 0;
        let threshold, percentage;

        if (revenueData.bonus_type === '平日獎金') {
            threshold = 13000;
            percentage = 0.30;
        } else {
            threshold = 0;
            percentage = 0.38;
        }

        const bonusAmount = totalIncome >= threshold ? 
            Math.round((totalIncome - threshold) * percentage) : 
            threshold - totalIncome;

        return {
            amount: totalIncome >= threshold ? bonusAmount : -bonusAmount,
            achieved: totalIncome >= threshold
        };
    }

    groupOrdersBySupplier(items) {
        const groups = {};
        items.forEach(item => {
            const supplier = item.supplier || '未指定廠商';
            if (!groups[supplier]) {
                groups[supplier] = [];
            }
            groups[supplier].push(item);
        });
        return groups;
    }

    async analyzeOrderAnomalies(orderData) {
        // 實現異常分析邏輯
        const anomalies = [];
        // 這裡需要查詢資料庫來分析異常
        // 暫時返回空陣列，後續實現
        return anomalies;
    }

    calculateLateMinutes(attendanceData) {
        // 實現遲到計算邏輯
        if (!attendanceData.expected_time || !attendanceData.actual_time) {
            return null;
        }
        
        const expected = new Date(attendanceData.expected_time);
        const actual = new Date(attendanceData.actual_time);
        const diffMinutes = Math.round((actual - expected) / 60000);
        
        if (diffMinutes > 0) {
            return `遲到${diffMinutes}分鐘`;
        }
        return null;
    }

    // 🍰 員工生日通知
    async sendBirthdayNotification(employeeData) {
        const today = new Date().toLocaleDateString('zh-TW');
        
        const bossMessage = `🎂 員工生日提醒
👤 員工: ${employeeData.name}
🏪 分店: ${employeeData.department_name || '未指定'}
💼 職位: ${this.getRoleText(employeeData.role)}
🎂 生日: ${today}
💝 建議: 可準備生日驚喜或獎勵`;

        const employeeMessage = `🎉 今天是 ${employeeData.name} 的生日！
🎂 讓我們一起祝福壽星！
🎁 生日快樂！`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 👤 新員工註冊通知
    async sendNewEmployeeNotification(employeeData) {
        const registrationTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        const bossMessage = `👥 新員工註冊
👤 姓名: ${employeeData.name}
📱 帳號: ${employeeData.username}
🏪 分店: ${employeeData.department_name}
💼 職位: ${this.getRoleText(employeeData.role)}
📞 電話: ${employeeData.phone || '未提供'}
📧 Email: ${employeeData.email || '未提供'}
📅 註冊時間: ${registrationTime}
🔑 狀態: 待審核`;

        const employeeMessage = `👋 歡迎新夥伴 ${employeeData.name} 加入我們！
🏪 分店: ${employeeData.department_name}
💼 職位: ${this.getRoleText(employeeData.role)}`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 📅 排班通知
    async sendScheduleNotification(scheduleData) {
        const scheduleDate = new Date(scheduleData.date).toLocaleDateString('zh-TW');

        const bossMessage = `📅 排班異動通知
📆 日期: ${scheduleDate}
🏪 分店: ${scheduleData.store_name}
👤 員工: ${scheduleData.employee_name}
⏰ 班次: ${scheduleData.shift_time}
🔄 異動類型: ${scheduleData.change_type}
💭 原因: ${scheduleData.reason || '無'}
👨‍💼 操作人: ${scheduleData.manager_name}`;

        const employeeMessage = `📅 排班更新通知
📆 ${scheduleDate}
🏪 ${scheduleData.store_name}
⏰ ${scheduleData.shift_time}
${scheduleData.change_type === '新增' ? '✅' : scheduleData.change_type === '取消' ? '❌' : '🔄'} ${scheduleData.change_type}排班`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 🗳️ 投票通知
    async sendVotingNotification(voteData) {
        const endDate = new Date(voteData.end_date).toLocaleDateString('zh-TW');

        const bossMessage = `🗳️ 投票活動通知
📝 標題: ${voteData.title}
📄 內容: ${voteData.description}
🏪 適用分店: ${voteData.target_stores || '全部'}
👥 目標對象: ${voteData.target_roles || '全體員工'}
📅 截止日期: ${endDate}
📊 目前票數: ${voteData.current_votes || 0}票
🎯 發起人: ${voteData.creator_name}`;

        const employeeMessage = `🗳️ 新投票活動
📝 ${voteData.title}
📄 ${voteData.description}
📅 截止: ${endDate}
👉 請至系統參與投票！`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 📦 公司庫存異常通知
    async sendInventoryAlertNotification(alertData) {
        const alertTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        let alertIcon = '⚠️';
        let alertType = '庫存異常';
        
        if (alertData.type === 'low_stock') {
            alertIcon = '📉';
            alertType = '公司庫存不足';
        } else if (alertData.type === 'out_of_stock') {
            alertIcon = '🚫';
            alertType = '公司庫存耗盡';
        }

        // 管理員群組通知 (詳細的公司庫存信息)
        const bossMessage = `${alertIcon} ${alertType}警告
🏢 公司總庫存警告
📦 商品: ${alertData.product_name}
🏷️ 品牌: ${alertData.brand || '未指定'}
📊 公司總庫存: ${alertData.current_stock}
⚠️ 安全庫存: ${alertData.min_stock}
📅 最後進貨: ${alertData.last_purchase_date || '無記錄'}
📈 近期消耗: ${alertData.recent_consumption || '未知'}/日
🏪 需求分店: ${alertData.requesting_stores ? alertData.requesting_stores.join(', ') : '多間分店'}
🔔 檢測時間: ${alertTime}
💡 建議: 立即聯繫供應商進貨
📞 供應商: ${alertData.supplier_contact || '請查看供應商名冊'}`;

        // 員工群組通知 (簡化的公司庫存狀況)
        const employeeMessage = `${alertIcon} 公司庫存提醒
📦 ${alertData.product_name} 公司庫存不足
📊 總庫存: ${alertData.current_stock}
⚠️ 安全值: ${alertData.min_stock}
🏪 如需叫貨請提前申請
📝 可能影響各分店補貨`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 📈 公司採購頻率異常通知
    async sendOrderFrequencyAlert(frequencyData) {
        let alertIcon = '📊';
        let alertType = '採購頻率異常';
        
        if (frequencyData.type === 'too_frequent') {
            alertIcon = '⚡';
            alertType = '進貨過於頻繁';
        } else if (frequencyData.type === 'too_rare') {
            alertIcon = '⏰';
            alertType = '進貨間隔過久';
        }

        const bossMessage = `${alertIcon} ${alertType}
🏢 公司採購分析
📦 商品: ${frequencyData.product_name}
🏷️ 品牌: ${frequencyData.brand || '未指定'}
📊 目前進貨頻率: ${frequencyData.frequency_days}天/次
⚠️ 建議進貨頻率: ${frequencyData.normal_frequency_days}天/次
📅 上次進貨: ${frequencyData.last_purchase_date}
📈 近期進貨次數: ${frequencyData.recent_purchases}次
🏪 各分店總需求: ${frequencyData.total_store_demand || '未統計'}/週
📊 公司總庫存: ${frequencyData.current_total_stock || '未知'}
💡 建議: ${frequencyData.recommendation}
📞 供應商: ${frequencyData.supplier_name || '請查詢'}`;

        const employeeMessage = `${alertIcon} 公司採購提醒
📦 ${frequencyData.product_name}
${frequencyData.type === 'too_frequent' ? '⚡ 公司進貨頻率較高，庫存充足' : '⏰ 公司可能需要進貨，叫貨請提前申請'}
📊 庫存狀況: ${frequencyData.current_total_stock ? `剩餘${frequencyData.current_total_stock}` : '請詢問管理員'}`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 🚨 品項異常通知
    async sendProductAnomalyNotification(anomalyData) {
        const anomalyTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        const bossMessage = `🚨 品項異常警告
🏪 分店: ${anomalyData.store_name}
📦 商品: ${anomalyData.product_name}
⚠️ 異常類型: ${anomalyData.anomaly_type}
📊 異常數據: ${anomalyData.anomaly_details}
📅 發現時間: ${anomalyTime}
🔍 可能原因: ${anomalyData.possible_cause}
💡 建議處理: ${anomalyData.recommendation}
🆘 緊急程度: ${anomalyData.urgency_level}`;

        const employeeMessage = `🚨 品項異常
🏪 ${anomalyData.store_name}
📦 ${anomalyData.product_name}
⚠️ ${anomalyData.anomaly_type}
🔍 請檢查該品項狀況`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 🛠️ 系統錯誤通知
    async sendSystemErrorNotification(errorData) {
        const errorTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        const bossMessage = `🚨 系統錯誤警告
🏪 分店: ${errorData.store_name || '系統'}
👤 用戶: ${errorData.username || '系統'}
🛠️ 模組: ${errorData.module_name}
❌ 錯誤: ${errorData.error_message}
📅 發生時間: ${errorTime}
🔍 錯誤詳情: ${errorData.error_details || '無'}
💻 瀏覽器: ${errorData.user_agent || '未知'}
🆘 嚴重程度: ${errorData.severity_level || '中等'}`;

        // 只發送給管理員群組
        await this.sendMessage(this.config.bossGroupId, bossMessage);
    }

    // =================== 維修申請相關的通知方法 ===================

    // 維修申請提交通知
    async sendMaintenanceRequestNotification(maintenanceData) {
        const submitTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        const bossMessage = `🔧 新維修申請
📋 申請編號: ${maintenanceData.request_number}
👤 申請人: ${maintenanceData.requested_by_name}
🏪 分店: ${maintenanceData.store_name || '總部'}
📍 位置: ${maintenanceData.location}
🛠️ 標題: ${maintenanceData.title}
❗ 問題描述: ${maintenanceData.description}
⚠️ 緊急程度: ${maintenanceData.urgency}
🏷️ 類別: ${maintenanceData.category}
💰 預估費用: ${maintenanceData.estimated_cost ? `$${maintenanceData.estimated_cost.toLocaleString()}` : '待評估'}
📷 照片: ${maintenanceData.photos ? maintenanceData.photos.split(',').length : 0}張
⏰ 提交時間: ${submitTime}
📝 備註: ${maintenanceData.notes || '無'}`;

        const employeeMessage = `🔧 維修申請已提交
📋 編號: ${maintenanceData.request_number}
🛠️ ${maintenanceData.title}
📍 ${maintenanceData.location}
⚠️ ${maintenanceData.urgency}
👤 申請人: ${maintenanceData.requested_by_name}`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 維修狀態更新通知
    async sendMaintenanceStatusUpdateNotification(maintenanceData) {
        const updateTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        const statusEmoji = {
            'pending': '⏳',
            'processing': '🔄',
            'completed': '✅',
            'cancelled': '❌',
            'assigned': '👷'
        };

        const statusText = {
            'pending': '待處理',
            'processing': '處理中',
            'completed': '已完成',
            'cancelled': '已取消',
            'assigned': '已指派'
        };

        const bossMessage = `${statusEmoji[maintenanceData.status]} 維修狀態更新
📋 申請編號: ${maintenanceData.request_number}
🛠️ 標題: ${maintenanceData.title}
📍 位置: ${maintenanceData.location}
🔄 狀態: ${statusText[maintenanceData.status]}
👤 申請人: ${maintenanceData.requested_by_name}
${maintenanceData.assigned_to_name ? `👷 維修人員: ${maintenanceData.assigned_to_name}` : ''}
💰 預估費用: ${maintenanceData.estimated_cost ? `$${maintenanceData.estimated_cost.toLocaleString()}` : '待評估'}
${maintenanceData.actual_cost ? `💰 實際費用: $${maintenanceData.actual_cost.toLocaleString()}` : ''}
${maintenanceData.estimated_completion ? `📅 預計完成: ${new Date(maintenanceData.estimated_completion).toLocaleString('zh-TW')}` : ''}
${maintenanceData.actual_completion ? `✅ 實際完成: ${new Date(maintenanceData.actual_completion).toLocaleString('zh-TW')}` : ''}
⏰ 更新時間: ${updateTime}
📝 備註: ${maintenanceData.notes || '無'}`;

        const employeeMessage = `${statusEmoji[maintenanceData.status]} 維修申請更新
📋 ${maintenanceData.request_number}
🛠️ ${maintenanceData.title}
🔄 狀態: ${statusText[maintenanceData.status]}
${maintenanceData.assigned_to_name ? `👷 維修人員: ${maintenanceData.assigned_to_name}` : ''}`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // =================== 員工審核相關的通知方法 ===================

    // 員工申請審核通知
    async sendEmployeeApprovalNotification(employeeData) {
        const submitTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        const bossMessage = `👥 員工申請待審核
👤 姓名: ${employeeData.name}
📱 帳號: ${employeeData.username}
💼 申請職位: ${this.getRoleText(employeeData.role)}
🏪 申請分店: ${employeeData.department_name}
📞 電話: ${employeeData.phone}
📧 Email: ${employeeData.email}
📅 申請時間: ${submitTime}
🆔 身分證: ${employeeData.id_number || '未提供'}
🎂 生日: ${employeeData.birth_date}
👫 性別: ${employeeData.gender}
🏠 地址: ${employeeData.address}
📞 緊急聯絡人: ${employeeData.emergency_contact_name} (${employeeData.emergency_contact_relation}) - ${employeeData.emergency_contact_phone}
💰 期望薪資: ${employeeData.expected_salary ? `$${employeeData.expected_salary.toLocaleString()}` : '面議'}
📝 自我介紹: ${employeeData.introduction || '無'}
🔑 狀態: 待管理員審核批准`;

        const employeeMessage = `👥 新員工申請
👤 ${employeeData.name} 申請加入
💼 職位: ${this.getRoleText(employeeData.role)}
🏪 分店: ${employeeData.department_name}
📅 申請時間: ${submitTime}`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 員工審核結果通知
    async sendEmployeeApprovalResultNotification(approvalData) {
        const resultTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        const resultEmoji = approvalData.approved ? '✅' : '❌';
        const resultText = approvalData.approved ? '通過' : '未通過';

        const bossMessage = `${resultEmoji} 員工審核${resultText}
👤 申請人: ${approvalData.applicant_name}
📱 帳號: ${approvalData.username}
💼 申請職位: ${this.getRoleText(approvalData.role)}
🏪 申請分店: ${approvalData.department_name}
👨‍💼 審核人: ${approvalData.approved_by_name}
⏰ 審核時間: ${resultTime}
📝 審核意見: ${approvalData.approval_notes || '無'}
${approvalData.approved ? '🎉 歡迎新同事加入團隊！' : '💭 如需重新申請請聯繫管理員'}`;

        const employeeMessage = `${resultEmoji} 員工申請${resultText}
👤 ${approvalData.applicant_name}
💼 ${this.getRoleText(approvalData.role)}
🏪 ${approvalData.department_name}
${approvalData.approved ? '🎉 歡迎加入團隊！' : ''}`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // =================== 升遷投票相關的通知方法 ===================

    // 升遷投票開始通知
    async sendPromotionVoteStartNotification(voteData) {
        const startTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });
        const endTime = new Date(voteData.end_date).toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        const bossMessage = `🗳️ 升遷投票開始
📝 投票標題: ${voteData.title}
👤 候選人: ${voteData.candidate_name}
💼 目前職位: ${this.getRoleText(voteData.current_role)}
⬆️ 申請職位: ${voteData.target_position}
🏪 所屬分店: ${voteData.department_name}
📄 申請理由: ${voteData.description}
👨‍💼 發起人: ${voteData.creator_name}
⏰ 開始時間: ${startTime}
⏰ 截止時間: ${endTime}
🎯 投票代號: ${voteData.session_id}
📊 投票狀態: ${voteData.status === 'active' ? '進行中' : '待開始'}
📋 評分說明: 1-5分，5分為最高評價
🔗 投票頁面: /promotions/vote/${voteData.session_id}`;

        const employeeMessage = `🗳️ 升遷投票開始
📝 ${voteData.title}
👤 候選人: ${voteData.candidate_name}
⬆️ 申請職位: ${voteData.target_position}
⏰ 截止時間: ${endTime}
👉 請登入系統參與投票！
📋 評分範圍: 1-5分`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 升遷投票進行中通知
    async sendPromotionVoteNotification(voteData) {
        const voteTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        const bossMessage = `🗳️ 升遷投票進度
📝 投票標題: ${voteData.title}
👤 候選人: ${voteData.candidate_name}
⬆️ 申請職位: ${voteData.target_position}
📊 目前票數: ${voteData.total_votes}票
⭐ 平均評分: ${voteData.average_score ? voteData.average_score.toFixed(2) : '0.00'}分
👥 最新投票: ${voteData.latest_voter_name} (${voteData.latest_vote_value}分)
💭 投票理由: ${voteData.latest_vote_reason || '無'}
⏰ 投票時間: ${voteTime}
📅 截止時間: ${new Date(voteData.end_date).toLocaleString('zh-TW')}
🎯 投票代號: ${voteData.session_id}`;

        // 員工群組只通知投票進度（不顯示具體評分）
        const employeeMessage = `🗳️ 升遷投票進度更新
📝 ${voteData.title}
👤 候選人: ${voteData.candidate_name}
📊 目前票數: ${voteData.total_votes}票
📅 截止時間: ${new Date(voteData.end_date).toLocaleString('zh-TW')}
👉 尚未投票的同事請把握時間！`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 升遷投票結果通知
    async sendPromotionResultNotification(resultData) {
        const resultTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });

        const resultEmoji = resultData.result === 'approved' ? '✅' : '❌';
        const resultText = resultData.result === 'approved' ? '通過' : '未通過';

        const bossMessage = `${resultEmoji} 升遷投票結果 - ${resultText}
📝 投票標題: ${resultData.title}
👤 候選人: ${resultData.candidate_name}
💼 目前職位: ${this.getRoleText(resultData.current_role)}
⬆️ 申請職位: ${resultData.target_position}
🏪 所屬分店: ${resultData.department_name}

📊 投票統計:
• 總票數: ${resultData.total_votes}票
• 贊成票: ${resultData.approve_votes}票 (${resultData.total_votes > 0 ? ((resultData.approve_votes / resultData.total_votes) * 100).toFixed(1) : 0}%)
• 反對票: ${resultData.reject_votes}票 (${resultData.total_votes > 0 ? ((resultData.reject_votes / resultData.total_votes) * 100).toFixed(1) : 0}%)
• 平均評分: ${resultData.average_score ? resultData.average_score.toFixed(2) : '0.00'}分 / 5分

📅 投票期間: ${new Date(resultData.start_date).toLocaleDateString('zh-TW')} - ${new Date(resultData.end_date).toLocaleDateString('zh-TW')}
⏰ 結果公布: ${resultTime}
🎯 投票代號: ${resultData.session_id}

${resultData.result === 'approved' ? '🎉 恭喜升遷成功！' : '💭 下次再接再厲！'}`;

        const employeeMessage = `${resultEmoji} 升遷投票結果 - ${resultText}
📝 ${resultData.title}
👤 候選人: ${resultData.candidate_name}
⬆️ 申請職位: ${resultData.target_position}
📊 總票數: ${resultData.total_votes}票
⭐ 平均評分: ${resultData.average_score ? resultData.average_score.toFixed(2) : '0.00'}分
⏰ 結果公布: ${resultTime}
${resultData.result === 'approved' ? '🎉 恭喜升遷成功！' : ''}`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }

    // 升遷投票催促通知
    async sendPromotionVoteReminderNotification(reminderData) {
        const reminderTime = new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });
        const endTime = new Date(reminderData.end_date).toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei'
        });
        
        const hoursLeft = Math.ceil((new Date(reminderData.end_date) - new Date()) / (1000 * 60 * 60));

        const bossMessage = `⏰ 升遷投票即將截止
📝 投票標題: ${reminderData.title}
👤 候選人: ${reminderData.candidate_name}
⬆️ 申請職位: ${reminderData.target_position}
📊 目前票數: ${reminderData.total_votes}票
⏰ 剩餘時間: ${hoursLeft}小時
📅 截止時間: ${endTime}
👥 尚未投票人數: ${reminderData.pending_voters_count}人
📋 尚未投票員工: ${reminderData.pending_voters ? reminderData.pending_voters.join(', ') : '請查看系統'}
🔔 提醒時間: ${reminderTime}`;

        const employeeMessage = `⏰ 升遷投票即將截止
📝 ${reminderData.title}
👤 候選人: ${reminderData.candidate_name}
⏰ 剩餘時間: ${hoursLeft}小時
📅 截止時間: ${endTime}
🚨 尚未投票的同事請盡快完成投票！`;

        await Promise.all([
            this.sendMessage(this.config.bossGroupId, bossMessage),
            this.sendMessage(this.config.employeeGroupId, employeeMessage)
        ]);
    }
}

module.exports = TelegramNotificationSystem;