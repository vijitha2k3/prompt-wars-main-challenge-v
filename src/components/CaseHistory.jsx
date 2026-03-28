import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Clock, ChevronRight, FileText, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import './CaseHistory.css';

export default function CaseHistory({ userId, onSelectCase, onBack }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCases() {
      try {
        const q = query(
          collection(db, 'users', userId, 'cases'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCases(docs);
      } catch (err) {
        console.error('Fetch cases error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, [userId]);

  return (
    <div className="case-history animate-fade-in">
      <div className="history-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <h2 className="history-title">My Saved Cases</h2>
      </div>

      <div className="history-list">
        {loading ? (
          <div className="history-loading">
            <div className="spinner-small" />
            <span>Loading records...</span>
          </div>
        ) : cases.length === 0 ? (
          <div className="history-empty">
            <FileText size={48} className="empty-icon" />
            <p>No reports found. Your rescue history will appear here once you complete a protocol.</p>
          </div>
        ) : (
          cases.map((c) => (
            <div 
              key={c.id} 
              className="history-card glass-card"
              onClick={() => onSelectCase(c)}
            >
              <div className="card-top">
                <span className="case-id">{c.child_id}</span>
                <span className="case-date">
                  <Calendar size={12} />
                  {new Date(c.createdAt?.toDate() || c.generated_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="card-details">
                <div className="detail-row">
                  <MapPin size={14} />
                  <span>{c.location}</span>
                </div>
                <div className="detail-row">
                  <Clock size={14} />
                  <span>Status: Protocol Complete</span>
                </div>
              </div>
              
              <ChevronRight size={20} className="card-arrow" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
