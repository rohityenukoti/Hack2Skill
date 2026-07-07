import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Bed,
  Stethoscope,
  Activity,
  Star,
  Send,
  Search,
  Filter,
  Phone,
  Heart,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Sparkle,
  Thermometer,
  ShieldCheck
} from 'lucide-react';
import { saveFeedback, getFeedbackForCenter } from '../services/firebase';
import { translateCitizenPortalContent } from '../services/translation';
import { LANGUAGE_OPTIONS } from '../constants/languages';

const UI_STRINGS = {
  pageTitle: 'Citizen Health Portal',
  pageSubtitle: 'Find nearby health centers, check availability, and share your experience.',
  tabFind: 'Find Health Centers',
  tabFeedback: 'Give Feedback',
  tabSchemes: 'Health Schemes',
  searchPlaceholder: 'Search by center name or location...',
  filterAll: 'All Types',
  filterPhc: 'PHC Only',
  filterChc: 'CHC Only',
  statusAvailable: 'Available',
  statusBusy: 'Busy',
  statusOvercrowded: 'Overcrowded',
  statusUnknown: 'Unknown',
  bedsFree: 'Beds Free',
  doctors: 'Doctors',
  patientsToday: 'Patients Today',
  distance: 'Distance',
  diagnosticTests: 'Available Diagnostic Tests',
  rateCenter: 'Rate This Center',
  noResults: 'No health centers found matching your search.',
  feedbackTitle: 'Share Your Experience',
  feedbackSubtitle: 'Your feedback helps improve healthcare services for everyone in the district.',
  feedbackThanksTitle: 'Thank You for Your Feedback!',
  feedbackThanksBody: 'Your input helps us improve healthcare delivery across the district.',
  feedbackCenterLabel: 'Which center did you visit?',
  feedbackCenterPlaceholder: 'Select a health center...',
  feedbackNameLabel: 'Your Name (optional)',
  feedbackNamePlaceholder: 'Enter your name or leave blank for anonymous',
  feedbackRatingLabel: 'Overall Rating',
  feedbackRatingTap: 'Tap to rate',
  feedbackRatingPoor: 'Poor',
  feedbackRatingBelowAvg: 'Below Average',
  feedbackRatingAvg: 'Average',
  feedbackRatingGood: 'Good',
  feedbackRatingExcellent: 'Excellent',
  feedbackCategoriesLabel: 'What aspects are you rating? (select all that apply)',
  feedbackTextLabel: 'Detailed Feedback',
  feedbackTextPlaceholder: 'Share your experience in detail... What went well? What can be improved?',
  feedbackSubmit: 'Submit Feedback',
  recentFeedback: 'Recent Feedback for',
  noFeedbackYet: 'No feedback submitted for this center yet. Be the first to share your experience!',
  emergencyHelplines: 'Emergency Helplines',
  helplineHealth: 'Health Helpline',
  helplineAmbulance: 'Ambulance Service',
  helplineEmergency: 'Emergency Services',
  helplineWomen: 'Women Helpline',
  helplineChild: 'Child Helpline',
  helplineAyushman: 'Ayushman Bharat',
  translating: 'Translating...',
};

const FEEDBACK_CATEGORIES = [
  'Cleanliness',
  'Staff Behavior',
  'Medicine Availability',
  'Wait Time',
  'Facilities',
  'Overall Experience'
];

const HEALTH_SCHEMES = [
  {
    name: "Ayushman Bharat (PMJAY)",
    description: "Free treatment up to ₹5 lakh per family per year for secondary and tertiary hospitalization.",
    icon: <ShieldCheck size={24} />,
    color: "#0b4c8c"
  },
  {
    name: "Janani Suraksha Yojana",
    description: "Cash assistance for institutional deliveries to promote safe motherhood.",
    icon: <Heart size={24} />,
    color: "#b91c1c"
  },
  {
    name: "National Health Mission",
    description: "Strengthening rural health infrastructure, ensuring free drugs, diagnostics & ambulance services.",
    icon: <Activity size={24} />,
    color: "#15803d"
  },
  {
    name: "Rashtriya Bal Swasthya Karyakram",
    description: "Free health screening for children 0-18 years for 4Ds: Defects, Diseases, Deficiencies, Development Delays.",
    icon: <Thermometer size={24} />,
    color: "#d97706"
  }
];

export default function CitizenPortal({ centers }) {
  const [activeTab, setActiveTab] = useState('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCenter, setSelectedCenter] = useState(null);
  
  // Feedback state
  const [feedbackCenter, setFeedbackCenter] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackCategories, setFeedbackCategories] = useState([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackName, setFeedbackName] = useState('');
  const [language, setLanguage] = useState('en');
  const [ui, setUi] = useState(UI_STRINGS);
  const [translatedSchemes, setTranslatedSchemes] = useState(HEALTH_SCHEMES);
  const [translatedCategories, setTranslatedCategories] = useState(FEEDBACK_CATEGORIES);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    document.getElementById('main-content')?.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    if (language === 'en') {
      setUi(UI_STRINGS);
      setTranslatedSchemes(HEALTH_SCHEMES);
      setTranslatedCategories(FEEDBACK_CATEGORIES);
      setIsTranslating(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsTranslating(true);
      try {
        const result = await translateCitizenPortalContent(
          {
            uiStrings: UI_STRINGS,
            schemes: HEALTH_SCHEMES,
            categories: FEEDBACK_CATEGORIES,
          },
          language
        );

        if (cancelled) return;

        setUi(result.ui);
        setTranslatedSchemes(result.schemes);
        setTranslatedCategories(result.categories);
      } catch (error) {
        console.error('Citizen portal translation failed:', error);
        if (!cancelled) {
          setUi(UI_STRINGS);
          setTranslatedSchemes(HEALTH_SCHEMES);
          setTranslatedCategories(FEEDBACK_CATEGORIES);
        }
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    })();

    return () => { cancelled = true; };
  }, [language]);

  // Filter and search centers
  const filteredCenters = centers.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || center.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'normal': return 'var(--status-success)';
      case 'warning': return 'var(--status-warning)';
      case 'critical': return 'var(--status-critical)';
      default: return 'var(--status-normal)';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'normal': return ui.statusAvailable;
      case 'warning': return ui.statusBusy;
      case 'critical': return ui.statusOvercrowded;
      default: return ui.statusUnknown;
    }
  };

  const getDistanceEstimate = (center) => {
    // Simulated distances based on center data
    const distances = {
      'phc-narendra': '3.2 km',
      'phc-hebballi': '5.7 km',
      'chc-kalghatgi': '12.4 km',
      'phc-mugad': '4.1 km',
      'chc-kundgol': '18.6 km'
    };
    return distances[center.id] || `${(Math.random() * 15 + 2).toFixed(1)} km`;
  };

  const toggleFeedbackCategory = (cat) => {
    setFeedbackCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackCenter || feedbackRating === 0) return;

    const feedback = {
      centerId: feedbackCenter,
      centerName: centers.find(c => c.id === feedbackCenter)?.name || 'Unknown',
      rating: feedbackRating,
      text: feedbackText,
      categories: feedbackCategories,
      name: feedbackName || 'Anonymous Citizen',
      timestamp: new Date().toISOString()
    };

    await saveFeedback(feedbackCenter, feedback);
    setFeedbackSubmitted(true);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackRating(0);
      setFeedbackText('');
      setFeedbackCategories([]);
      setFeedbackName('');
    }, 3000);
  };

  return (
    <div className="fade-in">
      {/* Top Header */}
      <div className="top-bar">
        <div className="page-title">
          <h1>{ui.pageTitle}</h1>
          <p>{ui.pageSubtitle}</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="citizen-tabs" style={{ alignItems: 'center' }}>
        <button
          className={`citizen-tab ${activeTab === 'find' ? 'active' : ''}`}
          onClick={() => setActiveTab('find')}
        >
          <MapPin size={16} />
          {ui.tabFind}
        </button>
        <button
          className={`citizen-tab ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <Star size={16} />
          {ui.tabFeedback}
        </button>
        <button
          className={`citizen-tab ${activeTab === 'schemes' ? 'active' : ''}`}
          onClick={() => setActiveTab('schemes')}
        >
          <Heart size={16} />
          {ui.tabSchemes}
        </button>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
          aria-label="Select language"
          disabled={isTranslating}
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code}>{opt.label}</option>
          ))}
        </select>
        {isTranslating && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
            {ui.translating}
          </span>
        )}
      </div>

      {/* Tab: Find Centers */}
      {activeTab === 'find' && (
        <div className="citizen-find-section">
          {/* Search & Filter Bar */}
          <div className="citizen-search-bar">
            <div className="citizen-search-input-wrapper">
              <Search size={18} />
              <input
                type="text"
                placeholder={ui.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="citizen-search-input"
              />
            </div>
            <div className="citizen-filter-group">
              <Filter size={16} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="citizen-filter-select"
              >
                <option value="all">{ui.filterAll}</option>
                <option value="PHC">{ui.filterPhc}</option>
                <option value="CHC">{ui.filterChc}</option>
              </select>
            </div>
          </div>

          {/* Centers Grid */}
          <div className="citizen-centers-grid">
            {filteredCenters.map(center => {
              const bedsAvailable = center.beds.total - center.beds.occupied;
              const availableTests = Object.entries(center.diagnosticTests || {})
                .filter(([, available]) => available)
                .map(([name]) => name);

              return (
                <div
                  key={center.id}
                  className={`citizen-center-card glass-card ${selectedCenter?.id === center.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCenter(selectedCenter?.id === center.id ? null : center)}
                >
                  {/* Status indicator */}
                  <div className="citizen-center-status-bar" style={{ background: getStatusColor(center.status) }} />
                  
                  <div className="citizen-center-header">
                    <div>
                      <h3 className="citizen-center-name">{center.name}</h3>
                      <p className="citizen-center-location">
                        <MapPin size={13} /> {center.location}
                      </p>
                    </div>
                    <div className="citizen-center-meta">
                      <span className={`badge ${center.status}`}>{getStatusLabel(center.status)}</span>
                      <span className="citizen-center-type">{center.type}</span>
                    </div>
                  </div>

                  {/* Quick Stats Row */}
                  <div className="citizen-center-stats">
                    <div className="citizen-stat">
                      <Bed size={16} style={{ color: bedsAvailable > 0 ? 'var(--status-success)' : 'var(--status-critical)' }} />
                      <div>
                        <span className="citizen-stat-value">{bedsAvailable}</span>
                        <span className="citizen-stat-label">{ui.bedsFree}</span>
                      </div>
                    </div>
                    <div className="citizen-stat">
                      <Stethoscope size={16} style={{ color: center.doctors.present > 0 ? 'var(--status-success)' : 'var(--status-critical)' }} />
                      <div>
                        <span className="citizen-stat-value">{center.doctors.present}/{center.doctors.total}</span>
                        <span className="citizen-stat-label">{ui.doctors}</span>
                      </div>
                    </div>
                    <div className="citizen-stat">
                      <Users size={16} style={{ color: 'var(--primary)' }} />
                      <div>
                        <span className="citizen-stat-value">{center.footfall.today}</span>
                        <span className="citizen-stat-label">{ui.patientsToday}</span>
                      </div>
                    </div>
                    <div className="citizen-stat">
                      <MapPin size={16} style={{ color: 'var(--accent)' }} />
                      <div>
                        <span className="citizen-stat-value">{getDistanceEstimate(center)}</span>
                        <span className="citizen-stat-label">{ui.distance}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedCenter?.id === center.id && (
                    <div className="citizen-center-expanded fade-in">
                      <div className="citizen-center-divider" />
                      <h4 className="citizen-center-section-title">{ui.diagnosticTests}</h4>
                      <div className="citizen-tests-grid">
                        {Object.entries(center.diagnosticTests || {}).map(([test, available]) => (
                          <div key={test} className={`citizen-test-badge ${available ? 'available' : 'unavailable'}`}>
                            {available ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                            {test}
                          </div>
                        ))}
                      </div>
                      <div className="citizen-center-actions">
                        <button className="btn-primary citizen-action-btn" onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('feedback');
                          setFeedbackCenter(center.id);
                        }}>
                          <Star size={14} />
                          {ui.rateCenter}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredCenters.length === 0 && (
              <div className="citizen-no-results glass-card">
                <Search size={40} style={{ color: 'var(--text-muted)', strokeWidth: 1.5 }} />
                <p>{ui.noResults}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Feedback */}
      {activeTab === 'feedback' && (
        <div className="citizen-feedback-section">
          <div className="glass-card citizen-feedback-form-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Star size={20} style={{ color: 'var(--status-warning)' }} />
              {ui.feedbackTitle}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {ui.feedbackSubtitle}
            </p>

            {feedbackSubmitted ? (
              <div className="citizen-feedback-success fade-in">
                <CheckCircle size={48} style={{ color: 'var(--status-success)' }} />
                <h3>{ui.feedbackThanksTitle}</h3>
                <p>{ui.feedbackThanksBody}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="citizen-feedback-form">
                {/* Select Center */}
                <div className="login-field">
                  <label className="login-field-label">{ui.feedbackCenterLabel}</label>
                  <select
                    value={feedbackCenter}
                    onChange={(e) => setFeedbackCenter(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  >
                    <option value="">{ui.feedbackCenterPlaceholder}</option>
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                </div>

                {/* Name (optional) */}
                <div className="login-field">
                  <label className="login-field-label">{ui.feedbackNameLabel}</label>
                  <input
                    type="text"
                    placeholder={ui.feedbackNamePlaceholder}
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Star Rating */}
                <div className="login-field">
                  <label className="login-field-label">{ui.feedbackRatingLabel}</label>
                  <div className="citizen-star-rating">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`citizen-star ${star <= (feedbackHover || feedbackRating) ? 'active' : ''}`}
                        onClick={() => setFeedbackRating(star)}
                        onMouseEnter={() => setFeedbackHover(star)}
                        onMouseLeave={() => setFeedbackHover(0)}
                      >
                        <Star size={28} fill={star <= (feedbackHover || feedbackRating) ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                    <span className="citizen-rating-label">
                      {feedbackRating === 0 ? ui.feedbackRatingTap :
                       feedbackRating === 1 ? ui.feedbackRatingPoor :
                       feedbackRating === 2 ? ui.feedbackRatingBelowAvg :
                       feedbackRating === 3 ? ui.feedbackRatingAvg :
                       feedbackRating === 4 ? ui.feedbackRatingGood : ui.feedbackRatingExcellent}
                    </span>
                  </div>
                </div>

                {/* Category Tags */}
                <div className="login-field">
                  <label className="login-field-label">{ui.feedbackCategoriesLabel}</label>
                  <div className="citizen-category-tags">
                    {FEEDBACK_CATEGORIES.map((cat, index) => (
                      <button
                        key={cat}
                        type="button"
                        className={`citizen-category-tag ${feedbackCategories.includes(cat) ? 'active' : ''}`}
                        onClick={() => toggleFeedbackCategory(cat)}
                      >
                        {translatedCategories[index] || cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Feedback */}
                <div className="login-field">
                  <label className="login-field-label">{ui.feedbackTextLabel}</label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={ui.feedbackTextPlaceholder}
                    rows={4}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!feedbackCenter || feedbackRating === 0}
                  style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                >
                  <Send size={16} />
                  {ui.feedbackSubmit}
                </button>
              </form>
            )}
          </div>

          {/* Recent Feedback Display */}
          {feedbackCenter && (
            <div className="glass-card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} style={{ color: 'var(--primary)' }} />
                {ui.recentFeedback} {centers.find(c => c.id === feedbackCenter)?.name || 'Selected Center'}
              </h3>
              <FeedbackList centerId={feedbackCenter} emptyMessage={ui.noFeedbackYet} />
            </div>
          )}
        </div>
      )}

      {/* Tab: Health Schemes */}
      {activeTab === 'schemes' && (
        <div className="citizen-schemes-section">
          <div className="citizen-schemes-grid">
            {translatedSchemes.map((scheme, idx) => (
              <div key={idx} className="glass-card citizen-scheme-card">
                <div className="citizen-scheme-icon" style={{ color: scheme.color, background: `${scheme.color}22` }}>
                  {scheme.icon}
                </div>
                <h3 className="citizen-scheme-name">{scheme.name}</h3>
                <p className="citizen-scheme-description">{scheme.description}</p>
              </div>
            ))}
          </div>

          {/* Emergency Contacts */}
          <div className="glass-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={20} style={{ color: 'var(--status-critical)' }} />
              {ui.emergencyHelplines}
            </h3>
            <div className="citizen-helplines-grid">
              <div className="citizen-helpline-card">
                <span className="citizen-helpline-number">104</span>
                <span className="citizen-helpline-label">{ui.helplineHealth}</span>
              </div>
              <div className="citizen-helpline-card">
                <span className="citizen-helpline-number">108</span>
                <span className="citizen-helpline-label">{ui.helplineAmbulance}</span>
              </div>
              <div className="citizen-helpline-card">
                <span className="citizen-helpline-number">112</span>
                <span className="citizen-helpline-label">{ui.helplineEmergency}</span>
              </div>
              <div className="citizen-helpline-card">
                <span className="citizen-helpline-number">181</span>
                <span className="citizen-helpline-label">{ui.helplineWomen}</span>
              </div>
              <div className="citizen-helpline-card">
                <span className="citizen-helpline-number">1098</span>
                <span className="citizen-helpline-label">{ui.helplineChild}</span>
              </div>
              <div className="citizen-helpline-card">
                <span className="citizen-helpline-number">1800-180-1104</span>
                <span className="citizen-helpline-label">{ui.helplineAyushman}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Feedback list for a center
function FeedbackList({ centerId, emptyMessage }) {
  const feedbacks = getFeedbackForCenter(centerId);

  if (!feedbacks || feedbacks.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {feedbacks.slice(-5).reverse().map((fb, idx) => (
        <div key={idx} className="citizen-feedback-item">
          <div className="citizen-feedback-item-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong>{fb.name || 'Anonymous'}</strong>
              <div className="citizen-mini-stars">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={12} fill={s <= fb.rating ? 'var(--status-warning)' : 'none'} color={s <= fb.rating ? 'var(--status-warning)' : 'var(--text-muted)'} />
                ))}
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date(fb.timestamp).toLocaleDateString()}
            </span>
          </div>
          {fb.text && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>{fb.text}</p>}
          {fb.categories && fb.categories.length > 0 && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {fb.categories.map(cat => (
                <span key={cat} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'var(--primary-glow)', borderRadius: '4px', color: 'var(--primary)' }}>{cat}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
