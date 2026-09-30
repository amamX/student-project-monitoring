import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Not logged in
  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Role checking
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // If logged in but wrong role, send them to their own dashboard
    return <Navigate to={profile.role === 'dosen' ? '/dashboard-dosen' : '/dashboard-mahasiswa'} replace />;
  }

  return <Outlet />;
};
