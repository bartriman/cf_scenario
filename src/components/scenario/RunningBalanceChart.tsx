import type { RunningBalancePoint } from "@/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RunningBalanceChartProps {
  data: RunningBalancePoint[];
  baseCurrency: string;
}

export function RunningBalanceChart({ data, baseCurrency }: RunningBalanceChartProps) {
  if (data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">No balance data available</div>;
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: RunningBalancePoint }[] }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="text-xs text-muted-foreground">{data.date}</p>
        <p className="mt-1 text-sm font-semibold">
          {data.balance.toLocaleString("en-US", {
            style: "currency",
            currency: baseCurrency,
          })}
        </p>
      </div>
    );
  };

  // Format Y-axis
  const formatYAxis = (value: number) => {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: baseCurrency,
      notation: "compact",
      maximumFractionDigits: 1,
    });
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }}
        />
        <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={formatYAxis} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
