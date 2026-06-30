import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { MODULE_NAMES, CAPA_STATUSES, ISO_STATUSES, LEAN_STATUSES, PRIORITIES, HI_STATUSES } from '../utils/constants';
import { formatDate, formatPercent, formatCurrency } from '../utils/formatters';
import { Factory, Save, Send, CheckCircle, Clock, Plus, Trash2 } from 'lucide-react';
import './MySection.css';

export default function MySection() {
  const { user, isAdmin } = useAuth();
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedSection, setSelectedSection] = useState(user?.section_id || '');
  const [sections, setSections] = useState([]);
  const [report, setReport] = useState(null);
  const [modules, setModules] = useState({});
  const [activeTab, setActiveTab] = useState('5s');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedSection) loadReport();
  }, [selectedMonth, selectedSection]);

  async function loadInitial() {
    try {
      const [mData, sData] = await Promise.all([
        api.get('/months'),
        isAdmin ? api.get('/sections') : Promise.resolve({ sections: [] })
      ]);
      setMonths(mData.months);
      if (isAdmin) {
        setSections(sData.sections);
        if (sData.sections.length > 0) setSelectedSection(String(sData.sections[0].id));
      }
      const current = mData.months.find(m => m.month === 6 && m.year === 2026) || mData.months[0];
      if (current) setSelectedMonth(String(current.id));
      if (!isAdmin && user?.section_id) setSelectedSection(String(user.section_id));
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  async function loadReport() {
    setLoading(true);
    try {
      const data = await api.get(`/reports/section/${selectedSection}/month/${selectedMonth}`);
      setReport(data.report);
      setModules({
        '5s': data.modules.module_5s || {},
        'am': data.modules.module_am || {},
        'abnormalities': data.modules.module_abnormalities || {},
        'avinya': data.modules.module_avinya || {},
        'kaizens': data.modules.module_kaizens || {},
        'lean_projects': data.modules.module_lean_projects || {},
        'process_std': data.modules.module_process_std || {},
        'iso': data.modules.module_iso || {},
        'opportunities': data.modules.module_opportunities || {},
        'high_impact': data.modules.module_high_impact || { items: [] },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function updateModule(moduleKey, field, value) {
    setModules(prev => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], [field]: value }
    }));
  }

  async function saveModule(moduleKey) {
    if (!report) return;
    setSaving(true);
    try {
      await api.put(`/modules/${report.id}/${moduleKey}`, modules[moduleKey]);
      showToast('Saved successfully!', 'success');
      loadReport();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function submitReport() {
    if (!report) return;
    if (!confirm('Are you sure you want to submit this report? This marks it as final.')) return;
    try {
      await api.put(`/reports/${report.id}/submit`);
      showToast('Report submitted successfully!', 'success');
      loadReport();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function showToast(message, type) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const isReadOnly = report?.status === 'submitted' || (!isAdmin && user?.section_id !== parseInt(selectedSection));

  if (loading) {
    return <div className="page-content"><div className="loading-overlay"><div className="spinner" /></div></div>;
  }

  return (
    <div className="page-content">
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="section-hero glass-card-static animate-fade-in-up">
        <div className="section-hero-left">
          <div className="section-hero-icon">
            <Factory size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{report?.section_name || 'My Section'}</h1>
            <p className="text-secondary text-sm">{report?.section_code}</p>
          </div>
        </div>
        <div className="section-hero-meta">
          {isAdmin && (
            <select className="form-select" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <select className="form-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {months.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <span className={`badge badge-${report?.status}`}>{report?.status}</span>
          <div className="section-hero-detail">
            <span className="text-xs text-tertiary">Last Updated</span>
            <span className="text-xs text-secondary">{formatDate(report?.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Module Tabs */}
      <div className="tabs mb-4">
        {MODULE_NAMES.map(mod => (
          <button
            key={mod.key}
            className={`tab ${activeTab === mod.key ? 'active' : ''}`}
            onClick={() => setActiveTab(mod.key)}
          >
            {mod.label}
          </button>
        ))}
      </div>

      {/* Module Forms */}
      <div className="module-form glass-card-static p-5 animate-fade-in">
        {activeTab === '5s' && (
          <div className="form-content">
            <h3 className="text-lg font-semibold mb-4">5S Audit</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Audit Score</label>
                <input className="form-input" type="number" step="0.1" min="0" max="5" value={modules['5s']?.audit_score || ''} onChange={e => updateModule('5s', 'audit_score', parseFloat(e.target.value) || null)} disabled={isReadOnly} />
              </div>
              <div className="form-group">
                <label className="form-label">Target</label>
                <input className="form-input" type="number" step="0.1" value={modules['5s']?.target || ''} onChange={e => updateModule('5s', 'target', parseFloat(e.target.value) || null)} disabled={isReadOnly} />
              </div>
              <div className="form-group">
                <label className="form-label">Actual</label>
                <input className="form-input" type="number" step="0.1" value={modules['5s']?.actual || ''} onChange={e => updateModule('5s', 'actual', parseFloat(e.target.value) || null)} disabled={isReadOnly} />
              </div>
            </div>
            <div className="form-group mt-4">
              <label className="form-label">Remarks</label>
              <textarea className="form-textarea" value={modules['5s']?.remarks || ''} onChange={e => updateModule('5s', 'remarks', e.target.value)} disabled={isReadOnly} />
            </div>
          </div>
        )}

        {activeTab === 'am' && (
          <div className="form-content">
            <h3 className="text-lg font-semibold mb-4">Autonomous Maintenance — CLRI</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Target</label>
                <input className="form-input" type="number" value={modules['am']?.clri_target || ''} onChange={e => updateModule('am', 'clri_target', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
              </div>
              <div className="form-group">
                <label className="form-label">Completed</label>
                <input className="form-input" type="number" value={modules['am']?.clri_completed || ''} onChange={e => updateModule('am', 'clri_completed', parseInt(e.target.value) || 0)} disabled={isReadOnly} />
              </div>
              <div className="form-group">
                <label className="form-label">Pending (Auto)</label>
                <input className="form-input" type="number" value={(modules['am']?.clri_target || 0) - (modules['am']?.clri_completed || 0)} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Closure % (Auto)</label>
                <input className="form-input" type="text" value={modules['am']?.clri_target ? formatPercent((modules['am']?.clri_completed / modules['am']?.clri_target) * 100) : '0%'} disabled />
              </div>
            </div>
            <div className="form-group mt-4">
              <label className="form-label">Remarks</label>
              <textarea className="form-textarea" value={modules['am']?.remarks || ''} onChange={e => updateModule('am', 'remarks', e.target.value)} disabled={isReadOnly} />
            </div>
          </div>
        )}

        {activeTab === 'abnormalities' && (
          <div className="form-content">
            <h3 className="text-lg font-semibold mb-4">Abnormalities</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">White Tags</label><input className="form-input" type="number" value={modules['abnormalities']?.white_tags || ''} onChange={e => updateModule('abnormalities', 'white_tags', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Red Tags</label><input className="form-input" type="number" value={modules['abnormalities']?.red_tags || ''} onChange={e => updateModule('abnormalities', 'red_tags', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Total (Auto)</label><input className="form-input" type="number" value={(modules['abnormalities']?.white_tags || 0) + (modules['abnormalities']?.red_tags || 0)} disabled /></div>
              <div className="form-group"><label className="form-label">Closed</label><input className="form-input" type="number" value={modules['abnormalities']?.closed || ''} onChange={e => updateModule('abnormalities', 'closed', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Pending (Auto)</label><input className="form-input" type="number" value={((modules['abnormalities']?.white_tags||0)+(modules['abnormalities']?.red_tags||0))-(modules['abnormalities']?.closed||0)} disabled /></div>
              <div className="form-group"><label className="form-label">Repeated</label><input className="form-input" type="number" value={modules['abnormalities']?.repeated || ''} onChange={e => updateModule('abnormalities', 'repeated', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
            </div>
            <div className="form-row mt-4">
              <div className="form-group"><label className="form-label">CAPA Status</label>
                <select className="form-select" value={modules['abnormalities']?.capa_status || ''} onChange={e => updateModule('abnormalities', 'capa_status', e.target.value)} disabled={isReadOnly}>
                  <option value="">Select</option>
                  {CAPA_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Remarks</label><textarea className="form-textarea" value={modules['abnormalities']?.remarks || ''} onChange={e => updateModule('abnormalities', 'remarks', e.target.value)} disabled={isReadOnly} /></div>
            </div>
          </div>
        )}

        {activeTab === 'avinya' && (
          <div className="form-content">
            <h3 className="text-lg font-semibold mb-4">Avinya Observations</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Observations Posted</label><input className="form-input" type="number" value={modules['avinya']?.observations_posted || ''} onChange={e => updateModule('avinya', 'observations_posted', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Closed</label><input className="form-input" type="number" value={modules['avinya']?.closed || ''} onChange={e => updateModule('avinya', 'closed', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Pending (Auto)</label><input className="form-input" type="number" value={(modules['avinya']?.observations_posted || 0) - (modules['avinya']?.closed || 0)} disabled /></div>
            </div>
            <div className="form-group mt-4"><label className="form-label">Remarks</label><textarea className="form-textarea" value={modules['avinya']?.remarks || ''} onChange={e => updateModule('avinya', 'remarks', e.target.value)} disabled={isReadOnly} /></div>
          </div>
        )}

        {activeTab === 'kaizens' && (
          <div className="form-content">
            <h3 className="text-lg font-semibold mb-4">Kaizens</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Submitted</label><input className="form-input" type="number" value={modules['kaizens']?.submitted || ''} onChange={e => updateModule('kaizens', 'submitted', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Approved</label><input className="form-input" type="number" value={modules['kaizens']?.approved || ''} onChange={e => updateModule('kaizens', 'approved', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Implemented</label><input className="form-input" type="number" value={modules['kaizens']?.implemented || ''} onChange={e => updateModule('kaizens', 'implemented', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Savings (₹)</label><input className="form-input" type="number" value={modules['kaizens']?.savings || ''} onChange={e => updateModule('kaizens', 'savings', parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></div>
            </div>
            <div className="form-group mt-4"><label className="form-label">Remarks</label><textarea className="form-textarea" value={modules['kaizens']?.remarks || ''} onChange={e => updateModule('kaizens', 'remarks', e.target.value)} disabled={isReadOnly} /></div>
          </div>
        )}

        {activeTab === 'lean_projects' && (
          <div className="form-content">
            <h3 className="text-lg font-semibold mb-4">Lean Projects</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">QCC</label><input className="form-input" type="number" value={modules['lean_projects']?.qcc || ''} onChange={e => updateModule('lean_projects', 'qcc', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">SMED</label><input className="form-input" type="number" value={modules['lean_projects']?.smed || ''} onChange={e => updateModule('lean_projects', 'smed', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">KANBAN</label><input className="form-input" type="number" value={modules['lean_projects']?.kanban || ''} onChange={e => updateModule('lean_projects', 'kanban', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Poka-Yoke</label><input className="form-input" type="number" value={modules['lean_projects']?.poka_yoke || ''} onChange={e => updateModule('lean_projects', 'poka_yoke', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">VSM</label><input className="form-input" type="number" value={modules['lean_projects']?.vsm || ''} onChange={e => updateModule('lean_projects', 'vsm', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Other</label><input className="form-input" type="number" value={modules['lean_projects']?.other_lean || ''} onChange={e => updateModule('lean_projects', 'other_lean', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
            </div>
            <div className="form-row mt-4">
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-select" value={modules['lean_projects']?.status || ''} onChange={e => updateModule('lean_projects', 'status', e.target.value)} disabled={isReadOnly}>
                  {LEAN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Completion %</label><input className="form-input" type="number" min="0" max="100" value={modules['lean_projects']?.completion_pct || ''} onChange={e => updateModule('lean_projects', 'completion_pct', parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></div>
            </div>
          </div>
        )}

        {activeTab === 'process_std' && (
          <div className="form-content">
            <h3 className="text-lg font-semibold mb-4">Process Standardisation</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Audit Findings</label><input className="form-input" type="number" value={modules['process_std']?.audit_findings || ''} onChange={e => updateModule('process_std', 'audit_findings', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Closed</label><input className="form-input" type="number" value={modules['process_std']?.closed || ''} onChange={e => updateModule('process_std', 'closed', parseInt(e.target.value) || 0)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Pending (Auto)</label><input className="form-input" type="number" value={(modules['process_std']?.audit_findings || 0) - (modules['process_std']?.closed || 0)} disabled /></div>
            </div>
            <div className="form-group mt-4"><label className="form-label">Remarks</label><textarea className="form-textarea" value={modules['process_std']?.remarks || ''} onChange={e => updateModule('process_std', 'remarks', e.target.value)} disabled={isReadOnly} /></div>
          </div>
        )}

        {activeTab === 'iso' && (
          <div className="form-content">
            <h3 className="text-lg font-semibold mb-4">ISO Objectives</h3>
            {['qms', 'ems', 'ohsas'].map(std => (
              <div key={std} className="mb-4">
                <h4 className="text-md font-medium mb-2 text-amber" style={{textTransform:'uppercase'}}>{std === 'ohsas' ? 'OHSAS' : std.toUpperCase()}</h4>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Target</label><input className="form-input" type="number" value={modules['iso']?.[`${std}_target`] || ''} onChange={e => updateModule('iso', `${std}_target`, parseFloat(e.target.value) || null)} disabled={isReadOnly} /></div>
                  <div className="form-group"><label className="form-label">Current</label><input className="form-input" type="number" value={modules['iso']?.[`${std}_current`] || ''} onChange={e => updateModule('iso', `${std}_current`, parseFloat(e.target.value) || null)} disabled={isReadOnly} /></div>
                  <div className="form-group"><label className="form-label">Status</label>
                    <select className="form-select" value={modules['iso']?.[`${std}_status`] || ''} onChange={e => updateModule('iso', `${std}_status`, e.target.value)} disabled={isReadOnly}>
                      <option value="">Select</option>
                      {ISO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <div className="form-group"><label className="form-label">Remarks</label><textarea className="form-textarea" value={modules['iso']?.remarks || ''} onChange={e => updateModule('iso', 'remarks', e.target.value)} disabled={isReadOnly} /></div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="form-content">
            <h3 className="text-lg font-semibold mb-4">Opportunities</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Development</label><textarea className="form-textarea" value={modules['opportunities']?.development || ''} onChange={e => updateModule('opportunities', 'development', e.target.value)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Digitalisation</label><textarea className="form-textarea" value={modules['opportunities']?.digitalisation || ''} onChange={e => updateModule('opportunities', 'digitalisation', e.target.value)} disabled={isReadOnly} /></div>
            </div>
            <div className="form-row mt-4">
              <div className="form-group"><label className="form-label">Automation</label><textarea className="form-textarea" value={modules['opportunities']?.automation || ''} onChange={e => updateModule('opportunities', 'automation', e.target.value)} disabled={isReadOnly} /></div>
              <div className="form-group"><label className="form-label">Suggestions</label><textarea className="form-textarea" value={modules['opportunities']?.suggestions || ''} onChange={e => updateModule('opportunities', 'suggestions', e.target.value)} disabled={isReadOnly} /></div>
            </div>
            <div className="form-group mt-4"><label className="form-label">Priority</label>
              <select className="form-select" style={{maxWidth: 200}} value={modules['opportunities']?.priority || ''} onChange={e => updateModule('opportunities', 'priority', e.target.value)} disabled={isReadOnly}>
                <option value="">Select</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'high_impact' && (
          <div className="form-content">
            <h3 className="text-lg font-semibold mb-4">High Impact Projects</h3>
            {(modules['high_impact']?.items || []).map((item, idx) => (
              <div key={idx} className="hi-project-card glass-card p-4 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold">Project {idx + 1}</span>
                  {!isReadOnly && <button className="btn btn-ghost btn-sm text-danger" onClick={() => {
                    const items = [...(modules['high_impact']?.items || [])];
                    items.splice(idx, 1);
                    updateModule('high_impact', 'items', items);
                  }}><Trash2 size={14} /></button>}
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Project Name</label><input className="form-input" value={item.project_name || ''} onChange={e => { const items = [...(modules['high_impact']?.items || [])]; items[idx] = {...items[idx], project_name: e.target.value}; updateModule('high_impact', 'items', items); }} disabled={isReadOnly} /></div>
                  <div className="form-group"><label className="form-label">Owner</label><input className="form-input" value={item.owner || ''} onChange={e => { const items = [...(modules['high_impact']?.items || [])]; items[idx] = {...items[idx], owner: e.target.value}; updateModule('high_impact', 'items', items); }} disabled={isReadOnly} /></div>
                  <div className="form-group"><label className="form-label">Status</label>
                    <select className="form-select" value={item.status || ''} onChange={e => { const items = [...(modules['high_impact']?.items || [])]; items[idx] = {...items[idx], status: e.target.value}; updateModule('high_impact', 'items', items); }} disabled={isReadOnly}>
                      <option value="">Select</option>
                      {HI_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row mt-2">
                  <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={item.description || ''} onChange={e => { const items = [...(modules['high_impact']?.items || [])]; items[idx] = {...items[idx], description: e.target.value}; updateModule('high_impact', 'items', items); }} disabled={isReadOnly} /></div>
                  <div className="form-group"><label className="form-label">Savings (₹)</label><input className="form-input" type="number" value={item.savings || ''} onChange={e => { const items = [...(modules['high_impact']?.items || [])]; items[idx] = {...items[idx], savings: parseFloat(e.target.value) || 0}; updateModule('high_impact', 'items', items); }} disabled={isReadOnly} /></div>
                  <div className="form-group"><label className="form-label">Completion %</label><input className="form-input" type="number" min="0" max="100" value={item.completion_pct || ''} onChange={e => { const items = [...(modules['high_impact']?.items || [])]; items[idx] = {...items[idx], completion_pct: parseFloat(e.target.value) || 0}; updateModule('high_impact', 'items', items); }} disabled={isReadOnly} /></div>
                  <div className="form-group"><label className="form-label">Target Date</label><input className="form-input" type="date" value={item.target_date || ''} onChange={e => { const items = [...(modules['high_impact']?.items || [])]; items[idx] = {...items[idx], target_date: e.target.value}; updateModule('high_impact', 'items', items); }} disabled={isReadOnly} /></div>
                </div>
              </div>
            ))}
            {!isReadOnly && (
              <button className="btn btn-secondary" onClick={() => {
                const items = [...(modules['high_impact']?.items || []), { project_name: '', description: '', owner: '', status: '', savings: 0, completion_pct: 0, target_date: '' }];
                updateModule('high_impact', 'items', items);
              }}>
                <Plus size={14} /> Add Project
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!isReadOnly && (
          <div className="module-actions mt-4">
            <button className={`btn btn-secondary ${saving ? 'btn-loading' : ''}`} onClick={() => saveModule(activeTab)} disabled={saving}>
              {!saving && <><Save size={14} /> Save Draft</>}
            </button>
            <button className="btn btn-primary" onClick={submitReport}>
              <Send size={14} /> Submit Report
            </button>
          </div>
        )}

        {isReadOnly && report?.status === 'submitted' && (
          <div className="module-submitted mt-4">
            <CheckCircle size={18} className="text-success" />
            <span className="text-success text-sm font-medium">Report submitted on {formatDate(report?.submitted_at)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
