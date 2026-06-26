import React, { useState, useEffect } from 'react';
import {
  Shield,
  Hospital,
  Users,
  Activity,
  BarChart3,
  Mic,
  Bed,
  Stethoscope,
  MapPin,
  Sparkles,
  ChevronRight,
  Phone,
  Heart,
  Megaphone,
  Globe,
  Clock,
  Zap,
  ArrowRight
} from 'lucide-react';

const PSA_ANNOUNCEMENTS = [
  { icon: "💉", text: "National Immunization Drive — July 2026: Free vaccinations for children under 5 at all PHCs" },
  { icon: "🫁", text: "Free TB Screening available at all Community Health Centres this month" },
  { icon: "📞", text: "Report medicine stock-outs instantly: Dial 104 or use Chikitsalay Setu" },
  { icon: "🦟", text: "Dengue Prevention: Remove stagnant water, use mosquito nets, and seek early treatment" },
  { icon: "🏥", text: "Ayushman Bharat — PMJAY: Free treatment up to ₹5 lakh per family per year for eligible households" },
  { icon: "🤰", text: "Janani Suraksha Yojana: Cash assistance for institutional deliveries at PHCs/CHCs" },
  { icon: "💊", text: "Jan Aushadhi Kendras: Quality generic medicines at affordable prices near your PHC" },
  { icon: "🧪", text: "Free diabetes & hypertension screening for all citizens above 30 years" }
];

const FEATURES = [
  {
    icon: <Activity size={28} />,
    title: "Real-Time Monitoring",
    description: "Live tracking of medicine stocks, bed occupancy, and doctor attendance across all PHCs and CHCs in the district."
  },
  {
    icon: <Sparkles size={28} />,
    title: "AI Demand Forecasting",
    description: "Gemini-powered predictive analytics generate early stock-out warnings and smart redistribution recommendations."
  },
  {
    icon: <Mic size={28} />,
    title: "Multilingual Voice Reporting",
    description: "Health workers can report in Hindi, Kannada, Telugu, or Tamil. AI translates and auto-updates records."
  },
  {
    icon: <Stethoscope size={28} />,
    title: "Staff & Bed Tracking",
    description: "Daily doctor attendance logs and real-time bed availability, automatically flagging understaffed centers."
  },
  {
    icon: <MapPin size={28} />,
    title: "Geospatial Dashboard",
    description: "Interactive district map showing center statuses, resource flow visualizations, and AI transit paths."
  },
  {
    icon: <Users size={28} />,
    title: "Citizen Feedback",
    description: "Citizens can find nearby PHCs, check availability, and rate their experience for transparent healthcare."
  }
];

const QUICK_STATS = [
  { value: "5+", label: "PHCs/CHCs Connected", icon: <Hospital size={20} /> },
  { value: "24/7", label: "Real-Time Monitoring", icon: <Clock size={20} /> },
  { value: "AI", label: "Gemini-Powered Insights", icon: <Zap size={20} /> },
  { value: "5+", label: "Languages Supported", icon: <Globe size={20} /> }
];

export default function HomePage({ onLogin }) {
  const [psaIndex, setPsaIndex] = useState(0);
  const [countersVisible, setCountersVisible] = useState(false);

  // Rotate PSAs every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPsaIndex(prev => (prev + 1) % PSA_ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Trigger counter animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setCountersVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="homepage">
      {/* 1. Accessibility Top Utility Bar */}
      <div className="gov-top-bar">
        <div className="gov-top-bar-inner">
          <div className="gov-top-bar-left">
            <span>राष्ट्रीय स्वास्थ्य मिशन | National Health Mission</span>
          </div>
          <div className="gov-top-bar-right">
            <a href="#features" className="gov-top-bar-link">Skip to Main Content</a>
            <div className="gov-accessibility-controls">
              <button className="gov-accessibility-btn" onClick={() => document.documentElement.style.fontSize = '14px'}>A-</button>
              <button className="gov-accessibility-btn" onClick={() => document.documentElement.style.fontSize = '16px'}>A</button>
              <button className="gov-accessibility-btn" onClick={() => document.documentElement.style.fontSize = '18px'}>A+</button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Bar */}
      <header className="home-navbar">
        <div className="home-navbar-inner">
          <div className="home-logo">
            <span style={{ fontSize: '2.2rem' }}>🏛️</span>
            <div>
              <span className="home-logo-text">Chikitsalay Setu</span>
              <span className="home-logo-sub">चिकित्सालय सेतु (Government of India)</span>
            </div>
          </div>
          <div className="home-nav-actions">
            <a href="#features" className="home-nav-link">Features</a>
            <a href="#announcements" className="home-nav-link">Announcements</a>
            <a href="#login" className="home-nav-link">Login</a>
            <div className="home-helpline">
              <Phone size={14} />
              <span>Emergency: <strong>108</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Tricolor Ribbon */}
      <div className="tricolor-ribbon">
        <div className="tricolor-orange"></div>
        <div className="tricolor-white"></div>
        <div className="tricolor-green"></div>
      </div>

      {/* Emergency Helpline Bar */}
      <div className="helpline-bar">
        <div className="helpline-bar-inner">
          <Phone size={16} />
          <span>Health Helpline: <strong>104</strong></span>
          <span className="helpline-separator">|</span>
          <span>Ambulance: <strong>108</strong></span>
          <span className="helpline-separator">|</span>
          <span>Women Helpline: <strong>181</strong></span>
          <span className="helpline-separator">|</span>
          <span>Child Helpline: <strong>1098</strong></span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Shield size={14} />
            <span>AI-Driven Health Infrastructure and Logistics Platform</span>
          </div>

          <h1 className="hero-title">
            Chikitsalay Setu
          </h1>
          <p className="hero-title-hindi">चिकित्सालय सेतु</p>
          <p className="hero-subtitle">
            Bridging Health Centers. Empowering Communities.<br />
            Real-time PHC/CHC management with AI-driven supply chain intelligence.
          </p>

          <div className="hero-cta-row">
            <button className="hero-cta-primary" onClick={() => document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' })}>
              Get Started
              <ArrowRight size={18} />
            </button>
            <button className="hero-cta-secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Features
            </button>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className={`stats-bar ${countersVisible ? 'visible' : ''}`}>
        {QUICK_STATS.map((stat, idx) => (
          <div key={idx} className="stat-item">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Government PSA Announcements */}
      <section className="psa-section" id="announcements">
        <div className="psa-header">
          <Megaphone size={22} />
          <h2>Government Health Announcements</h2>
        </div>
        <div className="psa-ticker-container">
          <div className="psa-ticker" key={psaIndex}>
            <span className="psa-icon">{PSA_ANNOUNCEMENTS[psaIndex].icon}</span>
            <p className="psa-text">{PSA_ANNOUNCEMENTS[psaIndex].text}</p>
          </div>
          <div className="psa-dots">
            {PSA_ANNOUNCEMENTS.map((_, idx) => (
              <button
                key={idx}
                className={`psa-dot ${idx === psaIndex ? 'active' : ''}`}
                onClick={() => setPsaIndex(idx)}
                aria-label={`Show announcement ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* PSA Cards Grid */}
        <div className="psa-cards-grid">
          {PSA_ANNOUNCEMENTS.slice(0, 4).map((psa, idx) => (
            <div key={idx} className="psa-card">
              <span className="psa-card-icon">{psa.icon}</span>
              <p className="psa-card-text">{psa.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-header">
          <h2 className="section-title">Platform Capabilities</h2>
          <p className="section-subtitle">End-to-end health center management powered by Google's Gemini AI</p>
        </div>

        <div className="features-grid">
          {FEATURES.map((feature, idx) => (
            <div key={idx} className="feature-card glass-card">
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Login Portal Cards */}
      <section className="login-section" id="login">
        <div className="section-header">
          <h2 className="section-title">Access Your Dashboard</h2>
          <p className="section-subtitle">Select your role to access the appropriate management portal</p>
        </div>

        <div className="login-cards-grid">
          {/* Administrator Card */}
          <div className="login-card admin-card" onClick={() => onLogin('admin')}>
            <div className="login-card-glow admin-glow" />
            <div className="login-card-icon admin-icon">
              <Shield size={36} />
            </div>
            <h3 className="login-card-title">Administrator</h3>
            <p className="login-card-subtitle">District Health Dashboard</p>
            <ul className="login-card-features">
              <li><ChevronRight size={14} /> District-wide analytics & KPIs</li>
              <li><ChevronRight size={14} /> AI-powered supply chain audit</li>
              <li><ChevronRight size={14} /> Geospatial health map</li>
              <li><ChevronRight size={14} /> Underperforming center alerts</li>
            </ul>
            <button className="login-card-btn admin-btn">
              Login as Administrator
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Health Center Card */}
          <div className="login-card hc-card" onClick={() => onLogin('healthcenter')}>
            <div className="login-card-glow hc-glow" />
            <div className="login-card-icon hc-icon">
              <Hospital size={36} />
            </div>
            <h3 className="login-card-title">Health Center Staff</h3>
            <p className="login-card-subtitle">PHC/CHC Operations Portal</p>
            <ul className="login-card-features">
              <li><ChevronRight size={14} /> Update inventory & stock levels</li>
              <li><ChevronRight size={14} /> Log doctor attendance & beds</li>
              <li><ChevronRight size={14} /> Voice reporting in local languages</li>
              <li><ChevronRight size={14} /> Diagnostic equipment audit</li>
            </ul>
            <button className="login-card-btn hc-btn">
              Login as Health Center
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Citizen Card */}
          <div className="login-card citizen-card" onClick={() => onLogin('citizen')}>
            <div className="login-card-glow citizen-glow" />
            <div className="login-card-icon citizen-icon">
              <Heart size={36} />
            </div>
            <h3 className="login-card-title">Citizen</h3>
            <p className="login-card-subtitle">Public Health Portal</p>
            <ul className="login-card-features">
              <li><ChevronRight size={14} /> Find nearby PHCs & CHCs</li>
              <li><ChevronRight size={14} /> Check bed & doctor availability</li>
              <li><ChevronRight size={14} /> Submit feedback & ratings</li>
              <li><ChevronRight size={14} /> Health schemes & helplines</li>
            </ul>
            <button className="login-card-btn citizen-btn">
              Login as Citizen
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">🏥</span>
            <div>
              <strong>Chikitsalay Setu</strong>
              <p>AI-Powered Health Center Management</p>
            </div>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Quick Links</h4>
              <a href="#features">Features</a>
              <a href="#announcements">Announcements</a>
              <a href="#login">Login</a>
            </div>
            <div className="footer-col">
              <h4>Emergency</h4>
              <p>Health Helpline: 104</p>
              <p>Ambulance: 108</p>
              <p>Women Helpline: 181</p>
            </div>
            <div className="footer-col">
              <h4>Government Programs</h4>
              <p>Ayushman Bharat (PMJAY)</p>
              <p>Janani Suraksha Yojana</p>
              <p>National Health Mission</p>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Built for <strong>Build with AI: Code for Communities</strong> Hackathon — Powered by Google Gemini AI & Firebase</p>
        </div>
      </footer>
    </div>
  );
}
