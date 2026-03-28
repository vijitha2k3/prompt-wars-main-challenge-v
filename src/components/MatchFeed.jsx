import { ExternalLink, Search, AlertCircle, Database } from 'lucide-react';
import './MatchFeed.css';

export default function MatchFeed({ matches, location }) {
  return (
    <div className="match-feed">
      <div className="match-feed-header">
        <div className="mf-header-left">
          <Database size={16} className="mf-db-icon" />
          <h3 className="mf-title">Potential Database Matches</h3>
        </div>
        <span className="mf-badge">{matches.length} found</span>
      </div>

      <div className="mf-info-bar">
        <Search size={13} />
        <span>Searched <code>site:missingkids.org {location}</code> and local news (48 hrs)</span>
      </div>

      <div className="match-list">
        {matches.map((m, i) => (
          <MatchCard key={m.id} match={m} index={i} />
        ))}
      </div>

      <div className="mf-disclaimer">
        <AlertCircle size={13} />
        <p>These are simulated cross-check results for demonstration. In production, live searches against missingkids.org and local news will be performed. Always defer to police guidance.</p>
      </div>
    </div>
  );
}

function MatchCard({ match, index }) {
  return (
    <a
      href={match.url}
      target="_blank"
      rel="noreferrer"
      className="match-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="match-card-body">
        <div className="match-dot" />
        <div className="match-info">
          <div className="match-name">{match.name}</div>
          <div className="match-meta">
            <span>Age: {match.age}</span>
            <span className="match-sep">·</span>
            <span>Last seen: {match.lastSeen}</span>
          </div>
          <div className="match-source">{match.source}</div>
        </div>
      </div>
      <ExternalLink size={14} className="match-ext-icon" />
    </a>
  );
}
