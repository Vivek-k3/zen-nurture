import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-20 pt-6">
         <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-2xl font-serif font-bold text-espresso">Settings</h2>

            {/* Profile */}
            <section className="bg-white rounded-[24px] p-6 border border-muted/10 shadow-sm">
                <h3 className="text-lg font-bold text-espresso mb-4">Baby Profile</h3>
                <div className="flex items-center gap-4 mb-6">
                    <div 
                        className="bg-center bg-no-repeat bg-cover rounded-full h-20 w-20 shadow-sm ring-4 ring-oat" 
                        style={{ backgroundImage: 'url("https://picsum.photos/seed/baby/200/200")' }}
                    >
                        <div className="w-full h-full bg-black/20 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white">
                            <span className="material-symbols-outlined">edit</span>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-xl text-espresso">Leo</h4>
                        <p className="text-sm text-muted">Born 14 Oct 2023 • 4 Months Old</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Display Name</label>
                        <input type="text" defaultValue="Leo" className="w-full p-3 rounded-xl bg-oat border-transparent focus:border-sage focus:ring-0 text-espresso font-medium"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Gender</label>
                        <select className="w-full p-3 rounded-xl bg-oat border-transparent focus:border-sage focus:ring-0 text-espresso font-medium">
                            <option>Boy</option>
                            <option>Girl</option>
                        </select>
                    </div>
                </div>
            </section>

             {/* Caregivers */}
            <section className="bg-white rounded-[24px] p-6 border border-muted/10 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-espresso">Caregivers</h3>
                    <button className="text-xs font-bold text-sage hover:underline">+ Add</button>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-oat/50 border border-muted/10">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-sage/20 flex items-center justify-center text-sage font-bold text-xs">M</div>
                            <span className="font-bold text-espresso text-sm">Mom (You)</span>
                        </div>
                        <span className="text-xs text-muted">Admin</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-oat/50 border border-muted/10">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-clay/20 flex items-center justify-center text-clay font-bold text-xs">D</div>
                            <span className="font-bold text-espresso text-sm">Dad</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Ruleset Editor */}
            <section className="bg-white rounded-[24px] p-6 border border-muted/10 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-espresso">Advanced Ruleset</h3>
                    <span className="px-2 py-0.5 rounded bg-sage/10 text-sage text-[10px] font-bold uppercase">JSON</span>
                </div>
                <p className="text-sm text-muted mb-4">Edit the raw configuration for feed intervals, diaper limits, and defaults.</p>
                <div className="bg-night rounded-xl p-4 font-mono text-xs text-sage-light overflow-x-auto">
<pre>{`{
  "feed": {
    "warnIntervalMinutes": 180,
    "defaultVolumeMl": 120
  },
  "diaper": {
    "expectedDailyCount": 6
  },
  "meds": {
    "trackStock": false
  }
}`}</pre>
                </div>
            </section>
         </div>
    </div>
  );
};

export default Settings;