import axios from 'axios';



const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';


const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// We're not handling 401 redirects in the interceptor anymore
// Each component will handle auth failures appropriately

export default api;