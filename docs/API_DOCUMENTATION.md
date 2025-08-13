# API 文檔

GClaude Enterprise System RESTful API 完整文檔。

## 🔗 基本資訊

- **Base URL**: `http://localhost:3007/api`
- **Content-Type**: `application/json`
- **認證方式**: JWT Bearer Token

## 🔐 認證

### 登入
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**回應**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin", 
    "role": "admin"
  }
}
```

### 驗證 Token
```http
GET /api/auth/validate
Authorization: Bearer <token>
```

## 👥 員工管理 API

### 獲取員工列表
```http
GET /api/employees
Authorization: Bearer <token>
```

**回應**:
```json
{
  "success": true,
  "employees": [
    {
      "id": 1,
      "name": "張三",
      "position": "軟體工程師",
      "department": "技術部",
      "salary": 60000,
      "hireDate": "2024-01-15"
    }
  ]
}
```

### 新增員工
```http
POST /api/employees
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "李四",
  "position": "產品經理", 
  "department": "產品部",
  "salary": 70000
}
```

### 更新員工
```http
PUT /api/employees/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "李四",
  "position": "資深產品經理",
  "salary": 80000
}
```

### 刪除員工
```http
DELETE /api/employees/:id
Authorization: Bearer <token>
```

## 📅 出勤管理 API

### 獲取出勤記錄
```http
GET /api/attendance
Authorization: Bearer <token>

# 查詢參數
GET /api/attendance?employee_id=1&start_date=2024-01-01&end_date=2024-01-31
```

### 記錄出勤
```http
POST /api/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": 1,
  "date": "2024-01-15",
  "checkIn": "09:00",
  "checkOut": "18:00",
  "status": "present"
}
```

### 出勤統計
```http
GET /api/attendance/stats
Authorization: Bearer <token>

# 查詢參數
GET /api/attendance/stats?month=2024-01
```

## 💰 營收管理 API

### 獲取營收資料
```http
GET /api/revenue
Authorization: Bearer <token>

# 查詢參數  
GET /api/revenue?start_date=2024-01-01&end_date=2024-01-31
```

### 新增營收記錄
```http
POST /api/revenue
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-15",
  "amount": 50000,
  "source": "產品銷售",
  "category": "sales"
}
```

### 營收統計
```http
GET /api/revenue/summary
Authorization: Bearer <token>

# 查詢參數
GET /api/revenue/summary?period=monthly&year=2024
```

## 🏥 系統健康檢查

### 健康狀態
```http
GET /api/health
```

**回應**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

## 📊 回應格式

### 成功回應
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 錯誤回應
```json
{
  "success": false,
  "error": "錯誤訊息",
  "code": "ERROR_CODE"
}
```

## ⚠️ 錯誤代碼

| 代碼 | 說明 |
|------|------|
| 400 | 請求參數錯誤 |
| 401 | 未授權或Token過期 |
| 403 | 權限不足 |
| 404 | 資源不存在 |
| 500 | 伺服器內部錯誤 |

## 🔒 權限控制

### 角色類型
- **admin**: 系統管理員，完整權限
- **manager**: 管理者，有限管理權限  
- **employee**: 員工，基本查看權限

### API 權限矩陣

| API端點 | admin | manager | employee |
|---------|-------|---------|----------|
| GET /employees | ✅ | ✅ | ✅ |
| POST /employees | ✅ | ✅ | ❌ |
| PUT /employees | ✅ | ✅ | ❌ |  
| DELETE /employees | ✅ | ❌ | ❌ |
| /attendance/* | ✅ | ✅ | 部分 |
| /revenue/* | ✅ | ✅ | ❌ |

## 📝 API 使用範例

### JavaScript (Axios)
```javascript
// 登入並取得 Token
const loginResponse = await axios.post('/api/auth/login', {
  username: 'admin',
  password: 'admin123'
});

const token = loginResponse.data.token;

// 使用 Token 呼叫 API
const employeesResponse = await axios.get('/api/employees', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### cURL
```bash
# 登入
curl -X POST http://localhost:3007/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 使用 Token
curl -X GET http://localhost:3007/api/employees \
  -H "Authorization: Bearer <your-token>"
```

## 🧪 API 測試

系統提供完整的 API 測試套件：

```bash
# 執行 API 測試
npm run test:integration

# 執行特定 API 測試
npm test -- --grep "API"
```

---

更多技術細節請參考原始碼或聯繫開發團隊。
