import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../context/StoreContext';

function Inventory() {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  
  // Get store context
  const { currentStoreId, loading: storeLoading, error: storeError } = useStore();
  
  useEffect(() => {
    console.log('Inventory useEffect triggered');
    console.log('Current store ID:', currentStoreId);
    
    // Only fetch inventory when we have a valid store ID and store data is loaded
    if (currentStoreId && !storeLoading) {
      fetchInventory();
    }
  }, [currentStoreId, storeLoading]);
  
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching inventory for store: ${currentStoreId}`);
      const response = await api.get(`/stores/${currentStoreId}/inventory`);
      console.log('Inventory response:', response.data);
      
      // Check if response has the expected structure
      if (!response.data || !response.data.success || !Array.isArray(response.data.data)) {
        console.error('Invalid inventory data format:', response.data);
        setError('Received invalid inventory data format from the server');
        setLoading(false);
        return;
      }
      
      // Transform the data to match our expected structure
      const transformedData = {
        products: response.data.data, // Use the 'data' array as our products
        total_products: response.data.count || response.data.data.length,
        total_inventory_value: calculateTotalValue(response.data.data)
      };
      
      setInventory(transformedData);
      
      // Extract unique categories from products array
      const uniqueCategories = [...new Set(response.data.data.map(item => item.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory data. Please try again later.');
      setLoading(false);
    }
  };
  
  // Helper function to calculate total inventory value
  const calculateTotalValue = (products) => {
    return products.reduce((total, product) => {
      const price = parseFloat(product.unit_price) || 0;
      const quantity = parseInt(product.current_quantity) || 0;
      return total + (price * quantity);
    }, 0).toFixed(2);
  };
  
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
  };
  
  const getStockLevelClass = (quantity) => {
    const qty = parseInt(quantity) || 0;
    if (qty <= 0) return 'bg-red-100 text-red-800';
    if (qty <= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };
  
  // Only filter products when inventory data exists and has products array
  const filteredProducts = inventory && Array.isArray(inventory.products) 
    ? inventory.products.filter(product => 
        categoryFilter === '' || product.category === categoryFilter
      )
    : [];
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        
        {/* Show selected store ID */}
        <div className="text-sm text-gray-500 mb-2">
          Store: {currentStoreId || 'None selected'}
        </div>
        
        {categories.length > 0 && (
          <div className="mt-4 md:mt-0">
            <select
              value={categoryFilter}
              onChange={handleCategoryChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Debug info section */}
      <div className="bg-gray-50 p-3 rounded mb-4 text-xs">
        <h3 className="font-bold">Debug Info:</h3>
        <p>Store ID: {currentStoreId || 'None'}</p>
        <p>Store Loading: {storeLoading ? 'Yes' : 'No'}</p>
        <p>Inventory Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Categories: {categories.join(', ') || 'None'}</p>
        <p>Products Count: {inventory?.products?.length || 0}</p>
        <p>Response Format: {inventory ? 'Valid' : 'Not loaded'}</p>
      </div>
      
      {/* Show store context errors */}
      {storeError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Store Error</p>
          <p>{storeError}</p>
        </div>
      )}
      
      {/* Show inventory fetch errors */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Show loading indicator */}
      {(loading || storeLoading) && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading inventory...</p>
        </div>
      )}
      
      {/* Display inventory data when available */}
      {!loading && !storeLoading && !error && !storeError && inventory && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Products</h2>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {inventory.total_products || 0}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Value</h2>
              <p className="mt-2 text-3xl font-bold text-indigo-600">
                ${inventory.total_inventory_value || 0}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Categories</h2>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {categories.length || 0}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Out of Stock</h2>
              <p className="mt-2 text-3xl font-bold text-red-600">
                {inventory.products?.filter(p => parseInt(p.current_quantity) <= 0)?.length || 0}
              </p>
              <Link to="/inventory/alerts" className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View alerts
              </Link>
            </div>
          </div>
          
          {filteredProducts.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.product_id || product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockLevelClass(product.current_quantity)}`}>
                          {product.current_quantity} units
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${product.unit_price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${(parseFloat(product.unit_price) * parseInt(product.current_quantity)).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {/* <Link to={`/inventory/products/${product.product_id || product.id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                          Details
                        </Link> */}
                        <Link to={`/products/${product.product_id || product.id}`} className="text-gray-600 hover:text-gray-900">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-md">
              <p className="text-yellow-700">
                {categoryFilter ? 'No products found in this category.' : 'No products found in inventory.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Inventory;