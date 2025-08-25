import React from 'react';

interface DateInputProps {
  name: string;
  label?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  min?: string;
  max?: string;
  showTime?: boolean;
  error?: string;
}

export default function DateInput({
  name,
  label,
  defaultValue,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder,
  className = "input",
  min,
  max,
  showTime = false,
  error
}: DateInputProps) {
  const formatValue = (val?: string) => {
    if (!val) return '';
    
    // If the value is already in the correct format (YYYY-MM-DD or YYYY-MM-DDTHH:MM), return it as is
    if (showTime) {
      // For datetime-local, check if it's already in the correct format
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) {
        return val;
      }
      // Otherwise, try to parse and format
      const date = new Date(val);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    } else {
      // For date input, check if it's already in the correct format
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return val;
      }
      // Otherwise, try to parse and format
      const date = new Date(val);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().slice(0, 10); // YYYY-MM-DD
    }
  };

  const inputValue = value !== undefined ? formatValue(value) : formatValue(defaultValue);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={showTime ? "datetime-local" : "date"}
        name={name}
        value={inputValue}
        onChange={onChange || (() => {})}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={`${className} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        min={min}
        max={max}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
} 