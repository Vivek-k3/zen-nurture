import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Today from './pages/Today';
import Trends from './pages/Trends';
import Reminders from './pages/Reminders';
import Records from './pages/Records';
import Settings from './pages/Settings';
import QuickLoggerDrawer from './components/QuickLoggerDrawer';

const AppContent: React.FC = () => {
    const location = useLocation();
    const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

    // Dynamic Title based on route
    const getPageTitle = () => {
        switch(location.pathname) {
            case '/': return { title: 'Good Morning, Sarah', subtitle: "Here's how Leo is doing today." };
            case '/trends': return { title: 'Trends & Analysis', subtitle: 'Growth and habits over time.' };
            case '/reminders': return { title: 'Reminders', subtitle: 'Manage alerts and schedules.' };
            case '/records': return { title: 'Records', subtitle: 'Files, reports and exports.' };
            case '/settings': return { title: 'Settings', subtitle: 'App configuration and profile.' };
            default: return { title: 'Zen Nurture', subtitle: 'Care OS' };
        }
    }

    const { title, subtitle } = getPageTitle();

    return (
        <div className="relative flex min-h-screen w-full bg-[#F5F2EB]">
            {/* Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F5F2EB] relative">
                
                {/* Header (Desktop) */}
                <header className="hidden lg:flex h-20 px-8 items-center justify-between shrink-0 border-b border-black/5 bg-[#F5F2EB]/50 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-espresso font-serif tracking-tight">{title}</h2>
                        <p className="text-muted text-sm">{subtitle}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsQuickLogOpen(true)}
                            className="flex items-center gap-2 bg-espresso text-oat px-5 py-2.5 rounded-full shadow-md hover:bg-espresso/90 transition-all group cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span className="text-sm font-bold">Log Event</span>
                        </button>
                        
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-muted shadow-sm border border-muted/10 relative cursor-pointer hover:text-espresso transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-alert-red rounded-full border border-white"></span>
                        </div>
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="lg:hidden h-16 px-4 flex items-center justify-between shrink-0 bg-[#F5F2EB] z-10">
                    <div className="flex items-center gap-3">
                         <div 
                            className="bg-center bg-no-repeat bg-cover rounded-full h-8 w-8 shadow-sm" 
                            style={{ backgroundImage: 'url("https://picsum.photos/seed/baby/200/200")' }}
                        ></div>
                        <h1 className="text-lg font-bold text-espresso font-serif">Zen Nurture</h1>
                    </div>
                    <button className="h-10 w-10 flex items-center justify-center text-espresso">
                         <span className="material-symbols-outlined">menu</span>
                    </button>
                </header>

                {/* Routes */}
                <Routes>
                    <Route path="/" element={<Today />} />
                    <Route path="/trends" element={<Trends />} />
                    <Route path="/reminders" element={<Reminders />} />
                    <Route path="/records" element={<Records />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>

                {/* Floating Action Button for Mobile */}
                <button 
                    onClick={() => setIsQuickLogOpen(true)}
                    className="lg:hidden fixed bottom-6 right-6 h-14 w-14 bg-espresso text-oat rounded-full shadow-xl shadow-espresso/20 flex items-center justify-center z-30 transition-transform active:scale-95"
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>

            {/* Quick Logger Overlay */}
            <QuickLoggerDrawer isOpen={isQuickLogOpen} onClose={() => setIsQuickLogOpen(false)} />
        </div>
    );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;