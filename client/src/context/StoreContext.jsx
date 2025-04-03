import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  console.log('StoreProvider rendering');
  
  const [currentStoreId, setCurrentStoreId] = useState(null);
  const [availableStores, setAvailableStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('StoreProvider useEffect triggered');
    
    const fetchUserStores = async () => {
      console.log('Fetching user stores...');
      try {
        setLoading(true);
        console.log('Making API call to /auth/profile');
        const response = await api.get('/auth/profile');
        console.log('Profile API response:', response.data);
        
        // Extract store IDs from user roles and filter out null values
        const storeIds = response.data.user.roles
          .filter(role => role.role === 'STORE_MANAGER' && role.store_id !== null)
          .map(role => role.store_id);
        
        console.log('Extracted valid store IDs:', storeIds);
        
        // Set available stores even if some were filtered out
        setAvailableStores(storeIds);
        
        // If we have valid stores, select the first one by default
        if (storeIds.length > 0) {
          console.log('Setting current store ID to:', storeIds[0]);
          setCurrentStoreId(storeIds[0]);
        } else {
          console.log('No valid store IDs found for user');
          setError('No valid stores associated with your account');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user stores:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response,
          request: err.request
        });
        setError('Failed to load store information');
        setLoading(false);
      }
    };

    fetchUserStores();
  }, []);

  const contextValue = {
    currentStoreId,
    availableStores,
    loading,
    error,
    selectStore: (storeId) => {
      console.log('Selecting store:', storeId);
      if (availableStores.includes(storeId)) {
        setCurrentStoreId(storeId);
        return true;
      }
      return false;
    }
  };
  
  console.log('StoreProvider context value:', contextValue);

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  console.log('useStore hook called');
  const context = useContext(StoreContext);
  if (!context) {
    console.error('useStore must be used within a StoreProvider');
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}