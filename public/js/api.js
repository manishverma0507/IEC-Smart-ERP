/**
 * MyIEC ERP - Shared API & Auth (Vanilla JS)
 * JWT in localStorage, role-based redirect
 */
(function () {
  const API_BASE = 'http://localhost:5000/api';


  function getToken() {
    return localStorage.getItem('token');
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
      return {};
    }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }

  function getRoleDashboard(role) {
    if (role === 'admin') return 'admin-dashboard.html';
    if (role === 'faculty') return 'faculty-dashboard.html';
    return 'student-dashboard.html';
  }

  async function api(path, options = {}) {
    const token = getToken();
    const headers = { ...(options.headers || {}) };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (options.body != null && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(API_BASE + path, { ...options, headers });
    let data = {};
    try {
      data = await res.json();
    } catch (e) {}
    if (res.status === 401) {
      logout();
      throw new Error(data.message || 'Session expired');
    }
    if (!res.ok) throw new Error(data.message || res.statusText || 'Request failed');
    return data;
  }

  window.MyIEC = {
    API_BASE,
    getToken,
    getUser,
    isLoggedIn,
    logout,
    getRoleDashboard,
    api,
  };
})();
