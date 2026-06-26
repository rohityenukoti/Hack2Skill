import React, { useState } from 'react';
import { Shield, Hospital, Heart, X, Eye, EyeOff, ArrowRight } from 'lucide-react';

const ROLE_CONFIG = {
  admin: {
    title: 'Administrator Login',
    subtitle: 'District Health Dashboard Access',
    icon: <Shield size={32} />,
    color: 'hsl(210, 100%, 65%)',
    glow: 'hsla(210, 100%, 65%, 0.25)',
    fields: [
      { name: 'districtId', label: 'District ID', placeholder: 'e.g. DHARWAD-01', type: 'text' },
      { name: 'password', label: 'Password', placeholder: 'Enter admin password', type: 'password' }
    ],
    buttonText: 'Access District Dashboard'
  },
  healthcenter: {
    title: 'Health Center Login',
    subtitle: 'PHC/CHC Staff Portal Access',
    icon: <Hospital size={32} />,
    color: 'hsl(187, 92%, 45%)',
    glow: 'hsla(187, 92%, 45%, 0.25)',
    fields: [
      { name: 'centerCode', label: 'Center Code', placeholder: 'e.g. PHC-NARENDRA', type: 'text' },
      { name: 'staffPin', label: 'Staff PIN', placeholder: 'Enter 4-digit PIN', type: 'password' }
    ],
    buttonText: 'Access Health Center Portal'
  },
  citizen: {
    title: 'Citizen Login',
    subtitle: 'Public Health Services',
    icon: <Heart size={32} />,
    color: 'hsl(145, 63%, 49%)',
    glow: 'hsla(145, 63%, 49%, 0.25)',
    fields: [
      { name: 'mobile', label: 'Mobile Number', placeholder: 'Enter 10-digit number', type: 'tel' },
      { name: 'otp', label: 'OTP', placeholder: 'Enter OTP (any 4 digits)', type: 'text' }
    ],
    buttonText: 'Access Citizen Portal'
  }
};

export default function LoginModal({ role, onClose, onLoginSuccess }) {
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const config = ROLE_CONFIG[role];
  if (!config) return null;

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setError('');
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPassword(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const emptyFields = config.fields.filter(f => !formData[f.name]?.trim());
    if (emptyFields.length > 0) {
      setError(`Please fill in all fields`);
      return;
    }

    setIsLoading(true);
    
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsLoading(false);
    onLoginSuccess(role, formData);
  };

  return (
    <div className="login-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="login-modal" style={{ '--role-color': config.color, '--role-glow': config.glow }}>
        {/* Close Button */}
        <button className="login-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Header */}
        <div className="login-modal-header">
          <div className="login-modal-icon" style={{ color: config.color, background: config.glow }}>
            {config.icon}
          </div>
          <h2 className="login-modal-title">{config.title}</h2>
          <p className="login-modal-subtitle">{config.subtitle}</p>
        </div>

        {/* Form */}
        <form className="login-modal-form" onSubmit={handleSubmit}>
          {config.fields.map((field) => (
            <div key={field.name} className="login-field">
              <label className="login-field-label">{field.label}</label>
              <div className="login-field-input-wrapper">
                <input
                  type={field.type === 'password' && showPassword[field.name] ? 'text' : field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="login-field-input"
                  autoComplete="off"
                />
                {field.type === 'password' && (
                  <button
                    type="button"
                    className="login-field-toggle"
                    onClick={() => togglePasswordVisibility(field.name)}
                  >
                    {showPassword[field.name] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {error && (
            <p className="login-error">{error}</p>
          )}

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

        {/* Demo hint */}
        <p className="login-demo-hint">
          🔓 Demo Mode: Enter any credentials to proceed
        </p>
      </div>
    </div>
  );
}
