/**
 * 生產環境配置生成器
 * 創建生產部署所需的所有配置文件
 */

const fs = require('fs');
const path = require('path');

class ProductionConfigGenerator {
    constructor() {
        this.configDir = path.join(__dirname, 'production-configs');
        this.ensureConfigDirectory();
    }

    ensureConfigDirectory() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
            console.log('✅ 創建生產配置目錄');
        }
    }

    // 生成 .env.production 文件
    generateProductionEnv() {
        const envContent = `# GClaude Enterprise System - 生產環境配置
# 生成時間: ${new Date().toISOString()}

# 環境設定
NODE_ENV=production
PORT=3007

# 數據庫配置
DATABASE_URL=sqlite://./data/enterprise.db
DATABASE_BACKUP_URL=sqlite://./data/backups/enterprise_backup.db

# JWT 安全密鑰 (請在生產環境中更改此密鑰)
JWT_SECRET=gclaude-enterprise-production-jwt-secret-key-2025-$(openssl rand -hex 32)

# Telegram 通知配置
TELEGRAM_BOT_TOKEN=7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc
TELEGRAM_BOSS_CHAT_ID=-1002658082392
TELEGRAM_EMPLOYEE_CHAT_ID=-1002658082392

# 伺服器配置
SERVER_HOST=0.0.0.0
SERVER_MAX_REQUESTS_PER_WINDOW=5000
SERVER_WINDOW_MS=900000

# CORS 設定
CORS_ORIGIN=https://your-domain.com
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With

# 日誌配置
LOG_LEVEL=info
LOG_FILE=./logs/production.log
ERROR_LOG_FILE=./logs/error.log

# 檔案上傳限制
MAX_FILE_SIZE=50mb
UPLOAD_PATH=./uploads

# 會話配置
SESSION_SECRET=gclaude-enterprise-session-secret-$(openssl rand -hex 32)
SESSION_MAX_AGE=86400000

# 安全設定
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW_MS=900000

# 監控設定
ENABLE_MONITORING=true
HEALTH_CHECK_INTERVAL=30000

# 備份設定
AUTO_BACKUP_ENABLED=true
BACKUP_INTERVAL_HOURS=6
BACKUP_RETENTION_DAYS=30

# 通知設定
EMAIL_ENABLED=false
SMS_ENABLED=false
TELEGRAM_ENABLED=true

# 效能設定
CACHE_ENABLED=true
CACHE_TTL=3600
COMPRESSION_ENABLED=true

# SSL/TLS 設定
SSL_ENABLED=true
SSL_CERT_PATH=./ssl/cert.pem
SSL_KEY_PATH=./ssl/key.pem
SSL_CA_PATH=./ssl/ca.pem

# 代理設定
TRUST_PROXY=true
PROXY_COUNT=1
`;

        const envPath = path.join(this.configDir, '.env.production');
        fs.writeFileSync(envPath, envContent);
        console.log('✅ 生成 .env.production 文件');
        return envPath;
    }

    // 生成 PM2 配置文件
    generatePM2Config() {
        const pm2Config = {
            apps: [{
                name: 'gclaude-enterprise',
                script: './server.js',
                instances: 'max',
                exec_mode: 'cluster',
                env: {
                    NODE_ENV: 'development',
                    PORT: 3007
                },
                env_production: {
                    NODE_ENV: 'production',
                    PORT: 3007
                },
                log_file: './logs/combined.log',
                out_file: './logs/out.log',
                error_file: './logs/error.log',
                log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
                merge_logs: true,
                max_memory_restart: '1G',
                node_args: '--max-old-space-size=1024',
                restart_delay: 4000,
                max_restarts: 10,
                min_uptime: '10s',
                kill_timeout: 5000,
                wait_ready: true,
                listen_timeout: 8000,
                autorestart: true,
                watch: false,
                ignore_watch: [
                    'node_modules',
                    'logs',
                    'data',
                    'uploads',
                    '.git'
                ],
                env_file: '.env.production'
            }]
        };

        const pm2Path = path.join(this.configDir, 'ecosystem.config.js');
        const pm2Content = `module.exports = ${JSON.stringify(pm2Config, null, 2)};`;
        fs.writeFileSync(pm2Path, pm2Content);
        console.log('✅ 生成 PM2 配置文件');
        return pm2Path;
    }

    // 生成 Nginx 配置文件
    generateNginxConfig() {
        const nginxConfig = `# GClaude Enterprise System - Nginx 配置
# 生成時間: ${new Date().toISOString()}

upstream gclaude_enterprise {
    server 127.0.0.1:3007;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 憑證配置
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    ssl_trusted_certificate /path/to/ssl/ca.pem;

    # SSL 安全設定
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # 安全標頭
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 檔案大小限制
    client_max_body_size 50M;

    # Gzip 壓縮
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # 靜態檔案快取
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API 代理
    location /api/ {
        proxy_pass http://gclaude_enterprise;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # 主應用代理
    location / {
        proxy_pass http://gclaude_enterprise;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # 健康檢查
    location /health {
        access_log off;
        proxy_pass http://gclaude_enterprise;
        proxy_set_header Host $host;
    }

    # 錯誤頁面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;

    # 日誌
    access_log /var/log/nginx/gclaude_enterprise_access.log;
    error_log /var/log/nginx/gclaude_enterprise_error.log warn;
}
`;

        const nginxPath = path.join(this.configDir, 'nginx.conf');
        fs.writeFileSync(nginxPath, nginxConfig);
        console.log('✅ 生成 Nginx 配置文件');
        return nginxPath;
    }

    // 生成 Docker 配置文件
    generateDockerConfig() {
        const dockerfile = `# GClaude Enterprise System Dockerfile
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production && npm cache clean --force

# 複製應用程式檔案
COPY . .

# 創建必要目錄
RUN mkdir -p data logs uploads ssl

# 設定權限
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nodeuser -u 1001 && \\
    chown -R nodeuser:nodejs /app

# 切換到 nodeuser
USER nodeuser

# 暴露端口
EXPOSE 3007

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD node -e "require('http').get('http://localhost:3007/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# 啟動應用
CMD ["node", "server.js"]
`;

        const dockerCompose = `version: '3.8'

services:
  gclaude-enterprise:
    build: .
    container_name: gclaude-enterprise
    restart: unless-stopped
    ports:
      - "3007:3007"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./uploads:/app/uploads
      - ./ssl:/app/ssl
    env_file:
      - .env.production
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3007/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - gclaude_network

  nginx:
    image: nginx:alpine
    container_name: gclaude-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./production-configs/nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - gclaude-enterprise
    networks:
      - gclaude_network

networks:
  gclaude_network:
    driver: bridge
`;

        const dockerfilePath = path.join(this.configDir, 'Dockerfile');
        const dockerComposePath = path.join(this.configDir, 'docker-compose.yml');
        
        fs.writeFileSync(dockerfilePath, dockerfile);
        fs.writeFileSync(dockerComposePath, dockerCompose);
        
        console.log('✅ 生成 Docker 配置文件');
        return { dockerfilePath, dockerComposePath };
    }

    // 生成部署腳本
    generateDeploymentScript() {
        const deployScript = `#!/bin/bash

# GClaude Enterprise System 部署腳本
# 生成時間: ${new Date().toISOString()}

set -e

echo "🚀 開始部署 GClaude Enterprise System..."

# 顏色定義
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# 函數定義
log_info() {
    echo -e "\${GREEN}[INFO]\${NC} $1"
}

log_warn() {
    echo -e "\${YELLOW}[WARN]\${NC} $1"
}

log_error() {
    echo -e "\${RED}[ERROR]\${NC} $1"
}

# 檢查必要條件
check_requirements() {
    log_info "檢查系統要求..."
    
    # 檢查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安裝，請先安裝 Node.js 18 或更高版本"
        exit 1
    fi
    
    NODE_VERSION=\$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "\$NODE_VERSION" -lt 18 ]; then
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
`;

        const deployPath = path.join(this.configDir, 'deploy.sh');
        fs.writeFileSync(deployPath, deployScript);
        
        // 設定執行權限 (在 Unix 系統上)
        if (process.platform !== 'win32') {
            fs.chmodSync(deployPath, '755');
        }
        
        console.log('✅ 生成部署腳本');
        return deployPath;
    }

    // 生成系統監控腳本
    generateMonitoringScript() {
        const monitorScript = `#!/bin/bash

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
    MEMORY_USAGE=\$(pm2 show gclaude-enterprise | grep "memory usage" | awk '{print \$4}' | sed 's/M//')
    if [ "\$MEMORY_USAGE" -gt 800 ]; then
        echo "⚠️ 記憶體使用量過高: \${MEMORY_USAGE}MB"
        pm2 restart gclaude-enterprise
    else
        echo "✅ 記憶體使用正常: \${MEMORY_USAGE}MB"
    fi
}

# 磁碟空間檢查
disk_check() {
    DISK_USAGE=\$(df -h . | awk 'NR==2{print \$5}' | sed 's/%//')
    if [ "\$DISK_USAGE" -gt 85 ]; then
        echo "⚠️ 磁碟使用量過高: \${DISK_USAGE}%"
    else
        echo "✅ 磁碟空間充足: \${DISK_USAGE}%"
    fi
}

# 日誌檔案大小檢查
log_check() {
    if [ -f "logs/combined.log" ]; then
        LOG_SIZE=\$(du -m logs/combined.log | cut -f1)
        if [ "\$LOG_SIZE" -gt 100 ]; then
            echo "⚠️ 日誌檔案過大: \${LOG_SIZE}MB，正在輪轉..."
            pm2 flush gclaude-enterprise
        else
            echo "✅ 日誌檔案大小正常: \${LOG_SIZE}MB"
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
`;

        const monitorPath = path.join(this.configDir, 'monitor.sh');
        fs.writeFileSync(monitorPath, monitorScript);
        
        if (process.platform !== 'win32') {
            fs.chmodSync(monitorPath, '755');
        }
        
        console.log('✅ 生成系統監控腳本');
        return monitorPath;
    }

    // 生成備份腳本
    generateBackupScript() {
        const backupScript = `#!/bin/bash

# GClaude Enterprise System 備份腳本

BACKUP_DIR="./data/backups"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
DB_FILE="./data/enterprise.db"

# 創建備份目錄
mkdir -p "\$BACKUP_DIR"

# 備份數據庫
if [ -f "\$DB_FILE" ]; then
    cp "\$DB_FILE" "\$BACKUP_DIR/enterprise_\$TIMESTAMP.db"
    echo "✅ 數據庫備份完成: enterprise_\$TIMESTAMP.db"
else
    echo "❌ 數據庫文件不存在"
    exit 1
fi

# 壓縮舊備份
find "\$BACKUP_DIR" -name "*.db" -type f -mtime +7 -exec gzip {} \\;

# 清理超過 30 天的備份
find "\$BACKUP_DIR" -name "*.gz" -type f -mtime +30 -delete

echo "✅ 備份作業完成"
`;

        const backupPath = path.join(this.configDir, 'backup.sh');
        fs.writeFileSync(backupPath, backupScript);
        
        if (process.platform !== 'win32') {
            fs.chmodSync(backupPath, '755');
        }
        
        console.log('✅ 生成備份腳本');
        return backupPath;
    }

    // 生成 README 文件
    generateDeploymentReadme() {
        const readme = `# GClaude Enterprise System - 生產部署指南

## 📋 部署前檢查清單

### 系統要求
- [x] Node.js 18+ 已安裝
- [x] PM2 已安裝
- [x] Nginx 已配置 (可選)
- [x] SSL 憑證已準備 (可選)
- [x] 防火牆已配置

### 配置檢查
- [x] .env.production 已配置
- [x] Telegram Bot Token 有效
- [x] 數據庫路徑可寫入
- [x] 日誌目錄可寫入

## 🚀 快速部署

### 方法 1: 使用部署腳本 (推薦)
\`\`\`bash
chmod +x deploy.sh
./deploy.sh
\`\`\`

### 方法 2: 手動部署
\`\`\`bash
# 1. 安裝依賴
npm ci --only=production

# 2. 複製配置
cp production-configs/.env.production .env
cp production-configs/ecosystem.config.js .

# 3. 初始化數據庫
node seed-data-manager.js

# 4. 啟動服務
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
\`\`\`

### 方法 3: Docker 部署
\`\`\`bash
# 複製 Docker 文件
cp production-configs/Dockerfile .
cp production-configs/docker-compose.yml .

# 啟動容器
docker-compose up -d
\`\`\`

## 📊 服務管理

### PM2 命令
\`\`\`bash
# 查看狀態
pm2 status

# 查看日誌
pm2 logs gclaude-enterprise

# 重啟服務
pm2 restart gclaude-enterprise

# 停止服務
pm2 stop gclaude-enterprise

# 監控
pm2 monit
\`\`\`

### 健康檢查
\`\`\`bash
# 檢查服務健康
curl http://localhost:3007/api/health

# 運行監控腳本
./monitor.sh
\`\`\`

### 備份管理
\`\`\`bash
# 手動備份
./backup.sh

# 設定自動備份 (crontab)
0 2 * * * /path/to/backup.sh
\`\`\`

## 🔧 故障排除

### 常見問題

1. **服務無法啟動**
   - 檢查 .env 配置
   - 查看 pm2 日誌: \`pm2 logs gclaude-enterprise\`
   - 確認端口 3007 未被占用

2. **數據庫連接失敗**
   - 確認 data 目錄存在且可寫入
   - 檢查數據庫文件權限

3. **Telegram 通知失敗**
   - 驗證 Bot Token
   - 檢查群組 ID
   - 確認網路連接

### 日誌位置
- 應用日誌: \`./logs/\`
- PM2 日誌: \`~/.pm2/logs/\`
- Nginx 日誌: \`/var/log/nginx/\`

## 🔒 安全考量

### 重要安全設定
1. **更改預設密碼**
   - 管理員密碼: admin123 → 強密碼
   - JWT Secret: 使用隨機生成的密鑰

2. **SSL/TLS 配置**
   - 使用有效的 SSL 憑證
   - 配置 HSTS 標頭
   - 禁用不安全的 TLS 版本

3. **防火牆設定**
   - 只開放必要端口 (80, 443)
   - 限制 SSH 訪問
   - 配置 fail2ban

4. **定期更新**
   - 定期更新 Node.js 依賴
   - 監控安全漏洞
   - 備份重要數據

## 📈 性能優化

### 建議配置
- 使用 PM2 cluster 模式
- 配置 Nginx 反向代理
- 啟用 Gzip 壓縮
- 設定適當的快取策略

### 監控指標
- CPU 使用率
- 記憶體使用量
- 磁碟空間
- 響應時間
- 錯誤率

## 📞 支援

如需技術支援，請聯繫：
- 系統管理員
- 查看日誌文件
- 提交 GitHub Issue

---
**部署日期**: ${new Date().toISOString()}
**版本**: 2.0.0
`;

        const readmePath = path.join(this.configDir, 'DEPLOYMENT_README.md');
        fs.writeFileSync(readmePath, readme);
        console.log('✅ 生成部署說明文件');
        return readmePath;
    }

    async generateAll() {
        console.log('🔧 開始生成生產環境配置...\n');

        try {
            this.generateProductionEnv();
            this.generatePM2Config();
            this.generateNginxConfig();
            this.generateDockerConfig();
            this.generateDeploymentScript();
            this.generateMonitoringScript();
            this.generateBackupScript();
            this.generateDeploymentReadme();

            console.log('\n✅ 所有生產配置文件已生成完成！');
            console.log(`📁 配置文件位置: ${this.configDir}`);
            console.log('\n📋 生成的文件:');
            console.log('- .env.production (環境變數)');
            console.log('- ecosystem.config.js (PM2 配置)');
            console.log('- nginx.conf (Nginx 配置)');
            console.log('- Dockerfile (Docker 配置)');
            console.log('- docker-compose.yml (Docker Compose)');
            console.log('- deploy.sh (部署腳本)');
            console.log('- monitor.sh (監控腳本)');
            console.log('- backup.sh (備份腳本)');
            console.log('- DEPLOYMENT_README.md (部署指南)');

            console.log('\n🚀 下一步:');
            console.log('1. 檢查和修改 .env.production 中的配置');
            console.log('2. 配置 SSL 憑證 (如果需要)');
            console.log('3. 運行 ./deploy.sh 進行部署');
            console.log('4. 使用 ./monitor.sh 監控系統狀態');

            return this.configDir;
        } catch (error) {
            console.error('❌ 生成配置時發生錯誤:', error);
            throw error;
        }
    }
}

if (require.main === module) {
    const generator = new ProductionConfigGenerator();
    generator.generateAll().catch(console.error);
}

module.exports = ProductionConfigGenerator;