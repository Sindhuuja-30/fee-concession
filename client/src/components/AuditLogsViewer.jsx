import { useState, useEffect } from 'react';
import API from '../api';

function AuditLogsViewer() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0,
    logsPerPage: 20
  });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (page = 1, action = 'all') => {
    setLoading(true);
    try {
      // API is an axios instance, so we use .get and relative URL
      const { data } = await API.get(`/audit-logs?page=${page}&limit=20&action=${action}`);

      setLogs(data.logs || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1 });
      setLoading(false);
    } catch (error) {
      console.error('Audit logs fetch error:', error);
      // Don't crash the UI, just show empty state or error
      setLogs([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, filter);
  }, [filter]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handlePageChange = (newPage) => {
    fetchLogs(newPage, filter);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'APPLICATION_SUBMITTED': return '📝';
      case 'APPLICATION_APPROVED': return '✅';
      case 'APPLICATION_REJECTED': return '❌';
      case 'APPLICATION_DELETED': return '🗑️';
      case 'AMOUNT_MODIFIED': return '💰';
      case 'STATUS_UPDATED': return '🔄';
      default: return '📋';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'APPLICATION_SUBMITTED': return '#2a3166';
      case 'APPLICATION_APPROVED': return '#cae7df';
      case 'APPLICATION_REJECTED': return '#ee7879';
      case 'APPLICATION_DELETED': return '#f4abaa';
      case 'AMOUNT_MODIFIED': return '#2a3166';
      case 'STATUS_UPDATED': return '#2a3166';
      default: return '#2a3166';
    }
  };

  return (
    <div className="audit-logs-container">
      <div className="audit-header">
        <h2 style={{ color: '#2a3166' }}>📜 Audit Trail</h2>
        <div className="filter-controls">
          <label htmlFor="action-filter" style={{ color: '#2a3166' }}>Filter by Action:</label>
          <select
            id="action-filter"
            value={filter}
            onChange={handleFilterChange}
            className="filter-select"
            style={{ background: '#f4abaa', color: '#2a3166', border: '1px solid #2a3166' }}
          >
            <option value="all">All Actions</option>
            <option value="APPLICATION_SUBMITTED">Submitted</option>
            <option value="APPLICATION_APPROVED">Approved</option>
            <option value="APPLICATION_REJECTED">Rejected</option>
            <option value="APPLICATION_DELETED">Deleted</option>
            <option value="AMOUNT_MODIFIED">Amount Modified</option>
            <option value="STATUS_UPDATED">Status Updated</option>
            <option value="pending">Pending Requests</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading" style={{ color: '#2a3166' }}>Loading audit logs...</div>
      ) : (
        <>
          <div className="logs-table-container" style={{ overflowX: 'auto', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <table className="table-modern">
              <thead style={{ background: '#2a3166' }}>
                <tr>
                  <th style={{ color: '#cae7df' }}>Time</th>
                  <th style={{ color: '#cae7df' }}>Action</th>
                  <th style={{ color: '#cae7df' }}>User</th>
                  <th style={{ color: '#cae7df' }}>Role</th>
                  <th style={{ color: '#cae7df' }}>Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-logs" style={{ color: '#2a3166' }}>No audit logs found</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: '1px solid #2a3166' }}>
                      <td className="timestamp" style={{ color: '#2a3166' }}>{formatDate(log.timestamp)}</td>
                      <td className="action">
                        <span
                          className="action-badge"
                          style={{
                            background: getActionColor(log.action),
                            color: log.action === 'APPLICATION_APPROVED' ? '#2a3166' :
                              log.action === 'APPLICATION_SUBMITTED' ? '#cae7df' : '#2a3166',
                            border: log.action === 'APPLICATION_APPROVED' ? '1px solid #2a3166' : 'none'
                          }}
                        >
                          {getActionIcon(log.action)} {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ color: '#2a3166', fontWeight: '600' }}>{log.userId?.name || 'Unknown'}</td>
                      <td className="role">
                        <span
                          className={`role-badge ${log.userRole}`}
                          style={{
                            background: log.userRole === 'admin' ? '#2a3166' : '#f4abaa',
                            color: log.userRole === 'admin' ? '#cae7df' : '#2a3166'
                          }}
                        >
                          {log.userRole}
                        </span>
                      </td>
                      <td className="message" style={{ color: '#2a3166' }}>{log.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="btn-view-navy"
                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
              >
                ← Previous
              </button>
              <span className="page-info" style={{ color: '#2a3166' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="btn-view-navy"
                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .audit-logs-container {
          background: #cae7df;
          border: 2px solid #2a3166;
          border-radius: 16px;
          padding: 2.5rem;
          margin-top: 2rem;
          box-shadow: 0 10px 30px rgba(42, 49, 102, 0.1);
        }

        .audit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .filter-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .filter-select {
          padding: 0.6rem 1rem;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
        }

        .logs-table-container {
          overflow-x: auto;
          margin-bottom: 1rem;
          border-radius: 12px;
          border: 1px solid #2a3166;
        }

        .logs-table {
          width: 100%;
          border-collapse: collapse;
          background: #cae7df;
        }

        .logs-table th {
          padding: 1.2rem 1rem;
          text-align: left;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .logs-table td {
          padding: 1rem;
        }

        .logs-table tbody tr:nth-child(even) {
          background: #f4abaa;
        }

        .logs-table tbody tr:hover {
          background: #ee7879;
        }

        .action-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 25px;
          font-weight: 800;
          font-size: 0.8rem;
          text-transform: uppercase;
        }

        .role-badge {
          display: inline-block;
          padding: 0.4rem 1rem;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: capitalize;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          margin-top: 2rem;
        }

        @media (max-width: 768px) {
          .audit-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .message {
            max-width: 150px;
          }
        }
      `}</style>
    </div>
  );
}

export default AuditLogsViewer;
