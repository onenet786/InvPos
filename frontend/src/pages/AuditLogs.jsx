import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => { fetchLogs(); }, [page, actionFilter, entityFilter]);

  const fetchLogs = async () => {
    const params = { page, limit: 30 };
    if (actionFilter) params.action = actionFilter;
    if (entityFilter) params.entityType = entityFilter;
    const { data } = await api.get('/audit-logs', { params });
    setLogs(data.data);
    setPagination(data.pagination);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>

      <div className="flex gap-4 mb-4">
        <input type="text" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="input max-w-xs" placeholder="Filter by action..." />
        <input type="text" value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }} className="input max-w-xs" placeholder="Filter by entity type..." />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Timestamp</th>
              <th className="table-header">User</th>
              <th className="table-header">Action</th>
              <th className="table-header">Entity</th>
              <th className="table-header">Entity ID</th>
              <th className="table-header">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="table-cell text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="table-cell">{log.User?.username || 'System'}</td>
                <td className="table-cell"><span className="badge bg-gray-100 text-gray-700">{log.action}</span></td>
                <td className="table-cell">{log.entityType}</td>
                <td className="table-cell">{log.entityId}</td>
                <td className="table-cell text-xs text-gray-500">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Page {pagination.currentPage} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="btn-secondary">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
