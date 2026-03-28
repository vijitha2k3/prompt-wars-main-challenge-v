import { useState, useRef, useEffect } from 'react';
import { Send, SkipForward, Camera, Upload, X } from 'lucide-react';
import './ChatIntake.css';

function TypingIndicator() {
  return (
    <div className="chat-bubble ai typing-indicator">
      <div className="typing-dots">
        <span /><span /><span />
      </div>
    </div>
  );
}

function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">Step {current} of {total}</span>
    </div>
  );
}

function PhotoUpload({ onUpload, onSkip }) {
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleConfirm = () => {
    if (preview) onUpload(preview);
  };

  return (
    <div className="photo-upload-area">
      {!preview ? (
        <div
          className={`drop-zone ${dragging ? 'dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          <Camera size={32} className="drop-icon" />
          <p className="drop-title">Tap to take a photo or upload</p>
          <p className="drop-sub">JPG, PNG, HEIC supported</p>
        </div>
      ) : (
        <div className="photo-preview-wrap">
          <img src={preview} alt="Child" className="photo-preview" />
          <button className="photo-clear" onClick={() => setPreview(null)} title="Remove">
            <X size={16} />
          </button>
          <button className="btn btn-emerald w-full" onClick={handleConfirm}>
            <Upload size={16} /> Use this photo
          </button>
        </div>
      )}
      <button className="btn btn-ghost skip-btn" onClick={onSkip}>
        <SkipForward size={15} /> I don't have a photo
      </button>
    </div>
  );
}

export default function ChatIntake({ messages, currentQuestion, questions, isTyping, onSubmit }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef();
  const inputRef = useRef();
  const q = questions[currentQuestion];
  const totalSteps = questions.length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (q?.type === 'text') inputRef.current?.focus();
  }, [currentQuestion, q]);

  const handleSend = () => {
    const val = input.trim();
    if (!val) return;
    onSubmit(val, false);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isWaiting = isTyping || messages.length === 0;
  const lastMsgIsAI = messages.length > 0 && messages[messages.length - 1].role === 'ai';
  const showInput = lastMsgIsAI && !isTyping;

  return (
    <div className="chat-intake">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-brand">
          <div className="pulse-dot" />
          <span className="chat-brand-text">LostNoMore Protocol Active</span>
        </div>
        <ProgressBar current={Math.min(currentQuestion + 1, totalSteps)} total={totalSteps} />
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`chat-message-wrap ${msg.role}`}
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            {msg.role === 'ai' && (
              <div className="ai-avatar">
                <span>AI</span>
              </div>
            )}
            <div className={`chat-bubble ${msg.role}`}>
              {msg.isPhoto && msg.photoUrl ? (
                <img src={msg.photoUrl} alt="Uploaded" className="chat-photo-thumb" />
              ) : (
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-message-wrap ai">
            <div className="ai-avatar"><span>AI</span></div>
            <TypingIndicator />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      {showInput && (
        <div className="chat-input-area animate-fade-in-up">
          {q?.type === 'photo' ? (
            <PhotoUpload
              onUpload={(url) => onSubmit(url, false)}
              onSkip={() => onSubmit(null, true)}
            />
          ) : (
            <div className="text-input-wrap">
              <div className="skip-row">
                <button className="btn btn-ghost skip-inline" onClick={() => onSubmit(input || 'I don\'t know', true)}>
                  <SkipForward size={14} /> I don't know
                </button>
              </div>
              <div className="input-row">
                <textarea
                  ref={inputRef}
                  className="chat-textarea"
                  placeholder={q?.placeholder || 'Type your answer...'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={!input.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
