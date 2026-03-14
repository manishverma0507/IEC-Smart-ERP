/**
 * ERP Backend API Integration
 * Shared authentication and API utilities
 */

const API_BASE_URL = 'http://localhost:5000/api';

// Authentication Helper Functions
const Auth = {
    /**
     * Check if user is authenticated
     * Redirects to login if not authenticated
     */
    checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    /**
     * Get stored token
     */
    getToken() {
        return localStorage.getItem('token');
    },

    /**
     * Get user data from localStorage
     */
    getUser() {
        return {
            name: localStorage.getItem('userName'),
            email: localStorage.getItem('userEmail'),
            role: localStorage.getItem('userRole'),
            id: localStorage.getItem('userId')
        };
    },

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        window.location.href = 'login.html';
    },

    /**
     * Check if user has specific role
     */
    hasRole(role) {
        const userRole = localStorage.getItem('userRole');
        return userRole === role;
    }
};

// API Helper Functions
const API = {
    /**
     * Make authenticated API request
     */
    async request(endpoint, options = {}) {
        const token = Auth.getToken();

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
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
            const data = await response.json();

            if (!response.ok) {
                // Handle unauthorized
                if (response.status === 401) {
                    Auth.logout();
                    return null;
                }
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    /**
     * POST request
     */
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    /**
     * PUT request
     */
    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

// Student API Functions
const StudentAPI = {
    async getProfile() {
        return await API.get('/student/me');
    },

    async getAttendance() {
        return await API.get('/student/attendance');
    },

    async getMarks() {
        return await API.get('/student/marks');
    },

    async updateProfile(data) {
        return await API.put('/student/profile', data);
    }
};

// Faculty API Functions
const FacultyAPI = {
    async getProfile() {
        return await API.get('/faculty/me');
    },

    async getSubjects() {
        return await API.get('/faculty/subjects');
    },

    async createSubject(data) {
        return await API.post('/faculty/subjects', data);
    },

    async getStudents() {
        return await API.get('/faculty/students');
    },

    async createAttendance(data) {
        return await API.post('/faculty/attendance', data);
    },

    async updateAttendance(id, data) {
        return await API.put(`/faculty/attendance/${id}`, data);
    },

    async getAttendanceBySubject(subjectId) {
        return await API.get(`/faculty/attendance/subject/${subjectId}`);
    },

    async createMarks(data) {
        return await API.post('/faculty/marks', data);
    },

    async updateMarks(id, data) {
        return await API.put(`/faculty/marks/${id}`, data);
    },

    async getMarksBySubject(subjectId) {
        return await API.get(`/faculty/marks/subject/${subjectId}`);
    }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.Auth = Auth;
    window.API = API;
    window.StudentAPI = StudentAPI;
    window.FacultyAPI = FacultyAPI;
    window.API_BASE_URL = API_BASE_URL;
}
