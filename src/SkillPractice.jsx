import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSkillsAPI, createSkillAPI, updateSkillAPI,
  getSkillByIdAPI,
  createSkillActivitiesAPI, updateSkillActivitiesAPI, deleteSkillActivityAPI
} from "./api";
import Sidebar from "./Sidebar";

// ─── Icons ───────────────────────────────────────────────────────────────────
const StarIcon = ({ filled }) => (<svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>);
const ShieldIcon = ({ filled }) => (<svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>);
const TrashIcon = ({ size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>);
const PencilIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>);
const CheckIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>);
const PlusIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const BadgeCheckIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 3.2L18 4l.8 3.8L22 10l-2.4 3.2.4 3.8-3.8.8L14 20l-2-2.4L10 20l-2.2-2.2-3.8-.8.4-3.8L2 10l3.2-2.2L6 4l3.6 1.2z" /><polyline points="9 12 11 14 15 10" /></svg>);
const CloseIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const ClockIcon = ({ size = 12 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const ActivityIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>);
const TrophyIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></svg>);
const FireIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>);

// ─── Progress Ring ───────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 52, stroke = 4, color = "#3b82f6", bgColor = "#e5e7eb", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bgColor} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.top - 36, left: rect.left + rect.width / 2 });
    }
    setShow(true);
  };
  return (
    <div ref={ref} className="relative flex items-center" onMouseEnter={handleMouseEnter} onMouseLeave={() => setShow(false)}>
      {show && (
        <div className="bg-gray-800 text-white text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap shadow-lg pointer-events-none"
          style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translateX(-50%)", zIndex: 9999 }}>
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const colors = { success: "bg-blue-50 border-blue-200 text-blue-700", error: "bg-red-50 border-red-200 text-red-700", warning: "bg-amber-50 border-amber-200 text-amber-700" };
  const icons = {
    success: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    error: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    warning: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${colors[type]}`}>
      {icons[type]}{message}
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="bg-white rounded-2xl shadow-2xl p-7 w-80 border border-gray-100">
        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><TrashIcon size={16} /></div>
        <h3 className="text-gray-800 font-semibold text-base text-center mb-1">Confirm Delete</h3>
        <p className="text-gray-400 text-sm text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition shadow-sm">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sort helper: incomplete first, completed at bottom ───────────────────────
const sortActivities = (list) => [
  ...list.filter(a => !a.is_completed),
  ...list.filter(a => a.is_completed),
];

// ─── Skill Detail Modal ──────────────────────────────────────────────────────
function SkillModal({ skill, today, onClose, onSkillUpdated, showToast }) {
  const mapActivity = (a) => {
    const fromYesterday = a.entry_date ? String(a.entry_date).split("T")[0] !== today : false;
    return {
      id: a.id, name: a.name,
      is_completed: fromYesterday ? false : (a.is_completed ?? false),
      is_priority: fromYesterday ? false : (a.is_priority ?? false),
      is_habit_to_protect: fromYesterday ? false : (a.is_habit_to_protect ?? false),
      minutes_practised: a.minutes_practised || 0,
      isCarriedOver: fromYesterday && !a.is_completed,
    };
  };

  const hasCarriedOver = (skill.activities || []).some(a => {
    const fromYesterday = a.entry_date ? String(a.entry_date).split("T")[0] !== today : false;
    return fromYesterday && !a.is_completed;
  });

  const [activities, setActivities] = useState(
    sortActivities((skill.activities || []).map(a => mapActivity(a)))
  );
  const [newActivityName, setNewActivityName] = useState("");
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [skillName, setSkillName] = useState(skill.name || "");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const allDone = activities.length > 0 && activities.every(a => a.is_completed);
  const doneCount = activities.filter(a => a.is_completed).length;
  const totalMinutes = activities.reduce((sum, a) => sum + (a.minutes_practised || 0), 0);
  const pct = activities.length > 0 ? Math.round((doneCount / activities.length) * 100) : 0;

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleDone = async (id) => {
    const target = activities.find(a => a.id === id);
    const newVal = !target.is_completed;
    setActivities(prev => sortActivities(prev.map(a => a.id === id ? { ...a, is_completed: newVal } : a)));
    try {
      await updateSkillActivitiesAPI(skill.id, { activities: [{ id, is_completed: newVal }] });
      const updated = activities.map(a => a.id === id ? { ...a, is_completed: newVal } : a);
      if (updated.every(a => a.is_completed) && updated.length > 0) {
        await updateSkillAPI(skill.id, { name: skillName, is_completed: true });
        onSkillUpdated(skill.id, { is_completed: true });
      }
    } catch (err) {
      console.error("Toggle done failed:", err);
      setActivities(prev => sortActivities(prev.map(a => a.id === id ? { ...a, is_completed: !newVal } : a)));
    }
  };

  const togglePriority = async (id) => {
    const current = activities.find(a => a.id === id);
    const updated = activities.map(a => ({ ...a, is_priority: a.id === id ? !current.is_priority : false }));
    setActivities(sortActivities(updated));
    try {
      await updateSkillActivitiesAPI(skill.id, { activities: updated.map(a => ({ id: a.id, is_priority: a.is_priority })) });
    } catch (err) { console.error("Toggle priority failed:", err); }
  };

  const toggleHabit = async (id) => {
    const current = activities.find(a => a.id === id);
    const updated = activities.map(a => ({ ...a, is_habit_to_protect: a.id === id ? !current.is_habit_to_protect : false }));
    setActivities(sortActivities(updated));
    try {
      await updateSkillActivitiesAPI(skill.id, { activities: updated.map(a => ({ id: a.id, is_habit_to_protect: a.is_habit_to_protect })) });
    } catch (err) { console.error("Toggle habit failed:", err); }
  };

  const updateMinutes = async (id, value) => {
    const mins = Math.max(0, Math.min(1440, Number(value) || 0));
    setActivities(prev => sortActivities(prev.map(a => a.id === id ? { ...a, minutes_practised: mins } : a)));
    try {
      await updateSkillActivitiesAPI(skill.id, { activities: [{ id, minutes_practised: mins }] });
    } catch (err) { console.error("Update minutes failed:", err); }
  };

  const addActivity = async () => {
    if (!newActivityName.trim()) return;
    if (newActivityName.trim().length < 2) { showToast("Activity must be at least 2 characters", "error"); return; }
    if (newActivityName.trim().length > 2000) { showToast("Activity cannot exceed 2000 characters", "error"); return; }
    try {
      const res = await createSkillActivitiesAPI(skill.id, {
        activities: [{ name: newActivityName.trim(), is_priority: false, is_habit_to_protect: false, is_completed: false, minutes_practised: 0 }]
      });
      const created = res?.data?.activities || res?.activities || [];
      const last = created[created.length - 1];
      if (last) {
        setActivities(prev => sortActivities([{
          id: last.id, name: last.name, is_completed: false, is_priority: false,
          is_habit_to_protect: false, minutes_practised: 0, isCarriedOver: false,
        }, ...prev]));
      }
      setNewActivityName("");
    } catch (err) {
      console.error("Add activity failed:", err);
      showToast("Failed to add activity", "error");
    }
  };

  const startEdit = (a) => { setEditingActivityId(a.id); setEditText(a.name); };
  const saveEdit = async (id) => {
    const updated = activities.map(a => a.id === id ? { ...a, name: editText } : a);
    setActivities(sortActivities(updated));
    setEditingActivityId(null);
    try {
      await updateSkillActivitiesAPI(skill.id, { activities: [{ id, name: editText }] });
    } catch (err) { console.error("Edit failed:", err); }
  };

  const doDeleteActivity = async () => {
    try {
      await deleteSkillActivityAPI(skill.id, deleteTarget.id);
      setActivities(prev => sortActivities(prev.filter(a => a.id !== deleteTarget.id)));
    } catch (err) { console.error("Delete failed:", err); }
    setDeleteTarget(null);
  };

  const saveSkillName = async () => {
    setEditingTitle(false);
    try {
      await updateSkillAPI(skill.id, { name: skillName });
      onSkillUpdated(skill.id, { name: skillName });
    } catch (err) { console.error("Rename failed:", err); }
  };

  const formatMinutes = (m) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem ? `${h}h ${rem}m` : `${h}h`;
  };

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          message="This activity will be permanently removed."
          onConfirm={doDeleteActivity}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ width: "min(600px, 95vw)", maxHeight: "88vh" }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header with stats ── */}
          <div className={`px-6 pt-5 pb-5 border-b ${allDone ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100" : hasCarriedOver ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100" : "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-100"}`}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                {editingTitle ? (
                  <input autoFocus value={skillName} onChange={e => setSkillName(e.target.value)}
                    onBlur={saveSkillName} onKeyDown={e => e.key === "Enter" && saveSkillName()}
                    maxLength={20}
                    className="w-full text-lg font-bold bg-white border border-blue-300 rounded-xl px-3 py-1.5 outline-none text-gray-800" />
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className={`text-lg font-bold ${allDone ? "text-blue-700" : "text-gray-800"}`}>{skillName}</h2>
                    <button onClick={() => setEditingTitle(true)}
                      className="p-1 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition shrink-0">
                      <PencilIcon />
                    </button>
                    {allDone && <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full"><BadgeCheckIcon /> Done</span>}
                  </div>
                )}
                {hasCarriedOver && !allDone && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                    <FireIcon /> Carried over from yesterday
                  </span>
                )}
              </div>
              <button onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white/80 transition shrink-0">
                <CloseIcon />
              </button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4">
              <ProgressRing pct={pct} size={48} stroke={4}
                color={allDone ? "#2563eb" : "#60a5fa"} bgColor={allDone ? "#bfdbfe" : "#e5e7eb"}>
                <span className={`text-xs font-bold ${allDone ? "text-blue-600" : "text-gray-600"}`}>{pct}%</span>
              </ProgressRing>
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-800">{doneCount}<span className="text-gray-400 font-normal text-sm">/{activities.length}</span></span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Tasks Done</span>
                </div>
                <div className="w-px bg-gray-200 self-stretch" />
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-800">{totalMinutes > 0 ? formatMinutes(totalMinutes) : "0m"}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Practised</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Add activity ── */}
          <div className="px-6 py-4 border-b border-gray-100 bg-white">
            <div className="flex gap-2">
              <textarea value={newActivityName} onChange={e => setNewActivityName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addActivity(); } }}
                placeholder="What will you practice?" maxLength={2000} rows={1}
                style={{ resize: "none", overflow: "hidden", fieldSizing: "content" }}
                onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 focus:bg-white transition min-h-[40px]" />
              <button onClick={addActivity}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm flex items-center gap-1.5 shrink-0 self-start">
                <PlusIcon /> Add
              </button>
            </div>
          </div>

          {/* ── Activities ── */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2.5">
            {activities.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <ActivityIcon />
                <p className="text-sm mt-3">No activities yet</p>
                <p className="text-xs mt-1">Add your first practice activity above</p>
              </div>
            )}
            {activities.map(a => (
              <div key={a.id}
                className={`group rounded-xl border transition-all ${
                  a.is_completed ? "bg-gray-50/80 border-gray-100" : a.isCarriedOver ? "bg-amber-50/60 border-amber-200" : "bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm"
                }`}>
                <div className="flex items-start gap-3 px-4 pt-3 pb-2">
                  <button onClick={() => toggleDone(a.id)}
                    className={`min-w-[20px] min-h-[20px] w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                      a.is_completed ? "bg-blue-500 border-blue-500 text-white" : "border-gray-300 hover:border-blue-400"
                    }`}>
                    {a.is_completed && <CheckIcon />}
                  </button>

                  <div className="flex-1 min-w-0">
                    {editingActivityId === a.id ? (
                      <textarea autoFocus value={editText} onChange={e => setEditText(e.target.value)}
                        onBlur={() => saveEdit(a.id)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(a.id); } }}
                        rows={1} style={{ resize: "none", overflow: "hidden", fieldSizing: "content" }}
                        onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                        className="w-full text-sm bg-white border border-blue-300 rounded-lg px-2.5 py-1 outline-none text-gray-700 min-h-[28px]" />
                    ) : (
                      <div>
                        <span className={`text-sm break-words whitespace-pre-wrap ${a.is_completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                          {a.name}
                        </span>
                        {a.isCarriedOver && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-amber-500 font-medium"><FireIcon /> carried over</span>
                        )}
                      </div>
                    )}

                    {/* Minutes row */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Tooltip text="Minutes you practised this activity">
                        <div className="flex items-center gap-1.5">
                          <span className={`${a.minutes_practised > 0 ? "text-blue-400" : "text-gray-300"}`}><ClockIcon /></span>
                          <input type="number" min={0} max={1440}
                            value={a.minutes_practised || ""} placeholder="0"
                            onChange={e => updateMinutes(a.id, e.target.value)}
                            className="w-14 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 text-xs text-gray-600 outline-none focus:border-blue-300 focus:bg-white transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                          <span className="text-[10px] text-gray-400 font-medium">min</span>
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 px-4 pb-2.5 pt-1">
                  <Tooltip text="Edit">
                    <button onClick={() => startEdit(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"><PencilIcon /></button>
                  </Tooltip>
                  <Tooltip text="Priority">
                    <button onClick={() => togglePriority(a.id)} className={`p-1.5 rounded-lg transition ${a.is_priority ? "text-amber-500 bg-amber-50" : "text-gray-400 hover:text-amber-400 hover:bg-amber-50"}`}><StarIcon filled={a.is_priority} /></button>
                  </Tooltip>
                  <Tooltip text="Protect habit">
                    <button onClick={() => toggleHabit(a.id)} className={`p-1.5 rounded-lg transition ${a.is_habit_to_protect ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"}`}><ShieldIcon filled={a.is_habit_to_protect} /></button>
                  </Tooltip>
                  <div className="flex-1" />
                  <Tooltip text="Delete">
                    <button onClick={() => setDeleteTarget({ id: a.id })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"><TrashIcon /></button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Skill Card ──────────────────────────────────────────────────────────────
function SkillCard({ skill, today, onClick }) {
  const total = skill.activities?.length || 0;
  const done = skill.activities?.filter(a => a.is_completed).length || 0;
  const allDone = total > 0 && done === total;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const totalMinutes = (skill.activities || []).reduce((sum, a) => sum + (a.minutes_practised || 0), 0);
  const hasCarriedOver = (skill.activities || []).some(a => {
    const fromYesterday = a.entry_date ? String(a.entry_date).split("T")[0] !== today : false;
    return fromYesterday && !a.is_completed;
  });

  const formatMins = (m) => {
    if (!m) return null;
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem ? `${h}h ${rem}m` : `${h}h`;
  };

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-2xl border shadow-sm transition-all duration-200
        hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]
        ${allDone
          ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
          : hasCarriedOver
          ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
          : "bg-white border-gray-100 hover:border-blue-200"
        }`}
    >
      {/* Top accent line */}
      <div className={`h-1 rounded-t-2xl ${allDone ? "bg-gradient-to-r from-blue-400 to-indigo-500" : hasCarriedOver ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gradient-to-r from-blue-200 to-blue-300"}`} />

      <div className="p-5">
        {/* Title + ring */}
        <div className="flex items-start gap-3 mb-4">
          <ProgressRing pct={pct} size={44} stroke={3.5}
            color={allDone ? "#2563eb" : hasCarriedOver ? "#f59e0b" : "#60a5fa"}
            bgColor={allDone ? "#bfdbfe" : hasCarriedOver ? "#fde68a" : "#f3f4f6"}>
            <span className={`text-[10px] font-bold ${allDone ? "text-blue-600" : hasCarriedOver ? "text-amber-600" : "text-gray-500"}`}>
              {pct}%
            </span>
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold leading-tight mb-0.5 ${allDone ? "text-blue-700" : "text-gray-800"}`}>
              {skill.name}
            </h3>
            <span className="text-[11px] text-gray-400">{total} {total === 1 ? "activity" : "activities"}</span>
          </div>
        </div>

        {/* Stats chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${allDone ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
            <CheckIcon /> {done}/{total}
          </span>
          {totalMinutes > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
              <ClockIcon /> {formatMins(totalMinutes)}
            </span>
          )}
          {hasCarriedOver && !allDone && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
              <FireIcon /> carried
            </span>
          )}
          {allDone && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
              <TrophyIcon /> Complete!
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-1 bg-gray-100" />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-gray-100 rounded-lg w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-12 rounded-full bg-gray-100" />
          <div className="h-5 w-14 rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function SkillPractice() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSkillName, setNewSkillName] = useState("");
  const [skillNameError, setSkillNameError] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const today = getToday();

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => { loadSkills(); }, []);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const res = await getSkillsAPI();
      const raw = res?.data?.skills || res?.skills || [];
      const mapped = raw.map(s => {
        const firstActivity = s.activities?.[0];
        const entryDate = firstActivity?.entry_date ? String(firstActivity.entry_date).split("T")[0] : null;
        const isFromYesterday = entryDate ? entryDate !== today : false;
        const wasFullyCompleted = isFromYesterday && s.activities?.length > 0 && s.activities.every(a => a.is_completed);
        return { ...s, isFromYesterday, wasFullyCompleted };
      }).filter(s => !s.wasFullyCompleted);
      setSkills(mapped);
    } catch (err) {
      console.error("Load skills failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const validateSkillName = (name) => {
    if (!name.trim()) { setSkillNameError("Skill name cannot be empty"); return false; }
    if (name.trim().length < 2) { setSkillNameError("Skill name must be at least 2 characters"); return false; }
    if (name.trim().length > 20) { setSkillNameError("Skill name cannot exceed 20 characters"); return false; }
    setSkillNameError(""); return true;
  };

  const addSkill = async () => {
    if (!validateSkillName(newSkillName)) return;
    try {
      const res = await createSkillAPI({ name: newSkillName.trim() });
      const newSkill = { ...(res?.data || res), activities: [], isFromYesterday: false, wasFullyCompleted: false };
      setSkills(prev => [newSkill, ...prev]);
      setNewSkillName("");
      setSkillNameError("");
      showToast("Skill added!", "success");
    } catch (err) {
      console.error("Create skill failed:", err);
      setSkillNameError(err.message || "Could not create skill");
    }
  };

  const handleSkillUpdated = (id, patch) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    setSelectedSkill(prev => prev?.id === id ? { ...prev, ...patch } : prev);
  };

  const openSkill = (skill) => setSelectedSkill(skill);
  const closeSkill = async () => {
    const skillId = selectedSkill?.id;
    setSelectedSkill(null);
    if (skillId) {
      try {
        const res = await getSkillByIdAPI(skillId);
        const updated = res?.data || res;
        if (updated) setSkills(prev => prev.map(s => s.id === skillId ? { ...s, ...updated } : s));
      } catch (err) { console.error("Failed to refresh skill:", err); }
    }
  };

  // Page-level stats
  const totalSkills = skills.length;
  const completedSkills = skills.filter(s => {
    const total = s.activities?.length || 0;
    const done = s.activities?.filter(a => a.is_completed).length || 0;
    return total > 0 && done === total;
  }).length;
  const totalActivities = skills.reduce((sum, s) => sum + (s.activities?.length || 0), 0);
  const totalMinutes = skills.reduce((sum, s) => sum + (s.activities || []).reduce((a, act) => a + (act.minutes_practised || 0), 0), 0);

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0f9ff 100%)" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {selectedSkill && (
        <SkillModal skill={selectedSkill} today={today} onClose={closeSkill}
          onSkillUpdated={handleSkillUpdated} showToast={showToast} />
      )}

      <Sidebar activePath="/skill-practice" onNavigate={(path) => navigate(path)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-10 pt-8 pb-2 shrink-0">
          <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-1">Skill Practice</p>
          <h1 className="text-2xl font-bold text-gray-800 leading-tight">What are you building today?</h1>
          <p className="text-gray-400 text-sm mt-1">Track your skills and the activities within each one</p>
        </div>

        {/* Quick stats */}
        {!loading && totalSkills > 0 && (
          <div className="px-10 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl px-3 py-1.5 shadow-sm">
                <span className="text-xs font-bold text-gray-700">{totalSkills}</span>
                <span className="text-[10px] text-gray-400 font-medium">skills</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl px-3 py-1.5 shadow-sm">
                <span className="text-xs font-bold text-gray-700">{totalActivities}</span>
                <span className="text-[10px] text-gray-400 font-medium">activities</span>
              </div>
              {totalMinutes > 0 && (
                <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5 shadow-sm">
                  <span className="text-blue-500"><ClockIcon size={11} /></span>
                  <span className="text-xs font-bold text-blue-600">{totalMinutes < 60 ? `${totalMinutes}m` : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}</span>
                  <span className="text-[10px] text-blue-400 font-medium">practised</span>
                </div>
              )}
              {completedSkills > 0 && (
                <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5 shadow-sm">
                  <span className="text-blue-500"><TrophyIcon /></span>
                  <span className="text-xs font-bold text-blue-600">{completedSkills}</span>
                  <span className="text-[10px] text-blue-400 font-medium">completed</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add skill */}
        <div className="px-10 pb-4 shrink-0">
          <div className="flex gap-2 max-w-sm">
            <div className="flex-1 flex flex-col gap-1">
              <input value={newSkillName}
                onChange={e => { setNewSkillName(e.target.value); if (skillNameError) setSkillNameError(""); }}
                onKeyDown={e => e.key === "Enter" && addSkill()}
                placeholder="Add a new skill..." maxLength={20}
                className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none transition shadow-sm ${
                  skillNameError ? "border-red-300 focus:border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-300"
                }`} />
              {skillNameError && <p className="text-red-500 text-xs font-medium pl-1">{skillNameError}</p>}
            </div>
            <button onClick={addSkill}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm flex items-center gap-1.5 self-start">
              <PlusIcon /> Add Skill
            </button>
          </div>
        </div>

        {/* Skills grid */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-10 pb-8 mt-1">
          {loading ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-gray-300">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 3.2L18 4l.8 3.8L22 10l-2.4 3.2.4 3.8-3.8.8L14 20l-2-2.4L10 20l-2.2-2.2-3.8-.8.4-3.8L2 10l3.2-2.2L6 4l3.6 1.2z"/></svg>
              </div>
              <p className="text-sm font-medium text-gray-400">No skills yet</p>
              <p className="text-xs text-gray-300 mt-1">Add your first skill above to start tracking</p>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {skills.map(skill => (
                <SkillCard key={skill.id} skill={skill} today={today} onClick={() => openSkill(skill)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SkillPractice;
