import React, { useState } from 'react';
import { Mic, MicOff, Play, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { parseVoiceInput } from '../services/gemini';
import { updateInventoryItem, updateCenterDetails } from '../services/firebase';

const SPEECH_PRESETS = [
  {
    lang: "Hindi",
    label: "Inventory Stockout Report",
    text: "हमारे यहाँ आज पैरासिटामोल बिल्कुल खत्म हो गया है, तुरंत सप्लाई की जरुरत है।",
    translation: "We are completely out of Paracetamol here today, immediate supply is needed."
  },
  {
    lang: "Kannada",
    label: "Staff & Beds Alert",
    text: "ಪಿಎಚ್‌ಸಿ ಹೆಬ್ಬಳ್ಳಿಯಲ್ಲಿ ಇಂದು ವೈದ್ಯರು ಯಾರೂ ಬಂದಿಲ್ಲ, ಮತ್ತು ಎಲ್ಲಾ ಹಾಸಿಗೆಗಳು ಭರ್ತಿಯಾಗಿವೆ.",
    translation: "No doctors have come to PHC Hebballi today, and all beds are full."
  },
  {
    lang: "Hinglish",
    label: "Low Stock Alert (Hinglish)",
    text: "Sir, Insulin sirf do vials bache hain, minimum threshold ke bohot niche hai.",
    translation: "Sir, only two vials of Insulin are left, which is far below the minimum threshold."
  },
  {
    lang: "Telugu",
    label: "Beds Availability Update",
    text: "ఆసుపత్రిలో పడకలు అన్నీ ఖాళీ అయ్యాయి, ప్రస్తుతం 0 మంది రోగులు ఉన్నారు.",
    translation: "All beds in the hospital are empty, currently there are 0 patients."
  }
];

export default function VoiceAssistant({ centers, activeCenterId }) {
  const [selectedCenterId, setSelectedCenterId] = useState(activeCenterId || centers[0]?.id || "");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [appliedStatus, setAppliedStatus] = useState("");

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate speech finishing
      setTranscript("हमारे यहाँ आज पैरासिटामोल बिल्कुल खत्म हो गया है, तुरंत सप्लाई की जरुरत है।");
    } else {
      setIsRecording(true);
      setTranscript("Listening...");
      setAiResult(null);
      setAppliedStatus("");
      setTimeout(() => {
        setIsRecording(false);
        setTranscript("हमारे यहाँ आज पैरासिटामोल बिल्कुल खत्म हो गया है, तुरंत सप्लाई की जरुरत है।");
      }, 3500);
    }
  };

  const handlePresetClick = (preset) => {
    setTranscript(preset.text);
    setAiResult(null);
    setAppliedStatus("");
  };

  const handleAnalyze = async () => {
    if (!transcript || transcript === "Listening...") return;
    setIsAnalyzing(true);
    setAiResult(null);
    setAppliedStatus("");

    const center = centers.find(c => c.id === selectedCenterId);
    const centerName = center ? center.name : "Health Center";

    try {
      const result = await parseVoiceInput(transcript, centerName);
      setAiResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyUpdate = async () => {
    if (!aiResult) return;
    setAppliedStatus("applying");

    const center = centers.find(c => c.id === selectedCenterId);
    if (!center) {
      setAppliedStatus("error");
      return;
    }

    try {
      if (aiResult.operation === "update" && aiResult.itemName) {
        // Find if item exists or update directly
        await updateInventoryItem(selectedCenterId, aiResult.itemName, { stock: aiResult.quantity });
        setAppliedStatus("success");
      } else if (aiResult.operation === "staff") {
        await updateCenterDetails(selectedCenterId, {
          doctors: { ...center.doctors, present: aiResult.quantity }
        });
        setAppliedStatus("success");
      } else if (aiResult.operation === "bed") {
        await updateCenterDetails(selectedCenterId, {
          beds: { ...center.beds, occupied: aiResult.quantity }
        });
        setAppliedStatus("success");
      } else {
        setAppliedStatus("error");
      }
    } catch (error) {
      console.error(error);
      setAppliedStatus("error");
    }
  };

  return (
    <div className="fade-in">
      <div className="top-bar">
        <div className="page-title">
          <h1>Multilingual Voice Intake Assistant</h1>
          <p>Update records in real-time using speech input in local regional languages.</p>
        </div>
      </div>

      <div className="voice-grid">
        {/* Input Card */}
        <div className="glass-card mic-section">
          <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-family-display)' }}>Record / Input Statement</h3>
          
          <div style={{ marginBottom: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reporting Health Center</label>
            <select 
              value={selectedCenterId} 
              onChange={(e) => setSelectedCenterId(e.target.value)}
              style={{ width: '100%' }}
            >
              {centers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleMicClick}
            className={`mic-button ${isRecording ? 'recording' : ''}`}
          >
            {isRecording ? <MicOff /> : <Mic />}
          </button>
          
          <p style={{ color: isRecording ? 'var(--status-critical)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {isRecording ? "RECORDING LIVE AUDIO... SPEAK NOW" : "Click microphone to simulate voice recording"}
          </p>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Voice transcript will appear here, or you can type directly in Hindi, Kannada, Telugu, Tamil, or Hinglish..."
            style={{ width: '100%', height: '100px', resize: 'none', marginBottom: '1.5rem' }}
          />

          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <button 
              className="btn-primary" 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !transcript || transcript === "Listening..."}
              style={{ flexGrow: 1, justifyContent: 'center' }}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="spin" style={{ animation: 'spin 1s infinite linear' }} size={16} />
                  AI Translating & Analyzing...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Process & Translate Report
                </>
              )}
            </button>
          </div>

          <div style={{ marginTop: '2rem', width: '100%', textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Demo Preset Speech Prompts</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {SPEECH_PRESETS.map((preset, idx) => (
                <div 
                  key={idx} 
                  className="speech-preset"
                  onClick={() => handlePresetClick(preset)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="speech-tag">{preset.lang}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{preset.label}</span>
                  </div>
                  <p style={{ fontWeight: 500, margin: '0.25rem 0' }}>"{preset.text}"</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Trans: {preset.translation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-family-display)' }}>AI Processing & Actions</h3>
          
          {!aiResult && !isAnalyzing && (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              <AlertCircle size={48} style={{ strokeWidth: 1.5, marginBottom: '1rem', color: 'var(--primary-glow)' }} />
              <p>No report processed yet. Record audio or click one of the quick presets, then click <strong>Process & Translate Report</strong>.</p>
            </div>
          )}

          {isAnalyzing && (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div className="pulse-loader" style={{ marginBottom: '1rem' }} />
              <p>Gemini AI is parsing the regional audio transcript...</p>
            </div>
          )}

          {aiResult && (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'hsla(222, 47%, 14%, 0.4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <div style={{ flexGrow: 1 }}>
                  <span className="badge normal" style={{ marginBottom: '0.5rem' }}>Original Transcript</span>
                  <p style={{ fontWeight: 600 }}>"{aiResult.detectedText}"</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'hsla(187, 92%, 45%, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary-glow)', marginBottom: '1.5rem' }}>
                <div>
                  <span className="badge success" style={{ marginBottom: '0.5rem' }}>AI English Translation</span>
                  <p style={{ color: 'var(--primary)', fontWeight: 500 }}>{aiResult.translatedText}</p>
                </div>
              </div>

              <h4 style={{ marginBottom: '1rem', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Extracted Database Commands</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1, marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OPERATION TYPE</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>
                      {aiResult.operation === "update" ? "Stock Update" : aiResult.operation === "staff" ? "Staff Log" : aiResult.operation === "bed" ? "Bed Status" : "Unknown"}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EXTRACTION CONFIDENCE</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--status-success)' }}>
                      {Math.round(aiResult.confidence * 100)}%
                    </p>
                  </div>
                </div>

                {aiResult.operation === "update" && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ITEM NAME</span>
                        <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{aiResult.itemName || "Unknown"}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NEW STOCK QUANTITY</span>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: aiResult.quantity === 0 ? 'var(--status-critical)' : 'var(--text-main)' }}>{aiResult.quantity} units</p>
                      </div>
                    </div>
                  </div>
                )}

                {aiResult.operation === "staff" && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ROLE LOGGED</span>
                        <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Doctor Attendance</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DOCTORS PRESENT</span>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: aiResult.quantity === 0 ? 'var(--status-critical)' : 'var(--text-main)' }}>{aiResult.quantity}</p>
                      </div>
                    </div>
                  </div>
                )}

                {aiResult.operation === "bed" && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>METRIC</span>
                        <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Bed Occupancy</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BEDS OCCUPIED</span>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{aiResult.quantity}</p>
                      </div>
                    </div>
                  </div>
                )}

                {aiResult.operation === "unknown" && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--status-critical)', color: 'var(--status-critical)' }}>
                    <p style={{ fontWeight: 600 }}>Action unrecognized. AI was unable to parse a specific supply or staff action from this statement. Please check the text and try again.</p>
                  </div>
                )}
              </div>

              {aiResult.operation !== "unknown" && (
                <button 
                  className="btn-primary" 
                  onClick={handleApplyUpdate}
                  disabled={appliedStatus === "applying" || appliedStatus === "success"}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {appliedStatus === "applying" ? (
                    <>
                      <RefreshCw className="spin" style={{ animation: 'spin 1s infinite linear' }} size={18} />
                      Updating Database...
                    </>
                  ) : appliedStatus === "success" ? (
                    <>
                      <Check size={18} />
                      Database Updated Live!
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Confirm & Commit to Live Database
                    </>
                  )}
                </button>
              )}

              {appliedStatus === "success" && (
                <p style={{ color: 'var(--status-success)', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem', textAlign: 'center' }}>
                  The real-time database has been updated. Switch to the Admin Dashboard to see changes instantly!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
