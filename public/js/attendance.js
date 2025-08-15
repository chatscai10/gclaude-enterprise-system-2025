/**
 * 出勤管理頁面 JavaScript 功能
 */

// 全域變數
let currentAttendance = [];
let filteredAttendance = [];
let currentPage = 1;
let todayRecord = null;
let isClockingIn = false;
const itemsPerPage = 15;

// JWT Token 管理
function getToken() {
    return localStorage.getItem('token');
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 通用 API 請求函數
async function apiRequest(url, options = {}) {
    const token = getToken();
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, mergedOptions);
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    } catch (error) {
        console.error('API 請求錯誤:', error);
        showToast('網路錯誤，請稍後再試', 'error');
        return null;
    }
}

// 顯示提示訊息
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// 更新時鐘顯示
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-TW', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    document.getElementById('current-time').textContent = timeString;
    document.getElementById('current-date').textContent = dateString;
}

// 載入今日出勤狀態
async function loadTodayStatus() {
    const today = new Date().toISOString().split('T')[0];
    const attendance = await apiRequest(`/api/attendance/today`);
    
    if (attendance) {
        todayRecord = attendance;
        updateTodayDisplay();
        updateClockButtons();
    } else {
        // 沒有今日記錄
        todayRecord = null;
        resetTodayDisplay();
        updateClockButtons();
    }
}

// 更新今日狀態顯示
function updateTodayDisplay() {
    if (!todayRecord) {
        resetTodayDisplay();
        return;
    }
    
    const statusBadge = getStatusBadge(todayRecord.status);
    const clockIn = todayRecord.clock_in ? formatTime(todayRecord.clock_in) : '--:--';
    const clockOut = todayRecord.clock_out ? formatTime(todayRecord.clock_out) : '--:--';
    const workHours = calculateWorkHours(todayRecord.clock_in, todayRecord.clock_out);
    
    document.getElementById('today-status-text').innerHTML = statusBadge.replace('badge', 'badge');
    document.getElementById('today-clock-in').textContent = clockIn;
    document.getElementById('today-clock-out').textContent = clockOut;
    document.getElementById('today-hours').textContent = workHours;
    
    // 更新最後打卡記錄
    const lastRecord = document.getElementById('last-record');
    if (todayRecord.clock_out) {
        lastRecord.textContent = `最後打卡：下班 ${clockOut}`;
    } else if (todayRecord.clock_in) {
        lastRecord.textContent = `最後打卡：上班 ${clockIn}`;
    } else {
        lastRecord.textContent = '';
    }
}

// 重置今日狀態顯示
function resetTodayDisplay() {
    document.getElementById('today-status-text').innerHTML = '<span class="badge bg-secondary">未打卡</span>';
    document.getElementById('today-clock-in').textContent = '--:--';
    document.getElementById('today-clock-out').textContent = '--:--';
    document.getElementById('today-hours').textContent = '-- 小時';
    document.getElementById('last-record').textContent = '';
}

// 更新打卡按鈕狀態
function updateClockButtons() {
    const clockInBtn = document.getElementById('clock-in-btn');
    const clockOutBtn = document.getElementById('clock-out-btn');
    
    if (!todayRecord) {
        // 未打卡狀態
        clockInBtn.disabled = false;
        clockOutBtn.disabled = true;
        clockInBtn.textContent = '上班打卡';
        clockOutBtn.textContent = '下班打卡';
    } else if (todayRecord.clock_in && !todayRecord.clock_out) {
        // 已上班打卡，未下班
        clockInBtn.disabled = true;
        clockOutBtn.disabled = false;
        clockInBtn.textContent = '已打卡';
        clockOutBtn.textContent = '下班打卡';
    } else if (todayRecord.clock_in && todayRecord.clock_out) {
        // 已完成打卡
        clockInBtn.disabled = true;
        clockOutBtn.disabled = true;
        clockInBtn.textContent = '已打卡';
        clockOutBtn.textContent = '已打卡';
    }
}

// 上班打卡
async function clockIn() {
    if (isClockingIn) return;
    isClockingIn = true;
    
    try {
        // 檢查地理位置權限
        if (!navigator.geolocation) {
            showToast('您的瀏覽器不支援地理位置功能', 'error');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            
            const result = await apiRequest('/api/attendance/clock-in', {
                method: 'POST',
                body: JSON.stringify({
                    latitude,
                    longitude,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (result) {
                showToast('上班打卡成功', 'success');
                loadTodayStatus();
                loadAttendanceStats();
                loadAttendance();
            }
        }, (error) => {
            console.error('地理位置錯誤:', error);
            showToast('無法獲取地理位置，請檢查定位權限', 'error');
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        });
        
    } finally {
        isClockingIn = false;
    }
}

// 下班打卡
async function clockOut() {
    if (isClockingIn) return;
    isClockingIn = true;
    
    try {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            
            const result = await apiRequest('/api/attendance/clock-out', {
                method: 'POST',
                body: JSON.stringify({
                    latitude,
                    longitude,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (result) {
                showToast('下班打卡成功', 'success');
                loadTodayStatus();
                loadAttendanceStats();
                loadAttendance();
            }
        }, (error) => {
            console.error('地理位置錯誤:', error);
            showToast('無法獲取地理位置，請檢查定位權限', 'error');
        });
        
    } finally {
        isClockingIn = false;
    }
}

// 載入出勤統計
async function loadAttendanceStats() {
    const stats = await apiRequest('/api/dashboard/stats');
    if (stats && stats.attendance) {
        document.getElementById('present-count').textContent = stats.attendance.present || 0;
        document.getElementById('late-count').textContent = stats.attendance.late || 0;
        document.getElementById('absent-count').textContent = stats.attendance.absent || 0;
        document.getElementById('total-hours').textContent = (stats.attendance.totalHours || 0) + 'h';
    }
}

// 載入出勤記錄
async function loadAttendance() {
    showLoading(true);
    
    const attendance = await apiRequest('/api/attendance');
    if (attendance) {
        currentAttendance = attendance;
        filteredAttendance = [...attendance];
        renderAttendanceTable();
        renderPagination();
    }
    
    showLoading(false);
}

// 載入員工列表（用於篩選）
async function loadEmployeeFilter() {
    const employees = await apiRequest('/api/employees');
    if (employees) {
        const select = document.getElementById('employee-filter');
        select.innerHTML = '<option value="">所有員工</option>';
        
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = employee.name;
            select.appendChild(option);
        });
    }
}

// 顯示載入狀態
function showLoading(show) {
    const loading = document.getElementById('loading');
    const tableContainer = document.getElementById('attendance-table-container');
    
    if (show) {
        loading.style.display = 'block';
        tableContainer.style.display = 'none';
    } else {
        loading.style.display = 'none';
        tableContainer.style.display = 'block';
    }
}

// 渲染出勤表格
function renderAttendanceTable() {
    const tbody = document.getElementById('attendance-table-body');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageAttendance = filteredAttendance.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    if (pageAttendance.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="bi bi-inbox"></i><br>
                    沒有找到出勤記錄
                </td>
            </tr>
        `;
        return;
    }
    
    pageAttendance.forEach(record => {
        const row = createAttendanceRow(record);
        tbody.appendChild(row);
    });
}

// 創建出勤記錄表格行
function createAttendanceRow(record) {
    const tr = document.createElement('tr');
    
    const statusBadge = getStatusBadge(record.status);
    const storeName = getStoreName(record.store_id);
    const workHours = calculateWorkHours(record.clock_in, record.clock_out);
    
    tr.innerHTML = `
        <td>${formatDate(record.date)}</td>
        <td>
            <div>
                <strong>${record.employee_name || record.name}</strong>
                ${record.employee_id ? `<br><small class="text-muted">#${record.employee_id}</small>` : ''}
            </div>
        </td>
        <td>${storeName}</td>
        <td>
            <span class="status-dot status-${record.clock_in ? 'present' : 'absent'}"></span>
            ${record.clock_in ? formatTime(record.clock_in) : '<span class="text-muted">--:--</span>'}
        </td>
        <td>
            <span class="status-dot status-${record.clock_out ? 'present' : 'absent'}"></span>
            ${record.clock_out ? formatTime(record.clock_out) : '<span class="text-muted">--:--</span>'}
        </td>
        <td>${workHours}</td>
        <td>${statusBadge}</td>
        <td>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" onclick="editAttendanceRecord(${record.id})" title="編輯">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="deleteAttendanceRecord(${record.id})" title="刪除">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return tr;
}

// 取得狀態徽章
function getStatusBadge(status) {
    const badges = {
        'present': '<span class="badge bg-success">正常</span>',
        'late': '<span class="badge bg-warning">遲到</span>',
        'absent': '<span class="badge bg-danger">缺勤</span>',
        'early': '<span class="badge bg-info">早退</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">未知</span>';
}

// 取得分店名稱
function getStoreName(storeId) {
    const stores = {
        1: '內壢忠孝店',
        2: '桃園龍安店',
        3: '中壢龍崗店'
    };
    return stores[storeId] || '未分配';
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
}

// 格式化時間
function formatTime(timeString) {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
    });
}

// 計算工作時數
function calculateWorkHours(clockIn, clockOut) {
    if (!clockIn || !clockOut) return '--';
    
    const inTime = new Date(clockIn);
    const outTime = new Date(clockOut);
    const diffMs = outTime - inTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 0) return '--';
    
    const hours = Math.floor(diffHours);
    const minutes = Math.round((diffHours - hours) * 60);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

// 篩選出勤記錄
function filterAttendance() {
    const dateFilter = document.getElementById('date-filter').value;
    const employeeFilter = document.getElementById('employee-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const storeFilter = document.getElementById('store-filter').value;
    
    filteredAttendance = currentAttendance.filter(record => {
        // 日期篩選
        if (dateFilter && record.date !== dateFilter) {
            return false;
        }
        
        // 員工篩選
        if (employeeFilter && record.employee_id.toString() !== employeeFilter) {
            return false;
        }
        
        // 狀態篩選
        if (statusFilter && record.status !== statusFilter) {
            return false;
        }
        
        // 分店篩選
        if (storeFilter && record.store_id.toString() !== storeFilter) {
            return false;
        }
        
        return true;
    });
    
    currentPage = 1;
    renderAttendanceTable();
    renderPagination();
}

// 重置篩選
function resetFilters() {
    document.getElementById('date-filter').value = '';
    document.getElementById('employee-filter').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('store-filter').value = '';
    
    filteredAttendance = [...currentAttendance];
    currentPage = 1;
    renderAttendanceTable();
    renderPagination();
}

// 渲染分頁
function renderPagination() {
    const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination-container');
    const pagination = paginationContainer.querySelector('.pagination');
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'block';
    pagination.innerHTML = '';
    
    // 上一頁
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1})">上一頁</a>`;
    pagination.appendChild(prevLi);
    
    // 頁碼
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
            pagination.appendChild(li);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            li.innerHTML = '<span class="page-link">...</span>';
            pagination.appendChild(li);
        }
    }
    
    // 下一頁
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1})">下一頁</a>`;
    pagination.appendChild(nextLi);
}

// 變更頁面
function changePage(page) {
    const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderAttendanceTable();
    renderPagination();
    
    document.getElementById('attendance-table-container').scrollIntoView({ behavior: 'smooth' });
}

// 編輯出勤記錄
async function editAttendanceRecord(recordId) {
    const record = await apiRequest(`/api/attendance/${recordId}`);
    if (!record) return;
    
    // 填入編輯表單
    document.getElementById('edit-attendance-id').value = record.id;
    document.getElementById('edit-date').value = record.date;
    document.getElementById('edit-employee').value = record.employee_name || record.name;
    document.getElementById('edit-clock-in').value = record.clock_in ? formatTimeForInput(record.clock_in) : '';
    document.getElementById('edit-clock-out').value = record.clock_out ? formatTimeForInput(record.clock_out) : '';
    document.getElementById('edit-status').value = record.status || 'present';
    document.getElementById('edit-note').value = record.note || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editAttendanceModal'));
    modal.show();
}

// 格式化時間用於input[type="time"]
function formatTimeForInput(timeString) {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toTimeString().slice(0, 5);
}

// 儲存出勤記錄編輯
async function saveAttendanceEdit() {
    const recordId = document.getElementById('edit-attendance-id').value;
    const clockIn = document.getElementById('edit-clock-in').value;
    const clockOut = document.getElementById('edit-clock-out').value;
    const status = document.getElementById('edit-status').value;
    const note = document.getElementById('edit-note').value;
    
    const updateData = {
        clock_in: clockIn || null,
        clock_out: clockOut || null,
        status: status,
        note: note || null
    };
    
    const result = await apiRequest(`/api/attendance/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
    });
    
    if (result) {
        showToast('出勤記錄更新成功', 'success');
        bootstrap.Modal.getInstance(document.getElementById('editAttendanceModal')).hide();
        loadAttendance();
        loadAttendanceStats();
        if (recordId === todayRecord?.id) {
            loadTodayStatus();
        }
    }
}

// 刪除出勤記錄
async function deleteAttendanceRecord(recordId) {
    if (!confirm('確定要刪除此出勤記錄嗎？此操作無法復原。')) return;
    
    const result = await apiRequest(`/api/attendance/${recordId}`, {
        method: 'DELETE'
    });
    
    if (result) {
        showToast('出勤記錄刪除成功', 'success');
        loadAttendance();
        loadAttendanceStats();
        if (recordId === todayRecord?.id) {
            loadTodayStatus();
        }
    }
}

// 匯出出勤報表
function exportAttendance() {
    const csv = generateAttendanceCSV(filteredAttendance);
    downloadCSV(csv, `attendance_${new Date().toISOString().split('T')[0]}.csv`);
}

// 生成出勤 CSV 格式
function generateAttendanceCSV(attendance) {
    const headers = ['日期', '員工姓名', '員工編號', '分店', '上班時間', '下班時間', '工作時數', '狀態', '備註'];
    const rows = attendance.map(record => [
        formatDate(record.date),
        record.employee_name || record.name || '',
        record.employee_id || '',
        getStoreName(record.store_id),
        record.clock_in ? formatTime(record.clock_in) : '',
        record.clock_out ? formatTime(record.clock_out) : '',
        calculateWorkHours(record.clock_in, record.clock_out),
        record.status || '',
        record.note || ''
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    
    return csvContent;
}

// 下載 CSV 檔案
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 重新整理出勤資料
function refreshAttendance() {
    loadTodayStatus();
    loadAttendanceStats();
    loadAttendance();
    showToast('資料已重新整理', 'success');
}

// 登出功能
function logout() {
    if (confirm('確定要登出嗎？')) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    // 更新時鐘
    updateClock();
    setInterval(updateClock, 1000);
    
    // 載入資料
    loadTodayStatus();
    loadAttendanceStats();
    loadAttendance();
    loadEmployeeFilter();
    
    // 設定預設日期篩選為今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date-filter').value = today;
});