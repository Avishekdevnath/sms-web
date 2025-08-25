"use client";

import { useTransition } from "react";

interface BulkActionButtonProps {
  action: (formData: FormData) => Promise<void>;
  extraField?: { name: string; value: string };
  className?: string;
  children: React.ReactNode;
  confirmMessage?: string;
  disabled?: boolean;
}

export default function BulkActionButton({ 
  action, 
  extraField, 
  className = "btn", 
  children, 
  confirmMessage,
  disabled = false 
}: BulkActionButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (disabled) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    
    startTransition(async () => {
      const formData = new FormData();
      
      // Get all checked checkboxes from the current table
      const checkboxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="ids"]:checked');
      checkboxes.forEach(checkbox => {
        formData.append("ids", checkbox.value);
      });
      
      // Add extra field if provided
      if (extraField) {
        formData.append(extraField.name, extraField.value);
      }
      
      await action(formData);
    });
  }

  return (
    <button 
      type="button" 
      className={className} 
      onClick={handleClick}
      disabled={disabled || isPending}
    >
      {isPending ? "Processing..." : children}
    </button>
  );
} 