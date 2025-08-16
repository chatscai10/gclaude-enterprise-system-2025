/**
 * 🚀 測試服務器 - 用於驗證優化效果
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3012; // 使用不同的端口
const JWT_SECRET = 'gclaude-test-secret';

// 基本中間件設定
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 模擬用戶驗證中間件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: '未提供token' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'token無效' });
        }
        req.user = user;
        next();
    });
}

// 基本路由
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>GClaude 企業管理系統</title></head>
        <body>
            <h1>GClaude 企業管理系統</h1>
            <a href="/employee-login">員工登入</a> | 
            <a href="/admin-login">管理員登入</a>
        </body>
        </html>
    `);
});

app.get('/employee-login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>員工登入</title></head>
        <body>
            <h2>員工登入</h2>
            <form action="/api/employee/login" method="post">
                <input type="text" id="employee-username" name="username" placeholder="用戶名" required>
                <input type="password" id="employee-password" name="password" placeholder="密碼" required>
                <button type="submit">登入</button>
            </form>
        </body>
        </html>
    `);
});

// 登入API
app.post('/api/employee/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'testuser' && password === 'password123') {
        const token = jwt.sign({ 
            userId: 1, 
            username: 'testuser', 
            role: 'employee' 
        }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ 
            success: true, 
            token,
            redirect: '/employee-dashboard'
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: '用戶名或密碼錯誤' 
        });
    }
});

// 員工儀表板
app.get('/employee-dashboard', (req, res) => {
    const dashboardHtml = fs.readFileSync(
        path.join(__dirname, 'public', 'unified-employee-dashboard.html'), 
        'utf8'
    );
    
    // 替換base URL以確保正確載入資源
    const modifiedHtml = dashboardHtml.replace(
        /<script>/g, 
        `<script>
        // 測試用模擬數據
        window.TEST_MODE = true;
        `
    );
    
    res.send(modifiedHtml);
});

// 模擬出勤API
app.get('/api/attendance/today', authenticateToken, (req, res) => {
    res.json({
        success: true,
        data: {
            clock_in_time: null,
            clock_out_time: null,
            location: '測試地點'
        }
    });
});

// 模擬營收API
app.get('/api/revenue/records', authenticateToken, (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                date: '2025-08-16',
                amount: 1500,
                category: '現場營收',
                status: 'pending',
                notes: '測試記錄'
            }
        ]
    });
});

// 模擬排班API
app.get('/api/schedule/settings', (req, res) => {
    res.json({
        success: true,
        data: {
            schedule_month: '2025-08',
            max_leave_days_per_person: 8,
            max_shifts_per_person: 20,
            min_staff_per_shift: 3
        }
    });
});

// 啟動服務器
app.listen(PORT, () => {
    console.log(`🚀 測試服務器啟動成功 - http://localhost:${PORT}`);
    console.log('📝 測試用戶: testuser / password123');
});