FROM node:18-alpine

WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製應用程式檔案
COPY . .

# 創建必要的目錄
RUN mkdir -p data uploads logs

# 設定權限
RUN chown -R node:node /app
USER node

# 暴露連接埠
EXPOSE 3007

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3007/api/health || exit 1

# 啟動應用
CMD ["npm", "start"]