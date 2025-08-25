"use client";

export default function SelectAllControls({ containerId }: { containerId: string }) {
  function setAll(checked: boolean) {
    const root = document.getElementById(containerId);
    if (!root) return;
    const boxes = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="ids"]');
    boxes.forEach(b => (b.checked = checked));
  }
  return (
    <div className="flex gap-2">
      <button type="button" className="btn btn-secondary" onClick={() => setAll(true)}>Select all</button>
      <button type="button" className="btn" onClick={() => setAll(false)}>Unselect</button>
    </div>
  );
} 