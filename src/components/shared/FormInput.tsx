import React from 'react';

interface FormInputProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel';
  defaultValue?: string | number;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  multiline?: boolean;
  error?: string;
}

export default function FormInput({
  name,
  label,
  type = 'text',
  defaultValue,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder,
  className = "input",
  min,
  max,
  step,
  rows = 3,
  multiline = false,
  error
}: FormInputProps) {
  const InputComponent = multiline ? 'textarea' : 'input';
  const inputValue = value !== undefined ? value : defaultValue || '';

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <InputComponent
        type={multiline ? undefined : type}
        name={name}
        value={inputValue}
        onChange={onChange || (() => {})}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={`${className} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        min={min}
        max={max}
        step={step}
        rows={multiline ? rows : undefined}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
} 