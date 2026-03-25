import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updateUserAPI, uploadPhotoAPI, createSettingAPI } from "./api";

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const colors = { success: "bg-blue-50 border-blue-200 text-blue-700", error: "bg-red-50 border-red-200 text-red-700" };
  const icons = {
    success: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    error: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  };
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${colors[type]}`}>
      {icons[type]}{message}
    </div>
  );
}

const DefaultAvatar = () => (
  <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="128" height="128" fill="#e5e7eb"/>
    <circle cx="64" cy="49" r="22" fill="#9ca3af"/>
    <ellipse cx="64" cy="103" rx="36" ry="22" fill="#9ca3af"/>
  </svg>
);

function Onboarding() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "",
    morningStart: "07:00", morningEnd: "09:00",
    eveningStart: "20:00", eveningEnd: "22:00"
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const removePhoto = () => { setPhotoFile(null); setPhotoPreview(null); };

  const formatTime = (time) => !time ? null : time.length === 5 ? `${time}:00` : time;

  const formatDisplay = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    try {
      if (!form.firstName.trim() || form.firstName.trim().length < 2) {
        setToast({ message: "First name must be at least 2 characters", type: "error" }); return;
      }
      if (form.firstName.trim().length > 20) {
        setToast({ message: "First name cannot exceed 20 characters", type: "error" }); return;
      }
      if (form.lastName.trim() && form.lastName.trim().length < 2) {
        setToast({ message: "Last name must be at least 2 characters", type: "error" }); return;
      }
      if (form.lastName.trim().length > 20) {
        setToast({ message: "Last name cannot exceed 20 characters", type: "error" }); return;
      }
      if (form.morningEnd <= form.morningStart) {
        setToast({ message: "Morning end time must be after start time", type: "error" }); return;
      }
      if (form.eveningEnd <= form.eveningStart) {
        setToast({ message: "Evening end time must be after start time", type: "error" }); return;
      }
      if (form.morningEnd > form.eveningStart) {
        setToast({ message: "Morning and evening windows must not overlap", type: "error" }); return;
      }

      setSubmitting(true);

      const userPayload = { first_name: form.firstName.trim() };
      if (form.lastName.trim()) userPayload.last_name = form.lastName.trim();

      await updateUserAPI(userPayload);
      localStorage.setItem("first_name", form.firstName.trim());
      if (form.lastName.trim()) localStorage.setItem("last_name", form.lastName.trim());

      if (photoFile) {
        // Get the URL from backend response
        const photoRes = await uploadPhotoAPI(photoFile);
        const photoData = photoRes?.data ?? photoRes;
        const backendUrl = photoData?.profile_pic_url ?? null;
        if (backendUrl) {
          localStorage.setItem("photo_url", backendUrl);
        }
      }

      await createSettingAPI({
        morning_start_time: formatTime(form.morningStart),
        morning_end_time: formatTime(form.morningEnd),
        evening_start_time: formatTime(form.eveningStart),
        evening_end_time: formatTime(form.eveningEnd),
        is_morning_reminder_enabled: true,
        is_evening_reminder_enabled: true
      });

      navigate("/morning-checkin", { replace: true });
    } catch (err) {
      console.error("ERROR:", err);
      setToast({ message: err.message || "Something went wrong", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden font-sans flex flex-col" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0f9ff 100%)" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-4xl mx-auto px-8 py-8 w-full flex flex-col h-full">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-5 h-5">
              <path d="M15 75 L15 45 L32 57 L50 28 L68 42 L85 22" stroke="white" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-gray-800 font-bold text-base leading-tight">Daily Growth OS</h1>
            <p className="text-gray-400 text-xs">Let's personalize your experience</p>
          </div>
        </div>

        <div className="flex gap-8 flex-1 min-h-0">
          {/* Left — About You */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-7 flex flex-col">
            <h3 className="font-semibold text-gray-800 text-base mb-6">Tell us about yourself</h3>

            {/* Photo Upload */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-3">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-200">
                  {photoPreview ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" /> : <DefaultAvatar />}
                </div>
                <label className="absolute bottom-0 right-0 w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-md transition">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>
              <p className="text-xs text-gray-400 mb-2">Click the camera to upload your photo</p>
              {photoPreview && (
                <button onClick={removePhoto} className="text-xs text-red-500 hover:text-red-600 font-medium transition">
                  Remove photo
                </button>
              )}
            </div>

            {/* Name fields */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
                <input name="firstName" placeholder="e.g. Rohit" value={form.firstName} onChange={handleChange} maxLength={20}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:bg-white transition" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Last Name <span className="text-gray-300 font-normal text-xs">(optional)</span></label>
                <input name="lastName" placeholder="e.g. Varun" value={form.lastName} onChange={handleChange} maxLength={20}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:bg-white transition" />
              </div>
            </div>
          </div>

          {/* Right — Daily Rhythm */}
          <div className="w-[340px] flex flex-col gap-4">
            <h3 className="font-semibold text-gray-800 text-base">Set your daily rhythm</h3>

            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex-1">
              <div className="mb-4">
                <p className="font-semibold text-gray-700 text-sm">Morning Block</p>
                <p className="text-xs text-gray-400">{formatDisplay(form.morningStart)} → {formatDisplay(form.morningEnd)}</p>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium text-amber-600 mb-1 block">Start Time</label>
                  <input type="time" name="morningStart" value={form.morningStart} onChange={handleChange}
                    className="w-full p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-gray-700 outline-none focus:border-amber-400 focus:bg-white transition cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-medium text-amber-600 mb-1 block">End Time</label>
                  <input type="time" name="morningEnd" value={form.morningEnd} onChange={handleChange}
                    className="w-full p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-gray-700 outline-none focus:border-amber-400 focus:bg-white transition cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 flex-1">
              <div className="mb-4">
                <p className="font-semibold text-gray-700 text-sm">Evening Block</p>
                <p className="text-xs text-gray-400">{formatDisplay(form.eveningStart)} → {formatDisplay(form.eveningEnd)}</p>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium text-indigo-500 mb-1 block">Start Time</label>
                  <input type="time" name="eveningStart" value={form.eveningStart} onChange={handleChange}
                    className="w-full p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-gray-700 outline-none focus:border-indigo-400 focus:bg-white transition cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs font-medium text-indigo-500 mb-1 block">End Time</label>
                  <input type="time" name="eveningEnd" value={form.eveningEnd} onChange={handleChange}
                    className="w-full p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-gray-700 outline-none focus:border-indigo-400 focus:bg-white transition cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex items-center gap-2 px-7 py-3 rounded-xl font-medium text-sm shadow-md transition-all ${
              submitting
                ? "bg-blue-400 cursor-not-allowed text-white"
                : "bg-blue-600 hover:bg-blue-700 active:scale-95 text-white"
            }`}
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Setting up...
              </>
            ) : (
              <>
                Complete Setup
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;