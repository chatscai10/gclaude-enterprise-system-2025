/**
 * Dashboard 功能函數
 * 修復按鈕無反應問題
 */

// 員工管理功能
function editEmployee(id) {
    console.log('dashboard-functions.js 編輯員工 ID:', id);
    window.lastEditEmployeeLog = `dashboard-functions.js 開始編輯員工 ${id}`;
    
    try {
        // 直接顯示模態框，不需要API調用
        const modalElement = document.getElementById('editEmployeeModal');
        
        if (modalElement) {
            // 先移除任何現有的模態框實例
            const existingInstance = bootstrap.Modal.getInstance(modalElement);
            if (existingInstance) {
                existingInstance.dispose();
            }
            
            // 顯示編輯模態框
            const editModal = new bootstrap.Modal(modalElement);
            editModal.show();
            
            window.lastEditEmployeeLog += ' - 模態框已顯示(dashboard-functions)';
            
            // 顯示提示訊息
            if (typeof showAlert === 'function') {
                showAlert(`正在編輯員工 ${id}`, 'info');
            }
        } else {
            console.error('找不到editEmployeeModal元素');
            window.lastEditEmployeeLog += ' - 錯誤:找不到模態框元素(dashboard-functions)';
        }
    } catch (error) {
        console.error('編輯員工錯誤:', error);
        window.lastEditEmployeeLog += ` - 錯誤: ${error.message}(dashboard-functions)`;
        
        if (typeof showAlert === 'function') {
            showAlert('編輯功能暫時無法使用', 'warning');
        }
    }
}

function deleteEmployee(id) {
    console.log('刪除員工 ID:', id);
    
    if (confirm('確定要刪除這位員工嗎？此操作無法復原。')) {
        fetch(`/api/employees/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('員工已成功刪除', 'success');
                loadEmployees(); // 重新載入員工列表
            } else {
                showError(data.error || '刪除員工失敗');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('刪除員工時發生錯誤');
        });
    }
}

// 出勤管理功能
function editAttendance(id) {
    console.log('編輯出勤記錄 ID:', id);
    
    // 獲取出勤記錄
    fetch(`/api/attendance/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const record = data.record;
                
                // 填充編輯表單
                document.getElementById('editAttendanceId').value = record.id;
                document.getElementById('editAttendanceEmployee').value = record.employee_id;
                document.getElementById('editAttendanceDate').value = record.date;
                document.getElementById('editAttendanceStatus').value = record.status;
                document.getElementById('editCheckInTime').value = record.check_in_time;
                document.getElementById('editCheckOutTime').value = record.check_out_time;
                
                // 顯示編輯模態框
                const editModal = new bootstrap.Modal(document.getElementById('editAttendanceModal'));
                editModal.show();
            } else {
                showError('獲取出勤記錄失敗');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('獲取出勤記錄時發生錯誤');
        });
}

function deleteAttendance(id) {
    console.log('刪除出勤記錄 ID:', id);
    
    if (confirm('確定要刪除這筆出勤記錄嗎？此操作無法復原。')) {
        fetch(`/api/attendance/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('出勤記錄已成功刪除', 'success');
                loadAttendanceRecords(); // 重新載入出勤記錄
            } else {
                showError(data.error || '刪除出勤記錄失敗');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('刪除出勤記錄時發生錯誤');
        });
    }
}

// 營收管理功能
function editRevenue(id) {
    console.log('編輯營收記錄 ID:', id);
    
    // 獲取營收記錄
    fetch(`/api/revenue/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const record = data.record;
                
                // 填充編輯表單
                document.getElementById('editRevenueId').value = record.id;
                document.getElementById('editRevenueDate').value = record.date;
                document.getElementById('editRevenueAmount').value = record.amount;
                document.getElementById('editRevenueSource').value = record.source;
                document.getElementById('editRevenueCategory').value = record.category;
                document.getElementById('editRevenueDescription').value = record.description;
                
                // 顯示編輯模態框
                const editModal = new bootstrap.Modal(document.getElementById('editRevenueModal'));
                editModal.show();
            } else {
                showError('獲取營收記錄失敗');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('獲取營收記錄時發生錯誤');
        });
}

function deleteRevenue(id) {
    console.log('刪除營收記錄 ID:', id);
    
    if (confirm('確定要刪除這筆營收記錄嗎？此操作無法復原。')) {
        fetch(`/api/revenue/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('營收記錄已成功刪除', 'success');
                loadRevenueRecords(); // 重新載入營收記錄
            } else {
                showError(data.error || '刪除營收記錄失敗');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('刪除營收記錄時發生錯誤');
        });
    }
}

// 載入資料函數
function loadEmployees() {
    console.log('重新載入員工列表...');
    
    fetch('/api/employees', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateEmployeeTable(data.employees);
        } else {
            showError('載入員工列表失敗');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('載入員工列表時發生錯誤');
    });
}

function loadAttendanceRecords() {
    console.log('重新載入出勤記錄...');
    
    fetch('/api/attendance', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateAttendanceTable(data.records);
        } else {
            showError('載入出勤記錄失敗');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('載入出勤記錄時發生錯誤');
    });
}

function loadRevenueRecords() {
    console.log('重新載入營收記錄...');
    
    fetch('/api/revenue', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateRevenueTable(data.records);
        } else {
            showError('載入營收記錄失敗');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('載入營收記錄時發生錯誤');
    });
}

// 更新表格函數
function updateEmployeeTable(employees) {
    console.log('更新員工表格...');
    
    const tableContainer = document.querySelector('#employees-section .table-responsive table tbody');
    if (!tableContainer) {
        console.error('找不到員工表格容器');
        return;
    }
    
    if (employees.length === 0) {
        tableContainer.innerHTML = '<tr><td colspan="6" class="text-center">暫無員工資料</td></tr>';
        return;
    }
    
    tableContainer.innerHTML = employees.map(employee => `
        <tr>
            <td>${employee.id}</td>
            <td>${employee.name}</td>
            <td>${employee.position}</td>
            <td>${employee.department}</td>
            <td>$${(employee.salary || 0).toLocaleString()}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editEmployee(${employee.id})">
                    <i class="bi bi-pencil"></i> 編輯
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${employee.id})">
                    <i class="bi bi-trash"></i> 刪除
                </button>
            </td>
        </tr>
    `).join('');
}

function updateAttendanceTable(records) {
    console.log('更新出勤表格...');
    
    const tableContainer = document.querySelector('#attendance-section .table-responsive table tbody');
    if (!tableContainer) {
        console.error('找不到出勤表格容器');
        return;
    }
    
    if (records.length === 0) {
        tableContainer.innerHTML = '<tr><td colspan="6" class="text-center">暫無出勤記錄</td></tr>';
        return;
    }
    
    tableContainer.innerHTML = records.map(record => `
        <tr>
            <td>${record.employee_name || record.employee_id}</td>
            <td>${record.date}</td>
            <td>${record.check_in_time || '-'}</td>
            <td>${record.check_out_time || '-'}</td>
            <td>
                <span class="badge bg-${getStatusColor(record.status)}">${getStatusText(record.status)}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editAttendance(${record.id})">
                    <i class="bi bi-pencil"></i> 編輯
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAttendance(${record.id})">
                    <i class="bi bi-trash"></i> 刪除
                </button>
            </td>
        </tr>
    `).join('');
}

function updateRevenueTable(records) {
    console.log('更新營收表格...');
    
    const tableContainer = document.querySelector('#revenue-section .table-responsive table tbody');
    if (!tableContainer) {
        console.error('找不到營收表格容器');
        return;
    }
    
    if (records.length === 0) {
        tableContainer.innerHTML = '<tr><td colspan="5" class="text-center">暫無營收記錄</td></tr>';
        return;
    }
    
    tableContainer.innerHTML = records.map(record => `
        <tr>
            <td>${record.date}</td>
            <td>$${(record.amount || 0).toLocaleString()}</td>
            <td>${record.source || '-'}</td>
            <td>
                <span class="badge bg-info">${record.category || '未分類'}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editRevenue(${record.id})">
                    <i class="bi bi-pencil"></i> 編輯
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteRevenue(${record.id})">
                    <i class="bi bi-trash"></i> 刪除
                </button>
            </td>
        </tr>
    `).join('');
}

// 輔助函數
function getStatusColor(status) {
    const colors = {
        'present': 'success',
        'absent': 'danger',
        'late': 'warning',
        'leave': 'info',
        'vacation': 'primary'
    };
    return colors[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'present': '出席',
        'absent': '缺席',
        'late': '遲到',
        'leave': '請假',
        'vacation': '休假'
    };
    return texts[status] || status;
}

// 工具函數
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1060; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

function showError(message) {
    showAlert(message, 'danger');
}

// 更新員工資料
function updateEmployee() {
    const form = document.getElementById('editEmployeeForm');
    const formData = new FormData(form);
    const employeeData = Object.fromEntries(formData.entries());
    
    fetch(`/api/employees/${employeeData.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(employeeData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('員工資料已成功更新', 'success');
            loadEmployees(); // 重新載入員工列表
            
            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal'));
            modal.hide();
        } else {
            showError(data.error || '更新員工資料失敗');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('更新員工資料時發生錯誤');
    });
}

// 更新出勤記錄
function updateAttendance() {
    const form = document.getElementById('editAttendanceForm');
    const formData = new FormData(form);
    const attendanceData = Object.fromEntries(formData.entries());
    
    fetch(`/api/attendance/${attendanceData.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(attendanceData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('出勤記錄已成功更新', 'success');
            loadAttendanceRecords(); // 重新載入出勤記錄
            
            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('editAttendanceModal'));
            modal.hide();
        } else {
            showError(data.error || '更新出勤記錄失敗');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('更新出勤記錄時發生錯誤');
    });
}

// 更新營收記錄
function updateRevenue() {
    const form = document.getElementById('editRevenueForm');
    const formData = new FormData(form);
    const revenueData = Object.fromEntries(formData.entries());
    
    fetch(`/api/revenue/${revenueData.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(revenueData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('營收記錄已成功更新', 'success');
            loadRevenueRecords(); // 重新載入營收記錄
            
            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('editRevenueModal'));
            modal.hide();
        } else {
            showError(data.error || '更新營收記錄失敗');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('更新營收記錄時發生錯誤');
    });
}

// 確保函數在全域範圍內可用
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.editAttendance = editAttendance;
window.deleteAttendance = deleteAttendance;
window.editRevenue = editRevenue;
window.deleteRevenue = deleteRevenue;
window.updateEmployee = updateEmployee;
window.updateAttendance = updateAttendance;
window.updateRevenue = updateRevenue;
window.loadEmployees = loadEmployees;
window.loadAttendanceRecords = loadAttendanceRecords;
window.loadRevenueRecords = loadRevenueRecords;

console.log('✅ Dashboard 功能函數已載入完成');