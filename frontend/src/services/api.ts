import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
  expiresIn: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
  user?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  user_email: string;
  user_name: string;
}

export interface DatabaseUser {
  id: number;
  email: string;
  display_name: string;
  created_at: string;
  last_login: string;
  is_active: boolean;
}

export interface Stats {
  users: number;
  products: number;
  orders: number;
  timestamp: string;
}

// Auth API
export const authAPI = {
  login: async (): Promise<{ authUrl: string }> => {
    const response = await api.get('/auth/login');
    return response.data as { authUrl: string };
  },

  handleCallback: async (code: string, state: string): Promise<AuthResponse> => {
    const response = await api.get(`/auth/callback?code=${code}&state=${state}`);
    return response.data as AuthResponse;
  },

  verifyToken: async (token: string): Promise<{ success: boolean; user: User }> => {
    const response = await api.post('/auth/verify', { token });
    return response.data as { success: boolean; user: User };
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/logout');
    return response.data as { success: boolean; message: string };
  },
};

// Data API
export const dataAPI = {
  getUsers: async (): Promise<ApiResponse<DatabaseUser[]>> => {
    const response = await api.get('/api/users');
    return response.data as ApiResponse<DatabaseUser[]>;
  },

  getProducts: async (): Promise<ApiResponse<Product[]>> => {
    const response = await api.get('/api/products');
    return response.data as ApiResponse<Product[]>;
  },

  getOrders: async (): Promise<ApiResponse<Order[]>> => {
    const response = await api.get('/api/orders');
    return response.data as ApiResponse<Order[]>;
  },

  getStats: async (): Promise<ApiResponse<Stats>> => {
    const response = await api.get('/api/stats');
    return response.data as ApiResponse<Stats>;
  },

  createProduct: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<ApiResponse<Product>> => {
    const response = await api.post('/api/products', product);
    return response.data as ApiResponse<Product>;
  },

  healthCheck: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/api/health');
    return response.data as ApiResponse<any>;
  },
};

export default api;