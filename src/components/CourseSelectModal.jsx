import { useState } from "react";
import { X, CircleCheck } from "lucide-react";

// Lets the user tick multiple master records at once instead of picking one
// at a time, then maps all of them on Save. Used for both "Add Existing
// Course" and "Add Existing Subject".
export default function CourseSelectModal({
  title = "Course",
  emptyMessage = "No more records available to add.",
  options,
  onClose,
  onSave,
}) {
  const [selected, setSelected] = useState([]);

  function toggle(value) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function handleSave() {
    const names = options
      .filter((option) => selected.includes(option.value))
      .map((option) => option.label);
    onSave(names);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={`Add ${title}`}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">add</p>
            <h3>{title}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="course-select-list">
          {options.length === 0 && <p>{emptyMessage}</p>}
          {options.map((option) => (
            <label key={option.value} className="course-select-row">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" disabled={!selected.length} onClick={handleSave}>
            <CircleCheck size={18} />
            Add Selected
          </button>
        </div>
      </section>
    </div>
  );
}
