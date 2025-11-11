import React from "react";
import dayjs from "dayjs";

export default function ForecastGrid({ data, activeFilters = {} }) {
  if (!data || data.length === 0) return null;

  const { conditions: activeConditions = [], tempRange = [-50, 50], timeRange = [0, Infinity] } = activeFilters;

  // 🔹 Grupiranje po danima
  const days = [...new Set(data.map(d => dayjs(d.date).format("DD.MM ddd")))];
  const hours = [...new Set(data.map(d => dayjs(d.date).hour()))].sort((a, b) => a - b);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "4px" }}>Sat</th>
            {days.map(day => (
              <th key={day} style={{ border: "1px solid #ccc", padding: "4px" }}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map(hour => (
            <tr key={hour}>
              <td style={{ border: "1px solid #ccc", padding: "4px" }}>{hour.toString().padStart(2, "0")}:00</td>
              {days.map(day => {
                const item = data.find(d =>
                  dayjs(d.date).format("DD.MM ddd") === day &&
                  dayjs(d.date).hour() === hour
                );

                // 🔹 Primjena filtera
                const ts = item ? new Date(item.date).getTime() : 0;
                const conditionOk = !item || activeConditions.length === 0 || activeConditions.includes(item.description);
                const tempOk = !item || (item.temp >= tempRange[0] && item.temp <= tempRange[1]);
                const timeOk = !item || (ts >= timeRange[0] && ts <= timeRange[1]);

                return (
                  <td key={day} style={{ border: "1px solid #ccc", padding: "4px", textAlign: "center" }}>
                    {item && conditionOk && tempOk && timeOk ? (
                      <div>
                        <div>{item.temp}°C</div>
                        <div>{item.description}</div>
                        {item.icon && <img src={`http://openweathermap.org/img/wn/${item.icon}.png`} alt={item.description} />}
                      </div>
                    ) : "-"}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
