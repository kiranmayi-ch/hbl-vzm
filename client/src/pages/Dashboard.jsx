import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, Wrench, AlertTriangle, Lightbulb, TrendingUp, Award,
  Monitor, Cpu, Zap, CheckCircle, Clock, RefreshCw, BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import api from '../api/client';
import { formatPercent, formatNumber, formatCurrency } from '../utils/formatters';
import './Dashboard.css';

const CHART_COLORS = ['#f59e0b', '#06b6d4', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];

function StatCard({ icon: Icon, label, value, suffix, trend, color, delay, onClick }) {
  return (
    <div
      className={`stat-card glass-card animate-fade-in-up ${onClick ? 'cursor-pointer' : ''}`}
      style={{ animationDelay: `${delay * 0.05}s` }}
      onClick={onClick}
    >
      <div className="stat-card-header">
        <div className="stat-card-icon" style={{ background: `${color}15`, color }}>
          <Icon size={18} />
        </div>
        {trend !== undefined && (
          <span className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-card-value" style={{ color }}>
        {value}{suffix}
      </div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="chart-card glass-card-static">
      <div className="chart-card-header">
        <h3>{title}</h3>
      </div>
      <div className="chart-card-body">
        {children}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="tooltip-value" style={{ color: entry.color }}>
          {entry.name}: {entry.value !== null ? entry.value : 'N/A'}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [dashData, setDashData] = useState(null);
  const [trends, setTrends] = useState({});
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadDashboard();
      loadTrends();
    }
  }, [selectedMonth]);

  async function loadMonths() {
    try {
      const data = await api.get('/months');
      setMonths(data.months);
      // Default to current month (June 2026)
      const current = data.months.find(m => m.month === 6 && m.year === 2026) || data.months[0];
      if (current) setSelectedMonth(String(current.id));
    } catch (err) {
      console.error('Failed to load months:', err);
    }
  }

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await api.get(`/dashboard?month_id=${selectedMonth}`);
      setDashData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTrends() {
    try {
      const metrics = ['5s', 'am_closure', 'kaizens', 'abnormalities', 'repeated_abnormalities', 'iso', 'lean_completion', 'process_closure'];
      const results = {};
      for (const metric of metrics) {
        const data = await api.get(`/trends/${metric}`);
        results[metric] = data.trends;
      }
      setTrends(results);
    } catch (err) {
      console.error('Failed to load trends:', err);
    }
  }

  if (loading || !dashData) {
    return (
      <div className="page-content">
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const { metrics, sections } = dashData;
  const submittedData = [
    { name: 'Submitted', value: metrics.submittedSections, color: '#10b981' },
    { name: 'Pending', value: metrics.pendingSections, color: '#ef4444' }
  ];

  return (
    <div className="page-content">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Plant Dashboard</h1>
          <p className="page-subtitle">Manufacturing Excellence Cell — Overview</p>
        </div>
        <div className="dashboard-filters">
          <select
            className="form-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={loadDashboard}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Plant Score Hero */}
      <div className="plant-score-hero glass-card-static animate-fade-in-up">
        <div className="plant-score-ring">
          <svg viewBox="0 0 120 120" className="score-ring-svg">
            <circle cx="60" cy="60" r="52" className="score-ring-bg" />
            <circle cx="60" cy="60" r="52" className="score-ring-fill"
              style={{
                strokeDasharray: `${(metrics.plantScore / 100) * 327} 327`,
                stroke: metrics.plantScore >= 70 ? '#10b981' : metrics.plantScore >= 50 ? '#f59e0b' : '#ef4444'
              }}
            />
          </svg>
          <div className="score-ring-text">
            <span className="score-ring-value">{metrics.plantScore}</span>
            <span className="score-ring-label">Score</span>
          </div>
        </div>
        <div className="plant-score-info">
          <h2>Overall Plant Score</h2>
          <p className="text-secondary text-sm">{dashData.month?.label}</p>
          <div className="plant-score-stats">
            <div className="pss-item">
              <span className="pss-value text-success">{metrics.submittedSections}</span>
              <span className="pss-label">Submitted</span>
            </div>
            <div className="pss-item">
              <span className="pss-value text-danger">{metrics.pendingSections}</span>
              <span className="pss-label">Pending</span>
            </div>
            <div className="pss-item">
              <span className="pss-value text-amber">{formatPercent(metrics.submissionPct)}</span>
              <span className="pss-label">Completion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid mb-6">
        <StatCard icon={Star} label="Average 5S Score" value={metrics.avg5S} suffix="/5.0" color="#f59e0b" delay={0} />
        <StatCard icon={Wrench} label="AM Closure" value={formatPercent(metrics.avgAMClosure)} color="#06b6d4" delay={1} />
        <StatCard icon={Lightbulb} label="Total Kaizens" value={metrics.totalKaizens} color="#10b981" delay={2} />
        <StatCard icon={TrendingUp} label="Lean Projects" value={metrics.totalLeanProjects} color="#3b82f6" delay={3} />
        <StatCard icon={CheckCircle} label="Submitted" value={metrics.submittedSections} suffix="/13" color="#10b981" delay={4} />
        <StatCard icon={Clock} label="Pending" value={metrics.pendingSections} suffix="/13" color="#ef4444" delay={5} />
        <StatCard icon={Award} label="ISO Progress" value={formatPercent(metrics.avgISO)} color="#8b5cf6" delay={6} />
        <StatCard icon={AlertTriangle} label="Abnormalities" value={metrics.totalAbnormalities} color="#f97316" delay={7} />
        <StatCard icon={RefreshCw} label="Repeated Abnormalities" value={metrics.repeatedAbnormalities} color="#ef4444" delay={8} />
        <StatCard icon={Monitor} label="Digitalisation" value={metrics.digitalisationCount} color="#06b6d4" delay={9} />
        <StatCard icon={Cpu} label="Automation" value={metrics.automationCount} color="#14b8a6" delay={10} />
        <StatCard icon={Zap} label="High Impact Projects" value={metrics.highImpactCount} color="#f59e0b" delay={11} />
      </div>

      {/* Charts */}
      <div className="charts-grid mb-6">
        {/* 5S Trend */}
        <ChartCard title="5S Trend">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trends['5s'] || []}>
              <defs>
                <linearGradient id="grad5s" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#grad5s)" strokeWidth={2} name="5S Score" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Kaizen Trend */}
        <ChartCard title="Kaizen Trend">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trends['kaizens'] || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Total Kaizens" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* AM Closure Trend */}
        <ChartCard title="AM Closure Trend">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trends['am_closure'] || []}>
              <defs>
                <linearGradient id="gradAM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#06b6d4" fill="url(#gradAM)" strokeWidth={2} name="AM Closure %" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Abnormality Trend */}
        <ChartCard title="Abnormality Trend">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trends['abnormalities'] || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} name="Total Abnormalities" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Repeated Abnormality Trend */}
        <ChartCard title="Repeated Abnormality Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trends['repeated_abnormalities'] || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} name="Repeated" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ISO Progress */}
        <ChartCard title="ISO Progress">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trends['iso'] || []}>
              <defs>
                <linearGradient id="gradISO" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#gradISO)" strokeWidth={2} name="ISO %" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Lean Completion */}
        <ChartCard title="Lean Project Completion">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trends['lean_completion'] || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Completion %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Submission Status Donut */}
        <ChartCard title="Monthly Submission Status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={submittedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {submittedData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Section Status Grid */}
      <div className="section-status-header mb-4">
        <h2 className="text-lg font-semibold">Section Submission Status</h2>
      </div>
      <div className="section-grid mb-8">
        {sections.map((section, idx) => (
          <div
            key={section.section_id}
            className="section-status-card glass-card animate-fade-in-up cursor-pointer"
            style={{ animationDelay: `${idx * 0.03}s` }}
            onClick={() => navigate(`/all-sections?section=${section.section_id}&month=${selectedMonth}`)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">{section.section_code}</span>
              <span className={`badge badge-${section.status}`}>{section.status}</span>
            </div>
            <p className="text-xs text-secondary truncate">{section.section_name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
