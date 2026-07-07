import React, { useRef, useEffect, useState, useMemo } from 'react';

const DEFAULT_BOUNDS = {
  minLat: 15.15,
  maxLat: 15.52,
  minLng: 74.85,
  maxLng: 75.28,
};

function computeBounds(centers) {
  if (!centers.length) return DEFAULT_BOUNDS;
  const lats = centers.map((c) => c.coordinates.lat);
  const lngs = centers.map((c) => c.coordinates.lng);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  const hasCritical = centers.some((c) => c.status === 'critical');
  const latPadding = Math.max(latSpan * 0.3, hasCritical ? 0.1 : 0.05);
  const lngPadding = Math.max(lngSpan * 0.3, 0.06);
  return {
    minLat: Math.min(...lats) - latPadding * 0.6,
    maxLat: Math.max(...lats) + latPadding,
    minLng: Math.min(...lngs) - lngPadding,
    maxLng: Math.max(...lngs) + lngPadding,
  };
}

export default function CanvasMap({ centers, redistributions, onCenterClick }) {
  const canvasRef = useRef(null);
  const [hoveredCenter, setHoveredCenter] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);

  const mapBounds = useMemo(() => computeBounds(centers), [centers]);

  const getCanvasCoords = (lat, lng, width, height) => {
    const padding = 72;
    const x = padding + ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * (width - 2 * padding);
    const y = height - padding - ((lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * (height - 2 * padding);
    return { x, y };
  };

  const drawCriticalTooltip = (ctx, center, coords) => {
    const lines = [center.name, 'URGENT — Intervention required'];
    ctx.font = '700 11px Inter';
    const lineWidths = lines.map((line) => ctx.measureText(line).width);
    const boxWidth = Math.max(...lineWidths) + 20;
    const boxHeight = 46;
    const boxX = coords.x - boxWidth / 2;
    const boxY = coords.y - 58;

    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
    ctx.fill();

    ctx.fillStyle = '#fecaca';
    ctx.beginPath();
    ctx.moveTo(coords.x - 6, boxY + boxHeight);
    ctx.lineTo(coords.x + 6, boxY + boxHeight);
    ctx.lineTo(coords.x, boxY + boxHeight + 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '700 11px Inter';
    ctx.fillText(lines[0], coords.x, boxY + 16);
    ctx.font = '600 9px Inter';
    ctx.fillStyle = '#fecaca';
    ctx.fillText(lines[1], coords.x, boxY + 32);
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

      if (center.status === 'critical') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 16, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, center.status === 'critical' ? 9 : 8, 0, 2 * Math.PI);
      ctx.fill();

      if (center.status === 'critical') {
        drawCriticalTooltip(ctx, center, coords);
      } else {
        ctx.fillStyle = '#333';
        ctx.font = '600 11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(center.name, coords.x, coords.y - 14);
      }
    });
  }, [centers, redistributions, hoveredCenter, selectedCenter, mapBounds]);

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
