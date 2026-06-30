import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { MessageSquare, Copy, ExternalLink, CheckCircle } from 'lucide-react';

export default function WhatsAppReports() {
  const { user, isAdmin, isViewer } = useAuth();
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [sections, setSections] = useState([]);
  
  const [selectedSection, setSelectedSection] = useState(user?.section_id || '');
  
  const [plantReport, setPlantReport] = useState({ text: '', url: '', loading: false, copied: false });
  const [sectionReport, setSectionReport] = useState({ text: '', url: '', loading: false, copied: false });

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    const [mData, sData] = await Promise.all([api.get('/months'), isAdmin || isViewer ? api.get('/sections') : Promise.resolve({ sections: [] })]);
    setMonths(mData.months);
    if (isAdmin || isViewer) setSections(sData.sections);
    const current = mData.months.find(m => m.month === 6 && m.year === 2026) || mData.months[0];
    if (current) setSelectedMonth(String(current.id));
  }

  async function generatePlantReport() {
    setPlantReport(prev => ({ ...prev, loading: true }));
    try {
      const data = await api.get(`/whatsapp/plant-report/${selectedMonth}`);
      setPlantReport({ text: data.text, url: data.whatsapp_url, loading: false, copied: false });
    } catch (err) {
      setPlantReport({ text: `Error: ${err.message}`, url: '', loading: false, copied: false });
    }
  }

  async function generateSectionReport() {
    setSectionReport(prev => ({ ...prev, loading: true }));
    try {
      const reports = await api.get(`/reports?month_id=${selectedMonth}&section_id=${selectedSection}`);
      if (reports.reports.length === 0) {
        setSectionReport({ text: 'No report found for this section/month.', url: '', loading: false, copied: false });
        return;
      }
      const data = await api.get(`/whatsapp/section-report/${reports.reports[0].id}`);
      setSectionReport({ text: data.text, url: data.whatsapp_url, loading: false, copied: false });
    } catch (err) {
      setSectionReport({ text: `Error: ${err.message}`, url: '', loading: false, copied: false });
    }
  }

  async function copyToClipboard(text, isPlant) {
    await navigator.clipboard.writeText(text);
    if (isPlant) {
      setPlantReport(prev => ({ ...prev, copied: true }));
      setTimeout(() => setPlantReport(prev => ({ ...prev, copied: false })), 2000);
    } else {
      setSectionReport(prev => ({ ...prev, copied: true }));
      setTimeout(() => setSectionReport(prev => ({ ...prev, copied: false })), 2000);
    }
  }

  return (
    <div className="page-content">
      <div className="mb-6">
        <h1 className="page-title">WhatsApp Reports</h1>
        <p className="page-subtitle">Generate and share reports via WhatsApp</p>
      </div>

      <div className="glass-card-static p-6 mb-6">
        <div className="flex gap-4 mb-4 items-end">
          <div className="form-group">
            <label className="form-label">Month</label>
            <select className="form-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {months.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-2 gap-6">
        {/* Plant Report Panel */}
        {(isAdmin || isViewer) && (
          <div className="glass-card-static p-6 animate-fade-in-up">
            <h2 className="text-lg font-semibold mb-4">Plant Overall Report</h2>
            <button className={`btn btn-primary mb-4 ${plantReport.loading ? 'btn-loading' : ''}`} onClick={generatePlantReport} disabled={plantReport.loading}>
              {!plantReport.loading && <><MessageSquare size={14} /> Generate Plant Report</>}
            </button>
            
            {plantReport.text && (
              <div className="mt-4 border-t border-secondary pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-secondary">Preview</h3>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(plantReport.text, true)}>
                      {plantReport.copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                    </button>
                    <a href={plantReport.url} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm">
                      <ExternalLink size={14} /> Share
                    </a>
                  </div>
                </div>
                <pre style={{ background: 'var(--bg-input)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', maxHeight: '400px', overflow: 'auto', lineHeight: 1.6 }}>
                  {plantReport.text}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Section Report Panel */}
        <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold mb-4">Section Report</h2>
          <div className="flex gap-4 mb-4">
            {(isAdmin || isViewer) && (
              <div className="form-group w-full">
                <select className="form-select" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                  <option value="">Select Section</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <button className={`btn btn-primary whitespace-nowrap ${sectionReport.loading ? 'btn-loading' : ''}`} onClick={generateSectionReport} disabled={sectionReport.loading || !selectedSection}>
              {!sectionReport.loading && <><MessageSquare size={14} /> Generate Section Report</>}
            </button>
          </div>

          {sectionReport.text && (
            <div className="mt-4 border-t border-secondary pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-secondary">Preview</h3>
                <div className="flex gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(sectionReport.text, false)}>
                    {sectionReport.copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                  </button>
                  <a href={sectionReport.url} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm">
                    <ExternalLink size={14} /> Share
                  </a>
                </div>
              </div>
              <pre style={{ background: 'var(--bg-input)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', maxHeight: '400px', overflow: 'auto', lineHeight: 1.6 }}>
                {sectionReport.text}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
