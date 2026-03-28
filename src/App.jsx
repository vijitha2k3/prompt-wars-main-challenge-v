import { useState, useEffect } from 'react';
import { useEmergencyProtocol } from './hooks/useEmergencyProtocol';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import SplashScreen from './components/SplashScreen';
import ChatIntake from './components/ChatIntake';
import LoadingScreen from './components/LoadingScreen';
import RescueDashboard from './components/RescueDashboard';
import Login from './components/Login';
import CaseHistory from './components/CaseHistory';
import { LogOut, User as UserIcon, Shield, Clock } from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewState, setViewState] = useState('main'); // main | history | protocol | dashboard

  const {
    phase,
    messages,
    currentQuestion,
    questions,
    isTyping,
    dashboardData,
    startChat,
    submitAnswer,
    reset,
  } = useEmergencyProtocol(user);

  // Sync internal protocol phase with App view state
  useEffect(() => {
    if (phase === 'chat') setViewState('protocol');
    if (phase === 'dashboard') setViewState('dashboard');
    if (phase === 'loading') setViewState('protocol');
    if (phase === 'splash') setViewState('main');
  }, [phase]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      reset();
      setViewState('main');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const openHistory = () => setViewState('history');
  const closeHistory = () => setViewState('main');

  const onSelectHistoryCase = (caseData) => {
    // This is a direct injection of historical data into a dashboard view
    // In useEmergencyProtocol we'd need a 'loadCase' function for full robustness
    const fakeProtocol = { ...caseData };
    // For now, we'll just show it in a custom state or similar
    // Simplest: just use the dashboardData state but bypass wait
    alert("Reopening Case: " + caseData.child_id);
    setViewState('dashboard'); // This is a bit of a hack without deep state sync
  };

  if (authLoading) {
    return (
      <div className="app-shell loading">
        <div className="spinner-medium" />
      </div>
    );
  }

  if (!user) {
    return <Login onAuthSuccess={() => {}} />;
  }

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <header className="app-topbar glass">
        <div className="topbar-brand">
          <Shield size={20} className="topbar-logo-icon" />
          <span className="topbar-name">LostNoMore</span>
        </div>
        
        <div className="topbar-right">
          {viewState !== 'history' && (
            <div className="topbar-status">
              <span className={`topbar-phase-dot phase-${phase}`} />
              <span className="topbar-phase-label">
                {phase === 'splash' && 'Ready'}
                {phase === 'chat' && 'Protocol Active'}
                {phase === 'loading' && 'Searching...'}
                {phase === 'dashboard' && 'Rescue Packet Ready'}
              </span>
            </div>
          )}

          <div className="user-menu">
            <button className="history-btn-icon" onClick={openHistory} title="View History">
              <Clock size={16} />
            </button>
            <div className="user-avatar" title={user.email}>
              {user.photoURL ? <img src={user.photoURL} alt="Avatar" /> : <UserIcon size={14} />}
            </div>
            <button className="logout-icon-btn" onClick={handleLogout} title="Sign Out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {viewState === 'main' && (
          <div className="phase-view animate-fade-in">
            <SplashScreen onStart={startChat} onHistory={openHistory} />
          </div>
        )}

        {viewState === 'history' && (
          <div className="phase-view animate-fade-in">
            <CaseHistory userId={user.uid} onBack={closeHistory} onSelectCase={(c) => {
              // We'd ideally logic the redirect here
              alert("Feature coming in V2.1: Full historical dashboard reopening.");
              setViewState('main');
            }} />
          </div>
        )}

        {viewState === 'protocol' && (
          <div className="phase-view animate-fade-in">
            {phase === 'loading' ? <LoadingScreen /> : (
              <ChatIntake
                messages={messages}
                currentQuestion={currentQuestion}
                questions={questions}
                isTyping={isTyping}
                onSubmit={submitAnswer}
              />
            )}
          </div>
        )}

        {viewState === 'dashboard' && dashboardData && (
          <div className="phase-view animate-fade-in">
            <RescueDashboard data={dashboardData} onReset={() => {
              reset();
              setViewState('main');
            }} />
          </div>
        )}
      </main>
    </div>
  );
}
