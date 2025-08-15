/**
 * 員工管理頁面 JavaScript 功能
 */

// 全域變數
let currentEmployees = [];
let filteredEmployees = [];
let currentPage = 1;
const itemsPerPage = 10;

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

// 載入員工統計
async function loadEmployeeStats() {
    const stats = await apiRequest('/api/dashboard/stats');
    if (stats && stats.employees) {
        document.getElementById('total-employees').textContent = stats.employees.total || 0;
        document.getElementById('active-employees').textContent = stats.employees.active || 0;
        document.getElementById('pending-employees').textContent = stats.employees.pending || 0;
        document.getElementById('management-employees').textContent = stats.employees.management || 0;
    }
}

// 載入員工列表
async function loadEmployees() {
    showLoading(true);
    
    const employees = await apiRequest('/api/employees');
    if (employees) {
        currentEmployees = employees;
        filteredEmployees = [...employees];
        renderEmployeeTable();
        renderPagination();
    }
    
    showLoading(false);
}

// 顯示載入狀態
function showLoading(show) {
    const loading = document.getElementById('loading');
    const tableContainer = document.getElementById('employee-table-container');
    
    if (show) {
        loading.style.display = 'block';
        tableContainer.style.display = 'none';
    } else {
        loading.style.display = 'none';
        tableContainer.style.display = 'block';
    }
}

// 渲染員工表格
function renderEmployeeTable() {
    const tbody = document.getElementById('employee-table-body');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageEmployees = filteredEmployees.slice(startIndex, endIndex);
    
    tbody.innerHTML = '';
    
    if (pageEmployees.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="bi bi-inbox"></i><br>
                    沒有找到員工資料
                </td>
            </tr>
        `;
        return;
    }
    
    pageEmployees.forEach(employee => {
        const row = createEmployeeRow(employee);
        tbody.appendChild(row);
    });
}

// 創建員工表格行
function createEmployeeRow(employee) {
    const tr = document.createElement('tr');
    
    const statusBadge = getStatusBadge(employee.status);
    const storeName = getStoreName(employee.store_id);
    const roleName = getRoleName(employee.role);
    
    tr.innerHTML = `
        <td>${employee.employee_id || '-'}</td>
        <td>
            <div class="d-flex align-items-center">
                <div>
                    <strong>${employee.name}</strong>
                    ${employee.email ? `<br><small class="text-muted">${employee.email}</small>` : ''}
                </div>
            </div>
        </td>
        <td>${storeName}</td>
        <td>${roleName}</td>
        <td>${employee.phone || '-'}</td>
        <td>${statusBadge}</td>
        <td>${formatDate(employee.hire_date) || '-'}</td>
        <td>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" onclick="viewEmployee(${employee.id})" title="查看詳情">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-outline-success" onclick="editEmployee(${employee.id})" title="編輯">
                    <i class="bi bi-pencil"></i>
                </button>
                ${employee.status === 'pending' ? `
                    <button class="btn btn-outline-warning" onclick="approveEmployee(${employee.id})" title="審核">
                        <i class="bi bi-check-circle"></i>
                    </button>
                ` : ''}
                <button class="btn btn-outline-danger" onclick="deleteEmployee(${employee.id})" title="刪除">
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
        'active': '<span class="badge bg-success">在職</span>',
        'pending': '<span class="badge bg-warning">待審核</span>',
        'resigned': '<span class="badge bg-secondary">離職</span>',
        'suspended': '<span class="badge bg-danger">停職</span>'
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

// 取得職位名稱
function getRoleName(role) {
    const roles = {
        'admin': '管理員',
        'manager': '店長',
        'employee': '員工'
    };
    return roles[role] || '未設定';
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
}

// 渲染分頁
function renderPagination() {
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
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
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderEmployeeTable();
    renderPagination();
    
    // 滾動到表格頂部
    document.getElementById('employee-table-container').scrollIntoView({ behavior: 'smooth' });
}

// 搜尋員工
function searchEmployees() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredEmployees = [...currentEmployees];
    } else {
        filteredEmployees = currentEmployees.filter(employee => 
            employee.name.toLowerCase().includes(searchTerm) ||
            (employee.phone && employee.phone.includes(searchTerm)) ||
            (employee.employee_id && employee.employee_id.toString().includes(searchTerm)) ||
            (employee.email && employee.email.toLowerCase().includes(searchTerm))
        );
    }
    
    currentPage = 1;
    renderEmployeeTable();
    renderPagination();
}

// 篩選員工
function filterEmployees() {
    const storeFilter = document.getElementById('store-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const roleFilter = document.getElementById('role-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    
    filteredEmployees = currentEmployees.filter(employee => {
        // 分店篩選
        if (storeFilter && employee.store_id.toString() !== storeFilter) {
            return false;
        }
        
        // 狀態篩選
        if (statusFilter && employee.status !== statusFilter) {
            return false;
        }
        
        // 職位篩選
        if (roleFilter && employee.role !== roleFilter) {
            return false;
        }
        
        // 搜尋篩選
        if (searchTerm) {
            const matchesSearch = 
                employee.name.toLowerCase().includes(searchTerm) ||
                (employee.phone && employee.phone.includes(searchTerm)) ||
                (employee.employee_id && employee.employee_id.toString().includes(searchTerm)) ||
                (employee.email && employee.email.toLowerCase().includes(searchTerm));
            if (!matchesSearch) {
                return false;
            }
        }
        
        return true;
    });
    
    currentPage = 1;
    renderEmployeeTable();
    renderPagination();
}

// 重置篩選
function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('store-filter').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('role-filter').value = '';
    
    filteredEmployees = [...currentEmployees];
    currentPage = 1;
    renderEmployeeTable();
    renderPagination();
}

// 新增員工
async function addEmployee() {
    const form = document.getElementById('add-employee-form');
    const formData = new FormData(form);
    
    const employeeData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        store_id: parseInt(document.getElementById('store_id').value),
        role: document.getElementById('role').value,
        salary: document.getElementById('salary').value ? parseFloat(document.getElementById('salary').value) : null,
        hire_date: document.getElementById('hire_date').value || null,
        address: document.getElementById('address').value.trim() || null
    };
    
    // 驗證必填欄位
    if (!employeeData.name || !employeeData.phone || !employeeData.store_id || !employeeData.role) {
        showToast('請填寫所有必填欄位', 'error');
        return;
    }
    
    const result = await apiRequest('/api/employees', {
        method: 'POST',
        body: JSON.stringify(employeeData)
    });
    
    if (result) {
        showToast('員工新增成功', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal')).hide();
        form.reset();
        loadEmployees();
        loadEmployeeStats();
    }
}

// 查看員工詳情
async function viewEmployee(employeeId) {
    const employee = await apiRequest(`/api/employees/${employeeId}`);
    if (!employee) return;
    
    const modalContent = document.getElementById('employee-detail-content');
    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">員工編號</label>
                <p class="form-control-plaintext">${employee.employee_id || '-'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">姓名</label>
                <p class="form-control-plaintext">${employee.name}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">電話</label>
                <p class="form-control-plaintext">${employee.phone || '-'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">分店</label>
                <p class="form-control-plaintext">${getStoreName(employee.store_id)}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">職位</label>
                <p class="form-control-plaintext">${getRoleName(employee.role)}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">狀態</label>
                <p class="form-control-plaintext">${getStatusBadge(employee.status)}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">薪資</label>
                <p class="form-control-plaintext">${employee.salary ? `NT$ ${employee.salary.toLocaleString()}` : '-'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">到職日期</label>
                <p class="form-control-plaintext">${formatDate(employee.hire_date) || '-'}</p>
            </div>
            <div class="col-12 mb-3">
                <label class="form-label fw-bold">地址</label>
                <p class="form-control-plaintext">${employee.address || '-'}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">建立時間</label>
                <p class="form-control-plaintext">${formatDate(employee.created_at)}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">最後更新</label>
                <p class="form-control-plaintext">${formatDate(employee.updated_at)}</p>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('employeeDetailModal'));
    modal.show();
}

// 編輯員工
function editEmployee(employeeId) {
    // TODO: 實現編輯員工功能
    showToast('編輯功能開發中', 'info');
}

// 審核員工
async function approveEmployee(employeeId) {
    if (!confirm('確定要審核通過此員工嗎？')) return;
    
    const result = await apiRequest(`/api/employees/${employeeId}/approve`, {
        method: 'PUT'
    });
    
    if (result) {
        showToast('員工審核成功', 'success');
        loadEmployees();
        loadEmployeeStats();
    }
}

// 刪除員工
async function deleteEmployee(employeeId) {
    if (!confirm('確定要刪除此員工嗎？此操作無法復原。')) return;
    
    const result = await apiRequest(`/api/employees/${employeeId}`, {
        method: 'DELETE'
    });
    
    if (result) {
        showToast('員工刪除成功', 'success');
        loadEmployees();
        loadEmployeeStats();
    }
}

// 匯出員工資料
function exportEmployees() {
    const csv = generateCSV(filteredEmployees);
    downloadCSV(csv, 'employees.csv');
}

// 生成 CSV 格式
function generateCSV(employees) {
    const headers = ['員工編號', '姓名', '電話', '分店', '職位', '狀態', '薪資', '到職日期', '地址'];
    const rows = employees.map(emp => [
        emp.employee_id || '',
        emp.name || '',
        emp.phone || '',
        getStoreName(emp.store_id),
        getRoleName(emp.role),
        emp.status || '',
        emp.salary || '',
        formatDate(emp.hire_date) || '',
        emp.address || ''
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

// 重新整理員工列表
function refreshEmployees() {
    loadEmployees();
    loadEmployeeStats();
    showToast('資料已重新整理', 'success');
}

// 登出功能
function logout() {
    if (confirm('確定要登出嗎？')) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// 搜尋框回車事件
document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchEmployees();
    }
});

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    loadEmployeeStats();
    loadEmployees();
    
    // 設定當前日期作為預設到職日期
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('hire_date').value = today;
});