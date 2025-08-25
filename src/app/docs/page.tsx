"use client";
import { useEffect, useState } from "react";
import PageTitle from "@/components/shared/PageTitle";

export default function DocsPage() {
  const [spec, setSpec] = useState<unknown>(null);

  useEffect(() => {
    fetch("/api/docs").then(r => r.json()).then(setSpec).catch(() => setSpec(null));
  }, []);

  return (
    <div className="p-4">
      <PageTitle title="API Documentation" />
      <h1 className="text-2xl font-bold mb-4">API Docs (OpenAPI JSON)</h1>
      {!spec ? (
        <p>Loading...</p>
      ) : (
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(spec, null, 2)}</pre>
      )}
      <p className="mt-4 text-sm text-gray-600">You can import this JSON into Swagger UI / Postman / Insomnia.</p>
    </div>
  );
} 