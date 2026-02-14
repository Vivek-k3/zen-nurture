import React from 'react';

const Today: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-20 pt-6">
      
      {/* Date Header Mobile */}
      <div className="lg:hidden mb-6">
        <h2 className="text-2xl font-serif font-bold text-espresso">Today</h2>
        <p className="text-sm text-muted">Wednesday, 14 Feb</p>
      </div>

      {/* Now Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-8">
        {/* Feed Card */}
        <div className="bg-white p-4 rounded-[20px] shadow-sm border border-muted/10 flex flex-col justify-between h-32 lg:h-40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-sage">water_drop</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sage"></span>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Last Feed</span>
            </div>
            <div>
                <div className="text-2xl lg:text-3xl font-mono font-bold text-espresso">2h 10m</div>
                <div className="text-xs text-muted font-medium mt-1">120ml • Formula</div>
            </div>
        </div>

        {/* Diaper Card */}
        <div className="bg-white p-4 rounded-[20px] shadow-sm border border-muted/10 flex flex-col justify-between h-32 lg:h-40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-clay">baby_changing_station</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-clay"></span>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Diaper</span>
            </div>
            <div>
                <div className="text-2xl lg:text-3xl font-mono font-bold text-espresso">45m</div>
                <div className="text-xs text-muted font-medium mt-1">Wet Only</div>
            </div>
        </div>

        {/* Sleep Card */}
        <div className="bg-night/5 p-4 rounded-[20px] shadow-sm border border-night/5 flex flex-col justify-between h-32 lg:h-40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-night">bedtime</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-night"></span>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Sleep</span>
            </div>
            <div>
                <div className="text-lg lg:text-xl font-bold text-espresso">Awake</div>
                <div className="text-xs text-muted font-medium mt-1">Woke 1h 30m ago</div>
                <div className="mt-2 w-full bg-white h-1 rounded-full overflow-hidden">
                    <div className="bg-night w-[60%] h-full rounded-full"></div>
                </div>
            </div>
        </div>

        {/* Meds Card */}
        <div className="bg-white p-4 rounded-[20px] shadow-sm border border-muted/10 flex flex-col justify-between h-32 lg:h-40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-alert-red">medication</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-alert-red"></span>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Meds</span>
            </div>
            <div>
                <div className="text-lg font-bold text-espresso">Ibuprofen</div>
                <div className="text-xs text-alert-red font-bold mt-1">Due in 30m</div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Next Up / Timeline */}
        <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-espresso font-serif">Next Up</h3>
            
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-muted/10">
                <div className="space-y-6">
                    {/* Item 1 */}
                    <div className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                            <div className="text-xs font-mono text-muted mb-2">14:00</div>
                            <div className="w-0.5 h-full bg-sage/20 group-last:bg-transparent relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-sage ring-4 ring-white"></div>
                            </div>
                        </div>
                        <div className="flex-1 pb-6">
                            <div className="bg-sage/5 p-4 rounded-2xl border border-sage/10 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-espresso">Feeding Due</h4>
                                    <p className="text-xs text-muted">Usually eats every 3h</p>
                                </div>
                                <button className="bg-white hover:bg-sage text-sage hover:text-white border border-sage/20 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                                    Log Feed
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Item 2 */}
                    <div className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                            <div className="text-xs font-mono text-muted mb-2">14:30</div>
                            <div className="w-0.5 h-full bg-muted/10 group-last:bg-transparent relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-alert-red ring-4 ring-white"></div>
                            </div>
                        </div>
                        <div className="flex-1 pb-6">
                             <div className="bg-alert-red/5 p-4 rounded-2xl border border-alert-red/10 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-espresso">Vitamin D3 Drops</h4>
                                    <p className="text-xs text-muted">Daily Dose • 1ml</p>
                                </div>
                                <button className="bg-white hover:bg-alert-red text-alert-red hover:text-white border border-alert-red/20 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                                    Mark Done
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Item 3 */}
                    <div className="flex gap-4 group opacity-60">
                         <div className="flex flex-col items-center">
                            <div className="text-xs font-mono text-muted mb-2">15:00</div>
                            <div className="w-0.5 h-full bg-muted/10 group-last:bg-transparent relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-dusty-blue ring-4 ring-white"></div>
                            </div>
                        </div>
                        <div className="flex-1">
                             <div className="bg-oat p-4 rounded-2xl border border-transparent">
                                <div>
                                    <h4 className="font-bold text-espresso">Afternoon Nap</h4>
                                    <p className="text-xs text-muted">Expected duration: 1h 30m</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* AI Insight Snippet */}
        <div className="space-y-6">
             <h3 className="text-lg font-bold text-espresso font-serif">Daily Brief</h3>
             <div className="bg-espresso text-oat p-6 rounded-[24px] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="relative z-10 space-y-4">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-sage-light">auto_awesome</span>
                        <p className="text-sm leading-relaxed text-white/90">
                            Leo is eating well today! Total intake is <strong className="text-white">450ml</strong> so far, which is slightly higher than yesterday by this time.
                        </p>
                    </div>
                    <div className="h-px bg-white/10 w-full"></div>
                    <div className="flex items-start gap-3">
                         <span className="material-symbols-outlined text-sage-light">check_circle</span>
                         <p className="text-sm leading-relaxed text-white/90">
                            Vaccination appointment is coming up in 3 days.
                        </p>
                    </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-[24px] border border-muted/10 shadow-sm">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Quick Tip</h4>
                <p className="text-sm text-espresso font-medium">
                    Try keeping the room slightly cooler (20-22°C) for the afternoon nap to help extend sleep duration.
                </p>
             </div>
        </div>

      </div>
    </div>
  );
};

export default Today;