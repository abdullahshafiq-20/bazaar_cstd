import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminDashboard = () => {
  const [managers, setManagers] = useState([]);
  const [assignedStores, setAssignedStores] = useState([]);
  const [unassignedStores, setUnassignedStores] = useState([]);
  const [activeTab, setActiveTab] = useState('managers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Store form state
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeFormData, setStoreFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    is_active: true
  });
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [storeActionLoading, setStoreActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  
  // Product form state
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    unit_price: ''
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [productActionLoading, setProductActionLoading] = useState(false);
  const [showProductDeleteConfirm, setShowProductDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Add these state handlers for manager registration
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [managerFormData, setManagerFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    is_active: true
  });
  const [managerActionLoading, setManagerActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const managersResponse = await api.get('/admin/managers');
        setManagers(managersResponse.data.data);
        
        const assignedStoresResponse = await api.get('/admin/stores/assigned');
        setAssignedStores(assignedStoresResponse.data.data);
        
        const unassignedStoresResponse = await api.get('/admin/stores/unassigned');
        setUnassignedStores(unassignedStoresResponse.data.data);
        
        const productsResponse = await api.get('/product/get');
        setProducts(productsResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refreshData = async () => {
    try {
      const managersResponse = await api.get('/admin/managers');
      setManagers(managersResponse.data.data);
      
      const assignedStoresResponse = await api.get('/admin/stores/assigned');
      setAssignedStores(assignedStoresResponse.data.data);
      
      const unassignedStoresResponse = await api.get('/admin/stores/unassigned');
      setUnassignedStores(unassignedStoresResponse.data.data);

      const productsResponse = await api.get('/product/get');
      setProducts(productsResponse.data);
      
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again later.');
    }
  };

  const handleStoreFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStoreFormData({
      ...storeFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const openStoreModal = (store = null) => {
    if (store) {
      // Edit mode
      setStoreFormData({
        name: store.name,
        address: store.address,
        phone: store.phone,
        email: store.email,
        is_active: store.is_active
      });
      setEditingStoreId(store.store_id);
    } else {
      // Create mode
      setStoreFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        is_active: true
      });
      setEditingStoreId(null);
    }
    setShowStoreModal(true);
  };

  const closeStoreModal = () => {
    setShowStoreModal(false);
    setEditingStoreId(null);
    setStoreFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      is_active: true
    });
  };

  const handleSubmitStore = async (e) => {
    e.preventDefault();
    
    try {
      setStoreActionLoading(true);
      setError(null);
      
      if (editingStoreId) {
        // Update existing store
        await api.put(`/stores/${editingStoreId}`, storeFormData);
        setSuccessMessage('Store updated successfully');
      } else {
        // Create new store
        await api.post('/stores', storeFormData);
        setSuccessMessage('Store created successfully');
      }
      
      // Refresh data
      await refreshData();
      
      // Close modal
      closeStoreModal();
      
      // Clear success message after a delay
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save store');
    } finally {
      setStoreActionLoading(false);
    }
  };

  const openDeleteConfirm = (store) => {
    setStoreToDelete(store);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setStoreToDelete(null);
  };

  const handleDeleteStore = async () => {
    if (!storeToDelete) return;
    
    try {
      setStoreActionLoading(true);
      setError(null);
      
      await api.delete(`/stores/${storeToDelete.store_id}`);
      
      // Refresh data
      await refreshData();
      
      setSuccessMessage('Store deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Close modal
      closeDeleteConfirm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete store');
    } finally {
      setStoreActionLoading(false);
    }
  };

  const handleAssignStore = async () => {
    if (!selectedManager || !selectedStore) {
      setError('Please select both a manager and a store');
      return;
    }

    try {
      setAssignmentLoading(true);
      setError(null);
      
      await api.post('/admin/assignments', {
        userId: selectedManager,
        storeId: selectedStore
      });

      // Refresh data
      await refreshData();
      
      setSuccessMessage('Store successfully assigned to manager');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reset selections
      setSelectedManager(null);
      setSelectedStore(null);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign store to manager');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleRemoveAssignment = async (userId, storeId) => {
    try {
      setAssignmentLoading(true);
      setError(null);
      
      await api.delete(`/admin/assignments/${userId}/${storeId}`);

      // Refresh data
      await refreshData();
      
      setSuccessMessage('Store assignment removed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove store assignment');
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Add these product-related handler functions
  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductFormData({
      ...productFormData,
      [name]: value
    });
  };

  const openProductModal = (product = null) => {
    if (product) {
      // Edit mode
      setProductFormData({
        name: product.name,
        description: product.description,
        sku: product.sku,
        category: product.category,
        unit_price: product.unit_price
      });
      setEditingProductId(product.product_id);
    } else {
      // Create mode
      setProductFormData({
        name: '',
        description: '',
        sku: '',
        category: '',
        unit_price: ''
      });
      setEditingProductId(null);
    }
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProductId(null);
    setProductFormData({
      name: '',
      description: '',
      sku: '',
      category: '',
      unit_price: ''
    });
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    
    try {
      setProductActionLoading(true);
      setError(null);
      
      if (editingProductId) {
        // Update existing product
        await api.put(`/product/update/${editingProductId}`, productFormData);
        setSuccessMessage('Product updated successfully');
      } else {
        // Create new product
        await api.post('/product/create', productFormData);
        setSuccessMessage('Product created successfully');
      }
      
      // Use refreshData instead of refreshProducts
      await refreshData();
      
      // Close modal
      closeProductModal();
      
      // Clear success message after a delay
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setProductActionLoading(false);
    }
  };

  const openProductDeleteConfirm = (product) => {
    setProductToDelete(product);
    setShowProductDeleteConfirm(true);
  };

  const closeProductDeleteConfirm = () => {
    setShowProductDeleteConfirm(false);
    setProductToDelete(null);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      setProductActionLoading(true);
      setError(null);
      
      await api.delete(`/product/delete/${productToDelete.product_id}`);
      
      // Use refreshData instead of refreshProducts
      await refreshData();
      
      setSuccessMessage('Product deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Close modal
      closeProductDeleteConfirm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setProductActionLoading(false);
    }
  };

  // Add these manager-related handler functions
  const handleManagerFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setManagerFormData({
      ...managerFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const openManagerModal = () => {
    setManagerFormData({
      full_name: '',
      username: '',
      email: '',
      password: ''
      // is_active: true
    });
    setShowManagerModal(true);
  };

  const closeManagerModal = () => {
    setShowManagerModal(false);
    setManagerFormData({
      full_name: '',
      username: '',
      email: '',
      password: ''
      // is_active: true
    });
  };

  const handleSubmitManager = async (e) => {
    e.preventDefault();
    
    try {
      setManagerActionLoading(true);
      setError(null);
      
      // Register new manager
      await api.post('/auth/register', managerFormData);
      setSuccessMessage('Manager registered successfully');
      
      // Refresh data
      await refreshData();
      
      // Close modal
      closeManagerModal();
      
      // Clear success message after a delay
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register manager');
    } finally {
      setManagerActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'products'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Products
        </button>
          <button
            onClick={() => setActiveTab('managers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'managers'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Store Managers
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stores'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Stores Management
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assignments'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Store Assignments
          </button>
        </nav>
      </div>

      {/* Products Tab Content - Add this new section */}
      {activeTab === 'products' && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Products</h2>
            <button 
              onClick={() => openProductModal()}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Add New Product
            </button>
          </div>
          
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.product_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.product_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{product.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${parseFloat(product.unit_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => openProductModal(product)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => openProductDeleteConfirm(product)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Managers Tab Content */}
      {activeTab === 'managers' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Store Managers</h2>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Managed Stores
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {managers.length > 0 ? (
                  managers.map((manager) => (
                    <tr key={manager.user_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {manager.user_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{manager.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{manager.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{manager.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${manager.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {manager.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {manager.store_names ? (
                          <ul>
                            {manager.store_names.map((store, index) => (
                              <li key={index} className="mb-1">{store}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400">No stores assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No managers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Stores Tab Content */}
      {activeTab === 'stores' && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Stores</h2>
            <button 
              onClick={() => openStoreModal()}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Add New Store
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assigned Stores */}
            <div>
              <h3 className="text-lg font-medium mb-3">Assigned Stores</h3>
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignedStores.length > 0 ? (
                      assignedStores.map((store) => (
                        <tr key={store.store_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {store.store_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{store.name}</div>
                            <div className="text-sm text-gray-500">{store.address}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${store.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {store.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => openStoreModal(store)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => openDeleteConfirm(store)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                          No assigned stores found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Unassigned Stores */}
            <div>
              <h3 className="text-lg font-medium mb-3">Unassigned Stores</h3>
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unassignedStores.length > 0 ? (
                      unassignedStores.map((store) => (
                        <tr key={store.store_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {store.store_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{store.name}</div>
                            <div className="text-sm text-gray-500">{store.address}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${store.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {store.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => openStoreModal(store)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => openDeleteConfirm(store)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                          No unassigned stores found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Assignments Tab Content */}
      {activeTab === 'assignments' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Assign Stores to Managers</h2>
          
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Manager
                </label>
                <select
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={selectedManager || ''}
                  onChange={(e) => setSelectedManager(Number(e.target.value))}
                >
                  <option value="">Select a manager</option>
                  {managers.map((manager) => (
                    <option key={manager.user_id} value={manager.user_id}>
                      {manager.full_name} ({manager.username})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Unassigned Store
                </label>
                <select
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={selectedStore || ''}
                  onChange={(e) => setSelectedStore(Number(e.target.value))}
                >
                  <option value="">Select a store</option>
                  {unassignedStores.map((store) => (
                    <option key={store.store_id} value={store.store_id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleAssignStore}
                  disabled={assignmentLoading || !selectedManager || !selectedStore}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {assignmentLoading ? 'Assigning...' : 'Assign Store to Manager'}
                </button>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-3">Current Assignments</h3>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {managers.some(manager => manager.store_names && manager.store_names.length > 0) ? (
                  managers.flatMap((manager) => 
                    manager.store_names && manager.managed_stores 
                      ? manager.store_names.map((storeName, index) => (
                          <tr key={`${manager.user_id}-${manager.managed_stores[index]}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{manager.full_name}</div>
                              <div className="text-sm text-gray-500">{manager.username}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{storeName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => handleRemoveAssignment(manager.user_id, manager.managed_stores[index])} 
                                disabled={assignmentLoading}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                {assignmentLoading ? 'Removing...' : 'Remove Assignment'}
                              </button>
                            </td>
                          </tr>
                        ))
                      : []
                  )
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                      No store assignments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Add New Manager</h2>
          <p className="text-gray-600 mb-4">Create a new store manager account</p>
          <button 
            onClick={openManagerModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Add Manager
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Manage Stores</h2>
          <p className="text-gray-600 mb-4">Assign managers to stores</p>
          <button 
            onClick={() => setActiveTab('stores')}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            View Stores
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">System Settings</h2>
          <p className="text-gray-600 mb-4">Configure system-wide settings</p>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            Settings
          </button>
        </div>
      </div>
      {/* Product Form Modal - Add this new modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingProductId ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button 
                onClick={closeProductModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmitProduct}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={productFormData.name}
                  onChange={handleProductFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={productFormData.description}
                  onChange={handleProductFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={productFormData.sku}
                  onChange={handleProductFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={productFormData.category}
                  onChange={handleProductFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={productFormData.unit_price}
                  onChange={handleProductFormChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productActionLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {productActionLoading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Product Delete Confirmation Modal - Add this new modal */}
      {showProductDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Product</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete the product "{productToDelete?.name}"? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={closeProductDeleteConfirm}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={productActionLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {productActionLoading ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Store Form Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingStoreId ? 'Edit Store' : 'Add New Store'}
              </h3>
              <button 
                onClick={closeStoreModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmitStore}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={storeFormData.name}
                  onChange={handleStoreFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={storeFormData.address}
                  onChange={handleStoreFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={storeFormData.phone}
                  onChange={handleStoreFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={storeFormData.email}
                  onChange={handleStoreFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={storeFormData.is_active}
                    onChange={handleStoreFormChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeStoreModal}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={storeActionLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {storeActionLoading ? 'Saving...' : 'Save Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Store</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete the store "{storeToDelete?.name}"? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStore}
                disabled={storeActionLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {storeActionLoading ? 'Deleting...' : 'Delete Store'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Manager Form Modal */}
      {showManagerModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Add New Manager
              </h3>
              <button 
                onClick={closeManagerModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmitManager}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={managerFormData.full_name}
                  onChange={handleManagerFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={managerFormData.username}
                  onChange={handleManagerFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={managerFormData.email}
                  onChange={handleManagerFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={managerFormData.password}
                  onChange={handleManagerFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={managerFormData.is_active}
                    onChange={handleManagerFormChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeManagerModal}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={managerActionLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {managerActionLoading ? 'Saving...' : 'Save Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;