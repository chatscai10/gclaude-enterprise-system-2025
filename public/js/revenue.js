/**
 * 營收記錄頁面 JavaScript 功能
 */

// 全域變數
let currentRevenue = [];
let filteredRevenue = [];
let currentPage = 1;
let revenueChart = null;
let storeChart = null;
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

// 載入營收統計
async function loadRevenueStats() {
    const period = document.getElementById('period-selector').value;
    const stats = await apiRequest(`/api/revenue/stats?period=${period}`);
    
    if (stats) {
        // 更新總營收
        document.getElementById('total-revenue').textContent = formatCurrency(stats.totalRevenue || 0);
        
        // 更新趨勢
        const trend = stats.trend || 0;
        const trendElement = document.getElementById('revenue-trend');
        const trendIcon = trend >= 0 ? 'bi-arrow-up' : 'bi-arrow-down';
        const trendClass = trend >= 0 ? 'trend-up' : 'trend-down';
        const trendSign = trend >= 0 ? '+' : '';
        
        trendElement.innerHTML = `<i class="bi ${trendIcon}"></i> ${trendSign}${trend.toFixed(1)}%`;
        trendElement.className = `ms-3 ${trendClass}`;
        
        // 更新統計卡片
        document.getElementById('today-revenue').textContent = formatCurrency(stats.todayRevenue || 0);
        document.getElementById('total-transactions').textContent = (stats.totalTransactions || 0).toLocaleString();
        document.getElementById('average-transaction').textContent = formatCurrency(stats.averageTransaction || 0);
        document.getElementById('best-store').textContent = stats.bestStore || '--';
        
        // 更新期間文字
        const periodTexts = {
            'today': '今日營收',
            'week': '本週營收',
            'month': '本月營收',
            'quarter': '本季營收',
            'year': '本年營收',
            'custom': '期間營收'
        };
        document.getElementById('period-text').textContent = periodTexts[period] || '營收';
    }
}

// 載入營收趨勢圖表
async function loadRevenueChart() {
    const period = document.getElementById('period-selector').value;
    const chartData = await apiRequest(`/api/revenue/chart?period=${period}`);
    
    if (chartData && chartData.labels && chartData.data) {
        updateRevenueChart(chartData);
    }
}

// 載入分店營收對比圖表
async function loadStoreChart() {
    const period = document.getElementById('period-selector').value;
    const storeData = await apiRequest(`/api/revenue/stores?period=${period}`);
    
    if (storeData) {
        updateStoreChart(storeData);
    }
}

// 更新營收趨勢圖表
function updateRevenueChart(data) {
    const ctx = document.getElementById('revenue-chart').getContext('2d');
    const isLineChart = document.getElementById('chart-line').checked;
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
        type: isLineChart ? 'line' : 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: '營收金額',
                data: data.data,
                backgroundColor: isLineChart ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.6)',
                borderColor: '#2196F3',
                borderWidth: 2,
                fill: isLineChart,
                tension: isLineChart ? 0.4 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'NT$ ' + value.toLocaleString();
                        }
                    }
                }
            },
            elements: {
                point: {
                    radius: isLineChart ? 4 : 0
                }
            }
        }
    });
}

// 更新分店營收對比圖表
function updateStoreChart(data) {
    const ctx = document.getElementById('store-chart').getContext('2d');
    
    if (storeChart) {
        storeChart.destroy();
    }
    
    const storeNames = {
        1: '內壢忠孝店',
        2: '桃園龍安店',
        3: '中壢龍崗店'
    };
    
    const labels = data.map(item => storeNames[item.store_id] || `分店${item.store_id}`);
    const amounts = data.map(item => item.total_amount);
    const colors = ['#2196F3', '#00BCD4', '#4CAF50', '#FF9800', '#9C27B0'];
    
    storeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: amounts,
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: NT$ ${context.raw.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 載入營收記錄
async function loadRevenue() {
    showLoading(true);
    
    const revenue = await apiRequest('/api/revenue');
    if (revenue) {
        currentRevenue = revenue;
        filteredRevenue = [...revenue];
        renderRevenueTable();
        renderPagination();
        updateRecentRecords();
    }
    
    showLoading(false);
}

// 顯示載入狀態
function showLoading(show) {
    const loading = document.getElementById('loading');
    const tableContainer = document.getElementById('revenue-table-container');
    
    if (show) {
        loading.style.display = 'block';
        tableContainer.style.display = 'none';
    } else {
        loading.style.display = 'none';
        tableContainer.style.display = 'block';
    }
}

// 渲染營收表格
function renderRevenueTable() {
    const tbody = document.getElementById('revenue-table-body');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageRevenue = filteredRevenue.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    if (pageRevenue.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-inbox"></i><br>
                    沒有找到營收記錄
                </td>
            </tr>
        `;
        return;
    }
    
    pageRevenue.forEach(record => {
        const row = createRevenueRow(record);
        tbody.appendChild(row);
    });
}

// 創建營收記錄表格行
function createRevenueRow(record) {
    const tr = document.createElement('tr');
    
    const storeName = getStoreName(record.store_id);
    const paymentMethod = getPaymentMethodName(record.payment_method);
    const category = getCategoryName(record.category);
    
    tr.innerHTML = `
        <td>
            <div>
                <strong>${formatDate(record.date)}</strong>
                <br><small class="text-muted">${formatTime(record.time || record.created_at)}</small>
            </div>
        </td>
        <td>${storeName}</td>
        <td><span class="currency">${formatCurrency(record.amount)}</span></td>
        <td>
            <span class="badge bg-light text-dark">${paymentMethod}</span>
        </td>
        <td>
            <span class="badge bg-primary">${category}</span>
        </td>
        <td>
            ${record.note ? `<small class="text-muted">${record.note}</small>` : '<span class="text-muted">--</span>'}
        </td>
        <td>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" onclick="editRevenue(${record.id})" title="編輯">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="deleteRevenue(${record.id})" title="刪除">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return tr;
}

// 更新最近記錄
function updateRecentRecords() {
    const recentRecords = currentRevenue.slice(0, 5);
    const container = document.getElementById('revenue-records');
    
    container.innerHTML = '';
    
    if (recentRecords.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-3">暫無記錄</p>';
        return;
    }
    
    recentRecords.forEach(record => {
        const item = document.createElement('div');
        item.className = 'border-bottom pb-2 mb-2';
        item.innerHTML = `
            <div class="d-flex justify-content-between">
                <div>
                    <strong>${getStoreName(record.store_id)}</strong>
                    <br><small class="text-muted">${formatDateTime(record.date, record.time || record.created_at)}</small>
                </div>
                <div class="text-end">
                    <span class="currency">${formatCurrency(record.amount)}</span>
                    <br><small class="text-muted">${getPaymentMethodName(record.payment_method)}</small>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

// 工具函數
function getStoreName(storeId) {
    const stores = {
        1: '內壢忠孝店',
        2: '桃園龍安店',
        3: '中壢龍崗店'
    };
    return stores[storeId] || '未分配';
}

function getPaymentMethodName(method) {
    const methods = {
        'cash': '現金',
        'card': '信用卡',
        'mobile': '行動支付',
        'transfer': '轉帳',
        'other': '其他'
    };
    return methods[method] || '未知';
}

function getCategoryName(category) {
    const categories = {
        'sale': '銷售',
        'service': '服務',
        'rental': '租賃',
        'other': '其他'
    };
    return categories[category] || '未分類';
}

function formatCurrency(amount) {
    return `NT$ ${Number(amount || 0).toLocaleString()}`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
}

function formatTime(timeString) {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
    });
}

function formatDateTime(dateString, timeString) {
    const date = formatDate(dateString);
    const time = formatTime(timeString);
    return `${date} ${time}`;
}

// 期間變更
function changePeriod() {
    const period = document.getElementById('period-selector').value;
    
    if (period === 'custom') {
        // TODO: 顯示自訂期間選擇器
        showToast('自訂期間功能開發中', 'info');
        return;
    }
    
    loadRevenueStats();
    loadRevenueChart();
    loadStoreChart();
}

// 圖表類型變更
document.querySelectorAll('input[name="chart-type"]').forEach(radio => {
    radio.addEventListener('change', function() {
        if (revenueChart) {
            loadRevenueChart();
        }
    });
});

// 新增營收記錄
async function addRevenue() {
    const form = document.getElementById('add-revenue-form');
    
    const revenueData = {
        date: document.getElementById('revenue-date').value,
        time: document.getElementById('revenue-time').value,
        store_id: parseInt(document.getElementById('revenue-store').value),
        amount: parseFloat(document.getElementById('revenue-amount').value),
        payment_method: document.getElementById('payment-method').value,
        category: document.getElementById('revenue-category').value,
        note: document.getElementById('revenue-note').value.trim() || null
    };
    
    // 驗證必填欄位
    if (!revenueData.date || !revenueData.time || !revenueData.store_id || !revenueData.amount) {
        showToast('請填寫所有必填欄位', 'error');
        return;
    }
    
    if (revenueData.amount <= 0) {
        showToast('金額必須大於 0', 'error');
        return;
    }
    
    const result = await apiRequest('/api/revenue', {
        method: 'POST',
        body: JSON.stringify(revenueData)
    });
    
    if (result) {
        showToast('營收記錄新增成功', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addRevenueModal')).hide();
        form.reset();
        
        // 設定預設值
        const today = new Date();
        document.getElementById('revenue-date').value = today.toISOString().split('T')[0];
        document.getElementById('revenue-time').value = today.toTimeString().slice(0, 5);
        
        // 重新載入資料
        loadRevenue();
        loadRevenueStats();
        loadRevenueChart();
        loadStoreChart();
    }
}

// 編輯營收記錄
function editRevenue(revenueId) {
    // TODO: 實現編輯營收記錄功能
    showToast('編輯功能開發中', 'info');
}

// 刪除營收記錄
async function deleteRevenue(revenueId) {
    if (!confirm('確定要刪除此營收記錄嗎？此操作無法復原。')) return;
    
    const result = await apiRequest(`/api/revenue/${revenueId}`, {
        method: 'DELETE'
    });
    
    if (result) {
        showToast('營收記錄刪除成功', 'success');
        loadRevenue();
        loadRevenueStats();
        loadRevenueChart();
        loadStoreChart();
    }
}

// 搜尋營收記錄
function searchRevenue() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredRevenue = [...currentRevenue];
    } else {
        filteredRevenue = currentRevenue.filter(record => 
            getStoreName(record.store_id).toLowerCase().includes(searchTerm) ||
            (record.note && record.note.toLowerCase().includes(searchTerm)) ||
            getPaymentMethodName(record.payment_method).toLowerCase().includes(searchTerm) ||
            getCategoryName(record.category).toLowerCase().includes(searchTerm) ||
            record.amount.toString().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    renderRevenueTable();
    renderPagination();
}

// 套用篩選
function applyFilters() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const storeFilter = document.getElementById('store-filter-detailed').value;
    const minAmount = document.getElementById('min-amount').value;
    const maxAmount = document.getElementById('max-amount').value;
    
    filteredRevenue = currentRevenue.filter(record => {
        // 日期篩選
        if (startDate && record.date < startDate) return false;
        if (endDate && record.date > endDate) return false;
        
        // 分店篩選
        if (storeFilter && record.store_id.toString() !== storeFilter) return false;
        
        // 金額篩選
        if (minAmount && record.amount < parseFloat(minAmount)) return false;
        if (maxAmount && record.amount > parseFloat(maxAmount)) return false;
        
        return true;
    });
    
    currentPage = 1;
    renderRevenueTable();
    renderPagination();
    updateRecentRecords();
}

// 重置篩選
function resetFilters() {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('store-filter-detailed').value = '';
    document.getElementById('min-amount').value = '';
    document.getElementById('max-amount').value = '';
    document.getElementById('search-input').value = '';
    
    filteredRevenue = [...currentRevenue];
    currentPage = 1;
    renderRevenueTable();
    renderPagination();
    updateRecentRecords();
}

// 渲染分頁
function renderPagination() {
    const totalPages = Math.ceil(filteredRevenue.length / itemsPerPage);
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
    const totalPages = Math.ceil(filteredRevenue.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderRevenueTable();
    renderPagination();
    
    document.getElementById('revenue-table-container').scrollIntoView({ behavior: 'smooth' });
}

// 匯出營收報表
function exportRevenue() {
    const csv = generateRevenueCSV(filteredRevenue);
    downloadCSV(csv, `revenue_${new Date().toISOString().split('T')[0]}.csv`);
}

// 生成營收 CSV 格式
function generateRevenueCSV(revenue) {
    const headers = ['日期', '時間', '分店', '金額', '付款方式', '分類', '備註'];
    const rows = revenue.map(record => [
        formatDate(record.date),
        formatTime(record.time || record.created_at),
        getStoreName(record.store_id),
        record.amount || 0,
        getPaymentMethodName(record.payment_method),
        getCategoryName(record.category),
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

// 重新整理營收資料
function refreshRevenue() {
    loadRevenue();
    loadRevenueStats();
    loadRevenueChart();
    loadStoreChart();
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
    
    // 設定預設日期和時間
    const today = new Date();
    document.getElementById('revenue-date').value = today.toISOString().split('T')[0];
    document.getElementById('revenue-time').value = today.toTimeString().slice(0, 5);
    
    // 載入資料
    loadRevenueStats();
    loadRevenue();
    loadRevenueChart();
    loadStoreChart();
});