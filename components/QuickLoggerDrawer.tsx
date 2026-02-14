import React, { useState } from 'react';

interface QuickLoggerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type LogType = 'menu' | 'feed' | 'diaper' | 'sleep' | 'meds' | 'note' | 'growth';

const QuickLoggerDrawer: React.FC<QuickLoggerDrawerProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<LogType>('menu');
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(120);

  if (!isOpen) return null;

  const handleBack = () => {
    if (view === 'menu') onClose();
    else setView('menu');
  };

  const LogTile = ({ icon, label, color, onClick }: { icon: string; label: string; color: string; onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:border-${color}/20 bg-white shadow-sm`}
    >
      <div className={`h-12 w-12 rounded-full bg-${color}/10 flex items-center justify-center text-${color}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <span className="text-sm font-bold text-espresso">{label}</span>
    </button>
  );

  return (
    <>
      <div 
        className="fixed inset-0 bg-espresso/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-[#FDFBF7] z-50 flex flex-col shadow-2xl transform transition-transform animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-muted/10 bg-white/50">
            <div className="flex items-center gap-4">
                {view !== 'menu' && (
                    <button onClick={handleBack} className="h-8 w-8 rounded-full hover:bg-muted/10 flex items-center justify-center text-espresso transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                )}
                <h2 className="text-xl font-bold text-espresso font-serif tracking-tight">
                    {view === 'menu' ? 'Log Event' : `Log ${view.charAt(0).toUpperCase() + view.slice(1)}`}
                </h2>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted/10 flex items-center justify-center text-muted transition-colors">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            
            {/* Voice Command Bar */}
            {view === 'menu' && (
                <div className="mb-8">
                    <button 
                        onClick={() => setIsListening(!isListening)}
                        className={`w-full p-4 rounded-2xl flex items-center gap-4 border transition-all ${
                            isListening 
                            ? 'bg-alert-red/5 border-alert-red/30 text-alert-red' 
                            : 'bg-white border-muted/20 text-muted hover:border-sage/50 hover:shadow-sm'
                        }`}
                    >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isListening ? 'bg-alert-red text-white animate-pulse' : 'bg-sage/10 text-sage'}`}>
                            <span className="material-symbols-outlined">{isListening ? 'mic' : 'mic_none'}</span>
                        </div>
                        <div className="text-left">
                            <p className={`text-sm font-bold ${isListening ? 'text-espresso' : 'text-espresso'}`}>
                                {isListening ? 'Listening...' : 'Tap to speak'}
                            </p>
                            <p className="text-xs opacity-70">"Logged 120ml milk just now"</p>
                        </div>
                    </button>
                </div>
            )}

            {/* Menu Grid */}
            {view === 'menu' && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Essentials</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <LogTile icon="water_drop" label="Feed" color="sage" onClick={() => setView('feed')} />
                            <LogTile icon="baby_changing_station" label="Diaper" color="clay" onClick={() => setView('diaper')} />
                            <LogTile icon="bedtime" label="Sleep" color="dusty-blue" onClick={() => setView('sleep')} />
                            <LogTile icon="medication" label="Medicine" color="alert-red" onClick={() => setView('meds')} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Growth & More</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <LogTile icon="straighten" label="Growth" color="espresso" onClick={() => setView('growth')} />
                            <LogTile icon="edit_note" label="Note" color="muted" onClick={() => setView('note')} />
                            <LogTile icon="vaccines" label="Vaccine" color="sage" onClick={() => setView('note')} />
                        </div>
                    </div>
                </div>
            )}

            {/* Feed View */}
            {view === 'feed' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex bg-oat p-1 rounded-xl">
                        <button className="flex-1 py-2 rounded-lg bg-white shadow-sm text-sm font-bold text-espresso">Bottle</button>
                        <button className="flex-1 py-2 rounded-lg text-sm font-medium text-muted hover:text-espresso">Breast</button>
                        <button className="flex-1 py-2 rounded-lg text-sm font-medium text-muted hover:text-espresso">Solids</button>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-muted/10 text-center space-y-4 shadow-sm">
                        <div className="text-5xl font-mono font-bold text-espresso tracking-tighter">
                            {volume}<span className="text-lg text-muted ml-1">ml</span>
                        </div>
                        <input 
                            type="range" min="0" max="300" step="10" 
                            value={volume} onChange={(e) => setVolume(Number(e.target.value))}
                            className="w-full accent-sage"
                        />
                        <div className="flex justify-center gap-2 pt-2">
                            {[60, 90, 120, 150].map(v => (
                                <button key={v} onClick={() => setVolume(v)} className="px-3 py-1 rounded-full bg-oat text-xs font-bold text-muted hover:bg-sage/10 hover:text-sage transition-colors">
                                    {v}ml
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-muted uppercase tracking-wider">Contents</label>
                        <select className="w-full p-4 rounded-xl bg-white border border-muted/10 text-espresso font-medium focus:outline-none focus:ring-2 focus:ring-sage/20">
                            <option>Formula (Enfamil)</option>
                            <option>Breast Milk (Pumped)</option>
                            <option>Cow Milk</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Diaper View */}
            {view === 'diaper' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="grid grid-cols-3 gap-4">
                        <button className="aspect-square rounded-2xl bg-white border-2 border-transparent hover:border-sage focus:border-sage shadow-sm flex flex-col items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-3xl text-sage">water_drop</span>
                            <span className="font-bold text-espresso">Wet</span>
                        </button>
                        <button className="aspect-square rounded-2xl bg-white border-2 border-transparent hover:border-clay focus:border-clay shadow-sm flex flex-col items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-3xl text-clay">poop</span>
                            <span className="font-bold text-espresso">Dirty</span>
                        </button>
                        <button className="aspect-square rounded-2xl bg-white border-2 border-transparent hover:border-espresso focus:border-espresso shadow-sm flex flex-col items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-3xl text-espresso">format_color_reset</span>
                            <span className="font-bold text-espresso">Mixed</span>
                        </button>
                    </div>
                    
                    <div className="bg-alert-red/5 rounded-2xl p-4 flex items-center gap-3">
                        <div className="checkbox-wrapper-1">
                             <input type="checkbox" className="w-5 h-5 text-alert-red rounded focus:ring-alert-red" />
                        </div>
                        <label className="text-sm font-medium text-alert-red">Diaper Rash visible?</label>
                    </div>
                </div>
            )}
        </div>

        {/* Action Footer */}
        {view !== 'menu' && (
            <div className="p-6 border-t border-muted/10 bg-white/80 backdrop-blur-md">
                <button 
                    onClick={onClose}
                    className="w-full h-14 bg-espresso text-oat rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-espresso/90 active:scale-[0.99] transition-all shadow-lg shadow-espresso/10"
                >
                    <span className="material-symbols-outlined">check</span>
                    Save Entry
                </button>
            </div>
        )}
      </div>
    </>
  );
};

export default QuickLoggerDrawer;