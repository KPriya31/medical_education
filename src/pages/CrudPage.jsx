import DataTable from "../components/DataTable.jsx";
import { STATUS_OPTIONS } from "../data.js";
import { withDefaultStatus } from "../utils.js";

// Generic page rendered for any route that isn't the dashboard: a heading plus a DataTable.
export default function CrudPage({ route, rows, columns, onChange, role }) {
  const fields = route.fields || [];

  function handleSave(row) {
    const normalized = withDefaultStatus(row);
    if (normalized.id) {
      onChange(rows.map((r) => (r.id === normalized.id ? normalized : r)));
    } else {
      const nextId = rows.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
      onChange([...rows, { ...normalized, id: nextId }]);
    }
  }

  function handleDelete(row) {
    onChange(rows.filter((r) => r.id !== row.id));
  }

  function handleToggle(row) {
    const nextStatus =
      row.status === "Inactive" ? "Active" : row.status === "Active" ? "Inactive" : "Sent Back";
    onChange(rows.map((r) => (r.id === row.id ? { ...r, status: nextStatus } : r)));
  }

  function handleWorkflow(row, action) {
    const nextStatus = action === "verify" ? "Verified" : action === "approve" ? "Approved" : "Sent Back";
    onChange(rows.map((r) => (r.id === row.id ? { ...r, status: nextStatus } : r)));
  }

  return (
    <section className="content-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{route.group}</p>
          <h2>{route.title}</h2>
        </div>
      </div>
      <DataTable
        title="Records"
        rows={rows}
        columns={columns}
        fields={fields}
        onSave={handleSave}
        onDelete={handleDelete}
        onToggle={handleToggle}
        onWorkflow={route.workflow ? handleWorkflow : null}
        role={role}
        emptyHint="No records found"
        emptyActionLabel="Add Record"
        statusFilterOptions={STATUS_OPTIONS}
      />
    </section>
  );
}
