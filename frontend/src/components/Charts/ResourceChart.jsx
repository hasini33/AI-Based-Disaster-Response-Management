import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { name: "Food", units: 8420 },
  { name: "Water", units: 12000 },
  { name: "Medical", units: 1240 },
  { name: "Shelter", units: 2840 },
  { name: "Rescue", units: 1200 },
]

function ResourceChart() {
  return (
    <div
      className="
        w-full h-80
        text-slate-500 dark:text-slate-400
        [--tooltip-bg:white]
        [--tooltip-text:#0f172a]
        [--tooltip-border:#e2e8f0]
        dark:[--tooltip-bg:#1e293b]
        dark:[--tooltip-text:white]
        dark:[--tooltip-border:#475569]
      "
    >

      <ResponsiveContainer width="100%" height="100%">

        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 5,
          }}
        >

          {/* Grid */}
          <CartesianGrid
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeDasharray="3 3"
            vertical={false}
          />

          {/* X Axis */}
          <XAxis
            dataKey="name"
            tick={{
              fontSize: 14,
              fill: "currentColor",
            }}
            axisLine={false}
            tickLine={false}
          />

          {/* Y Axis */}
          <YAxis
            tick={{
              fontSize: 13,
              fill: "currentColor",
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              value.toLocaleString()
            }
          />

          {/* Tooltip */}
          <Tooltip
            formatter={(value) => [
              `${value.toLocaleString()} units`,
              "Demand",
            ]}
            cursor={{ fill: "rgba(37, 99, 235, 0.05)" }}
            contentStyle={{
              backgroundColor: "var(--tooltip-bg)",
              color: "var(--tooltip-text)",
              border: "1px solid var(--tooltip-border)",
              borderRadius: "8px",
            }}
          />

          {/* Bars */}
          <Bar
            dataKey="units"
            fill="#2563eb"
            radius={[6, 6, 0, 0]}
            barSize={70}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>
  )
}

export default ResourceChart