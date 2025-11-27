import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({
  children,
  requireRole = [],
  requireAuth = true
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#7f8c8d'
      }}>
        Loading...
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    // Redirect to login with the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is authenticated when no auth is required (for login/register pages)
  if (!requireAuth && user) {
    // Redirect to home/dashboard if already authenticated
    return <Navigate to="/" replace />;
  }

  // Check role authorization if required
  if (requireRole?.length > 0 && user) {
    const hasRequiredRole = requireRole.includes(user.role);
    if (!hasRequiredRole) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '1rem' }}>
            Access Denied
          </h2>
          <p style={{ color: '#7f8c8d', marginBottom: '2rem' }}>
            You don't have permission to access this page. Required role(s): {requireRole.join(', ')}
          </p>
          <p style={{ color: '#3498db' }}>
            Your current role: <span style={{ fontWeight: 'bold' }}>{user.role}</span>
          </p>
          <p style={{ color: '#7f8c8d', marginTop: '1rem' }}>
            Contact your administrator if you need additional permissions.
          </p>
        </div>
      );
    }
  }

  // Render the protected component
  return children;
};

// Convenience components for different roles
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requireRole={['admin']}>{children}</ProtectedRoute>
);

export const DoctorRoute = ({ children }) => (
  <ProtectedRoute requireRole={['doctor', 'admin']}>{children}</ProtectedRoute>
);

export const NurseRoute = ({ children }) => (
  <ProtectedRoute requireRole={['doctor', 'nurse', 'admin']}>{children}</ProtectedRoute>
);

export const StaffRoute = ({ children }) => (
  <ProtectedRoute requireRole={['doctor', 'nurse', 'admin', 'receptionist']}>{children}</ProtectedRoute>
);

export default ProtectedRoute;
