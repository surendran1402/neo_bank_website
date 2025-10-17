import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No localStorage - always start fresh
    // User must login each time to get fresh data from MongoDB
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email, password: '***' });
      const response = await authAPI.login(email, password);
      console.log('Login response:', response);
      
      if (response.success) {
        // Store user and token in memory only (no localStorage)
        setUser(response.user);
        setToken(response.token);
        return { success: true, user: response.user, token: response.token };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email, password, confirmPassword) => {
    try {
      const response = await authAPI.register(email, password, confirmPassword);
      
      if (response.success) {
        // Store user and token in memory only (no localStorage)
        setUser(response.user);
        setToken(response.token);
        return { success: true, user: response.user, token: response.token };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    // No localStorage to clear - just clear memory
  };

  const updateUser = async (updatedUser) => {
    try {
      const response = await authAPI.updateProfile(updatedUser.name, token);
      
      if (response.success) {
        setUser(response.user);
        // No localStorage - just update memory
        return { success: true, user: response.user };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Update user error:', error);
      const errorMessage = error.response?.data?.error || 'Update failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      const response = await authAPI.changePassword(currentPassword, newPassword, confirmPassword, token);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Change password error:', error);
      const errorMessage = error.response?.data?.error || 'Password change failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    changePassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 