# 部署指南

本指南說明如何將 GClaude Enterprise System 部署到不同的生產環境。

## 🚀 部署選項

### 1. 雲端平台部署
- **Railway** - 推薦，支援自動部署
- **Render** - 免費方案可用
- **Vercel** - Serverless 部署
- **Heroku** - 傳統 PaaS 平台

### 2. 容器化部署  
- **Docker** - 本地或雲端容器
- **Docker Compose** - 多服務編排
- **Kubernetes** - 大規模容器管理

### 3. 傳統部署
- **VPS** - 虛擬私有伺服器
- **專用伺服器** - 物理伺服器部署

## 🌐 Railway 部署 (推薦)

### 準備工作
1. 註冊 [Railway 帳號](https://railway.app)
2. 安裝 Railway CLI
3. 準備 GitHub 代碼庫

### 自動部署步驟
```bash
# 1. 安裝 Railway CLI
npm install -g @railway/cli

# 2. 登入 Railway
railway login

# 3. 初始化專案
railway init

# 4. 設定環境變數
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="your-secure-jwt-secret"
railway variables set TELEGRAM_BOT_TOKEN="your-bot-token"
railway variables set TELEGRAM_CHAT_ID="your-chat-id"

# 5. 部署
railway up --detach
```

### 手動部署 (GitHub 整合)
1. 登入 Railway 控制台
2. 點擊 "New Project" 
3. 選擇 "Deploy from GitHub repo"
4. 選擇您的代碼庫
5. Railway 會自動檢測並部署

## 🌊 Render 部署

### Web Service 部署
1. 登入 [Render 控制台](https://render.com)
2. 點擊 "New" → "Web Service"
3. 連接 GitHub 代碼庫
4. 配置服務設定：
   - **Name**: gclaude-enterprise-system
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node enterprise-server.js`

### 環境變數設定
在 Render 控制台設定以下環境變數：
```
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret-here
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
PORT=10000
```

## ⚡ Vercel 部署

### Serverless 部署
```bash
# 1. 安裝 Vercel CLI
npm i -g vercel

# 2. 部署到 Vercel
vercel --prod

# 3. 設定環境變數
vercel env add NODE_ENV
vercel env add JWT_SECRET
vercel env add TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_CHAT_ID
```

### 注意事項
- Vercel 適合靜態內容和 API Routes
- SQLite 資料庫需要使用外部服務 (如 PlanetScale)
- 無狀態設計確保 Serverless 相容性

## 🐳 Docker 部署

### 單容器部署
```bash
# 1. 建置 Docker 映像
docker build -t gclaude-enterprise .

# 2. 運行容器
docker run -d \
  --name gclaude-enterprise \
  -p 3007:3007 \
  -v ./data:/app/data \
  -e NODE_ENV=production \
  -e JWT_SECRET="your-jwt-secret" \
  gclaude-enterprise
```

### Docker Compose 部署
```bash
# 1. 啟動所有服務
docker-compose up -d

# 2. 查看服務狀態
docker-compose ps

# 3. 查看日誌
docker-compose logs -f gclaude-enterprise
```

### Docker Compose 設定檔
```yaml
version: '3.8'

services:
  gclaude-enterprise:
    build: .
    ports:
      - "3007:3007"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - gclaude-enterprise
    restart: unless-stopped
```

## 🏗️ Kubernetes 部署

### 基本 Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gclaude-enterprise
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gclaude-enterprise
  template:
    metadata:
      labels:
        app: gclaude-enterprise
    spec:
      containers:
      - name: gclaude-enterprise
        image: gclaude/enterprise-system:latest
        ports:
        - containerPort: 3007
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: gclaude-secrets
              key: jwt-secret
---
apiVersion: v1
kind: Service
metadata:
  name: gclaude-enterprise-service
spec:
  selector:
    app: gclaude-enterprise
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3007
  type: LoadBalancer
```

## 🖥️ VPS 部署

### 系統需求
- Ubuntu 20.04 LTS 或更高版本
- 至少 1GB RAM
- Node.js 18+
- PM2 或類似的程序管理器

### 部署步驟
```bash
# 1. 更新系統
sudo apt update && sudo apt upgrade -y

# 2. 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安裝 PM2
sudo npm install pm2 -g

# 4. 複製程式碼
git clone <your-repo-url>
cd gclaude-enterprise-system

# 5. 安裝依賴
npm ci --production

# 6. 設定環境變數
cp .env.example .env
nano .env

# 7. 初始化資料庫
node database.js

# 8. 使用 PM2 啟動
pm2 start enterprise-server.js --name gclaude-enterprise
pm2 startup
pm2 save
```

### PM2 設定檔 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'gclaude-enterprise',
    script: 'enterprise-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3007
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3007
    }
  }]
};
```

## 🔒 SSL/HTTPS 配置

### Let's Encrypt (推薦)
```bash
# 1. 安裝 Certbot
sudo apt install certbot python3-certbot-nginx

# 2. 獲取 SSL 證書
sudo certbot --nginx -d your-domain.com

# 3. 自動更新證書
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx 反向代理設定
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 部署後檢查

### 健康檢查
```bash
# 檢查服務狀態
curl -f https://your-domain.com/api/health

# 檢查回應時間
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/
```

### 效能測試
```bash
# 使用 Apache Bench
ab -n 100 -c 10 https://your-domain.com/api/health

# 使用 wrk
wrk -t12 -c400 -d30s --timeout 10s https://your-domain.com/
```

## 🔄 CI/CD 自動部署

### GitHub Actions 示例
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to Railway
      uses: railwayapp/railway-deploy@v1
      with:
        railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

## 📋 部署檢查清單

### 部署前
- [ ] 代碼已推送到代碼庫
- [ ] 環境變數已設定
- [ ] 資料庫已準備
- [ ] SSL 證書已配置
- [ ] 域名已設定

### 部署後
- [ ] 應用程式正常啟動
- [ ] 健康檢查通過
- [ ] 所有功能正常運作
- [ ] 監控系統已設定
- [ ] 備份機制已啟用

## ⚠️ 常見部署問題

### 記憶體不足
- 增加伺服器記憶體
- 優化 Node.js heap size
- 使用 cluster mode

### 連接埠衝突
- 檢查連接埠使用狀況
- 修改應用程式連接埠
- 配置反向代理

### 資料庫連線失敗
- 檢查資料庫設定
- 確認連線字串正確
- 檢查防火牆設定

## 📞 技術支援

部署過程中如遇問題：
1. 檢查應用程式日誌
2. 參考故障排除文檔
3. 聯繫技術團隊
4. 查看平台文檔

---

部署完成後，建議設定[監控系統](MONITORING.md)以確保系統穩定運行。
