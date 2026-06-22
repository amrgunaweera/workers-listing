import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Spins while auth is resolving.
 */
function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );
}

/**
 * Requires any authenticated user.
 * Redirects unauthenticated visitors to /login.
 */
export function RequireAuth({ children }) {
  const { currentUser, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return <AuthLoading />;
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

/**
 * Requires the 'admin' role specifically.
 * Redirects non-admins to the home page.
 */
export function RequireAdmin({ children }) {
  const { currentUser, userRole, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return <AuthLoading />;
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  if (userRole !== 'admin') return <Navigate to="/" replace />;
  return children;
}
