import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import AuthPage from "./components/AuthPage";
import WeatherDashboard from "./components/WeatherDashboard";

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        {/* Stranica za login i registraciju */}
        <Route path="/auth" element={<AuthPage onAuth={setUser} />} />

        {/* Stranica za prognozu */}
        <Route
          path="/weather"
          element={
            user ? <WeatherDashboard user={user} setUser={setUser} /> : <Navigate to="/auth" replace />
          }
        />

        {/* Default redirect */}
        <Route
          path="*"
          element={<Navigate to={user ? "/weather" : "/auth"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;