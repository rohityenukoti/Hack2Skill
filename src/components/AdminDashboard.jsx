import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Sparkles, RefreshCw, AlertOctagon, TrendingUp, AlertTriangle, ArrowRightLeft, Users, ShieldAlert, Check, Activity, Database } from 'lucide-react';
import InteractiveMap from './InteractiveMap';
import { generateForecastingAndRedistribution } from '../services/gemini';
import { subscribeToInventory, updateInventoryItem } from '../services/firebase';
import { callSyncToBigQuery, isCloudFunctionsAvailable } from '../services/api';

function groupAlertsByCenter(alerts, centers) {
  const grouped = {};

  alerts.forEach((alert) => {
    const centerId = alert.centerId;
    if (!grouped[centerId]) {
      const center = centers.find((c) => c.id === centerId);
      grouped[centerId] = {
        centerId,
        centerName: center?.name || 'Unknown Facility',
        centerType: center?.type || '',
        severity: 'warning',
        issues: [],
      };
    }
    if (alert.type === 'critical') grouped[centerId].severity = 'critical';
    grouped[centerId].issues.push({
      type: alert.type,
      summary: alert.title,
      detail: alert.message,
    });
  });

  return Object.values(grouped).sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    return a.centerName.localeCompare(b.centerName);
  });
}

export default function AdminDashboard({ centers }) {
  const [inventories, setInventories] = useState({});
  const [aiData, setAiData] = useState(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [executingTransferId, setExecutingTransferId] = useState(null);
  const [bqSyncStatus, setBqSyncStatus] = useState('');
  const hasAutoRunAudit = useRef(false);
  const interventionsSectionRef = useRef(null);

  const handleMapCenterClick = useCallback((center, { isOpening = true, source = 'marker' } = {}) => {
    setSelectedCenter(center);
    if (isOpening || source === 'tooltip') {
      interventionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Subscribe to all center inventories
  useEffect(() => {
    const unsubscribes = centers.map(center => {
      return subscribeToInventory(center.id, (invData) => {
        setInventories(prev => ({
          ...prev,
          [center.id]: invData
        }));
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [centers]);

  // Aggregate metrics
  const totalBeds = centers.reduce((sum, c) => sum + c.beds.total, 0);
  const occupiedBeds = centers.reduce((sum, c) => sum + c.beds.occupied, 0);
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const totalDoctors = centers.reduce((sum, c) => sum + c.doctors.total, 0);
  const presentDoctors = centers.reduce((sum, c) => sum + c.doctors.present, 0);
  const doctorRate = totalDoctors > 0 ? Math.round((presentDoctors / totalDoctors) * 100) : 0;

  const totalFootfall = centers.reduce((sum, c) => sum + c.footfall.today, 0);

  // Calculate low stock warnings
  let lowStockCount = 0;
  let criticalStockCount = 0;
  Object.keys(inventories).forEach(cId => {
    const inv = inventories[cId] || [];
    inv.forEach(item => {
      if (item.stock === 0) criticalStockCount++;
      else if (item.stock < item.minRequired) lowStockCount++;
    });
  });

  const handleRunAI = useCallback(async () => {
    if (isLoadingAI) return;
    setIsLoadingAI(true);
    try {
      const data = await generateForecastingAndRedistribution(centers, inventories);
      setAiData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAI(false);
    }
  }, [centers, inventories, isLoadingAI]);

  useEffect(() => {
    if (hasAutoRunAudit.current || centers.length === 0) return;
    if (Object.keys(inventories).length < centers.length) return;

    hasAutoRunAudit.current = true;
    handleRunAI();
  }, [centers, inventories, handleRunAI]);

  const handleExecuteRedistribution = async (idx, transfer) => {
    setExecutingTransferId(idx);
    try {
      const donorInv = inventories[transfer.fromId] || [];
      const recipientInv = inventories[transfer.toId] || [];
      
      const donorItem = donorInv.find(i => i.name === transfer.itemName);
      const recipientItem = recipientInv.find(i => i.name === transfer.itemName);

      if (donorItem && recipientItem) {
        // 1. Subtract from donor
        await updateInventoryItem(transfer.fromId, transfer.itemName, {
          stock: Math.max(0, donorItem.stock - transfer.quantity)
        });
        // 2. Add to recipient
        await updateInventoryItem(transfer.toId, transfer.itemName, {
          stock: recipientItem.stock + transfer.quantity
        });

        // 3. Mark transfer as executed in local UI state
        setAiData(prev => {
          if (!prev) return null;
          const updatedRedist = [...prev.redistributions];
          updatedRedist.splice(idx, 1); // remove completed transfer
          
          // Re-generate critical alerts locally
          const updatedAlerts = prev.alerts.filter(a => !(a.centerId === transfer.toId && a.message.includes(transfer.itemName)));
          
          return {
            ...prev,
            redistributions: updatedRedist,
            alerts: updatedAlerts
          };
        });
      }
    } catch (err) {
      console.error("Redistribution failed:", err);
    } finally {
      setExecutingTransferId(null);
    }
  };

  const handleSyncBigQuery = async () => {
    if (!isCloudFunctionsAvailable()) {
      setBqSyncStatus('Cloud Functions unavailable');
      return;
    }
    setBqSyncStatus('Syncing to BigQuery...');
    try {
      const result = await callSyncToBigQuery();
      setBqSyncStatus(`Synced ${result.centersSynced} centers, ${result.inventorySynced} inventory rows`);
    } catch (err) {
      setBqSyncStatus(err.message || 'BigQuery sync failed');
    }
  };

  const groupedAlerts = useMemo(
    () => (aiData?.alerts ? groupAlertsByCenter(aiData.alerts, centers) : []),
    [aiData?.alerts, centers]
  );

  const renderTransfersPanel = () => {
    if (isLoadingAI) {
      return (
        <div className="ai-pill-loading">
          <div className="pulse-loader" />
          <p>Computing redistribution paths...</p>
        </div>
      );
    }

    if (!aiData) {
      return (
        <div className="insight-empty-state">
          <Sparkles size={20} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
          <p>Run Gemini AI Audit to see transfer suggestions.</p>
        </div>
      );
    }

    if (!aiData.redistributions?.length) {
      return (
        <div className="insight-empty-state">
          No redistribution actions needed. Supplies are balanced.
        </div>
      );
    }

    return (
      <div className="transfer-items-list">
        {aiData.redistributions.map((redist, idx) => (
          <div key={idx} className="insight-card success-insight transfer-item-card">
            <div className="insight-card-header">
              <span className="insight-card-label">{redist.itemName}</span>
              <span className={`badge ${redist.urgency === 'High' ? 'critical' : 'warning'}`} style={{ fontSize: '0.65rem' }}>
                {redist.urgency}
              </span>
            </div>
            <p className="insight-card-title">
              {redist.quantity} units
            </p>
            <p className="insight-text transfer-route">
              <strong>{redist.fromName}</strong> ➔ <strong>{redist.toName}</strong>
              <span className="transfer-distance">{redist.distanceEstimate}</span>
            </p>
            <button
              className="insight-action-btn"
              disabled={executingTransferId === idx}
              onClick={() => handleExecuteRedistribution(idx, redist)}
            >
              {executingTransferId === idx ? (
                <>
                  <RefreshCw className="spin" size={10} />
                  Transferring...
                </>
              ) : (
                <>
                  <Check size={10} />
                  Execute
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fade-in">
      {/* Top Header */}
      <div className="top-bar">
        <div className="page-title">
          <h1>District Control Center</h1>
          <p>Real-time analytics and predictive AI supply chain oversight for health centers.</p>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleRunAI} 
          disabled={isLoadingAI}
        >
          {isLoadingAI ? (
            <>
              <RefreshCw className="spin" style={{ animation: 'spin 1s infinite linear' }} size={16} />
              Running Audit...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Trigger Gemini AI Audit
            </>
          )}
        </button>

        <button
          className="btn-secondary"
          onClick={handleSyncBigQuery}
          style={{ marginLeft: '0.5rem' }}
        >
          <Database size={16} />
          Sync to BigQuery
        </button>
      </div>
      {bqSyncStatus && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{bqSyncStatus}</p>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: 'var(--status-normal)', background: 'rgba(59,130,246,0.1)' }}>
            <Users size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Patient Footfall</span>
            <span className="kpi-value">{totalFootfall}</span>
            <span className="kpi-trend up">Live updates</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ 
            color: occupancyRate > 85 ? 'var(--status-critical)' : occupancyRate > 70 ? 'var(--status-warning)' : 'var(--status-success)',
            background: occupancyRate > 85 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'
          }}>
            <TrendingUp size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Bed Occupancy</span>
            <span className="kpi-value">{occupancyRate}%</span>
            <span className="kpi-trend warn">{occupiedBeds} / {totalBeds} occupied</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ 
            color: doctorRate < 50 ? 'var(--status-critical)' : 'var(--status-success)',
            background: doctorRate < 50 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'
          }}>
            <Users size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Staff Presence</span>
            <span className="kpi-value">{doctorRate}%</span>
            <span className="kpi-trend down">{presentDoctors} / {totalDoctors} present</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ 
            color: criticalStockCount > 0 ? 'var(--status-critical)' : lowStockCount > 0 ? 'var(--status-warning)' : 'var(--status-success)',
            background: criticalStockCount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'
          }}>
            <AlertTriangle size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Stockout Warnings</span>
            <span className="kpi-value" style={{ color: criticalStockCount > 0 ? 'var(--status-critical)' : 'inherit' }}>
              {criticalStockCount + lowStockCount}
            </span>
            <span className="kpi-trend down" style={{ color: 'var(--status-critical)' }}>
              {criticalStockCount} critical stock-outs
            </span>
          </div>
        </div>
      </div>

      {/* Map + Transfer Suggestions side by side */}
      <div className="dashboard-grid map-transfers-grid">
        <div className="glass-card map-card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--primary)" />
            District Geospatial Health Map
          </h3>
          <InteractiveMap 
            centers={centers} 
            redistributions={aiData?.redistributions || []}
            onCenterClick={handleMapCenterClick}
          />
        </div>

        <div className="glass-card insight-section-box section-transfers transfers-panel">
          <div className="insight-section-header">
            <ArrowRightLeft size={16} />
            <span>Smart Transfer Suggestions</span>
            {aiData?.redistributions?.length > 0 && (
              <span className="insight-section-count">{aiData.redistributions.length}</span>
            )}
          </div>
          <div className="transfers-panel-body">
            {renderTransfersPanel()}
          </div>
        </div>
      </div>

      {/* Gemini AI Insights — alerts & intervention briefs */}
      <div className="ai-insights-wrapper">
        <div className="ai-header">
          <h3 className="ai-title">
            <Sparkles size={20} style={{ filter: 'drop-shadow(0 0 5px var(--primary-glow))' }} />
            Gemini Logistics Insights
          </h3>
          {aiData?.isMock && (
            <span className="badge warning" style={{ fontSize: '0.65rem' }}>Simulated</span>
          )}
        </div>

        {isLoadingAI ? (
          <div className="glass-card insight-section-box">
            <div className="ai-pill-loading">
              <div className="pulse-loader" />
              <p>Generating logistics forecasts...</p>
            </div>
          </div>
        ) : aiData ? (
          <div className="ai-insights-grid">
            {/* Urgent Flags — grouped by PHC */}
            {groupedAlerts.length > 0 && (
              <div className="glass-card insight-section-box section-alerts">
                <div className="insight-section-header">
                  <AlertTriangle size={16} />
                  <span>Low Stock & Urgent Flags</span>
                  <span className="insight-section-count">{groupedAlerts.length} PHCs</span>
                </div>
                <div className="phc-alerts-grid">
                  {groupedAlerts.map((group) => (
                    <div
                      key={group.centerId}
                      className={`phc-alert-card ${group.severity === 'critical' ? 'critical-insight' : 'warning-insight'}`}
                    >
                      <div className="phc-alert-header">
                        <span className="phc-alert-name">{group.centerName}</span>
                        <span className={`badge ${group.severity === 'critical' ? 'critical' : 'warning'}`} style={{ fontSize: '0.62rem' }}>
                          {group.issues.length} issue{group.issues.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <ul className="phc-alert-issues">
                        {group.issues.map((issue, idx) => (
                          <li key={idx} className={`phc-alert-issue phc-alert-issue--${issue.type}`}>
                            {issue.summary}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Underperforming Centers */}
            {aiData.underperformingCenters && aiData.underperformingCenters.length > 0 && (
              <div className="glass-card insight-section-box section-underperforming">
                <div className="insight-section-header">
                  <ShieldAlert size={16} />
                  <span>Intervention Briefs</span>
                  <span className="insight-section-count">{aiData.underperformingCenters.length}</span>
                </div>
                <div className="insight-items-grid">
                  {aiData.underperformingCenters.map((item, idx) => (
                    <div key={idx} className="insight-card critical-insight">
                      <div className="insight-card-header">
                        <span>{item.centerName}</span>
                        <span className="badge critical" style={{ fontSize: '0.65rem' }}>{item.severity}</span>
                      </div>
                      <p className="insight-text">{item.interventionBrief}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card insight-section-box">
            <div className="insight-empty-state">
              <Sparkles size={24} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
              <p>Run Gemini AI Audit to pull analytics logs.</p>
            </div>
          </div>
        )}
      </div>

      {/* Underperforming & Bottlenecks Panel */}
      <div className="glass-card" ref={interventionsSectionRef}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-critical)' }}>
          <AlertOctagon size={20} />
          Facilities Requiring District Intervention
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Below is a real-time list of health centers flagged for operational bottlenecks (medicine stock-outs, staff absences, or overcapacity).
        </p>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Center Name</th>
                <th>Type</th>
                <th>Staffing Status</th>
                <th>Bed Load</th>
                <th>Pharmacy Stockouts</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody>
              {centers.map(center => {
                const centerInv = inventories[center.id] || [];
                const criticalItems = centerInv.filter(i => i.stock === 0);
                const hasDoctorAbsence = center.doctors.present === 0;
                const isOvercapacity = center.beds.occupied / center.beds.total >= 0.9;
                
                if (center.status === 'normal') return null;

                return (
                  <tr key={center.id}>
                    <td style={{ fontWeight: 600 }}>{center.name}</td>
                    <td>{center.type}</td>
                    <td>
                      <span style={{ color: hasDoctorAbsence ? 'var(--status-critical)' : 'inherit', fontWeight: hasDoctorAbsence ? 600 : 'normal' }}>
                        {center.doctors.present} of {center.doctors.total} present
                      </span>
                    </td>
                    <td>
                      <span style={{ color: isOvercapacity ? 'var(--status-critical)' : 'inherit', fontWeight: isOvercapacity ? 600 : 'normal' }}>
                        {center.beds.occupied}/{center.beds.total} occupied
                      </span>
                    </td>
                    <td>
                      {criticalItems.length > 0 ? (
                        <span style={{ color: 'var(--status-critical)', fontWeight: 600 }}>
                          {criticalItems.map(i => i.name.split(' ')[0]).join(', ')} (0 stock)
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${center.status}`}>{center.status}</span>
                    </td>
                  </tr>
                );
              })}
              {centers.filter(c => c.status !== 'normal').length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                    ✔ All health centers are operating under normal parameters. No active intervention flagged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
