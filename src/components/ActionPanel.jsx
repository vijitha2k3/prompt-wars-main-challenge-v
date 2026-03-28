import { Phone, MapPin, CheckCircle2, Circle, ShieldAlert, Users } from 'lucide-react';
import './ActionPanel.css';

export default function ActionPanel({ data }) {
  const { police_contact, next_steps, location } = data;
  const callable = police_contact.phone.replace(/[^\d+]/g, '');

  return (
    <div className="action-panel">
      {/* Direct Call CTA */}
      <div className="call-block">
        <div className="call-block-left">
          <div className="call-icon-wrap">
            <Phone size={22} />
            <div className="call-pulse-ring" />
          </div>
          <div>
            <div className="call-label">Nearest Police Station</div>
            <div className="call-station">{police_contact.station}</div>
            <div className="call-phone">{police_contact.phone}</div>
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

      {/* Location Summary */}
      <div className="location-block">
        <MapPin size={15} />
        <div>
          <span className="location-label">Child found at: </span>
          <span className="location-value">{location}</span>
        </div>
      </div>

      {/* Next Steps Checklist */}
      <div className="steps-block">
        <div className="steps-header">
          <ShieldAlert size={16} className="steps-icon" />
          <h3 className="steps-title">Your Action Checklist</h3>
        </div>
        <div className="steps-list">
          {next_steps.map((step, i) => (
            <ChecklistItem key={i} index={i + 1} text={step} />
          ))}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="safety-notice">
        <Users size={15} />
        <p>Stay with the child in a well-lit area. Do not hand the child to any stranger — wait for official law enforcement.</p>
      </div>
    </div>
  );
}

function ChecklistItem({ index, text }) {
  return (
    <div className="checklist-item" style={{ animationDelay: `${index * 0.08}s` }}>
      <div className="checklist-num">{index}</div>
      <p className="checklist-text">{text}</p>
    </div>
  );
}
