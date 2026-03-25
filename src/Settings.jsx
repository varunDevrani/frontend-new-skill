import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { updateUserAPI, uploadPhotoAPI, getSettingAPI, updateSettingAPI, getUserAPI } from "./api";
import Sidebar from "./Sidebar";

const PencilIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const DefaultAvatar = () => (<svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full"><rect width="128" height="128" fill="#e5e7eb"/><circle cx="64" cy="49" r="22" fill="#9ca3af"/><ellipse cx="64" cy="103" rx="36" ry="22" fill="#9ca3af"/></svg>);

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const colors = {
    success: "bg-blue-50 border-blue-200 text-blue-700",
    error: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700"
  };
  const icons = {
    success: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    error: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    warning: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };
  return <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${colors[type]}`}>{icons[type]}{message}</div>;
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
      <div className="bg-white rounded-2xl shadow-2xl p-7 w-80 border border-gray-100">
        <h3 className="text-gray-800 font-semibold text-base text-center mb-2">{title}</h3>
        <p className="text-gray-400 text-sm text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition">No, cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-sm">Yes, save</button>
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

function PhotoModal({ src, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="relative" onClick={e => e.stopPropagation()}>
        <img src={src} alt="Profile" className="w-72 h-72 rounded-full object-cover shadow-2xl border-4 border-white" />
        <button onClick={onClose} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-gray-800 transition">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}

const toInputTime = (t) => { if (!t) return ""; return String(t).slice(0, 5); };
const toApiTime = (t) => { if (!t) return null; return t.length === 5 ? `${t}:00` : t; };
const formatDisplay = (t) => {
  if (!t) return "—";
  const [h, m] = String(t).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
};

function Settings() {
  const navigate = useNavigate();
  const pendingNavRef = useRef(null);
  const [pageReady, setPageReady] = useState(false);

  const [firstName, setFirstName] = useState(localStorage.getItem("first_name") || "");
  const [lastName, setLastName] = useState(localStorage.getItem("last_name") || "");
  const [photoUrl, setPhotoUrl] = useState(localStorage.getItem("photo_url") || null);
  const [rhythm, setRhythm] = useState({ morningStart: "", morningEnd: "", eveningStart: "", eveningEnd: "" });

  const [editing, setEditing] = useState(false);
  const [tempFirstName, setTempFirstName] = useState("");
  const [tempLastName, setTempLastName] = useState("");
  const [tempRhythm, setTempRhythm] = useState({ morningStart: "", morningEnd: "", eveningStart: "", eveningEnd: "" });
  const [rhythmErrors, setRhythmErrors] = useState({});

  const [confirmModal, setConfirmModal] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [unsavedModal, setUnsavedModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      // Load settings
      const res = await getSettingAPI();
      const d = res?.data ?? res;
      setRhythm({
        morningStart: toInputTime(d.morning_start_time),
        morningEnd: toInputTime(d.morning_end_time),
        eveningStart: toInputTime(d.evening_start_time),
        eveningEnd: toInputTime(d.evening_end_time),
      });
    } catch (err) {
      console.error("loadSettings failed:", err.message);
    }

    // Also refresh user info to get latest photo from backend
    try {
      const userRes = await getUserAPI();
      const user = userRes?.data ?? userRes;
      if (user?.first_name) {
        setFirstName(user.first_name);
        localStorage.setItem("first_name", user.first_name);
      }
      if (user?.last_name) {
        setLastName(user.last_name);
        localStorage.setItem("last_name", user.last_name);
      }
      if (user?.profile_pic_url) {
        setPhotoUrl(user.profile_pic_url);
        localStorage.setItem("photo_url", user.profile_pic_url);
      }
    } catch (err) {
      console.error("loadUser failed:", err.message);
    }

    setPageReady(true);
  };

  const hasChanges = editing && (
    tempFirstName.trim() !== firstName ||
    tempLastName.trim() !== lastName ||
    tempRhythm.morningStart !== rhythm.morningStart ||
    tempRhythm.morningEnd !== rhythm.morningEnd ||
    tempRhythm.eveningStart !== rhythm.eveningStart ||
    tempRhythm.eveningEnd !== rhythm.eveningEnd
  );

  const startEdit = () => {
    setTempFirstName(firstName);
    setTempLastName(lastName);
    setTempRhythm({ ...rhythm });
    setRhythmErrors({});
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setRhythmErrors({}); };

  const validateRhythm = (r) => {
    const errs = {};
    if (!r.morningStart) errs.morningStart = "Required";
    if (!r.morningEnd) errs.morningEnd = "Required";
    if (!r.eveningStart) errs.eveningStart = "Required";
    if (!r.eveningEnd) errs.eveningEnd = "Required";
    if (r.morningStart && r.morningEnd && r.morningEnd <= r.morningStart) errs.morningEnd = "End must be after start";
    if (r.eveningStart && r.eveningEnd && r.eveningEnd <= r.eveningStart) errs.eveningEnd = "End must be after start";
    if (r.morningEnd && r.eveningStart && r.morningEnd > r.eveningStart) errs.eveningStart = "Evening must start after morning ends";
    return errs;
  };

  const requestSaveAll = () => {
    if (!tempFirstName.trim() || tempFirstName.trim().length < 2) { showToast("First name must be at least 2 characters", "error"); return; }
    if (tempFirstName.trim().length > 20) { showToast("First name cannot exceed 20 characters", "error"); return; }
    if (tempLastName.trim() && tempLastName.trim().length < 2) { showToast("Last name must be at least 2 characters", "error"); return; }
    if (tempLastName.trim().length > 20) { showToast("Last name cannot exceed 20 characters", "error"); return; }
    const errs = validateRhythm(tempRhythm);
    if (Object.keys(errs).length > 0) { setRhythmErrors(errs); return; }
    setConfirmModal({
      title: "Save Changes?",
      message: "Update your profile and daily rhythm settings?",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          if (tempFirstName.trim() !== firstName || tempLastName.trim() !== lastName) {
            const payload = { first_name: tempFirstName.trim() };
            if (tempLastName.trim()) payload.last_name = tempLastName.trim();
            await updateUserAPI(payload);
            setFirstName(tempFirstName.trim());
            setLastName(tempLastName.trim());
            localStorage.setItem("first_name", tempFirstName.trim());
            localStorage.setItem("last_name", tempLastName.trim());
          }
          const rhythmChanged =
            tempRhythm.morningStart !== rhythm.morningStart ||
            tempRhythm.morningEnd !== rhythm.morningEnd ||
            tempRhythm.eveningStart !== rhythm.eveningStart ||
            tempRhythm.eveningEnd !== rhythm.eveningEnd;
          if (rhythmChanged) {
            await updateSettingAPI({
              morning_start_time: toApiTime(tempRhythm.morningStart),
              morning_end_time: toApiTime(tempRhythm.morningEnd),
              evening_start_time: toApiTime(tempRhythm.eveningStart),
              evening_end_time: toApiTime(tempRhythm.eveningEnd),
            });
            setRhythm({ ...tempRhythm });
          }
          setEditing(false);
          showToast("Settings updated", "success");
        } catch (err) { showToast(err.message || "Failed to update", "error"); }
      }
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setConfirmModal({
      title: "Update Profile Picture?",
      message: "Upload this photo as your profile picture?",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await uploadPhotoAPI(file);
          // Use URL from backend response
          const photoData = res?.data ?? res;
          const backendUrl = photoData?.profile_pic_url ?? preview;
          setPhotoUrl(backendUrl);
          localStorage.setItem("photo_url", backendUrl);
          showToast("Profile picture updated", "success");
        } catch (err) { showToast(err.message || "Failed to upload", "error"); }
      }
    });
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    setConfirmModal({
      title: "Remove Profile Picture?",
      message: "Your profile picture will be removed.",
      onConfirm: async () => {
        setConfirmModal(null);
        setPhotoUrl(null);
        localStorage.removeItem("photo_url");
        showToast("Profile picture removed", "success");
      }
    });
  };

  const handleNavigate = (path) => {
    if (hasChanges) {
      pendingNavRef.current = path;
      setUnsavedModal({
        onSave: async () => {
          setUnsavedModal(null);
          if (!tempFirstName.trim() || tempFirstName.trim().length < 2) { showToast("First name must be at least 2 characters", "error"); return; }
          if (tempFirstName.trim().length > 20) { showToast("First name cannot exceed 20 characters", "error"); return; }
          if (tempLastName.trim() && tempLastName.trim().length < 2) { showToast("Last name must be at least 2 characters", "error"); return; }
          if (tempLastName.trim().length > 20) { showToast("Last name cannot exceed 20 characters", "error"); return; }
          const errs = validateRhythm(tempRhythm);
          if (Object.keys(errs).length > 0) { setRhythmErrors(errs); return; }
          try {
            if (tempFirstName.trim() !== firstName || tempLastName.trim() !== lastName) {
              const payload = { first_name: tempFirstName.trim() };
              if (tempLastName.trim()) payload.last_name = tempLastName.trim();
              await updateUserAPI(payload);
              setFirstName(tempFirstName.trim());
              setLastName(tempLastName.trim());
              localStorage.setItem("first_name", tempFirstName.trim());
              localStorage.setItem("last_name", tempLastName.trim());
            }
            const rhythmChanged =
              tempRhythm.morningStart !== rhythm.morningStart ||
              tempRhythm.morningEnd !== rhythm.morningEnd ||
              tempRhythm.eveningStart !== rhythm.eveningStart ||
              tempRhythm.eveningEnd !== rhythm.eveningEnd;
            if (rhythmChanged) {
              await updateSettingAPI({
                morning_start_time: toApiTime(tempRhythm.morningStart),
                morning_end_time: toApiTime(tempRhythm.morningEnd),
                evening_start_time: toApiTime(tempRhythm.eveningStart),
                evening_end_time: toApiTime(tempRhythm.eveningEnd),
              });
              setRhythm({ ...tempRhythm });
            }
            setEditing(false);
            navigate(pendingNavRef.current);
          } catch (err) { showToast(err.message || "Failed to save", "error"); }
        },
        onDiscard: () => { setUnsavedModal(null); setEditing(false); navigate(pendingNavRef.current); },
        onCancel: () => { setUnsavedModal(null); pendingNavRef.current = null; }
      });
    } else { navigate(path); }
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0f9ff 100%)" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmModal && <ConfirmModal title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />}
      {showPhotoModal && photoUrl && <PhotoModal src={photoUrl} onClose={() => setShowPhotoModal(false)} />}
      {unsavedModal && <UnsavedModal onSave={unsavedModal.onSave} onDiscard={unsavedModal.onDiscard} onCancel={unsavedModal.onCancel} />}

      <Sidebar activePath="/settings" onNavigate={handleNavigate} />

      {!pageReady ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-10 pt-8 pb-4 shrink-0">
          <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-1">Settings</p>
          <h1 className="text-2xl font-bold text-gray-800 leading-tight">Your Profile</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your account and preferences</p>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10">
          <div className="max-w-2xl flex flex-col gap-4">

            {/* Profile Picture — Edit button in top-right of this card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative">
              {/* Edit / Save / Cancel buttons inside card top-right */}
              <div className="absolute top-4 right-5 flex gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={requestSaveAll}
                      disabled={!hasChanges}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm ${
                        hasChanges
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-200 text-blue-100 cursor-not-allowed"
                      }`}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition"
                  >
                    <PencilIcon />
                    Edit
                  </button>
                )}
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Profile Picture</p>
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-200">
                    {photoUrl
                      ? <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                      : <DefaultAvatar />
                    }
                  </div>
                  <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-md transition">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium text-gray-700">
                    {[firstName, lastName].filter(Boolean).join(" ") || "Your Name"}
                  </p>
                  <p className="text-xs text-gray-400">{localStorage.getItem("user_email") || ""}</p>
                  <div className="flex gap-2 mt-1">
                    {photoUrl ? (
                      <>
                        <button onClick={() => setShowPhotoModal(true)} className="text-xs text-blue-600 hover:underline">View photo</button>
                        <span className="text-gray-300">·</span>
                        <button onClick={handleRemovePhoto} className="text-xs text-red-500 hover:underline">Remove</button>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">Click camera icon to upload</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Name fields */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Name</p>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">First Name</label>
                  {editing ? (
                    <input
                      autoFocus
                      value={tempFirstName}
                      onChange={e => setTempFirstName(e.target.value)}
                      placeholder="Enter first name"
                      maxLength={20}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-300 focus:bg-white transition"
                    />
                  ) : (
                    <p className="text-gray-800 text-sm font-medium">
                      {firstName || <span className="text-gray-300 font-normal">Not set</span>}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Last Name <span className="text-gray-300">(optional)</span>
                  </label>
                  {editing ? (
                    <input
                      value={tempLastName}
                      onChange={e => setTempLastName(e.target.value)}
                      placeholder="Enter last name"
                      maxLength={20}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-300 focus:bg-white transition"
                    />
                  ) : (
                    <p className="text-gray-800 text-sm font-medium">
                      {lastName || <span className="text-gray-300 font-normal">Not set</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Daily Rhythm */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Daily Rhythm</p>
              <p className="text-xs text-gray-400 mb-4">Your morning and evening check-in windows</p>

              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-600 mb-3">Morning Block</p>
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="text-[10px] font-medium text-amber-600 mb-1 block">Start Time</label>
                        <input type="time" value={tempRhythm.morningStart}
                          onChange={e => { setTempRhythm(p => ({ ...p, morningStart: e.target.value })); setRhythmErrors(p => ({ ...p, morningStart: "" })); }}
                          className={`w-full p-2.5 bg-white border rounded-xl text-sm text-gray-700 outline-none transition cursor-pointer ${rhythmErrors.morningStart ? "border-red-400" : "border-amber-200 focus:border-amber-400"}`}
                        />
                        {rhythmErrors.morningStart && <p className="text-red-500 text-[10px] mt-1">{rhythmErrors.morningStart}</p>}
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-amber-600 mb-1 block">End Time</label>
                        <input type="time" value={tempRhythm.morningEnd}
                          onChange={e => { setTempRhythm(p => ({ ...p, morningEnd: e.target.value })); setRhythmErrors(p => ({ ...p, morningEnd: "" })); }}
                          className={`w-full p-2.5 bg-white border rounded-xl text-sm text-gray-700 outline-none transition cursor-pointer ${rhythmErrors.morningEnd ? "border-red-400" : "border-amber-200 focus:border-amber-400"}`}
                        />
                        {rhythmErrors.morningEnd && <p className="text-red-500 text-[10px] mt-1">{rhythmErrors.morningEnd}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-indigo-600 mb-3">Evening Block</p>
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="text-[10px] font-medium text-indigo-500 mb-1 block">Start Time</label>
                        <input type="time" value={tempRhythm.eveningStart}
                          onChange={e => { setTempRhythm(p => ({ ...p, eveningStart: e.target.value })); setRhythmErrors(p => ({ ...p, eveningStart: "" })); }}
                          className={`w-full p-2.5 bg-white border rounded-xl text-sm text-gray-700 outline-none transition cursor-pointer ${rhythmErrors.eveningStart ? "border-red-400" : "border-indigo-200 focus:border-indigo-400"}`}
                        />
                        {rhythmErrors.eveningStart && <p className="text-red-500 text-[10px] mt-1">{rhythmErrors.eveningStart}</p>}
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-indigo-500 mb-1 block">End Time</label>
                        <input type="time" value={tempRhythm.eveningEnd}
                          onChange={e => { setTempRhythm(p => ({ ...p, eveningEnd: e.target.value })); setRhythmErrors(p => ({ ...p, eveningEnd: "" })); }}
                          className={`w-full p-2.5 bg-white border rounded-xl text-sm text-gray-700 outline-none transition cursor-pointer ${rhythmErrors.eveningEnd ? "border-red-400" : "border-indigo-200 focus:border-indigo-400"}`}
                        />
                        {rhythmErrors.eveningEnd && <p className="text-red-500 text-[10px] mt-1">{rhythmErrors.eveningEnd}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-600 mb-2">Morning Block</p>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">Start</span>
                        <span className="text-sm font-medium text-gray-700">{formatDisplay(rhythm.morningStart)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">End</span>
                        <span className="text-sm font-medium text-gray-700">{formatDisplay(rhythm.morningEnd)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-indigo-600 mb-2">Evening Block</p>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">Start</span>
                        <span className="text-sm font-medium text-gray-700">{formatDisplay(rhythm.eveningStart)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">End</span>
                        <span className="text-sm font-medium text-gray-700">{formatDisplay(rhythm.eveningEnd)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>}
    </div>
  );
}

export default Settings;