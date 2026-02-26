"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatTime, formatTimeSince, isToday } from "@/lib/time";

export default function RemindersPage() {
  const [mounted, setMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    category: "feed",
    triggerType: "fixedTimes",
    times: ["09:00", "15:00", "21:00"],
    intervalHours: 3,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const babyProfile = useQuery(api.events.getBabyProfile, {});
  const babyId = babyProfile?._id;
  const reminderRules = useQuery(
    api.events.listReminderRules,
    babyId
      ? {
          babyId,
        }
      : "skip"
  );
  const upcomingReminders = useQuery(
    api.events.computeUpcomingReminders,
    babyId
      ? {
          babyId,
        }
      : "skip"
  );

  const createReminderRule = useMutation(api.events.createReminderRule);
  const updateReminderRule = useMutation(api.events.updateReminderRule);
  const deleteReminderRule = useMutation(api.events.deleteReminderRule);

  const handleToggleReminder = async (id: any, enabled: boolean) => {
    await updateReminderRule({ id, enabled });
  };

  const handleDeleteReminder = async (id: any) => {
    if (confirm("Are you sure you want to delete this reminder?")) {
      await deleteReminderRule({ id });
    }
  };

  const handleAddReminder = async () => {
    if (!babyProfile?._id || !newReminder.title) return;

    let triggerConfig: any = {};
    if (newReminder.triggerType === "fixedTimes") {
      triggerConfig = { times: newReminder.times };
    } else if (newReminder.triggerType === "afterLastEventType") {
      triggerConfig = {
        lastEventType: newReminder.category === "feed" ? "FEED_BOTTLE" : "DIAPER",
        intervalHours: newReminder.intervalHours,
      };
    }

    await createReminderRule({
      babyId: babyProfile._id,
      title: newReminder.title,
      category: newReminder.category,
      triggerType: newReminder.triggerType,
      triggerConfig,
      enabled: true,
    });

    setShowAddModal(false);
    setNewReminder({
      title: "",
      category: "feed",
      triggerType: "fixedTimes",
      times: ["09:00", "15:00", "21:00"],
      intervalHours: 3,
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-espresso">Reminders</h1>
          <p className="text-muted text-sm mt-1">Manage alerts and schedules</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-sage text-white px-4 py-2 rounded-full font-bold hover:bg-sage/90 transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          Add Reminder
        </button>
      </div>

      {!babyProfile ? (
        <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
          <span className="material-symbols-outlined text-5xl text-sage mb-4">child_friendly</span>
          <h3 className="text-xl font-bold text-espresso mb-2">No baby profile yet</h3>
          <p className="text-muted">Add your baby's profile in Settings to create reminders</p>
        </div>
      ) : (
        <>
          {upcomingReminders && upcomingReminders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Upcoming</h2>
              <div className="space-y-3">
                {upcomingReminders.slice(0, 5).map((reminder: any, index: number) => (
                  <div
                    key={index}
                    className={`bg-white rounded-[16px] p-4 shadow-sm border border-muted/10 flex items-center justify-between ${
                      reminder.isOverdue ? "border-alert-red/30 bg-alert-red/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        reminder.isOverdue ? "bg-alert-red/20 text-alert-red" : "bg-sage/20 text-sage"
                      }`}>
                        <span className="material-symbols-outlined">notifications</span>
                      </div>
                      <div>
                        <div className="font-bold text-espresso">{reminder.rule.title}</div>
                        <div className={`text-sm ${reminder.isOverdue ? "text-alert-red" : "text-muted"}`}>
                          {reminder.isOverdue ? "Overdue - " : ""}{formatTime(reminder.dueTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Reminder Rules</h2>
            {reminderRules && reminderRules.length > 0 ? (
              <div className="space-y-3">
                {reminderRules.map((rule: any) => (
                  <div
                    key={rule._id}
                    className="bg-white rounded-[16px] p-4 shadow-sm border border-muted/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleToggleReminder(rule._id, !rule.enabled)}
                        className={`h-6 w-11 rounded-full transition-colors relative ${
                          rule.enabled ? "bg-sage" : "bg-muted/30"
                        }`}
                      >
                        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                          rule.enabled ? "left-6" : "left-1"
                        }`} />
                      </button>
                      <div>
                        <div className="font-bold text-espresso">{rule.title}</div>
                        <div className="text-sm text-muted capitalize">
                          {rule.triggerType === "fixedTimes" 
                            ? `At ${rule.triggerConfig?.times?.join(", ") || "custom times"}`
                            : `Every ${rule.triggerConfig?.intervalHours || 3}h after ${rule.triggerConfig?.lastEventType || "event"}`
                          }
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(rule._id)}
                      className="h-8 w-8 rounded-full hover:bg-alert-red/10 flex items-center justify-center text-muted hover:text-alert-red transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
                <span className="material-symbols-outlined text-4xl text-muted mb-4">notifications_none</span>
                <h3 className="text-lg font-bold text-espresso mb-2">No reminders yet</h3>
                <p className="text-muted mb-4">Create your first reminder to stay on track</p>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 bg-sage text-white px-4 py-2 rounded-full font-bold hover:bg-sage/90 transition-colors"
                >
                  <span className="material-symbols-outlined">add</span>
                  Add Reminder
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {showAddModal && (
        <>
          <button
            type="button"
            aria-label="Close add reminder modal"
            className="fixed inset-0 bg-espresso/20 backdrop-blur-sm z-40"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-[#FDFBF7] z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-muted/10 bg-white/50">
              <h2 className="text-xl font-bold text-espresso font-serif">Add Reminder</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="h-8 w-8 rounded-full hover:bg-muted/10 flex items-center justify-center text-muted"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <label htmlFor="reminder-title" className="text-xs font-bold text-muted uppercase tracking-wider">Title</label>
                <input
                  id="reminder-title"
                  type="text"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  placeholder="e.g., Feed reminder"
                  className="w-full p-4 rounded-xl bg-white border border-muted/10 text-espresso font-medium focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="reminder-category" className="text-xs font-bold text-muted uppercase tracking-wider">Category</label>
                <select
                  id="reminder-category"
                  value={newReminder.category}
                  onChange={(e) => setNewReminder({ ...newReminder, category: e.target.value })}
                  className="w-full p-4 rounded-xl bg-white border border-muted/10 text-espresso font-medium focus:outline-none focus:ring-2 focus:ring-sage/20"
                >
                  <option value="feed">Feeding</option>
                  <option value="diaper">Diaper</option>
                  <option value="medicine">Medicine</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="reminder-trigger-type" className="text-xs font-bold text-muted uppercase tracking-wider">Trigger Type</label>
                <select
                  id="reminder-trigger-type"
                  value={newReminder.triggerType}
                  onChange={(e) => setNewReminder({ ...newReminder, triggerType: e.target.value })}
                  className="w-full p-4 rounded-xl bg-white border border-muted/10 text-espresso font-medium focus:outline-none focus:ring-2 focus:ring-sage/20"
                >
                  <option value="fixedTimes">Fixed Times</option>
                  <option value="afterLastEventType">After Last Event</option>
                </select>
              </div>

              {newReminder.triggerType === "fixedTimes" && (
                <div className="space-y-2">
                  <label htmlFor="reminder-times" className="text-xs font-bold text-muted uppercase tracking-wider">Times</label>
                  <input
                    id="reminder-times"
                    type="text"
                    value={newReminder.times.join(", ")}
                    onChange={(e) => setNewReminder({ 
                      ...newReminder, 
                      times: e.target.value.split(",").map(t => t.trim()) 
                    })}
                    placeholder="09:00, 15:00, 21:00"
                    className="w-full p-4 rounded-xl bg-white border border-muted/10 text-espresso font-medium focus:outline-none focus:ring-2 focus:ring-sage/20"
                  />
                </div>
              )}

              {newReminder.triggerType === "afterLastEventType" && (
                <div className="space-y-2">
                  <label htmlFor="reminder-interval-hours" className="text-xs font-bold text-muted uppercase tracking-wider">Interval (hours)</label>
                  <input
                    id="reminder-interval-hours"
                    type="number"
                    value={newReminder.intervalHours}
                    onChange={(e) => setNewReminder({ 
                      ...newReminder, 
                      intervalHours: Number(e.target.value) 
                    })}
                    min="1"
                    max="24"
                    className="w-full p-4 rounded-xl bg-white border border-muted/10 text-espresso font-medium focus:outline-none focus:ring-2 focus:ring-sage/20"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-muted/10 bg-white/80">
              <button
                type="button"
                onClick={handleAddReminder}
                disabled={!newReminder.title}
                className="w-full h-14 bg-espresso text-oat rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-espresso/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-espresso/10"
              >
                <span className="material-symbols-outlined">add</span>
                Create Reminder
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
