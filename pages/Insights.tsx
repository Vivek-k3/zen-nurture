import React from 'react';
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
    ReferenceLine
} from 'recharts';

const growthData = [
  { month: 'Birth', weight: 3.5 },
  { month: '1m', weight: 4.2 },
  { month: '2m', weight: 5.1 },
  { month: '3m', weight: 6.0 },
  { month: '4m', weight: 6.85 },
];

const whoData = [
    { month: 'Birth', p50: 3.3 },
    { month: '1m', p50: 4.5 },
    { month: '2m', p50: 5.6 },
    { month: '3m', p50: 6.4 },
    { month: '4m', p50: 7.0 },
];

const feedingData = [
    { day: 'M', ml: 650 },
    { day: 'T', ml: 720 },
    { day: 'W', ml: 580 },
    { day: 'T', ml: 800 },
    { day: 'F', ml: 750 },
    { day: 'S', ml: 850 },
    { day: 'S', ml: 450 }, // Current day, low
];

const Insights: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 space-y-8 mt-6">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-white/50 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-sage/10 rounded-full text-sage">
                            <span className="material-symbols-outlined text-[20px]">monitor_weight</span>
                        </div>
                        <span className="text-sm font-bold text-muted">Weight</span>
                    </div>
                    <span className="text-xs bg-sage/10 text-sage px-2 py-1 rounded-full font-bold">+210g</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-espresso font-display">6.85</span>
                    <span className="text-sm font-medium text-muted">kg</span>
                </div>
                <div className="text-xs text-muted">54th Percentile • WHO Standards</div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-sage/10">
                    <div className="h-full bg-sage w-[54%] rounded-r-full"></div>
                </div>
            </div>

            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-white/50 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-dusty-blue/10 rounded-full text-dusty-blue">
                            <span className="material-symbols-outlined text-[20px]">straighten</span>
                        </div>
                        <span className="text-sm font-bold text-muted">Length</span>
                    </div>
                    <span className="text-xs bg-dusty-blue/10 text-dusty-blue px-2 py-1 rounded-full font-bold">+1.2cm</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-espresso font-display">64.5</span>
                    <span className="text-sm font-medium text-muted">cm</span>
                </div>
                <div className="text-xs text-muted">72nd Percentile • WHO Standards</div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-dusty-blue/10">
                    <div className="h-full bg-dusty-blue w-[72%] rounded-r-full"></div>
                </div>
            </div>

            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-white/50 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-clay/10 rounded-full text-clay">
                            <span className="material-symbols-outlined text-[20px]">face</span>
                        </div>
                        <span className="text-sm font-bold text-muted">Head Circ.</span>
                    </div>
                    <span className="text-xs bg-muted/10 text-muted px-2 py-1 rounded-full font-bold">Stable</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-espresso font-display">42.1</span>
                    <span className="text-sm font-medium text-muted">cm</span>
                </div>
                <div className="text-xs text-muted">60th Percentile • WHO Standards</div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-clay/10">
                    <div className="h-full bg-clay w-[60%] rounded-r-full"></div>
                </div>
            </div>
        </div>

        {/* Growth Curve Chart */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-white/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-espresso">Growth Curve</h3>
                    <p className="text-sm text-muted">Comparing Leo's growth against WHO Percentiles</p>
                </div>
                <div className="flex bg-oat p-1 rounded-full self-start">
                    <button className="px-4 py-1.5 rounded-full bg-white shadow-sm text-xs font-bold text-espresso transition-all">Weight</button>
                    <button className="px-4 py-1.5 rounded-full text-xs font-medium text-muted hover:text-espresso transition-all">Length</button>
                    <button className="px-4 py-1.5 rounded-full text-xs font-medium text-muted hover:text-espresso transition-all">Head</button>
                </div>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECE9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9C9488', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9C9488', fontSize: 12}} domain={[2, 10]} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Line type="monotone" dataKey="weight" stroke="#4A4238" strokeWidth={3} dot={{r: 4, fill: '#4A4238'}} activeDot={{r: 6}} />
                        {/* Simulated WHO Curve */}
                        <Line type="monotone" data={whoData} dataKey="p50" stroke="#E0DCD5" strokeWidth={4} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-white/50">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-espresso">Feeding Trends</h3>
                        <p className="text-sm text-muted">Daily volume (ml)</p>
                    </div>
                    <div className="p-2 bg-oat rounded-full">
                        <span className="material-symbols-outlined text-muted text-sm">calendar_today</span>
                    </div>
                </div>
                <div className="h-40 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={feedingData} barSize={32}>
                            <Bar dataKey="ml" fill="#7C9082" radius={[6, 6, 0, 0]} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t border-muted/10 flex justify-between items-center text-xs">
                    <span className="text-muted">Weekly Average</span>
                    <span className="font-bold text-espresso text-sm">715ml / day</span>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div className="bg-espresso text-oat rounded-[32px] p-6 shadow-md relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <span className="inline-block px-2 py-1 rounded bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider mb-2">Upcoming</span>
                            <h3 className="text-lg font-bold">4 Month Well-Child Visit</h3>
                            <p className="text-sm text-oat/70 mt-1">Dr. Sarah Thompson • Pediatric Clinic</p>
                        </div>
                        <div className="text-center bg-white/10 rounded-xl p-2 min-w-[60px]">
                            <div className="text-[10px] uppercase font-bold text-oat/60">Nov</div>
                            <div className="text-xl font-bold">14</div>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-3 relative z-10">
                        <button className="flex-1 bg-oat text-espresso font-bold text-xs py-3 rounded-xl hover:bg-white transition-colors">
                            Add to Calendar
                        </button>
                        <button className="flex-1 border border-white/20 text-oat font-bold text-xs py-3 rounded-xl hover:bg-white/10 transition-colors">
                            Prepare Questions
                        </button>
                    </div>
                </div>

                <div className="bg-surface border border-muted/10 rounded-[32px] p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-yellow-600">star</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-espresso text-sm">New Milestone Unlocked!</h4>
                        <p className="text-xs text-muted">First giggle recorded yesterday.</p>
                    </div>
                    <button className="text-sage text-sm font-bold hover:underline">View</button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Insights;