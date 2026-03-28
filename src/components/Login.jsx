import { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { Shield, Mail, Lock, LogIn, UserPlus, Globe } from 'lucide-react';
import './Login.css';

export default function Login({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onAuthSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="login-logo-circle">
            <Shield size={32} className="login-logo-icon" />
          </div>
          <h2 className="login-title">Join the Search</h2>
          <p className="login-subtitle">
            Secure access to global rescue resources.
          </p>
        </div>

        {error && <div className="login-error animate-slide-left">{error}</div>}

        <form onSubmit={handleEmailAuth} className="login-form">
          <div className="login-input-group">
            <label><Mail size={14} /> Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-input-group">
            <label><Lock size={14} /> Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isLogin && (
            <button type="button" className="login-forgot" onClick={handleResetPassword}>
              Forgot password?
            </button>
          )}

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? <div className="spinner-small" /> : (
              isLogin ? <><LogIn size={18} /> Sign In</> : <><UserPlus size={18} /> Create Account</>
            )}
          </button>
        </form>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <div className="login-social">
          <button className="btn btn-ghost social-btn" onClick={handleGoogleSignIn} disabled={loading}>
            <Globe size={18} /> Continue with Google
          </button>
        </div>

        <div className="login-footer">
          {isLogin ? (
            <p>New to LostNoMore? <button onClick={() => setIsLogin(false)}>Sign Up</button></p>
          ) : (
            <p>Already have an account? <button onClick={() => setIsLogin(true)}>Sign In</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
