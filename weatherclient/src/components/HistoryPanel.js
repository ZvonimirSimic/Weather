import { useEffect, useState } from "react";
import { capitalizeCity } from "../utils/Utils";
import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Fade,
} from "@mui/material";

export default function HistoryPanel({ refreshKey }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0); // 🔹 trenutna stranica
  const pageSize = 10; // 🔹 koliko po stranici

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("jwt");
        if (!token) throw new Error("Niste prijavljeni.");
        const res = await fetch("/api/searches/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Greška pri dohvaćanju povijesti pretraga.");
        const data = await res.json();
        // 🔹 prikaži zadnjih 100 pretraga
        setHistory(data.slice(0, 100));
        setPage(0); // resetiraj na prvu stranicu
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [refreshKey]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Typography color="error" textAlign="center" sx={{ mt: 3 }}>
        {error}
      </Typography>
    );

  if (history.length === 0)
    return (
      <Typography textAlign="center" sx={{ mt: 3 }}>
        Nema spremljenih pretraga.
      </Typography>
    );

  // 🔹 slice za trenutnu stranicu
  const paginated = history.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <Fade in>
      <Box sx={{ mt: 3, maxWidth: 600, mx: "auto" }}>
        <Typography variant="h5" gutterBottom textAlign="center">
          📜 Povijest pretraga
        </Typography>
        <Box sx={{ maxHeight: 400, overflowY: "auto", border: "1px solid #ccc", borderRadius: 1 }}>
          <List>
            {paginated.map((h, i) => (
              <Box key={h.id}>
                <ListItem alignItems="flex-start">
                  {h.icon && (
                    <img
                      src={`http://openweathermap.org/img/wn/${h.icon}.png`}
                      alt={h.description}
                      style={{ width: 40, height: 40, marginRight: 12 }}
                    />
                  )}
                  <ListItemText
                    primary={`${capitalizeCity(h.city)} — ${Math.round(h.temp ?? 0)}°C`}
                    secondary={
                      <>
                        {h.description.charAt(0).toUpperCase() + h.description.slice(1)}
                        <br />
                        <span style={{ fontSize: "0.85em", color: "#555" }}>
                          {new Date(h.queryTime).toLocaleString("hr-HR")}
                        </span>
                      </>
                    }
                  />
                </ListItem>
                {i < paginated.length - 1 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
          </List>
        </Box>

        {/* 🔹 Pagination Controls */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button
            variant="outlined"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
          >
            Prethodno
          </Button>
          <Typography sx={{ alignSelf: "center" }}>
            Stranica {page + 1} od {Math.ceil(history.length / pageSize)}
          </Typography>
          <Button
            variant="outlined"
            disabled={(page + 1) * pageSize >= history.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Sljedeće
          </Button>
        </Box>
      </Box>
    </Fade>
  );
}
