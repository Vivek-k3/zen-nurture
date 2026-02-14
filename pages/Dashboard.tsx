import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10">
      {/* Header handled in App.tsx layout usually, but here we can add page-specific titles if needed or assume layout handles it. 
          Based on design, the header "Good Morning, Sarah" is inside the main view. */}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-6">
        {/* Last Sleep */}
        <div 
            onClick={() => navigate('/sleep')}
            className="group h-48 rounded-[24px] bg-surface shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-white/60 p-6 flex flex-col justify-between hover:border-sage/30 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 h-32 w-32 bg-dusty-blue/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="h-10 w-10 rounded-full bg-dusty-blue/10 flex items-center justify-center text-dusty-blue">
              <span className="material-symbols-outlined">bedtime</span>
            </div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider bg-oat px-2 py-1 rounded-lg">Last Sleep</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-espresso font-mono mb-1">2h 15m</div>
            <p className="text-sm text-muted">Woke up at 7:30 AM</p>
          </div>
          <div className="w-full bg-oat h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-dusty-blue h-full rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Last Feed */}
        <div 
            className="group h-48 rounded-[24px] bg-surface shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-white/60 p-6 flex flex-col justify-between hover:border-sage/30 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 h-32 w-32 bg-sage/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="h-10 w-10 rounded-full bg-sage/10 flex items-center justify-center text-sage">
              <span className="material-symbols-outlined">water_drop</span>
            </div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider bg-oat px-2 py-1 rounded-lg">Last Feed</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-espresso font-mono mb-1">150ml</div>
            <p className="text-sm text-muted">Formula • 2 hours ago</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-medium text-sage bg-sage/10 px-2 py-0.5 rounded">Next: ~11:30 AM</span>
          </div>
        </div>

        {/* Diaper */}
        <div 
            className="group h-48 rounded-[24px] bg-surface shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-white/60 p-6 flex flex-col justify-between hover:border-sage/30 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 h-32 w-32 bg-clay/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="h-10 w-10 rounded-full bg-clay/10 flex items-center justify-center text-clay">
              <span className="material-symbols-outlined">baby_changing_station</span>
            </div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider bg-oat px-2 py-1 rounded-lg">Diaper</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-espresso mb-1">Wet</div>
            <p className="text-sm text-muted">Changed 45 mins ago</p>
          </div>
          <div className="flex -space-x-2 mt-2">
            <div className="h-6 w-6 rounded-full bg-clay/20 border-2 border-white flex items-center justify-center text-[10px] text-clay font-bold">W</div>
            <div className="h-6 w-6 rounded-full bg-espresso/10 border-2 border-white flex items-center justify-center text-[10px] text-muted font-bold">M</div>
            <div className="h-6 w-6 rounded-full bg-sage/20 border-2 border-white flex items-center justify-center text-[10px] text-sage font-bold">S</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-espresso">Daily Schedule</h3>
            <button className="text-sm text-sage font-medium hover:text-sage-dark flex items-center gap-1">
               View Calendar <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="bg-surface rounded-[32px] p-8 shadow-sm border border-white/60">
            <div className="relative pl-6 border-l-2 border-dashed border-muted/20 space-y-10">
              {/* Event 1 */}
              <div className="relative">
                <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-sage ring-4 ring-white shadow-sm"></span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <h4 className="text-sm font-bold text-sage uppercase tracking-wider">Happening Now</h4>
                  <span className="text-xs font-mono text-muted">10:45 AM</span>
                </div>
                <div className="bg-sage/5 rounded-2xl p-4 border border-sage/10 flex items-center gap-4">
                  <div className="bg-white p-2 rounded-xl shadow-sm text-sage">
                    <span className="material-symbols-outlined">toys</span>
                  </div>
                  <div>
                    <p className="font-bold text-espresso">Playtime & Tummy Time</p>
                    <p className="text-sm text-muted">Duration: 15m so far</p>
                  </div>
                  <button className="ml-auto bg-white hover:bg-sage/10 text-sage h-8 w-8 flex items-center justify-center rounded-full transition-colors">
                    <span className="material-symbols-outlined">stop</span>
                  </button>
                </div>
              </div>

              {/* Event 2 */}
              <div className="relative opacity-60">
                <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-white border-2 border-muted/40"></span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <h4 className="text-sm font-bold text-muted uppercase tracking-wider">Up Next</h4>
                  <span className="text-xs font-mono text-muted">11:30 AM</span>
                </div>
                <div className="bg-oat rounded-2xl p-4 flex items-center gap-4">
                  <div className="bg-white p-2 rounded-xl shadow-sm text-muted">
                    <span className="material-symbols-outlined">restaurant</span>
                  </div>
                  <div>
                    <p className="font-bold text-espresso">Feeding Time</p>
                    <p className="text-sm text-muted">Estimated 180ml</p>
                  </div>
                </div>
              </div>

               {/* Event 3 */}
               <div className="relative opacity-40">
                <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-muted/20"></span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted w-12">09:00</span>
                  <p className="text-sm font-medium text-espresso">Morning Nap (45m)</p>
                </div>
              </div>

              {/* Event 4 */}
               <div className="relative opacity-40">
                <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-muted/20"></span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted w-12">08:15</span>
                  <p className="text-sm font-medium text-espresso">Diaper Change (Wet)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Insights & Quick Actions */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-espresso">Smart Insights</h3>
          
          <div 
            onClick={() => navigate('/insights')}
            className="bg-espresso text-oat rounded-[32px] p-6 shadow-lg relative overflow-hidden cursor-pointer hover:bg-espresso/95 transition-colors"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-sage-light">auto_awesome</span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">Growth Trends</span>
            </div>
            <div className="space-y-6 relative z-10">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-white/80">Weight</span>
                  <span className="text-2xl font-mono font-bold">6.8 <span className="text-sm text-white/50">kg</span></span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-sage to-sage-light h-full w-[70%]"></div>
                </div>
                <p className="text-xs text-white/40 mt-2">+120g since last week</p>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-medium text-white/80">Height</span>
                  <span className="text-2xl font-mono font-bold">62 <span className="text-sm text-white/50">cm</span></span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-clay to-orange-200 h-full w-[60%]"></div>
                </div>
                <p className="text-xs text-white/40 mt-2">Consistent with growth curve</p>
              </div>
            </div>
            <button className="mt-8 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                View Full Report
            </button>
          </div>

          <div className="bg-surface rounded-[32px] p-6 shadow-sm border border-white/60">
            <h4 className="text-sm font-bold text-muted mb-4 uppercase tracking-wider">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 rounded-2xl bg-oat hover:bg-sage/10 border border-transparent hover:border-sage/20 transition-all flex flex-col items-center justify-center gap-2 group">
                <span className="material-symbols-outlined text-sage group-hover:scale-110 transition-transform">water_drop</span>
                <span className="text-xs font-bold text-espresso">Log Feed</span>
              </button>
              <button className="p-4 rounded-2xl bg-oat hover:bg-dusty-blue/10 border border-transparent hover:border-dusty-blue/20 transition-all flex flex-col items-center justify-center gap-2 group">
                <span className="material-symbols-outlined text-dusty-blue group-hover:scale-110 transition-transform">bedtime</span>
                <span className="text-xs font-bold text-espresso">Log Sleep</span>
              </button>
              <button className="p-4 rounded-2xl bg-oat hover:bg-clay/10 border border-transparent hover:border-clay/20 transition-all flex flex-col items-center justify-center gap-2 group">
                <span className="material-symbols-outlined text-clay group-hover:scale-110 transition-transform">baby_changing_station</span>
                <span className="text-xs font-bold text-espresso">Diaper</span>
              </button>
              <button className="p-4 rounded-2xl bg-oat hover:bg-muted/20 border border-transparent hover:border-muted/30 transition-all flex flex-col items-center justify-center gap-2 group">
                <span className="material-symbols-outlined text-muted group-hover:scale-110 transition-transform">add</span>
                <span className="text-xs font-bold text-espresso">More</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;