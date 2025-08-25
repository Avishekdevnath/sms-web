import { UserCheck, Mail, XCircle, AlertCircle } from "lucide-react";

interface StudentStatusBadgeProps {
  student: {
    studentId: {
      isActive: boolean;
      profileCompleted: boolean;
      invitedAt?: string;
    };
  };
  size?: 'sm' | 'md' | 'lg';
}

export default function StudentStatusBadge({ student, size = 'md' }: StudentStatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  if (!student.studentId) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ${sizeClasses[size]}`}>
        <AlertCircle className={`${iconSizes[size]} mr-1`} />
        Invalid Data
      </span>
    );
  }
  
  if (student.studentId.isActive && student.studentId.profileCompleted) {
    return (
      <span className={`inline-flex items-center rounded-full font-medium bg-green-100 text-green-800 ${sizeClasses[size]}`}>
        <UserCheck className={`${iconSizes[size]} mr-1`} />
        Active
      </span>
    );
  }
  
  if (student.studentId.invitedAt && !student.studentId.profileCompleted) {
    return (
      <span className={`inline-flex items-center rounded-full font-medium bg-purple-100 text-purple-800 ${sizeClasses[size]}`}>
        <Mail className={`${iconSizes[size]} mr-1`} />
        Profile Incomplete
      </span>
    );
  }
  
  if (!student.studentId.invitedAt) {
    return (
      <span className={`inline-flex items-center rounded-full font-medium bg-blue-100 text-blue-800 ${sizeClasses[size]}`}>
        <Mail className={`${iconSizes[size]} mr-1`} />
        Needs Invitation
      </span>
    );
  }
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium bg-gray-100 text-gray-800 ${sizeClasses[size]}`}>
      <XCircle className={`${iconSizes[size]} mr-1`} />
      Inactive
    </span>
  );
}
