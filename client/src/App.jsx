import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Stock from './pages/Stock';
import Inventory from './pages/Inventory';
import InventoryAlerts from './pages/InventoryAlerts';
import ProductInventory from './pages/ProductInventory';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';

// Create a wrapper for protected routes that includes StoreProvider
const ProtectedStoreRoutes = () => {
  return (
    <StoreProvider>
      <Outlet />
    </StoreProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto px-4 py-6">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes with Store context */}
              <Route element={<ProtectedRoute />}>
                <Route element={<ProtectedStoreRoutes />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/stock" element={<Stock />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/inventory/alerts" element={<InventoryAlerts />} />
                  <Route path="/inventory/products/:id" element={<ProductInventory />} />
                </Route>
              </Route>
              
              {/* Admin routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                {/* Add more admin routes as needed */}
              </Route>
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;