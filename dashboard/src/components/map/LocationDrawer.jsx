import React from 'react';
import { X, AlertTriangle, Shield, Thermometer, CloudRain, Mountain, Activity, CheckCircle2 } from 'lucide-react';

export default function LocationDrawer({ location, onClose }) {
  if (!location) return null;

  const isCritical = location.riskLevel === 'CRITICAL';
  const isHigh = location.riskLevel === 'HIGH';

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-command-surface border-l border-command-border p-6 shadow-2xl overflow-y-auto flex flex-col justify-between backdrop-blur-xl">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-command-border pb-4">
          <div>
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider mb-2 ${
                isCritical
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : isHigh
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
              }`}
            >
              {location.riskLevel} RISK ZONE
            </span>
            <h2 className="text-2xl font-bold text-white">{location.district}</h2>
            <p className="text-sm text-command-muted">{location.state}, India</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-command-card text-command-muted hover:text-white border border-command-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Key Indicators Grid */}
        <div className="grid grid-cols-2 gap-3 my-6">
          <div className="bg-command-card p-3 rounded-lg border border-command-border">
            <div className="flex items-center gap-1.5 text-xs text-command-muted mb-1">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Confidence</span>
            </div>
            <p className="text-xl font-bold text-cyan-300">{location.aiConfidence}%</p>
          </div>

          <div className="bg-command-card p-3 rounded-lg border border-command-border">
            <div className="flex items-center gap-1.5 text-xs text-command-muted mb-1">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <span>24h Rainfall</span>
            </div>
            <p className="text-xl font-bold text-blue-300">{location.rainfall24h} mm</p>
          </div>

          <div className="bg-command-card p-3 rounded-lg border border-command-border">
            <div className="flex items-center gap-1.5 text-xs text-command-muted mb-1">
              <Mountain className="w-3.5 h-3.5 text-amber-400" />
              <span>Slope Angle</span>
            </div>
            <p className="text-xl font-bold text-amber-300">{location.slope}°</p>
          </div>

          <div className="bg-command-card p-3 rounded-lg border border-command-border">
            <div className="flex items-center gap-1.5 text-xs text-command-muted mb-1">
              <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Soil Saturation</span>
            </div>
            <p className="text-xl font-bold text-emerald-300">{location.soilSaturation}%</p>
          </div>
        </div>

        {/* AI Explainability Contribution Bars */}
        <div className="mb-6 bg-command-bg p-4 rounded-xl border border-command-border">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            AI Feature Contribution Factors
          </h3>
          <div className="space-y-3">
            {location.features.map((feat, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-command-muted">{feat.name}</span>
                  <span className="font-semibold text-slate-200">{feat.weight}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isCritical ? 'bg-red-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${feat.weight}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-command-muted mt-3 italic">
            *Prototype AI Feature Weight Analysis based on historical slope failure data.
          </p>
        </div>

        {/* Summary Description */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Situational Assessment
          </h4>
          <p className="text-sm text-command-muted leading-relaxed bg-command-card/50 p-3 rounded-lg border border-command-border">
            {location.summary}
          </p>
        </div>

        {/* Recommended Actions */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Recommended Response Action</span>
          </div>
          <p className="text-xs text-amber-300/90 leading-relaxed">
            {location.recommendedAction}
          </p>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-4 border-t border-command-border flex gap-3">
        <button
          onClick={() => alert(`Alert dispatched for ${location.district}`)}
          className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-lg text-sm shadow-lg shadow-red-950/50 transition-colors flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Dispatch Field Alert
        </button>
      </div>
    </div>
  );
}
