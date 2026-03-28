import { useState } from 'react';
import { RotateCcw, FileText, Zap, Database } from 'lucide-react';
import PosterGenerator from './PosterGenerator';
import ActionPanel from './ActionPanel';
import MatchFeed from './MatchFeed';
import './RescueDashboard.css';

const TABS = [
  { id: 'action', label: 'Action Panel', icon: <Zap size={15} /> },
  { id: 'poster', label: 'Rescue Poster', icon: <FileText size={15} /> },
  { id: 'matches', label: 'Match Feed', icon: <Database size={15} /> },
];

export default function RescueDashboard({ data, onReset }) {
  const [activeTab, setActiveTab] = useState('action');

  return (
    <div className="dashboard">
      {/* Dashboard Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-status-dot" />
          <div>
            <h1 className="dash-title">Rescue Dashboard</h1>
            <p className="dash-id">Case ID: <strong>{data.child_id}</strong> · Protocol Complete</p>
          </div>
        </div>
        <button className="btn btn-ghost reset-btn" onClick={onReset} id="new-case-btn">
          <RotateCcw size={15} /> New Case
        </button>
      </div>

      {/* Alert strip */}
      <div className="dash-alert-strip">
        <span className="dash-alert-dot" />
        <span>Live — Keep this screen open. Your rescue packet is ready. Call police immediately.</span>
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`dash-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            id={`tab-${t.id}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="dash-content">
        {activeTab === 'action' && <ActionPanel data={data} />}
        {activeTab === 'poster' && <PosterGenerator data={data} />}
        {activeTab === 'matches' && <MatchFeed matches={data.matches} location={data.location} />}
      </div>
    </div>
  );
}
