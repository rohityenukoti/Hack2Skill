import React, { useState } from 'react';
import { Shield, Hospital, Heart, X, Eye, EyeOff, ArrowRight } from 'lucide-react';
import {
  signInAdmin,
  signInHealthCenter,
  signInCitizen,
  getDemoCredentials,
} from '../services/auth';

const ROLE_CONFIG = {
  admin: {
    title: 'Administrator Login',
    subtitle: 'District Health Dashboard Access',
    icon: <Shield size={32} />,
    color: '#0b4c8c',
    glow: 'rgba(11, 76, 140, 0.15)',
    fields: [
      { name: 'email', label: 'Email', placeholder: 'admin@dharwad.demo', type: 'email' },
      { name: 'password', label: 'Password', placeholder: 'Enter admin password', type: 'password' },
    ],
    buttonText: 'Access District Dashboard',
  },
  healthcenter: {
    title: 'Health Center Login',
    subtitle: 'PHC/CHC Staff Portal Access',
    icon: <Hospital size={32} />,
    color: '#15803d',
    glow: 'rgba(21, 128, 61, 0.15)',
    fields: [
      { name: 'email', label: 'Staff Email', placeholder: 'phc-narendra@dharwad.demo', type: 'email' },
      { name: 'password', label: 'Staff PIN / Password', placeholder: 'Enter password', type: 'password' },
    ],
    buttonText: 'Access Health Center Portal',
  },
  citizen: {
    title: 'Citizen Access',
    subtitle: 'Public Health Services',
    icon: <Heart size={32} />,
    color: '#d97706',
    glow: 'rgba(217, 119, 6, 0.15)',
    fields: [],
    buttonText: 'Continue as Citizen',
  },
};

export default function LoginModal({ role, onClose, onLoginSuccess }) {
  const demoCreds = getDemoCredentials();
  const [formData, setFormData] = useState({
    email: role === 'admin' ? demoCreds.admin.email : '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const config = ROLE_CONFIG[role];
  if (!config) return null;

  const handleChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let user;
      if (role === 'admin') {
        if (!formData.email?.trim() || !formData.password?.trim()) {
          setError('Please fill in all fields');
          setIsLoading(false);
          return;
        }
        user = await signInAdmin(formData.email.trim(), formData.password);
      } else if (role === 'healthcenter') {
        if (!formData.email?.trim() || !formData.password?.trim()) {
          setError('Please fill in all fields');
          setIsLoading(false);
          return;
        }
        user = await signInHealthCenter(formData.email.trim(), formData.password);
      } else if (role === 'citizen') {
        user = await signInCitizen();
      }

      onLoginSuccess(role, user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Check credentials or Firebase setup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="login-modal" style={{ '--role-color': config.color, '--role-glow': config.glow }}>
        <button className="login-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="login-modal-header">
          <div className="login-modal-icon" style={{ color: config.color, background: config.glow }}>
            {config.icon}
          </div>
          <h2 className="login-modal-title">{config.title}</h2>
          <p className="login-modal-subtitle">{config.subtitle}</p>
        </div>

        <form className="login-modal-form" onSubmit={handleSubmit}>
          {config.fields.map((field) => (
            <div key={field.name} className="login-field">
              <label className="login-field-label">{field.label}</label>
              <div className="login-field-input-wrapper">
                <input
                  type={field.type === 'password' && showPassword ? 'text' : field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="login-field-input"
                  autoComplete={field.type === 'password' ? 'current-password' : 'email'}
                />
                {field.type === 'password' && (
                  <button
                    type="button"
                    className="login-field-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
            style={{ background: config.color }}
          >
            {isLoading ? (
              <>
                <div className="login-spinner" />
                Authenticating...
              </>
            ) : (
              <>
                {config.buttonText}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="login-demo-hint">
          {role === 'citizen'
            ? 'Anonymous Firebase Auth — no personal data required'
            : 'Demo: admin@dharwad.demo / Admin@123456 · phc-narendra@dharwad.demo / Staff@123456'}
        </p>
      </div>
    </div>
  );
}
