# GClaude Enterprise System - Multi-stage Docker Build
FROM node:18-alpine AS base

# 設置工作目錄
WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production && npm cache clean --force

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S gclaude -u 1001

# === 開發階段 ===
FROM base AS development
ENV NODE_ENV=development

# 安裝開發依賴
RUN npm ci

# 複製原始碼
COPY --chown=gclaude:nodejs . .

# 切換到非 root 用戶
USER gclaude

# 暴露端口
EXPOSE 3007

# 開發啟動命令
CMD ["npm", "run", "dev"]

# === 生產階段 ===
FROM base AS production
ENV NODE_ENV=production

# 複製原始碼
COPY --chown=gclaude:nodejs . .

# 創建必要目錄
RUN mkdir -p logs uploads database && \
    chown -R gclaude:nodejs logs uploads database

# 設置權限
RUN chmod -R 755 scripts/

# 切換到非 root 用戶
USER gclaude

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3007/api/health', (res) => { \
        if (res.statusCode === 200) { \
            console.log('Health check passed'); \
            process.exit(0); \
        } else { \
            console.log('Health check failed'); \
            process.exit(1); \
        } \
    }).on('error', () => { process.exit(1); })"

# 暴露端口
EXPOSE 3007

# 生產啟動命令
CMD ["npm", "start"]

# === GClaude 相容標籤 ===
LABEL maintainer="Claude Code AI System"
LABEL version="2.0.0"
LABEL description="GClaude相容企業員工管理系統"
LABEL gclaude.compatible="true"
LABEL gclaude.version="2.0"
LABEL gclaude.monitoring="true"
LABEL gclaude.auto-scale="true"