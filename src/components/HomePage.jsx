import React, { useState, useEffect } from 'react';
import {
  Shield,
  Hospital,
  Users,
  Activity,
  Mic,
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
import { LANGUAGE_OPTIONS } from '../constants/languages';
import { translateHomePageContent } from '../services/translation';
import CustomSelect from './CustomSelect';

const UI_STRINGS = {
  topBarTitle: 'Chikitsalay Setu | चिकित्सालय सेतु',
  skipToMain: 'Skip to Main Content',
  logoSub: 'AI-Powered PHC/CHC Health Operations',
  navFeatures: 'Features',
  navAnnouncements: 'Announcements',
  navLogin: 'Login',
  navEmergency: 'Emergency',
  healthHelpline: 'Health Helpline',
  ambulance: 'Ambulance',
  womenHelpline: 'Women Helpline',
  childHelpline: 'Child Helpline',
  heroBadge: 'AI-Driven Health Infrastructure and Logistics Platform',
  heroTitle: 'Chikitsalay Setu',
  heroTitleHindi: 'चिकित्सालय सेतु',
  heroSubtitle: 'Bridging Health Centers. Empowering Communities.\nReal-time PHC/CHC management with AI-driven supply chain intelligence.',
  heroLoginPrompt: 'Sign in to get started',
  heroLoginAdmin: 'Administrator',
  heroLoginHealthCenter: 'Health Center',
  heroLoginCitizen: 'Citizen',
  exploreFeatures: 'Explore Features',
  govAnnouncements: 'Government Health Announcements',
  platformCapabilities: 'Platform Capabilities',
  platformSubtitle: "End-to-end health center management powered by Google's Gemini AI",
  accessDashboard: 'Access Your Dashboard',
  accessSubtitle: 'Select your role to access the appropriate management portal',
  translating: 'Translating...',
};

const FOOTER_STRINGS = {
  brandTagline: 'AI-Powered Health Center Management',
  quickLinks: 'Quick Links',
  emergency: 'Emergency',
  programs: 'Government Programs',
  healthHelplineLabel: 'Health Helpline: 104',
  ambulanceLabel: 'Ambulance: 108',
  womenHelplineLabel: 'Women Helpline: 181',
  program1: 'Ayushman Bharat (PMJAY)',
  program2: 'Janani Suraksha Yojana',
  program3: 'National Health Mission',
  copyright: 'Built for Build with AI: Code for Communities Hackathon — Powered by Google Gemini AI & Firebase',
};

const PSA_ANNOUNCEMENTS = [
  { icon: '💉', text: 'National Immunization Drive — July 2026: Free vaccinations for children under 5 at all PHCs' },
  { icon: '🫁', text: 'Free TB Screening available at all Community Health Centres this month' },
  { icon: '📞', text: 'Report medicine stock-outs instantly: Dial 104 or use Chikitsalay Setu' },
  { icon: '🦟', text: 'Dengue Prevention: Remove stagnant water, use mosquito nets, and seek early treatment' },
  { icon: '🏥', text: 'Ayushman Bharat — PMJAY: Free treatment up to ₹5 lakh per family per year for eligible households' },
  { icon: '🤰', text: 'Janani Suraksha Yojana: Cash assistance for institutional deliveries at PHCs/CHCs' },
  { icon: '💊', text: 'Jan Aushadhi Kendras: Quality generic medicines at affordable prices near your PHC' },
  { icon: '🧪', text: 'Free diabetes & hypertension screening for all citizens above 30 years' },
];

const FEATURES_SOURCE = [
  {
    Icon: Activity,
    title: 'Real-Time Monitoring',
    description: 'Live tracking of medicine stocks, bed occupancy, and doctor attendance across all PHCs and CHCs in the district.',
  },
  {
    Icon: Sparkles,
    title: 'AI Demand Forecasting',
    description: 'Gemini-powered predictive analytics generate early stock-out warnings and smart redistribution recommendations.',
  },
  {
    Icon: Mic,
    title: 'Multilingual Voice Reporting',
    description: 'Health workers can report in Hindi, Kannada, Telugu, or Tamil. AI translates and auto-updates records.',
  },
  {
    Icon: Stethoscope,
    title: 'Staff & Bed Tracking',
    description: 'Daily doctor attendance logs and real-time bed availability, automatically flagging understaffed centers.',
  },
  {
    Icon: MapPin,
    title: 'Geospatial Dashboard',
    description: 'Interactive district map showing center statuses, resource flow visualizations, and AI transit paths.',
  },
  {
    Icon: Users,
    title: 'Citizen Feedback',
    description: 'Citizens can find nearby PHCs, check availability, and rate their experience for transparent healthcare.',
  },
];

const QUICK_STATS_SOURCE = [
  { value: '5+', label: 'PHCs/CHCs Connected', icon: <Hospital size={20} /> },
  { value: '24/7', label: 'Real-Time Monitoring', icon: <Clock size={20} /> },
  { value: 'AI', label: 'Gemini-Powered Insights', icon: <Zap size={20} /> },
  { value: '5+', label: 'Languages Supported', icon: <Globe size={20} /> },
];

const LOGIN_CARDS_SOURCE = [
  {
    role: 'admin',
    title: 'Administrator',
    subtitle: 'District Health Dashboard',
    features: [
      'District-wide analytics & KPIs',
      'AI-powered supply chain audit',
      'Geospatial health map',
      'Underperforming center alerts',
    ],
    buttonLabel: 'Login as Administrator',
  },
  {
    role: 'healthcenter',
    title: 'Health Center Staff',
    subtitle: 'PHC/CHC Operations Portal',
    features: [
      'Update inventory & stock levels',
      'Log doctor attendance & beds',
      'Voice reporting in local languages',
      'Diagnostic equipment audit',
    ],
    buttonLabel: 'Login as Health Center',
  },
  {
    role: 'citizen',
    title: 'Citizen',
    subtitle: 'Public Health Portal',
    features: [
      'Find nearby PHCs & CHCs',
      'Check bed & doctor availability',
      'Submit feedback & ratings',
      'Health schemes & helplines',
    ],
    buttonLabel: 'Login as Citizen',
  },
];

const LOGIN_CARD_ICONS = {
  admin: Shield,
  healthcenter: Hospital,
  citizen: Heart,
};

const LOGIN_CARD_CLASSES = {
  admin: {
    card: 'admin-card',
    glow: 'admin-glow',
    icon: 'admin-icon',
    btn: 'admin-btn',
  },
  healthcenter: {
    card: 'hc-card',
    glow: 'hc-glow',
    icon: 'hc-icon',
    btn: 'hc-btn',
  },
  citizen: {
    card: 'citizen-card',
    glow: 'citizen-glow',
    icon: 'citizen-icon',
    btn: 'citizen-btn',
  },
};

export default function HomePage({ onLogin, language = 'en', onLanguageChange }) {
  const [psaIndex, setPsaIndex] = useState(0);
  const [countersVisible, setCountersVisible] = useState(false);
  const [ui, setUi] = useState(UI_STRINGS);
  const [psaAnnouncements, setPsaAnnouncements] = useState(PSA_ANNOUNCEMENTS);
  const [features, setFeatures] = useState(FEATURES_SOURCE);
  const [quickStats, setQuickStats] = useState(QUICK_STATS_SOURCE);
  const [loginCards, setLoginCards] = useState(LOGIN_CARDS_SOURCE);
  const [footer, setFooter] = useState(FOOTER_STRINGS);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPsaIndex((prev) => (prev + 1) % PSA_ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setCountersVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (language === 'en') {
      setUi(UI_STRINGS);
      setPsaAnnouncements(PSA_ANNOUNCEMENTS);
      setFeatures(FEATURES_SOURCE);
      setQuickStats(QUICK_STATS_SOURCE);
      setLoginCards(LOGIN_CARDS_SOURCE);
      setFooter(FOOTER_STRINGS);
      setIsTranslating(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsTranslating(true);
      try {
        const result = await translateHomePageContent(
          {
            uiStrings: UI_STRINGS,
            psaAnnouncements: PSA_ANNOUNCEMENTS,
            features: FEATURES_SOURCE,
            quickStats: QUICK_STATS_SOURCE,
            loginCards: LOGIN_CARDS_SOURCE,
            footer: FOOTER_STRINGS,
          },
          language
        );

        if (cancelled) return;

        setUi(result.ui);
        setPsaAnnouncements(result.psaAnnouncements);
        setFeatures(result.features);
        setQuickStats(result.quickStats);
        setLoginCards(result.loginCards);
        setFooter(result.footer);
      } catch (error) {
        console.error('Home page translation failed:', error);
        if (!cancelled) {
          setUi(UI_STRINGS);
          setPsaAnnouncements(PSA_ANNOUNCEMENTS);
          setFeatures(FEATURES_SOURCE);
          setQuickStats(QUICK_STATS_SOURCE);
          setLoginCards(LOGIN_CARDS_SOURCE);
          setFooter(FOOTER_STRINGS);
        }
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    })();

    return () => { cancelled = true; };
  }, [language]);

  const heroSubtitleLines = ui.heroSubtitle.split('\n');

  return (
    <div className="homepage">
      <div className="gov-top-bar">
        <div className="gov-top-bar-inner">
          <div className="gov-top-bar-left">
            <span>{ui.topBarTitle}</span>
          </div>
          <div className="gov-top-bar-right">
            <a href="#features" className="gov-top-bar-link">{ui.skipToMain}</a>
            <div className="gov-accessibility-controls">
              <CustomSelect
                className="gov-language-select"
                variant="dark"
                value={language}
                onChange={(code) => onLanguageChange?.(code)}
                ariaLabel="Select language"
                disabled={isTranslating}
                options={LANGUAGE_OPTIONS.map((opt) => ({
                  value: opt.code,
                  label: opt.label,
                }))}
              />
              {isTranslating && (
                <span className="gov-translating-label">{ui.translating}</span>
              )}
              <button className="gov-accessibility-btn" onClick={() => { document.documentElement.style.fontSize = '14px'; }}>A-</button>
              <button className="gov-accessibility-btn" onClick={() => { document.documentElement.style.fontSize = '16px'; }}>A</button>
              <button className="gov-accessibility-btn" onClick={() => { document.documentElement.style.fontSize = '18px'; }}>A+</button>
            </div>
          </div>
        </div>
      </div>
      <div className="gov-top-bar-spacer" aria-hidden="true" />

      <header className="home-navbar">
        <div className="home-navbar-inner">
          <div className="home-logo">
            <span style={{ fontSize: '2.2rem' }} aria-hidden="true">🏥</span>
            <div>
              <span className="home-logo-text">Chikitsalay Setu</span>
              <span className="home-logo-sub">{ui.logoSub}</span>
            </div>
          </div>
          <div className="home-nav-actions">
            <a href="#features" className="home-nav-link">{ui.navFeatures}</a>
            <a href="#announcements" className="home-nav-link">{ui.navAnnouncements}</a>
            <a href="#login" className="home-nav-link">{ui.navLogin}</a>
            <div className="home-helpline">
              <Phone size={14} />
              <span>{ui.navEmergency}: <strong>108</strong></span>
            </div>
          </div>
        </div>
      </header>

      <div className="tricolor-ribbon">
        <div className="tricolor-orange"></div>
        <div className="tricolor-white"></div>
        <div className="tricolor-green"></div>
      </div>

      <div className="helpline-bar">
        <div className="helpline-bar-inner">
          <Phone size={16} />
          <span>{ui.healthHelpline}: <strong>104</strong></span>
          <span className="helpline-separator">|</span>
          <span>{ui.ambulance}: <strong>108</strong></span>
          <span className="helpline-separator">|</span>
          <span>{ui.womenHelpline}: <strong>181</strong></span>
          <span className="helpline-separator">|</span>
          <span>{ui.childHelpline}: <strong>1098</strong></span>
        </div>
      </div>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Shield size={14} />
            <span>{ui.heroBadge}</span>
          </div>

          <h1 className="hero-title">{ui.heroTitle}</h1>
          <p className="hero-title-hindi">{ui.heroTitleHindi}</p>
          <p className="hero-subtitle">
            {heroSubtitleLines.map((line, index) => (
              <React.Fragment key={line}>
                {line}
                {index < heroSubtitleLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>

          <p className="hero-login-prompt">{ui.heroLoginPrompt}</p>
          <div className="hero-login-row" role="group" aria-label={ui.heroLoginPrompt}>
            <button
              type="button"
              className="hero-login-btn hero-login-admin"
              onClick={() => onLogin('admin')}
            >
              <Shield size={18} />
              <span>{ui.heroLoginAdmin}</span>
            </button>
            <button
              type="button"
              className="hero-login-btn hero-login-hc"
              onClick={() => onLogin('healthcenter')}
            >
              <Hospital size={18} />
              <span>{ui.heroLoginHealthCenter}</span>
            </button>
            <button
              type="button"
              className="hero-login-btn hero-login-citizen"
              onClick={() => onLogin('citizen')}
            >
              <Heart size={18} />
              <span>{ui.heroLoginCitizen}</span>
            </button>
          </div>
          <button
            type="button"
            className="hero-explore-link"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {ui.exploreFeatures}
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      <section className={`stats-bar ${countersVisible ? 'visible' : ''}`}>
        {quickStats.map((stat, idx) => (
          <div key={idx} className="stat-item">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="psa-section" id="announcements">
        <div className="psa-header">
          <Megaphone size={22} />
          <h2>{ui.govAnnouncements}</h2>
        </div>
        <div className="psa-ticker-container">
          <div className="psa-ticker" key={psaIndex}>
            <span className="psa-icon">{psaAnnouncements[psaIndex].icon}</span>
            <p className="psa-text">{psaAnnouncements[psaIndex].text}</p>
          </div>
          <div className="psa-dots">
            {psaAnnouncements.map((_, idx) => (
              <button
                key={idx}
                className={`psa-dot ${idx === psaIndex ? 'active' : ''}`}
                onClick={() => setPsaIndex(idx)}
                aria-label={`Show announcement ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="psa-cards-grid">
          {psaAnnouncements.slice(0, 4).map((psa, idx) => (
            <div key={idx} className="psa-card">
              <span className="psa-card-icon">{psa.icon}</span>
              <p className="psa-card-text">{psa.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="section-header">
          <h2 className="section-title">{ui.platformCapabilities}</h2>
          <p className="section-subtitle">{ui.platformSubtitle}</p>
        </div>

        <div className="features-grid">
          {features.map((feature, idx) => {
            const FeatureIcon = feature.Icon;
            return (
              <div key={idx} className="feature-card glass-card">
                <div className="feature-icon-wrapper">
                  <FeatureIcon size={28} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="login-section" id="login">
        <div className="section-header">
          <h2 className="section-title">{ui.accessDashboard}</h2>
          <p className="section-subtitle">{ui.accessSubtitle}</p>
        </div>

        <div className="login-cards-grid">
          {loginCards.map((card) => {
            const CardIcon = LOGIN_CARD_ICONS[card.role];
            const classes = LOGIN_CARD_CLASSES[card.role];
            return (
              <div
                key={card.role}
                className={`login-card ${classes.card}`}
                onClick={() => onLogin(card.role)}
              >
                <div className={`login-card-glow ${classes.glow}`} />
                <div className={`login-card-icon ${classes.icon}`}>
                  <CardIcon size={36} />
                </div>
                <h3 className="login-card-title">{card.title}</h3>
                <p className="login-card-subtitle">{card.subtitle}</p>
                <ul className="login-card-features">
                  {card.features.map((feature) => (
                    <li key={feature}>
                      <ChevronRight size={14} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button type="button" className={`login-card-btn ${classes.btn}`}>
                  {card.buttonLabel}
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">🏥</span>
            <div>
              <strong>Chikitsalay Setu</strong>
              <p>{footer.brandTagline}</p>
            </div>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>{footer.quickLinks}</h4>
              <a href="#features">{ui.navFeatures}</a>
              <a href="#announcements">{ui.navAnnouncements}</a>
              <a href="#login">{ui.navLogin}</a>
            </div>
            <div className="footer-col">
              <h4>{footer.emergency}</h4>
              <p>{footer.healthHelplineLabel}</p>
              <p>{footer.ambulanceLabel}</p>
              <p>{footer.womenHelplineLabel}</p>
            </div>
            <div className="footer-col">
              <h4>{footer.programs}</h4>
              <p>{footer.program1}</p>
              <p>{footer.program2}</p>
              <p>{footer.program3}</p>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
