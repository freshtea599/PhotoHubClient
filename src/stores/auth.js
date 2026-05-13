import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || '');
  const loading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!token.value);

  async function register(email, password, username) {
    loading.value = true;
    error.value = null;
    try {
      const response = await authService.register(email, password, username);
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', token.value);
    } catch (err) {
      error.value = err.response?.data?.error || 'Registration failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function login(email, password) {
    loading.value = true;
    error.value = null;
    try {
      const response = await authService.login(email, password);
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', token.value);
    } catch (err) {
      error.value = err.response?.data?.error || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    user.value = null;
    token.value = '';
    localStorage.removeItem('token');
    error.value = null;
  }

  async function loadUser() {
    if (!token.value) return;
    try {
      const response = await authService.getMe();
      user.value = response.data;
    } catch (err) {
      logout();
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    loadUser,
  };
});