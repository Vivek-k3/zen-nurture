import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const sleepData = [
  { name: 'Awake', value: 11, color: '#F5F2EB' },
  { name: 'Night Sleep', value: 10.5, color: '#4A4238' },
  { name: 'Nap', value: 2.5, color: '#8CA9B3' },
];

const Sleep: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 mt-6">
        <div className="max-w-xl mx-auto space-y-8">
            
            {/* Donut Chart */}
            <div className="flex justify-center py-4">
                <div className="w-52 h-52 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sleepData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                                stroke="none"
                            >
                                {sleepData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Inner Content */}
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                         <div className="bg-white rounded-full w-36 h-36 shadow-sm flex flex-col items-center justify-center">
                             <span className="block text-3xl font-bold text-espresso font-mono">13h</span>
                             <span className="text-xs text-muted uppercase tracking-wider font-semibold">Total Sleep</span>
                         </div>
                    </div>
                    {/* Markers */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-[10px] text-muted font-mono">12 PM</div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 text-[10px] text-muted font-mono">12 AM</div>
                </div>
            </div>

            {/* Predictive Sleep Card */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">psychology</span>
                    Predictive Sleep
                </h3>
                <div className="bg-dusty-blue/10 border border-dusty-blue/20 rounded-2xl p-5 relative overflow-hidden group hover:bg-dusty-blue/15 transition-colors">
                    <div className="absolute -right-6 -bottom-6 text-dusty-blue/10 rotate-12 transition-transform group-hover:rotate-0">
                        <span className="material-symbols-outlined text-[120px]">bedtime</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-dusty-blue text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-dusty-blue animate-pulse"></span>
                                High Probability
                            </span>
                        </div>
                        <h4 className="text-lg font-bold text-espresso mb-1">Next nap likely at 2:00 PM</h4>
                        <p className="text-sm text-muted">Wake window is closing. Baby has been awake for 2h 15m.</p>
                        <button className="mt-4 text-xs font-semibold text-dusty-blue flex items-center gap-1 hover:gap-2 transition-all">
                            View Sleep Schedule <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Today's Sessions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Today's Sessions</h3>
                    <button className="h-6 w-6 rounded-full bg-oat hover:bg-muted/20 flex items-center justify-center text-muted transition-colors">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                </div>
                <div className="space-y-3">
                    <div className="bg-white rounded-xl p-4 border border-muted/10 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-oat flex items-center justify-center text-espresso shrink-0">
                            <span className="material-symbols-outlined">sunny</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-bold text-espresso">Morning Nap</span>
                                <span className="text-xs font-mono text-muted bg-oat px-2 py-0.5 rounded-full">1h 15m</span>
                            </div>
                            <p className="text-xs text-muted flex items-center gap-2">
                                9:30 AM - 10:45 AM
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="material-symbols-outlined text-[18px] text-sage">sentiment_satisfied</span>
                            <span className="text-[9px] font-bold text-sage uppercase">Good</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-muted/10 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-night/5 flex items-center justify-center text-night shrink-0">
                            <span className="material-symbols-outlined">nights_stay</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-bold text-espresso">Night Sleep</span>
                                <span className="text-xs font-mono text-muted bg-oat px-2 py-0.5 rounded-full">10h 30m</span>
                            </div>
                            <p className="text-xs text-muted flex items-center gap-2">
                                8:00 PM - 6:30 AM
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="material-symbols-outlined text-[18px] text-clay">sentiment_neutral</span>
                            <span className="text-[9px] font-bold text-clay uppercase">Okay</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Action Footer */}
             <div className="p-6 border-t border-muted/10 bg-surface/90 backdrop-blur-sm mt-auto z-20 rounded-2xl">
                <button className="w-full bg-dusty-blue hover:bg-[#7A96A0] active:scale-[0.99] text-white h-14 rounded-full font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_-10px_rgba(140,169,179,0.5)]">
                    <span className="material-symbols-outlined">timer</span>
                    Start Sleep Timer
                </button>
                <div className="mt-3 text-center">
                    <button className="text-xs text-muted font-medium hover:text-espresso transition-colors">
                        Log manually instead
                    </button>
                </div>
            </div>

        </div>
    </div>
  );
};

export default Sleep;