"use client";

import React from "react";

interface ConfirmButtonProps {
  message?: string;
  className?: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  disabled?: boolean;
}

export default function ConfirmButton({ 
  message = "Are you sure?", 
  className, 
  children, 
  onConfirm,
  disabled = false 
}: ConfirmButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    if (window.confirm(message)) {
      if (onConfirm) {
        onConfirm();
      }
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
} 