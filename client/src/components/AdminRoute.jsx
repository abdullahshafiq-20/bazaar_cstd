import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminRoute = () => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return isAuthenticated && user?.isAdmin ? (
    <Outlet />
  ) : (
    <Navigate to="/login" />
  );
};

export default AdminRoute;