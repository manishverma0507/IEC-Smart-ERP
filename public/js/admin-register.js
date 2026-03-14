const API_BASE_URL = window.location.origin + '/api';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkAdmin();
  document.getElementById('registrationForm').addEventListener('submit', registerUser);
  document.getElementById('editForm').addEventListener('submit', updateUserStatus);
  loadUsers();
});

// Check if admin is logged in
async function checkAdmin() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || user.role !== 'admin') {
    window.location.href = '/login.html';
    return;
  }

  document.getElementById('adminName').textContent = user.name || 'Admin User';
}

// Switch between tabs
function switchTab(tab) {
  // Hide all tabs
  document.querySelectorAll('[id^="tab-"]').forEach(el => {
    if (!el.id.endsWith('-btn')) el.classList.add('hidden');
  });

  // Remove active state from all buttons
  document.querySelectorAll('[id$="-btn"]').forEach(btn => {
    btn.classList.remove('!bg-gradient-to-r', '!from-purple-500', '!to-blue-500', 'text-white');
    btn.classList.add('glass-hover', 'text-gray-300');
  });

  // Show selected tab
  const tabEl = document.getElementById(`tab-${tab}`);
  if (tabEl) {
    tabEl.classList.remove('hidden');
  }

  // Highlight active button
  const btnEl = document.getElementById(`tab-${tab}-btn`);
  if (btnEl) {
    btnEl.classList.remove('glass-hover', 'text-gray-300');
    btnEl.classList.add('!bg-gradient-to-r', '!from-purple-500', '!to-blue-500', 'text-white');
  }

  if (tab === 'dashboard') {
    setTimeout(() => {
      window.location.href = '/admin-dashboard.html';
    }, 500);
  }
}

// Update role-based fields visibility
function updateRoleFields() {
  const role = document.getElementById('role').value;
  document.getElementById('semesterField').style.display = role === 'student' ? 'block' : 'none';
  document.getElementById('batchField').style.display = role === 'student' ? 'block' : 'none';
  document.getElementById('designationField').style.display = role === 'faculty' ? 'block' : 'none';
}

// Validate password strength
function validatePassword(password) {
  const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

// Validate email format
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validate roll number format
function validateRollNo(rollNo) {
  return rollNo && rollNo.length >= 3;
}

// Show validation error on field
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorSpan = field.parentElement.querySelector('.error-message');
  field.classList.add('error-input');
  field.classList.remove('success-input');
  errorSpan.textContent = message;
  errorSpan.style.display = 'block';
}

// Clear field error
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorSpan = field.parentElement.querySelector('.error-message');
  field.classList.remove('error-input');
  field.classList.add('success-input');
  errorSpan.style.display = 'none';
}

// Validate registration form
function validateForm() {
  let isValid = true;
  const name = document.getElementById('name').value.trim();
  const role = document.getElementById('role').value;
  const rollNo = document.getElementById('rollNo').value.trim();
  const department = document.getElementById('department').value;
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const status = document.getElementById('status').value;

  // Clear previous errors
  document.querySelectorAll('input, select').forEach(field => clearFieldError(field.id));

  // Validate name
  if (!name || name.length < 3) {
    showFieldError('name', 'Name must be at least 3 characters');
    isValid = false;
  } else {
    clearFieldError('name');
  }

  // Validate role
  if (!role) {
    showFieldError('role', 'Please select a role');
    isValid = false;
  } else {
    clearFieldError('role');
  }

  // Validate roll number
  if (!validateRollNo(rollNo)) {
    showFieldError('rollNo', 'Roll number must be at least 3 characters');
    isValid = false;
  } else {
    clearFieldError('rollNo');
  }

  // Validate department
  if (!department) {
    showFieldError('department', 'Please select a department');
    isValid = false;
  } else {
    clearFieldError('department');
  }

  // Validate email
  if (!validateEmail(email)) {
    showFieldError('email', 'Please enter a valid email address');
    isValid = false;
  } else {
    clearFieldError('email');
  }

  // Validate password strength
  if (!validatePassword(password)) {
    showFieldError('password', 'Password must have 8+ chars, uppercase, lowercase, number, special char');
    isValid = false;
  } else {
    clearFieldError('password');
  }

  // Validate password match
  if (password !== confirmPassword) {
    showFieldError('confirmPassword', 'Passwords do not match');
    isValid = false;
  } else {
    clearFieldError('confirmPassword');
  }

  // Validate status
  if (!status) {
    showFieldError('status', 'Please select a status');
    isValid = false;
  } else {
    clearFieldError('status');
  }

  // Role-specific validation
  if (role === 'student') {
    const semester = document.getElementById('semester').value;
    const batch = document.getElementById('batch').value;
    if (!semester) {
      showFieldError('semester', 'Please select a semester');
      isValid = false;
    } else {
      clearFieldError('semester');
    }
    if (!batch) {
      showFieldError('batch', 'Please select a batch year');
      isValid = false;
    } else {
      clearFieldError('batch');
    }
  }

  if (role === 'faculty') {
    const designation = document.getElementById('designation').value;
    if (!designation) {
      showFieldError('designation', 'Please select a designation');
      isValid = false;
    } else {
      clearFieldError('designation');
    }
  }

  return isValid;
}

// Register user
async function registerUser(e) {
  e.preventDefault();
  console.log('📝 REGISTER BUTTON CLICKED');

  if (!validateForm()) {
    console.log('❌ Form validation failed');
    showError('Please fix the validation errors above');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No authentication token found');
    showError('You must be logged in as admin to register users');
    return;
  }

  console.log('✅ Token found, proceeding with registration');

  const role = document.getElementById('role').value;

  const userData = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
    confirmPassword: document.getElementById('confirmPassword').value,
    role: role,
    rollNo: document.getElementById('rollNo').value.trim(),
    department: document.getElementById('department').value,
    phone: '', // Optional
    avatar: '', // Optional
    status: document.getElementById('status').value
  };

  // Add role-specific fields
  if (role === 'student') {
    userData.semester = parseInt(document.getElementById('semester').value);
    userData.batch = document.getElementById('batch').value;
    userData.enrollmentNo = userData.rollNo;
  } else if (role === 'faculty') {
    userData.designation = document.getElementById('designation').value;
    userData.employeeId = userData.rollNo;
  }

  console.log('📊 Registration payload:', userData);

  try {
    console.log('🚀 Sending POST request to /api/auth/register');
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    console.log('📦 Response status:', response.status);
    const data = await response.json();
    console.log('📦 Response data:', data);

    if (!response.ok) {
      console.log('❌ Registration failed:', data.message);
      showError(data.message || 'Registration failed');
      return;
    }

    console.log('✨ REGISTRATION SUCCESS:', data.data.user);
    showSuccess(`${userData.name} registered successfully as ${role}!`);
    document.getElementById('registrationForm').reset();
    updateRoleFields();

    // Reload users list
    setTimeout(() => {
      console.log('🔄 Reloading users list...');
      loadUsers();
      switchTab('users');
    }, 1500);

  } catch (error) {
    console.error('❌ NETWORK ERROR:', error);
    showError('Network error: ' + error.message);
  }
}

// Load and display users
let allUsers = [];
async function loadUsers() {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to load users:', data.message);
      return;
    }

    allUsers = data.data || [];
    displayUsers(allUsers);
    updateStats();

  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Display users in table
function displayUsers(users) {
  const tbody = document.getElementById('usersTableBody');

  if (users.length === 0) {
    tbody.innerHTML = '<tr class="border-b border-white/10"><td colspan="7" class="px-4 py-3 text-center text-gray-400">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr class="border-b border-white/10 hover:bg-white/5 transition">
      <td class="px-4 py-3">
        <div class="font-semibold">${user.name}</div>
        <div class="text-gray-400 text-xs">${user._id}</div>
      </td>
      <td class="px-4 py-3">${user.email}</td>
      <td class="px-4 py-3">${user.rollNo || user.employeeId || '-'}</td>
      <td class="px-4 py-3">
        <span class="px-3 py-1 rounded-full text-xs font-semibold ${
          user.role === 'admin' ? 'bg-red-500/20 text-red-300' :
          user.role === 'student' ? 'bg-blue-500/20 text-blue-300' :
          'bg-purple-500/20 text-purple-300'
        }">
          ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      </td>
      <td class="px-4 py-3">${user.department || '-'}</td>
      <td class="px-4 py-3">
        <span class="px-3 py-1 rounded-full text-xs font-semibold ${
          user.isActive ? 'bg-green-500/20 text-green-300' :
          'bg-yellow-500/20 text-yellow-300'
        }">
          ${user.isActive || user.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td class="px-4 py-3 text-center">
        <button onclick="openEditModal('${user._id}', '${user.isActive || user.status === 'active' ? 'active' : 'inactive'}')" class="text-blue-400 hover:text-blue-300 mr-3 text-sm">
          <i class="fas fa-edit mr-1"></i>Edit
        </button>
        <button onclick="deleteUser('${user._id}', '${user.name}')" class="text-red-400 hover:text-red-300 text-sm">
          <i class="fas fa-trash mr-1"></i>Delete
        </button>
      </td>
    </tr>
  `).join('');
}

// Filter users
function filterUsers() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const role = document.getElementById('roleFilter').value;
  const status = document.getElementById('statusFilter').value;

  const filtered = allUsers.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
    const matchRole = !role || user.role === role;
    const matchStatus = !status || (user.isActive && status === 'active') || (!user.isActive && status === 'inactive');
    return matchSearch && matchRole && matchStatus;
  });

  displayUsers(filtered);
}

// Edit user modal
let editingUserId = null;
function openEditModal(userId, currentStatus) {
  editingUserId = userId;
  document.getElementById('editStatus').value = currentStatus;
  document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  editingUserId = null;
}

// Update user status
async function updateUserStatus(e) {
  e.preventDefault();

  const token = localStorage.getItem('token');
  const newStatus = document.getElementById('editStatus').value;
  const isActive = newStatus === 'active';

  try {
    const response = await fetch(`${API_BASE_URL}/users/${editingUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isActive, status: newStatus })
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.message || 'Update failed');
      return;
    }

    showSuccess('User updated successfully!');
    closeEditModal();
    loadUsers();

  } catch (error) {
    showError('Error: ' + error.message);
  }
}

// Delete user
async function deleteUser(userId, userName) {
  if (!confirm(`Are you sure you want to delete ${userName}?`)) return;

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.message || 'Delete failed');
      return;
    }

    showSuccess(`${userName} deleted successfully!`);
    loadUsers();

  } catch (error) {
    showError('Error: ' + error.message);
  }
}

// Update statistics
function updateStats() {
  const total = allUsers.length;
  const students = allUsers.filter(u => u.role === 'student').length;
  const faculty = allUsers.filter(u => u.role === 'faculty').length;
  const active = allUsers.filter(u => u.isActive || u.status === 'active').length;

  document.getElementById('totalUsers').textContent = total;
  document.getElementById('totalStudents').textContent = students;
  document.getElementById('totalFaculty').textContent = faculty;
  document.getElementById('activeUsers').textContent = active;
}

// Export users to CSV
function exportUsers() {
  const csv = [
    ['Name', 'Email', 'Role', 'Roll/EID', 'Department', 'Status'],
    ...allUsers.map(u => [
      u.name,
      u.email,
      u.role,
      u.rollNo || u.employeeId || '-',
      u.department || '-',
      (u.isActive || u.status === 'active') ? 'Active' : 'Inactive'
    ])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users_${new Date().getTime()}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Show success message
function showSuccess(message) {
  const el = document.getElementById('successMessage');
  document.getElementById('successText').textContent = message;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

// Show error message
function showError(message) {
  const el = document.getElementById('errorMessage');
  document.getElementById('errorText').textContent = message;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

// Logout
function logout() {
  localStorage.clear();
  window.location.href = '/login.html';
}
