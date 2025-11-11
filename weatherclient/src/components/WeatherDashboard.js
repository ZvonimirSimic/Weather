import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Fade,
} from "@mui/material";
import ForecastFilter from "./ForecastFilter";
import ForecastChart from "./ForecastChart";
import ForecastGrid from "./ForecastGrid";
import WeatherWidget from "./WeatherWidget";
import HistoryPanel from "./HistoryPanel";
import StatsPanel from "./StatsPanel";

export default function WeatherDashboard({ user, setUser }) { // ✅ dodan setUser
  const [city, setCity] = useState("");
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem("jwt"); // obriši token
    setUser(null);                  // resetaj user state u App.js
  };

  const [activeFilters, setActiveFilters] = useState({
    conditions: [],
    tempRange: [-50, 50],
    timeRange: [0, Infinity],
  });

  const getForecast = async () => {
    if (!city) return;
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("jwt");
      const res = await fetch(`/api/forecast/${city}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Grad nije pronađen.");
      const data = await res.json();

      const normalizedData = data.map(f => ({
        ...f,
        date: f.date,
        temp: f.temp,
        description: f.description,
        icon: f.icon,
      }));

      setForecast(normalizedData);
      setCity(city.toLowerCase());
      setActiveTab(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredForecast = forecast.filter((f) => {
    const ts = new Date(f.date).getTime();
    const conditionOk =
      activeFilters.conditions.length === 0 ||
      activeFilters.conditions.includes(f.description);
    const tempOk =
      f.temp >= activeFilters.tempRange[0] &&
      f.temp <= activeFilters.tempRange[1];
    const timeOk =
      ts >= activeFilters.timeRange[0] &&
      ts <= activeFilters.timeRange[1];
    return conditionOk && tempOk && timeOk;
  });

  return (
    <Box sx={{ p: 3 }}>
      {}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Button variant="outlined" color="error" onClick={handleLogout}>
          Logout
        </Button>
        <Typography variant="h4">🌦️ Vremenska Prognoza</Typography>
        {}
        <Box sx={{ width: 100 }} />
      </Box>

      <WeatherWidget />

      {/* 🔹 Tabs navigacija */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          centered
        >
          <Tab label="Prognoza" />
          <Tab label="Povijest pretraga" />
          <Tab label="Statistika" />
        </Tabs>
      </Box>

      {/* === 1️⃣ TAB: Prognoza === */}
      {activeTab === 0 && (
        <Fade in={activeTab === 0}>
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 3 }}>
              <TextField
                label="Unesi grad (npr. Zagreb)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Button variant="contained" onClick={getForecast}>
                Prikaži prognozu
              </Button>
            </Box>

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Typography color="error" textAlign="center" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}

            {forecast.length > 0 && (
              <>
                <ForecastFilter data={forecast} onApply={setActiveFilters} />
                <ForecastChart data={filteredForecast} />
                <ForecastGrid data={filteredForecast} />
              </>
            )}
          </Box>
        </Fade>
      )}

      {/* === 2️⃣ TAB: Povijest pretraga === */}
      {activeTab === 1 && (
        <Fade in={activeTab === 1}>
          <Box sx={{ mt: 4 }}>
            <HistoryPanel refreshKey={activeTab} />
          </Box>
        </Fade>
      )}

      {/* === 3️⃣ TAB: Statistika === */}
      {activeTab === 2 && (
        <Fade in={activeTab === 2}>
          <Box sx={{ mt: 4 }}>
            <StatsPanel />
          </Box>
        </Fade>
      )}
    </Box>
  );
}
