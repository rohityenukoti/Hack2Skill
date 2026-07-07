import React, { useState, useEffect, useRef } from 'react';
import {
  Hospital,
  Mic,
  Wrench,
  LogOut,
} from 'lucide-react';
import {
  subscribeToCenters,
  isFirebaseLive,
  seedFirestoreIfEmpty,
  resetDatabase,
} from './services/firebase';
import { isAiBackendLive } from './services/gemini';
import { subscribeToAuth, signOut, seedDemoAccounts } from './services/auth';
import { testCloudFunctions } from './services/api';

import AdminDashboard from './components/AdminDashboard';
import PHCPortal from './components/PHCPortal';
import VoiceAssistant from './components/VoiceAssistant';
import HomePage from './components/HomePage';
import LoginModal from './components/LoginModal';
import CitizenPortal from './components/CitizenPortal';
import DevToolsModal from './components/DevToolsModal';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginModalRole, setLoginModalRole] = useState(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [centers, setCenters] = useState([]);
  const [activeCenterId, setActiveCenterId] = useState('');
  const [showDevTools, setShowDevTools] = useState(false);
  const [seedStatus, setSeedStatus] = useState('');
  const [functionsTestStatus, setFunctionsTestStatus] = useState('');

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
      setShowDevTools(false);
    }
  };

  const handleSeedDemo = async () => {
    setSeedStatus('Seeding...');
    try {
      const result = await seedDemoAccounts();
      setSeedStatus(`Seeded ${result.data.centersSeeded} centers and demo users.`);
    } catch (err) {
      setSeedStatus(err.message || 'Seed failed — check Cloud Functions deploy and try again.');
    }
  };

  const handleTestFunctions = async () => {
    setFunctionsTestStatus('Testing Cloud Functions...');
    try {
      const result = await testCloudFunctions();
      const count = result?.languages?.length ?? 0;
      setFunctionsTestStatus(`Cloud Functions OK — ${count} languages available via asia-south1.`);
    } catch (err) {
      const code = err.code ? ` (${err.code})` : '';
      setFunctionsTestStatus(`Cloud Functions failed${code}: ${err.message}`);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="gov-top-bar">
        <div className="gov-top-bar-inner">
          <div className="gov-top-bar-left">
            <span>राष्ट्रीय स्वास्थ्य मिशन | National Health Mission</span>
          </div>
          <div className="gov-top-bar-right">
            <a href="#main-content" className="gov-top-bar-link">Skip to Main Content</a>
            {(userRole === 'admin' || userRole === 'healthcenter') && (
              <button
                type="button"
                className="gov-top-bar-devtools"
                onClick={() => setShowDevTools(true)}
                title="Open DevTools"
              >
                <Wrench size={14} />
                DevTools
              </button>
            )}
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

      <div className="app-container" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {userRole === 'healthcenter' && (
          <nav className="app-subnav" aria-label="Portal navigation">
            <div className="app-subnav-inner">
              <div
                className={`app-subnav-item ${activeTab === 'portal' ? 'active' : ''}`}
                onClick={() => setActiveTab('portal')}
              >
                <Hospital size={16} />
                <span>Health Facility Portal</span>
              </div>
              <div
                className={`app-subnav-item ${activeTab === 'voice' ? 'active' : ''}`}
                onClick={() => setActiveTab('voice')}
              >
                <Mic size={16} />
                <span>Voice Reporter</span>
              </div>
            </div>
          </nav>
        )}

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

        <DevToolsModal
          isOpen={showDevTools}
          onClose={() => setShowDevTools(false)}
          isLive={isLive}
          hasAiBackend={hasAiBackend}
          userRole={userRole}
          seedStatus={seedStatus}
          functionsTestStatus={functionsTestStatus}
          onTestFunctions={handleTestFunctions}
          onSeedDemo={handleSeedDemo}
          onResetDb={handleResetDb}
        />
      </div>
    </div>
  );
}
