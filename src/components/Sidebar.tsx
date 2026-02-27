"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ComponentType } from "react";
import ActivityFeed from "./ActivityFeed";
import BabySwitcher from "@/components/BabySwitcher";
import { useBaby } from "@/components/BabyContext";
import { useGenderTheme } from "@/components/GenderTheme";
import { BellIcon } from "@/components/ui/bell";
import { CalendarDaysIcon } from "@/components/ui/calendar-days";
import { FolderOpenIcon } from "@/components/ui/folder-open";
import { GraduationCapIcon } from "@/components/ui/graduation-cap";
import { SettingsIcon } from "@/components/ui/settings";
import { TrendingUpIcon } from "@/components/ui/trending-up";
import { UsersIcon } from "@/components/ui/users";

type IconHandle = { startAnimation: () => void; stopAnimation: () => void };

type NavItemProps = {
  path: string;
  icon: ComponentType<{ size?: number; className?: string; ref?: React.Ref<IconHandle> }>;
  label: string;
  exact?: boolean;
  pathname: string;
  activeClass: string;
  inactiveClass: string;
};

function NavItem({ path, icon: Icon, label, exact = false, pathname, activeClass, inactiveClass }: NavItemProps) {
  const active = exact ? pathname === path : pathname.startsWith(path);
  const iconRef = useRef<IconHandle | null>(null);

  return (
    <Link
      href={path}
      className={`flex items-center gap-3 px-3 py-3 rounded-full transition-colors group ${
        active
          ? activeClass
          : inactiveClass
      }`}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
    >
      <Icon ref={iconRef} size={20} className="shrink-0" />
      <span className={`hidden xl:block text-sm ${active ? "font-bold" : "font-medium"}`}>
        {label}
      </span>
    </Link>
  );
}

const Sidebar = () => {
  const pathname = usePathname() ?? "";
  const { activeBabyId: babyId } = useBaby();
  const genderTheme = useGenderTheme();

  const getActiveClass = () => {
    if (genderTheme.primary === "bg-baby-blue") return "bg-baby-blue text-white shadow-md";
    if (genderTheme.primary === "bg-baby-pink") return "bg-baby-pink text-white shadow-md";
    return "bg-espresso text-oat shadow-md";
  };

  const getInactiveClass = () => "text-muted hover:bg-white/50 hover:text-espresso";

  const getActivityThemeText = () => genderTheme.text;
  const getActivityThemeBg = () => genderTheme.primary;

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
        <NavItem path="/" icon={CalendarDaysIcon} label="Today" exact pathname={pathname} activeClass={getActiveClass()} inactiveClass={getInactiveClass()} />
        <NavItem path="/reminders" icon={BellIcon} label="Reminders" pathname={pathname} activeClass={getActiveClass()} inactiveClass={getInactiveClass()} />
        <NavItem path="/trends" icon={TrendingUpIcon} label="Trends" pathname={pathname} activeClass={getActiveClass()} inactiveClass={getInactiveClass()} />
        <NavItem path="/records" icon={FolderOpenIcon} label="Records" pathname={pathname} activeClass={getActiveClass()} inactiveClass={getInactiveClass()} />
        <NavItem path="/milestones" icon={GraduationCapIcon} label="Milestones" pathname={pathname} activeClass={getActiveClass()} inactiveClass={getInactiveClass()} />
        <NavItem path="/settings" icon={SettingsIcon} label="Settings" pathname={pathname} activeClass={getActiveClass()} inactiveClass={getInactiveClass()} />
      </nav>

      {babyId && (
        <div className="mt-auto hidden xl:block p-3 rounded-2xl bg-white/50 border border-white/60">
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <UsersIcon size={14} className={`shrink-0 ${getActivityThemeText()}`} />
            <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider">Activity</h4>
            <span className={`ml-auto inline-block h-1.5 w-1.5 rounded-full ${getActivityThemeBg()} animate-pulse`} />
          </div>
          <ActivityFeed babyId={babyId} compact />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
