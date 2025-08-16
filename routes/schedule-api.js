/**
 * 排班系統 API 路由
 * 實現完整的排班管理功能
 */

const express = require('express');
const DatabaseOperations = require('../database/json-database');
const router = express.Router();

// 初始化資料庫
const database = new DatabaseOperations();

// 獲取排班設定
router.get('/settings', async (req, res) => {
    try {
        const settings = await database.getScheduleSettings();
        
        // 如果沒有設定，創建默認設定
        if (!settings) {
            const defaultSettings = {
                schedule_month: getNextMonth(),
                max_leave_days_per_person: 8,
                daily_total_limit: 2,
                weekend_limit_per_person: 3,
                same_store_daily_limit: 1,
                part_time_daily_limit: 1,
                standby_daily_limit: 1,
                operation_time_minutes: 5,
                open_day: 16,
                open_time: '02:00',
                close_day: 21,
                close_time: '02:00',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            await database.updateScheduleSettings(defaultSettings);
            return res.json({
                success: true,
                data: defaultSettings,
                message: '排班設定創建成功'
            });
        }

        res.json({
            success: true,
            data: settings,
            message: '排班設定獲取成功'
        });

    } catch (error) {
        console.error('獲取排班設定失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取排班設定失敗: ' + error.message
        });
    }
});

// 更新排班設定 (管理員專用)
router.put('/settings', async (req, res) => {
    try {
        const {
            schedule_month,
            max_leave_days_per_person,
            daily_total_limit,
            weekend_limit_per_person,
            same_store_daily_limit,
            part_time_daily_limit,
            standby_daily_limit,
            operation_time_minutes,
            open_day,
            open_time,
            close_day,
            close_time,
            store_off_days,
            store_no_leave_days
        } = req.body;

        const updatedSettings = {
            schedule_month: schedule_month || getNextMonth(),
            max_leave_days_per_person: max_leave_days_per_person || 8,
            daily_total_limit: daily_total_limit || 2,
            weekend_limit_per_person: weekend_limit_per_person || 3,
            same_store_daily_limit: same_store_daily_limit || 1,
            part_time_daily_limit: part_time_daily_limit || 1,
            standby_daily_limit: standby_daily_limit || 1,
            operation_time_minutes: operation_time_minutes || 5,
            open_day: open_day || 16,
            open_time: open_time || '02:00',
            close_day: close_day || 21,
            close_time: close_time || '02:00',
            store_off_days: store_off_days || '{}',
            store_no_leave_days: store_no_leave_days || '{}',
            updated_at: new Date().toISOString()
        };

        const result = await database.updateScheduleSettings(updatedSettings);

        res.json({
            success: true,
            data: result,
            message: '排班設定更新成功'
        });

    } catch (error) {
        console.error('更新排班設定失敗:', error);
        res.status(500).json({
            success: false,
            message: '更新排班設定失敗: ' + error.message
        });
    }
});

// 獲取排班狀態
router.get('/status', async (req, res) => {
    try {
        const settings = await database.getScheduleSettings();
        
        if (!settings) {
            return res.json({
                success: true,
                data: {
                    isOpen: false,
                    status: 'no_settings',
                    message: '排班設定不存在'
                }
            });
        }

        const now = new Date();
        const currentDay = now.getDate();
        const currentHour = now.getHours();
        
        // 檢查是否在開放時間內
        const openDay = settings.open_day || 16;
        const closeDay = settings.close_day || 21;
        const openHour = parseInt(settings.open_time?.split(':')[0] || '2');
        const closeHour = parseInt(settings.close_time?.split(':')[0] || '2');
        
        let isOpen = false;
        let status = 'closed';
        let message = '排班系統關閉中';
        
        if (currentDay >= openDay && currentDay <= closeDay) {
            if (currentDay === openDay && currentHour >= openHour) {
                isOpen = true;
                status = 'open';
                message = '排班系統開放中';
            } else if (currentDay > openDay && currentDay < closeDay) {
                isOpen = true;
                status = 'open';
                message = '排班系統開放中';
            } else if (currentDay === closeDay && currentHour < closeHour) {
                isOpen = true;
                status = 'open';
                message = '排班系統開放中';
            }
        }

        res.json({
            success: true,
            data: {
                isOpen,
                status,
                message,
                settings,
                currentTime: now.toISOString()
            }
        });

    } catch (error) {
        console.error('獲取排班狀態失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取排班狀態失敗: ' + error.message
        });
    }
});

// 提交排班
router.post('/submit', async (req, res) => {
    try {
        const { leave_dates, employee_id } = req.body;
        
        if (!leave_dates || !Array.isArray(leave_dates)) {
            return res.status(400).json({
                success: false,
                message: '請假日期格式錯誤'
            });
        }

        const actualEmployeeId = employee_id || req.user?.employee_id;
        if (!actualEmployeeId) {
            return res.status(400).json({
                success: false,
                message: '員工ID缺失'
            });
        }

        const result = await database.submitSchedule(actualEmployeeId, { leaveDates: leave_dates });

        res.json({
            success: true,
            data: result,
            message: '排班提交成功'
        });

    } catch (error) {
        console.error('提交排班失敗:', error);
        res.status(500).json({
            success: false,
            message: '提交排班失敗: ' + error.message
        });
    }
});

// 獲取月營收統計
router.get('/monthly', async (req, res) => {
    try {
        // 這個端點實際上應該在 revenue API 中，但前端可能調用錯誤
        const { month, year } = req.query;
        const searchMonth = month && year ? `${year}-${month.padStart(2, '0')}` : getCurrentMonth();
        
        const revenues = await database.getRevenueByMonth(searchMonth);
        
        res.json({
            success: true,
            data: revenues,
            message: '月營收統計獲取成功'
        });

    } catch (error) {
        console.error('獲取月營收統計失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取月營收統計失敗: ' + error.message
        });
    }
});

// 工具函數
function getNextMonth() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString().slice(0, 7); // YYYY-MM 格式
}

function getCurrentMonth() {
    const now = new Date();
    return now.toISOString().slice(0, 7); // YYYY-MM 格式
}

module.exports = router;