import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = () => {
  // Detect ?resetToken= in the URL on mount
  const urlParams = new URLSearchParams(window.location.search);
  const urlResetToken = urlParams.get('resetToken');

  const [view, setView] = useState(urlResetToken ? 'reset' : 'login'); // login | forgot | reset
  const [formData, setFormData] = useState({ email: '', password: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [devResetUrl, setDevResetUrl] = useState('');
  const [resetToken] = useState(urlResetToken || '');

  const { login, forgotPassword, resetPassword } = useAuth();

  // Clear URL param once captured so it doesn't persist on refresh after reset
  useEffect(() => {
    if (urlResetToken) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [urlResetToken]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  // ── Login ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setMessage({ type: 'error', text: result.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ──
  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await forgotPassword(formData.email);
      setMessage({ type: 'success', text: result.message || 'If that email is registered, a reset link has been sent.' });
      if (result.resetUrl) setDevResetUrl(result.resetUrl);
      setFormData({ ...formData, email: '' });
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Reset Password ──
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword(resetToken, formData.newPassword);
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Password reset successful. You can now sign in.' });
        setFormData({ ...formData, newPassword: '', confirmPassword: '' });
        setTimeout(() => setView('login'), 2000);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Password reset failed. The link may have expired.' });
    } finally {
      setLoading(false);
    }
  };

  const MessageBanner = () => message.text ? (
    <div className={`auth-message ${message.type}`}>{message.text}</div>
  ) : null;

  // ── LOGIN VIEW ──
  if (view === 'login') {
    return (
      <div className="auth-modal-overlay">
        <div className="auth-modal">
          <div className="auth-modal-header">
            <h2>MRM Billing App</h2>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Enter your email" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Enter your password" />
            </div>

            <MessageBanner />

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <button type="button" className="auth-link" onClick={() => { setView('forgot'); setMessage({ type: '', text: '' }); }}>
              Forgot Password?
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FORGOT PASSWORD VIEW ──
  if (view === 'forgot') {
    return (
      <div className="auth-modal-overlay">
        <div className="auth-modal">
          <div className="auth-modal-header">
            <h2>Forgot Password</h2>
            <p className="auth-subtitle">Enter your email to receive a reset link</p>
          </div>

          <form onSubmit={handleForgot} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Enter your registered email" />
            </div>

            <MessageBanner />

            {devResetUrl && (
              <div className="dev-reset-link">
                <p>No email configured. Use this link to reset:</p>
                <button type="button" className="btn btn-primary btn-block" onClick={() => { window.location.href = devResetUrl; }}>
                  Open Reset Link
                </button>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="auth-footer">
            <button type="button" className="auth-link" onClick={() => { setView('login'); setMessage({ type: '', text: '' }); setDevResetUrl(''); }}>
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RESET PASSWORD VIEW ──
  if (view === 'reset') {
    return (
      <div className="auth-modal-overlay">
        <div className="auth-modal">
          <div className="auth-modal-header">
            <h2>Reset Password</h2>
            <p className="auth-subtitle">Choose a new password</p>
          </div>

          <form onSubmit={handleReset} className="auth-form">
            <div className="form-group">
              <label>New Password</label>
              <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} required placeholder="Min 8 characters" />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Re-enter new password" />
            </div>

            <MessageBanner />

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="auth-footer">
            <button type="button" className="auth-link" onClick={() => { setView('login'); setMessage({ type: '', text: '' }); }}>
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthModal;
