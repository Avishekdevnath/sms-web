"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Semi-transparent backdrop with subtle blur */}
      <div 
        className="absolute inset-0 bg-white/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-lg shadow-2xl border border-gray-200`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-black">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
