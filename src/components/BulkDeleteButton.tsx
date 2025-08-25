"use client";

export default function BulkDeleteButton({ containerId, formId, fieldsContainerId, confirmMessage = "Delete selected?", className }: { containerId: string; formId: string; fieldsContainerId: string; confirmMessage?: string; className?: string }) {
  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
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
    form.requestSubmit();
  }
  return (
    <button type="button" className={className} onClick={handleClick}>Delete selected</button>
  );
} 