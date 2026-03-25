import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginAPI, getSettingAPI, getUserAPI } from "./api";
import { setToken, isAuthenticated } from "./auth";

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

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({ email: false });
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValid = emailRegex.test(formData.email);

  const getEmailBorderClass = () => {
    if (!touched.email || formData.email.length === 0) return "border-gray-200 focus:border-blue-400";
    return emailValid ? "border-green-400 focus:border-green-500" : "border-red-400 focus:border-red-500";
  };

  useEffect(() => {
    if (isAuthenticated()) navigate("/morning-checkin", { replace: true });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "email") setTouched({ ...touched, email: true });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true });

    let newErrors = {};
    if (!formData.email) newErrors.email = "Email required";
    else if (!emailValid) newErrors.email = "Enter a valid email";
    if (!formData.password) newErrors.password = "Password required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSubmitting(true);
    try {
      const res = await loginAPI(formData);
      const tokenData = res.data;
      setToken(tokenData.access_token);
      localStorage.setItem("refresh_token", tokenData.refresh_token);
      localStorage.setItem("user_email", formData.email);

      // Fetch user info to populate name and photo
      try {
        const userRes = await getUserAPI();
        const user = userRes?.data ?? userRes;
        if (user?.first_name) localStorage.setItem("first_name", user.first_name);
        if (user?.last_name) localStorage.setItem("last_name", user.last_name);
        if (user?.profile_pic_url) localStorage.setItem("photo_url", user.profile_pic_url);
      } catch {
        // Non-critical, continue
      }

      // Check if onboarding is done
      try {
        await getSettingAPI();
        navigate("/morning-checkin", { replace: true });
      } catch {
        navigate("/onboarding", { replace: true });
      }
    } catch (err) {
      setErrors({ password: err.message || "Invalid credentials" });
    } finally {
      setSubmitting(false);
    }
  };

  const EyeOpen = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
  const EyeClosed = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592M6.53 6.533A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.073 5.267M15 12a3 3 0 01-3 3m0 0a3 3 0 01-2.83-2M3 3l18 18" />
    </svg>
  );

  return (
    <div className="flex h-screen font-sans" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0f9ff 100%)" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-md">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-6 h-6">
                <path d="M15 75 L15 45 L32 57 L50 28 L68 42 L85 22" stroke="white" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-gray-800 font-bold text-base leading-tight">Daily Growth OS</h1>
              <p className="text-gray-400 text-xs">Your personal OS</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome Back!</h2>
          <p className="text-gray-400 text-sm mb-8">Login to continue your growth journey.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={`w-full p-3 rounded-xl bg-gray-50 outline-none border-2 transition-colors text-sm ${getEmailBorderClass()}`}
              />
              {touched.email && !emailValid && formData.email.length > 0 && (
                <p className="text-red-500 text-xs mt-1">Enter a valid email address</p>
              )}
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  placeholder="Enter your password"
                  className="w-full p-3 pr-10 bg-gray-50 rounded-xl outline-none border-2 border-gray-200 focus:border-blue-400 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOpen /> : <EyeClosed />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full p-3 rounded-xl font-medium text-sm transition shadow-sm mt-2 flex items-center justify-center gap-2 ${
                submitting
                  ? "bg-blue-400 cursor-not-allowed text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {submitting && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              )}
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-5 text-sm text-center text-gray-500">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 font-medium hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;