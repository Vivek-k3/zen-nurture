import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const NavItem = ({ path, icon, label, exact = false }: { path: string; icon: string; label: string; exact?: boolean }) => {
    const active = exact ? location.pathname === path : location.pathname.startsWith(path);
    return (
      <div 
        onClick={() => navigate(path)}
        className={`flex items-center gap-3 px-3 py-3 rounded-full cursor-pointer transition-colors group ${
          active 
            ? 'bg-espresso text-oat shadow-md' 
            : 'text-muted hover:bg-surface/50 hover:text-espresso'
        }`}
      >
        <span className={`material-symbols-outlined ${active ? 'font-variation-fill' : ''}`}>{icon}</span>
        <span className={`hidden xl:block text-sm ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
      </div>
    );
  };

  return (
    <div className="hidden lg:flex flex-col w-20 xl:w-72 border-r border-muted/20 p-4 gap-6 bg-oat z-0 h-screen">
      <div className="flex items-center gap-3 px-2 mb-2">
        <div 
          className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 shrink-0 shadow-sm ring-2 ring-white" 
          style={{ backgroundImage: 'url("https://picsum.photos/seed/baby/200/200")' }}
        ></div>
        <div className="hidden xl:flex flex-col">
          <h1 className="text-espresso text-base font-bold font-serif tracking-wide">Zen Nurture</h1>
          <p className="text-muted text-[10px] uppercase tracking-wider font-bold">India-First Care OS</p>
        </div>
      </div>
      
      <nav className="flex flex-col gap-2">
        <NavItem path="/" icon="today" label="Today" exact />
        <NavItem path="/reminders" icon="notifications" label="Reminders" />
        <NavItem path="/trends" icon="show_chart" label="Trends" />
        <NavItem path="/records" icon="folder_open" label="Records" />
        <NavItem path="/settings" icon="settings" label="Settings" />
      </nav>

      <div className="mt-auto hidden xl:block p-4 rounded-2xl bg-white/50 border border-white/60">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-sage/20 rounded-full text-sage">
            <span className="material-symbols-outlined text-sm">smart_toy</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-espresso mb-1">AI Assistant</h4>
            <p className="text-[10px] text-muted leading-relaxed">"Reviewing last 24h logs..."</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;