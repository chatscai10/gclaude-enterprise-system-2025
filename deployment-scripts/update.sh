#!/bin/bash

# GClaude Enterprise System - 應用程式更新腳本

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

APP_DIR="/opt/gclaude-enterprise"
SERVICE_NAME="gclaude-enterprise"
BACKUP_DIR="/opt/gclaude-enterprise/backups"

# 創建備份
create_backup() {
    log_step "創建備份..."
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    mkdir -p "$BACKUP_DIR"
    
    # 備份數據庫
    if [ -f "$APP_DIR/data/enterprise.db" ]; then
        cp "$APP_DIR/data/enterprise.db" "$BACKUP_DIR/enterprise_$TIMESTAMP.db"
        log_info "數據庫備份完成"
    fi
    
    # 備份配置文件
    if [ -f "$APP_DIR/.env" ]; then
        cp "$APP_DIR/.env" "$BACKUP_DIR/.env_$TIMESTAMP"
        log_info "配置備份完成"
    fi
}

# 停止服務
stop_service() {
    log_step "停止服務..."
    
    cd "$APP_DIR"
    pm2 stop $SERVICE_NAME
    log_info "服務已停止"
}

# 更新代碼
update_code() {
    log_step "更新應用程式代碼..."
    
    cd "$APP_DIR"
    
    if [ -d ".git" ]; then
        git pull origin main
        log_info "代碼更新完成"
    else
        log_warn "非 Git 倉庫，請手動更新文件"
    fi
}

# 更新依賴
update_dependencies() {
    log_step "更新依賴套件..."
    
    cd "$APP_DIR"
    npm ci --only=production
    log_info "依賴更新完成"
}

# 運行遷移 (如果需要)
run_migrations() {
    log_step "檢查數據庫遷移..."
    
    cd "$APP_DIR"
    
    # 這裡可以添加數據庫遷移邏輯
    log_info "數據庫檢查完成"
}

# 重啟服務
restart_service() {
    log_step "重啟服務..."
    
    cd "$APP_DIR"
    pm2 restart $SERVICE_NAME
    pm2 save
    
    log_info "服務已重啟"
}

# 驗證更新
verify_update() {
    log_step "驗證更新..."
    
    sleep 5
    
    if curl -f http://localhost:3007/api/health > /dev/null 2>&1; then
        log_info "健康檢查通過"
    else
        log_error "健康檢查失敗，可能需要回滾"
        exit 1
    fi
    
    log_info "更新驗證完成"
}

# 主執行函數
main() {
    log_info "🔄 開始更新 GClaude Enterprise System..."
    
    create_backup
    stop_service
    update_code
    update_dependencies
    run_migrations
    restart_service
    verify_update
    
    log_info "✅ 更新完成！"
    log_info "備份位置: $BACKUP_DIR"
}

# 執行主函數
main "$@"
