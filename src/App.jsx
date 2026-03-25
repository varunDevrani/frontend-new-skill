import Signup from "./Signup";
import Login from "./Login";
import Onboarding from "./Onboarding";
import MorningCheckin from "./MorningCheckin";
import EveningReflection from "./EveningReflection";
import SkillPractice from "./SkillPractice";
import Settings from "./Settings";

import { Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated } from "./auth";

const PublicRoute = ({ children }) => {
  return isAuthenticated() ? <Navigate to="/morning-checkin" /> : children;
};

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/morning-checkin" element={<ProtectedRoute><MorningCheckin /></ProtectedRoute>} />
      <Route path="/evening-reflection" element={<ProtectedRoute><EveningReflection /></ProtectedRoute>} />
      <Route path="/skill-practice" element={<ProtectedRoute><SkillPractice /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;