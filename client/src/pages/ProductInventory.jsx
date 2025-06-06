import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
const ProductInventory = () => {
  const { id } = useParams();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [stockFormData, setStockFormData] = useState({
    quantity: 1,
    unit_price: 0,
    notes: ''
  });

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/inventory/product/${id}`);
        setInventory(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching product inventory:', err);
        setError('Failed to load inventory data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [id]);

  useEffect(() => {
    if (inventory && inventory.product) {
      setStockFormData(prev => ({
        ...prev,
        unit_price: inventory.product.unit_price
      }));
    }
  }, [inventory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStockFormData({
      ...stockFormData,
      [name]: name === 'quantity' || name === 'unit_price' ? parseFloat(value) : value
    });
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await api.post('/stock/add', {
        product_id: id,
        quantity: stockFormData.quantity,
        unit_price: stockFormData.unit_price,
        notes: stockFormData.notes
      });
      
      // Refresh data
      const response = await api.get(`/inventory/product/${id}`);
      setInventory(response.data);
      
      // Reset form and close modal
      setStockFormData({
        quantity: 1,
        unit_price: inventory.product.unit_price,
        notes: ''
      });
      setShowAddStockModal(false);
    } catch (err) {
      console.error('Error adding stock:', err);
      alert('Failed to add stock. Please try again.');
    }
  };

  const handleRecordSale = async (e) => {
    e.preventDefault();
    try {
      await api.post('/stock/sale', {
        product_id: id,
        quantity: stockFormData.quantity,
        unit_price: stockFormData.unit_price,
        notes: stockFormData.notes
      });
      
      // Refresh data
      const response = await api.get(`/inventory/product/${id}`);
      setInventory(response.data);
      
      // Reset form and close modal
      setStockFormData({
        quantity: 1,
        unit_price: inventory.product.unit_price,
        notes: ''
      });
      setShowSaleModal(false);
    } catch (err) {
      console.error('Error recording sale:', err);
      alert('Failed to record sale. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <Link to="/inventory" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
          Back to Inventory
        </Link>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>Inventory data not found</p>
        <Link to="/inventory" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
          Back to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link to="/" className="text-gray-700 hover:text-indigo-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
              </svg>
              Home
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <Link to="/inventory" className="ml-1 text-gray-700 hover:text-indigo-600 md:ml-2">Inventory</Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="ml-1 text-gray-500 md:ml-2 font-medium">{inventory.product.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Page Header with Link to Product Detail */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-lg shadow">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{inventory.product.name} - Inventory</h1>
          <p className="text-gray-500">SKU: {inventory.product.sku}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link 
            to={`/products/${inventory.product.product_id}`}
            className="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50"
          >
            <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            View Product Details
          </Link>
        </div>
      </div>

      {/* Inventory Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`bg-white rounded-lg shadow overflow-hidden border-t-4 ${
          inventory.inventory_status.current_quantity <= 0 ? 'border-red-500' : 
          inventory.inventory_status.current_quantity <= 10 ? 'border-yellow-500' : 
          'border-green-500'
        }`}>
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${
                inventory.inventory_status.current_quantity <= 0 ? 'bg-red-100 text-red-500' : 
                inventory.inventory_status.current_quantity <= 10 ? 'bg-yellow-100 text-yellow-500' : 
                'bg-green-100 text-green-500'
              }`}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-gray-600 text-sm font-medium">Current Stock</h2>
                <p className={`text-2xl font-bold ${
                  inventory.inventory_status.current_quantity <= 0 ? 'text-red-600' : 
                  inventory.inventory_status.current_quantity <= 10 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {inventory.inventory_status.current_quantity}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {inventory.inventory_status.current_quantity <= 0 
                    ? 'Out of Stock!' 
                    : inventory.inventory_status.current_quantity <= 10 
                      ? 'Low Stock' 
                      : 'In Stock'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border-t-4 border-indigo-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 bg-indigo-100 text-indigo-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-gray-600 text-sm font-medium">Inventory Value</h2>
                <p className="text-2xl font-bold text-indigo-600">
                  ${parseFloat(inventory.inventory_status.inventory_value).toFixed(2)}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Unit Price: ${parseFloat(inventory.product.unit_price).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border-t-4 border-blue-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 bg-blue-100 text-blue-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-gray-600 text-sm font-medium">Total In</h2>
                <p className="text-2xl font-bold text-blue-600">
                  {inventory.movement_summary.total_in}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Total stock received
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border-t-4 border-purple-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 bg-purple-100 text-purple-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-gray-600 text-sm font-medium">Total Out</h2>
                <p className="text-2xl font-bold text-purple-600">
                  {inventory.movement_summary.total_out}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Sold and removed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Movement History */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Stock Movement History</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddStockModal(true)}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add Stock
            </button>
            <button
              onClick={() => setShowSaleModal(true)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={inventory.inventory_status.current_quantity <= 0}
            >
              Record Sale
            </button>
          </div>
        </div>
        
        {inventory.recent_movements.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No stock movements recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.recent_movements.map((movement) => (
                  <tr key={movement.movement_id} className={
                    movement.movement_type === 'STOCK_IN' 
                      ? 'bg-green-50' 
                      : movement.movement_type === 'SALE' 
                        ? 'bg-blue-50' 
                        : 'bg-red-50'
                  }>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(movement.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${movement.movement_type === 'STOCK_IN' 
                          ? 'bg-green-100 text-green-800' 
                          : movement.movement_type === 'SALE' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'}`}>
                        {movement.movement_type === 'STOCK_IN' 
                          ? 'Stock Added' 
                          : movement.movement_type === 'SALE' 
                            ? 'Sale' 
                            : 'Manual Removal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${(parseFloat(movement.unit_price) || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {movement.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Category and Additional Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Product Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Category</h3>
            <p className="mt-1 text-gray-900">{inventory.product.category}</p>
            
            <h3 className="text-sm font-medium text-gray-500 mt-4">SKU</h3>
            <p className="mt-1 text-gray-900">{inventory.product.sku}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1 text-gray-900">{inventory.product.description || "No description provided"}</p>
          </div>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Add Stock</h3>
                <div className="mt-4">
                  <form onSubmit={handleAddStock}>
                    <div className="mb-4">
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        min="1"
                        value={stockFormData.quantity}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700">Unit Price</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="unit_price"
                          name="unit_price"
                          step="0.01"
                          min="0"
                          value={stockFormData.unit_price}
                          onChange={handleInputChange}
                          className="pl-7 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows="3"
                        value={stockFormData.notes}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g., New shipment received, restocking"
                      ></textarea>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                      >
                        Add Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddStockModal(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Record Sale</h3>
                <div className="mt-4">
                  <form onSubmit={handleRecordSale}>
                    <div className="mb-4">
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        min="1"
                        max={inventory?.inventory_status.current_quantity || 1}
                        value={stockFormData.quantity}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Maximum available: {inventory?.inventory_status.current_quantity || 0}
                      </p>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700">Selling Price</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="unit_price"
                          name="unit_price"
                          step="0.01"
                          min="0"
                          value={stockFormData.unit_price}
                          onChange={handleInputChange}
                          className="pl-7 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Suggested price: ${parseFloat(inventory?.product.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows="3"
                        value={stockFormData.notes}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g., Order #12345, Customer: John Doe"
                      ></textarea>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm"
                      >
                        Record Sale
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSaleModal(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInventory;