"use client";

import React, { useEffect, useCallback } from "react";

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  className?: string;
}

const sizeToMaxWidth: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({
  isOpen,
  title,
  children,
  onClose,
  footer,
  size = "md",
  closeOnBackdrop = true,
  closeOnEsc = true,
  className = "",
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (closeOnEsc && e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [isOpen, closeOnEsc, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    // Prevent background scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
      />

      {/* Dialog */}
      <div
        className={`relative bg-white rounded-xl shadow-xl w-full ${sizeToMaxWidth[size]} mx-4 p-6 animate-slideIn ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
        >
          ×
        </button>

        {title && (
          <h2 id="modal-title" className="text-lg font-semibold mb-4 text-gray-900">
            {title}
          </h2>
        )}

        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="mt-6 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
} 