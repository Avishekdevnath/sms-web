interface StudentAvatarProps {
  student: {
    studentId: {
      name?: string;
      profilePicture?: string;
    };
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function StudentAvatar({ student, size = 'md', className = '' }: StudentAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-20 w-20'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-2xl'
  };

  if (student.studentId?.profilePicture) {
    return (
      <img 
        src={student.studentId.profilePicture} 
        alt={student.studentId.name || 'Student'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  const initials = student.studentId?.name 
    ? student.studentId.name.charAt(0).toUpperCase()
    : '?';

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center ${className}`}>
      <span className={`${textSizes[size]} font-medium text-gray-700`}>
        {initials}
      </span>
    </div>
  );
}
