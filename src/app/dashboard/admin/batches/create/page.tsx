"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BatchForm from "@/components/batches/BatchForm";

interface BatchFormData {
  title: string;
  code: string;
}

export default function CreateBatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: BatchFormData) => {
    try {
      setLoading(true);
      
      const response = await fetch("/api/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const createdBatch = await response.json();
        router.push(`/dashboard/admin/batches/${createdBatch._id}`);
      } else {
        const error = await response.json();
        if (error.error === "Batch code already exists") {
          throw new Error("This batch code already exists");
        } else {
          throw new Error(`Error creating batch: ${error.error}`);
        }
      }
    } catch (error) {
      console.error("Error creating batch:", error);
      alert(error instanceof Error ? error.message : "Failed to create batch. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/admin/batches");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/admin/batches"
          className="flex items-center text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Batches
        </Link>
      </div>

      <div className="border rounded-lg p-6 bg-white">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">Create New Batch</h1>
          <p className="mt-2 text-gray-600">
            Create a new student batch with a unique code and title
          </p>
        </div>

        <BatchForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Create Batch"
          loading={loading}
        />
      </div>

      {/* Help Section */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-medium text-black mb-4">Batch Naming Guidelines</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <strong>Title Examples:</strong>
            <ul className="mt-1 ml-4 list-disc">
              <li>Phitron Spring 2025</li>
              <li>Web Development Batch 1</li>
              <li>Data Science Cohort 2025</li>
              <li>Full Stack Development</li>
            </ul>
          </div>
          <div>
            <strong>Code Examples:</strong>
            <ul className="mt-1 ml-4 list-disc">
              <li>BATCH-001</li>
              <li>PHITRON-2025</li>
              <li>WEB-DEV-1</li>
              <li>DATA-SCI-2025</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
