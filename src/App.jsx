import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Hospital, 
  Mic, 
  Settings, 
  Database, 
  Cpu,
  RefreshCw,
  X,
  Sparkles,
  LogOut,
  Home,
  MapPin,
  Star,
  Heart,
  Shield,
  Users
} from 'lucide-react';
import { 
  subscribeToCenters, 
  isFirebaseLive, 
  seedFirestoreIfEmpty, 
  getSavedFirebaseConfig, 
  saveFirebaseConfig,
  resetDatabase
} from './services/firebase';
import { 
  getSavedGeminiKey, 
  saveGeminiKey 
} from './services/gemini';

// View components
import AdminDashboard from './components/AdminDashboard';
import PHCPortal from './components/PHCPortal';
import VoiceAssistant from './components/VoiceAssistant';
import HomePage from './components/HomePage';
import LoginModal from './components/LoginModal';
import CitizenPortal from './components/CitizenPortal';

export default function App() {
  // Current view: 'home' (public), or logged-in dashboard
  const [currentView, setCurrentView] = useState('home');
  const [userRole, setUserRole] = useState(null); // 'admin' | 'healthcenter' | 'citizen'
  const [loginModalRole, setLoginModalRole] = useState(null); // Which login modal to show

  const [activeTab, setActiveTab] = useState('dashboard');
  const [centers, setCenters] = useState([]);
  const [activeCenterId, setActiveCenterId] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings values
  const [geminiKeyInput, setGeminiKeyInput] = useState(getSavedGeminiKey());
  const [firebaseConfigInput, setFirebaseConfigInput] = useState(
    JSON.stringify(getSavedFirebaseConfig() || {}, null, 2)
  );
  
  const isLive = isFirebaseLive();
  const hasAIKey = !!getSavedGeminiKey();

  // 1. Seed database and subscribe to real-time changes
  useEffect(() => {
    // Seed Firestore if empty (only applies if Firebase is active)
    seedFirestoreIfEmpty();

    // Setup real-time listener for centers
    const unsubscribe = subscribeToCenters((centersData) => {
      setCenters(centersData);
      // Auto select first center if none selected
      if (centersData.length > 0 && !activeCenterId) {
        setActiveCenterId(centersData[0].id);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle login modal open
  const handleOpenLogin = (role) => {
    setLoginModalRole(role);
  };

  // Handle successful login
  const handleLoginSuccess = (role, formData) => {
    setUserRole(role);
    setLoginModalRole(null);
    setCurrentView('dashboard');
    
    // Set default active tab based on role
    if (role === 'admin') {
      setActiveTab('dashboard');
    } else if (role === 'healthcenter') {
      setActiveTab('portal');
    } else if (role === 'citizen') {
      setActiveTab('citizen');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentView('home');
    setUserRole(null);
    setActiveTab('dashboard');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    
    // Save Gemini key
    saveGeminiKey(geminiKeyInput);
    
    // Parse and save Firebase config
    try {
      if (firebaseConfigInput.trim() === "" || firebaseConfigInput.trim() === "{}") {
        saveFirebaseConfig(null);
      } else {
        const parsed = JSON.parse(firebaseConfigInput);
        saveFirebaseConfig(parsed);
      }
    } catch (err) {
      alert("Invalid Firebase Config JSON format. Please verify and try again.");
      return;
    }
    
    setShowSettings(false);
  };

  const handleResetDb = () => {
    if (window.confirm("Are you sure you want to reset the local database? This will clear all inventory and attendance modifications.")) {
      resetDatabase();
      alert("Database reset to initial mock data values.");
      setShowSettings(false);
    }
  };

  // Get role-specific display info
  const getRoleInfo = () => {
    switch (userRole) {
      case 'admin':
        return { label: 'District Administrator', icon: <Shield size={14} />, color: 'var(--status-normal)' };
      case 'healthcenter':
        return { label: 'Health Center Staff', icon: <Hospital size={14} />, color: 'var(--primary)' };
      case 'citizen':
        return { label: 'Citizen', icon: <Heart size={14} />, color: 'var(--status-success)' };
      default:
        return { label: 'User', icon: <Users size={14} />, color: 'var(--text-muted)' };
    }
  };

  // ======== HOMEPAGE VIEW ========
  if (currentView === 'home') {
    return (
      <>
        <HomePage onLogin={handleOpenLogin} />
        {loginModalRole && (
          <LoginModal
            role={loginModalRole}
            onClose={() => setLoginModalRole(null)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </>
    );
  }

  // ======== DASHBOARD VIEW (logged in) ========
  const roleInfo = getRoleInfo();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 1. Accessibility Top Bar */}
      <div className="gov-top-bar">
        <div className="gov-top-bar-inner">
          <div className="gov-top-bar-left">
            <span>राष्ट्रीय स्वास्थ्य मिशन | National Health Mission</span>
          </div>
          <div className="gov-top-bar-right">
            <a href="#main-content" className="gov-top-bar-link">Skip to Main Content</a>
            <div className="gov-accessibility-controls">
              <button className="gov-accessibility-btn" onClick={() => document.documentElement.style.fontSize = '14px'}>A-</button>
              <button className="gov-accessibility-btn" onClick={() => document.documentElement.style.fontSize = '16px'}>A</button>
              <button className="gov-accessibility-btn" onClick={() => document.documentElement.style.fontSize = '18px'}>A+</button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Official Logo Banner Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid var(--border-color)', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>🏛️</span>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>भारत सरकार | GOVERNMENT OF INDIA</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.2 }}>
                चिकित्सालय सेतु | Chikitsalay Setu
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Ministry of Health & Family Welfare • AI-Powered Health Center Supply Network
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <div style={{ textAlign: 'right' }}>
              <div>Digital India Portal</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 500 }}>राष्ट्रीय सूचना विज्ञान केंद्र (NIC)</div>
            </div>
            <span style={{ fontSize: '1.8rem' }}>🇮🇳</span>
          </div>
        </div>
      </header>

      {/* 3. Tricolor Ribbon */}
      <div className="tricolor-ribbon">
        <div className="tricolor-orange"></div>
        <div className="tricolor-white"></div>
        <div className="tricolor-green"></div>
      </div>

      {/* 4. App container splits into Sidebar and Main Content */}
      <div className="app-container" style={{ flexGrow: 1, display: 'flex' }}>
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <div className="logo-container" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🏥</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem', marginLeft: '6px' }}>Control Panel</span>
          </div>

        {/* Logged-in User Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: `${roleInfo.color}11`,
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${roleInfo.color}33`,
          marginBottom: '1.5rem',
          fontSize: '0.8rem'
        }}>
          <div style={{ color: roleInfo.color }}>{roleInfo.icon}</div>
          <div>
            <span style={{ fontWeight: 600, color: roleInfo.color, display: 'block' }}>
              {roleInfo.label}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Logged In
            </span>
          </div>
        </div>

        <nav className="nav-links">
          {/* Admin nav items */}
          {userRole === 'admin' && (
            <div 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>District Dashboard</span>
            </div>
          )}

          {/* Health Center nav items */}
          {userRole === 'healthcenter' && (
            <>
              <div 
                className={`nav-item ${activeTab === 'portal' ? 'active' : ''}`}
                onClick={() => setActiveTab('portal')}
              >
                <Hospital size={18} />
                <span>Health Facility Portal</span>
              </div>

              <div 
                className={`nav-item ${activeTab === 'voice' ? 'active' : ''}`}
                onClick={() => setActiveTab('voice')}
              >
                <Mic size={18} />
                <span>Voice Reporter</span>
              </div>
            </>
          )}

          {/* Citizen nav items */}
          {userRole === 'citizen' && (
            <div 
              className={`nav-item ${activeTab === 'citizen' ? 'active' : ''}`}
              onClick={() => setActiveTab('citizen')}
            >
              <MapPin size={18} />
              <span>Health Portal</span>
            </div>
          )}
        </nav>

        {/* Database & Gemini Status Badges (only for admin and healthcenter) */}
        {(userRole === 'admin' || userRole === 'healthcenter') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: isLive ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${isLive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
              fontSize: '0.75rem'
            }}>
              <Database size={12} color={isLive ? 'var(--status-success)' : 'var(--status-warning)'} />
              <div>
                <span style={{ fontWeight: 600, color: isLive ? 'var(--status-success)' : 'var(--status-warning)', display: 'block' }}>
                  {isLive ? 'Live Firestore DB' : 'Offline Local DB'}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {isLive ? 'Firestore Synced' : 'LocalStorage Cache'}
                </span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: hasAIKey ? 'rgba(187, 92, 45, 0.06)' : 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${hasAIKey ? 'var(--primary-glow)' : 'var(--border-color)'}`,
              fontSize: '0.75rem'
            }}>
              <Cpu size={12} color={hasAIKey ? 'var(--primary)' : 'var(--text-muted)'} />
              <div>
                <span style={{ fontWeight: 600, color: hasAIKey ? 'var(--primary)' : 'var(--text-muted)', display: 'block' }}>
                  {hasAIKey ? 'Gemini Live' : 'Gemini Sandbox'}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {hasAIKey ? '1.5 Flash Active' : 'Simulation Engine'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar settings button (admin and healthcenter only) */}
        {(userRole === 'admin' || userRole === 'healthcenter') && (
          <div 
            className={`nav-item ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(true)}
            style={{ marginTop: '0', border: '1px solid var(--border-color)' }}
          >
            <Settings size={18} />
            <span>System Setup</span>
          </div>
        )}

        {/* Logout / Home button */}
        <div
          className="nav-item"
          onClick={handleLogout}
          style={{ marginTop: '1rem', border: '1px solid var(--border-color)', color: 'var(--status-critical)' }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </div>

        <div className="sidebar-footer">
          Build with AI: Hackathon
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {activeTab === 'dashboard' && userRole === 'admin' && <AdminDashboard centers={centers} />}
        {activeTab === 'portal' && userRole === 'healthcenter' && (
          <PHCPortal 
            centers={centers} 
            activeCenterId={activeCenterId} 
            onCenterChange={setActiveCenterId} 
          />
        )}
        {activeTab === 'voice' && userRole === 'healthcenter' && (
          <VoiceAssistant 
            centers={centers} 
            activeCenterId={activeCenterId} 
          />
        )}
        {activeTab === 'citizen' && userRole === 'citizen' && (
          <CitizenPortal centers={centers} />
        )}
      </main>

      {/* Settings Modal Dialog Overlay */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 7, 12, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg), 0 0 30px rgba(187, 92, 45, 0.1)',
            padding: '2.5rem'
          }}>
            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-family-display)' }}>System & API Configuration</h2>
              <X 
                size={22} 
                style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
                onClick={() => setShowSettings(false)} 
              />
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Gemini key */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={14} color="var(--primary)" />
                  Google Gemini API Key
                </label>
                <input 
                  type="password" 
                  placeholder="Enter your AI Studio API Key..."
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Used to generate intelligent medicine forecasts, optimal redistribution, and speech translation. If blank, the app will run on simulated mock AI logs.
                </span>
              </div>

              {/* Firebase config JSON */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Database size={14} color="var(--status-warning)" />
                  Firebase Web Client Credentials (JSON)
                </label>
                <textarea 
                  rows={7}
                  placeholder={'{\n  "apiKey": "...",\n  "authDomain": "...",\n  "projectId": "..."\n}'}
                  value={firebaseConfigInput}
                  onChange={(e) => setFirebaseConfigInput(e.target.value)}
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.82rem', resize: 'vertical' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Paste the JSON SDK configuration snippet from your Firebase console to enable live real-time sync with Firestore. Leave as <code>{"{}"}</code> to use local web cache storage.
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flexGrow: 1, justifyContent: 'center' }}>
                  Save & Reload App
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleResetDb}
                  style={{ border: '1px solid var(--status-critical)', color: 'var(--status-critical)' }}
                >
                  Reset DB Data
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
