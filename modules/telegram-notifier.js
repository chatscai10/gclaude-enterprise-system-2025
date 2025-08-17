// Node.js 18+ 內建支援fetch，但提供fallback以確保相容性
const fetch = globalThis.fetch || require('node-fetch');

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
        const date = this.formatDate(data.date);
        const dayType = data.day_type === 'holiday' ? '假日獎金' : '平日獎金';
        const storeName = this.safeGet(data, 'store_name', '總店');
        const employeeName = this.safeGet(data, 'employee_name', '系統');
        const orderCount = this.safeGet(data, 'order_count', 0);
        const totalRevenue = this.safeGet(data, 'total_revenue', 0);
        const totalExpense = this.safeGet(data, 'total_expense', 0);
        const netRevenue = totalRevenue - totalExpense;
        const bonusAmount = this.safeGet(data, 'bonus_amount', 0);
        const averageOrder = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;
        
        // 老闆詳細通知 - 按照系統邏輯文件格式
        const bossMessage = `
💰 <b>營業額提交記錄</b>

分店: ${storeName}
提交人: ${employeeName}
日期: ${date}
現場訂單: ${orderCount} 張

收入明細:
• 現場訂單: $${totalRevenue.toLocaleString()}
• 外送訂單: $0

支出明細:
• 材料成本: $${totalExpense.toLocaleString()}
• 人力成本: $0
• 雜項支出: $0
• 其他費用: $0

收入總額: $${totalRevenue.toLocaleString()}
支出總額: $${totalExpense.toLocaleString()}
淨收入: $${netRevenue.toLocaleString()}

獎金類別: ${dayType}
今日獎金：$${bonusAmount.toLocaleString()}
訂單平均:$${averageOrder.toLocaleString()} /單
備註: ${this.safeGet(data, 'notes', '無')}
        `.trim();

        // 員工簡化通知 - 按照系統邏輯文件格式
        const employeeMessage = `
${storeName} 營業額紀錄成功
分店: ${storeName}
日期: ${date}
獎金類別: ${dayType}
今日獎金: $${bonusAmount.toLocaleString()}
        `.trim();

        return await this.sendToBoth(bossMessage, employeeMessage);
    }

    // ==================== 營收審核通知 ====================
    async notifyRevenueApproval(data) {
        const action = data.action === 'approve' ? '✅ 核准' : '❌ 拒絕';
        const actionColor = data.action === 'approve' ? '🟢' : '🔴';
        
        // 管理員通知
        const adminMessage = `
${actionColor} <b>營收記錄審核完成</b>

📋 <b>記錄ID:</b> #${data.revenue_id}
👤 <b>員工:</b> ${data.employee_name}
⚖️ <b>審核結果:</b> ${action}
👨‍💼 <b>審核者:</b> ${data.reviewer}

${data.reason ? `📝 <b>審核原因:</b> ${data.reason}` : ''}
⏰ <b>審核時間:</b> ${new Date().toLocaleString('zh-TW')}
        `.trim();

        // 員工通知
        const employeeMessage = `
${actionColor} <b>您的營收記錄已${data.action === 'approve' ? '核准' : '被拒絕'}</b>

📋 <b>記錄ID:</b> #${data.revenue_id}
⚖️ <b>審核結果:</b> ${action}

${data.reason ? `📝 <b>原因:</b> ${data.reason}` : ''}
⏰ <b>時間:</b> ${new Date().toLocaleString('zh-TW')}

${data.action === 'approve' ? 
    '🎉 恭喜！您的營收記錄已通過審核，獎金將會發放！' : 
    '😔 很抱歉，您的營收記錄未通過審核，如有疑問請聯繫管理員。'
}
        `.trim();

        return await this.sendToBoth(adminMessage, employeeMessage);
    }

    // ==================== 叫貨記錄通知 (按照系統邏輯文件格式) ====================
    async notifyOrdering(orderData, anomalies = []) {
        const date = this.formatDate(orderData.created_at);
        const storeName = this.safeGet(orderData, 'store_name', '未知分店');
        const employeeName = this.safeGet(orderData, 'employee_name', '系統');
        const items = orderData.items || [];
        
        // 計算總價
        const totalAmount = items.reduce((sum, item) => 
            sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);

        // 按供應商分類整理
        const supplierGroups = {};
        items.forEach(item => {
            const supplier = this.safeGet(item, 'supplier', '未知供應商');
            if (!supplierGroups[supplier]) {
                supplierGroups[supplier] = [];
            }
            supplierGroups[supplier].push(item);
        });

        // 老闆詳細通知（按照系統邏輯文件529-552行格式）
        let bossMessage = `
🛒 <b>叫貨記錄</b>
叫貨人員：${employeeName}
📅 <b>送貨日期:</b> ${date}
🏪 <b>分店:</b> ${storeName}
💰 <b>總金額:</b> $${totalAmount.toLocaleString()}`;

        // 按供應商分類顯示
        Object.entries(supplierGroups).forEach(([supplier, items]) => {
            bossMessage += `\n🏭 <b>${supplier}</b>`;
            items.forEach(item => {
                const brand = this.safeGet(item, 'brand', '');
                const productName = this.safeGet(item, 'product_name', '未知商品');
                const quantity = Number(item.quantity || 0);
                const unit = this.safeGet(item, 'unit', '個');
                bossMessage += `\n  •${brand} ${productName} ${quantity} ${unit}`;
            });
        });

        // 添加異常天數分析
        if (anomalies.length > 0) {
            bossMessage += '\n\n';
            anomalies.forEach(anomaly => {
                const productName = this.safeGet(anomaly, 'product_name', '未知商品');
                const daysSince = Number(anomaly.days_since_last_order || 0);
                const lastOrderDate = this.formatDate(anomaly.last_order_date);
                const lastQuantity = Number(anomaly.last_quantity || 0);
                const unit = this.safeGet(anomaly, 'unit', '個');
                
                if (daysSince >= 3) {
                    bossMessage += `\n⚠️ 品項 ${productName} 已經${daysSince}天沒有叫貨`;
                    bossMessage += `\n上次叫貨${lastOrderDate}-${productName}${lastQuantity}${unit}\n`;
                } else if (daysSince <= 1) {
                    bossMessage += `\n🔄 品項 ${productName} 已經${daysSince}天內頻繁叫貨`;
                    bossMessage += `\n上次叫貨${lastOrderDate}-${productName}${lastQuantity}${unit}\n`;
                }
            });
        }

        // 員工簡化通知
        const employeeMessage = `
🛒 <b>${storeName} 叫貨記錄成功</b>

📅 <b>日期:</b> ${date}
🏪 <b>分店:</b> ${storeName}
💰 <b>總金額:</b> $${totalAmount.toLocaleString()}
👤 <b>叫貨員工:</b> ${employeeName}
        `.trim();

        return await this.sendToBoth(bossMessage.trim(), employeeMessage);
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
👤 <b>新員工資料登入</b>

📅 <b>日期:</b> ${date}
👤 <b>姓名:</b> ${employeeData.name || '未填寫'}
🆔 <b>身份證:</b> ${employeeData.id_card || '未填寫'}
🎂 <b>生日:</b> ${this.formatDate(employeeData.birth_date)}
⚥ <b>性別:</b> ${this.getGenderText(employeeData.gender)}
🚗 <b>駕照:</b> ${employeeData.license_number ? `有 (${employeeData.license_number})` : '無'}
📞 <b>電話:</b> ${employeeData.phone || '未填寫'}
🏠 <b>地址:</b> ${employeeData.address || '未填寫'}
🚨 <b>緊急聯絡人:</b> ${employeeData.emergency_contact_name || '未填寫'} (${this.getRelationText(employeeData.emergency_contact_relation)})
📱 <b>緊急電話:</b> ${employeeData.emergency_contact_phone || '未填寫'}
📅 <b>到職日:</b> ${this.formatDate(employeeData.join_date)}
🏪 <b>分店:</b> ${employeeData.store_name || '待分配'}
💼 <b>職位:</b> ${employeeData.position || '待分配'}
        `.trim();

        return await this.sendToBoth(bossMessage, employeeMessage);
    }

    // ==================== 打卡通知 ====================
    async notifyAttendance(attendanceData) {
        const time = this.formatDateTime(attendanceData.check_time);
        const storeName = this.safeGet(attendanceData, 'store_name', '未知分店');
        const employeeName = this.safeGet(attendanceData, 'employee_name', '未知員工');
        
        // 員工通知
        const employeeMessage = `
👋 <b>${employeeName} 來${storeName}上班了~</b>

📅 <b>時間:</b> ${time}
📍 <b>地點:</b> ${storeName}
        `.trim();

        // 老闆詳細通知
        let bossMessage = `
👋 <b>員工打卡記錄</b>

👤 <b>員工:</b> ${employeeName}
⏰ <b>打卡時間:</b> ${time}
🏪 <b>分店:</b> ${storeName}
📍 <b>座標:</b> ${this.safeGet(attendanceData, 'latitude', 'N/A')}, ${this.safeGet(attendanceData, 'longitude', 'N/A')}
📏 <b>距離分店:</b> ${attendanceData.distance_meters ? Math.round(attendanceData.distance_meters) + '公尺' : 'N/A'}
🎯 <b>GPS精度:</b> ${this.safeGet(attendanceData, 'gps_accuracy', 'N/A')}公尺
🔐 <b>打卡設備:</b> ${this.safeGet(attendanceData, 'device_info', 'N/A')}
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
        // 按照系統邏輯文件585-591行格式
        const message = `
🚨 <b>排班系統準備開啟</b>
 請即時設定各店公休日 禁休日
⏰ <b>開放天數:</b> 5
📅 <b>開啟時間:</b> ${new Date().toLocaleDateString('zh-TW')} 上午2:00:00
📅 <b>結束時間:</b> ${new Date(Date.now() + 5*24*60*60*1000).toLocaleDateString('zh-TW')} 上午2:00:00
        `.trim();

        return await this.sendToBoss(message);
    }

    async notifyForceScheduleOpen(adminData) {
        // 按照系統邏輯文件578-584行格式
        const openTime = new Date().toLocaleString('zh-TW');
        const endTime = new Date(Date.now() + 30*60*1000).toLocaleString('zh-TW');
        
        const message = `
🚨 <b>強制排班系統已開啟</b>
⏰ <b>開放時間:</b> 30分鐘
👤 <b>開啟者:</b> ${adminData.admin_name || '管理員'}
📅 <b>開啟時間:</b> ${openTime}
📅 <b>結束時間:</b> ${endTime}
        `.trim();

        return await this.sendToBoth(message, message);
    }

    async notifyDailySchedule(dailyScheduleData) {
        // 按照系統邏輯文件593-616行格式
        const tomorrow = new Date(Date.now() + 24*60*60*1000);
        const dayAfterTomorrow = new Date(Date.now() + 2*24*60*60*1000);
        
        let message = `
📅 <b>明日班提醒</b>
📆 <b>日期:</b> ${tomorrow.toLocaleDateString('zh-TW')}

`;
        
        // 為每家分店添加明日排班資訊
        dailyScheduleData.stores.forEach(store => {
            message += `🏪 <b>${store.store_name}</b>\n`;
            message += `👥 <b>值班:</b> ${store.working_employees.join('、')}\n`;
            message += `🏠 <b>休假:</b> ${store.off_employees.length > 0 ? store.off_employees.join('、') : '無'}\n\n`;
        });
        
        message += `📆 <b>後天 (${dayAfterTomorrow.toLocaleDateString('zh-TW')}) 值班預告:</b>\n`;
        dailyScheduleData.next_day_preview.forEach(store => {
            message += `🏪 ${store.store_name}: ${store.working_employees.join('、')}\n`;
        });
        
        message += `\n⏰ 每日18:00自動發送\n🔄 資料來源: 排班系統`;
        
        return await this.sendToBoth(message.trim(), message.trim());
    }

    async notifyMonthlyBirthdays(birthdayData) {
        // 按照系統邏輯文件622-627行格式
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        let message = `
📅 <b>本月生日清單</b>
📆 <b>${currentYear}年${currentMonth}月</b>

🎂 <b>本月壽星 (${birthdayData.length}位):</b>\n`;
        
        birthdayData.forEach(employee => {
            const birthdayDate = new Date(employee.birth_date).getDate();
            message += `• ${employee.name} (${employee.store_name}) - ${currentMonth}/${birthdayDate}\n`;
        });
        
        message += `\n🎉 請記得為壽星送上祝福！`;
        
        return await this.sendToBoth(message.trim(), message.trim());
    }

    // 輔助函數：性別文字轉換
    getGenderText(gender) {
        switch (gender) {
            case 'male': return '男性';
            case 'female': return '女性';
            case 'other': return '其他';
            default: return '未填寫';
        }
    }

    // 輔助函數：關係文字轉換
    getRelationText(relation) {
        switch (relation) {
            case 'parent': return '父母';
            case 'spouse': return '配偶';
            case 'sibling': return '兄弟姊妹';
            case 'friend': return '朋友';
            case 'other': return '其他';
            default: return '未填寫';
        }
    }

    // 輔助函數：日期格式化
    formatDate(dateStr) {
        if (!dateStr) return '未填寫';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '未填寫';
            return date.toLocaleDateString('zh-TW');
        } catch (error) {
            return '未填寫';
        }
    }

    // 輔助函數：時間格式化
    formatDateTime(dateStr) {
        if (!dateStr) return '未填寫';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '未填寫';
            return date.toLocaleString('zh-TW');
        } catch (error) {
            return '未填寫';
        }
    }

    // 輔助函數：安全取值
    safeGet(obj, key, defaultValue = '未填寫') {
        return (obj && obj[key] !== undefined && obj[key] !== null) ? obj[key] : defaultValue;
    }

    // ==================== 升遷投票通知 (按照系統邏輯文件格式) ====================
    async notifyPromotionStart(promotionData) {
        const endDate = new Date(promotionData.voting_end_date).toLocaleDateString('zh-TW');
        const joinDate = this.formatDate(promotionData.join_date);
        const totalDays = Math.floor((new Date() - new Date(promotionData.join_date)) / (1000 * 60 * 60 * 24));
        const currentPositionDays = Math.floor((new Date() - new Date(promotionData.current_position_start_date)) / (1000 * 60 * 60 * 24));
        
        // 按照系統邏輯文件554-564行格式
        const message = `
🗳️ <b>升遷投票發起</b>
👤 <b>候選人:</b> ${promotionData.employee_name}
<b>到職日期總天數：</b>${joinDate}到職 任職總天數 ${totalDays} 天
<b>目前職位：</b>${promotionData.current_position_name}
<b>目前職位任職天數：</b>${currentPositionDays}天
📈 <b>目標職位:</b> ${promotionData.target_position_name}
📅 <b>投票結束:</b> ${endDate}
💼 <b>詳細資料:</b> 請查看系統
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

    // ==================== 出勤打卡通知 (按照系統邏輯文件格式) ====================
    async notifyAttendance(attendanceData, deviceAnomalies = []) {
        const clockType = attendanceData.clock_type === 'in' ? '上班' : '下班';
        const time = new Date(attendanceData.timestamp).toLocaleString('zh-TW');
        const status = attendanceData.clock_type === 'in' ? '上班打卡' : '下班打卡';
        
        // 遲到資訊計算
        let lateInfo = '';
        if (attendanceData.is_late && attendanceData.late_minutes > 0) {
            lateInfo = `    遲到：遲到${attendanceData.late_minutes}分鐘,本月累計共${attendanceData.monthly_late_minutes || attendanceData.late_minutes}分鐘`;
        }
        
        // 老闆群組訊息（按照系統邏輯文件517-527行格式）
        let bossMessage = `
🕐 <b>員工打卡記錄</b>
👤 <b>員工:</b> ${attendanceData.employee_name}
⏰ <b>時間:</b> ${time}
🏪 <b>分店:</b> ${attendanceData.store_name}
📍 <b>座標:</b> ${this.safeGet(attendanceData, 'latitude', 'N/A')}, ${this.safeGet(attendanceData, 'longitude', 'N/A')}
📏 <b>距離:</b> ${attendanceData.distance_meters ? Math.round(attendanceData.distance_meters) + '公尺' : 'N/A'}
📱 <b>設備:</b> ${this.safeGet(attendanceData, 'device_info', 'N/A')}
✅ <b>狀態:</b> ${status}${lateInfo}
        `.trim();

        // 員工群組訊息（簡化）
        let employeeMessage = `
👋 <b>${attendanceData.employee_name} ${clockType}打卡成功</b>

📅 <b>時間:</b> ${time}
📍 <b>地點:</b> ${attendanceData.store_name}
        `.trim();

        // 設備異常警告
        if (deviceAnomalies && deviceAnomalies.length > 0) {
            bossMessage += '\n\n⚠️ <b>設備異常警告:</b>';
            deviceAnomalies.forEach(anomaly => {
                bossMessage += `\n• ${anomaly.message}: ${anomaly.details}`;
            });
        }

        return await this.sendToBoth(bossMessage, employeeMessage);
    }

    // ==================== 維修申請通知 (按照系統邏輯文件格式) ====================
    async notifyMaintenance(maintenanceData) {
        const time = new Date(maintenanceData.created_at).toLocaleString('zh-TW');
        const priorityText = this.getPriorityText(maintenanceData.priority);
        const photoCount = maintenanceData.photo_count || 0;
        
        // 老闆群組訊息（按照系統邏輯文件566-576行格式）
        let bossMessage = `
🔧 <b>維修申請</b>
📅 <b>日期:</b> ${time}
🏪 <b>分店:</b> ${maintenanceData.store_name}
👤 <b>申請人:</b> ${maintenanceData.employee_name}
🛠️ <b>設備:</b> ${maintenanceData.equipment_type || maintenanceData.equipment_name}
⚠️ <b>緊急程度:</b> ${priorityText}
🏷️ <b>類別:</b> ${maintenanceData.maintenance_type === 'repair' ? '設備故障' : '定期保養'}
❗ <b>問題:</b> ${maintenanceData.title || maintenanceData.issue_description}
📷 <b>照片:</b> ${photoCount}張
        `.trim();

        // 員工群組訊息（簡化）
        let employeeMessage = `
🔧 <b>維修申請已提交</b>

📅 <b>日期:</b> ${time}
🏪 <b>分店:</b> ${maintenanceData.store_name}
🛠️ <b>設備:</b> ${maintenanceData.equipment_type || maintenanceData.equipment_name}
❗ <b>問題:</b> ${maintenanceData.title || maintenanceData.issue_description}
        `.trim();

        return await this.sendToBoth(bossMessage, employeeMessage);
    }

    getPriorityEmoji(priority) {
        const priorityMap = {
            'low': '🟢',
            'medium': '🟡', 
            'high': '🔴'
        };
        return priorityMap[priority] || '⚪';
    }

    getPriorityText(priority) {
        const priorityMap = {
            'low': '低',
            'medium': '中',
            'high': '高'
        };
        return priorityMap[priority] || '未知';
    }

    // ==================== 排班管理通知 ====================
    async notifyScheduleUpdate(scheduleData) {
        const { store_id, year, month, admin_name, total_assignments } = scheduleData;
        
        // 老闆群組通知
        const bossMessage = `
📅 <b>排班資料更新</b>

🏪 <b>分店:</b> 分店 ${store_id}
📆 <b>排班月份:</b> ${year}年${month}月
👨‍💼 <b>更新者:</b> ${admin_name}
📊 <b>排班日數:</b> ${total_assignments}天
⏰ <b>更新時間:</b> ${new Date().toLocaleString('zh-TW')}

管理員已完成下個月的排班分配。
        `.trim();

        // 員工群組通知
        const employeeMessage = `
📅 <b>排班資料更新</b>

🏪 <b>分店:</b> 分店 ${store_id}
📆 <b>排班月份:</b> ${year}年${month}月
⏰ <b>更新時間:</b> ${new Date().toLocaleString('zh-TW')}

💡 管理員已完成下個月的排班分配，請至系統查看您的班表。
        `.trim();

        return await this.sendToBoth(bossMessage, employeeMessage);
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