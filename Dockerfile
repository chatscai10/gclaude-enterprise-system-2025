FROM node:18-alpine

WORKDIR /app

# 複製依賴檔案
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製應用程式檔案
COPY . .

# 建立資料目錄
RUN mkdir -p data

# 設定權限
RUN chown -R node:node /app
USER node

# 暴露連接埠
EXPOSE 3007

# 設定健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3007/api/health || exit 1

# 啟動應用
CMD ["npm", "start"]