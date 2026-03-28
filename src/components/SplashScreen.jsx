import { Shield, Zap, Users, ArrowRight } from 'lucide-react';
import './SplashScreen.css';

const FEATURES = [
  { icon: <Zap size={18} />, text: 'One-question-at-a-time guided intake' },
  { icon: <Shield size={18} />, text: 'Instant police station lookup' },
  { icon: <Users size={18} />, text: 'Missing kids database cross-check' },
];

export default function SplashScreen({ onStart }) {
  return (
    <div className="splash">
      {/* Background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="splash-content">
        {/* Brand */}
        <div className="splash-brand animate-fade-in-up">
          <div className="splash-logo">
            <Shield size={36} strokeWidth={1.5} />
          </div>
          <h1 className="splash-title">
            <span className="shimmer-text">LostNoMore</span>
          </h1>
          <p className="splash-tagline">AI-powered bridge from <em>Found</em> to <em>Home.</em></p>
        </div>

        {/* Emergency Banner */}
        <div className="splash-emergency-banner animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <span className="emergency-icon">🚨</span>
          <div>
            <p className="emergency-title">Found a missing child?</p>
            <p className="emergency-sub">Stay calm. We'll guide you step by step.</p>
          </div>
        </div>

        {/* Feature list */}
        <div className="splash-features animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="splash-feature-item">
              <span className="splash-feature-icon">{f.icon}</span>
              <span className="splash-feature-text">{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="splash-cta animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <button
            className="btn btn-primary cta-main"
            onClick={onStart}
            id="start-protocol-btn"
          >
            <span>Start Emergency Protocol</span>
            <ArrowRight size={18} />
          </button>
          <p className="splash-privacy">
            No account needed · No data stored · Available 24/7
          </p>
        </div>
      </div>
    </div>
  );
}
