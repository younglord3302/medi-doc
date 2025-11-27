import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './AdminAuditLogsPage.css';

const AdminAuditLogsPage = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    userId: '',
    targetType: '',
    action: '',
    from: '',
    to: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });

  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    pages: 0,
  });

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };

      // Filter out empty values
      const cleanParams = Object.keys(params).reduce((acc, key) => {
        if (params[key] !== '') {
          acc[key] = params[key];
        }
        return acc;
      }, {});

      const response = await api.get('/audits', { params: cleanParams });

      setAuditLogs(response.data?.data || []);
      setPaginationInfo(response.data?.pagination || { total: 0, pages: 0 });
      setError('');
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load audit logs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAuditLogs();
    }
  }, [user, filters, pagination, fetchAuditLogs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getActionClass = (action) => {
    if (action.includes('CREATE')) return 'action-create';
    if (action.includes('UPDATE')) return 'action-update';
    if (action.includes('DELETE') || action.includes('CANCEL')) return 'action-delete';
    if (action === 'LOGIN_SUCCESS') return 'action-login-success';
    if (action === 'LOGIN_FAILED') return 'action-login-failed';
    return 'action-default';
  };

  const formatMetaSummary = (meta) => {
    if (!meta) return 'No additional details';
    const parts = [];
    if (meta.patientId) parts.push(`Patient: ${meta.patientId}`);
    if (meta.doctorId) parts.push(`Doctor: ${meta.doctorId}`);
    return parts.join(', ');
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      targetType: '',
      action: '',
      from: '',
      to: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (user?.role !== 'admin') {
    return (
      <div className="access-denied">
        <div className="access-denied-card">
          <div className="access-denied-icon">🚫</div>
          <h1 className="access-denied-title">Access Denied</h1>
          <p className="access-denied-text">
            Only administrators can access audit logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-logs-page">
      {/* Header Section */}
      <div className="audit-header">
        <div className="audit-header-content">
          <h1 className="audit-title">Audit Logs</h1>
          <p className="audit-subtitle">
            Monitor and review all system activities, data modifications, and security events
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">User ID</label>
            <input
              type="text"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              className="filter-input"
              placeholder="Filter by user ID"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Action</label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Actions</option>
              <option value="PATIENT_CREATE">Patient Create</option>
              <option value="PATIENT_UPDATE">Patient Update</option>
              <option value="PATIENT_DELETE">Patient Delete</option>
              <option value="RECORD_CREATE">Record Create</option>
              <option value="RECORD_UPDATE">Record Update</option>
              <option value="RECORD_DELETE">Record Delete</option>
              <option value="APPOINTMENT_CREATE">Appointment Create</option>
              <option value="APPOINTMENT_UPDATE">Appointment Update</option>
              <option value="APPOINTMENT_CANCEL">Appointment Cancel</option>
              <option value="LOGIN_SUCCESS">Login Success</option>
              <option value="LOGIN_FAILED">Login Failed</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Target Type</label>
            <select
              name="targetType"
              value={filters.targetType}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="patient">Patient</option>
              <option value="record">Medical Record</option>
              <option value="appointment">Appointment</option>
              <option value="auth">Authentication</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">From Date</label>
            <input
              type="datetime-local"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">To Date</label>
            <input
              type="datetime-local"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>
        </div>

        <button onClick={clearFilters} className="clear-filters-btn">
          Clear Filters
        </button>
      </div>

      {/* Content Area */}
      <div className="audit-content">
        {error && (
          <div className="error-state">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading audit logs...</p>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No Audit Logs Found</h3>
            <p className="empty-state-text">
              No audit logs match your current filters. Try adjusting your search criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Target Type</th>
                    <th>Details</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id}>
                      <td>
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td>
                        {log.userId ? (
                          <div className="user-info">
                            <div className="user-name">
                              {log.userId.firstName} {log.userId.lastName}
                            </div>
                            <div className="user-email">{log.userId.email}</div>
                          </div>
                        ) : (
                          <span className="user-system">System</span>
                        )}
                      </td>
                      <td>
                        <span className={`action-badge ${getActionClass(log.action)}`}>
                          {log.action.replace('_', ' ').toLowerCase()}
                        </span>
                      </td>
                      <td>{log.targetType}</td>
                      <td className="meta-info">{formatMetaSummary(log.meta)}</td>
                      <td>{log.ipAddress || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {paginationInfo.pages > 1 && (
              <div className="pagination-section">
                <div className="pagination-info">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, paginationInfo.total)} of{' '}
                  {paginationInfo.total} results
                </div>
                <div className="pagination-controls">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>

                  {Array.from({ length: Math.min(5, paginationInfo.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`pagination-btn ${pagination.page === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === paginationInfo.pages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
