"use client";

interface MessageProps {
  type: "success" | "error" | "info";
  children: React.ReactNode;
  className?: string;
}

export default function Message({ type, children, className = "" }: MessageProps) {
  const baseClasses = "p-3 rounded-md border";
  const typeClasses = {
    success: "bg-gray-100 border-gray-200 text-gray-800",
    error: "bg-gray-100 border-gray-300 text-gray-900",
    info: "bg-gray-100 border-gray-200 text-gray-800"
  };
  
  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      {children}
    </div>
  );
} 