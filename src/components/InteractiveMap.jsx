import React, { useRef, useEffect, useState } from 'react';
import { Shield, AlertTriangle, Activity, Navigation, ExternalLink } from 'lucide-react';

export default function InteractiveMap({ centers, redistributions, onCenterClick }) {
  const canvasRef = useRef(null);
  const [hoveredCenter, setHoveredCenter] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [animationOffset, setAnimationOffset] = useState(0);

  // Map bounding box based on the mock coordinates of Dharwad District
  // minLat = 15.15, maxLat = 15.52
  // minLng = 74.88, maxLng = 75.28
  const MAP_BOUNDS = {
    minLat: 15.15,
    maxLat: 15.52,
    minLng: 74.85,
    maxLng: 75.28
  };

  useEffect(() => {
    // Animation loop for flowing resource dots
    const interval = setInterval(() => {
      setAnimationOffset((prev) => (prev + 0.8) % 40);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const getCanvasCoords = (lat, lng, width, height) => {
    // Map latitude and longitude linearly to canvas x, y (padding is added to keep pins inside bounds)
    const padding = 50;
    
    // Invert Y coordinate because canvas y is top-to-bottom but latitude is bottom-to-top
    const x = padding + ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * (width - 2 * padding);
    const y = height - padding - ((lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * (height - 2 * padding);
    
    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(15, 76, 129, 0.04)';
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw stylized District Boundary
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(15, 76, 129, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    // Draw an approximate boundary circle/path around the center coordinates
    const boundaryCoords = [
      { lat: 15.52, lng: 74.95 },
      { lat: 15.48, lng: 75.18 },
      { lat: 15.28, lng: 75.28 },
      { lat: 15.15, lng: 75.12 },
      { lat: 15.18, lng: 74.88 },
      { lat: 15.40, lng: 74.85 },
    ];
    boundaryCoords.forEach((pt, idx) => {
      const c = getCanvasCoords(pt.lat, pt.lng, width, height);
      if (idx === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Draw flowing resource redistribution lines
    redistributions.forEach((route) => {
      const fromCenter = centers.find(c => c.id === route.fromId);
      const toCenter = centers.find(c => c.id === route.toId);
      if (!fromCenter || !toCenter) return;

      const fromCoords = getCanvasCoords(fromCenter.coordinates.lat, fromCenter.coordinates.lng, width, height);
      const toCoords = getCanvasCoords(toCenter.coordinates.lat, toCenter.coordinates.lng, width, height);

      // Draw quadratic bezier curve for aesthetic curvature
      const midX = (fromCoords.x + toCoords.x) / 2;
      const midY = (fromCoords.y + toCoords.y) / 2 - 40; // curve upwards

      ctx.beginPath();
      ctx.strokeStyle = route.urgency === 'High' ? 'rgba(185, 28, 28, 0.4)' : 'rgba(21, 128, 61, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(fromCoords.x, fromCoords.y);
      ctx.quadraticCurveTo(midX, midY, toCoords.x, toCoords.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Flowing glow dots animation
      ctx.fillStyle = route.urgency === 'High' ? '#b91c1c' : '#15803d';
      ctx.beginPath();
      // Calculate dot position along the Bezier curve using t = 0 to 1 based on animationOffset
      const t = (animationOffset / 40);
      const dotX = (1 - t) * (1 - t) * fromCoords.x + 2 * (1 - t) * t * midX + t * t * toCoords.x;
      const dotY = (1 - t) * (1 - t) * fromCoords.y + 2 * (1 - t) * t * midY + t * t * toCoords.y;
      
      // Draw glowing dot
      ctx.shadowBlur = 4;
      ctx.shadowColor = ctx.fillStyle;
      ctx.arc(dotX, dotY, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow
    });

    // Draw Pins/Centers
    centers.forEach((center) => {
      const coords = getCanvasCoords(center.coordinates.lat, center.coordinates.lng, width, height);
      const isHovered = hoveredCenter?.id === center.id;
      const isSelected = selectedCenter?.id === center.id;

      // Color code by status
      let color = '#0b4c8c'; // normal (deep blue)
      let glowColor = 'rgba(11, 76, 140, 0.12)';
      if (center.status === 'warning') {
        color = '#d97706'; // warning (saffron)
        glowColor = 'rgba(217, 119, 6, 0.12)';
      } else if (center.status === 'critical') {
        color = '#b91c1c'; // critical (red)
        glowColor = 'rgba(185, 28, 28, 0.12)';
      }

      // 1. Draw glowing outer halo (pulse animated for warnings/criticals)
      const basePulse = Math.sin(Date.now() / (center.status === 'critical' ? 250 : 600)) * 4;
      const radiusGlow = (isHovered || isSelected ? 24 : 16) + (center.status !== 'normal' ? basePulse : 0);
      
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, radiusGlow, 0, 2 * Math.PI);
      ctx.fill();

      // 2. Draw border rings
      ctx.strokeStyle = color;
      ctx.lineWidth = isHovered || isSelected ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, isHovered || isSelected ? 12 : 8, 0, 2 * Math.PI);
      ctx.stroke();

      // 3. Draw core solid dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, isHovered || isSelected ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();

      // 4. Center Name Label Text
      ctx.fillStyle = isHovered || isSelected ? 'var(--primary)' : 'var(--text-main)';
      ctx.font = isHovered || isSelected ? 'bold 12px Inter' : '600 11px Inter';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'center';
      ctx.fillText(center.name, coords.x, coords.y - 18);
      ctx.shadowBlur = 0; // reset
    });

  }, [centers, redistributions, hoveredCenter, selectedCenter, animationOffset]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Convert click client coordinates to canvas internal pixel coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    let found = null;
    for (const center of centers) {
      const coords = getCanvasCoords(center.coordinates.lat, center.coordinates.lng, canvas.width, canvas.height);
      const dist = Math.hypot(coords.x - clickX, coords.y - clickY);
      // Hover threshold
      if (dist < 22) {
        found = center;
        break;
      }
    }
    setHoveredCenter(found);
  };

  const handleMouseClick = () => {
    if (hoveredCenter) {
      setSelectedCenter(hoveredCenter);
      if (onCenterClick) {
        onCenterClick(hoveredCenter);
      }
    } else {
      setSelectedCenter(null);
    }
  };

  return (
    <div className="map-container-wrapper" style={{ height: '100%' }}>
      <div className="map-placeholder" style={{ flexGrow: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={650}
          height={380}
          style={{ width: '100%', height: '100%', cursor: hoveredCenter ? 'pointer' : 'default', display: 'block' }}
          onMouseMove={handleMouseMove}
          onClick={handleMouseClick}
        />
        
        {/* Float Map Legend */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: '#ffffff',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          gap: '12px',
          fontSize: '0.75rem',
          color: 'var(--text-main)',
          boxShadow: 'var(--shadow-sm)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} /> Normal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-warning)', display: 'inline-block' }} /> Warning
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-critical)', display: 'inline-block' }} /> Critical
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px' }}>
            <span style={{ width: '16px', height: '2px', background: 'var(--primary-glow)', borderTop: '1px dashed var(--primary)', display: 'inline-block' }} /> AI Transit
          </div>
        </div>
      </div>

      {/* Selected Center Summary Card */}
      {selectedCenter && (
        <div className="glass-card" style={{
          marginTop: '1rem',
          padding: '1rem',
          borderLeft: `4px solid ${
            selectedCenter.status === 'critical' ? 'var(--status-critical)' : 
            selectedCenter.status === 'warning' ? 'var(--status-warning)' : 'var(--status-normal)'
          }`,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{selectedCenter.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedCenter.location} • {selectedCenter.type}</p>
            </div>
            <span className={`badge ${selectedCenter.status}`}>
              {selectedCenter.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>BED OCCUPANCY</span>
              <strong>{selectedCenter.beds.occupied} / {selectedCenter.beds.total}</strong> ({Math.round(selectedCenter.beds.occupied / selectedCenter.beds.total * 100)}%)
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>DOCTORS PRESENT</span>
              <strong style={{ color: selectedCenter.doctors.present === 0 ? 'var(--status-critical)' : 'inherit' }}>
                {selectedCenter.doctors.present} / {selectedCenter.doctors.total}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>PATIENTS TODAY</span>
              <strong>{selectedCenter.footfall.today}</strong> (Avg: {selectedCenter.footfall.averageDaily})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
