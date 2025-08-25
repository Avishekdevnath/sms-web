"use client";

export default function BulkIdsButton({ containerId, formId, fieldsContainerId, label = "Submit selected", className, confirmMessage, extraFieldId, extraFieldName }: { containerId: string; formId: string; fieldsContainerId: string; label?: string; className?: string; confirmMessage?: string; extraFieldId?: string; extraFieldName?: string }) {
  function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    const root = document.getElementById(containerId);
    const form = document.getElementById(formId) as HTMLFormElement | null;
    const fields = document.getElementById(fieldsContainerId);
    if (!root || !form || !fields) return;
    fields.innerHTML = "";
    const boxes = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="ids"]:checked');
    boxes.forEach(b => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "ids";
      input.value = b.value;
      fields.appendChild(input);
    });
    if (extraFieldId && extraFieldName) {
      const el = document.getElementById(extraFieldId) as HTMLInputElement | HTMLSelectElement | null;
      if (el && (el as any).value) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = extraFieldName;
        hidden.value = (el as any).value;
        fields.appendChild(hidden);
      }
    }
    form.requestSubmit();
  }
  return (
    <button type="button" className={className} onClick={handleClick}>{label}</button>
  );
} 