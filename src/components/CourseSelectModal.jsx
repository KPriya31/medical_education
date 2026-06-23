import { useState } from "react";
import { X, CircleCheck } from "lucide-react";

// Lets the user tick multiple master records at once instead of picking one
// at a time, then maps all of them on Save. Used for both "Add Existing
// Course" and "Add Existing Subject". `extraFields` (optional [key, label,
// options] tuples) renders dropdowns applied to every selected record - e.g.
// subjects also need a Year/Semester to satisfy the mapping table's NOT NULL
// columns, which a plain name checklist can't supply on its own.
export default function CourseSelectModal({
  title = "Course",
  emptyMessage = "No more records available to add.",
  options,
  extraFields = [],
  onClose,
  onSave,
}) {
  const [selected, setSelected] = useState([]);
  const [extraValues, setExtraValues] = useState({});

  function toggle(value) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function handleSave() {
    const names = options
      .filter((option) => selected.includes(option.value))
      .map((option) => option.label);
    onSave(names, extraValues);
  }

  const canSave =
    selected.length > 0 && extraFields.every(([key]) => extraValues[key]);

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
        {extraFields.length > 0 && (
          <div className="form-grid">
            {extraFields.map(([key, label, fieldOptions]) => (
              <label key={key}>
                <span>{label}</span>
                <select
                  aria-label={label}
                  value={extraValues[key] || ""}
                  onChange={(e) => setExtraValues((prev) => ({ ...prev, [key]: e.target.value }))}
                >
                  <option value="" disabled>
                    Select {label}
                  </option>
                  {fieldOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}
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
          <button className="primary-btn" disabled={!canSave} onClick={handleSave}>
            <CircleCheck size={18} />
            Add Selected
          </button>
        </div>
      </section>
    </div>
  );
}
