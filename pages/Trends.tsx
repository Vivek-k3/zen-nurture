import React, { useState } from 'react';
import { 
    ResponsiveContainer, 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip,
    BarChart,
    Bar,
} from 'recharts';

const data7d = [
    { day: 'Mon', ml: 650, sleep: 13 },
    { day: 'Tue', ml: 720, sleep: 12.5 },
    { day: 'Wed', ml: 580, sleep: 14 },
    { day: 'Thu', ml: 800, sleep: 11 },
    { day: 'Fri', ml: 750, sleep: 13.5 },
    { day: 'Sat', ml: 850, sleep: 12 },
    { day: 'Sun', ml: 450, sleep: 13 },
];

const Trends: React.FC = () => {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('7d');

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-20 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
             <h2 className="text-2xl font-serif font-bold text-espresso">Trends & Analysis</h2>
             <div className="bg-white p-1 rounded-xl shadow-sm border border-muted/10 inline-flex self-start">
                {['24h', '7d', '30d'].map((r) => (
                    <button 
                        key={r}
                        onClick={() => setRange(r as any)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${range === r ? 'bg-espresso text-oat shadow-sm' : 'text-muted hover:text-espresso'}`}
                    >
                        {r}
                    </button>
                ))}
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Feeding Chart */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-muted/10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-espresso">Intake</h3>
                        <p className="text-sm text-muted">Formula + Breast Milk</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-mono font-bold text-sage">715<span className="text-sm text-muted ml-1">ml</span></div>
                        <div className="text-xs text-muted">Avg / Day</div>
                    </div>
                </div>
                <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data7d} barSize={24}>
                            <CartesianGrid vertical={false} stroke="#F5F2EB" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#9C9488', fontSize: 12}} />
                            <Bar dataKey="ml" fill="#7C9082" radius={[6, 6, 6, 6]} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Sleep Chart */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-muted/10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-espresso">Sleep</h3>
                        <p className="text-sm text-muted">Total hours per day</p>
                    </div>
                     <div className="text-right">
                        <div className="text-2xl font-mono font-bold text-dusty-blue">12.8<span className="text-sm text-muted ml-1">h</span></div>
                        <div className="text-xs text-muted">Avg / Day</div>
                    </div>
                </div>
                <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data7d}>
                            <CartesianGrid vertical={false} stroke="#F5F2EB" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#9C9488', fontSize: 12}} />
                             <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="sleep" stroke="#8CA9B3" strokeWidth={3} dot={{fill: '#8CA9B3'}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-muted/10">
                <div className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Diapers</div>
                <div className="text-3xl font-mono font-bold text-clay">6.2</div>
                <div className="text-xs text-muted mt-1">Avg / Day</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-muted/10">
                 <div className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Weight</div>
                <div className="text-3xl font-mono font-bold text-espresso">6.8<span className="text-lg">kg</span></div>
                <div className="text-xs text-sage font-bold mt-1">+120g this week</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-muted/10">
                 <div className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Med Adherence</div>
                <div className="text-3xl font-mono font-bold text-espresso">100%</div>
                <div className="text-xs text-muted mt-1">Last 7 days</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-muted/10">
                 <div className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Feed Interval</div>
                <div className="text-3xl font-mono font-bold text-espresso">2.8<span className="text-lg">h</span></div>
                <div className="text-xs text-muted mt-1">Average</div>
            </div>
        </div>
    </div>
  );
};

export default Trends;