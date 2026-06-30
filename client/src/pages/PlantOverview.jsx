import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { formatPercent } from '../utils/formatters';
import { Globe, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function PlantOverview() {
  const [data, setData] = useState(null);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) loadData();
  }, [selectedMonth]);

  async function loadMonths() {
    const mData = await api.get('/months');
    setMonths(mData.months);
    const current = mData.months.find(m => m.month === 6 && m.year === 2026) || mData.months[0];
    if (current) setSelectedMonth(String(current.id));
  }

  async function loadData() {
    setLoading(true);
    try {
      const reports = await api.get(`/reports?month_id=${selectedMonth}`);
      const sectionData = [];

      for (const r of reports.reports) {
        const detail = await api.get(`/reports/${r.id}`);
        sectionData.push({
          ...r,
          modules: detail.modules
        });
      }
      setData(sectionData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="page-content"><div className="loading-overlay"><div className="spinner" /></div></div>;
  }

  return (
    <div className="page-content">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Plant Overview</h1>
          <p className="page-subtitle">Section-wise performance at a glance</p>
        </div>
        <select className="form-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          {months.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      {/* Summary Bar */}
      <div className="stats-grid mb-6" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
        <div className="stat-card glass-card p-4">
          <div className="stat-card-icon" style={{background:'rgba(16,185,129,0.15)', color:'#10b981', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8}}>
            <CheckCircle size={18} />
          </div>
          <div className="stat-card-value text-success">{data?.filter(s => s.status === 'submitted').length || 0}</div>
          <div className="stat-card-label">Submitted</div>
        </div>
        <div className="stat-card glass-card p-4">
          <div className="stat-card-icon" style={{background:'rgba(245,158,11,0.15)', color:'#f59e0b', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8}}>
            <Clock size={18} />
          </div>
          <div className="stat-card-value text-warning">{data?.filter(s => s.status === 'draft').length || 0}</div>
          <div className="stat-card-label">Draft</div>
        </div>
        <div className="stat-card glass-card p-4">
          <div className="stat-card-icon" style={{background:'rgba(239,68,68,0.15)', color:'#ef4444', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8}}>
            <AlertTriangle size={18} />
          </div>
          <div className="stat-card-value text-danger">{data?.filter(s => s.status !== 'submitted').length || 0}</div>
          <div className="stat-card-label">Pending</div>
        </div>
      </div>

      {/* Section Cards */}
      <div className="section-grid">
        {(data || []).map((section, idx) => {
          const m5s = section.modules?.module_5s;
          const mam = section.modules?.module_am;
          const mk = section.modules?.module_kaizens;
          const mabn = section.modules?.module_abnormalities;

          return (
            <div
              key={section.id}
              className="glass-card p-4 cursor-pointer animate-fade-in-up"
              style={{animationDelay:`${idx * 0.04}s`, borderLeft: `3px solid ${section.status === 'submitted' ? '#10b981' : '#f59e0b'}`}}
              onClick={() => navigate(`/my-section?section=${section.section_id}&month=${selectedMonth}`)}
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="font-semibold text-md">{section.section_code}</span>
                  <p className="text-xs text-secondary">{section.section_name}</p>
                </div>
                <span className={`badge badge-${section.status}`}>{section.status}</span>
              </div>

              <div className="grid grid-2 gap-3">
                <div>
                  <span className="text-xs text-tertiary">5S Score</span>
                  <p className="font-semibold" style={{color: m5s?.audit_score >= 4 ? '#10b981' : m5s?.audit_score >= 3 ? '#f59e0b' : '#ef4444'}}>
                    {m5s?.audit_score ?? '—'}<span className="text-xs text-tertiary">/5</span>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-tertiary">AM Closure</span>
                  <p className="font-semibold text-cyan">{formatPercent(mam?.closure_pct)}</p>
                </div>
                <div>
                  <span className="text-xs text-tertiary">Kaizens</span>
                  <p className="font-semibold text-success">{(mk?.submitted || 0) + (mk?.approved || 0) + (mk?.implemented || 0)}</p>
                </div>
                <div>
                  <span className="text-xs text-tertiary">Abnormalities</span>
                  <p className="font-semibold" style={{color: (mabn?.repeated || 0) > 0 ? '#ef4444' : '#f97316'}}>{mabn?.total || 0}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
