/**
 * 定時異常叫貨檢查服務
 * 自動執行定期檢查並發送異常通知
 */

const cron = require('node-cron');
const OrderAnomalyChecker = require('./order-anomaly-checker');
const database = require('../database');

class ScheduledAnomalyChecker {
    constructor() {
        this.anomalyChecker = new OrderAnomalyChecker();
        this.isRunning = false;
        this.scheduledTasks = [];
        
        // 預設檢查時間：每日上午9點和下午6點
        this.defaultSchedule = {
            morning: '0 9 * * *',    // 每日上午9點
            evening: '0 18 * * *'    // 每日下午6點
        };
    }

    /**
     * 啟動定時異常檢查
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ 定時異常檢查已在運行中');
            return;
        }

        console.log('🚀 啟動定時異常叫貨檢查服務...');

        // 每日上午9點檢查
        const morningTask = cron.schedule(this.defaultSchedule.morning, async () => {
            console.log('🌅 執行上午異常檢查...');
            await this.runScheduledCheck('morning');
        }, {
            scheduled: false,
            timezone: 'Asia/Taipei'
        });

        // 每日下午6點檢查
        const eveningTask = cron.schedule(this.defaultSchedule.evening, async () => {
            console.log('🌆 執行下午異常檢查...');
            await this.runScheduledCheck('evening');
        }, {
            scheduled: false,
            timezone: 'Asia/Taipei'
        });

        // 每2小時檢查一次 (營業時間內: 8-22點)
        const hourlyTask = cron.schedule('0 8-22/2 * * *', async () => {
            console.log('⏰ 執行定時異常檢查...');
            await this.runScheduledCheck('hourly');
        }, {
            scheduled: false,
            timezone: 'Asia/Taipei'
        });

        this.scheduledTasks = [
            { name: 'morning', task: morningTask, schedule: this.defaultSchedule.morning },
            { name: 'evening', task: eveningTask, schedule: this.defaultSchedule.evening },
            { name: 'hourly', task: hourlyTask, schedule: '0 8-22/2 * * *' }
        ];

        // 啟動所有定時任務
        this.scheduledTasks.forEach(scheduledTask => {
            scheduledTask.task.start();
        });

        this.isRunning = true;
        console.log('✅ 定時異常檢查服務已啟動');
        console.log('📅 檢查時間表:');
        console.log('   - 上午檢查: 09:00 (每日)');
        console.log('   - 下午檢查: 18:00 (每日)');
        console.log('   - 定時檢查: 08:00-22:00 (每2小時)');
    }

    /**
     * 停止定時異常檢查
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ 定時異常檢查未在運行');
            return;
        }

        console.log('🛑 停止定時異常檢查服務...');

        this.scheduledTasks.forEach(scheduledTask => {
            scheduledTask.task.stop();
        });

        this.scheduledTasks = [];
        this.isRunning = false;
        
        console.log('✅ 定時異常檢查服務已停止');
    }

    /**
     * 執行定時檢查
     */
    async runScheduledCheck(checkType = 'manual') {
        try {
            const startTime = new Date();
            console.log(`🔍 開始執行 ${checkType} 異常檢查...`);

            const result = await this.anomalyChecker.runScheduledCheck();

            const endTime = new Date();
            const duration = (endTime - startTime) / 1000;

            // 記錄檢查日誌
            await this.logScheduledCheck(checkType, result, duration);

            console.log(`✅ ${checkType} 異常檢查完成`);
            console.log(`   - 執行時間: ${duration.toFixed(2)}秒`);
            console.log(`   - 發現異常: ${result.anomaliesFound}個`);

            return result;

        } catch (error) {
            console.error(`❌ ${checkType} 異常檢查失敗:`, error);
            
            // 記錄錯誤日誌
            await this.logScheduledCheck(checkType, { 
                success: false, 
                error: error.message,
                anomaliesFound: 0 
            }, 0);

            return {
                success: false,
                error: error.message,
                anomaliesFound: 0
            };
        }
    }

    /**
     * 記錄定時檢查日誌
     */
    async logScheduledCheck(checkType, result, duration) {
        try {
            const { v4: uuidv4 } = require('uuid');
            
            await database.run(`
                INSERT INTO system_logs (
                    uuid, user_id, action, target_type, target_id, details
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                uuidv4(), 
                1, // 系統用戶ID
                'scheduled_anomaly_check',
                'system',
                checkType,
                JSON.stringify({
                    check_type: checkType,
                    success: result.success,
                    anomalies_found: result.anomaliesFound,
                    duration_seconds: duration,
                    checked_at: new Date().toISOString(),
                    error: result.error || null
                })
            ]);

        } catch (logError) {
            console.error('記錄檢查日誌失敗:', logError);
        }
    }

    /**
     * 獲取定時檢查狀態
     */
    getStatus() {
        return {
            is_running: this.isRunning,
            total_scheduled_tasks: this.scheduledTasks.length,
            tasks: this.scheduledTasks.map(task => ({
                name: task.name,
                schedule: task.schedule,
                is_running: task.task.running
            })),
            next_runs: this.getNextRunTimes()
        };
    }

    /**
     * 獲取下次執行時間
     */
    getNextRunTimes() {
        if (!this.isRunning) {
            return [];
        }

        const now = new Date();
        const times = [];

        // 計算下次上午檢查時間
        const nextMorning = new Date();
        nextMorning.setHours(9, 0, 0, 0);
        if (nextMorning <= now) {
            nextMorning.setDate(nextMorning.getDate() + 1);
        }
        times.push({ type: 'morning', time: nextMorning.toISOString() });

        // 計算下次下午檢查時間
        const nextEvening = new Date();
        nextEvening.setHours(18, 0, 0, 0);
        if (nextEvening <= now) {
            nextEvening.setDate(nextEvening.getDate() + 1);
        }
        times.push({ type: 'evening', time: nextEvening.toISOString() });

        return times.sort((a, b) => new Date(a.time) - new Date(b.time));
    }

    /**
     * 手動執行立即檢查
     */
    async runImmediateCheck() {
        console.log('🚨 執行立即異常檢查...');
        return await this.runScheduledCheck('immediate');
    }

    /**
     * 更新檢查時程設定
     */
    updateSchedule(newSchedule) {
        console.log('🔄 更新檢查時程設定...');
        
        // 停止現有任務
        if (this.isRunning) {
            this.stop();
        }

        // 更新時程
        if (newSchedule.morning) {
            this.defaultSchedule.morning = newSchedule.morning;
        }
        if (newSchedule.evening) {
            this.defaultSchedule.evening = newSchedule.evening;
        }

        // 重新啟動
        this.start();

        console.log('✅ 檢查時程更新完成');
    }
}

// 創建全域實例
const scheduledChecker = new ScheduledAnomalyChecker();

// 如果作為主程序執行，則啟動定時檢查
if (require.main === module) {
    console.log('🎯 啟動獨立定時異常檢查服務...');
    
    scheduledChecker.start();
    
    // 優雅關閉處理
    process.on('SIGINT', () => {
        console.log('\n🛑 接收到關閉信號...');
        scheduledChecker.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 接收到終止信號...');
        scheduledChecker.stop();
        process.exit(0);
    });

    // 保持程序運行
    console.log('⚡ 定時異常檢查服務正在運行中...');
    console.log('   使用 Ctrl+C 停止服務');
}

module.exports = ScheduledAnomalyChecker;