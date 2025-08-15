#!/bin/bash

# GClaude Enterprise System - 一鍵部署腳本
# 從零開始在全新伺服器上部署整個系統

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_title() { echo -e "${PURPLE}[GCLAUDE]${NC} $1"; }

# 配置變數
DOMAIN_NAME="${1:-localhost}"
APP_DIR="/opt/gclaude-enterprise"

# 歡迎訊息
show_welcome() {
    clear
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║        GClaude Enterprise System 一鍵部署腳本              ║"
    echo "║                                                            ║"
    echo "║        🚀 自動化伺服器配置和應用程式部署                    ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
    log_info "歡迎使用 GClaude Enterprise System 一鍵部署工具"
    log_info "此腳本將自動完成以下步驟："
    echo "  1. 系統初始化和套件安裝"
    echo "  2. Node.js 和 PM2 安裝"
    echo "  3. Nginx 配置"
    echo "  4. 應用程式部署"
    echo "  5. 數據庫初始化"
    echo "  6. SSL 憑證配置 (可選)"
    echo "  7. 防火牆和安全設定"
    echo
    
    if [ "$DOMAIN_NAME" = "localhost" ]; then
        log_warn "使用預設域名: localhost"
        echo "如要使用自定義域名，請執行: $0 <您的域名>"
    else
        log_info "目標域名: $DOMAIN_NAME"
    fi
    
    echo
    read -p "按 Enter 繼續，或 Ctrl+C 取消..."
}

# 檢查系統要求
check_requirements() {
    log_title "檢查系統要求"
    
    # 檢查是否為 root
    if [ "$EUID" -ne 0 ]; then
        log_error "此腳本需要 root 權限執行"
        log_info "請使用: sudo $0"
        exit 1
    fi
    
    # 檢查網路連接
    if ! ping -c 1 google.com &> /dev/null; then
        log_error "無法連接到網際網路"
        exit 1
    fi
    
    log_info "系統要求檢查通過"
}

# 步驟1: 初始化伺服器
step1_init_server() {
    log_title "步驟 1/7: 初始化伺服器"
    
    # 這裡會調用伺服器初始化腳本的邏輯
    log_step "更新系統套件..."
    apt update && apt upgrade -y
    apt install -y curl wget git build-essential software-properties-common
    
    log_step "安裝 Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    npm install -g pm2
    
    log_step "安裝 Nginx..."
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    
    log_info "伺服器初始化完成"
}

# 步驟2: 配置安全設定
step2_security() {
    log_title "步驟 2/7: 配置安全設定"
    
    log_step "配置防火牆..."
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3007/tcp
    ufw --force enable
    
    log_step "創建應用程式使用者..."
    if ! id "gclaude" &>/dev/null; then
        useradd -m -s /bin/bash gclaude
        usermod -aG sudo gclaude
    fi
    
    mkdir -p $APP_DIR /var/log/gclaude-enterprise
    chown gclaude:gclaude $APP_DIR /var/log/gclaude-enterprise
    
    log_info "安全設定完成"
}

# 步驟3: 部署應用程式
step3_deploy_app() {
    log_title "步驟 3/7: 部署應用程式"
    
    log_step "準備應用程式目錄..."
    cd $APP_DIR
    
    # 注意：這裡需要實際的應用程式文件
    log_warn "請確保應用程式文件已上傳到 $APP_DIR"
    
    if [ -f "package.json" ]; then
        log_step "安裝依賴..."
        npm ci --only=production
    else
        log_error "找不到 package.json，請確認應用程式文件已正確上傳"
        exit 1
    fi
    
    log_info "應用程式部署完成"
}

# 步驟4: 配置環境
step4_configure() {
    log_title "步驟 4/7: 配置環境"
    
    cd $APP_DIR
    
    log_step "創建環境配置..."
    cat << EOF > .env
NODE_ENV=production
PORT=3007
JWT_SECRET=$(openssl rand -hex 32)
DATABASE_URL=sqlite://./data/enterprise.db
TELEGRAM_BOT_TOKEN=7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc
TELEGRAM_BOSS_CHAT_ID=-1002658082392
TELEGRAM_EMPLOYEE_CHAT_ID=-1002658082392
CORS_ORIGIN=http://$DOMAIN_NAME
EOF

    log_step "創建 PM2 配置..."
    cat << EOF > ecosystem.config.js
module.exports = {
  apps: [{
    name: 'gclaude-enterprise',
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
    max_memory_restart: '1G'
  }]
};
EOF

    mkdir -p data logs uploads ssl
    chown -R gclaude:gclaude .
    
    log_info "環境配置完成"
}

# 步驟5: 初始化數據庫
step5_database() {
    log_title "步驟 5/7: 初始化數據庫"
    
    cd $APP_DIR
    
    if [ -f "seed-data-manager.js" ]; then
        sudo -u gclaude node seed-data-manager.js
        log_info "數據庫初始化完成"
    else
        log_warn "找不到數據庫初始化腳本"
    fi
}

# 步驟6: 配置 Nginx
step6_nginx() {
    log_title "步驟 6/7: 配置 Nginx"
    
    log_step "創建 Nginx 配置..."
    cat << EOF > /etc/nginx/sites-available/gclaude-enterprise
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
}
EOF

    ln -sf /etc/nginx/sites-available/gclaude-enterprise /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    nginx -t && systemctl reload nginx
    
    log_info "Nginx 配置完成"
}

# 步驟7: 啟動服務
step7_start() {
    log_title "步驟 7/7: 啟動服務"
    
    cd $APP_DIR
    
    log_step "啟動應用程式..."
    sudo -u gclaude pm2 start ecosystem.config.js --env production
    sudo -u gclaude pm2 save
    sudo -u gclaude pm2 startup
    
    log_step "驗證部署..."
    sleep 5
    
    if curl -f http://localhost:3007/api/health > /dev/null 2>&1; then
        log_info "健康檢查通過"
    else
        log_error "健康檢查失敗"
        exit 1
    fi
    
    log_info "服務啟動完成"
}

# SSL 配置 (可選)
configure_ssl() {
    if [ "$DOMAIN_NAME" != "localhost" ]; then
        log_title "SSL 憑證配置 (可選)"
        
        read -p "是否要設定 Let's Encrypt SSL 憑證？(y/n): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            apt install -y certbot python3-certbot-nginx
            certbot --nginx -d $DOMAIN_NAME
            log_info "SSL 憑證設定完成"
        fi
    fi
}

# 顯示完成訊息
show_completion() {
    clear
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║                    🎉 部署完成！                           ║"
    echo "║                                                            ║"
    echo "║        GClaude Enterprise System 已成功部署               ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
    log_info "🌐 應用程式網址: http://$DOMAIN_NAME"
    log_info "🔍 健康檢查: http://$DOMAIN_NAME/api/health"
    echo
    log_info "👤 預設登入帳號:"
    echo "  管理員: admin / admin123"
    echo "  店長:   manager / manager123"
    echo "  員工:   employee / employee123"
    echo "  實習:   intern / intern123"
    echo
    log_info "🔧 管理命令:"
    echo "  查看狀態: sudo -u gclaude pm2 status"
    echo "  查看日誌: sudo -u gclaude pm2 logs gclaude-enterprise"
    echo "  重啟服務: sudo -u gclaude pm2 restart gclaude-enterprise"
    echo
    log_warn "🔒 重要提醒:"
    echo "  1. 請立即修改預設密碼"
    echo "  2. 定期備份數據庫文件"
    echo "  3. 監控系統資源使用"
}

# 主執行函數
main() {
    show_welcome
    check_requirements
    step1_init_server
    step2_security
    step3_deploy_app
    step4_configure
    step5_database
    step6_nginx
    step7_start
    configure_ssl
    show_completion
}

# 執行主函數
main "$@"
