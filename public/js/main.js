// Configuration
const API_BASE_URL = 'http://localhost:3000/api/';
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let cachedDevices = [];
let cachedAlerts = [];
let cachedSchedules = [];
let cachedTechnicians = [];
let deviceEditMode = 'add';
let editingDeviceId = null;
let technicianEditMode = 'add';
let editingTechnicianId = null;
let maintenanceEditMode = 'add';
let editingMaintenanceId = null;
let alertEditMode = 'add';
let editingAlertId = null;
let userEditMode = 'add';
let editingUserId = null;

// DOM Elements
const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const dashboardSection = document.getElementById('dashboard');
const devicesSection = document.getElementById('devices');
const maintenanceSection = document.getElementById('maintenance');
const alertsSection = document.getElementById('alerts');
const techniciansSection = document.getElementById('technicians');
const reportsSection = document.getElementById('reports');
const userManagementSection = document.getElementById('userManagement');

// Initialize Axios
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

// Utility Functions
function showToast(type, message) {
    const toastEl = document.getElementById(`${type}Toast`);
    const toastBody = toastEl.querySelector('.toast-body');
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

function updateUIForUser() {
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    const adminElements = document.querySelectorAll('.admin-only');
    let user = window.currentUser;
    if (!user && localStorage.getItem('currentUser')) {
        user = JSON.parse(localStorage.getItem('currentUser'));
        window.currentUser = user;
    }
    if (user) {
        usernameDisplay.textContent = user.username || 'User';
        userRoleDisplay.textContent = user.role || 'Guest';
        if (user.role === 'admin') {
            adminElements.forEach(el => el.style.display = 'block');
        } else {
            adminElements.forEach(el => el.style.display = 'none');
        }
    }
}

// Data Loading Functions
async function loadDashboardData() {
    try {
        const response = await axios.get('/dashboard', {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const { devices, alerts, schedules } = response.data;

        cachedDevices = devices;
        cachedAlerts = alerts;
        cachedSchedules = schedules;

        updateDashboardCounters();
        renderRecentAlerts();
        renderUpcomingMaintenance();

        // Sau khi cập nhật cache, cập nhật UI cho tab hiện tại
        const activeTab = document.querySelector('.tab-pane.active');
        if (activeTab) {
            if (activeTab.id === 'devices') loadDevices();
            if (activeTab.id === 'maintenance') loadMaintenance();
            if (activeTab.id === 'alerts') loadAlerts();
            if (activeTab.id === 'technicians') loadTechnicians();
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('error', 'Failed to load dashboard data');
    }
}

function updateDashboardCounters() {
    document.getElementById('totalDevices').textContent = cachedDevices.length;
    document.getElementById('activeDevices').textContent = cachedDevices.filter(d => d.status === 'active').length;
    document.getElementById('maintenanceDevices').textContent = cachedDevices.filter(d => d.status === 'maintenance').length;
    document.getElementById('brokenDevices').textContent = cachedDevices.filter(d => d.status === 'broken').length;
}

function renderRecentAlerts() {
    const tbody = document.querySelector('#recentAlertsTable tbody');
    tbody.innerHTML = '';

    const recentAlerts = cachedAlerts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    recentAlerts.forEach(alert => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${alert.deviceName || 'N/A'}</td>
            <td>${alert.message}</td>
            <td>${new Date(alert.createdAt).toLocaleDateString()}</td>
            <td><span class="badge ${alert.isResolved ? 'bg-success' : 'bg-danger'}">
                ${alert.isResolved ? 'Resolved' : 'Active'}
            </span></td>
        `;
        tbody.appendChild(row);
    });
}

function renderUpcomingMaintenance() {
    const tbody = document.querySelector('#upcomingMaintenanceTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!cachedSchedules || cachedSchedules.length === 0) return;

    cachedSchedules
        .sort((a, b) => new Date(a.ScheduledDate) - new Date(b.ScheduledDate))
        .slice(0, 5)
        .forEach(schedule => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${schedule.DeviceID || 'N/A'}</td>
                <td>${schedule.ScheduledDate ? new Date(schedule.ScheduledDate).toLocaleDateString() : 'N/A'}</td>
                <td>${schedule.TechnicianID || 'N/A'}</td>
                <td>${schedule.Status || 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });
}

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const credentials = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    try {
        const response = await axios.post('/auth/login', credentials);

        authToken = response.data.token;
        localStorage.setItem('authToken', authToken);
        currentUser = response.data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        loginModal.hide();
        updateUIForUser();
        loadDashboardData();
        showToast('success', 'Login successful');

    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = error.response?.data?.message || 'Login failed';
        loginError.style.display = 'block';
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    currentUser = null;
    window.location.reload();
});

// Tab Navigation
function showTab(target) {
    document.querySelectorAll('.tab-pane').forEach(section => {
        section.classList.remove('show', 'active');
    });
    const tab = document.querySelector(target);
    if (tab) {
        tab.classList.add('show', 'active');
    }
}

document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener('click', function (e) {
        e.preventDefault();
        const target = this.getAttribute('data-bs-target');
        showTab(target);
        if (target === '#devices') loadDevices();
        if (target === '#maintenance') loadMaintenance();
        if (target === '#alerts') loadAlerts();
        if (target === '#technicians') loadTechnicians();
        if (target === '#reports') loadReports();
        if (target === '#activitylog') loadActivityLog();
    });
});

// Sửa các nút View All để chuyển tab đúng
const viewAllAlertsBtn = document.querySelector('a[data-bs-target="#alerts"]');
if (viewAllAlertsBtn) {
    viewAllAlertsBtn.addEventListener('click', function (e) {
        showTab('#alerts');
        loadAlerts();
    });
}
const viewAllMaintenanceBtn = document.querySelector('a[data-bs-target="#maintenance"]');
if (viewAllMaintenanceBtn) {
    viewAllMaintenanceBtn.addEventListener('click', function (e) {
        showTab('#maintenance');
        loadMaintenance();
    });
}

// Nút Export Devices
const exportDevicesBtn = document.getElementById('exportDevicesBtn');
if (exportDevicesBtn) {
    exportDevicesBtn.addEventListener('click', function () {
        // Xuất dữ liệu devices ra CSV
        let csv = 'ID,Name,Serial,Model,Status,Location\n';
        cachedDevices.forEach(device => {
            csv += `${device.id},${device.DeviceName || ''},${device.SerialNumber || ''},${device.Model || ''},${device.Status || ''},${device.Location || ''}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'devices.csv';
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Bổ sung hàm loadTechnicians
async function loadTechnicians() {
    console.log('Dashboard data:', authToken);
    const tbody = document.querySelector('#techniciansTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    // Nếu đã có cache thì dùng, chưa có thì gọi API
    if (cachedTechnicians.length === 0) {
        try {
            const response = await axios.get('/technicians', {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            cachedTechnicians = response.data;
        } catch (error) {
            showToast('error', 'Failed to load technicians');
            return;
        }
    }
    cachedTechnicians.forEach(tech => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tech.id}</td>
            <td>${tech.FullName || ''}</td>
            <td>${tech.Specialization || ''}</td>
            <td>${tech.Phone || ''}</td>
            <td>${tech.HireDate ? new Date(tech.HireDate).toLocaleDateString() : ''}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-technician-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger delete-technician-btn"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Bổ sung hàm loadReports (hiện chỉ clear bảng, bạn có thể mở rộng sau)
function loadReports() {
    // Nếu có bảng, clear nội dung hoặc hiển thị thông báo
    // Tuỳ vào logic thực tế
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('authToken')) {
        authToken = localStorage.getItem('authToken');
        if (localStorage.getItem('currentUser')) {
            currentUser = JSON.parse(localStorage.getItem('currentUser'));
        }
        axios.get('/auth/verify-token', {
            headers: { Authorization: `Bearer ${authToken}` }
        })
            .then(response => {
                currentUser = response.data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUIForUser();
                loadDashboardData();
            })
            .catch(() => {
                localStorage.clear();
                loginModal.show();
            });
    } else {
        loginModal.show();
    }
});

// Hiển thị danh sách thiết bị
function loadDevices() {
    const tbody = document.querySelector('#devicesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!cachedDevices || cachedDevices.length === 0) return;

    cachedDevices.forEach(device => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${device.id}</td>
            <td>${device.DeviceName || ''}</td>
            <td>${device.SerialNumber || ''}</td>
            <td>${device.Model || ''}</td>
            <td>${device.Status || ''}</td>
            <td>${device.Location || ''}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-device-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger delete-device-btn"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Hiển thị danh sách lịch bảo trì
function loadMaintenance() {
    const tbody = document.querySelector('#maintenanceTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!cachedSchedules || cachedSchedules.length === 0) return;

    cachedSchedules.forEach(schedule => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${schedule.id}</td>
            <td>${schedule.DeviceID || ''}</td>
            <td>${schedule.MaintenanceType || ''}</td>
            <td>${schedule.ScheduledDate ? new Date(schedule.ScheduledDate).toLocaleDateString() : ''}</td>
            <td>${schedule.Status || ''}</td>
            <td>${schedule.TechnicianID || ''}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-maintenance-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger delete-maintenance-btn"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Hiển thị danh sách cảnh báo
function loadAlerts() {
    const tbody = document.querySelector('#alertsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!cachedAlerts || cachedAlerts.length === 0) return;

    cachedAlerts.forEach(alert => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${alert.id}</td>
            <td>${alert.DeviceID || ''}</td>
            <td>${alert.Message || ''}</td>
            <td>${alert.AlertDate ? new Date(alert.AlertDate).toLocaleDateString() : ''}</td>
            <td>${alert.Severity || ''}</td>
            <td>${alert.IsResolved ? 'Resolved' : 'Active'}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-alert-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger delete-alert-btn"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Thêm cho Users
function loadUsers() {
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    // Giả sử cachedUsers là mảng user đã lấy từ API
    if (!window.cachedUsers || window.cachedUsers.length === 0) return;
    window.cachedUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.fullName}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.isActive ? 'Active' : 'Inactive'}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-user-btn"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger delete-user-btn"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Sự kiện Thêm Device
const addDeviceBtn = document.getElementById('addDeviceBtn');
if (addDeviceBtn) {
    addDeviceBtn.addEventListener('click', function () {
        deviceEditMode = 'add';
        editingDeviceId = null;
        document.getElementById('deviceForm').reset();
        new bootstrap.Modal(document.getElementById('addDeviceModal')).show();
    });
}

// Sự kiện Sửa/Xóa Device
const devicesTable = document.getElementById('devicesTable');
if (devicesTable) {
    devicesTable.addEventListener('click', function (e) {
        if (e.target.closest('.edit-device-btn')) {
            const row = e.target.closest('tr');
            deviceEditMode = 'edit';
            editingDeviceId = row.children[0].textContent;
            document.getElementById('deviceName').value = row.children[1].textContent;
            document.getElementById('serialNumber').value = row.children[2].textContent;
            document.getElementById('deviceModel').value = row.children[3].textContent;
            document.getElementById('deviceStatus').value = row.children[4].textContent.toLowerCase();
            document.getElementById('deviceLocation').value = row.children[5].textContent;
            new bootstrap.Modal(document.getElementById('addDeviceModal')).show();
        }
        if (e.target.closest('.delete-device-btn')) {
            if (confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
                const row = e.target.closest('tr');
                const deviceId = row.children[0].textContent;
                axios.delete(`/devices/${deviceId}`)
                    .then(() => {
                        showToast('success', 'Xóa thiết bị thành công');
                        cachedDevices = [];
                        loadDashboardData();
                    })
                    .catch(() => showToast('error', 'Xóa thiết bị thất bại'));
            }
        }
    });
}

// Sự kiện Lưu Device (Thêm/Sửa)
document.getElementById('saveDeviceBtn').addEventListener('click', async function () {
    const data = {
        DeviceName: document.getElementById('deviceName').value,
        SerialNumber: document.getElementById('serialNumber').value,
        Model: document.getElementById('deviceModel').value,
        Status: document.getElementById('deviceStatus').value,
        Location: document.getElementById('deviceLocation').value
    };
    if (deviceEditMode === 'add') {
        axios.post('/devices', data)
            .then(() => {
                showToast('success', 'Thêm thiết bị thành công');
                cachedDevices = [];
                loadDashboardData();
                bootstrap.Modal.getInstance(document.getElementById('addDeviceModal')).hide();
            })
            .catch(() => showToast('error', 'Thêm thiết bị thất bại'));
    } else if (deviceEditMode === 'edit' && editingDeviceId) {
        axios.put(`/devices/${editingDeviceId}`, data)
            .then(() => {
                showToast('success', 'Cập nhật thiết bị thành công');
                cachedDevices = [];
                loadDashboardData();
                bootstrap.Modal.getInstance(document.getElementById('addDeviceModal')).hide();
            })
            .catch(() => showToast('error', 'Cập nhật thiết bị thất bại'));
    }
});

// Sự kiện Thêm Technician
const addTechnicianBtn = document.getElementById('addTechnicianBtn');
if (addTechnicianBtn) {
    addTechnicianBtn.addEventListener('click', function () {
        technicianEditMode = 'add';
        editingTechnicianId = null;
        document.getElementById('technicianForm').reset();
        new bootstrap.Modal(document.getElementById('addTechnicianModal')).show();
    });
}

// Sự kiện Sửa/Xóa Technician
const techniciansTable = document.getElementById('techniciansTable');
if (techniciansTable) {
    techniciansTable.addEventListener('click', function (e) {
        if (e.target.closest('.edit-technician-btn')) {
            const row = e.target.closest('tr');
            technicianEditMode = 'edit';
            editingTechnicianId = row.children[0].textContent;
            document.getElementById('technicianName').value = row.children[1].textContent;
            document.getElementById('technicianSpecialization').value = row.children[2].textContent;
            document.getElementById('technicianPhone').value = row.children[3].textContent;
            document.getElementById('technicianHireDate').value = row.children[4].textContent;
            new bootstrap.Modal(document.getElementById('addTechnicianModal')).show();
        }
        if (e.target.closest('.delete-technician-btn')) {
            if (confirm('Bạn có chắc chắn muốn xóa kỹ thuật viên này?')) {
                const row = e.target.closest('tr');
                const techId = row.children[0].textContent;
                axios.delete(`/technicians/${techId}`, { data: { id: techId } })
                    .then(() => {
                        showToast('success', 'Xóa kỹ thuật viên thành công');
                        cachedTechnicians = [];
                        loadDashboardData();
                    })
                    .catch(() => showToast('error', 'Xóa kỹ thuật viên thất bại'));
            }
        }
    });
}

// Sự kiện Lưu Technician (Thêm/Sửa)
document.getElementById('saveTechnicianBtn').addEventListener('click', async function () {
    const data = {
        FullName: document.getElementById('technicianName').value,
        Specialization: document.getElementById('technicianSpecialization').value,
        Phone: document.getElementById('technicianPhone').value,
        HireDate: document.getElementById('technicianHireDate').value
    };
    if (technicianEditMode === 'add') {
        axios.post('/technicians', data)
            .then(() => {
                showToast('success', 'Thêm kỹ thuật viên thành công');
                cachedTechnicians = [];
                loadDashboardData();
                bootstrap.Modal.getInstance(document.getElementById('addTechnicianModal')).hide();
            })
            .catch(() => showToast('error', 'Thêm kỹ thuật viên thất bại'));
    } else if (technicianEditMode === 'edit' && editingTechnicianId) {
        axios.put(`/technicians/${editingTechnicianId}`, data)
            .then(() => {
                showToast('success', 'Cập nhật kỹ thuật viên thành công');
                cachedTechnicians = [];
                loadDashboardData();
                bootstrap.Modal.getInstance(document.getElementById('addTechnicianModal')).hide();
            })
            .catch(() => showToast('error', 'Cập nhật kỹ thuật viên thất bại'));
    }
});

// Sự kiện Thêm Maintenance
const addScheduleBtn = document.getElementById('addScheduleBtn');
if (addScheduleBtn) {
    addScheduleBtn.addEventListener('click', function () {
        maintenanceEditMode = 'add';
        editingMaintenanceId = null;
        document.getElementById('scheduleForm').reset();
        populateDeviceDropdown();
        loadTechnicianDropdown();
        new bootstrap.Modal(document.getElementById('addScheduleModal')).show();
    });
}

// Sự kiện Sửa/Xóa Maintenance
const maintenanceTable = document.getElementById('maintenanceTable');
if (maintenanceTable) {
    maintenanceTable.addEventListener('click', function (e) {
        if (e.target.closest('.edit-maintenance-btn')) {
            const row = e.target.closest('tr');
            maintenanceEditMode = 'edit';
            editingMaintenanceId = row.children[0].textContent;
            populateDeviceDropdown(row.children[1].textContent); // set selected device
            document.getElementById('maintenanceType').value = row.children[2].textContent;
            document.getElementById('scheduledDate').value = row.children[3].textContent;
            document.getElementById('scheduleTechnician').value = row.children[5].textContent;
            // Có thể bổ sung các trường khác nếu cần
            new bootstrap.Modal(document.getElementById('addScheduleModal')).show();
        }
        if (e.target.closest('.delete-maintenance-btn')) {
            if (confirm('Bạn có chắc chắn muốn xóa lịch bảo trì này?')) {
                const row = e.target.closest('tr');
                const scheduleId = row.children[0].textContent;
                axios.delete(`/maintenance/${scheduleId}`)
                    .then(() => {
                        showToast('success', 'Xóa lịch bảo trì thành công');
                        loadDashboardData();
                    })
                    .catch(() => showToast('error', 'Xóa lịch bảo trì thất bại'));
            }
        }
    });
}

// Sự kiện Lưu Maintenance (Thêm/Sửa)
document.getElementById('saveScheduleBtn').addEventListener('click', async function () {
    const data = {
        DeviceID: document.getElementById('scheduleDevice').value,
        MaintenanceType: document.getElementById('maintenanceType').value,
        ScheduledDate: document.getElementById('scheduledDate').value,
        TechnicianID: document.getElementById('scheduleTechnician').value,
        Description: document.getElementById('scheduleDescription').value
    };
    if (maintenanceEditMode === 'add') {
        axios.post('/maintenance', data)
            .then(() => {
                showToast('success', 'Thêm lịch bảo trì thành công');
                loadDashboardData();
                bootstrap.Modal.getInstance(document.getElementById('addScheduleModal')).hide();
            })
            .catch(() => showToast('error', 'Thêm lịch bảo trì thất bại'));
    } else if (maintenanceEditMode === 'edit' && editingMaintenanceId) {
        axios.put(`/maintenance/${editingMaintenanceId}`, data)
            .then(() => {
                showToast('success', 'Cập nhật lịch bảo trì thành công');
                loadDashboardData();
                bootstrap.Modal.getInstance(document.getElementById('addScheduleModal')).hide();
            })
            .catch(() => showToast('error', 'Cập nhật lịch bảo trì thất bại'));
    }
});

// Sự kiện Thêm Alert (giả sử có modal addAlertModal và form alertForm)
const addAlertBtn = document.getElementById('addAlertBtn');
if (addAlertBtn) {
    addAlertBtn.addEventListener('click', function () {
        alertEditMode = 'add';
        editingAlertId = null;
        document.getElementById('alertForm').reset();
        new bootstrap.Modal(document.getElementById('addAlertModal')).show();
    });
}

// Sự kiện Sửa/Xóa Alert
const alertsTable = document.getElementById('alertsTable');
if (alertsTable) {
    alertsTable.addEventListener('click', function (e) {
        if (e.target.closest('.edit-alert-btn')) {
            const row = e.target.closest('tr');
            alertEditMode = 'edit';
            editingAlertId = row.children[0].textContent;
            // Điền dữ liệu vào form alertForm nếu có
            new bootstrap.Modal(document.getElementById('addAlertModal')).show();
        }
        if (e.target.closest('.delete-alert-btn')) {
            if (confirm('Bạn có chắc chắn muốn xóa cảnh báo này?')) {
                const row = e.target.closest('tr');
                const alertId = row.children[0].textContent;
                axios.delete(`/alerts/${alertId}`)
                    .then(() => {
                        showToast('success', 'Xóa cảnh báo thành công');
                        loadDashboardData();
                    })
                    .catch(() => showToast('error', 'Xóa cảnh báo thất bại'));
            }
        }
    });
}

// Sự kiện Lưu Alert (Thêm/Sửa)
const saveAlertBtn = document.getElementById('saveAlertBtn');
if (saveAlertBtn) {
    saveAlertBtn.addEventListener('click', async function () {
        const data = {
            // Lấy dữ liệu từ form alertForm
        };
        if (alertEditMode === 'add') {
            axios.post('/alerts', data)
                .then(() => {
                    showToast('success', 'Thêm cảnh báo thành công');
                    loadDashboardData();
                    bootstrap.Modal.getInstance(document.getElementById('addAlertModal')).hide();
                })
                .catch(() => showToast('error', 'Thêm cảnh báo thất bại'));
        } else if (alertEditMode === 'edit' && editingAlertId) {
            axios.put(`/alerts/${editingAlertId}`, data)
                .then(() => {
                    showToast('success', 'Cập nhật cảnh báo thành công');
                    loadDashboardData();
                    bootstrap.Modal.getInstance(document.getElementById('addAlertModal')).hide();
                })
                .catch(() => showToast('error', 'Cập nhật cảnh báo thất bại'));
        }
    });
}

// Sự kiện Thêm User (chỉ admin mới thấy nút addUserBtn)
const addUserBtn = document.getElementById('addUserBtn');
if (addUserBtn) {
    addUserBtn.addEventListener('click', function () {
        userEditMode = 'add';
        editingUserId = null;
        document.getElementById('userForm').reset();
        new bootstrap.Modal(document.getElementById('addUserModal')).show();
    });
}

// Sự kiện Sửa/Xóa User
const usersTable = document.getElementById('usersTable');
if (usersTable) {
    usersTable.addEventListener('click', function (e) {
        if (e.target.closest('.edit-user-btn')) {
            const row = e.target.closest('tr');
            userEditMode = 'edit';
            editingUserId = row.children[0].textContent;
            document.getElementById('newUsername').value = row.children[1].textContent;
            document.getElementById('newFullName').value = row.children[2].textContent;
            document.getElementById('newEmail').value = row.children[3].textContent;
            document.getElementById('userRole').value = row.children[4].textContent.toLowerCase();
            // Không điền password khi sửa
            new bootstrap.Modal(document.getElementById('addUserModal')).show();
        }
        if (e.target.closest('.delete-user-btn')) {
            if (confirm('Bạn có chắc chắn muốn xóa user này?')) {
                const row = e.target.closest('tr');
                const userId = row.children[0].textContent;
                axios.delete(`/users/${userId}`)
                    .then(() => {
                        showToast('success', 'Xóa user thành công');
                        loadDashboardData();
                    })
                    .catch(() => showToast('error', 'Xóa user thất bại'));
            }
        }
    });
}

// Sự kiện Lưu User (Thêm/Sửa)
document.getElementById('saveUserBtn').addEventListener('click', async function () {
    const data = {
        username: document.getElementById('newUsername').value,
        fullName: document.getElementById('newFullName').value,
        email: document.getElementById('newEmail').value,
        password: document.getElementById('newPassword').value,
        role: document.getElementById('userRole').value
    };
    if (userEditMode === 'add') {
        axios.post('/users', data)
            .then(() => {
                showToast('success', 'Thêm user thành công');
                loadDashboardData();
                bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            })
            .catch(() => showToast('error', 'Thêm user thất bại'));
    } else if (userEditMode === 'edit' && editingUserId) {
        axios.put(`/users/${editingUserId}`, data)
            .then(() => {
                showToast('success', 'Cập nhật user thành công');
                loadDashboardData();
                bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            })
            .catch(() => showToast('error', 'Cập nhật user thất bại'));
    }
});

async function loadActivityLog() {
    const tbody = document.querySelector('#activityLogTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    try {
        const response = await axios.get('/activity-logs', {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const logs = response.data;
        logs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${log.id}</td>
                <td>${log.username || log.userId}</td>
                <td>${log.action}</td>
                <td>${log.details}</td>
                <td>${log.created_at ? new Date(log.created_at).toLocaleString() : ''}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        showToast('error', 'Failed to load activity log');
    }
}

// User Management Functions
async function loadUsers() {
    try {
        const response = await fetch('/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        const users = await response.json();

        const tbody = document.querySelector('#userTable tbody');
        tbody.innerHTML = '';

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>
                    <button onclick="editUser(${user.id})" class="btn btn-sm btn-primary">Edit</button>
                    <button onclick="deleteUser(${user.id})" class="btn btn-sm btn-danger">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Error loading users', 'danger');
    }
}

async function addUser() {
    const username = document.getElementById('newUsername').value;
    const email = document.getElementById('newEmail').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;

    try {
        const response = await fetch('/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ username, email, password, role })
        });

        if (!response.ok) throw new Error('Failed to create user');

        showAlert('User created successfully', 'success');
        loadUsers();
        $('#addUserModal').modal('hide');
    } catch (error) {
        console.error('Error creating user:', error);
        showAlert('Error creating user', 'danger');
    }
}

async function editUser(id) {
    try {
        const response = await fetch(`/users/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        const user = await response.json();

        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUsername').value = user.username;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editRole').value = user.role;

        $('#editUserModal').modal('show');
    } catch (error) {
        console.error('Error loading user:', error);
        showAlert('Error loading user', 'danger');
    }
}

async function updateUser() {
    const id = document.getElementById('editUserId').value;
    const username = document.getElementById('editUsername').value;
    const email = document.getElementById('editEmail').value;
    const role = document.getElementById('editRole').value;

    try {
        const response = await fetch(`/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ username, email, role })
        });

        if (!response.ok) throw new Error('Failed to update user');

        showAlert('User updated successfully', 'success');
        loadUsers();
        $('#editUserModal').modal('hide');
    } catch (error) {
        console.error('Error updating user:', error);
        showAlert('Error updating user', 'danger');
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete user');

        showAlert('User deleted successfully', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Error deleting user', 'danger');
    }
}

// Activity Log Functions
async function loadActivityLogs() {
    try {
        const response = await fetch('/activity-logs', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch activity logs');
        const logs = await response.json();

        const tbody = document.querySelector('#activityLogTable tbody');
        tbody.innerHTML = '';

        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${log.username}</td>
                <td>${log.action}</td>
                <td>${log.tableName}</td>
                <td>${log.recordId}</td>
                <td>${log.details}</td>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading activity logs:', error);
        showAlert('Error loading activity logs', 'danger');
    }
}

// Update tab switching function
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');

    // Show selected tab
    document.getElementById(tabName + 'Tab').style.display = 'block';

    // Load data based on tab
    switch (tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'devices':
            loadDevices();
            break;
        case 'maintenance':
            loadMaintenance();
            break;
        case 'alerts':
            loadAlerts();
            break;
        case 'technicians':
            loadTechnicians();
            break;
        case 'reports':
            loadReports();
            break;
        case 'users':
            loadUsers();
            break;
        case 'activityLogs':
            loadActivityLogs();
            break;
    }
}

document.getElementById('deviceStatusReportBtn')?.addEventListener('click', function () {
    window.open('/api/reports/devices', '_blank');
});
document.getElementById('maintenanceReportBtn')?.addEventListener('click', function () {
    window.open('/api/reports/maintenance', '_blank');
});
document.getElementById('alertReportBtn')?.addEventListener('click', function () {
    window.open('/api/reports/alerts', '_blank');
});

async function populateDeviceDropdown(selectedId = null) {
    const select = document.getElementById('scheduleDevice');
    select.innerHTML = '<option value="">Select Device</option>';
    try {
        const response = await axios.get('/devices', {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        response.data.forEach(device => {
            const option = document.createElement('option');
            option.value = device.id;
            option.textContent = device.DeviceName;
            if (selectedId && device.id == selectedId) option.selected = true;
            select.appendChild(option);
        });
    } catch (error) {
        showToast('error', 'Failed to load devices');
    }
}

// Hàm load danh sách technician cho dropdown schedule
async function loadTechnicianDropdown(selectedId = null) {
    const select = document.getElementById('scheduleTechnician');
    if (!select) return;
    select.innerHTML = '<option value="">Select Technician</option>';
    try {
        const response = await axios.get('/technicians', {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        response.data.forEach(tech => {
            const option = document.createElement('option');
            option.value = tech.id;
            option.textContent = tech.FullName;
            if (selectedId && selectedId == tech.id) option.selected = true;
            select.appendChild(option);
        });
    } catch (error) {
        // Nếu lỗi thì vẫn để option mặc định
    }
}