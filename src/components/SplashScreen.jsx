import { Shield, Zap, Users, ArrowRight, History } from 'lucide-react';
import './SplashScreen.css';

const FEATURES = [
  { icon: <Zap size={18} />, text: 'One-question-at-a-time guided intake' },
  { icon: <Shield size={18} />, text: 'Instant live local police station lookup' },
  { icon: <Users size={18} />, text: 'Real-time missing kids database check' },
];

export default function SplashScreen({ onStart, onHistory }) {
  return (
    <div className="splash animate-fade-in">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="splash-content">
        <div className="splash-brand">
          <div className="splash-logo">
            <Shield size={36} strokeWidth={1.5} />
          </div>
          <h1 className="splash-title">
            <span className="shimmer-text">LostNoMore</span>
          </h1>
          <p className="splash-tagline">AI-powered bridge from <em>Found</em> to <em>Home.</em></p>
        </div>

        <div className="splash-emergency-banner">
          <span className="emergency-icon">🚨</span>
          <div>
            <p className="emergency-title">Found a missing child?</p>
            <p className="emergency-sub">Stay calm. We'll guide you step by step.</p>
          </div>
        </div>

        <div className="splash-features">
          {FEATURES.map((f, i) => (
            <div key={i} className="splash-feature-item">
              <span className="splash-feature-icon">{f.icon}</span>
              <span className="splash-feature-text">{f.text}</span>
            </div>
          ))}
        </div>

        <div className="splash-cta">
          <button
            className="btn btn-primary cta-main pulse-glow"
            onClick={onStart}
            id="start-protocol-btn"
          >
            <span>Start Emergency Protocol</span>
            <ArrowRight size={18} />
          </button>
          
          <button className="btn btn-ghost history-btn" onClick={onHistory}>
            <History size={16} /> View Saved Reports
          </button>

          <p className="splash-privacy">
             SECURE · GLOBAL · 24/7 SUPPORT
          </p>
        </div>
      </div>
    </div>
  );
}
