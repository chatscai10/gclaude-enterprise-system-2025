#!/bin/bash

# GClaude Enterprise System 監控腳本

# 健康檢查
health_check() {
    if curl -f http://localhost:3007/api/health > /dev/null 2>&1; then
        echo "✅ 應用程式健康"
        return 0
    else
        echo "❌ 應用程式不健康"
        return 1
    fi
}

# 記憶體使用檢查
memory_check() {
    MEMORY_USAGE=$(pm2 show gclaude-enterprise | grep "memory usage" | awk '{print $4}' | sed 's/M//')
    if [ "$MEMORY_USAGE" -gt 800 ]; then
        echo "⚠️ 記憶體使用量過高: ${MEMORY_USAGE}MB"
        pm2 restart gclaude-enterprise
    else
        echo "✅ 記憶體使用正常: ${MEMORY_USAGE}MB"
    fi
}

# 磁碟空間檢查
disk_check() {
    DISK_USAGE=$(df -h . | awk 'NR==2{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 85 ]; then
        echo "⚠️ 磁碟使用量過高: ${DISK_USAGE}%"
    else
        echo "✅ 磁碟空間充足: ${DISK_USAGE}%"
    fi
}

# 日誌檔案大小檢查
log_check() {
    if [ -f "logs/combined.log" ]; then
        LOG_SIZE=$(du -m logs/combined.log | cut -f1)
        if [ "$LOG_SIZE" -gt 100 ]; then
            echo "⚠️ 日誌檔案過大: ${LOG_SIZE}MB，正在輪轉..."
            pm2 flush gclaude-enterprise
        else
            echo "✅ 日誌檔案大小正常: ${LOG_SIZE}MB"
        fi
    fi
}

# 執行所有檢查
echo "🔍 開始系統監控檢查..."
health_check
memory_check
disk_check
log_check
echo "✅ 監控檢查完成"
