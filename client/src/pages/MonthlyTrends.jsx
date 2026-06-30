import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api from '../api/client';
import { TrendingUp } from 'lucide-react';

const METRICS = [
  { key: '5s', label: '5S Score', color: '#f59e0b' },
  { key: 'am_closure', label: 'AM Closure %', color: '#06b6d4' },
  { key: 'kaizens', label: 'Kaizens', color: '#10b981' },
  { key: 'abnormalities', label: 'Abnormalities', color: '#f97316' },
  { key: 'repeated_abnormalities', label: 'Repeated Abnormalities', color: '#ef4444' },
  { key: 'iso', label: 'ISO Progress', color: '#8b5cf6' },
  { key: 'lean_completion', label: 'Lean Completion %', color: '#3b82f6' },
  { key: 'process_closure', label: 'Process Closure %', color: '#14b8a6' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#0f1520',border:'1px solid rgba(148,163,184,0.15)',borderRadius:8,padding:'12px',boxShadow:'0 8px 24px rgba(0,0,0,0.4)'}}>
      <p style={{fontSize:11,color:'#94a3b8',marginBottom:4}}>{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{fontSize:13,fontWeight:600,color:e.color}}>{e.name}: {e.value ?? 'N/A'}</p>
      ))}
    </div>
  );
};

export default function MonthlyTrends() {
  const [trends, setTrends] = useState({});
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSections();
    loadTrends();
  }, []);

  useEffect(() => {
    loadTrends();
  }, [selectedSection]);

  async function loadSections() {
    const data = await api.get('/sections');
    setSections(data.sections);
  }

  async function loadTrends() {
    setLoading(true);
    const results = {};
    for (const m of METRICS) {
      const url = selectedSection ? `/trends/${m.key}?section_id=${selectedSection}` : `/trends/${m.key}`;
      const data = await api.get(url);
      results[m.key] = data.trends;
    }
    setTrends(results);
    setLoading(false);
  }

  return (
    <div className="page-content">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Monthly Trends</h1>
          <p className="page-subtitle">Historical performance analysis</p>
        </div>
        <div className="flex gap-3">
          <select className="form-select" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
            <option value="">All Sections (Plant Average)</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : (
        <div className="charts-grid">
          {METRICS.map(metric => (
            <div key={metric.key} className="glass-card-static" style={{overflow:'hidden'}}>
              <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(148,163,184,0.08)'}}>
                <h3 className="text-sm font-semibold">{metric.label} Trend</h3>
              </div>
              <div style={{padding:'16px'}}>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={trends[metric.key] || []}>
                    <defs>
                      <linearGradient id={`grad-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                    <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" stroke={metric.color} fill={`url(#grad-${metric.key})`} strokeWidth={2} name={metric.label} dot={{r:4, fill:metric.color}} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
