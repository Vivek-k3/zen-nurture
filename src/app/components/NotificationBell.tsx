"use client";

import { usePushNotifications, type PushState } from "@/hooks/usePushNotifications";

export default function NotificationBell() {
  const { state, subscribe, unsubscribe } = usePushNotifications();

  if (state === "unsupported") return null;

  const isOn = state === "granted";

  const handleClick = async () => {
    if (isOn) {
      await unsubscribe();
    } else if (state === "denied") {
      alert("Notifications are blocked. Please enable them in your browser settings.");
    } else {
      await subscribe();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isOn ? "Disable notifications" : "Enable notifications"}
      className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${
        isOn
          ? "bg-sage/10 border-sage/20 text-sage"
          : state === "denied"
          ? "bg-alert-red/5 border-alert-red/15 text-alert-red/50"
          : "bg-white border-muted/10 text-muted hover:border-sage/30 hover:text-sage"
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">
        {isOn ? "notifications_active" : state === "denied" ? "notifications_off" : "notifications"}
      </span>
      {isOn && (
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-sage border-2 border-oat" />
      )}
    </button>
  );
}
