import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="bg-indigo-600 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="text-white font-bold text-xl">Bazaar</Link>
          </div>
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              to="/" 
              className={`py-2 px-3 text-sm font-medium rounded-md ${
                isActive('/') 
                  ? 'bg-indigo-700 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/products" 
              className={`py-2 px-3 text-sm font-medium rounded-md ${
                isActive('/products') 
                  ? 'bg-indigo-700 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
              }`}
            >
              Products
            </Link>
            <Link 
              to="/stock" 
              className={`py-2 px-3 text-sm font-medium rounded-md ${
                isActive('/stock') 
                  ? 'bg-indigo-700 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
              }`}
            >
              Stock
            </Link>
            <Link 
              to="/inventory" 
              className={`py-2 px-3 text-sm font-medium rounded-md ${
                isActive('/inventory') 
                  ? 'bg-indigo-700 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
              }`}
            >
              Inventory
            </Link>
            <Link 
              to="/inventory/alerts" 
              className={`py-2 px-3 text-sm font-medium rounded-md ${
                isActive('/inventory/alerts') 
                  ? 'bg-indigo-700 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
              }`}
            >
              Alerts
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;