import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Shield, Thermometer, CloudRain, Mountain, Activity, Satellite } from 'lucide-react';
import { getSatelliteImage } from '../../services/api';

export default function LocationDrawer({ location, onClose }) {
  const [satelliteImage, setSatelliteImage] = useState(null);
  const [satelliteLoading, setSatelliteLoading] = useState(false);
  const [satelliteError, setSatelliteError] = useState(false);

  useEffect(() => {
    if (!location?.lat || !location?.lng) {
      setSatelliteImage(null);
      return undefined;
    }

    let cancelled = false;
    setSatelliteLoading(true);
    setSatelliteError(false);

    getSatelliteImage(location.lat, location.lng, 0.18)
      .then((data) => {
        if (!cancelled) setSatelliteImage(data);
      })
      .catch((error) => {
        console.error('Failed to load location satellite imagery:', error);
        if (!cancelled) setSatelliteError(true);
      })
      .finally(() => {
        if (!cancelled) setSatelliteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location]);

  if (!location) return null;

  const isCritical = location.riskLevel === 'CRITICAL';
  const isHigh = location.riskLevel === 'HIGH';
  const features = Array.isArray(location.features) ? location.features : [];
  const summary = location.summary || 'Live risk indicators are being evaluated for this location.';
  const recommendedAction = location.recommendedAction || 'Follow local disaster-management instructions for this risk level.';

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col justify-between overflow-y-auto border-l border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:w-[450px]">
      <div>
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
          <div>
            <span
              className={`mb-2 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.14em] ${
                isCritical
                  ? 'border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]'
                  : isHigh
                    ? 'border-[var(--warning)]/20 bg-[var(--warning-soft)] text-[var(--warning)]'
                    : 'border-[var(--amber)]/20 bg-[var(--amber-soft)] text-[var(--amber)]'
              }`}
            >
              {location.riskLevel} RISK ZONE
            </span>
            <h2 className="text-2xl font-black text-[var(--text)]">{location.district}</h2>
            <p className="text-sm text-[var(--muted)]">{location.state}, India</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] bg-[var(--panel-alt)] p-1.5 text-[var(--muted)] hover:text-[var(--text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <section className="mt-5 overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--panel-alt)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--text)]">
              <Satellite className="h-4 w-4 text-[var(--accent)]" />
              Satellite View
            </h3>
            {satelliteImage?.date && (
              <span className="text-[10px] font-semibold text-[var(--muted)]">{satelliteImage.date}</span>
            )}
          </div>
          {satelliteLoading ? (
            <div className="flex aspect-video items-center justify-center bg-[var(--panel)] text-[11px] font-semibold text-[var(--muted)]">
              Loading location imagery...
            </div>
          ) : satelliteImage?.image_url ? (
            <img
              src={satelliteImage.image_url}
              alt={`Satellite view of ${location.district || 'selected location'}`}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-[var(--panel)] px-4 text-center text-[11px] text-[var(--muted)]">
              {satelliteError ? 'Satellite imagery is unavailable for this location.' : 'Satellite imagery is not available.'}
            </div>
          )}
          <p className="border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--muted)]">
            Coordinates: {Number(location.lat).toFixed(4)}, {Number(location.lng).toFixed(4)}
          </p>
        </section>

        <div className="my-6 grid grid-cols-2 gap-3">
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--panel-alt)] p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <Activity className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>AI Confidence</span>
            </div>
            <p className="text-xl font-black text-[var(--accent)]">{location.aiConfidence}%</p>
          </div>

          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--panel-alt)] p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <CloudRain className="h-3.5 w-3.5 text-[var(--success)]" />
              <span>24h Rainfall</span>
            </div>
            <p className="text-xl font-black text-[var(--success)]">{location.rainfall24h} mm</p>
          </div>

          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--panel-alt)] p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <Mountain className="h-3.5 w-3.5 text-[var(--warning)]" />
              <span>Slope Angle</span>
            </div>
            <p className="text-xl font-black text-[var(--warning)]">{location.slope}°</p>
          </div>

          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--panel-alt)] p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <Thermometer className="h-3.5 w-3.5 text-[var(--success)]" />
              <span>Soil Saturation</span>
            </div>
            <p className="text-xl font-black text-[var(--success)]">{location.soilSaturation}%</p>
          </div>
        </div>

        <div className="mb-6 rounded-[22px] border border-[var(--border)] bg-[var(--panel-alt)] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--text)]">
            <Shield className="h-4 w-4 text-[var(--accent)]" />
            AI Feature Contribution Factors
          </h3>
          <div className="space-y-3">
            {features.length > 0 ? features.map((feat, idx) => (
              <div key={idx}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="max-w-[75%] text-[var(--muted)]">{feat.name}</span>
                  <span className="font-black text-[var(--text)]">{feat.weight}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--panel)]">
                  <div
                    className={`h-full rounded-full ${isCritical ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]'}`}
                    style={{ width: `${feat.weight}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <p className="text-xs text-[var(--muted)]">No feature breakdown is available for this location yet.</p>
            )}
          </div>
          <p className="mt-3 text-[10px] italic text-[var(--muted)]">
            *Prototype AI Feature Weight Analysis based on historical slope failure data.
          </p>
        </div>

        <div className="mb-6">
          <h4 className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--text)]">Situational Assessment</h4>
          <p className="rounded-[18px] border border-[var(--border)] bg-[var(--panel-alt)] p-3 text-sm leading-relaxed text-[var(--muted)]">
            {summary}
          </p>
        </div>

        <div className="mb-6 rounded-[20px] border border-[var(--warning)]/20 bg-[var(--warning-soft)] p-4 text-[var(--warning)]">
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em]">
            <AlertTriangle className="h-4 w-4" />
            <span>Recommended Response Action</span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--warning)]/90">
            {recommendedAction}
          </p>
        </div>
      </div>

      <div className="flex gap-3 border-t border-[var(--border)] pt-4">
        <button
          onClick={() => alert(`Alert dispatched for ${location.district}`)}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--danger)] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[var(--danger)]/90"
        >
          <AlertTriangle className="h-4 w-4" />
          Dispatch Field Alert
        </button>
      </div>
    </div>
  );
}
