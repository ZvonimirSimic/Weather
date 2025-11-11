import { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Slider
} from "@mui/material";
import dayjs from "dayjs";

export default function ForecastFilter({ data, onApply }) {
  const [conditions, setConditions] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState({});

  const [tempRange, setTempRange] = useState([-50, 50]);
  const [timeRange, setTimeRange] = useState([0, 0]); // timestamp u ms
  const [timeMarks, setTimeMarks] = useState([]);

  // 🔹 Inicijalizacija uvjeta i dostupnog vremenskog perioda
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Vremenske prilike
    const uniqueConditions = Array.from(new Set(data.map(d => d.description)));
    setConditions(uniqueConditions);
    const initialSelected = {};
    uniqueConditions.forEach(cond => (initialSelected[cond] = true));
    setSelectedConditions(initialSelected);

    // Dostupni timestampi
    const timestamps = data.map(d => new Date(d.date).getTime()).sort((a, b) => a - b);
    setTimeRange([timestamps[0], timestamps[timestamps.length - 1]]);

    // Marks za slider (svaki dan jedan mark)
    const marks = [];
    const daySet = new Set();
    timestamps.forEach(ts => {
      const day = dayjs(ts).format("DD.MM");
      if (!daySet.has(day)) {
        daySet.add(day);
        marks.push({ value: ts, label: day });
      }
    });
    setTimeMarks(marks);

  }, [data]);

  // 🔹 Toggle checkbox
  const handleToggleCondition = (cond) => {
    setSelectedConditions(prev => ({ ...prev, [cond]: !prev[cond] }));
  };

  // 🔹 Primjena filtera
  const handleApply = () => {
    const activeConditions = Object.entries(selectedConditions)
      .filter(([_, val]) => val)
      .map(([key]) => key);

    onApply({
      conditions: activeConditions,
      tempRange,
      timeRange
    });
  };

  return (
    <Box sx={{ mb: 3, py: 1, px: 0.5 }}>
      {/* 🔹 Checkbox za vremenske prilike */}
      <FormGroup row>
        {conditions.map(cond => (
          <FormControlLabel
            key={cond}
            control={
              <Checkbox
                checked={selectedConditions[cond] || false}
                onChange={() => handleToggleCondition(cond)}
              />
            }
            label={cond}
          />
        ))}
      </FormGroup>

      {/* 🔹 Slider za temperaturu */}
      <Box sx={{ mt: 2 }}>
        <Typography gutterBottom>Temperatura (°C)</Typography>
        <Slider
          value={tempRange}
          onChange={(e, newValue) => setTempRange(newValue)}
          valueLabelDisplay="auto"
          min={-50}
          max={50}
        />
      </Box>

      {/* 🔹 Slider za vremenski period */}
      <Box sx={{ mt: 2 }}>
        <Typography gutterBottom>Vremenski period</Typography>
        <Slider
          value={timeRange}
          onChange={(e, newValue) => setTimeRange(newValue)}
          valueLabelDisplay="auto"
          min={timeMarks[0]?.value || 0}
          max={timeMarks[timeMarks.length - 1]?.value || 0}
          step={3600 * 1000} // 1 sat u ms
          marks={timeMarks}
          valueLabelFormat={val => dayjs(val).format("DD.MM HH:mm")}
        />
      </Box>

      {/* 🔹 Button Primjeni filter */}
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={handleApply}
      >
        Filtriraj
      </Button>
    </Box>
  );
}
