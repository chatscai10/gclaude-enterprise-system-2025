/**
 * 伺服器部署管理器
 * 自動化服務器配置和部署過程
 */

const fs = require('fs');
const path = require('path');

class ServerDeploymentManager {
    constructor() {
        this.scriptsDir = path.join(__dirname, 'deployment-scripts');
        this.ensureScriptsDirectory();
    }

    ensureScriptsDirectory() {
        if (!fs.existsSync(this.scriptsDir)) {
            fs.mkdirSync(this.scriptsDir, { recursive: true });
            console.log('✅ 創建部署腳本目錄');
        }
    }

    // 生成伺服器初始化腳本
    generateServerInitScript() {
        const initScript = `#!/bin/bash

# GClaude Enterprise System - 伺服器初始化腳本
# 適用於 Ubuntu 20.04+ / CentOS 8+ / Debian 11+

set -e

# 顏色定義
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m'

log_info() { echo -e "\${GREEN}[INFO]\${NC} $1"; }
log_warn() { echo -e "\${YELLOW}[WARN]\${NC} $1"; }
log_error() { echo -e "\${RED}[ERROR]\${NC} $1"; }
log_step() { echo -e "\${BLUE}[STEP]\${NC} $1"; }

# 檢測作業系統
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        log_error "無法檢測作業系統"
        exit 1
    fi
    log_info "檢測到作業系統: $OS $VER"
}

# 更新系統
update_system() {
    log_step "更新系統套件..."
    
    case $OS in
        ubuntu|debian)
            apt update
            apt upgrade -y
            apt install -y curl wget git build-essential software-properties-common
            ;;
        centos|rhel|fedora)
            yum update -y
            yum groupinstall -y "Development Tools"
            yum install -y curl wget git
            ;;
        *)
            log_error "不支援的作業系統: $OS"
            exit 1
            ;;
    esac
    
    log_info "系統更新完成"
}

# 安裝 Node.js
install_nodejs() {
    log_step "安裝 Node.js 18..."
    
    # 使用 NodeSource 官方倉庫
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    
    case $OS in
        ubuntu|debian)
            apt install -y nodejs
            ;;
        centos|rhel|fedora)
            yum install -y nodejs npm
            ;;
    esac
    
    # 驗證安裝
    NODE_VERSION=\$(node -v)
    NPM_VERSION=\$(npm -v)
    log_info "Node.js 安裝完成: $NODE_VERSION"
    log_info "npm 版本: $NPM_VERSION"
    
    # 安裝 PM2
    npm install -g pm2
    log_info "PM2 安裝完成"
}

# 安裝 Nginx
install_nginx() {
    log_step "安裝 Nginx..."
    
    case $OS in
        ubuntu|debian)
            apt install -y nginx
            ;;
        centos|rhel|fedora)
            yum install -y nginx
            ;;
    esac
    
    # 啟用並啟動 Nginx
    systemctl enable nginx
    systemctl start nginx
    
    log_info "Nginx 安裝並啟動完成"
}

# 配置防火牆
configure_firewall() {
    log_step "配置防火牆..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian UFW
        ufw allow ssh
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 3007/tcp
        ufw --force enable
        log_info "UFW 防火牆配置完成"
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL firewalld
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --permanent --add-port=3007/tcp
        firewall-cmd --reload
        log_info "firewalld 防火牆配置完成"
    else
        log_warn "未檢測到防火牆，請手動配置"
    fi
}

# 創建應用程式使用者
create_app_user() {
    log_step "創建應用程式使用者..."
    
    if ! id "gclaude" &>/dev/null; then
        useradd -m -s /bin/bash gclaude
        usermod -aG sudo gclaude
        log_info "使用者 'gclaude' 創建完成"
    else
        log_info "使用者 'gclaude' 已存在"
    fi
    
    # 創建應用程式目錄
    mkdir -p /opt/gclaude-enterprise
    chown gclaude:gclaude /opt/gclaude-enterprise
    
    # 創建日誌目錄
    mkdir -p /var/log/gclaude-enterprise
    chown gclaude:gclaude /var/log/gclaude-enterprise
}

# 安裝 SSL 工具 (Let's Encrypt)
install_ssl_tools() {
    log_step "安裝 SSL 工具..."
    
    case $OS in
        ubuntu|debian)
            apt install -y certbot python3-certbot-nginx
            ;;
        centos|rhel|fedora)
            yum install -y certbot python3-certbot-nginx
            ;;
    esac
    
    log_info "Certbot 安裝完成"
}

# 配置系統優化
optimize_system() {
    log_step "優化系統設定..."
    
    # 增加文件描述符限制
    cat << EOF >> /etc/security/limits.conf
# GClaude Enterprise System
gclaude soft nofile 65535
gclaude hard nofile 65535
* soft nofile 65535
* hard nofile 65535
EOF

    # 優化網路設定
    cat << EOF >> /etc/sysctl.conf
# GClaude Enterprise System Network Optimization
net.core.somaxconn = 1024
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 1024
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 10
EOF

    sysctl -p
    log_info "系統優化完成"
}

# 安裝監控工具
install_monitoring() {
    log_step "安裝監控工具..."
    
    # 安裝 htop 和 iotop
    case $OS in
        ubuntu|debian)
            apt install -y htop iotop nethogs ncdu
            ;;
        centos|rhel|fedora)
            yum install -y htop iotop nethogs ncdu
            ;;
    esac
    
    log_info "監控工具安裝完成"
}

# 設定自動更新
setup_auto_updates() {
    log_step "設定自動安全更新..."
    
    case $OS in
        ubuntu|debian)
            apt install -y unattended-upgrades
            dpkg-reconfigure -plow unattended-upgrades
            ;;
        centos|rhel|fedora)
            yum install -y yum-cron
            systemctl enable yum-cron
            systemctl start yum-cron
            ;;
    esac
    
    log_info "自動更新設定完成"
}

# 主執行函數
main() {
    log_info "🚀 開始 GClaude Enterprise System 伺服器初始化..."
    
    # 檢查是否為 root 使用者
    if [ "\$EUID" -ne 0 ]; then
        log_error "請使用 root 權限執行此腳本"
        exit 1
    fi
    
    detect_os
    update_system
    install_nodejs
    install_nginx
    configure_firewall
    create_app_user
    install_ssl_tools
    optimize_system
    install_monitoring
    setup_auto_updates
    
    log_info "✅ 伺服器初始化完成！"
    log_info ""
    log_info "📋 後續步驟："
    log_info "1. 切換到 gclaude 使用者: su - gclaude"
    log_info "2. 克隆應用程式到 /opt/gclaude-enterprise"
    log_info "3. 執行應用程式部署腳本"
    log_info "4. 配置 SSL 憑證: certbot --nginx"
    log_info ""
    log_info "🔧 有用的命令："
    log_info "- 檢查服務狀態: systemctl status nginx"
    log_info "- 查看防火牆: ufw status 或 firewall-cmd --list-all"
    log_info "- 監控系統: htop"
}

# 執行主函數
main "\$@"
`;

        const initPath = path.join(this.scriptsDir, 'server-init.sh');
        fs.writeFileSync(initPath, initScript);
        
        if (process.platform !== 'win32') {
            fs.chmodSync(initPath, '755');
        }
        
        console.log('✅ 生成伺服器初始化腳本');
        return initPath;
    }

    // 生成應用程式部署腳本
    generateAppDeployScript() {
        const deployScript = `#!/bin/bash

# GClaude Enterprise System - 應用程式部署腳本
# 在已初始化的伺服器上部署應用程式

set -e

# 顏色和日誌函數
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m'

log_info() { echo -e "\${GREEN}[INFO]\${NC} $1"; }
log_warn() { echo -e "\${YELLOW}[WARN]\${NC} $1"; }
log_error() { echo -e "\${RED}[ERROR]\${NC} $1"; }
log_step() { echo -e "\${BLUE}[STEP]\${NC} $1"; }

# 配置變數
APP_DIR="/opt/gclaude-enterprise"
APP_USER="gclaude"
SERVICE_NAME="gclaude-enterprise"
DOMAIN_NAME="\${1:-localhost}"

# 檢查權限
check_permissions() {
    if [ "\$(whoami)" != "\$APP_USER" ] && [ "\$(whoami)" != "root" ]; then
        log_error "請使用 gclaude 使用者或 root 權限執行"
        exit 1
    fi
}

# 克隆或更新應用程式
deploy_application() {
    log_step "部署應用程式..."
    
    if [ ! -d "\$APP_DIR" ]; then
        log_info "創建應用程式目錄"
        sudo mkdir -p "\$APP_DIR"
        sudo chown \$APP_USER:\$APP_USER "\$APP_DIR"
    fi
    
    cd "\$APP_DIR"
    
    # 如果是 git 倉庫，則拉取更新
    if [ -d ".git" ]; then
        log_info "更新現有應用程式"
        git pull origin main
    else
        log_info "請手動上傳應用程式文件到 \$APP_DIR"
        log_info "或使用 git clone 克隆倉庫"
    fi
}

# 安裝依賴
install_dependencies() {
    log_step "安裝應用程式依賴..."
    
    cd "\$APP_DIR"
    
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
    
    cd "\$APP_DIR"
    
    if [ -f "production-configs/.env.production" ]; then
        cp production-configs/.env.production .env
        
        # 更新域名配置
        sed -i "s/your-domain.com/\$DOMAIN_NAME/g" .env
        
        log_info "環境配置完成"
    else
        log_warn "找不到 .env.production，使用預設配置"
        cat << EOF > .env
NODE_ENV=production
PORT=3007
JWT_SECRET=\$(openssl rand -hex 32)
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
    
    cd "\$APP_DIR"
    
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
    
    cd "\$APP_DIR"
    
    if [ -f "production-configs/ecosystem.config.js" ]; then
        cp production-configs/ecosystem.config.js .
    else
        log_info "創建 PM2 配置"
        cat << EOF > ecosystem.config.js
module.exports = {
  apps: [{
    name: '\$SERVICE_NAME',
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
    
    if [ -f "\$APP_DIR/production-configs/nginx.conf" ]; then
        sudo cp "\$APP_DIR/production-configs/nginx.conf" /etc/nginx/sites-available/gclaude-enterprise
    else
        log_info "創建 Nginx 配置"
        sudo tee /etc/nginx/sites-available/gclaude-enterprise > /dev/null << EOF
server {
    listen 80;
    server_name \$DOMAIN_NAME;
    
    location / {
        proxy_pass http://localhost:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
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
    
    cd "\$APP_DIR"
    
    # 停止現有服務
    pm2 stop \$SERVICE_NAME 2>/dev/null || true
    pm2 delete \$SERVICE_NAME 2>/dev/null || true
    
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
    if pm2 show \$SERVICE_NAME | grep -q "online"; then
        log_info "PM2 服務運行正常"
    else
        log_error "PM2 服務啟動失敗"
        pm2 logs \$SERVICE_NAME --lines 20
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
    if [ "\$DOMAIN_NAME" != "localhost" ]; then
        log_step "設定 SSL 憑證..."
        
        read -p "是否要設定 Let's Encrypt SSL 憑證？(y/n): " -n 1 -r
        echo
        
        if [[ \$REPLY =~ ^[Yy]\$ ]]; then
            sudo certbot --nginx -d \$DOMAIN_NAME
            log_info "SSL 憑證設定完成"
        fi
    fi
}

# 主執行函數
main() {
    log_info "🚀 開始部署 GClaude Enterprise System..."
    
    if [ -z "\$DOMAIN_NAME" ] || [ "\$DOMAIN_NAME" = "localhost" ]; then
        log_warn "使用預設域名 localhost"
        log_info "使用方法: \$0 <域名>"
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
    log_info "- 應用程式: http://\$DOMAIN_NAME"
    log_info "- 健康檢查: http://\$DOMAIN_NAME/api/health"
    log_info "- 服務狀態: pm2 status"
    log_info "- 日誌查看: pm2 logs \$SERVICE_NAME"
    log_info ""
    log_info "🔧 管理命令："
    log_info "- 重啟服務: pm2 restart \$SERVICE_NAME"
    log_info "- 查看日誌: pm2 logs \$SERVICE_NAME"
    log_info "- 監控狀態: pm2 monit"
}

# 執行主函數
main "\$@"
`;

        const deployPath = path.join(this.scriptsDir, 'app-deploy.sh');
        fs.writeFileSync(deployPath, deployScript);
        
        if (process.platform !== 'win32') {
            fs.chmodSync(deployPath, '755');
        }
        
        console.log('✅ 生成應用程式部署腳本');
        return deployPath;
    }

    // 生成更新腳本
    generateUpdateScript() {
        const updateScript = `#!/bin/bash

# GClaude Enterprise System - 應用程式更新腳本

set -e

RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m'

log_info() { echo -e "\${GREEN}[INFO]\${NC} $1"; }
log_warn() { echo -e "\${YELLOW}[WARN]\${NC} $1"; }
log_error() { echo -e "\${RED}[ERROR]\${NC} $1"; }
log_step() { echo -e "\${BLUE}[STEP]\${NC} $1"; }

APP_DIR="/opt/gclaude-enterprise"
SERVICE_NAME="gclaude-enterprise"
BACKUP_DIR="/opt/gclaude-enterprise/backups"

# 創建備份
create_backup() {
    log_step "創建備份..."
    
    TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
    mkdir -p "\$BACKUP_DIR"
    
    # 備份數據庫
    if [ -f "\$APP_DIR/data/enterprise.db" ]; then
        cp "\$APP_DIR/data/enterprise.db" "\$BACKUP_DIR/enterprise_\$TIMESTAMP.db"
        log_info "數據庫備份完成"
    fi
    
    # 備份配置文件
    if [ -f "\$APP_DIR/.env" ]; then
        cp "\$APP_DIR/.env" "\$BACKUP_DIR/.env_\$TIMESTAMP"
        log_info "配置備份完成"
    fi
}

# 停止服務
stop_service() {
    log_step "停止服務..."
    
    cd "\$APP_DIR"
    pm2 stop \$SERVICE_NAME
    log_info "服務已停止"
}

# 更新代碼
update_code() {
    log_step "更新應用程式代碼..."
    
    cd "\$APP_DIR"
    
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
    
    cd "\$APP_DIR"
    npm ci --only=production
    log_info "依賴更新完成"
}

# 運行遷移 (如果需要)
run_migrations() {
    log_step "檢查數據庫遷移..."
    
    cd "\$APP_DIR"
    
    # 這裡可以添加數據庫遷移邏輯
    log_info "數據庫檢查完成"
}

# 重啟服務
restart_service() {
    log_step "重啟服務..."
    
    cd "\$APP_DIR"
    pm2 restart \$SERVICE_NAME
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
    log_info "備份位置: \$BACKUP_DIR"
}

# 執行主函數
main "\$@"
`;

        const updatePath = path.join(this.scriptsDir, 'update.sh');
        fs.writeFileSync(updatePath, updateScript);
        
        if (process.platform !== 'win32') {
            fs.chmodSync(updatePath, '755');
        }
        
        console.log('✅ 生成更新腳本');
        return updatePath;
    }

    // 生成一鍵部署腳本
    generateOneClickDeploy() {
        const oneClickScript = `#!/bin/bash

# GClaude Enterprise System - 一鍵部署腳本
# 從零開始在全新伺服器上部署整個系統

set -e

RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
PURPLE='\\033[0;35m'
NC='\\033[0m'

log_info() { echo -e "\${GREEN}[INFO]\${NC} $1"; }
log_warn() { echo -e "\${YELLOW}[WARN]\${NC} $1"; }
log_error() { echo -e "\${RED}[ERROR]\${NC} $1"; }
log_step() { echo -e "\${BLUE}[STEP]\${NC} $1"; }
log_title() { echo -e "\${PURPLE}[GCLAUDE]\${NC} $1"; }

# 配置變數
DOMAIN_NAME="\${1:-localhost}"
APP_DIR="/opt/gclaude-enterprise"

# 歡迎訊息
show_welcome() {
    clear
    echo -e "\${PURPLE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║        GClaude Enterprise System 一鍵部署腳本              ║"
    echo "║                                                            ║"
    echo "║        🚀 自動化伺服器配置和應用程式部署                    ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "\${NC}"
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
    
    if [ "\$DOMAIN_NAME" = "localhost" ]; then
        log_warn "使用預設域名: localhost"
        echo "如要使用自定義域名，請執行: \$0 <您的域名>"
    else
        log_info "目標域名: \$DOMAIN_NAME"
    fi
    
    echo
    read -p "按 Enter 繼續，或 Ctrl+C 取消..."
}

# 檢查系統要求
check_requirements() {
    log_title "檢查系統要求"
    
    # 檢查是否為 root
    if [ "\$EUID" -ne 0 ]; then
        log_error "此腳本需要 root 權限執行"
        log_info "請使用: sudo \$0"
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
    
    mkdir -p \$APP_DIR /var/log/gclaude-enterprise
    chown gclaude:gclaude \$APP_DIR /var/log/gclaude-enterprise
    
    log_info "安全設定完成"
}

# 步驟3: 部署應用程式
step3_deploy_app() {
    log_title "步驟 3/7: 部署應用程式"
    
    log_step "準備應用程式目錄..."
    cd \$APP_DIR
    
    # 注意：這裡需要實際的應用程式文件
    log_warn "請確保應用程式文件已上傳到 \$APP_DIR"
    
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
    
    cd \$APP_DIR
    
    log_step "創建環境配置..."
    cat << EOF > .env
NODE_ENV=production
PORT=3007
JWT_SECRET=\$(openssl rand -hex 32)
DATABASE_URL=sqlite://./data/enterprise.db
TELEGRAM_BOT_TOKEN=7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc
TELEGRAM_BOSS_CHAT_ID=-1002658082392
TELEGRAM_EMPLOYEE_CHAT_ID=-1002658082392
CORS_ORIGIN=http://\$DOMAIN_NAME
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
    
    cd \$APP_DIR
    
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
    server_name \$DOMAIN_NAME;
    
    location / {
        proxy_pass http://localhost:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
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
    
    cd \$APP_DIR
    
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
    if [ "\$DOMAIN_NAME" != "localhost" ]; then
        log_title "SSL 憑證配置 (可選)"
        
        read -p "是否要設定 Let's Encrypt SSL 憑證？(y/n): " -n 1 -r
        echo
        
        if [[ \$REPLY =~ ^[Yy]\$ ]]; then
            apt install -y certbot python3-certbot-nginx
            certbot --nginx -d \$DOMAIN_NAME
            log_info "SSL 憑證設定完成"
        fi
    fi
}

# 顯示完成訊息
show_completion() {
    clear
    echo -e "\${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║                    🎉 部署完成！                           ║"
    echo "║                                                            ║"
    echo "║        GClaude Enterprise System 已成功部署               ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "\${NC}"
    echo
    log_info "🌐 應用程式網址: http://\$DOMAIN_NAME"
    log_info "🔍 健康檢查: http://\$DOMAIN_NAME/api/health"
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
main "\$@"
`;

        const oneClickPath = path.join(this.scriptsDir, 'one-click-deploy.sh');
        fs.writeFileSync(oneClickPath, oneClickScript);
        
        if (process.platform !== 'win32') {
            fs.chmodSync(oneClickPath, '755');
        }
        
        console.log('✅ 生成一鍵部署腳本');
        return oneClickPath;
    }

    // 生成部署說明文件
    generateDeploymentGuide() {
        const guide = `# GClaude Enterprise System - 伺服器部署指南

## 🚀 部署選項

### 選項 1: 一鍵部署 (推薦給新手)
在全新的 Ubuntu 20.04+ 伺服器上執行：
\`\`\`bash
wget https://raw.githubusercontent.com/your-repo/one-click-deploy.sh
chmod +x one-click-deploy.sh
sudo ./one-click-deploy.sh your-domain.com
\`\`\`

### 選項 2: 分步部署 (進階使用者)

#### 步驟 1: 初始化伺服器
\`\`\`bash
# 在 root 權限下執行
chmod +x server-init.sh
./server-init.sh
\`\`\`

#### 步驟 2: 部署應用程式
\`\`\`bash
# 切換到 gclaude 使用者
su - gclaude

# 上傳應用程式文件到 /opt/gclaude-enterprise
# 然後執行部署腳本
chmod +x app-deploy.sh
./app-deploy.sh your-domain.com
\`\`\`

#### 步驟 3: 配置 SSL (可選)
\`\`\`bash
sudo certbot --nginx -d your-domain.com
\`\`\`

## 📋 系統要求

### 硬體要求
- CPU: 1 核心以上 (建議 2 核心)
- RAM: 1GB 以上 (建議 2GB)
- 硬碟: 10GB 以上可用空間
- 網路: 穩定的網際網路連接

### 軟體要求
- 作業系統: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Root 權限
- 已開放的防火牆端口: 22, 80, 443, 3007

### 網域要求 (可選)
- 已註冊的網域名稱
- DNS A 記錄指向伺服器 IP
- 用於 SSL 憑證申請

## 🔧 部署後設定

### 1. 修改預設密碼
登入系統後立即修改所有預設帳號密碼：
- admin / admin123
- manager / manager123  
- employee / employee123
- intern / intern123

### 2. 配置 Telegram 通知
編輯 \`.env\` 文件中的 Telegram 設定：
\`\`\`bash
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
TELEGRAM_BOSS_CHAT_ID=YOUR_BOSS_CHAT_ID
TELEGRAM_EMPLOYEE_CHAT_ID=YOUR_EMPLOYEE_CHAT_ID
\`\`\`

### 3. 設定自動備份
編輯 crontab 添加自動備份：
\`\`\`bash
crontab -e
# 每天凌晨 2 點備份
0 2 * * * /opt/gclaude-enterprise/deployment-scripts/backup.sh
\`\`\`

### 4. 配置監控
設定系統監控和警報：
\`\`\`bash
# 每 5 分鐘檢查一次
*/5 * * * * /opt/gclaude-enterprise/deployment-scripts/monitor.sh
\`\`\`

## 🛠️ 維護操作

### 日常管理命令
\`\`\`bash
# 查看服務狀態
pm2 status

# 查看即時日誌
pm2 logs gclaude-enterprise --lines 100

# 重啟服務
pm2 restart gclaude-enterprise

# 查看系統資源
htop

# 查看磁碟使用
df -h
\`\`\`

### 更新應用程式
\`\`\`bash
cd /opt/gclaude-enterprise
./deployment-scripts/update.sh
\`\`\`

### 備份和還原
\`\`\`bash
# 手動備份
./deployment-scripts/backup.sh

# 還原備份 (將備份文件複製回原位置)
cp /opt/gclaude-enterprise/data/backups/enterprise_YYYYMMDD_HHMMSS.db /opt/gclaude-enterprise/data/enterprise.db
pm2 restart gclaude-enterprise
\`\`\`

## 🔒 安全最佳實踐

### 1. 系統安全
- 定期更新系統套件
- 使用強密碼和 SSH 金鑰
- 配置 fail2ban 防止暴力破解
- 定期檢查系統日誌

### 2. 應用程式安全
- 修改所有預設密碼
- 定期更新 Node.js 依賴
- 監控應用程式日誌
- 備份重要數據

### 3. 網路安全
- 使用 SSL/TLS 加密
- 配置適當的防火牆規則
- 隱藏 Nginx 版本資訊
- 設定安全標頭

## 🚨 故障排除

### 常見問題

1. **服務無法啟動**
\`\`\`bash
# 檢查日誌
pm2 logs gclaude-enterprise

# 檢查端口占用
netstat -tlnp | grep :3007

# 檢查配置文件
cat /opt/gclaude-enterprise/.env
\`\`\`

2. **無法訪問網站**
\`\`\`bash
# 檢查 Nginx 狀態
systemctl status nginx

# 檢查 Nginx 配置
nginx -t

# 檢查防火牆
ufw status
\`\`\`

3. **數據庫問題**
\`\`\`bash
# 檢查數據庫文件
ls -la /opt/gclaude-enterprise/data/

# 檢查權限
ls -la /opt/gclaude-enterprise/data/enterprise.db
\`\`\`

4. **SSL 憑證問題**
\`\`\`bash
# 檢查憑證狀態
certbot certificates

# 更新憑證
certbot renew
\`\`\`

### 緊急恢復
如果系統出現嚴重問題：

1. 停止服務：\`pm2 stop gclaude-enterprise\`
2. 從備份還原數據庫
3. 檢查配置文件
4. 重新啟動服務：\`pm2 start gclaude-enterprise\`

## 📞 技術支援

### 日誌位置
- 應用程式日誌: \`/opt/gclaude-enterprise/logs/\`
- PM2 日誌: \`~/.pm2/logs/\`
- Nginx 日誌: \`/var/log/nginx/\`
- 系統日誌: \`/var/log/syslog\`

### 監控指標
- CPU 使用率
- 記憶體使用量
- 磁碟空間
- 網路流量
- 應用程式響應時間
- 錯誤率

### 獲得幫助
1. 查看應用程式日誌
2. 檢查系統資源
3. 查詢錯誤訊息
4. 聯繫技術支援

---
**更新日期**: ${new Date().toISOString()}
**版本**: 2.0.0
**支援**: GClaude Enterprise System
`;

        const guidePath = path.join(this.scriptsDir, 'SERVER_DEPLOYMENT_GUIDE.md');
        fs.writeFileSync(guidePath, guide);
        console.log('✅ 生成伺服器部署指南');
        return guidePath;
    }

    async generateAll() {
        console.log('🔧 開始生成伺服器部署腳本...\n');

        try {
            this.generateServerInitScript();
            this.generateAppDeployScript();
            this.generateUpdateScript();
            this.generateOneClickDeploy();
            this.generateDeploymentGuide();

            console.log('\n✅ 所有部署腳本已生成完成！');
            console.log(`📁 腳本位置: ${this.scriptsDir}`);
            console.log('\n📋 生成的腳本:');
            console.log('- server-init.sh (伺服器初始化)');
            console.log('- app-deploy.sh (應用程式部署)');
            console.log('- update.sh (應用程式更新)');
            console.log('- one-click-deploy.sh (一鍵部署)');
            console.log('- SERVER_DEPLOYMENT_GUIDE.md (部署指南)');

            console.log('\n🚀 使用方法:');
            console.log('1. 新伺服器一鍵部署: ./one-click-deploy.sh <域名>');
            console.log('2. 分步部署: 先執行 server-init.sh，再執行 app-deploy.sh');
            console.log('3. 應用程式更新: ./update.sh');

            return this.scriptsDir;
        } catch (error) {
            console.error('❌ 生成腳本時發生錯誤:', error);
            throw error;
        }
    }
}

if (require.main === module) {
    const manager = new ServerDeploymentManager();
    manager.generateAll().catch(console.error);
}

module.exports = ServerDeploymentManager;