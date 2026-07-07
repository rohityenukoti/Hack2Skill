import React, { useRef, useEffect, useState, useMemo } from 'react';

const DEFAULT_BOUNDS = {
  minLat: 15.15,
  maxLat: 15.52,
  minLng: 74.85,
  maxLng: 75.28,
};

const CRITICAL_TOOLTIP_DELAY_MS = 2000;

function computeBounds(centers) {
  if (!centers.length) return DEFAULT_BOUNDS;
  const lats = centers.map((c) => c.coordinates.lat);
  const lngs = centers.map((c) => c.coordinates.lng);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  const latPadding = Math.max(latSpan * 0.18, 0.04);
  const lngPadding = Math.max(lngSpan * 0.18, 0.04);
  return {
    minLat: Math.min(...lats) - latPadding,
    maxLat: Math.max(...lats) + latPadding,
    minLng: Math.min(...lngs) - lngPadding,
    maxLng: Math.max(...lngs) + lngPadding,
  };
}

function CriticalTooltip({ center, onClose, onMoreDetails }) {
  return (
    <div className="map-critical-tooltip">
      <button
        type="button"
        className="map-critical-tooltip__close"
        onClick={onClose}
        aria-label={`Close ${center.name} alert`}
      >
        ×
      </button>
      <span className="map-critical-tooltip__badge">URGENT</span>
      <strong>{center.name}</strong>
      <p>{center.location}</p>
      <span className="map-critical-tooltip__status">Immediate intervention required</span>
      <button
        type="button"
        className="map-tooltip-more-details map-tooltip-more-details--critical"
        onClick={() => onMoreDetails?.(center)}
      >
        More details
      </button>
    </div>
  );
}

export default function CanvasMap({ centers, redistributions, onMoreDetails }) {
  const canvasRef = useRef(null);
  const [hoveredCenter, setHoveredCenter] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [criticalPositions, setCriticalPositions] = useState([]);
  const [openCriticalIds, setOpenCriticalIds] = useState(() => new Set());

  const mapBounds = useMemo(() => computeBounds(centers), [centers]);
  const criticalCenters = useMemo(
    () => centers.filter((c) => c.status === 'critical'),
    [centers],
  );

  useEffect(() => {
    setOpenCriticalIds(new Set());
    const timer = window.setTimeout(() => {
      setOpenCriticalIds(new Set(criticalCenters.map((c) => c.id)));
    }, CRITICAL_TOOLTIP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [criticalCenters]);

  const getCanvasCoords = (lat, lng, width, height) => {
    const padding = 56;
    const x = padding + ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * (width - 2 * padding);
    const y = height - padding - ((lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * (height - 2 * padding);
    return { x, y };
  };

  const updateCriticalPositions = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    setCriticalPositions(
      criticalCenters.map((center) => {
        const coords = getCanvasCoords(
          center.coordinates.lat,
          center.coordinates.lng,
          canvas.width,
          canvas.height,
        );
        return {
          center,
          left: coords.x * scaleX,
          top: coords.y * scaleY,
        };
      }),
    );
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
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 14, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, center.status === 'critical' ? 9 : 8, 0, 2 * Math.PI);
      ctx.fill();

      if (center.status !== 'critical') {
        ctx.fillStyle = '#333';
        ctx.font = '600 11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(center.name, coords.x, coords.y - 14);
      }
    });

    updateCriticalPositions();
  }, [centers, redistributions, hoveredCenter, selectedCenter, mapBounds, criticalCenters]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const resizeObserver = new ResizeObserver(() => updateCriticalPositions());
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [centers, mapBounds, criticalCenters]);

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
        if (center.status === 'critical') {
          setOpenCriticalIds((prev) => {
            const next = new Set(prev);
            if (next.has(center.id)) next.delete(center.id);
            else next.add(center.id);
            return next;
          });
        } else {
          setSelectedCenter((prev) => (prev?.id === center.id ? null : center));
        }
        return;
      }
    }
    setSelectedCenter(null);
  };

  return (
    <div className="map-container-wrapper map-interactive-wrapper" style={{ height: '100%' }}>
      <div className="map-placeholder" style={{ flexGrow: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={650}
          height={300}
          style={{ width: '100%', height: '100%', cursor: 'pointer', display: 'block' }}
          onClick={handleMouseClick}
        />
        {criticalPositions.map(({ center, left, top }) => (
          <React.Fragment key={`critical-${center.id}`}>
            <div
              className="map-critical-marker-halo"
              style={{ left, top }}
            />
            {openCriticalIds.has(center.id) && (
              <div
                className="map-critical-tooltip-overlay"
                style={{ left, top }}
              >
                <CriticalTooltip
                  center={center}
                  onClose={() => {
                    setOpenCriticalIds((prev) => {
                      if (!prev.has(center.id)) return prev;
                      const next = new Set(prev);
                      next.delete(center.id);
                      return next;
                    });
                  }}
                  onMoreDetails={onMoreDetails}
                />
              </div>
            )}
          </React.Fragment>
        ))}
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
          <button
            type="button"
            className="map-tooltip-more-details"
            onClick={() => onMoreDetails?.(selectedCenter)}
          >
            More details
          </button>
        </div>
      )}
    </div>
  );
}
