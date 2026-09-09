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
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-command-surface p-6 rounded-xl border border-command-border">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          North Eastern Regional Landslide Risk Analytics
        </h1>
        <p className="text-xs text-command-muted mt-1">
          State-level risk distribution, historical density, and predictive metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State-wise Breakdown Bar Chart */}
        <div className="bg-command-surface p-5 rounded-xl border border-command-border">
          <h3 className="text-sm font-bold text-white mb-4">State-wise Risk Severity Breakdown</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="state" stroke="#8A99AD" fontSize={11} />
                <YAxis stroke="#8A99AD" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1A2333', borderColor: '#2A364F' }} />
                <Legend />
                <Bar dataKey="critical" fill="#EF4444" name="Critical" />
                <Bar dataKey="high" fill="#F97316" name="High" />
                <Bar dataKey="medium" fill="#F59E0B" name="Medium" />
                <Bar dataKey="low" fill="#10B981" name="Low" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall Risk Distribution Donut */}
        <div className="bg-command-surface p-5 rounded-xl border border-command-border">
          <h3 className="text-sm font-bold text-white mb-4">Regional Risk Proportions</h3>
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
                <Tooltip contentStyle={{ backgroundColor: '#1A2333', borderColor: '#2A364F' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
