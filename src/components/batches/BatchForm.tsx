"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";

interface BatchFormData {
  title: string;
  code: string;
}

interface BatchFormProps {
  initialData?: BatchFormData;
  onSubmit: (data: BatchFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
}

export default function BatchForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Batch",
  loading = false
}: BatchFormProps) {
  const [formData, setFormData] = useState<BatchFormData>({
    title: "",
    code: "",
    ...initialData
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Batch title is required";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Batch code is required";
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = "Batch code can only contain uppercase letters, numbers, and hyphens";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  const generateBatchCode = async () => {
    try {
      const response = await fetch("/api/batches/generate-code");
      if (response.ok) {
        const { code } = await response.json();
        setFormData(prev => ({ ...prev, code }));
      }
    } catch (error) {
      console.error("Error generating batch code:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Batch Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Batch Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="e.g., Phitron Spring 2025, Web Development Batch 1"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 ${
            errors.title 
              ? "border-red-500 focus:ring-red-500" 
              : "border-gray-300 focus:ring-black"
          }`}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Batch Code */}
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
          Batch Code *
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleInputChange}
            placeholder="e.g., BATCH-001, PHITRON-2025"
            className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 ${
              errors.code 
                ? "border-red-500 focus:ring-red-500" 
                : "border-gray-300 focus:ring-black"
            }`}
          />
          <button
            type="button"
            onClick={generateBatchCode}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
          >
            Generate
          </button>
        </div>
        {errors.code && (
          <p className="mt-1 text-sm text-red-600">{errors.code}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Use uppercase letters, numbers, and hyphens only
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
