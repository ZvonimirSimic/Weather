import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AuthPage({ onAuth }) {
  const navigate = useNavigate();

  // 🔹 Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  // 🔹 Register state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMessage, setRegMessage] = useState("");

  const inputStyle = {
    display: "block",
    margin: "10px auto",
    padding: "8px",
    width: "200px",
    boxSizing: "border-box"
  };

  const buttonStyle = {
    display: "block",
    margin: "10px auto",
    padding: "8px 20px"
  };

  // 🔹 Login funkcija
  const handleLogin = async () => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Neispravan login");
      }

      const data = await res.json();
      localStorage.setItem("jwt", data.token);
      onAuth({ username: data.username });
      navigate("/weather"); // sada vodi na WeatherDashboard
    } catch (err) {
      console.error(err);
      setLoginMessage(err.message);
    }
  };

  // 🔹 Register funkcija
  const handleRegister = async () => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: regUsername, email: regEmail, password: regPassword })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Greška pri registraciji");
      }

      // automatski login nakon registracije
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: regUsername, password: regPassword })
      });

      if (!loginRes.ok) {
        const errText = await loginRes.text();
        throw new Error(errText || "Neuspješan login nakon registracije");
      }

      const loginData = await loginRes.json();
      localStorage.setItem("jwt", loginData.token);
      onAuth({ username: loginData.username });
      navigate("/weather"); // vodi na WeatherDashboard
    } catch (err) {
      console.error(err);
      setRegMessage(err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <h1>Login & Registracija</h1>

      {/* ===== LOGIN ===== */}
      <div style={{ marginBottom: 40 }}>
        <h2>Login</h2>
        <input
          placeholder="Username"
          value={loginUsername}
          onChange={e => setLoginUsername(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={loginPassword}
          onChange={e => setLoginPassword(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleLogin} style={{ marginTop: 10 }}>Prijavi se</button>
        {loginMessage && <p style={buttonStyle}>{loginMessage}</p>}
      </div>

      {/* ===== REGISTER ===== */}
      <div>
        <h2>Registracija</h2>
        <input
          placeholder="Username"
          value={regUsername}
          onChange={e => setRegUsername(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Email"
          value={regEmail}
          onChange={e => setRegEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={regPassword}
          onChange={e => setRegPassword(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleRegister} style={{ marginTop: 10 }}>Registriraj se</button>
        {regMessage && <p style={buttonStyle}>{regMessage}</p>}
      </div>
    </div>
  );
}

export default AuthPage;