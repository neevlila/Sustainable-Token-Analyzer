import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  icon: LucideIcon;
  title: string;
  value: string | number;
  unit: string;
  colorClass: string;         // e.g. "text-green-500"
  bgClass?: string;           // e.g. "bg-green-500/10"
  delta?: string;             // optional e.g. "−30.2%"
  deltaPositive?: boolean;    // true = green, false = red
}

export const MetricCard: React.FC<Props> = ({
  icon: Icon,
  title,
  value,
  unit,
  colorClass,
  bgClass,
  delta,
  deltaPositive,
}) => (
  <Card className="transition-shadow hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-1.5 rounded-md ${bgClass ?? "bg-muted"}`}>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="flex flex-wrap items-center gap-1.5 mt-1">
        <p className="text-xs text-muted-foreground">{unit}</p>
        {delta && (
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${deltaPositive
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600"
              }`}
          >
            {delta}
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);
