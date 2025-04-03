import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../context/StoreContext'; // Add this import

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentStoreId } = useStore(); // Get current store ID from context
  const [product, setProduct] = useState(null);
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
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unit_price: 0,
    description: ''
  });

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        if (!currentStoreId) {
          setError('No store selected');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        
        // Fetch product details
        const productResponse = await api.get(`/product/get_by_id/${id}`);
        console.log('Product Response:', productResponse.data);
        setProduct(productResponse.data);
        
        // Fetch inventory details using store ID
        const inventoryResponse = await api.get(`/stores/${currentStoreId}/inventory/product/${id}`);
        console.log('Inventory Response:', inventoryResponse.data);
        
        // Transform the inventory data to match expected structure
        if (inventoryResponse.data && inventoryResponse.data.success) {
          const formattedInventory = {
            inventory_status: {
              current_quantity: inventoryResponse.data.data.current_quantity || 0,
              inventory_value: (inventoryResponse.data.data.current_quantity * productResponse.data.unit_price).toFixed(2),
              is_in_stock: inventoryResponse.data.data.current_quantity > 0
            },
            recent_movements: inventoryResponse.data.data.movements || []
          };
          
          setInventory(formattedInventory);
        }
        
        // Initialize stock form with product price
        if (productResponse.data.unit_price) {
          setStockFormData(prev => ({
            ...prev,
            unit_price: productResponse.data.unit_price
          }));
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to load product details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    if (currentStoreId) {
      fetchProductData();
    }
  }, [id, currentStoreId]);

  // Update handleAddStock to use currentStoreId
// Update handleAddStock to use the correct field names
const handleAddStock = async (e) => {
  e.preventDefault();
  try {
    if (!currentStoreId) {
      alert('No store selected');
      return;
    }
    
    // Change the field names to match what the API expects
    await api.post(`/stores/${currentStoreId}/inventory/add`, {
      productId: id, // Changed from product_id to productId
      quantity: stockFormData.quantity,
      unitPrice: stockFormData.unit_price, // Changed from unit_price to unitPrice
      notes: stockFormData.notes
    });
    
    // Refresh data
    const inventoryResponse = await api.get(`/stores/${currentStoreId}/inventory/product/${id}`);
    
    // Transform the inventory data
    if (inventoryResponse.data && inventoryResponse.data.success) {
      const formattedInventory = {
        inventory_status: {
          current_quantity: inventoryResponse.data.data.current_quantity || 0,
          inventory_value: (inventoryResponse.data.data.current_quantity * product.unit_price).toFixed(2),
          is_in_stock: inventoryResponse.data.data.current_quantity > 0
        },
        recent_movements: inventoryResponse.data.data.movements || []
      };
      
      setInventory(formattedInventory);
    }
    
    // Reset form and close modal
    setStockFormData({
      quantity: 1,
      unit_price: product.unit_price,
      notes: ''
    });
    setShowAddStockModal(false);
  } catch (err) {
    console.error('Error adding stock:', err);
    alert('Failed to add stock. Please try again.');
  }
};
  // Update handleRecordSale to use currentStoreId
  const handleRecordSale = async (e) => {
    e.preventDefault();
    try {
      if (!currentStoreId) {
        alert('No store selected');
        return;
      }
      
      await api.post(`/stores/${currentStoreId}/stock/sale`, {
        product_id: id,
        quantity: stockFormData.quantity,
        unit_price: stockFormData.unit_price,
        notes : stockFormData.notes,
      });
      
      // Refresh data
      const inventoryResponse = await api.get(`/stores/${currentStoreId}/inventory/product/${id}`);
      
      // Transform the inventory data
      if (inventoryResponse.data && inventoryResponse.data.success) {
        const formattedInventory = {
          inventory_status: {
            current_quantity: inventoryResponse.data.data.current_quantity || 0,
            inventory_value: (inventoryResponse.data.data.current_quantity * product.unitPrice).toFixed(2),
            is_in_stock: inventoryResponse.data.data.current_quantity > 0
          },
          recent_movements: inventoryResponse.data.data.movements || []
        };
        
        setInventory(formattedInventory);
      }
      
      // Reset form and close modal
      setStockFormData({
        quantity: 1,
        unitPrice: product.unit_price,
        reason: ''
      });
      setShowSaleModal(false);
    } catch (err) {
      console.error('Error recording sale:', err);
      alert('Failed to record sale. Please try again.');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/product/update/${id}`, editFormData);
      
      // Refresh product data
      const productResponse = await api.get(`/product/get_by_id/${id}`);
      setProduct(productResponse.data);
      
      // Close modal
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Failed to update product. Please try again.');
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await api.delete(`/product/delete/${id}`);
      navigate('/products');
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product. Please try again.');
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStockFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) : 
              name === 'unit_price' ? parseFloat(value) : 
              value
    }));
  };
  
  // Add this function to handle input changes in the edit form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'unit_price' ? parseFloat(value) : value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <Link to="/products" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
          Back to Products
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>Product not found</p>
        <Link to="/products" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
          Back to Products
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
              <Link to="/products" className="ml-1 text-gray-700 hover:text-indigo-600 md:ml-2">Products</Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="ml-1 text-gray-500 md:ml-2 font-medium">Product Details</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Product Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
        {/* <div className="flex space-x-2 mt-4 sm:mt-0">
          <button 
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Edit
          </button>
          <button 
            onClick={() => setDeleteConfirmation(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete
          </button>
        </div> */}
      </div>

      {/* Product Details and Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Product Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">SKU</p>
              <p className="mt-1">{product.sku}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Category</p>
              <p className="mt-1">{product.category}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Unit Price</p>
              <p className="mt-1">${parseFloat(product.unit_price).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="mt-1">{new Date(product.created_at).toLocaleDateString()}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="mt-1">{product.description || "No description provided."}</p>
            </div>
          </div>
        </div>

        {/* Inventory Summary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Inventory Status</h2>
          {inventory ? (
            <>
              <div className="mb-4">
                <div className={`text-center p-4 rounded-lg ${inventory.inventory_status.current_quantity <= 0 ? 'bg-red-100' : inventory.inventory_status.current_quantity <= 10 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                  <p className="text-sm font-medium text-gray-500">Current Stock</p>
                  <p className={`text-3xl font-bold ${inventory.inventory_status.current_quantity <= 0 ? 'text-red-600' : inventory.inventory_status.current_quantity <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {inventory.inventory_status.current_quantity}
                  </p>
                  <p className="text-sm mt-1">
                    {inventory.inventory_status.current_quantity <= 0 
                      ? 'Out of Stock!' 
                      : inventory.inventory_status.current_quantity <= 10 
                        ? 'Low Stock' 
                        : 'In Stock'}
                  </p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500">Inventory Value</p>
                <p className="text-xl font-semibold text-gray-800">${parseFloat(inventory.inventory_status.inventory_value).toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <button 
                  onClick={() => setShowAddStockModal(true)}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add Stock
                </button>
                <button 
                  onClick={() => setShowSaleModal(true)}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  disabled={!inventory.inventory_status.is_in_stock}
                >
                  <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  Record Sale
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-500">Loading inventory data...</p>
          )}
        </div>
      </div>

      {/* Stock Movement History */}
      {inventory && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Stock Movement History</h2>
          
          {inventory.recent_movements.length === 0 ? (
            <p className="text-gray-500">No stock movements recorded yet.</p>
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
                        ${parseFloat(movement.unit_price).toFixed(2)}
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
      )}

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
                      <input
                        type="number"
                        id="unit_price"
                        name="unit_price"
                        step="0.01"
                        min="0"
                        value={stockFormData.unit_price}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
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
                      <input
                        type="number"
                        id="unit_price"
                        name="unit_price"
                        step="0.01"
                        min="0"
                        value={stockFormData.unit_price}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
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
                        placeholder="e.g., Order #12345"
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

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Product</h3>
                <form onSubmit={handleEdit}>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={editFormData.name}
                        onChange={handleEditInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU</label>
                        <input
                          type="text"
                          id="sku"
                          name="sku"
                          value={editFormData.sku}
                          onChange={handleEditInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                        <input
                          type="text"
                          id="category"
                          name="category"
                          value={editFormData.category}
                          onChange={handleEditInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
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
                          value={editFormData.unit_price}
                          onChange={handleEditInputChange}
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        rows="4"
                        value={editFormData.description}
                        onChange={handleEditInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
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
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Product
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this product? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;