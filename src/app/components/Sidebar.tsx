"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import ActivityFeed from "./ActivityFeed";
import BabySwitcher from "@/components/BabySwitcher";
import { useBaby } from "@/components/BabyContext";

type NavItemProps = {
  path: string;
  icon: string;
  label: string;
  exact?: boolean;
  pathname: string;
};

function NavItem({ path, icon, label, exact = false, pathname }: NavItemProps) {
  const active = exact ? pathname === path : pathname.startsWith(path);

  return (
    <Link
      href={path}
      className={`flex items-center gap-3 px-3 py-3 rounded-full transition-colors group ${
        active
          ? "bg-espresso text-oat shadow-md"
          : "text-muted hover:bg-white/50 hover:text-espresso"
      }`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className={`hidden xl:block text-sm ${active ? "font-bold" : "font-medium"}`}>
        {label}
      </span>
    </Link>
  );
}

const Sidebar = () => {
  const pathname = usePathname() ?? "";
  const { activeBabyId: babyId } = useBaby();

  return (
    <div className="hidden lg:flex flex-col w-20 xl:w-72 border-r border-muted/20 p-4 gap-6 bg-oat z-0 h-screen">
      <div className="px-1 mb-2">
        <div className="hidden xl:block">
          <BabySwitcher />
        </div>
        <div className="xl:hidden flex justify-center">
          <BabySwitcher compact />
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <NavItem path="/" icon="today" label="Today" exact pathname={pathname} />
        <NavItem path="/reminders" icon="notifications" label="Reminders" pathname={pathname} />
        <NavItem path="/trends" icon="show_chart" label="Trends" pathname={pathname} />
        <NavItem path="/records" icon="folder_open" label="Records" pathname={pathname} />
        <NavItem path="/milestones" icon="emoji_events" label="Milestones" pathname={pathname} />
        <NavItem path="/settings" icon="settings" label="Settings" pathname={pathname} />
      </nav>

      {babyId && (
        <div className="mt-auto hidden xl:block p-3 rounded-2xl bg-white/50 border border-white/60">
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <span className="material-symbols-outlined text-sage text-[14px]">groups</span>
            <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider">Activity</h4>
            <span className="ml-auto inline-block h-1.5 w-1.5 rounded-full bg-sage animate-pulse" />
          </div>
          <ActivityFeed babyId={babyId} compact />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
