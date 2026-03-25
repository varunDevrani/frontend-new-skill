import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createMorningAPI, updateMorningAPI, addActivityAPI, deleteActivityAPI, getMorningAPI } from "./api";
import Sidebar from "./Sidebar";

const StarIcon = ({ filled }) => (<svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>);
const ShieldIcon = ({ filled }) => (<svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>);
const TrashIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>);
const PencilIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const CheckIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {show && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap z-50 shadow-lg pointer-events-none">{text}<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"/></div>}
      {children}
    </div>
  );
}

function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
      <div className="bg-white rounded-2xl shadow-2xl p-7 w-80 border border-gray-100">
        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><TrashIcon /></div>
        <h3 className="text-gray-800 font-semibold text-base text-center mb-1">Delete Activity?</h3>
        <p className="text-gray-400 text-sm text-center mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition shadow-sm">Delete</button>
        </div>
      </div>
    </div>
  );
}

function UnsavedModal({ onSave, onDiscard, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
      <div className="bg-white rounded-2xl shadow-2xl p-7 w-80 border border-gray-100">
        <h3 className="text-gray-800 font-semibold text-base text-center mb-2">Unsaved Changes</h3>
        <p className="text-gray-400 text-sm text-center mb-6">You have unsaved changes. What would you like to do?</p>
        <div className="flex flex-col gap-2">
          <button onClick={onSave} className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-sm">Save & Continue</button>
          <button onClick={onDiscard} className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition">Discard Changes</button>
          <button onClick={onCancel} className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-600 transition">Stay on Page</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const colors = { success: "bg-blue-50 border-blue-200 text-blue-700", error: "bg-red-50 border-red-200 text-red-700", warning: "bg-amber-50 border-amber-200 text-amber-700" };
  const icons = {
    success: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    error: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    warning: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };
  return <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${colors[type]}`}>{icons[type]}{message}</div>;
}

const parseMorningData = (res) => {
  if (res?.data && typeof res.data === "object" && res.data.id) return res.data;
  if (res?.id) return res;
  return null;
};

function MorningCheckin() {
  const navigate = useNavigate();
  const [confidence, setConfidence] = useState(2);
  const [savedConfidence, setSavedConfidence] = useState(2);
  const [activities, setActivities] = useState([]);
  const [savedActivities, setSavedActivities] = useState([]);
  const [newActivity, setNewActivity] = useState("");
  const [newActivityError, setNewActivityError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isFromYesterday, setIsFromYesterday] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [unsavedModal, setUnsavedModal] = useState(null);
  const pendingNavRef = useRef(null);

  const checkinIdRef = useRef(null);
  const confidenceRef = useRef(2);

  const showToast = (message, type = "success") => setToast({ message, type });

  // Has changes = confidence changed OR activities list differs from saved
  const hasChanges = confidence !== savedConfidence ||
    JSON.stringify(activities.map(a => ({ text: a.text, done: a.done, priority: a.priority, protect: a.protect }))) !==
    JSON.stringify(savedActivities.map(a => ({ text: a.text, done: a.done, priority: a.priority, protect: a.protect })));

  useEffect(() => { confidenceRef.current = confidence; }, [confidence]);
  useEffect(() => { loadMorning(); }, []);

  const applyMorningData = (data, today) => {
    const rawDate = data.date ?? "";
    const dataDate = String(rawDate).split("T")[0];
    const fromYesterday = dataDate && dataDate !== today;
    setIsFromYesterday(!!fromYesterday);
    if (!fromYesterday && data.id) checkinIdRef.current = data.id;
    else checkinIdRef.current = null;
    const rating = data.confidence_rating ?? 2;
    setConfidence(rating); setSavedConfidence(rating); confidenceRef.current = rating;
    const mapped = (data.activities ?? []).map((a) => ({
      id: fromYesterday ? `prev-${a.id}` : a.id, realId: a.id, text: a.title,
      done: fromYesterday ? false : (a.is_completed ?? false),
      priority: fromYesterday ? false : (a.is_priority ?? false),
      protect: a.is_habit ?? false,
      isCarriedOver: !!(fromYesterday && !a.is_completed),
      isNew: false
    }));
    setActivities(mapped);
    setSavedActivities(mapped);
  };

  const loadMorning = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await getMorningAPI(today);
      const data = parseMorningData(res);
      if (data) applyMorningData(data, today);
    } catch (err) {
      console.log("loadMorning — no checkin yet:", err.message);
      checkinIdRef.current = null;
    } finally { setPageReady(true); }
  };

  const ensureCheckinId = async () => {
    if (checkinIdRef.current) return checkinIdRef.current;
    // Check if today's morning already exists (e.g. created in a prior session)
    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await getMorningAPI(today);
      const data = parseMorningData(res);
      if (data?.id) {
        const dataDate = String(data.date ?? "").split("T")[0];
        if (dataDate === today) {
          checkinIdRef.current = data.id;
          return data.id;
        }
      }
    } catch { /* no morning yet */ }
    return null;
  };

  // Add activity locally only — no API call yet
  const addActivity = () => {
    if (!newActivity.trim()) { setNewActivityError("Activity name cannot be empty"); return; }
    if (newActivity.trim().length < 2) { setNewActivityError("Activity must be at least 2 characters"); return; }
    if (newActivity.trim().length > 2000) { setNewActivityError("Activity cannot exceed 2000 characters"); return; }
    setNewActivityError("");
    const tempId = `new-${Date.now()}`;
    setActivities(prev => [...prev, {
      id: tempId, realId: null, text: newActivity.trim(),
      done: false, priority: false, protect: false, isCarriedOver: false, isNew: true
    }]);
    setNewActivity("");
  };

  const toggleDone = (id) => setActivities(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a));
  const togglePriority = (id) => setActivities(prev => prev.map(a => ({ ...a, priority: a.id === id ? !a.priority : false })));
  const toggleProtect = (id) => setActivities(prev => prev.map(a => ({ ...a, protect: a.id === id ? !a.protect : false })));

  const confirmDelete = (id) => setDeleteTarget(id);
  const doDelete = async () => {
    const target = activities.find(a => a.id === deleteTarget);
    if (target && !target.isNew && target.realId) {
      try {
        await deleteActivityAPI(target.realId);
      } catch (err) {
        showToast(err.message || "Failed to delete activity", "error");
        setDeleteTarget(null);
        return;
      }
    }
    setActivities(prev => prev.filter(a => a.id !== deleteTarget));
    setSavedActivities(prev => prev.filter(a => a.id !== deleteTarget));
    setDeleteTarget(null);
  };

  const startEdit = (a) => { setEditingId(a.id); setEditText(a.text); };
  const saveEdit = (id) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, text: editText } : a));
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!hasChanges) return true;
    setLoading(true);
    try {
      const id = await ensureCheckinId();

      if (!id) {
        // FIRST TIME: Create morning with all activities in one POST
        const res = await createMorningAPI({
          confidence_rating: Number(confidence),
          activities: activities.map(a => ({
            title: a.text, is_priority: a.priority, is_habit: a.protect
          }))
        });
        const data = parseMorningData(res);
        if (!data?.id) throw new Error("Failed to create morning");
        checkinIdRef.current = data.id;

        // Sync local state from the POST response directly
        const returned = data.activities || [];
        const synced = returned.map(a => ({
          id: a.id, realId: a.id, text: a.title,
          done: a.is_completed ?? false,
          priority: a.is_priority ?? false,
          protect: a.is_habit ?? false,
          isCarriedOver: false, isNew: false
        }));
        setActivities(synced);
        setSavedActivities(synced.map(a => ({ ...a })));
        setSavedConfidence(Number(data.confidence_rating) || confidence);
        setIsFromYesterday(false);
      } else {
        // SUBSEQUENT: POST new activities, then PATCH all existing
        const newActs = activities.filter(a => a.isNew);
        const savedNewMap = new Map();
        for (const a of newActs) {
          const res = await addActivityAPI(id, { title: a.text, is_priority: a.priority, is_habit: a.protect });
          const d = res?.data ?? res;
          savedNewMap.set(a.id, { id: d.id, realId: d.id, isNew: false });
        }

        // PATCH existing activities
        const existingToUpdate = activities.filter(a => !a.isNew && !a.isCarriedOver && a.realId);
        if (existingToUpdate.length > 0) {
          await updateMorningAPI(id, {
            confidence_rating: Number(confidence),
            activities: existingToUpdate.map(a => ({
              id: a.realId, is_completed: a.done, is_priority: a.priority, is_habit: a.protect
            }))
          });
        } else {
          await updateMorningAPI(id, { confidence_rating: Number(confidence) });
        }

        // Sync local state — merge saved new activity IDs into current state
        const synced = activities.map(a => {
          if (a.isNew && savedNewMap.has(a.id)) {
            return { ...a, ...savedNewMap.get(a.id) };
          }
          return { ...a, isNew: false };
        });
        setActivities(synced);
        setSavedActivities(synced.map(a => ({ ...a })));
        setSavedConfidence(confidence);
      }

      showToast("Saved!", "success");
      return true;
    } catch (err) {
      showToast(err.message || "Something went wrong", "error");
      return false;
    } finally { setLoading(false); }
  };

  // Navigate with unsaved check
  const handleNavigate = (path) => {
    if (hasChanges) {
      pendingNavRef.current = path;
      setUnsavedModal({
        onSave: async () => {
          setUnsavedModal(null);
          const saved = await handleSave();
          if (saved) navigate(pendingNavRef.current);
        },
        onDiscard: () => { setUnsavedModal(null); navigate(pendingNavRef.current); },
        onCancel: () => { setUnsavedModal(null); pendingNavRef.current = null; }
      });
    } else {
      navigate(path);
    }
  };

  const confidenceLabels = ["", "Low", "Fair", "Good", "Great", "Excellent"];
  const sliderPct = ((confidence - 1) / 4) * 100;

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0f9ff 100%)" }}>
      {deleteTarget && <DeleteModal onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />}
      {unsavedModal && <UnsavedModal onSave={unsavedModal.onSave} onDiscard={unsavedModal.onDiscard} onCancel={unsavedModal.onCancel} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Sidebar activePath="/morning-checkin" onNavigate={handleNavigate} />

      {!pageReady ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-10 pt-8 pb-4 shrink-0">
          <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-1">Morning Check-in</p>
          <h1 className="text-2xl font-bold text-gray-800 leading-tight">What matters today?</h1>
          <p className="text-gray-400 text-sm mt-1">Set your intentions for the day ahead</p>
          {isFromYesterday && (
            <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Showing yesterday's incomplete tasks and protected habits
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-8">
          <div className="flex flex-col gap-5 max-w-2xl">
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
              <div className="mb-3">
                <p className="font-semibold text-gray-700 text-sm">Confidence Rating</p>
                <p className="text-xs text-gray-400 mt-0.5">How ready do you feel today?</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <input type="range" min="1" max="5" step="1" value={confidence}
                    onChange={(e) => setConfidence(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #2563eb ${sliderPct}%, #e5e7eb ${sliderPct}%)` }}
                  />
                  <div className="relative mt-2" style={{ height: "16px" }}>
                    {[1,2,3,4,5].map((n, i) => (
                      <span key={n} className={`absolute text-[10px] -translate-x-1/2 select-none ${confidence === n ? "text-blue-600 font-semibold" : "text-gray-300"}`} style={{ left: `${i * 25}%` }}>{n}</span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 w-16 text-center">
                  <span className="text-sm font-semibold text-blue-600">{confidenceLabels[confidence]}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Morning Activities</label>
              <div className="flex gap-2 mb-4">
                <div className="flex-1 flex flex-col gap-1">
                  <textarea value={newActivity}
                    onChange={(e) => { setNewActivity(e.target.value); if (newActivityError) setNewActivityError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addActivity(); } }}
                    placeholder="Add a new activity..."
                    maxLength={2000}
                    rows={1}
                    style={{ resize: "none", overflow: "hidden", fieldSizing: "content" }}
                    onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none transition min-h-[40px] ${newActivityError ? "border-red-300 bg-red-50 focus:border-red-400" : "bg-gray-50 border-gray-200 focus:border-blue-300 focus:bg-white"}`}
                  />
                  {newActivityError && <p className="text-red-500 text-xs font-medium pl-1">{newActivityError}</p>}
                </div>
                <button onClick={addActivity}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm whitespace-nowrap self-start">
                  + Add
                </button>
              </div>
              {activities.length === 0 && <p className="text-gray-300 text-sm text-center py-4">No activities yet.</p>}
              <div className="flex flex-col gap-2">
                {activities.map((a) => (
                  <div key={a.id} className={`flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all ${a.done ? "bg-gray-50 border-gray-100" : a.isCarriedOver ? "bg-amber-50 border-amber-100" : a.isNew ? "bg-blue-50 border-blue-100" : "bg-white border-gray-200"}`}>
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button onClick={() => toggleDone(a.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${a.done ? "bg-blue-500 border-blue-500 text-white" : "border-gray-300 hover:border-blue-400"}`}>
                        {a.done && <CheckIcon />}
                      </button>
                      {editingId === a.id ? (
                        <textarea autoFocus value={editText} onChange={(e) => setEditText(e.target.value)}
                          onBlur={() => saveEdit(a.id)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(a.id); } }}
                          rows={1}
                          style={{ resize: "none", overflow: "hidden", fieldSizing: "content" }}
                          onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                          className="flex-1 text-sm bg-white border border-blue-300 rounded-lg px-2 py-1 outline-none text-gray-700 min-h-[28px]" />
                      ) : (
                        <span className={`text-sm break-words whitespace-pre-wrap ${a.done ? "line-through text-gray-400" : "text-gray-700"}`}>
                          {a.text}
                          {a.isCarriedOver && <span className="ml-2 text-[10px] text-amber-500 font-medium">carried over</span>}
                          {a.isNew && <span className="ml-2 text-[10px] text-blue-500 font-medium">unsaved</span>}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <Tooltip text="Edit"><button onClick={() => startEdit(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"><PencilIcon /></button></Tooltip>
                      <Tooltip text="Priority"><button onClick={() => togglePriority(a.id)} className={`p-1.5 rounded-lg transition ${a.priority ? "text-amber-500 bg-amber-50" : "text-gray-400 hover:text-amber-500 hover:bg-amber-50"}`}><StarIcon filled={a.priority} /></button></Tooltip>
                      <Tooltip text="Protect habit"><button onClick={() => toggleProtect(a.id)} className={`p-1.5 rounded-lg transition ${a.protect ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"}`}><ShieldIcon filled={a.protect} /></button></Tooltip>
                      <Tooltip text="Delete"><button onClick={() => confirmDelete(a.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"><TrashIcon /></button></Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSave} disabled={loading || !hasChanges}
              className={`w-full py-3 rounded-xl font-medium text-sm shadow-md transition-all ${
                hasChanges && !loading
                  ? "bg-blue-600 hover:bg-blue-700 active:scale-95 text-white"
                  : "bg-blue-200 text-blue-100 cursor-not-allowed"
              }`}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </main>}
    </div>
  );
}

export default MorningCheckin;