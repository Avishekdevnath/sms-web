interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
  color: "blue" | "green" | "yellow" | "red" | "purple";
}

const colorClasses = {
  blue: "bg-blue-50 border-blue-200 text-blue-800",
  green: "bg-green-50 border-green-200 text-green-800",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
  red: "bg-red-50 border-red-200 text-red-800",
  purple: "bg-purple-50 border-purple-200 text-purple-800"
};

const changeClasses = {
  positive: "text-green-600",
  negative: "text-red-600",
  neutral: "text-gray-600"
};

export function StatCard({ title, value, change, changeType = "neutral", icon, color }: StatCardProps) {
  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${changeClasses[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className="text-3xl opacity-60">
          {icon}
        </div>
      </div>
    </div>
  );
}

interface StatisticsGridProps {
  stats: StatCardProps[];
  columns?: 2 | 3 | 4;
}

export function StatisticsGrid({ stats, columns = 4 }: StatisticsGridProps) {
  const gridClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div className={`grid gap-4 ${gridClasses[columns]}`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}

// Default export
export default StatisticsGrid; 