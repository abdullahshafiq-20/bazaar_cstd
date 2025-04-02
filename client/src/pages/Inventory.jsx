import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import api from 'api';
import api from '../services/api';



function Inventory() {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  
  useEffect(() => {
    fetchInventory();
  }, []);
  
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory');
      setInventory(response.data);
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.products.map(item => item.category))];
      setCategories(uniqueCategories);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setLoading(false);
    }
  };
  
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
  };
  
  const getStockLevelClass = (quantity) => {
    if (quantity <= 0) return 'bg-red-100 text-red-800';
    if (quantity <= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };
  
  const filteredProducts = inventory?.products.filter(product => 
    categoryFilter === '' || product.category === categoryFilter
  );
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
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
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading inventory...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Products</h2>
              <p className="mt-2 text-3xl font-bold text-gray-900">{inventory.total_products}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Value</h2>
              <p className="mt-2 text-3xl font-bold text-indigo-600">${inventory.total_inventory_value}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Categories</h2>
              <p className="mt-2 text-3xl font-bold text-gray-900">{inventory.categories.length}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Out of Stock</h2>
              <p className="mt-2 text-3xl font-bold text-red-600">{inventory.out_of_stock_count}</p>
              <Link to="/inventory/alerts" className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View alerts
              </Link>
            </div>
          </div>
          
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
                {filteredProducts?.map((product) => (
                  <tr key={product.product_id}>
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
                      ${parseFloat(product.inventory_value).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/inventory/product/${product.product_id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                        Details
                      </Link>
                      <Link to={`/products/${product.product_id}`} className="text-gray-600 hover:text-gray-900">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Inventory;