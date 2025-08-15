const fetch = require('node-fetch');

class TelegramNotifier {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN || '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc';
        this.bossGroupId = process.env.TELEGRAM_BOSS_GROUP_ID || '-1002658082392';
        this.employeeGroupId = process.env.TELEGRAM_EMPLOYEE_GROUP_ID || '-1002658082392';
        this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
    }

    async sendMessage(groupId, message, options = {}) {
        try {
            const payload = {
                chat_id: groupId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                ...options
            };

            const response = await fetch(`${this.apiBase}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (!result.ok) {
                throw new Error(`Telegram API error: ${result.description}`);
            }
            
            return result;
        } catch (error) {
            console.error('Telegram notification failed:', error);
            throw error;
        }
    }

    async sendToBoss(message, options = {}) {
        return await this.sendMessage(this.bossGroupId, message, options);
    }

    async sendToEmployees(message, options = {}) {
        return await this.sendMessage(this.employeeGroupId, message, options);
    }

    async sendToBoth(bossMessage, employeeMessage) {
        const promises = [
            this.sendToBoss(bossMessage),
            this.sendToEmployees(employeeMessage)
        ];
        return await Promise.all(promises);
    }

    // ==================== 營收系統通知 ====================
    async notifyRevenue(data) {
        const date = new Date(data.date).toLocaleDateString('zh-TW');
        const dayType = data.day_type === 'holiday' ? '假日' : '平日';
        const storeName = data.store_name || '未知分店';
        
        // 老闆詳細通知
        const bossMessage = `
🏪 <b>${storeName} 營收記錄</b>

📅 <b>日期:</b> ${date} (${dayType})
💰 <b>營業額:</b> NT$ ${data.amount?.toLocaleString() || 0}
🎯 <b>目標:</b> NT$ ${data.target?.toLocaleString() || 0}
📊 <b>達成率:</b> ${data.achievement_rate ? (data.achievement_rate * 100).toFixed(1) : 0}%
💸 <b>獎金:</b> NT$ ${data.bonus?.toLocaleString() || 0}

${data.achievement_rate < 1 ? 
    `⚠️ <b>未達標差距:</b> NT$ ${((data.target || 0) - (data.amount || 0)).toLocaleString()}` :
    '✅ <b>已達成目標!</b>'
}

📝 <b>備註:</b> ${data.notes || '無'}
👤 <b>記錄員工:</b> ${data.employee_name || '系統'}
⏰ <b>記錄時間:</b> ${new Date().toLocaleString('zh-TW')}
        `.trim();

        // 員工簡化通知
        const employeeMessage = `
📅 <b>${date} ${storeName} 營收記錄</b>

💰 營業額: NT$ ${data.amount?.toLocaleString() || 0}
🎯 今日獎金 (${dayType}): NT$ ${data.bonus?.toLocaleString() || 0}

${data.achievement_rate < 1 ? 
    `未達標差距: NT$ ${((data.target || 0) - (data.amount || 0)).toLocaleString()}` :
    '✅ 已達成目標!'
}
        `.trim();

        return await this.sendToBoth(bossMessage, employeeMessage);
    }

    // ==================== 叫貨系統通知 ====================
    async notifyOrdering(orderData, anomalies = []) {
        const date = new Date(orderData.created_at).toLocaleDateString('zh-TW');
        const storeName = orderData.store_name || '未知分店';
        
        // 計算總價
        const totalAmount = orderData.items.reduce((sum, item) => 
            sum + (item.quantity * item.unit_price), 0);

        // 員工通知
        const employeeMessage = `
🛒 <b>${storeName} 叫貨記錄</b>

📅 <b>日期:</b> ${date}
🏪 <b>分店:</b> ${storeName}
💰 <b>總價:</b> NT$ ${totalAmount.toLocaleString()}

📦 <b>叫貨品項:</b>
${orderData.items.map(item => 
    `• ${item.product_name} x${item.quantity} = NT$ ${(item.quantity * item.unit_price).toLocaleString()}`
).join('\n')}

👤 <b>叫貨員工:</b> ${orderData.employee_name || '系統'}
        `.trim();

        // 老闆詳細通知（按供應商分類）
        const supplierGroups = {};
        orderData.items.forEach(item => {
            const supplier = item.supplier || '未知供應商';
            if (!supplierGroups[supplier]) {
                supplierGroups[supplier] = [];
            }
            supplierGroups[supplier].push(item);
        });

        let bossMessage = `
🛒 <b>${storeName} 叫貨分析</b>

📅 <b>日期:</b> ${date}
🏪 <b>分店:</b> ${storeName}
💰 <b>總價:</b> NT$ ${totalAmount.toLocaleString()}

📊 <b>供應商分類:</b>
`;

        Object.entries(supplierGroups).forEach(([supplier, items]) => {
            const supplierTotal = items.reduce((sum, item) => 
                sum + (item.quantity * item.unit_price), 0);
            
            bossMessage += `\n🏭 <b>${supplier}</b> (NT$ ${supplierTotal.toLocaleString()})\n`;
            items.forEach(item => {
                bossMessage += `  • ${item.product_name} x${item.quantity}\n`;
            });
        });

        // 添加異常警告
        if (anomalies.length > 0) {
            bossMessage += '\n⚠️ <b>進貨異常警告:</b>\n';
            anomalies.forEach(anomaly => {
                bossMessage += `• ${anomaly.product_name} - 異常天數: ${anomaly.days_since_last_order}天\n`;
                bossMessage += `  上次進貨: ${anomaly.last_order_date} (${anomaly.last_quantity}個)\n`;
            });
        }

        bossMessage += `\n👤 <b>叫貨員工:</b> ${orderData.employee_name || '系統'}`;

        return await this.sendToBoth(bossMessage, employeeMessage);
    }

    // ==================== 員工註冊通知 ====================
    async notifyEmployeeRegistration(employeeData) {
        const date = new Date().toLocaleDateString('zh-TW');
        
        // 員工簡單通知
        const employeeMessage = `
👋 <b>新人資料已登入</b>

📅 <b>日期:</b> ${date}
👤 <b>新員工:</b> ${employeeData.name}
🏪 <b>分店:</b> ${employeeData.store_name}
        `.trim();

        // 老闆詳細通知
        const bossMessage = `
👋 <b>新員工資料登入</b>

📅 <b>日期:</b> ${date}
👤 <b>姓名:</b> ${employeeData.name}
🆔 <b>身份證:</b> ${employeeData.id_card}
🎂 <b>生日:</b> ${employeeData.birth_date}
⚥ <b>性別:</b> ${employeeData.gender}
🚗 <b>駕照:</b> ${employeeData.has_license ? '有' : '無'}
📞 <b>電話:</b> ${employeeData.phone}
🏠 <b>地址:</b> ${employeeData.address}
🆘 <b>緊急聯絡人:</b> ${employeeData.emergency_contact} (${employeeData.emergency_relationship})
📱 <b>緊急電話:</b> ${employeeData.emergency_phone}
📅 <b>到職日:</b> ${employeeData.join_date}
🏪 <b>分店:</b> ${employeeData.store_name}
💼 <b>職位:</b> ${employeeData.position}
        `.trim();

        return await this.sendToBoth(bossMessage, employeeMessage);
    }

    // ==================== 打卡通知 ====================
    async notifyAttendance(attendanceData) {
        const time = new Date(attendanceData.check_time).toLocaleString('zh-TW');
        const storeName = attendanceData.store_name || '未知分店';
        
        // 員工通知
        const employeeMessage = `
👋 <b>${attendanceData.employee_name} 來${storeName}上班了~</b>

📅 <b>時間:</b> ${time}
📍 <b>地點:</b> ${storeName}
        `.trim();

        // 老闆詳細通知
        let bossMessage = `
👋 <b>員工打卡記錄</b>

👤 <b>員工:</b> ${attendanceData.employee_name}
⏰ <b>打卡時間:</b> ${time}
🏪 <b>分店:</b> ${storeName}
📍 <b>座標:</b> ${attendanceData.latitude || 'N/A'}, ${attendanceData.longitude || 'N/A'}
📏 <b>距離分店:</b> ${attendanceData.distance_meters || 'N/A'}公尺
🔐 <b>打卡設備:</b> ${attendanceData.device_fingerprint || 'N/A'}
        `;

        // 添加異常警告
        if (attendanceData.is_device_anomaly) {
            bossMessage += `\n⚠️ <b>設備異常警告!</b>\n`;
            bossMessage += `本次指紋: ${attendanceData.device_fingerprint}\n`;
            bossMessage += `上次指紋: ${attendanceData.last_device_fingerprint}\n`;
        }

        return await this.sendToBoth(bossMessage, employeeMessage);
    }

    // ==================== 資料作廢通知 ====================
    async notifyDataVoid(voidData) {
        const date = new Date().toLocaleDateString('zh-TW');
        
        // 員工通知
        const employeeMessage = `
🗑️ <b>資料作廢通知</b>

📅 <b>日期:</b> ${date}
🏪 <b>分店:</b> ${voidData.store_name}
📄 <b>資料類型:</b> ${voidData.data_type}
        `.trim();

        // 老闆詳細通知
        const bossMessage = `
🗑️ <b>資料作廢記錄</b>

📅 <b>日期:</b> ${date}
👤 <b>員工:</b> ${voidData.employee_name}
🏪 <b>分店:</b> ${voidData.store_name}
📄 <b>資料類型:</b> ${voidData.data_type}
📝 <b>原因:</b> ${voidData.reason || '未提供'}
🆔 <b>記錄ID:</b> ${voidData.record_id}
        `.trim();

        return await this.sendToBoth(bossMessage, employeeMessage);
    }

    // ==================== 維修保養通知 ====================
    async notifyMaintenance(maintenanceData) {
        const date = new Date(maintenanceData.created_at).toLocaleDateString('zh-TW');
        
        // 員工通知
        const employeeMessage = `
🔧 <b>維修保養申請</b>

📅 <b>日期:</b> ${date}
🏪 <b>分店:</b> ${maintenanceData.store_name}
⚙️ <b>設備:</b> ${maintenanceData.equipment_name}
❗ <b>問題:</b> ${maintenanceData.issue_description}
        `.trim();

        // 老闆詳細通知
        const bossMessage = `
🔧 <b>維修保養申請</b>

📅 <b>日期:</b> ${date}
🏪 <b>分店:</b> ${maintenanceData.store_name}
👤 <b>申請人:</b> ${maintenanceData.employee_name}
⚙️ <b>設備:</b> ${maintenanceData.equipment_name}
❗ <b>問題描述:</b> ${maintenanceData.issue_description}
🔧 <b>維修類型:</b> ${maintenanceData.maintenance_type === 'repair' ? '維修' : '保養'}
⚠️ <b>緊急程度:</b> ${maintenanceData.urgency_level || '一般'}
📸 <b>照片:</b> ${maintenanceData.photo_url ? '已上傳' : '無'}
        `.trim();

        return await this.sendToBoth(bossMessage, employeeMessage);
    }

    // ==================== 排班系統通知 ====================
    async notifyScheduleSystemOpen() {
        const message = `
⏰ <b>排班系統開啟提醒</b>

🚨 排班系統將於 1 小時後開啟！

📅 開放時間: 每月16號 02:00 ~ 21號 02:00
⏱️ 操作時限: 每人5分鐘
🔒 使用限制: 同時只能一人操作

請準備好您的排班計劃！
        `.trim();

        return await this.sendToEmployees(message);
    }

    async notifyScheduleSystemClose() {
        const message = `
⏰ <b>排班系統關閉提醒</b>

🚨 排班系統將於 1 小時後關閉！

還沒完成排班的同事請把握時間！
        `.trim();

        return await this.sendToEmployees(message);
    }

    async notifyScheduleBossSettings() {
        const message = `
⚙️ <b>排班系統設定提醒</b>

🚨 排班系統將於 5 天後開啟！

請設定下個月的:
• 公休日期
• 禁休日期
• 其他排班參數

請登入管理系統完成設定。
        `.trim();

        return await this.sendToBoss(message);
    }

    async notifyScheduleEntry(employeeData) {
        const time = new Date().toLocaleString('zh-TW');
        
        const bossMessage = `
📅 <b>排班系統使用記錄</b>

👤 <b>員工:</b> ${employeeData.name}
⏰ <b>登錄時間:</b> ${time}
🏪 <b>分店:</b> ${employeeData.store_name}

系統已為該員工開啟5分鐘操作時間。
        `.trim();

        return await this.sendToBoss(bossMessage);
    }

    async notifyScheduleCompleted(scheduleData) {
        const employeeName = scheduleData.employee_name;
        const leaveDates = scheduleData.leave_dates.join(', ');
        
        // 老闆詳細通知
        const bossMessage = `
📅 <b>排班完成記錄</b>

👤 <b>員工:</b> ${employeeName}
🏪 <b>分店:</b> ${scheduleData.store_name}
📅 <b>休假日期:</b> ${leaveDates}
🗓️ <b>休假天數:</b> ${scheduleData.leave_dates.length}天
⏰ <b>完成時間:</b> ${new Date().toLocaleString('zh-TW')}
        `.trim();

        // 員工群組通知
        const employeeMessage = `
📅 <b>排班記錄通知</b>

👤 <b>${employeeName}</b> 已完成排班
🗓️ <b>休假日期:</b> ${leaveDates}
        `.trim();

        return await this.sendToBoth(bossMessage, employeeMessage);
    }

    // ==================== 升遷投票通知 ====================
    async notifyPromotionStart(promotionData) {
        const endDate = new Date(promotionData.voting_end_date).toLocaleDateString('zh-TW');
        
        const message = `
🗳️ <b>升遷投票開始</b>

👤 <b>申請人:</b> ${promotionData.employee_name}
📊 <b>目前職位:</b> ${promotionData.current_position_name}
⬆️ <b>目標職位:</b> ${promotionData.target_position_name}
📅 <b>投票截止:</b> ${endDate}
🎯 <b>通過門檻:</b> ${(promotionData.required_approval_rate * 100).toFixed(0)}%

請前往系統參與投票！
（每日可修改投票 3 次）
        `.trim();

        return await this.sendToEmployees(message);
    }

    async notifyPromotionResult(promotionData) {
        const result = promotionData.is_approved ? '通過' : '未通過';
        const emoji = promotionData.is_approved ? '🎉' : '😢';
        
        const message = `
${emoji} <b>升遷投票結果</b>

👤 <b>申請人:</b> ${promotionData.employee_name}
📊 <b>申請職位:</b> ${promotionData.target_position_name}
🗳️ <b>投票結果:</b> ${result}
📈 <b>得票率:</b> ${(promotionData.final_approval_rate * 100).toFixed(1)}%
🎯 <b>通過門檻:</b> ${(promotionData.required_approval_rate * 100).toFixed(0)}%
📊 <b>總投票數:</b> ${promotionData.total_votes}

${promotionData.is_approved ? 
    `🎊 恭喜 ${promotionData.employee_name} 升任 ${promotionData.target_position_name}！` :
    `下次投票需等待 ${promotionData.cooldown_days} 天緩衝期`
}
        `.trim();

        return await this.sendToEmployees(message);
    }

    // ==================== 測試通知 ====================
    async testNotification() {
        const testMessage = `
🤖 <b>系統測試通知</b>

📅 <b>時間:</b> ${new Date().toLocaleString('zh-TW')}
✅ <b>狀態:</b> Telegram通知系統正常運行
🔧 <b>版本:</b> v4.2.0

此為測試訊息，系統運行正常！
        `.trim();

        return await this.sendToBoth(testMessage, testMessage);
    }
}

module.exports = TelegramNotifier;