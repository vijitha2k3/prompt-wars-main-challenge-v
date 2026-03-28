import { Phone, MapPin, CheckCircle2, ShieldAlert, Users, Navigation } from 'lucide-react';
import './ActionPanel.css';

export default function ActionPanel({ data }) {
  const { police_contact, next_steps, location } = data;
  const callable = police_contact.phone.replace(/[^\d+]/g, '');

  return (
    <div className="action-panel animate-fade-in">
      {/* Live Verified Police Search result */}
      <div className="call-block verified">
        <div className="call-block-left">
          <div className="call-icon-wrap">
            <Phone size={22} />
          </div>
          <div className="call-info">
            <div className="call-badge">Nearest Verified Station</div>
            <div className="call-station">{police_contact.station}</div>
            <div className="call-phone">{police_contact.phone}</div>
            {police_contact.distance && (
              <div className="call-meta">
                <Navigation size={12} /> {police_contact.distance} · {police_contact.type}
              </div>
            )}
          </div>
        </div>
        <a
          href={`tel:${callable}`}
          className="btn btn-primary call-btn"
          id="call-police-btn"
        >
          <Phone size={16} /> Call Now
        </a>
      </div>

      {/* Station Address & Location details */}
      <div className="location-detail-block">
        <div className="location-row">
          <MapPin size={16} className="loc-icon" />
          <div className="loc-text">
            <span className="loc-label">Child Found Location:</span>
            <span className="loc-value">{location}</span>
          </div>
        </div>
        
        {police_contact.address && (
          <div className="location-row">
            <Navigation size={16} className="loc-icon station" />
            <div className="loc-text">
              <span className="loc-label">Station Physical Address:</span>
              <span className="loc-value">{police_contact.address}</span>
            </div>
          </div>
        )}
      </div>

      {/* Expert Directions & Notes */}
      {police_contact.notes && (
        <div className="notes-block">
          <ShieldAlert size={14} className="notes-icon" />
          <p className="notes-text">{police_contact.notes}</p>
        </div>
      )}

      {/* Structured Action Checklist */}
      <div className="steps-block">
        <div className="steps-header">
          <h3 className="steps-title">Rescue Protocol Action Steps</h3>
        </div>
        <div className="steps-list">
          {next_steps.map((step, i) => (
            <div key={i} className="checklist-item" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="checklist-num">{i + 1}</div>
              <p className="checklist-text">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="safety-footer">
        <Users size={14} />
        <p>You have taken the first critical steps. Law enforcement will take over upon contact.</p>
      </div>
    </div>
  );
}
