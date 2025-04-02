import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Stock() {
  const [products, setProducts] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('add');
  const [stockForm, setStockForm] = useState({
    product_id: '',
    quantity: '',
    unit_price: '',
    notes: ''
  });
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, movementsRes] = await Promise.all([
        api.get('/product/get'),
        api.get('/stock/movements')
      ]);
      setProducts(productsRes.data);
      setStockMovements(movementsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStockForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint;
      switch (activeTab) {
        case 'add':
          endpoint = '/stock/add';
          break;
        case 'sale':
          endpoint = '/stock/sale';
          break;
        case 'remove':
          endpoint = '/stock/remove';
          break;
        default:
          return;
      }
      
      await api.post(endpoint, stockForm);
      setStockForm({
        product_id: '',
        quantity: '',
        unit_price: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error(`Error recording ${activeTab}:`, error);
      alert(error.response?.data?.error || 'An error occurred');
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  const getMovementTypeClass = (type) => {
    switch (type) {
      case 'STOCK_IN':
        return 'bg-green-100 text-green-800';
      case 'SALE':
        return 'bg-blue-100 text-blue-800';
      case 'MANUAL_REMOVAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Stock Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('add')}
                  className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'add'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Add Stock
                </button>
                <button
                  onClick={() => setActiveTab('sale')}
                  className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'sale'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Record Sale
                </button>
                <button
                  onClick={() => setActiveTab('remove')}
                  className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'remove'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Remove Stock
                </button>
              </nav>
            </div>
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {activeTab === 'add' && 'Add Stock'}
                {activeTab === 'sale' && 'Record Sale'}
                {activeTab === 'remove' && 'Remove Stock'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">Product</label>
                  <select
                    id="product_id"
                    name="product_id"
                    value={stockForm.product_id}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.product_id} value={product.product_id}>
                        {product.name} (SKU: {product.sku})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={stockForm.quantity}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                {activeTab !== 'remove' && (
                  <div className="mb-4">
                    <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700">
                      Unit Price {activeTab === 'add' ? '(purchase price)' : '(selling price)'}
                    </label>
                    <input
                      type="number"
                      id="unit_price"
                      name="unit_price"
                      value={stockForm.unit_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Leave blank to use product price"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={stockForm.notes}
                    onChange={handleInputChange}
                    rows="2"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {activeTab === 'add' && 'Add Stock'}
                  {activeTab === 'sale' && 'Record Sale'}
                  {activeTab === 'remove' && 'Remove Stock'}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Stock Movements</h3>
            </div>
            
            {loading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-indigo-600"></div>
                <p className="mt-2 text-gray-600">Loading stock movements...</p>
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
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stockMovements.map(movement => (
                      <tr key={movement.movement_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {movement.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMovementTypeClass(movement.movement_type)}`}>
                            {movement.movement_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movement.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${movement.unit_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(movement.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stock;