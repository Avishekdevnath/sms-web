"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ViewAttendanceFormPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = String(params?.missionId || "");
  const formId = String(params?.formId || "");
  const { user } = useAuth();
  const isPrivileged = useMemo(
    () => ["admin", "sre", "mentor", "developer"].includes(user?.role || ""),
    [user]
  );

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/v2/attendance/forms/${formId}`);
        const json = await res.json();
        if (!json.success) {
          setError(json.error || "Failed to load form");
        } else {
          setForm(json.data);
        }
      } catch (e) {
        setError("Failed to load form");
      } finally {
        setLoading(false);
      }
    };
    if (formId) load();
  }, [formId]);

  if (!isPrivileged) return <div className="p-4">Insufficient permissions.</div>;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading form preview...</div>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Back
          </button>
        </div>
        <div className="text-red-600">{error || "Form not found"}</div>
      </div>
    );
  }

  // Helper to render read-only preview of a question
  const renderPreview = (q: any) => {
    const base = (
      <div className="mb-1 flex items-center gap-2">
        <span className="font-medium text-gray-800">{q.label}</span>
        {q.required ? (
          <span className="text-red-500">*</span>
        ) : null}
        <span className="text-xs text-gray-400">({q.type})</span>
      </div>
    );

    switch (q.type) {
      case "text":
      case "email":
      case "number":
      case "url":
      case "phone":
      case "date":
      case "time":
      case "datetime":
        return (
          <div>
            {base}
            <input
              disabled
              placeholder={q.placeholder || "Preview"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
            {q.description ? (
              <div className="text-xs text-gray-500 mt-1">{q.description}</div>
            ) : null}
          </div>
        );
      case "paragraph":
        return (
          <div>
            {base}
            <textarea
              disabled
              placeholder={q.placeholder || "Preview"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              rows={3}
            />
            {q.description ? (
              <div className="text-xs text-gray-500 mt-1">{q.description}</div>
            ) : null}
          </div>
        );
      case "single-select":
        return (
          <div>
            {base}
            <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <option>{q.placeholder || "Select an option"}</option>
              {(q.options || []).map((opt: string, i: number) => (
                <option key={i}>{opt}</option>
              ))}
            </select>
            {q.description ? (
              <div className="text-xs text-gray-500 mt-1">{q.description}</div>
            ) : null}
          </div>
        );
      case "multi-select":
        return (
          <div>
            {base}
            <div className="flex flex-wrap gap-2">
              {(q.options || []).map((opt: string, i: number) => (
                <span key={i} className="px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50">
                  {opt}
                </span>
              ))}
            </div>
            {q.description ? (
              <div className="text-xs text-gray-500 mt-1">{q.description}</div>
            ) : null}
          </div>
        );
      case "boolean":
        return (
          <div>
            {base}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <label className="flex items-center gap-1">
                <input type="radio" disabled /> Yes
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" disabled /> No
              </label>
            </div>
            {q.description ? (
              <div className="text-xs text-gray-500 mt-1">{q.description}</div>
            ) : null}
          </div>
        );
      case "rating":
      case "scale":
        return (
          <div>
            {base}
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-xs">Preview</span>
              <div className="h-2 bg-gray-200 rounded w-40" />
            </div>
            {q.description ? (
              <div className="text-xs text-gray-500 mt-1">{q.description}</div>
            ) : null}
          </div>
        );
      case "file":
        return (
          <div>
            {base}
            <div className="px-3 py-2 border border-dashed border-gray-300 rounded bg-gray-50 text-sm text-gray-500">
              File upload preview
            </div>
            {q.description ? (
              <div className="text-xs text-gray-500 mt-1">{q.description}</div>
            ) : null}
          </div>
        );
      default:
        return (
          <div>
            {base}
            <div className="text-xs text-gray-400">Unsupported type: {q.type}</div>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
          <p className="text-gray-600">Read-only preview as students will see it.</p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {(form.questions || [])
          .slice()
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          .map((q: any) => (
            <div key={q.key} className="bg-white p-5 rounded-md shadow">
              {renderPreview(q)}
            </div>
          ))}
      </div>
    </div>
  );
}
