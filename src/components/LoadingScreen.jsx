import { Search, Shield, Database } from 'lucide-react';
import './LoadingScreen.css';

const STEPS = [
  { icon: <Search size={18} />, label: 'Locating nearest police station...', delay: 0 },
  { icon: <Database size={18} />, label: 'Cross-checking missing kids database...', delay: 800 },
  { icon: <Shield size={18} />, label: 'Building your rescue packet...', delay: 1600 },
];

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="orb orb-1" style={{ opacity: 0.3 }} />
      <div className="loading-content">
        <div className="loading-spinner-wrap">
          <div className="loading-spinner" />
          <div className="loading-logo">
            <Shield size={28} />
          </div>
        </div>

        <h2 className="loading-title">Running Background Checks</h2>
        <p className="loading-sub">Please hold on — we're gathering critical information.</p>

        <div className="loading-steps">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="loading-step animate-fade-in-up"
              style={{ animationDelay: `${step.delay}ms` }}
            >
              <div className="loading-step-icon">{step.icon}</div>
              <span>{step.label}</span>
              <div className="loading-step-dots">
                <span /><span /><span />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
