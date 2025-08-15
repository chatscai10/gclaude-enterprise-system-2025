#!/bin/bash

# GClaude Enterprise System - 伺服器初始化腳本
# 適用於 Ubuntu 20.04+ / CentOS 8+ / Debian 11+

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

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
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
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
    if [ "$EUID" -ne 0 ]; then
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
main "$@"
