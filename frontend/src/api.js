import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

// Products
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
};

// Cart
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (productId, quantity = 1) => api.post('/cart', { product_id: productId, quantity }),
  update: (id, quantity) => api.put(`/cart/${id}`, { quantity }),
  remove: (id) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart'),
};

// Favorites
export const favoritesAPI = {
  get: () => api.get('/favorites'),
  add: (productId) => api.post('/favorites', { product_id: productId }),
  remove: (productId) => api.delete(`/favorites/${productId}`),
};

// Orders
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
};

// Reviews
export const reviewsAPI = {
  add: (data) => api.post('/reviews', data),
  getByProduct: (productId) => api.get(`/reviews/${productId}`),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllOrders: () => api.get('/admin/orders'),
  getAllProducts: () => api.get('/admin/products'),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  getAllUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  getAllCategories: () => api.get('/admin/categories'),
  addCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  getReports: () => api.get('/admin/reports'),
  addProduct: (data) => api.post('/admin/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
};

export default api;
