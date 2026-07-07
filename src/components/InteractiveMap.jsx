import React, { useState, useMemo } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import CanvasMap from './CanvasMap';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = { width: '100%', height: '380px', borderRadius: 'var(--radius-md)' };

function statusColor(status) {
  if (status === 'critical') return '#b91c1c';
  if (status === 'warning') return '#d97706';
  return '#0b4c8c';
}

function GoogleMapsView({ centers, redistributions, onCenterClick }) {
  const [selectedCenter, setSelectedCenter] = useState(null);

  const center = useMemo(() => {
    if (!centers.length) return { lat: 15.35, lng: 75.05 };
    const lat = centers.reduce((s, c) => s + c.coordinates.lat, 0) / centers.length;
    const lng = centers.reduce((s, c) => s + c.coordinates.lng, 0) / centers.length;
    return { lat, lng };
  }, [centers]);

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
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={11} mapTypeId="roadmap">
        {centers.map((c) => (
          <Marker
            key={c.id}
            position={{ lat: c.coordinates.lat, lng: c.coordinates.lng }}
            icon={{
              path: window.google?.maps?.SymbolPath?.CIRCLE ?? 0,
              scale: 10,
              fillColor: statusColor(c.status),
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            title={c.name}
            onClick={() => {
              setSelectedCenter(c);
              onCenterClick?.(c);
            }}
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

        {selectedCenter && (
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
