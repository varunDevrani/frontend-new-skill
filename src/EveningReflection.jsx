import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createEveningAPI, updateEveningAPI, getEveningAPI } from "./api";
import Sidebar from "./Sidebar";

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

const DEFAULT_FORM = { win: "", lesson: "", mistake: "", distraction: "", mood_rating: 2, energy_rating: 2 };

// Local date YYYY-MM-DD (matches backend's date.today())
function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Build form object from backend response data
function buildFormFromData(data) {
  return {
    win: data.win || "",
    lesson: data.lesson || "",
    mistake: data.mistake || "",
    distraction: data.distraction || "",
    mood_rating: Number(data.mood_rating) || 2,
    energy_rating: Number(data.energy_rating) || 2,
  };
}

function EveningReflection() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [savedForm, setSavedForm] = useState({ ...DEFAULT_FORM });
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [saving, setSaving] = useState(false);

  // Refs for stable access in callbacks (avoids stale closures)
  const eveningIdRef = useRef(null);
  const formRef = useRef({ ...DEFAULT_FORM });
  const savedFormRef = useRef({ ...DEFAULT_FORM });
  const pendingNavRef = useRef(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  // Keep refs in sync with state
  const updateForm = useCallback((next) => {
    setForm(next);
    formRef.current = next;
  }, []);

  const updateSavedForm = useCallback((next) => {
    setSavedForm(next);
    savedFormRef.current = next;
  }, []);

  const updateEveningId = useCallback((id) => {
    eveningIdRef.current = id;
  }, []);

  // --- Load evening on mount ---
  useEffect(() => {
    (async () => {
      try {
        const res = await getEveningAPI(getToday());
        const data = res?.data ?? res;
        if (data?.id) {
          updateEveningId(data.id);
          const loaded = buildFormFromData(data);
          updateForm(loaded);
          updateSavedForm({ ...loaded });
        }
      } catch {
        // No evening for today — that's fine, start fresh
      } finally {
        setPageReady(true);
      }
    })();
  }, []);

  // --- Derived ---
  const hasChanges = JSON.stringify(form) !== JSON.stringify(savedForm);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      formRef.current = next;
      return next;
    });
  };

  const setRating = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      formRef.current = next;
      return next;
    });
  };

  // --- Save (uses refs so it's safe from stale closures) ---
  const handleSave = useCallback(async () => {
    const currentForm = formRef.current;
    const currentSaved = savedFormRef.current;
    const currentId = eveningIdRef.current;

    // No changes → nothing to do
    if (JSON.stringify(currentForm) === JSON.stringify(currentSaved)) return true;

    // Validate text fields
    const textFields = ["win", "lesson", "mistake", "distraction"];
    for (const field of textFields) {
      const val = currentForm[field].trim();
      if (val.length < 2) {
        showToast("All fields must be at least 2 characters", "error");
        return false;
      }
      if (val.length > 2000) {
        showToast("Fields cannot exceed 2000 characters", "error");
        return false;
      }
    }

    setSaving(true);
    try {
      // Build payload — trim text, ensure ratings are numbers
      const payload = {
        win: currentForm.win.trim(),
        lesson: currentForm.lesson.trim(),
        mistake: currentForm.mistake.trim(),
        distraction: currentForm.distraction.trim(),
        mood_rating: Number(currentForm.mood_rating),
        energy_rating: Number(currentForm.energy_rating),
      };

      let responseData;

      if (!currentId) {
        // CREATE
        const res = await createEveningAPI(payload);
        responseData = res?.data ?? res;
        if (!responseData?.id) throw new Error("Failed to create evening reflection");
        updateEveningId(responseData.id);
        showToast("Evening reflection saved!", "success");
      } else {
        // UPDATE
        const res = await updateEveningAPI(currentId, payload);
        responseData = res?.data ?? res;
        showToast("Saved!", "success");
      }

      // Sync form + savedForm from backend response (source of truth)
      if (responseData?.id) {
        const synced = buildFormFromData(responseData);
        updateForm(synced);
        updateSavedForm({ ...synced });
      } else {
        // Fallback: use the trimmed payload as saved baseline
        updateForm({ ...payload });
        updateSavedForm({ ...payload });
      }

      return true;
    } catch (err) {
      showToast(err.message || "Something went wrong", "error");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // --- Navigation with unsaved-changes guard ---
  const handleNavigate = useCallback((path) => {
    const changed = JSON.stringify(formRef.current) !== JSON.stringify(savedFormRef.current);
    if (changed) {
      pendingNavRef.current = path;
      setShowModal(true);
    } else {
      navigate(path);
    }
  }, [navigate]);

  // Modal actions — always read latest via refs
  const onModalSave = useCallback(async () => {
    setShowModal(false);
    const saved = await handleSave();
    if (saved) navigate(pendingNavRef.current);
  }, [handleSave, navigate]);

  const onModalDiscard = useCallback(() => {
    setShowModal(false);
    navigate(pendingNavRef.current);
  }, [navigate]);

  const onModalCancel = useCallback(() => {
    setShowModal(false);
    pendingNavRef.current = null;
  }, []);

  // --- Labels ---
  const moodLabels = ["", "Low", "Fair", "Good", "Great", "Excellent"];
  const energyLabels = ["", "Drained", "Tired", "Steady", "Energised", "Charged"];

  const saveDisabled = !hasChanges || saving;

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0f9ff 100%)" }}>
      {showModal && <UnsavedModal onSave={onModalSave} onDiscard={onModalDiscard} onCancel={onModalCancel} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Sidebar activePath="/evening-reflection" onNavigate={handleNavigate} />

      {!pageReady ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-10 pt-8 pb-4 shrink-0">
          <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-1">Evening Reflection</p>
          <h1 className="text-2xl font-bold text-gray-800 leading-tight">Observe before ending the day</h1>
          <p className="text-gray-400 text-sm mt-1">Reflect on your day and set intentions for tomorrow</p>
        </div>

        <div className="flex-1 flex gap-8 px-10 pb-8 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-1">
            {[
              { name: "win", label: "Today's Win", placeholder: "What went well today?" },
              { name: "lesson", label: "Lesson Learned", placeholder: "What did you learn?" },
              { name: "mistake", label: "Today's Mistake", placeholder: "What would you do differently?" },
              { name: "distraction", label: "Primary Distraction", placeholder: "What pulled your focus?" },
            ].map(({ name, label, placeholder }) => (
              <div key={name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <label htmlFor={name} className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2 cursor-pointer">{label}<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></label>
                <textarea
                  id={name}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  maxLength={2000}
                  rows={2}
                  style={{ resize: "none", overflow: "hidden", fieldSizing: "content" }}
                  onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 focus:bg-white transition min-h-[72px]"
                />
              </div>
            ))}
          </div>

          <div className="w-[300px] shrink-0 flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex flex-col justify-between">
              <div className="mb-4">
                <p className="font-semibold text-gray-700 text-sm">Mood Rating</p>
                <p className="text-xs text-gray-400 mt-0.5">How are you feeling tonight?</p>
              </div>
              <div className="flex justify-between mb-3">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} onClick={() => setRating("mood_rating", n)}
                    className={`w-10 h-10 rounded-full text-sm font-semibold transition-all border-2 ${form.mood_rating === n ? "bg-blue-500 border-blue-500 text-white shadow-md scale-110" : "border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-400"}`}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-center text-xs font-medium text-blue-500">{moodLabels[form.mood_rating]}</p>
            </div>

            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex flex-col justify-between">
              <div className="mb-4">
                <p className="font-semibold text-gray-700 text-sm">Energy Level</p>
                <p className="text-xs text-gray-400 mt-0.5">How was your energy today?</p>
              </div>
              <div className="flex justify-between mb-3">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} onClick={() => setRating("energy_rating", n)}
                    className={`w-10 h-10 rounded-full text-sm font-semibold transition-all border-2 ${form.energy_rating === n ? "bg-blue-500 border-blue-500 text-white shadow-md scale-110" : "border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-400"}`}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-center text-xs font-medium text-blue-500">{energyLabels[form.energy_rating]}</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saveDisabled}
              className={`w-full py-3 rounded-xl font-medium text-sm shadow-md transition-all ${
                !saveDisabled
                  ? "bg-blue-600 hover:bg-blue-700 active:scale-95 text-white"
                  : "bg-blue-200 text-blue-100 cursor-not-allowed"
              }`}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </main>}
    </div>
  );
}

export default EveningReflection;
