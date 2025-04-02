import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import api from 'api';
import api from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });

  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const inventoryRes = await api.get('/inventory');
        console.log('Inventory Response:', inventoryRes.data);
        const alertsRes = await api.get('/inventory/alerts');
        
        setStats({
          totalProducts: inventoryRes.data.total_products || 0,
          totalValue: inventoryRes.data.total_inventory_value || 0,
          lowStockCount: alertsRes.data.low_stock_count || 0,
          outOfStockCount: alertsRes.data.out_of_stock_count || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Products</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
          <Link to="/products" className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View all products
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Inventory Value</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">${stats.totalValue}</p>
          <Link to="/inventory" className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View inventory
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Low Stock Items</h2>
          <p className="mt-2 text-3xl font-bold text-orange-500">{stats.lowStockCount}</p>
          <Link to="/inventory/alerts" className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View alerts
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Out of Stock</h2>
          <p className="mt-2 text-3xl font-bold text-red-600">{stats.outOfStockCount}</p>
          <Link to="/inventory/alerts" className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View alerts
          </Link>
        </div>
      </div>
      
      <div className="flex space-x-4 mb-8">
        <Link 
          to="/products" 
          className="flex-1 bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Manage Products</h2>
            <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Add, edit, and manage your product catalog
          </p>
        </Link>
        
        <Link 
          to="/stock" 
          className="flex-1 bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Manage Stock</h2>
            <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Record stock movements, sales, and removals
          </p>
        </Link>
        
        <Link 
          to="/inventory" 
          className="flex-1 bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">View Inventory</h2>
            <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Monitor current inventory levels and value
          </p>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;