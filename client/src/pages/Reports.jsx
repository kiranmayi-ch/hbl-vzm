import { useState, useEffect } from 'react';
import api from '../api/client';
import { formatDate } from '../utils/formatters';
import { FileText } from 'lucide-react';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMonths(); }, []);
  useEffect(() => { if (selectedMonth) loadReports(); }, [selectedMonth, statusFilter]);

  async function loadMonths() {
    const data = await api.get('/months');
    setMonths(data.months);
    const current = data.months.find(m => m.month === 6 && m.year === 2026) || data.months[0];
    if (current) setSelectedMonth(String(current.id));
  }

  async function loadReports() {
    setLoading(true);
    let url = `/reports?month_id=${selectedMonth}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    const data = await api.get(url);
    setReports(data.reports);
    setLoading(false);
  }

  return (
    <div className="page-content">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Monthly report listing with status tracking</p>
        </div>
        <div className="flex gap-3">
          <select className="form-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {months.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : (
        <div className="glass-card-static overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Section</th>
                <th>Month</th>
                <th>Status</th>
                <th>Updated By</th>
                <th>Updated At</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r, idx) => (
                <tr key={r.id}>
                  <td className="text-tertiary">{idx + 1}</td>
                  <td>
                    <span className="font-semibold text-sm">{r.section_code}</span>
                    <p className="text-xs text-tertiary">{r.section_name}</p>
                  </td>
                  <td>{r.month_label}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  <td className="text-sm">{r.updated_by_name || '—'}</td>
                  <td className="text-xs text-secondary">{formatDate(r.updated_at)}</td>
                  <td className="text-xs text-secondary">{r.submitted_at ? formatDate(r.submitted_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
