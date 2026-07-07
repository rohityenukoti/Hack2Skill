import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import CanvasMap from './CanvasMap';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = { width: '100%', height: '380px', borderRadius: 'var(--radius-md)' };

function statusColor(status) {
  if (status === 'critical') return '#b91c1c';
  if (status === 'warning') return '#d97706';
  return '#0b4c8c';
}

function CriticalTooltip({ center }) {
  return (
    <div className="map-critical-tooltip">
      <span className="map-critical-tooltip__badge">URGENT</span>
      <strong>{center.name}</strong>
      <p>{center.location}</p>
      <span className="map-critical-tooltip__status">Immediate intervention required</span>
    </div>
  );
}

function GoogleMapsView({ centers, redistributions, onCenterClick }) {
  const [selectedCenter, setSelectedCenter] = useState(null);
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

  const fitMapToCenters = useCallback((map) => {
    if (!map || !centers.length || !window.google?.maps) return;
    const bounds = new window.google.maps.LatLngBounds();
    centers.forEach((c) => bounds.extend(c.coordinates));
    map.fitBounds(bounds, 48);
  }, [centers]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
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
            animation={c.status === 'critical' ? window.google?.maps?.Animation?.BOUNCE : undefined}
            title={c.name}
            onClick={() => {
              setSelectedCenter(c);
              onCenterClick?.(c);
            }}
          />
        ))}

        {criticalCenters.map((c) => (
          <InfoWindow
            key={`critical-${c.id}`}
            position={{ lat: c.coordinates.lat, lng: c.coordinates.lng }}
            options={{
              disableAutoPan: true,
              ...(window.google?.maps ? { pixelOffset: new window.google.maps.Size(0, -18) } : {}),
            }}
          >
            <CriticalTooltip center={c} />
          </InfoWindow>
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
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}

export default function InteractiveMap(props) {
  if (MAPS_KEY) {
    return <GoogleMapsView {...props} />;
  }
  return <CanvasMap {...props} />;
}
