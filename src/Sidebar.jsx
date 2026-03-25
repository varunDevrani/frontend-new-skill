import { logout } from "./auth";
import { getUserAPI } from "./api";
import { useState, useEffect } from "react";

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
      <div className="bg-white rounded-2xl shadow-2xl p-7 w-80 border border-gray-100">
        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><LogoutIcon /></div>
        <h3 className="text-gray-800 font-semibold text-base text-center mb-1">Log Out?</h3>
        <p className="text-gray-400 text-sm text-center mb-6">Are you sure you want to log out?</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition shadow-sm">Log Out</button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ activePath, onNavigate }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    const readLocal = () => {
      setFirstName(localStorage.getItem("first_name") || "");
      setLastName(localStorage.getItem("last_name") || "");
      setEmail(localStorage.getItem("user_email") || "");
      setPhotoUrl(localStorage.getItem("photo_url") || null);
    };
    readLocal();

    // Fetch fresh user data from backend and sync localStorage
    getUserAPI().then(res => {
      const user = res?.data ?? res;
      if (user?.first_name) { setFirstName(user.first_name); localStorage.setItem("first_name", user.first_name); }
      if (user?.last_name) { setLastName(user.last_name); localStorage.setItem("last_name", user.last_name); }
      if (user?.email) { setEmail(user.email); localStorage.setItem("user_email", user.email); }
      if (user?.profile_pic_url) { setPhotoUrl(user.profile_pic_url); localStorage.setItem("photo_url", user.profile_pic_url); }
    }).catch(() => {});

    // Listen for storage changes from other tabs or Settings page
    window.addEventListener("storage", readLocal);
    return () => window.removeEventListener("storage", readLocal);
  }, [activePath]);

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Your Name";
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "U";

  const handleNav = (path) => {
    if (onNavigate) onNavigate(path);
    else window.location.href = path;
  };

  const navItems = [
    { label: "Morning Check-in", path: "/morning-checkin" },
    { label: "Evening Reflection", path: "/evening-reflection" },
    { label: "Skill Practice", path: "/skill-practice" },
  ];

  return (
    <>
      {showLogoutModal && <LogoutModal onConfirm={logout} onCancel={() => setShowLogoutModal(false)} />}

      <aside className="w-60 bg-white border-r border-gray-100 shadow-sm flex flex-col h-full shrink-0">
        <div className="px-6 pt-7 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-4 h-4">
                <path d="M15 75 L15 45 L32 57 L50 28 L68 42 L85 22" stroke="white" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-gray-800 font-bold text-sm tracking-tight leading-tight">Daily Growth OS</h1>
              <p className="text-gray-400 text-[10px] tracking-wide">Your personal OS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {navItems.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => handleNav(path)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activePath === path ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="px-4 pb-5 flex flex-col gap-2 border-t border-gray-100 pt-4">
          <button
            onClick={() => handleNav("/settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
              activePath === "/settings" ? "bg-blue-50" : "hover:bg-gray-50"
            }`}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 border-gray-100 shadow-sm flex items-center justify-center bg-blue-100">
              {photoUrl
                ? <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-blue-600 text-xs font-bold">{initials}</span>
              }
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className={`text-sm font-semibold truncate leading-tight ${activePath === "/settings" ? "text-blue-700" : "text-gray-800"}`}>
                {fullName}
              </p>
              <p className={`text-[11px] truncate mt-0.5 ${activePath === "/settings" ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"}`}>
                {email}
              </p>
            </div>
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <LogoutIcon />Log Out
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;