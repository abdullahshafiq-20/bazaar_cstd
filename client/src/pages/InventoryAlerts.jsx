import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useStore } from '../context/StoreContext'; 

const InventoryAlerts = () => {
  const { currentStoreId, loading: storeLoading, error: storeError } = useStore(); // Get the current store ID from context
  const [alerts, setAlerts] = useState({
    threshold: 10,
    total_alerts: 0,
    out_of_stock_count: 0,
    low_stock_count: 0,
    out_of_stock: [],
    low_stock: []
  });
  const [threshold, setThreshold] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentStoreId) {
      fetchAlerts();
    }
  }, [threshold, currentStoreId]);

  const fetchAlerts = async () => {
    if (!currentStoreId) {
      setError('No store selected');
      setLoading(false);
      return;
    }
  
    try {
      setLoading(true);
      // Update to use the currentStoreId in the URL
      const response = await api.get(`/stores/${currentStoreId}/inventory/alerts?threshold=${threshold}`);
      
      // Transform the response to match the expected format
      if (response.data && response.data.success) {
        const outOfStockItems = response.data.data.filter(item => item.status === 'OUT_OF_STOCK');
        const lowStockItems = response.data.data.filter(item => item.status === 'LOW_STOCK');
        
        const alertData = {
          threshold: response.data.low_stock_threshold || threshold,
          total_alerts: response.data.count || 0,
          out_of_stock_count: outOfStockItems.length,
          low_stock_count: lowStockItems.length,
          out_of_stock: outOfStockItems,
          low_stock: lowStockItems
        };
        
        setAlerts(alertData);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError('Failed to fetch inventory alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setThreshold(value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Alerts</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label htmlFor="threshold" className="mr-2 text-sm font-medium text-gray-700">
              Low Stock Threshold:
            </label>
            <input
              type="number"
              id="threshold"
              value={threshold}
              onChange={handleThresholdChange}
              className="w-20 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              min="1"
            />
          </div>
          <button
            onClick={fetchAlerts}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Alert Summary Card */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-gray-900">Total Alerts</h3>
                  <p className="text-3xl font-bold text-indigo-600">{alerts.total_alerts}</p>
                </div>
                <div className="bg-red-100 p-4 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-gray-900">Out of Stock</h3>
                  <p className="text-3xl font-bold text-red-600">{alerts.out_of_stock_count}</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-gray-900">Low Stock</h3>
                  <p className="text-3xl font-bold text-yellow-600">{alerts.low_stock_count}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Out of Stock Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Out of Stock Products
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Products that need immediate replenishment
              </p>
            </div>
            {!alerts.out_of_stock || alerts.out_of_stock.length === 0 ? (
              <div className="px-4 py-5 text-center text-sm text-gray-500">
                No out of stock products
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {alerts.out_of_stock.map((product) => (
                      <tr key={product.product_id} className="bg-red-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">
                          {product.current_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${isNaN(parseFloat(product.unit_price)) 
                            ? '0.00' 
                            : parseFloat(product.unit_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                            Add Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Low Stock Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Low Stock Products
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Products below the threshold of {alerts.threshold} units
              </p>
            </div>
            {!alerts.low_stock || alerts.low_stock.length === 0 ? (
              <div className="px-4 py-5 text-center text-sm text-gray-500">
                No low stock products
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {alerts.low_stock.map((product) => (
                      <tr key={product.product_id} className="bg-yellow-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-bold">
                          {product.current_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${isNaN(parseFloat(product.unit_price)) 
                            ? '0.00' 
                            : parseFloat(product.unit_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                            Add Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAlerts;