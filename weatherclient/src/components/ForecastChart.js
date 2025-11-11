import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Customized
} from "recharts";
import dayjs from "dayjs";

export default function ForecastChart({ data }) {
  if (!data || data.length === 0) return null;

  // 🔹 Mapiranje podataka za graf
  const chartData = data.map(d => {
    const dt = dayjs(d.date);
    return {
      dt,
      temp: d.temp,
      description: d.description,
      icon: d.icon,
      weekday: dt.format("ddd"),
      day: dt.format("DD.MM"),
      hour: dt.format("HH:mm"),
      xKey: dt.toISOString(),
    };
  });

  // 🔹 ReferenceLines u ponoć
  const midnightLines = data
    .map(d => {
      const dt = dayjs(d.date);
      return {
        dt,
        xKey: dt.toISOString(),
        weekday: dt.format("ddd"),
        day: dt.format("DD.MM"),
        hour: dt.format("HH:mm"),
      };
    })
    .filter(d => d.hour === "00:00");

  // 🔹 Render dana iznad grafa
  const renderTopLabels = ({ xAxisMap }) => {
    if (!xAxisMap || xAxisMap.length === 0) return null;
    const scale = xAxisMap[0].scale;

    return midnightLines.map((m, i) => {
      const x = scale(m.xKey);
      return (
        <text
          key={i}
          x={x}
          y={20}
          textAnchor="middle"
          fill="#555"
          fontSize={12}
          fontWeight="bold"
        >
          {`${m.weekday} ${m.day}`}
        </text>
      );
    });
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={chartData}
        margin={{ top: 40, right: 20, left: 20, bottom: 30 }}
      >
        <CartesianGrid stroke="#eee" vertical={false} />

        {midnightLines.map((m, i) => (
          <ReferenceLine key={i} x={m.xKey} stroke="#555" strokeWidth={2} />
        ))}

        <XAxis
          dataKey="xKey"
          interval={0}
          tickFormatter={val => dayjs(val).format("HH:mm")}
          tick={{ fontSize: 12 }}
          height={30}
        />
        <YAxis />

        <Tooltip
          content={({ payload, label }) => {
            if (!payload || !payload.length) return null;
            const item = payload[0].payload;
            return (
              <div style={{ background: "#fff", border: "1px solid #ccc", padding: "5px" }}>
                <div><strong>{dayjs(label).format("DD.MM HH:mm")}</strong></div>
                <div>{item.temp !== null ? `${item.temp} °C` : "N/A"}</div>
                <div>{item.description}</div>
                {item.icon && <img src={`http://openweathermap.org/img/wn/${item.icon}.png`} alt={item.description} />}
              </div>
            );
          }}
        />

        <Bar
          dataKey="temp"
          fill="#1976d2"
          isAnimationActive={false}
          background={{ fill: "#eee" }}
          maxBarSize={30}
        />

        <Customized component={renderTopLabels} />
      </BarChart>
    </ResponsiveContainer>
  );
}
