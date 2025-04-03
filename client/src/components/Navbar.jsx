import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-indigo-600 text-white">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Bazaar</Link>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {user?.isAdmin && (
                <Link to="/admin/dashboard" className="hover:text-indigo-200">Admin</Link>
              )}
              <Link to="/dashboard" className="hover:text-indigo-200">Dashboard</Link>
              <Link to="/products" className="hover:text-indigo-200">Products</Link>
              <Link to="/inventory" className="hover:text-indigo-200">Inventory</Link>
              <Link to="/stock" className="hover:text-indigo-200">Stock</Link>
              
              <div className="relative group ml-4">
                <button className="flex items-center hover:text-indigo-200">
                  <span className="mr-1">{user?.username || 'User'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button 
                    onClick={handleLogout} 
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Logout
                  </button>

              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-indigo-200">Login</Link>
              <Link to="/register" className="hover:text-indigo-200">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;