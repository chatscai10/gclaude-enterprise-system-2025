# GClaude Enterprise System Dockerfile
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
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 && \
    chown -R nodeuser:nodejs /app

# 切換到 nodeuser
USER nodeuser

# 暴露端口
EXPOSE 3007

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3007/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# 啟動應用
CMD ["node", "server.js"]
