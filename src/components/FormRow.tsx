export default function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <label className="text-sm text-gray-700">{label}</label>
      {children}
    </div>
  );
} 