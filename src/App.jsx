import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Hospital,
  Mic,
  Settings,
  Database,
  X,
  Sparkles,
  LogOut,
  MapPin,
  Heart,
  Shield,
  Cloud,
} from 'lucide-react';
import {
  subscribeToCenters,
  isFirebaseLive,
  seedFirestoreIfEmpty,
  resetDatabase,
} from './services/firebase';
import { isAiBackendLive } from './services/gemini';
import { subscribeToAuth, signOut, seedDemoAccounts } from './services/auth';

import AdminDashboard from './components/AdminDashboard';
import PHCPortal from './components/PHCPortal';
import VoiceAssistant from './components/VoiceAssistant';
import HomePage from './components/HomePage';
import LoginModal from './components/LoginModal';
import CitizenPortal from './components/CitizenPortal';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginModalRole, setLoginModalRole] = useState(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [centers, setCenters] = useState([]);
  const [activeCenterId, setActiveCenterId] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [seedStatus, setSeedStatus] = useState('');

  const isLive = isFirebaseLive();
  const hasAiBackend = isAiBackendLive();
  const userRole = authUser?.role ?? null;

  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setAuthUser(user);
      setAuthLoading(false);
      if (user?.role) {
        setCurrentView('dashboard');
        if (user.role === 'admin') setActiveTab('dashboard');
        else if (user.role === 'healthcenter') {
          setActiveTab('portal');
          if (user.centerId) setActiveCenterId(user.centerId);
        } else if (user.role === 'citizen') setActiveTab('citizen');
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCenters((centersData) => {
      setCenters(centersData);
      if (centersData.length > 0 && !activeCenterId) {
        setActiveCenterId(centersData[0].id);
      }
    });
    return () => unsubscribe();
  }, []);

  const mainContentRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    mainContentRef.current?.scrollTo(0, 0);
  }, [currentView, activeTab]);

  const didSeedRef = useRef(false);
  useEffect(() => {
    // Seeding writes require elevated permissions; avoid running it on every app load,
    // and never before auth/profile is established.
    if (!isLive) return;
    if (didSeedRef.current) return;
    if (userRole !== 'admin') return;
    didSeedRef.current = true;
    seedFirestoreIfEmpty();
  }, [isLive, userRole]);

  useEffect(() => {
    if (authUser?.centerId) {
      setActiveCenterId(authUser.centerId);
    }
  }, [authUser?.centerId]);

  const handleOpenLogin = (role) => setLoginModalRole(role);

  const handleLoginSuccess = () => setLoginModalRole(null);

  const handleLogout = async () => {
    await signOut();
    setCurrentView('home');
    setActiveTab('dashboard');
  };

  const handleResetDb = () => {
    if (window.confirm('Reset local database to initial mock data?')) {
      resetDatabase();
      alert('Database reset to initial mock data values.');
      setShowSettings(false);
    }
  };

  const handleSeedDemo = async () => {
    setSeedStatus('Seeding...');
    try {
      const result = await seedDemoAccounts();
      setSeedStatus(`Seeded ${result.data.centersSeeded} centers and demo users.`);
    } catch (err) {
      setSeedStatus(err.message || 'Seed failed — deploy functions first.');
    }
  };

  const getRoleInfo = () => {
    switch (userRole) {
      case 'admin':
        return { label: 'District Administrator', icon: <Shield size={14} />, color: 'var(--status-normal)' };
      case 'healthcenter':
        return { label: 'Health Center Staff', icon: <Hospital size={14} />, color: 'var(--primary)' };
      case 'citizen':
        return { label: 'Citizen', icon: <Heart size={14} />, color: 'var(--status-success)' };
      default:
        return { label: 'User', icon: <Shield size={14} />, color: 'var(--text-muted)' };
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading Chikitsalay Setu...</p>
      </div>
    );
  }

  if (currentView === 'home' && !authUser) {
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

  const roleInfo = getRoleInfo();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="gov-top-bar">
        <div className="gov-top-bar-inner">
          <div className="gov-top-bar-left">
            <span>राष्ट्रीय स्वास्थ्य मिशन | National Health Mission</span>
          </div>
          <div className="gov-top-bar-right">
            <a href="#main-content" className="gov-top-bar-link">Skip to Main Content</a>
            <button type="button" className="gov-top-bar-logout" onClick={handleLogout}>
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="gov-top-bar-spacer" aria-hidden="true" />

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
          <span style={{ fontSize: '1.8rem' }}>🇮🇳</span>
        </div>
      </header>

      <div className="tricolor-ribbon">
        <div className="tricolor-orange" />
        <div className="tricolor-white" />
        <div className="tricolor-green" />
      </div>

      <div className="app-container" style={{ flexGrow: 1, display: 'flex' }}>
        <aside className="sidebar">
          <div className="logo-container" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🏥</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem', marginLeft: '6px' }}>Control Panel</span>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
            background: `${roleInfo.color}11`, borderRadius: 'var(--radius-md)',
            border: `1px solid ${roleInfo.color}33`, marginBottom: '1.5rem', fontSize: '0.8rem',
          }}>
            <div style={{ color: roleInfo.color }}>{roleInfo.icon}</div>
            <div>
              <span style={{ fontWeight: 600, color: roleInfo.color, display: 'block' }}>{roleInfo.label}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {authUser?.email || 'Authenticated Session'}
              </span>
            </div>
          </div>

          <nav className="nav-links">
            {userRole === 'admin' && (
              <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <LayoutDashboard size={18} />
                <span>District Dashboard</span>
              </div>
            )}
            {userRole === 'healthcenter' && (
              <>
                <div className={`nav-item ${activeTab === 'portal' ? 'active' : ''}`} onClick={() => setActiveTab('portal')}>
                  <Hospital size={18} />
                  <span>Health Facility Portal</span>
                </div>
                <div className={`nav-item ${activeTab === 'voice' ? 'active' : ''}`} onClick={() => setActiveTab('voice')}>
                  <Mic size={18} />
                  <span>Voice Reporter</span>
                </div>
              </>
            )}
            {userRole === 'citizen' && (
              <div className={`nav-item ${activeTab === 'citizen' ? 'active' : ''}`} onClick={() => setActiveTab('citizen')}>
                <MapPin size={18} />
                <span>Health Portal</span>
              </div>
            )}
          </nav>

          {(userRole === 'admin' || userRole === 'healthcenter') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                background: isLive ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isLive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                fontSize: '0.75rem',
              }}>
                <Database size={12} color={isLive ? 'var(--status-success)' : 'var(--status-warning)'} />
                <div>
                  <span style={{ fontWeight: 600, color: isLive ? 'var(--status-success)' : 'var(--status-warning)', display: 'block' }}>
                    {isLive ? 'Live Firestore DB' : 'Offline Local DB'}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {isLive ? 'Firebase Auth + Firestore' : 'LocalStorage Cache'}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                background: hasAiBackend ? 'rgba(187, 92, 45, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${hasAiBackend ? 'var(--primary-glow)' : 'var(--border-color)'}`,
                fontSize: '0.75rem',
              }}>
                <Cloud size={12} color={hasAiBackend ? 'var(--primary)' : 'var(--text-muted)'} />
                <div>
                  <span style={{ fontWeight: 600, color: hasAiBackend ? 'var(--primary)' : 'var(--text-muted)', display: 'block' }}>
                    {hasAiBackend ? 'Cloud Functions AI' : 'Local Simulation'}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {hasAiBackend ? 'Gemini via Cloud Functions' : 'Offline fallback engine'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {userRole === 'admin' && (
            <div
              className={`nav-item ${showSettings ? 'active' : ''}`}
              onClick={() => setShowSettings(true)}
              style={{ marginTop: '0', border: '1px solid var(--border-color)' }}
            >
              <Settings size={18} />
              <span>System Setup</span>
            </div>
          )}

          <div className="sidebar-footer">Build with AI: Hackathon</div>
        </aside>

        <main className="main-content" id="main-content" ref={mainContentRef}>
          {activeTab === 'dashboard' && userRole === 'admin' && <AdminDashboard centers={centers} />}
          {activeTab === 'portal' && userRole === 'healthcenter' && (
            <PHCPortal
              centers={centers}
              activeCenterId={activeCenterId}
              onCenterChange={setActiveCenterId}
              lockedCenterId={authUser?.centerId}
            />
          )}
          {activeTab === 'voice' && userRole === 'healthcenter' && (
            <VoiceAssistant centers={centers} activeCenterId={activeCenterId || authUser?.centerId} />
          )}
          {activeTab === 'citizen' && userRole === 'citizen' && <CitizenPortal centers={centers} />}
        </main>

        {showSettings && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 7, 12, 0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem' }}>System Setup</h2>
                <X size={22} style={{ cursor: 'pointer' }} onClick={() => setShowSettings(false)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Configure Firebase via <code>.env</code> (see <code>.env.example</code>). Gemini API keys are stored server-side in Cloud Functions secrets — never in the browser.
                </p>

                <button type="button" className="btn-primary" onClick={handleSeedDemo} style={{ justifyContent: 'center' }}>
                  <Sparkles size={16} />
                  Seed Demo Accounts & Data
                </button>
                {seedStatus && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{seedStatus}</p>}

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleResetDb}
                  style={{ border: '1px solid var(--status-critical)', color: 'var(--status-critical)' }}
                >
                  Reset Local DB Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
