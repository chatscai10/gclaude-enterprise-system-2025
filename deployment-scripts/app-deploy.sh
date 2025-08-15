#!/bin/bash

# GClaude Enterprise System - 應用程式部署腳本
# 在已初始化的伺服器上部署應用程式

set -e

# 顏色和日誌函數
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# 配置變數
APP_DIR="/opt/gclaude-enterprise"
APP_USER="gclaude"
SERVICE_NAME="gclaude-enterprise"
DOMAIN_NAME="${1:-localhost}"

# 檢查權限
check_permissions() {
    if [ "$(whoami)" != "$APP_USER" ] && [ "$(whoami)" != "root" ]; then
        log_error "請使用 gclaude 使用者或 root 權限執行"
        exit 1
    fi
}

# 克隆或更新應用程式
deploy_application() {
    log_step "部署應用程式..."
    
    if [ ! -d "$APP_DIR" ]; then
        log_info "創建應用程式目錄"
        sudo mkdir -p "$APP_DIR"
        sudo chown $APP_USER:$APP_USER "$APP_DIR"
    fi
    
    cd "$APP_DIR"
    
    # 如果是 git 倉庫，則拉取更新
    if [ -d ".git" ]; then
        log_info "更新現有應用程式"
        git pull origin main
    else
        log_info "請手動上傳應用程式文件到 $APP_DIR"
        log_info "或使用 git clone 克隆倉庫"
    fi
}

# 安裝依賴
install_dependencies() {
    log_step "安裝應用程式依賴..."
    
    cd "$APP_DIR"
    
    if [ -f "package.json" ]; then
        npm ci --only=production
        log_info "依賴安裝完成"
    else
        log_error "找不到 package.json"
        exit 1
    fi
}

# 配置環境
configure_environment() {
    log_step "配置環境變數..."
    
    cd "$APP_DIR"
    
    if [ -f "production-configs/.env.production" ]; then
        cp production-configs/.env.production .env
        
        # 更新域名配置
        sed -i "s/your-domain.com/$DOMAIN_NAME/g" .env
        
        log_info "環境配置完成"
    else
        log_warn "找不到 .env.production，使用預設配置"
        cat << EOF > .env
NODE_ENV=production
PORT=3007
JWT_SECRET=$(openssl rand -hex 32)
DATABASE_URL=sqlite://./data/enterprise.db
TELEGRAM_BOT_TOKEN=7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc
TELEGRAM_BOSS_CHAT_ID=-1002658082392
TELEGRAM_EMPLOYEE_CHAT_ID=-1002658082392
EOF
    fi
}

# 初始化數據庫
initialize_database() {
    log_step "初始化數據庫..."
    
    cd "$APP_DIR"
    
    # 創建必要目錄
    mkdir -p data logs uploads ssl
    
    # 運行種子數據腳本
    if [ -f "seed-data-manager.js" ]; then
        node seed-data-manager.js
        log_info "數據庫初始化完成"
    else
        log_warn "找不到種子數據腳本"
    fi
}

# 配置 PM2
configure_pm2() {
    log_step "配置 PM2..."
    
    cd "$APP_DIR"
    
    if [ -f "production-configs/ecosystem.config.js" ]; then
        cp production-configs/ecosystem.config.js .
    else
        log_info "創建 PM2 配置"
        cat << EOF > ecosystem.config.js
module.exports = {
  apps: [{
    name: '$SERVICE_NAME',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3007
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
};
EOF
    fi
    
    log_info "PM2 配置完成"
}

# 配置 Nginx
configure_nginx() {
    log_step "配置 Nginx..."
    
    if [ -f "$APP_DIR/production-configs/nginx.conf" ]; then
        sudo cp "$APP_DIR/production-configs/nginx.conf" /etc/nginx/sites-available/gclaude-enterprise
    else
        log_info "創建 Nginx 配置"
        sudo tee /etc/nginx/sites-available/gclaude-enterprise > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;
    
    location / {
        proxy_pass http://localhost:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api/health {
        proxy_pass http://localhost:3007;
        access_log off;
    }
}
EOF
    fi
    
    # 啟用站點
    sudo ln -sf /etc/nginx/sites-available/gclaude-enterprise /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # 測試並重載 Nginx
    sudo nginx -t
    sudo systemctl reload nginx
    
    log_info "Nginx 配置完成"
}

# 啟動服務
start_services() {
    log_step "啟動服務..."
    
    cd "$APP_DIR"
    
    # 停止現有服務
    pm2 stop $SERVICE_NAME 2>/dev/null || true
    pm2 delete $SERVICE_NAME 2>/dev/null || true
    
    # 啟動新服務
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    
    log_info "服務啟動完成"
}

# 驗證部署
verify_deployment() {
    log_step "驗證部署..."
    
    sleep 5
    
    # 檢查 PM2 狀態
    if pm2 show $SERVICE_NAME | grep -q "online"; then
        log_info "PM2 服務運行正常"
    else
        log_error "PM2 服務啟動失敗"
        pm2 logs $SERVICE_NAME --lines 20
        exit 1
    fi
    
    # 檢查應用程式健康
    if curl -f http://localhost:3007/api/health > /dev/null 2>&1; then
        log_info "應用程式健康檢查通過"
    else
        log_error "應用程式健康檢查失敗"
        exit 1
    fi
    
    # 檢查 Nginx
    if sudo nginx -t; then
        log_info "Nginx 配置正確"
    else
        log_error "Nginx 配置錯誤"
        exit 1
    fi
    
    log_info "部署驗證完成"
}

# 設定 SSL (可選)
setup_ssl() {
    if [ "$DOMAIN_NAME" != "localhost" ]; then
        log_step "設定 SSL 憑證..."
        
        read -p "是否要設定 Let's Encrypt SSL 憑證？(y/n): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo certbot --nginx -d $DOMAIN_NAME
            log_info "SSL 憑證設定完成"
        fi
    fi
}

# 主執行函數
main() {
    log_info "🚀 開始部署 GClaude Enterprise System..."
    
    if [ -z "$DOMAIN_NAME" ] || [ "$DOMAIN_NAME" = "localhost" ]; then
        log_warn "使用預設域名 localhost"
        log_info "使用方法: $0 <域名>"
    fi
    
    check_permissions
    deploy_application
    install_dependencies
    configure_environment
    initialize_database
    configure_pm2
    configure_nginx
    start_services
    verify_deployment
    setup_ssl
    
    log_info "✅ 部署完成！"
    log_info ""
    log_info "📋 服務資訊："
    log_info "- 應用程式: http://$DOMAIN_NAME"
    log_info "- 健康檢查: http://$DOMAIN_NAME/api/health"
    log_info "- 服務狀態: pm2 status"
    log_info "- 日誌查看: pm2 logs $SERVICE_NAME"
    log_info ""
    log_info "🔧 管理命令："
    log_info "- 重啟服務: pm2 restart $SERVICE_NAME"
    log_info "- 查看日誌: pm2 logs $SERVICE_NAME"
    log_info "- 監控狀態: pm2 monit"
}

# 執行主函數
main "$@"
