import React from 'react';
import { AlertTriangle, Building2, PhoneCall, ShieldCheck } from 'lucide-react';

const emergencyContacts = [
  {
    name: 'National Emergency Number',
    number: '112',
    description: 'Police, fire, ambulance, and immediate life-threatening emergencies.',
    tone: 'danger',
  },
  {
    name: 'National Disaster Helpline',
    number: '1078',
    description: 'National disaster-management assistance and escalation support.',
    tone: 'accent',
  },
  {
    name: 'State Emergency Operations Centre',
    number: '1070',
    description: 'State-level disaster coordination and relief support across the North Eastern Region.',
    tone: 'success',
  },
  {
    name: 'District Emergency Operations Centre',
    number: '1077',
    description: 'District-level control room for local response and field coordination.',
    tone: 'amber',
  },
  {
    name: 'NDRF Control Room',
    number: '011-24363260',
    description: 'National Disaster Response Force rescue and response coordination.',
    tone: 'accent',
  },
];

const toneClasses = {
  danger: 'border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]',
  accent: 'border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]',
  success: 'border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)]',
  amber: 'border-[var(--amber)]/20 bg-[var(--amber-soft)] text-[var(--amber)]',
};

export default function ContactUs() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-1 sm:p-2">
      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)]">
            <PhoneCall className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--danger)]">North Eastern Region, India</p>
            <h1 className="mt-1 text-2xl font-black tracking-[0.03em] text-[var(--text)]">Disaster Management Contacts</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Use the appropriate control room for emergency response, rescue coordination, and disaster-management assistance across the eight North Eastern states.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {emergencyContacts.map((contact) => (
          <article key={contact.number} className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-card)]">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${toneClasses[contact.tone]}`}>
              <PhoneCall className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-black text-[var(--text)]">{contact.name}</h2>
            <p className="mt-2 min-h-12 text-xs leading-5 text-[var(--muted)]">{contact.description}</p>
            <a
              href={`tel:${contact.number.replace(/[^\d+]/g, '')}`}
              className="mt-4 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--panel-alt)] px-3 py-2.5 text-sm font-black text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              <span>{contact.number}</span>
              <PhoneCall className="h-4 w-4" />
            </a>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[var(--text)]">
            <Building2 className="h-4 w-4 text-[var(--accent)]" />
            Response Coverage
          </h2>
          <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
            Him-Rakshak supports disaster monitoring across Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, and Tripura. For a local incident, contact the district control room first when it is safe to do so.
          </p>
        </div>

        <div className="rounded-[24px] border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[var(--danger)]">
            <AlertTriangle className="h-4 w-4" />
            Immediate Danger
          </h2>
          <p className="mt-3 text-xs leading-6 text-[var(--text)]">
            Move away from unstable slopes, flooded channels, and damaged roads. Call <strong>112</strong> for immediate danger and follow instructions from local authorities.
          </p>
        </div>
      </section>

      <p className="flex items-center gap-2 px-1 text-[11px] leading-5 text-[var(--muted)]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--success)]" />
        Helpline availability can vary by state and district. Confirm the local control-room number with the relevant State or District Disaster Management Authority.
      </p>
    </div>
  );
}