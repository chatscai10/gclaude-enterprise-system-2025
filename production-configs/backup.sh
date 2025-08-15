#!/bin/bash

# GClaude Enterprise System 備份腳本

BACKUP_DIR="./data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_FILE="./data/enterprise.db"

# 創建備份目錄
mkdir -p "$BACKUP_DIR"

# 備份數據庫
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/enterprise_$TIMESTAMP.db"
    echo "✅ 數據庫備份完成: enterprise_$TIMESTAMP.db"
else
    echo "❌ 數據庫文件不存在"
    exit 1
fi

# 壓縮舊備份
find "$BACKUP_DIR" -name "*.db" -type f -mtime +7 -exec gzip {} \;

# 清理超過 30 天的備份
find "$BACKUP_DIR" -name "*.gz" -type f -mtime +30 -delete

echo "✅ 備份作業完成"
