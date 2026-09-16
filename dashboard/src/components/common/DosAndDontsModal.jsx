import React, { useState } from 'react';

export default function DosAndDontsModal() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--accent-soft)] border-b border-[var(--border)]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">⚠️</span>
            <h2 className="text-lg font-bold text-[var(--accent)] uppercase tracking-wide">
              Landslide Safety Guidelines — Do&apos;s and Don&apos;ts
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] p-1 rounded-lg transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center shrink-0"
            aria-label="Close safety guidelines"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto text-[var(--text)] space-y-3.5 text-sm leading-relaxed">
          <ul className="list-disc pl-5 space-y-3 marker:text-[var(--accent)]">
            <li>
              <strong>Stay away from the main landslide areas.</strong> There may be danger of additional slides. Do not go near unstable buildings and structures.
            </li>
            <li>
              <strong>Listen carefully for any unusual sounds</strong> such as boulders knocking together. This may indicate moving debris. Stay away from such places.
            </li>
            <li>
              <strong>Listen to the latest local radio or television news</strong> for official warnings and weather updates.
            </li>
            <li>
              <strong>Watch out for SMS / WhatsApp emergency alerts</strong> for the latest command center instructions.
            </li>
            <li>
              <strong>Watch out for flooding</strong> which may occur after landslides. Keep away from streams and river channels.
            </li>
            <li>
              <strong>Give priority access to rescuers</strong> and disaster management vehicles at landslide sites.
            </li>
            <li>
              <strong>Always keep in mind your own safety</strong> and the safety of others in landslide risk areas.
            </li>
            <li>
              <strong>Report unusual movements:</strong> If you notice ground cracking, falling rocks, or trees tilting, notify local emergency authorities immediately.
            </li>
          </ul>
        </div>

        <div className="px-6 py-4 bg-[var(--panel-alt)] border-t border-[var(--border)] flex justify-center">
          <button
            onClick={() => setIsOpen(false)}
            className="px-8 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white font-semibold rounded-lg shadow-lg transition-all cursor-pointer"
          >
            I Understand &amp; Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
