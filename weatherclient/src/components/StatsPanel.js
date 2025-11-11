import { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Grid, Paper } from "@mui/material";
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { capitalizeCity } from "../utils/Utils";

export default function StatsPanel() {
  const [topCities, setTopCities] = useState([]);
  const [recent, setRecent] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("jwt");

        const [c1, c2, c3] = await Promise.all([
          fetch("/api/stats/top-cities", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          fetch("/api/stats/recent", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
          fetch("/api/stats/conditions", { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        ]);
        if (!c1.ok || !c2.ok || !c3.ok) throw new Error("Greška pri dohvaćanju statistika.");
        const [d1, d2, d3] = await Promise.all([c1.json(), c2.json(), c3.json()]);
        setTopCities(d1);
        setRecent(d2);
        setConditions(d3);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Typography color="error" textAlign="center">
        {error}
      </Typography>
    );

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom textAlign="center">
        📊 Statistika pretraga
      </Typography>

      <Grid container spacing={3}>
        {/* 🔹 Top 3 gradovi */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              🔝 Najčešće pretraživani gradovi
            </Typography>
            {topCities.length === 0 ? (
              <Typography>Nema podataka.</Typography>
            ) : (
              topCities.map((c, i) => (
                <Typography key={i}>
                  {i + 1}. {capitalizeCity(c.city)} ({c.count} pretraga)
                </Typography>
              ))
            )}
          </Paper>
        </Grid>

        {/* 🔹 Zadnje 3 pretrage */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              🕓 Posljednje pretrage
            </Typography>
            {recent.length === 0 ? (
              <Typography>Nema podataka.</Typography>
            ) : (
              recent.map((r, i) => (
                <Typography key={i}>
                  {capitalizeCity(r.city)} ({Math.round(r.temp ?? 0)}°C, {r.description})
                </Typography>
              ))
            )}
          </Paper>
        </Grid>

        {/* 🔹 Distribucija uvjeta */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 250 }}>
            <Typography variant="h6" gutterBottom>
              🌦️ Vremenski uvjeti
            </Typography>
            {conditions.length === 0 ? (
              <Typography>Nema podataka.</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={conditions}
                    dataKey="count"
                    nameKey="condition"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label
                  >
                    {conditions.map((_, index) => (
                      <Cell key={index} fill={`hsl(${index * 60}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
