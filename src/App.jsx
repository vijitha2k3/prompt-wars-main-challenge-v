import { useEmergencyProtocol } from './hooks/useEmergencyProtocol';
import SplashScreen from './components/SplashScreen';
import ChatIntake from './components/ChatIntake';
import LoadingScreen from './components/LoadingScreen';
import RescueDashboard from './components/RescueDashboard';
import './App.css';

export default function App() {
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
  } = useEmergencyProtocol();

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <header className="app-topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">🛡</div>
          <span className="topbar-name">LostNoMore</span>
        </div>
        <div className="topbar-status">
          <span className={`topbar-phase-dot phase-${phase}`} />
          <span className="topbar-phase-label">
            {phase === 'splash' && 'Ready'}
            {phase === 'chat' && 'Protocol Active'}
            {phase === 'loading' && 'Searching...'}
            {phase === 'dashboard' && 'Rescue Packet Ready'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {phase === 'splash' && (
          <div className="phase-view animate-fade-in">
            <SplashScreen onStart={startChat} />
          </div>
        )}

        {phase === 'chat' && (
          <div className="phase-view animate-fade-in">
            <ChatIntake
              messages={messages}
              currentQuestion={currentQuestion}
              questions={questions}
              isTyping={isTyping}
              onSubmit={submitAnswer}
            />
          </div>
        )}

        {phase === 'loading' && (
          <div className="phase-view animate-fade-in">
            <LoadingScreen />
          </div>
        )}

        {phase === 'dashboard' && dashboardData && (
          <div className="phase-view animate-fade-in">
            <RescueDashboard data={dashboardData} onReset={reset} />
          </div>
        )}
      </main>
    </div>
  );
}
