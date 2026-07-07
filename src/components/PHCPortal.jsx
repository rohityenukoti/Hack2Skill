import React, { useState, useEffect } from 'react';
import { Save, Plus, Minus, UserCheck, Stethoscope, Bed, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { subscribeToInventory, updateCenterDetails, updateInventoryItem } from '../services/firebase';

export default function PHCPortal({ centers, activeCenterId, onCenterChange, lockedCenterId }) {
  const [selectedCenterId, setSelectedCenterId] = useState(lockedCenterId || activeCenterId || centers[0]?.id || "");
  const [inventory, setInventory] = useState([]);
  const [doctorsPresent, setDoctorsPresent] = useState(0);
  const [bedsOccupied, setBedsOccupied] = useState(0);
  const [bedsTotal, setBedsTotal] = useState(0);
  const [footfallToday, setFootfallToday] = useState(0);
  const [diagnosticTests, setDiagnosticTests] = useState({});
  const [saveStatus, setSaveStatus] = useState("");

  const activeCenter = centers.find(c => c.id === selectedCenterId) || centers[0];

  useEffect(() => {
    if (activeCenter) {
      setDoctorsPresent(activeCenter.doctors.present);
      setBedsOccupied(activeCenter.beds.occupied);
      setBedsTotal(activeCenter.beds.total);
      setFootfallToday(activeCenter.footfall.today);
      setDiagnosticTests(activeCenter.diagnosticTests || {});
      setSaveStatus("");
      
      // Subscribe to real-time inventory updates for this center
      const unsubscribe = subscribeToInventory(activeCenter.id, (invData) => {
        setInventory(invData);
      });
      return () => unsubscribe();
    }
  }, [selectedCenterId, activeCenter]);

  const handleCenterSelect = (e) => {
    const newId = e.target.value;
    setSelectedCenterId(newId);
    if (onCenterChange) {
      onCenterChange(newId);
    }
  };

  const handleStockChange = async (itemName, change) => {
    const item = inventory.find(i => i.name === itemName);
    if (!item) return;
    const newStock = Math.max(0, item.stock + change);
    await updateInventoryItem(selectedCenterId, itemName, { stock: newStock });
  };

  const handleItemValueChange = async (itemName, field, value) => {
    const parsedVal = Math.max(0, parseInt(value) || 0);
    await updateInventoryItem(selectedCenterId, itemName, { [field]: parsedVal });
  };

  const handleDiagTestChange = async (testName, checked) => {
    const updatedTests = { ...diagnosticTests, [testName]: checked };
    setDiagnosticTests(updatedTests);
    await updateCenterDetails(selectedCenterId, { diagnosticTests: updatedTests });
  };

  const handleSaveMetrics = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const success = await updateCenterDetails(selectedCenterId, {
        doctors: { ...activeCenter.doctors, present: Math.min(activeCenter.doctors.total, doctorsPresent) },
        beds: { ...activeCenter.beds, occupied: Math.min(bedsTotal, bedsOccupied), total: bedsTotal },
        footfall: { ...activeCenter.footfall, today: footfallToday }
      });
      if (success) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  };

  return (
    <div className="fade-in">
      <div className="top-bar">
        <div className="page-title">
          <h1>Health Center Portal</h1>
          <p>Update live logs for staff attendance, diagnostic audit, and supply chain inventory.</p>
        </div>
        
        <div className="controls-row">
          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Managing Facility:</label>
          {lockedCenterId ? (
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{activeCenter?.name}</span>
          ) : (
            <select value={selectedCenterId} onChange={handleCenterSelect} style={{ width: '220px' }}>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Left column: Center metrics & Diag audits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main metrics form */}
          <form className="glass-card" onSubmit={handleSaveMetrics}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color="var(--primary)" />
              Daily Operational Logs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Doctor Attendance */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Stethoscope size={16} color="var(--primary)" />
                    Doctors Present
                  </label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Max: {activeCenter?.doctors.total}
                  </span>
                </div>
                <input 
                  type="number" 
                  value={doctorsPresent} 
                  onChange={(e) => setDoctorsPresent(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  max={activeCenter?.doctors.total}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Bed Occupancy */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Bed size={16} color="var(--primary)" />
                    Beds Occupied
                  </label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Total capacity: {bedsTotal}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    value={bedsOccupied} 
                    onChange={(e) => setBedsOccupied(Math.max(0, parseInt(e.target.value) || 0))}
                    min={0}
                    style={{ flexGrow: 1 }}
                  />
                  <input 
                    type="number" 
                    value={bedsTotal} 
                    onChange={(e) => setBedsTotal(Math.max(1, parseInt(e.target.value) || 0))}
                    min={1}
                    placeholder="Total Capacity"
                    style={{ width: '80px' }}
                  />
                </div>
              </div>

              {/* Patient Footfall */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp size={16} color="var(--primary)" />
                  Patient Footfall Today
                </label>
                <input 
                  type="number" 
                  value={footfallToday} 
                  onChange={(e) => setFootfallToday(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  style={{ width: '100%' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={saveStatus === "saving"}
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              >
                <Save size={16} />
                {saveStatus === "saving" ? "Saving Logs..." : saveStatus === "success" ? "Logs Saved!" : "Save Daily Logs"}
              </button>
              
              {saveStatus === "success" && (
                <p style={{ color: 'var(--status-success)', fontSize: '0.8rem', textAlign: 'center', fontWeight: 600 }}>
                  Logs saved and pushed to Firestore database successfully.
                </p>
              )}
            </div>
          </form>

          {/* Diagnostic audits form */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.25rem' }}>Diagnostic Diagnostics Audit</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Check availability of equipment and testing kits at this center:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {Object.keys(diagnosticTests).map((test) => (
                <label key={test} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
                  <input
                    type="checkbox"
                    checked={diagnosticTests[test]}
                    onChange={(e) => handleDiagTestChange(test, e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{test}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Inventory Management */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Pharmacy & Medicine Supply Chain</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Real-time stocks inside the pharmacy. AI redistribution engine triggers alerts when levels drop below thresholds.
          </p>

          <div className="table-wrapper" style={{ flexGrow: 1 }}>
            <table>
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Current Stock</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Min Limit</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Daily Use</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const isOutOfStock = item.stock === 0;
                  const isLowStock = item.stock < item.minRequired;
                  
                  return (
                    <tr key={item.name}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          <button 
                            type="button"
                            onClick={() => handleStockChange(item.name, -10)}
                            style={{ background: 'var(--border-color)', border: 'none', color: '#fff', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Minus size={12} />
                          </button>
                          
                          <input 
                            type="number"
                            value={item.stock}
                            onChange={(e) => handleItemValueChange(item.name, 'stock', e.target.value)}
                            min={0}
                            style={{ width: '60px', textAlign: 'center', padding: '0.2rem 0.4rem' }}
                          />
                          
                          <button 
                            type="button"
                            onClick={() => handleStockChange(item.name, 10)}
                            style={{ background: 'var(--border-color)', border: 'none', color: '#fff', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number"
                          value={item.minRequired}
                          onChange={(e) => handleItemValueChange(item.name, 'minRequired', e.target.value)}
                          min={1}
                          style={{ width: '55px', textAlign: 'center', padding: '0.2rem 0.4rem' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number"
                          value={item.dailyUsage}
                          onChange={(e) => handleItemValueChange(item.name, 'dailyUsage', e.target.value)}
                          min={0.1}
                          step={0.5}
                          style={{ width: '55px', textAlign: 'center', padding: '0.2rem 0.4rem' }}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isOutOfStock ? (
                          <span className="badge critical" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={10} /> OUT
                          </span>
                        ) : isLowStock ? (
                          <span className="badge warning">LOW</span>
                        ) : (
                          <span className="badge success">SUFFICIENT</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
