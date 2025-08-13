# 監控文檔

本文檔說明 GClaude Enterprise System 的完整監控和告警系統。

## 📊 監控概述

### 監控類型
- **健康監控** - 服務可用性檢查
- **效能監控** - 系統效能指標追蹤
- **錯誤監控** - 錯誤和異常追蹤
- **業務監控** - 關鍵業務指標監控

### 監控目標
- **可用性**: 99.9% 系統正常運行時間
- **回應時間**: API 回應時間 < 500ms
- **錯誤率**: 系統錯誤率 < 1%
- **資源使用**: CPU < 70%, 記憶體 < 80%

## 🏥 健康檢查

### 健康檢查端點
```
GET /api/health
```

**回應範例**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "database": "connected",
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB"
  }
}
```

### 深度健康檢查
```
GET /api/health/deep
```

檢查項目：
- 資料庫連線狀態
- 外部服務連線
- 檔案系統存取
- 記憶體使用狀況

## 📈 效能監控

### 關鍵指標
- **回應時間**: API 端點回應時間
- **吞吐量**: 每秒請求數 (RPS)
- **併發用戶**: 同時線上用戶數
- **資源使用率**: CPU、記憶體、磁碟

### Node.js 內建監控
```javascript
// 記憶體使用監控
const memoryUsage = process.memoryUsage();
console.log('Memory Usage:', {
  rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
  heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
  heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
});

// CPU 使用監控
const cpuUsage = process.cpuUsage();
console.log('CPU Usage:', cpuUsage);
```

## 🖥️ 監控儀表板

### 啟動儀表板
```bash
# 啟動監控儀表板
node scripts/start-monitoring.js
```

訪問: http://localhost:3008

### 儀表板功能
- **即時系統狀態**: 服務健康度和效能指標
- **歷史數據圖表**: 趨勢分析和模式識別  
- **告警管理**: 告警規則設定和歷史記錄
- **服務清單**: 所有監控目標狀態概覽

### 監控指標
```javascript
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "targets": [
    {
      "name": "Railway Production",
      "url": "https://gclaude-enterprise.railway.app",
      "status": "up",
      "responseTime": 245,
      "uptime": "99.95%"
    },
    {
      "name": "Render Production", 
      "url": "https://gclaude-enterprise.onrender.com",
      "status": "up",
      "responseTime": 312,
      "uptime": "99.87%"
    }
  ],
  "summary": {
    "totalTargets": 2,
    "healthyTargets": 2,
    "averageResponseTime": "278ms",
    "overallUptime": "99.91%"
  }
}
```

## 🚨 告警系統

### 告警類型
- **服務異常**: 服務無法訪問或回應錯誤
- **效能告警**: 回應時間過長或資源使用過高
- **錯誤告警**: 錯誤率超過閾值
- **業務告警**: 關鍵業務指標異常

### Telegram 告警
系統支援自動 Telegram 告警通知：

**設定**:
```bash
# 環境變數設定
export TELEGRAM_BOT_TOKEN="your-bot-token"
export TELEGRAM_CHAT_ID="your-chat-id"
```

**告警訊息範例**:
```
🚨 系統告警

類型: 服務異常
目標: Railway Production
訊息: HTTP 500 Internal Server Error
時間: 2024-01-15 10:30:00
持續時間: 2 分鐘

請立即檢查系統狀態。
```

### 告警規則配置
```javascript
const alertRules = [
  {
    name: 'Service Down',
    condition: 'target_status == "down"',
    severity: 'critical',
    cooldown: 5 // 分鐘
  },
  {
    name: 'High Response Time',
    condition: 'response_time > 2000',
    severity: 'warning', 
    cooldown: 15
  },
  {
    name: 'Low Uptime',
    condition: 'uptime < 99',
    severity: 'warning',
    cooldown: 30
  }
];
```

## 📝 日誌監控

### 日誌格式
```javascript
// 結構化日誌格式
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info|warn|error",
  "message": "描述訊息",
  "service": "gclaude-enterprise",
  "requestId": "req-12345",
  "userId": "user-456",
  "metadata": {
    "endpoint": "/api/employees",
    "method": "GET",
    "statusCode": 200,
    "responseTime": 125
  }
}
```

### 日誌聚合
```bash
# 使用 Winston 進行日誌管理
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### 日誌分析
關鍵日誌監控指標：
- **錯誤率**: 錯誤日誌 / 總日誌數
- **回應時間**: API 請求回應時間分佈
- **使用模式**: 最常用的功能和端點
- **異常模式**: 錯誤集中時間和原因

## 📊 業務監控

### 關鍵業務指標 (KPI)
- **活躍用戶數**: 日/週/月活躍用戶
- **功能使用率**: 各功能模組使用頻率
- **資料增長**: 員工、出勤、營收數據增長趨勢
- **系統效能**: 用戶操作完成時間

### 業務監控端點
```
GET /api/metrics/business
```

**回應範例**:
```json
{
  "activeUsers": {
    "daily": 25,
    "weekly": 78,
    "monthly": 156
  },
  "featureUsage": {
    "employeeManagement": 45,
    "attendanceTracking": 32,
    "revenueAnalysis": 23
  },
  "dataGrowth": {
    "employees": "+5 this month",
    "attendanceRecords": "+234 this month", 
    "revenueEntries": "+18 this month"
  }
}
```

## 🔧 監控配置

### 監控間隔設定
```javascript
const monitoringConfig = {
  intervals: {
    healthCheck: 5,      // 分鐘
    performanceCheck: 15, // 分鐘  
    systemCheck: 30,     // 分鐘
    reportGeneration: 60  // 分鐘
  },
  thresholds: {
    responseTime: 2000,   // ms
    errorRate: 5,         // %
    uptime: 99,          // %
    memoryUsage: 80,     // %
    cpuUsage: 70         // %
  }
};
```

### 監控目標管理
```javascript
// 新增監控目標
const newTarget = {
  name: 'New Service',
  url: 'https://new-service.example.com',
  type: 'web',
  timeout: 10000,
  enabled: true
};

// 更新監控配置
await monitoringSystem.addTarget('production', newTarget);
```

## 📈 效能分析

### 效能報告
系統定期生成效能分析報告：
- **回應時間趨勢**: 7天/30天回應時間變化
- **錯誤率分析**: 錯誤類型和頻率統計  
- **資源使用趨勢**: CPU/記憶體使用變化
- **用戶行為分析**: 高峰時段和使用模式

### 效能優化建議
基於監控數據提供優化建議：
- **回應時間優化**: API 緩存、資料庫查詢優化
- **資源優化**: 記憶體管理、CPU 使用優化
- **擴展建議**: 負載平衡、橫向擴展建議

## 🔍 故障檢測

### 自動故障檢測
- **服務異常檢測**: HTTP 錯誤碼監控
- **效能異常檢測**: 回應時間突然增加
- **資源異常檢測**: CPU/記憶體使用激增
- **業務異常檢測**: 關鍵指標異常下降

### 故障回應流程
1. **自動檢測**: 監控系統檢測到異常
2. **告警發送**: 自動發送 Telegram 告警
3. **問題分析**: 查看監控數據和日誌
4. **修復操作**: 執行修復措施
5. **狀態確認**: 確認問題已解決

## 📱 行動監控

### 手機訪問
監控儀表板支援行動裝置：
- **響應式設計**: 適應手機螢幕
- **關鍵指標**: 重點顯示關鍵監控數據
- **告警通知**: Telegram 即時推送告警

### 監控 App
可考慮開發專用監控 App：
- **推播通知**: 即時告警推播
- **快速操作**: 常用監控操作快捷方式
- **離線查看**: 快取重要監控數據

## 🛠️ 監控維護

### 定期維護任務
- **日誌輪轉**: 定期清理舊日誌檔案
- **數據清理**: 清理過期監控數據
- **配置檢查**: 檢查監控配置正確性
- **效能調優**: 監控系統本身效能優化

### 監控系統備份
```bash
# 備份監控配置
cp monitoring/config/monitoring-config.json backup/

# 備份監控數據
cp -r monitoring/logs backup/logs-$(date +%Y%m%d)

# 備份監控報告
cp -r monitoring/reports backup/reports-$(date +%Y%m%d)
```

## 📞 監控支援

### 監控問題排除
1. 檢查監控系統本身狀態
2. 驗證網路連線和權限
3. 查看監控系統日誌
4. 測試告警通知功能

### 聯繫支援
如遇監控相關問題：
- 查看監控系統日誌
- 檢查 Telegram Bot 設定
- 聯繫系統管理員
- 參考故障排除文檔

---

完善的監控系統是保證系統穩定運行的關鍵。建議定期檢查監控數據和告警設定。
