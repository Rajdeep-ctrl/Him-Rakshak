import React, { useState, useEffect } from 'react';
import { getStateRiskAnalytics } from '../services/api';
import { useDataMode } from '../context/DataModeContext';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { BarChart3, PieChart as PieIcon, Shield } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const RISK_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981'];

export default function Analytics() {
  const { isLiveApi } = useDataMode();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const res = await getStateRiskAnalytics(isLiveApi);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [isLiveApi]);

  const pieData = [
    { name: 'Critical Risk', value: 7 },
    { name: 'High Risk', value: 18 },
    { name: 'Medium Risk', value: 24 },
    { name: 'Low Risk', value: 12 },
  ];

  if (loading) return <div className="p-8"><SkeletonLoader type="card" count={2} /></div>;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-1 sm:p-2">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
        <h1 className="flex items-center gap-2 text-xl font-black tracking-[0.06em] text-[var(--text)]">
          <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
          North Eastern Regional Landslide Risk Analytics
        </h1>
        <p className="mt-2 text-xs font-medium text-[var(--muted)]">
          State-level risk distribution, historical density, and predictive metrics
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-[var(--text)]">State-wise Risk Severity</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="state" stroke="#726961" fontSize={11} />
                <YAxis stroke="#726961" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#fffdf9', borderColor: '#e4ddd3', borderRadius: '14px', color: '#201d1a' }} />
                <Legend />
                <Bar dataKey="critical" fill="#b84a36" name="Critical" radius={[4, 4, 0, 0]} />
                <Bar dataKey="high" fill="#d47548" name="High" radius={[4, 4, 0, 0]} />
                <Bar dataKey="medium" fill="#c5872f" name="Medium" radius={[4, 4, 0, 0]} />
                <Bar dataKey="low" fill="#2c5c4d" name="Low" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-[var(--text)]">Regional Risk Proportions</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fffdf9', borderColor: '#e4ddd3', borderRadius: '14px', color: '#201d1a' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
