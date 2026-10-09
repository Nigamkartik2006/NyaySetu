const API_BASE_URL = '/api';

export async function apiRequest(endpoint, method = 'GET', body = null, token = null, isFormData = false) {
  const headers = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const authToken = token || localStorage.getItem('token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Something went wrong. Please try again.');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check your database/backend connection.');
    }
    throw err;
  }
}

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', 'POST', credentials),
  register: (studentData) => apiRequest('/auth/register', 'POST', studentData),
  getMe: () => apiRequest('/auth/me', 'GET'),
  updateProfile: (profileData) => apiRequest('/auth/profile', 'PUT', profileData),
  logout: () => apiRequest('/auth/logout', 'POST')
};

export const complaintApi = {
  create: (formData) => apiRequest('/complaints', 'POST', formData, null, true),
  getMyComplaints: () => apiRequest('/complaints/my', 'GET'),
  getEvidenceVault: () => apiRequest('/complaints/vault/all', 'GET'),
  getPrivateDetails: (caseId) => apiRequest(`/complaints/${caseId}`, 'GET'),
  removeEvidence: (caseId, evidenceId) => apiRequest(`/complaints/${caseId}/evidence/${evidenceId}`, 'DELETE'),
  getDownloadUrl: (caseId, evidenceId) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/complaints/${caseId}/evidence/${evidenceId}/download?token=${encodeURIComponent(token || '')}`;
  }
};

export const publicApi = {
  getComplaints: () => apiRequest('/public/complaints', 'GET'),
  getCaseDetails: (caseId) => apiRequest(`/public/complaints/${caseId}`, 'GET')
};

export const adminApi = {
  getDashboardStats: () => apiRequest('/admin/dashboard/stats', 'GET'),
  getComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/complaints?${query}`, 'GET');
  },
  getComplaintDetails: (caseId) => apiRequest(`/admin/complaints/${caseId}`, 'GET'),
  getEvidenceStreamUrl: (caseId, evidenceId) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/admin/complaints/${caseId}/evidence/${evidenceId}/stream?token=${encodeURIComponent(token || '')}`;
  },
  updateStatus: (caseId, statusData) => apiRequest(`/admin/complaints/${caseId}/status`, 'PATCH', statusData),
  addAction: (caseId, actionData) => apiRequest(`/admin/complaints/${caseId}/actions`, 'POST', actionData),
  getAnalytics: () => apiRequest('/admin/analytics', 'GET'),
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/audit-logs?${query}`, 'GET');
  }
};

export const officialApi = {
  getDashboardStats: () => apiRequest('/official/dashboard/stats', 'GET'),
  getComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/official/complaints?${query}`, 'GET');
  },
  getComplaintDetails: (caseId) => apiRequest(`/official/complaints/${caseId}`, 'GET'),
  getEvidenceStreamUrl: (caseId, evidenceId) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/official/complaints/${caseId}/evidence/${evidenceId}/stream?token=${encodeURIComponent(token || '')}`;
  },
  updateStatus: (caseId, statusData) => apiRequest(`/official/complaints/${caseId}/status`, 'PATCH', statusData),
  addAction: (caseId, formData) => apiRequest(`/official/complaints/${caseId}/actions`, 'POST', formData, null, true)
};

export const retaliationApi = {
  create: (formData) => apiRequest('/retaliation', 'POST', formData, null, true),
  getMyReports: () => apiRequest('/retaliation/my', 'GET'),
  getAllOversightReports: () => apiRequest('/retaliation/admin/all', 'GET')
};


