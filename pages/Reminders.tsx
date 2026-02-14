import React from 'react';

const Reminders: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-20 pt-6">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-serif font-bold text-espresso">Reminders & Rules</h2>
                <button className="bg-espresso text-oat px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-espresso/90 transition-colors">
                    <span className="material-symbols-outlined text-sm">add</span> New Rule
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Active Rules */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-muted uppercase tracking-wider ml-1">Active Rules</h3>
                    
                    <div className="bg-white p-5 rounded-2xl border border-sage/20 shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-sage/10 rounded-full text-sage shrink-0">
                            <span className="material-symbols-outlined">restaurant</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-espresso">Feed Nudge</h4>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="toggle" id="toggle1" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-sage right-0"/>
                                    <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-5 rounded-full bg-sage cursor-pointer"></label>
                                </div>
                            </div>
                            <p className="text-sm text-muted mt-1">Alert if no feed recorded for <span className="text-espresso font-bold">3 hours</span>.</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-alert-red/20 shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-alert-red/10 rounded-full text-alert-red shrink-0">
                            <span className="material-symbols-outlined">medication</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-espresso">Antibiotics</h4>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" checked readOnly className="absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-alert-red right-0"/>
                                    <div className="block overflow-hidden h-5 rounded-full bg-alert-red cursor-pointer"></div>
                                </div>
                            </div>
                            <p className="text-sm text-muted mt-1">Daily at <span className="text-espresso font-bold">09:00, 21:00</span>.</p>
                        </div>
                    </div>
                     <div className="bg-white p-5 rounded-2xl border border-muted/10 shadow-sm flex items-start gap-4 opacity-70">
                        <div className="p-3 bg-muted/10 rounded-full text-muted shrink-0">
                            <span className="material-symbols-outlined">baby_changing_station</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-espresso">Diaper Check</h4>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <div className="block w-5 h-5 rounded-full bg-white border-4 border-gray-300"></div>
                                    <div className="block overflow-hidden h-5 rounded-full bg-gray-300 -z-10 absolute top-0 w-full"></div>
                                </div>
                            </div>
                            <p className="text-sm text-muted mt-1">Every 2 hours (Disabled).</p>
                        </div>
                    </div>
                </div>

                {/* Configuration */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-muted uppercase tracking-wider ml-1">Settings</h3>
                    <div className="bg-oat/50 rounded-2xl p-6 border border-muted/10 space-y-6">
                        <div>
                            <label className="text-sm font-bold text-espresso block mb-2">Quiet Hours</label>
                            <p className="text-xs text-muted mb-3">No notifications during these times.</p>
                            <div className="flex items-center gap-4">
                                <div className="bg-white px-4 py-2 rounded-xl border border-muted/20 text-sm font-mono">22:00</div>
                                <span className="text-muted text-sm">to</span>
                                <div className="bg-white px-4 py-2 rounded-xl border border-muted/20 text-sm font-mono">07:00</div>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-sm font-bold text-espresso block mb-2">Snooze Duration</label>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 rounded-xl bg-sage text-oat text-sm font-bold">15m</button>
                                <button className="px-4 py-2 rounded-xl bg-white border border-muted/20 text-muted text-sm font-bold hover:text-espresso">30m</button>
                                <button className="px-4 py-2 rounded-xl bg-white border border-muted/20 text-muted text-sm font-bold hover:text-espresso">1h</button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-sage/10 rounded-2xl p-6 border border-sage/20">
                         <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-sage">calendar_add_on</span>
                            <div>
                                <h4 className="font-bold text-espresso text-sm">Vaccine Schedule</h4>
                                <p className="text-xs text-muted mt-1 mb-3">Next due: <span className="font-bold">14 weeks (OPV-1, Penta-1)</span>. Add to calendar?</p>
                                <button className="text-xs font-bold text-sage hover:underline">Manage Schedule</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default Reminders;