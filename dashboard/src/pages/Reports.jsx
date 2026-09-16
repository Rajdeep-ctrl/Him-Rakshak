import React, { useState, useEffect } from 'react';
import { getReports, submitReportApi } from '../services/api';
import { useDataMode } from '../context/DataModeContext';
import { useLanguage } from '../context/LanguageContext';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { FileText, MapPin, Upload, CheckCircle, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';

export default function Reports() {
  const { isLiveApi, addToast } = useDataMode();
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [hazardType, setHazardType] = useState('Landslide');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [video, setVideo] = useState(null);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const res = await getReports(isLiveApi);
        setReports(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [isLiveApi]);

  const handleAcquireLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(4));
          setLongitude(pos.coords.longitude.toFixed(4));
          addToast('Geolocation acquired successfully', 'success');
        },
        (err) => {
          addToast('Unable to acquire location from browser', 'error');
        }
      );
    } else {
      addToast('Geolocation not supported by browser', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('hazardType', hazardType);
    formData.append('locationName', locationName);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('description', description);
    if (photo) formData.append('photo', photo);
    if (video) formData.append('video', video);

    try {
      const res = await submitReportApi(formData, isLiveApi);
      if (res.success) {
        setReports((prev) => [res.report, ...prev]);
        addToast(`Report submitted! ID: ${res.report.id}`, 'success');
        // Reset
        setLocationName('');
        setDescription('');
        setPhoto(null);
        setVideo(null);
      }
    } catch (err) {
      addToast('Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-1 sm:p-2">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="flex items-center gap-2 text-xl font-black tracking-[0.06em] text-[var(--text)]">
          <FileText className="h-5 w-5 text-[var(--accent)]" />
          {t('reports')}
        </h2>
        <p className="mt-2 text-xs font-medium text-[var(--muted)]">
          Submit ground-level observations to enrich AI prediction models and emergency dispatch
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Hazard Type</label>
              <select
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] px-3 py-2.5 text-sm text-[var(--text)]"
              >
                <option value="Landslide">Landslide / Slope Failure</option>
                <option value="Road Blockage">Road Blockage / Debris Flow</option>
                <option value="Ground Crack">Ground Crack / Fissure</option>
                <option value="Flash Flood">Flash Flood Runoff</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Location Landmark / Address</label>
              <input
                type="text"
                required
                placeholder="e.g., Haflong Hill Highway km-42"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] px-3 py-2.5 text-sm text-[var(--text)]"
              />
            </div>
          </div>

          <div className="grid items-end gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Latitude</label>
              <input
                type="text"
                placeholder="25.1711"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] px-3 py-2.5 text-sm text-[var(--text)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Longitude</label>
              <input
                type="text"
                placeholder="93.0158"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] px-3 py-2.5 text-sm text-[var(--text)]"
              />
            </div>

            <button
              type="button"
              onClick={handleAcquireLocation}
              className="flex h-[46px] items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)] transition hover:border-[var(--accent)]/20"
            >
              <MapPin className="h-4 w-4" />
              Geo Locate
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Description</label>
            <textarea
              rows={3}
              required
              placeholder="Describe scale of slide, movement velocity, affected infrastructure..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] p-3 text-sm text-[var(--text)]"
            ></textarea>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border-2 border-dashed border-[var(--border)] bg-[var(--panel-alt)] p-4 text-center">
              <ImageIcon className="mx-auto mb-2 h-6 w-6 text-[var(--muted)]" />
              <label className="cursor-pointer text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files[0])}
                  className="hidden"
                />
              </label>
              {photo && <p className="mt-2 text-[11px] font-semibold text-[var(--success)]">{photo.name}</p>}
            </div>

            <div className="rounded-[22px] border-2 border-dashed border-[var(--border)] bg-[var(--panel-alt)] p-4 text-center">
              <Video className="mx-auto mb-2 h-6 w-6 text-[var(--muted)]" />
              <label className="cursor-pointer text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                Upload Video
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideo(e.target.files[0])}
                  className="hidden"
                />
              </label>
              {video && <p className="mt-2 text-[11px] font-semibold text-[var(--success)]">{video.name}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-[var(--accent-2)]"
          >
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Submit Report
              </>
            )}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-black tracking-[0.06em] text-[var(--text)]">{t('hazardReports')}</h3>
        {loading ? (
          <SkeletonLoader type="table" count={2} />
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="flex flex-col items-start justify-between gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow-card)] md:flex-row md:items-center"
              >
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                      {rep.hazardType}
                    </span>
                    <span className="text-[11px] font-bold text-[var(--muted)]">{rep.status}</span>
                  </div>
                  <p className="text-sm font-bold text-[var(--text)]">{rep.locationName}</p>
                  <p className="text-xs text-[var(--muted)]">{rep.timestamp}</p>
                </div>
                <p className="text-xs text-[var(--muted)]">{rep.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
