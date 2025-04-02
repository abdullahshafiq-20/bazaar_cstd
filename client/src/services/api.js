import axios from 'axios';
// import { getToken } from '../utils/auth';

const apiUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
  
  baseURL: `${apiUrl}/api`,
  // baseURL: 'http://localhost:5000/api', // Replace with your API URL
});

// api.interceptors.request.use(
//   (config) => { 
//     const token = getToken();
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

export default api;