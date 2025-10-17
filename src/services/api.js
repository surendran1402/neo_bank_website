import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - no localStorage token storage
api.interceptors.request.use(
  (config) => {
    // No localStorage - token must be provided in each request
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Check if it's a PIN verification error (from transfer endpoint)
      const isTransferError = error.config?.url?.includes('/banking/transfer');
      const isPINError = error.response?.data?.error?.toLowerCase().includes('pin');
      
      // Only redirect to login if it's not a PIN verification error
      if (!isTransferError || !isPINError) {
        // No localStorage to clear - just redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Register new user
  register: async (email, password, confirmPassword) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      confirmPassword
    });
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    console.log('API: Making login request to:', api.defaults.baseURL + '/auth/login');
    console.log('API: Request data:', { email, password: '***' });
    
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    console.log('API: Login response:', response.data);
    return response.data;
  },

  // Get user profile (requires token)
  getProfile: async (token) => {
    const response = await api.get('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Update user profile (requires token)
  updateProfile: async (name, token) => {
    const response = await api.put('/auth/profile', { name }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Change password (requires token)
  changePassword: async (currentPassword, newPassword, confirmPassword, token) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Upload profile photo (requires token)
  uploadPhoto: async (photoFile, token) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    const response = await api.post('/auth/upload-photo', formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Update profile with additional fields (requires token)
  updateProfile: async (profileData, token) => {
    const response = await api.put('/auth/update-profile', profileData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Update comprehensive profile with all banking details (requires token)
  updateComprehensiveProfile: async (profileData, token) => {
    const response = await api.put('/auth/update-comprehensive-profile', profileData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

// Banking API calls
export const bankingAPI = {
  // Link bank account (requires token)
  linkBankAccount: async (accountName, institution, token) => {
    const response = await api.post('/banking/link-account', {
      bankName: accountName, // Map accountName to Financial Institution name for the API
      institution
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get user's bank accounts (requires token)
  getAccounts: async (token) => {
    const response = await api.get('/banking/accounts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Transfer funds (requires token)
  transferFunds: async (recipientPublicId, amount, description, recipientAccountNumber, recipientProfileUrl, token, category, pin, recipientMobileNumber = null, senderAccountId = null) => {
    const response = await api.post('/banking/transfer', {
      recipientPublicId,
      recipientAccountNumber,
      recipientProfileUrl,
      recipientMobileNumber,
      amount,
      description,
      category,
      pin,
      senderAccountId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get transaction history (requires token)
  getTransactions: async (page = 1, limit = 20, token) => {
    const response = await api.get('/banking/transactions', {
      params: { page, limit },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Simulate a credit (requires token)
  simulateCredit: async (amount, description, token) => {
    const response = await api.post('/banking/simulate-credit', {
      amount,
      description
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get account balance (requires token)
  getBalance: async (token) => {
    const response = await api.get('/banking/balance', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Find user by public ID (no token required - public lookup)
  findUser: async (publicId) => {
    const response = await api.get(`/banking/find-user/${publicId}`);
    return response.data;
  },
  getAIInsights: async (token, accountId) => {
    const response = await api.get('/banking/ai-insights', {
      params: accountId ? { accountId } : {},
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },


  // Set PIN for user
  setPIN: async (pin, token) => {
    const response = await api.post('/auth/set-pin', { pin }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api; 