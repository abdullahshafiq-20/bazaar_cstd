import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Stock from './pages/Stock';
import Inventory from './pages/Inventory';
import InventoryAlerts from './pages/InventoryAlerts';
import ProductInventory from './pages/ProductInventory';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/alerts" element={<InventoryAlerts />} />
            <Route path="/inventory/product/:id" element={<ProductInventory />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App; 
