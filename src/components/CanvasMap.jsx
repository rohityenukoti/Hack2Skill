import React, { useRef, useEffect, useState } from 'react';

export default function CanvasMap({ centers, redistributions, onCenterClick }) {
  const canvasRef = useRef(null);
  const [hoveredCenter, setHoveredCenter] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [animationOffset, setAnimationOffset] = useState(0);

  const MAP_BOUNDS = {
    minLat: 15.15,
    maxLat: 15.52,
    minLng: 74.85,
    maxLng: 75.28,
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationOffset((prev) => (prev + 0.8) % 40);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const getCanvasCoords = (lat, lng, width, height) => {
    const padding = 50;
    const x = padding + ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * (width - 2 * padding);
    const y = height - padding - ((lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * (height - 2 * padding);
    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    (redistributions || []).forEach((route) => {
      const fromCenter = centers.find((c) => c.id === route.fromId);
      const toCenter = centers.find((c) => c.id === route.toId);
      if (!fromCenter || !toCenter) return;
      const fromCoords = getCanvasCoords(fromCenter.coordinates.lat, fromCenter.coordinates.lng, width, height);
      const toCoords = getCanvasCoords(toCenter.coordinates.lat, toCenter.coordinates.lng, width, height);
      ctx.beginPath();
      ctx.strokeStyle = route.urgency === 'High' ? 'rgba(185, 28, 28, 0.4)' : 'rgba(21, 128, 61, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(fromCoords.x, fromCoords.y);
      ctx.lineTo(toCoords.x, toCoords.y);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    centers.forEach((center) => {
      const coords = getCanvasCoords(center.coordinates.lat, center.coordinates.lng, width, height);
      let color = '#0b4c8c';
      if (center.status === 'warning') color = '#d97706';
      else if (center.status === 'critical') color = '#b91c1c';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.font = '600 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(center.name, coords.x, coords.y - 14);
    });
  }, [centers, redistributions, hoveredCenter, selectedCenter, animationOffset]);

  const handleMouseClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    for (const center of centers) {
      const coords = getCanvasCoords(center.coordinates.lat, center.coordinates.lng, canvas.width, canvas.height);
      if (Math.hypot(coords.x - clickX, coords.y - clickY) < 22) {
        setSelectedCenter(center);
        onCenterClick?.(center);
        return;
      }
    }
    setSelectedCenter(null);
  };

  return (
    <div className="map-container-wrapper" style={{ height: '100%' }}>
      <div className="map-placeholder" style={{ flexGrow: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={650}
          height={380}
          style={{ width: '100%', height: '100%', cursor: 'pointer', display: 'block' }}
          onClick={handleMouseClick}
        />
        {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.7rem', border: '1px solid var(--border-color)' }}>
            Canvas fallback — set VITE_GOOGLE_MAPS_API_KEY for Google Maps
          </div>
        )}
      </div>
      {selectedCenter && (
        <div className="glass-card" style={{ marginTop: '1rem', padding: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{selectedCenter.name}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedCenter.location} • {selectedCenter.status}</p>
        </div>
      )}
    </div>
  );
}
