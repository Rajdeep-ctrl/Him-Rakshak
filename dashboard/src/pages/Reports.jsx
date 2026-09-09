import React, { useState, useEffect } from 'react';
import { getReports, submitReportApi } from '../services/api';
import { useDataMode } from '../context/DataModeContext';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { FileText, MapPin, Upload, CheckCircle, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';

export default function Reports() {
  const { isLiveApi, addToast } = useDataMode();
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
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Hazard Submission Form */}
      <div className="bg-command-surface border border-command-border rounded-xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Field & Citizen Hazard Incident Report
        </h2>
        <p className="text-xs text-command-muted mb-6">
          Submit ground-level observations to enrich AI prediction models and emergency dispatch
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hazard Type
              </label>
              <select
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value)}
                className="w-full bg-command-bg border border-command-border rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Landslide">Landslide / Slope Failure</option>
                <option value="Road Blockage">Road Blockage / Debris Flow</option>
                <option value="Ground Crack">Ground Crack / Fissure</option>
                <option value="Flash Flood">Flash Flood Runoff</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Location Landmark / Address
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Haflong Hill Highway km-42"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-command-bg border border-command-border rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Coordinates & Geolocation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude</label>
              <input
                type="text"
                placeholder="25.1711"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-command-bg border border-command-border rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude</label>
              <input
                type="text"
                placeholder="93.0158"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-command-bg border border-command-border rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="button"
              onClick={handleAcquireLocation}
              className="bg-command-card hover:bg-slate-700 border border-command-border text-cyan-400 text-xs font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 h-[38px]"
            >
              <MapPin className="w-4 h-4" />
              Acquire Geolocation
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              required
              placeholder="Describe scale of slide, movement velocity, affected infrastructure..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-command-bg border border-command-border rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            ></textarea>
          </div>

          {/* Media Drag and Drop Previews */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-command-border p-4 rounded-xl text-center bg-command-bg/50">
              <ImageIcon className="w-6 h-6 text-command-muted mx-auto mb-1" />
              <label className="cursor-pointer text-xs font-semibold text-cyan-400 hover:underline">
                Upload Photo Evidence
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files[0])}
                  className="hidden"
                />
              </label>
              {photo && <p className="text-[11px] text-emerald-400 mt-1 font-semibold">{photo.name}</p>}
            </div>

            <div className="border-2 border-dashed border-command-border p-4 rounded-xl text-center bg-command-bg/50">
              <Video className="w-6 h-6 text-command-muted mx-auto mb-1" />
              <label className="cursor-pointer text-xs font-semibold text-cyan-400 hover:underline">
                Upload Video Footage
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideo(e.target.files[0])}
                  className="hidden"
                />
              </label>
              {video && <p className="text-[11px] text-emerald-400 mt-1 font-semibold">{video.name}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-lg text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Submit Hazard Report to Command Center
              </>
            )}
          </button>
        </form>
      </div>

      {/* Reports History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Recent Submitted Field Reports</h3>
        {loading ? (
          <SkeletonLoader type="table" count={2} />
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-command-surface p-4 rounded-xl border border-command-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {rep.hazardType}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{rep.id}</span>
                    <span className="text-[10px] text-command-muted">• {rep.timestamp}</span>
                  </div>
                  <p className="text-xs font-bold text-white">{rep.locationName}</p>
                  <p className="text-xs text-command-muted mt-0.5">{rep.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                    {rep.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
