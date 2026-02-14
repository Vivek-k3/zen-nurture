import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const tempData = [
    { time: '8 AM', temp: 98.6 },
    { time: '10 AM', temp: 99.2 },
    { time: '12 PM', temp: 100.1 },
    { time: '2 PM', temp: 100.8 },
    { time: '4 PM', temp: 100.4 },
    { time: '6 PM', temp: 99.9 },
    { time: '8 PM', temp: 99.5 },
];

const Health: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 mt-6">
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Active Meds */}
                <div className="lg:col-span-4 bg-surface rounded-[2rem] p-6 shadow-sm border border-white/60 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-clay/10 rounded-full">
                                <span className="material-symbols-outlined text-clay">medication_liquid</span>
                            </div>
                            <h2 className="text-lg font-bold text-espresso">Active Meds</h2>
                        </div>
                        <button className="text-xs font-bold text-sage bg-sage/10 px-3 py-1.5 rounded-full hover:bg-sage/20 transition-colors">
                            + Add New
                        </button>
                    </div>
                    <div className="space-y-4 flex-1">
                        <div className="bg-oat/50 rounded-2xl p-4 border border-muted/10 relative overflow-hidden group hover:border-clay/30 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-espresso">Ibuprofen</h3>
                                    <p className="text-xs text-muted">2.5ml • Teething Pain</p>
                                </div>
                                <span className="bg-clay text-white text-[10px] font-bold px-2 py-0.5 rounded-full">DUE SOON</span>
                            </div>
                            <div className="flex items-end justify-between mt-3">
                                <div>
                                    <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Next Dose</p>
                                    <p className="text-xl font-mono font-bold text-clay">18:00</p>
                                </div>
                                <button className="bg-white hover:bg-clay hover:text-white text-clay border border-clay/20 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm">
                                    Log Dose
                                </button>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-clay/20 w-full">
                                <div className="h-full bg-clay w-[85%] rounded-r-full"></div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-2xl p-4 border border-muted/10 relative overflow-hidden group hover:border-sage/30 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-espresso">Amoxicillin</h3>
                                    <p className="text-xs text-muted">5ml • Ear Infection</p>
                                </div>
                                <span className="bg-sage/20 text-sage text-[10px] font-bold px-2 py-0.5 rounded-full">ON TRACK</span>
                            </div>
                            <div className="flex items-end justify-between mt-3">
                                <div>
                                    <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Next Dose</p>
                                    <p className="text-xl font-mono font-bold text-sage">08:00 <span className="text-xs text-muted font-sans font-medium">Tomorrow</span></p>
                                </div>
                                <button className="bg-oat hover:bg-sage hover:text-white text-muted border border-muted/20 text-xs font-bold px-4 py-2 rounded-xl transition-all">
                                    Log Dose
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Temperature Trends */}
                <div className="lg:col-span-8 bg-surface rounded-[2rem] p-8 shadow-sm border border-white/60 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-alert-red/10 rounded-full">
                                <span className="material-symbols-outlined text-alert-red">thermometer</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-espresso">Temperature Trends</h2>
                                <p className="text-xs text-muted">Last 24 Hours</p>
                            </div>
                        </div>
                        <div className="flex items-center bg-oat rounded-lg p-1">
                            <button className="px-3 py-1 rounded-md text-xs font-bold text-espresso bg-white shadow-sm">Day</button>
                            <button className="px-3 py-1 rounded-md text-xs font-medium text-muted hover:text-espresso">Week</button>
                        </div>
                    </div>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={tempData}>
                                <defs>
                                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D67C7C" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#D67C7C" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9C9488'}} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Area type="monotone" dataKey="temp" stroke="#D67C7C" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-full bg-espresso text-white text-[10px] py-1 px-2 rounded mb-2 shadow-lg">
                            100.8°F at 2:00 PM
                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-espresso"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Health Timeline */}
            <div className="w-full">
                <div className="bg-surface rounded-[2rem] p-8 shadow-sm border border-white/60">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold text-espresso">Health Timeline</h2>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1 text-xs font-bold text-muted bg-oat px-3 py-1.5 rounded-lg hover:text-espresso transition-colors">
                                <span className="material-symbols-outlined text-[16px]">filter_list</span> Filter
                            </button>
                            <button className="flex items-center gap-1 text-xs font-bold text-muted bg-oat px-3 py-1.5 rounded-lg hover:text-espresso transition-colors">
                                <span className="material-symbols-outlined text-[16px]">download</span> Export
                            </button>
                        </div>
                    </div>
                    <div className="relative pl-4">
                        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-muted/20"></div>
                        
                        <div className="flex gap-6 mb-8 relative group">
                            <div className="relative z-10 h-10 w-10 rounded-full bg-clay text-white flex items-center justify-center shrink-0 shadow-sm ring-4 ring-surface">
                                <span className="material-symbols-outlined text-[20px]">pill</span>
                            </div>
                            <div className="flex-1 bg-oat/40 p-4 rounded-2xl border border-muted/10 hover:bg-oat hover:border-muted/20 transition-all cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-sm font-bold text-espresso">Medication Given</h4>
                                        <p className="text-xs text-muted mt-0.5">Ibuprofen (2.5ml)</p>
                                    </div>
                                    <span className="text-xs font-mono text-muted">14:30 PM</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <div 
                                        className="h-6 w-6 rounded-full bg-gray-200 bg-cover" 
                                        style={{ backgroundImage: 'url("https://picsum.photos/seed/mom/100/100")' }}
                                    ></div>
                                    <span className="text-[10px] text-muted font-medium">Logged by Mom</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 mb-8 relative group">
                            <div className="relative z-10 h-10 w-10 rounded-full bg-alert-red/90 text-white flex items-center justify-center shrink-0 shadow-sm ring-4 ring-surface">
                                <span className="material-symbols-outlined text-[20px]">thermometer</span>
                            </div>
                            <div className="flex-1 bg-oat/40 p-4 rounded-2xl border border-muted/10 hover:bg-oat hover:border-muted/20 transition-all cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-sm font-bold text-espresso">High Temperature</h4>
                                        <p className="text-xs text-muted mt-0.5">Recorded via Ear Thermometer</p>
                                    </div>
                                    <span className="text-xs font-mono text-muted">14:00 PM</span>
                                </div>
                                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-alert-red/10 text-alert-red text-xs font-bold">
                                    <span className="material-symbols-outlined text-[14px]">warning</span>
                                    100.8°F
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 relative group">
                            <div className="relative z-10 h-10 w-10 rounded-full bg-sage text-white flex items-center justify-center shrink-0 shadow-sm ring-4 ring-surface">
                                <span className="material-symbols-outlined text-[20px]">stethoscope</span>
                            </div>
                            <div className="flex-1 bg-oat/40 p-4 rounded-2xl border border-muted/10 hover:bg-oat hover:border-muted/20 transition-all cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-sm font-bold text-espresso">Symptom Check</h4>
                                        <p className="text-xs text-muted mt-0.5">Fussiness, tugging at ear</p>
                                    </div>
                                    <span className="text-xs font-mono text-muted">13:15 PM</span>
                                </div>
                                <p className="text-sm text-espresso/80 mt-2 bg-white/50 p-2 rounded-lg italic">"Leo seems very uncomfortable today, might be teething or ear pain."</p>
                            </div>
                        </div>

                    </div>
                    <div className="mt-8 text-center">
                        <button className="text-xs font-bold text-muted hover:text-sage transition-colors uppercase tracking-wider">Load Previous Days</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Health;