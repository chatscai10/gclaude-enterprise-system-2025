# 使用官方 Node.js 18 LTS 映像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package 文件
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production && npm cache clean --force

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# 複製應用程序文件
COPY --chown=nodeuser:nodejs . .

# 創建數據目錄
RUN mkdir -p data && chown nodeuser:nodejs data

# 切換到非 root 用戶
USER nodeuser

# 暴露端口
EXPOSE 3007

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3007/api/health || exit 1

# 啟動應用
CMD ["node", "enterprise-server.js"]
