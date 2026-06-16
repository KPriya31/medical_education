import { useState } from "react";
import { X, CircleCheck } from "lucide-react";

// Generic field-driven form modal used for add/edit/view of any entity row.
// `fields` is an array of [key, label, options?] tuples; an `options` array
// renders a <select>, otherwise a plain text <input>.
export default function RecordModal({ mode, row, fields, title, onClose, onSave }) {
  const [formValues, setFormValues] = useState(row);
  const isViewMode = mode === "view";

  function setField(key, value) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{mode}</p>
            <h3>{title}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="form-grid">
          {fields.map(([key, label, options]) => (
            <label key={key}>
              <span>{label}</span>
              {options ? (
                <select
                  aria-label={label}
                  data-field={key}
                  name={key}
                  value={formValues[key] || options[0]}
                  onChange={(e) => setField(key, e.target.value)}
                  disabled={isViewMode}
                >
                  {options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  aria-label={label}
                  data-field={key}
                  name={key}
                  value={formValues[key] || ""}
                  onChange={(e) => setField(key, e.target.value)}
                  disabled={isViewMode}
                />
              )}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          {!isViewMode && (
            <button className="primary-btn" onClick={() => onSave(formValues)}>
              <CircleCheck size={18} />
              Save
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
