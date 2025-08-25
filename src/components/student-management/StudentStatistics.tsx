import { Users, BarChart3, FileText, AlertTriangle } from "lucide-react";

interface StudentStatisticsProps {
  statistics: {
    total: number;
    active: number;
    inactive: number;
    profileComplete: number;
    profileIncomplete: number;
    invited: number;
    notInvited: number;
  };
  variant?: 'default' | 'compact';
}

export default function StudentStatistics({ statistics, variant = 'default' }: StudentStatisticsProps) {
  const isCompact = variant === 'compact';
  
  const stats = [
    {
      label: 'Total Students',
      value: statistics.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Active',
      value: statistics.active,
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      label: 'Profile Complete',
      value: statistics.profileComplete,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Needs Attention',
      value: statistics.profileIncomplete + statistics.notInvited,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  if (isCompact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} ${stat.borderColor} rounded-lg p-4 border`}>
              <div className="flex items-center">
                <IconComponent className={`h-6 w-6 ${stat.color} mr-3`} />
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div key={index} className={`${stat.bgColor} ${stat.borderColor} rounded-lg p-4 border`}>
            <div className="flex items-center">
              <IconComponent className={`h-8 w-8 ${stat.color} mr-3`} />
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
