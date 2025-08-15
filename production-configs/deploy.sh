#!/bin/bash

# GClaude Enterprise System 部署腳本
# 生成時間: 2025-08-14T07:49:18.574Z

set -e

echo "🚀 開始部署 GClaude Enterprise System..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函數定義
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查必要條件
check_requirements() {
    log_info "檢查系統要求..."
    
    # 檢查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安裝，請先安裝 Node.js 18 或更高版本"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js 版本過低，需要 18 或更高版本"
        exit 1
    fi
    
    # 檢查 PM2
    if ! command -v pm2 &> /dev/null; then
        log_warn "PM2 未安裝，正在安裝..."
        npm install -g pm2
    fi
    
    log_info "系統要求檢查通過"
}

# 創建必要目錄
create_directories() {
    log_info "創建必要目錄..."
    mkdir -p data logs uploads ssl production-configs
    chmod 755 data logs uploads
    log_info "目錄創建完成"
}

# 安裝依賴
install_dependencies() {
    log_info "安裝 Node.js 依賴..."
    npm ci --only=production
    log_info "依賴安裝完成"
}

# 複製配置文件
copy_configs() {
    log_info "複製生產配置文件..."
    
    if [ -f "production-configs/.env.production" ]; then
        cp production-configs/.env.production .env
        log_info "環境配置已複製"
    else
        log_error "找不到 .env.production 文件"
        exit 1
    fi
    
    if [ -f "production-configs/ecosystem.config.js" ]; then
        cp production-configs/ecosystem.config.js .
        log_info "PM2 配置已複製"
    fi
}

# 數據庫初始化
init_database() {
    log_info "初始化數據庫..."
    node -e "
        const database = require('./database');
        console.log('數據庫初始化完成');
    "
}

# 創建種子數據
seed_data() {
    log_info "創建種子數據..."
    if [ -f "seed-data-manager.js" ]; then
        node seed-data-manager.js
    else
        log_warn "種子數據腳本不存在，跳過"
    fi
}

# 啟動服務
start_service() {
    log_info "啟動服務..."
    
    # 停止現有服務
    pm2 stop gclaude-enterprise 2>/dev/null || true
    pm2 delete gclaude-enterprise 2>/dev/null || true
    
    # 啟動新服務
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    
    log_info "服務啟動完成"
}

# 驗證部署
verify_deployment() {
    log_info "驗證部署..."
    
    sleep 5
    
    if curl -f http://localhost:3007/api/health > /dev/null 2>&1; then
        log_info "健康檢查通過"
    else
        log_error "健康檢查失敗"
        pm2 logs gclaude-enterprise --lines 20
        exit 1
    fi
    
    log_info "部署驗證完成"
}

# 主執行流程
main() {
    log_info "開始部署流程..."
    
    check_requirements
    create_directories
    install_dependencies
    copy_configs
    init_database
    seed_data
    start_service
    verify_deployment
    
    log_info "✅ 部署完成！"
    log_info "應用程式已在 http://localhost:3007 運行"
    log_info "使用 'pm2 status' 查看服務狀態"
    log_info "使用 'pm2 logs gclaude-enterprise' 查看日誌"
}

# 執行主函數
main "$@"
