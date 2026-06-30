import { useState, useEffect } from 'react';
import api from '../api/client';
import { formatPercent, formatCurrency, formatDate } from '../utils/formatters';
import { List, Download } from 'lucide-react';

export default function AllSections() {
  const [reports, setReports] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [sectionData, setSectionData] = useState([]);

  useEffect(() => { loadMonths(); }, []);
  useEffect(() => { if (selectedMonth) loadData(); }, [selectedMonth]);

  async function loadMonths() {
    const mData = await api.get('/months');
    setMonths(mData.months);
    const current = mData.months.find(m => m.month === 6 && m.year === 2026) || mData.months[0];
    if (current) setSelectedMonth(String(current.id));
  }

  async function loadData() {
    setLoading(true);
    try {
      const rData = await api.get(`/reports?month_id=${selectedMonth}`);
      const enriched = [];
      for (const r of rData.reports) {
        const detail = await api.get(`/reports/${r.id}`);
        enriched.push({ ...r, modules: detail.modules });
      }
      setSectionData(enriched);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="page-content"><div className="loading-overlay"><div className="spinner" /></div></div>;

  return (
    <div className="page-content">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">All Sections</h1>
          <p className="page-subtitle">Comprehensive section-wise data table</p>
        </div>
        <select className="form-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          {months.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      <div className="glass-card-static overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Status</th>
              <th>5S</th>
              <th>AM %</th>
              <th>Abnormalities</th>
              <th>Repeated</th>
              <th>Kaizens</th>
              <th>Savings</th>
              <th>Lean %</th>
              <th>ISO</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {sectionData.map(section => {
              const m5s = section.modules?.module_5s;
              const mam = section.modules?.module_am;
              const mabn = section.modules?.module_abnormalities;
              const mk = section.modules?.module_kaizens;
              const ml = section.modules?.module_lean_projects;
              const miso = section.modules?.module_iso;

              return (
                <tr key={section.id}>
                  <td>
                    <div>
                      <span className="font-semibold text-sm">{section.section_code}</span>
                      <p className="text-xs text-tertiary">{section.section_name}</p>
                    </div>
                  </td>
                  <td><span className={`badge badge-${section.status}`}>{section.status}</span></td>
                  <td style={{color: (m5s?.audit_score || 0) >= 4 ? '#10b981' : '#f59e0b'}}>{m5s?.audit_score ?? '—'}</td>
                  <td>{formatPercent(mam?.closure_pct)}</td>
                  <td>{mabn?.total || 0}</td>
                  <td style={{color: (mabn?.repeated || 0) > 0 ? '#ef4444' : 'inherit'}}>{mabn?.repeated || 0}</td>
                  <td>{(mk?.submitted || 0) + (mk?.approved || 0) + (mk?.implemented || 0)}</td>
                  <td>{formatCurrency(mk?.savings)}</td>
                  <td>{formatPercent(ml?.completion_pct)}</td>
                  <td>{miso?.qms_status || '—'}</td>
                  <td className="text-xs text-secondary">{formatDate(section.updated_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
