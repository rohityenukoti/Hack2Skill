import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import CanvasMap from './CanvasMap';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const CRITICAL_TOOLTIP_DELAY_MS = 2000;

const mapContainerStyle = { width: '100%', height: '300px', borderRadius: 'var(--radius-md)' };

function statusColor(status) {
  if (status === 'critical') return '#b91c1c';
  if (status === 'warning') return '#d97706';
  return '#0b4c8c';
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

function MapPointOverlay({ map, coordinates, className, children }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!map || !coordinates || !window.google?.maps) return;

    const overlay = new window.google.maps.OverlayView();
    overlay.onAdd = () => {};
    overlay.draw = () => {
      const projection = overlay.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToContainerPixel(coordinates);
      if (point) setPosition({ x: point.x, y: point.y });
    };
    overlay.setMap(map);

    const refresh = () => overlay.draw();
    const listeners = ['idle', 'zoom_changed', 'drag', 'bounds_changed'].map((event) =>
      map.addListener(event, refresh),
    );

    return () => {
      overlay.setMap(null);
      listeners.forEach((listener) => window.google.maps.event.removeListener(listener));
    };
  }, [map, coordinates]);

  if (!position) return null;

  return (
    <div className={className} style={{ left: position.x, top: position.y }}>
      {children}
    </div>
  );
}

function useCriticalTooltipState(criticalCenters) {
  const [openCriticalIds, setOpenCriticalIds] = useState(() => new Set());

  useEffect(() => {
    setOpenCriticalIds(new Set());
    const timer = window.setTimeout(() => {
      setOpenCriticalIds(new Set(criticalCenters.map((c) => c.id)));
    }, CRITICAL_TOOLTIP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [criticalCenters]);

  const toggleCriticalTooltip = useCallback((centerId) => {
    setOpenCriticalIds((prev) => {
      const next = new Set(prev);
      if (next.has(centerId)) next.delete(centerId);
      else next.add(centerId);
      return next;
    });
  }, []);

  const closeCriticalTooltip = useCallback((centerId) => {
    setOpenCriticalIds((prev) => {
      if (!prev.has(centerId)) return prev;
      const next = new Set(prev);
      next.delete(centerId);
      return next;
    });
  }, []);

  return { openCriticalIds, toggleCriticalTooltip, closeCriticalTooltip };
}

function GoogleMapsView({ centers, redistributions, onMoreDetails }) {
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const mapRef = useRef(null);

  const center = useMemo(() => {
    if (!centers.length) return { lat: 15.35, lng: 75.05 };
    const lat = centers.reduce((s, c) => s + c.coordinates.lat, 0) / centers.length;
    const lng = centers.reduce((s, c) => s + c.coordinates.lng, 0) / centers.length;
    return { lat, lng };
  }, [centers]);

  const criticalCenters = useMemo(
    () => centers.filter((c) => c.status === 'critical'),
    [centers],
  );
  const { openCriticalIds, toggleCriticalTooltip, closeCriticalTooltip } = useCriticalTooltipState(criticalCenters);

  const handleMarkerClick = useCallback((center) => {
    if (center.status === 'critical') {
      toggleCriticalTooltip(center.id);
    } else {
      setSelectedCenter((prev) => (prev?.id === center.id ? null : center));
    }
  }, [toggleCriticalTooltip]);

  const fitMapToCenters = useCallback((map) => {
    if (!map || !centers.length || !window.google?.maps) return;
    const bounds = new window.google.maps.LatLngBounds();
    centers.forEach((c) => bounds.extend(c.coordinates));
    map.fitBounds(bounds, 48);
  }, [centers]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMapInstance(map);
    fitMapToCenters(map);
  }, [fitMapToCenters]);

  useEffect(() => {
    fitMapToCenters(mapRef.current);
  }, [fitMapToCenters]);

  const routes = useMemo(() => {
    return (redistributions || []).map((route) => {
      const from = centers.find((c) => c.id === route.fromId);
      const to = centers.find((c) => c.id === route.toId);
      if (!from || !to) return null;
      return {
        path: [
          { lat: from.coordinates.lat, lng: from.coordinates.lng },
          { lat: to.coordinates.lat, lng: to.coordinates.lng },
        ],
        urgency: route.urgency,
        route,
      };
    }).filter(Boolean);
  }, [centers, redistributions]);

  return (
    <LoadScript googleMapsApiKey={MAPS_KEY}>
      <div className="map-interactive-wrapper">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={10}
          mapTypeId="roadmap"
          onLoad={onMapLoad}
        >
          {centers.map((c) => (
            <Marker
              key={c.id}
              position={{ lat: c.coordinates.lat, lng: c.coordinates.lng }}
              icon={{
                path: window.google?.maps?.SymbolPath?.CIRCLE ?? 0,
                scale: c.status === 'critical' ? 12 : 10,
                fillColor: statusColor(c.status),
                fillOpacity: 1,
                strokeColor: c.status === 'critical' ? '#fecaca' : '#ffffff',
                strokeWeight: c.status === 'critical' ? 3 : 2,
              }}
              title={c.name}
              onClick={() => handleMarkerClick(c)}
            />
          ))}

          {routes.map((r, idx) => (
            <Polyline
              key={idx}
              path={r.path}
              options={{
                strokeColor: r.urgency === 'High' ? '#b91c1c' : '#15803d',
                strokeOpacity: 0.7,
                strokeWeight: 3,
                geodesic: true,
              }}
            />
          ))}

          {selectedCenter && selectedCenter.status !== 'critical' && (
            <InfoWindow
              position={{ lat: selectedCenter.coordinates.lat, lng: selectedCenter.coordinates.lng }}
              onCloseClick={() => setSelectedCenter(null)}
            >
              <div style={{ fontSize: '0.85rem', maxWidth: '200px' }}>
                <strong>{selectedCenter.name}</strong>
                <p style={{ margin: '4px 0' }}>{selectedCenter.location}</p>
                <span>Status: {selectedCenter.status}</span>
                <button
                  type="button"
                  className="map-tooltip-more-details"
                  onClick={() => onMoreDetails?.(selectedCenter)}
                >
                  More details
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {mapInstance && criticalCenters.map((c) => (
          <React.Fragment key={`critical-${c.id}`}>
            <MapPointOverlay
              map={mapInstance}
              coordinates={c.coordinates}
              className="map-critical-marker-halo"
            />
            {openCriticalIds.has(c.id) && (
              <MapPointOverlay
                map={mapInstance}
                coordinates={c.coordinates}
                className="map-critical-tooltip-overlay"
              >
                <CriticalTooltip
                  center={c}
                  onClose={() => closeCriticalTooltip(c.id)}
                  onMoreDetails={onMoreDetails}
                />
              </MapPointOverlay>
            )}
          </React.Fragment>
        ))}
      </div>
    </LoadScript>
  );
}

export default function InteractiveMap(props) {
  if (MAPS_KEY) {
    return <GoogleMapsView {...props} />;
  }
  return <CanvasMap {...props} />;
}
