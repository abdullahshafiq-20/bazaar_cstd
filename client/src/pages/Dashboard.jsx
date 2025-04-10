import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../context/StoreContext';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });
  
  const { 
    currentStoreId, 
    selectStore,
    loading: storeLoading, 
    error: storeError,
    availableStores 
  } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Helper function to calculate total value
    const calculateTotalValue = (products) => {
      return products.reduce((total, product) => {
        const price = parseFloat(product.unit_price) || 0;
        const quantity = parseInt(product.current_stock) || 0; // Changed from
        return total + (price * quantity);
      }, 0).toFixed(2);
    };
    
    const fetchData = async () => {
      if (storeLoading) {
        return;
      }
      
      if (storeError) {
        setError(storeError);
        setLoading(false);
        return;
      }
      
      if (!currentStoreId) {
        setError('No store selected. Please select a store first.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch store details to display in UI
        const storeRes = await api.get(`/stores/${currentStoreId}`);
        
        // Fetch inventory data
        const inventoryRes = await api.get(`/stores/${currentStoreId}/inventory`);
        
        // Fetch alerts data
        const alertsRes = await api.get(`/stores/${currentStoreId}/inventory/alerts`);
        
        // Calculate values based on the responses
        let totalProducts = 0;
        let totalValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        
        // Process inventory data
        if (inventoryRes.data && inventoryRes.data.success && Array.isArray(inventoryRes.data.data)) {
          totalProducts = inventoryRes.data.count || inventoryRes.data.data.length;
          totalValue = calculateTotalValue(inventoryRes.data.data);
        }
        
        // Process alerts data
        if (alertsRes.data && alertsRes.data.success && Array.isArray(alertsRes.data.data)) {
          outOfStockCount = alertsRes.data.data.filter(item => item.status === 'OUT_OF_STOCK').length;
          lowStockCount = alertsRes.data.data.filter(item => item.status === 'LOW_STOCK').length;
        }
        
        // Update stats state
        setStats({
          totalProducts,
          totalValue,
          lowStockCount,
          outOfStockCount
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentStoreId, storeLoading, storeError]);

  // Handle store selection change
  const handleStoreChange = (e) => {
    selectStore(parseInt(e.target.value));
  };
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        
        {/* Add store selector if multiple stores are available */}
        {!storeLoading && !storeError && availableStores && availableStores.length > 1 && (
          <div className="flex items-center self-end sm:self-auto">
            <label htmlFor="store-select" className="mr-2 font-medium text-gray-700">
              Select Store:
            </label>
            <select
              id="store-select"
              value={currentStoreId || ''}
              onChange={handleStoreChange}
              className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="" disabled>Select a store</option>
              {availableStores.map(storeId => (
                <option key={storeId} value={storeId}>
                  Store #{storeId}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Show error message if there's an error */}
      {(error || storeError) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error || storeError}</p>
        </div>
      )}
      
      {/* Show loading indicator */}
      {(loading || storeLoading) && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      )}
      
      {/* Only show dashboard content when not loading and no errors */}
      {!loading && !storeLoading && !error && !storeError && (
        <>
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
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-8">
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
        </>
      )}
    </div>
  );
}

export default Dashboard;