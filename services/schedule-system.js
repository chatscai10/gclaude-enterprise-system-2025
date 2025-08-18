/**
 * 📅 排班系統服務
 * 根據系統邏輯.txt實現完整排班功能
 */

const DatabaseOperations = require('../database/json-database');
const TelegramNotifier = require('../modules/telegram-notifier');

class ScheduleSystem {
    constructor() {
        this.db = new DatabaseOperations();
        this.telegramNotifier = new TelegramNotifier();
        
        // 系統邏輯要求的預設參數
        this.scheduleSettings = {
            maxVacationDays: 8,           // 每人休假上限天數
            dailyVacationLimit: 2,        // 每日休假總上限人數
            weekendVacationLimit: 3,      // 每人週五六日休假上限天數
            sameStoreVacationLimit: 1,    // 同店每日休假上限
            standbyVacationLimit: 1,      // 待命每日休假上限
            partTimeVacationLimit: 1,     // 兼職每日休假上限
            operationTimeLimit: 5,        // 每次排班操作時間5分鐘
            openDay: 16,                  // 每月16號開啟
            openHour: 2,                  // 上午2:00開啟
            closeDay: 21,                 // 每月21號關閉
            closeHour: 2                  // 上午2:00關閉
        };
        
        this.currentUser = null;
        this.sessionStartTime = null;
        this.sessionTimeLimit = 5 * 60 * 1000; // 5分鐘毫秒
    }

    /**
     * 檢查排班系統是否開放
     */
    isScheduleSystemOpen() {
        const now = new Date();
        const currentDay = now.getDate();
        const currentHour = now.getHours();
        
        // 檢查是否在開放時間內
        if (currentDay >= this.scheduleSettings.openDay && currentDay <= this.scheduleSettings.closeDay) {
            // 開啟當天需要檢查時間
            if (currentDay === this.scheduleSettings.openDay) {
                return currentHour >= this.scheduleSettings.openHour;
            }
            // 關閉當天需要檢查時間
            if (currentDay === this.scheduleSettings.closeDay) {
                return currentHour < this.scheduleSettings.closeHour;
            }
            // 中間日期都開放
            return true;
        }
        
        return false;
    }

    /**
     * 檢查系統是否被其他人使用
     */
    async isSystemInUse() {
        try {
            const sessions = await this.db.readTable('schedule_sessions') || [];
            const now = new Date();
            
            // 清理過期會話
            const activeSessions = sessions.filter(session => {
                const sessionTime = new Date(session.start_time);
                return (now - sessionTime) < this.sessionTimeLimit;
            });
            
            // 更新會話表
            await this.db.writeTable('schedule_sessions', activeSessions);
            
            // 檢查是否有其他活躍會話
            return activeSessions.some(session => 
                this.currentUser && session.employee_id !== this.currentUser.employee_id
            );
        } catch (error) {
            console.error('檢查系統使用狀態失敗:', error);
            return false;
        }
    }

    /**
     * 開始排班會話
     */
    async startScheduleSession(user) {
        if (!this.isScheduleSystemOpen()) {
            throw new Error('排班系統未開放');
        }

        if (await this.isSystemInUse()) {
            throw new Error('系統使用中，請稍後再試');
        }

        // 檢查用戶是否已經排過班
        const existingSchedule = await this.getUserScheduleForNextMonth(user.employee_id);
        if (existingSchedule && existingSchedule.length > 0) {
            throw new Error('您已經完成本月排班');
        }

        this.currentUser = user;
        this.sessionStartTime = new Date();

        // 記錄會話
        const sessions = await this.db.readTable('schedule_sessions') || [];
        sessions.push({
            id: Date.now(),
            employee_id: user.employee_id,
            employee_name: user.name,
            start_time: this.sessionStartTime.toISOString(),
            status: 'active'
        });
        
        await this.db.writeTable('schedule_sessions', sessions);

        // 發送Telegram通知
        await this.telegramNotifier.sendBossNotification(
            `🎯 排班系統使用通知\n👤 員工: ${user.name}\n⏰ 開始時間: ${this.sessionStartTime.toLocaleString('zh-TW')}\n📅 操作月份: ${this.getNextMonthString()}`
        );

        return {
            sessionId: sessions[sessions.length - 1].id,
            timeLimit: this.sessionTimeLimit,
            nextMonth: this.getNextMonthString()
        };
    }

    /**
     * 獲取下個月字串
     */
    getNextMonthString() {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return `${nextMonth.getFullYear()}年${nextMonth.getMonth() + 1}月`;
    }

    /**
     * 獲取下個月的日曆數據
     */
    getNextMonthCalendar() {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        
        const year = nextMonth.getFullYear();
        const month = nextMonth.getMonth();
        
        // 獲取該月天數
        const lastDay = new Date(year, month + 1, 0).getDate();
        const calendar = [];
        
        for (let day = 1; day <= lastDay; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay(); // 0=週日, 6=週六
            
            calendar.push({
                date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                day: day,
                dayOfWeek: dayOfWeek,
                isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
                isHoliday: this.isHoliday(date),
                dayName: ['日', '一', '二', '三', '四', '五', '六'][dayOfWeek]
            });
        }
        
        return calendar;
    }

    /**
     * 檢查是否為假日
     */
    isHoliday(date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // 常見國定假日
        const holidays = [
            '1-1',   // 元旦
            '2-28',  // 和平紀念日
            '4-4',   // 兒童節
            '4-5',   // 清明節
            '5-1',   // 勞動節
            '10-10', // 國慶日
            '12-25'  // 聖誕節
        ];
        
        return holidays.includes(`${month}-${day}`);
    }

    /**
     * 獲取排班規則和限制
     */
    async getScheduleRules() {
        try {
            // 獲取各分店的公休日和禁休日設定
            const storeSettings = await this.db.readTable('store_schedule_settings') || [];
            
            return {
                settings: this.scheduleSettings,
                storeSettings: storeSettings,
                rules: [
                    `每人休假上限: ${this.scheduleSettings.maxVacationDays}天`,
                    `每日休假總上限: ${this.scheduleSettings.dailyVacationLimit}人`,
                    `週末休假上限: ${this.scheduleSettings.weekendVacationLimit}天`,
                    `同店每日休假上限: ${this.scheduleSettings.sameStoreVacationLimit}人`,
                    `排班操作時間限制: ${this.scheduleSettings.operationTimeLimit}分鐘`,
                    `開放時間: 每月${this.scheduleSettings.openDay}號 ${this.scheduleSettings.openHour}:00`,
                    `關閉時間: 每月${this.scheduleSettings.closeDay}號 ${this.scheduleSettings.closeHour}:00`
                ]
            };
        } catch (error) {
            console.error('獲取排班規則失敗:', error);
            return { settings: this.scheduleSettings, storeSettings: [], rules: [] };
        }
    }

    /**
     * 驗證休假申請是否符合規則
     */
    async validateVacationRequest(employeeId, vacationDates, storeId) {
        const errors = [];
        
        try {
            // 1. 檢查休假天數上限
            if (vacationDates.length > this.scheduleSettings.maxVacationDays) {
                errors.push(`休假天數超過上限 ${this.scheduleSettings.maxVacationDays} 天`);
            }

            // 2. 檢查週末休假天數
            const weekendDates = vacationDates.filter(date => {
                const d = new Date(date);
                const dayOfWeek = d.getDay();
                return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0; // 週五六日
            });
            
            if (weekendDates.length > this.scheduleSettings.weekendVacationLimit) {
                errors.push(`週末休假天數超過上限 ${this.scheduleSettings.weekendVacationLimit} 天`);
            }

            // 3. 檢查每日休假人數限制
            const allSchedules = await this.db.readTable('employee_schedules') || [];
            const nextMonth = this.getNextMonthString();
            
            for (const vacationDate of vacationDates) {
                const sameStoreVacations = allSchedules.filter(schedule => 
                    schedule.month === nextMonth &&
                    schedule.store_id === storeId &&
                    schedule.vacation_dates.includes(vacationDate)
                );
                
                if (sameStoreVacations.length >= this.scheduleSettings.sameStoreVacationLimit) {
                    errors.push(`${vacationDate} 該分店當日休假人數已達上限`);
                }
            }

            // 4. 檢查公休日和禁休日
            const storeSettings = await this.db.readTable('store_schedule_settings') || [];
            const storeSetting = storeSettings.find(s => s.store_id === storeId);
            
            if (storeSetting) {
                // 檢查禁休日
                const forbiddenDates = storeSetting.forbidden_dates || [];
                const conflictForbidden = vacationDates.filter(date => forbiddenDates.includes(date));
                if (conflictForbidden.length > 0) {
                    errors.push(`以下日期為禁休日: ${conflictForbidden.join(', ')}`);
                }
            }

        } catch (error) {
            console.error('驗證休假申請失敗:', error);
            errors.push('驗證過程中發生錯誤');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 提交排班申請
     */
    async submitSchedule(employeeId, vacationDates, storeId) {
        if (!this.currentUser || this.currentUser.employee_id !== employeeId) {
            throw new Error('無效的排班會話');
        }

        // 檢查會話是否過期
        const now = new Date();
        if (now - this.sessionStartTime > this.sessionTimeLimit) {
            await this.endScheduleSession();
            throw new Error('排班時間已超時，請重新進入系統');
        }

        // 驗證排班申請
        const validation = await this.validateVacationRequest(employeeId, vacationDates, storeId);
        if (!validation.valid) {
            throw new Error(`排班申請不符合規則: ${validation.errors.join('; ')}`);
        }

        // 保存排班記錄
        const schedules = await this.db.readTable('employee_schedules') || [];
        const scheduleRecord = {
            id: Date.now(),
            employee_id: employeeId,
            employee_name: this.currentUser.name,
            store_id: storeId,
            month: this.getNextMonthString(),
            vacation_dates: vacationDates,
            submitted_at: now.toISOString(),
            status: 'confirmed'
        };

        schedules.push(scheduleRecord);
        await this.db.writeTable('employee_schedules', schedules);

        // 發送Telegram通知
        await this.telegramNotifier.sendBossNotification(
            `📅 排班提交通知\n👤 員工: ${this.currentUser.name}\n📅 月份: ${this.getNextMonthString()}\n🏠 休假日期: ${vacationDates.join(', ')}\n⏰ 提交時間: ${now.toLocaleString('zh-TW')}`
        );

        await this.telegramNotifier.sendEmployeeNotification(
            `📅 ${this.currentUser.name} 排班登記\n休假日期: ${vacationDates.join(', ')}`
        );

        // 結束會話
        await this.endScheduleSession();

        return scheduleRecord;
    }

    /**
     * 結束排班會話
     */
    async endScheduleSession() {
        try {
            const sessions = await this.db.readTable('schedule_sessions') || [];
            const updatedSessions = sessions.filter(session => 
                !this.currentUser || session.employee_id !== this.currentUser.employee_id
            );
            
            await this.db.writeTable('schedule_sessions', updatedSessions);
            
            this.currentUser = null;
            this.sessionStartTime = null;
        } catch (error) {
            console.error('結束排班會話失敗:', error);
        }
    }

    /**
     * 獲取用戶下個月排班記錄
     */
    async getUserScheduleForNextMonth(employeeId) {
        try {
            const schedules = await this.db.readTable('employee_schedules') || [];
            const nextMonth = this.getNextMonthString();
            
            return schedules.filter(schedule => 
                schedule.employee_id === employeeId && schedule.month === nextMonth
            );
        } catch (error) {
            console.error('獲取用戶排班記錄失敗:', error);
            return [];
        }
    }

    /**
     * 獲取排班系統狀態
     */
    async getSystemStatus() {
        const isOpen = this.isScheduleSystemOpen();
        const inUse = await this.isSystemInUse();
        
        return {
            isOpen: isOpen,
            inUse: inUse,
            currentUser: this.currentUser,
            sessionTimeRemaining: this.currentUser ? 
                Math.max(0, this.sessionTimeLimit - (new Date() - this.sessionStartTime)) : 0,
            nextMonth: this.getNextMonthString(),
            openTime: `每月${this.scheduleSettings.openDay}號 ${this.scheduleSettings.openHour}:00`,
            closeTime: `每月${this.scheduleSettings.closeDay}號 ${this.scheduleSettings.closeHour}:00`
        };
    }
}

module.exports = ScheduleSystem;