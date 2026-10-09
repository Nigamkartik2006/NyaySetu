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
  logout: () => apiRequest('/auth/logout', 'POST')
};

export const complaintApi = {
  create: (formData) => apiRequest('/complaints', 'POST', formData, null, true),
  getMyComplaints: () => apiRequest('/complaints/my', 'GET'),
  getPrivateDetails: (caseId) => apiRequest(`/complaints/${caseId}`, 'GET'),
  removeEvidence: (caseId, evidenceId) => apiRequest(`/complaints/${caseId}/evidence/${evidenceId}`, 'DELETE'),
  getDownloadUrl: (caseId, evidenceId) => `${API_BASE_URL}/complaints/${caseId}/evidence/${evidenceId}/download`
};

export const publicApi = {
  getComplaints: () => apiRequest('/public/complaints', 'GET'),
  getCaseDetails: (caseId) => apiRequest(`/public/complaints/${caseId}`, 'GET')
};
