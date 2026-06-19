import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import RecordModal from "../components/RecordModal.jsx";
import IconButton from "../components/IconButton.jsx";
import { emptyRowFromFields } from "../utils.js";
import * as api from "../api.js";

const FIELDS = [
  ["username", "Username"],
  ["password", "Password"],
  ["department", "Department"],
];

// Super Admin only: create/list/delete real department-admin accounts
// (DB-backed, `users` table). The board (BOME/BOEN) isn't fixed on the
// account - it's chosen at login time, same as the old demo flow.
export default function DepartmentAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  function refresh() {
    api.getDepartmentAdmins().then(setAdmins).catch(() => setAdmins([]));
  }

  useEffect(refresh, []);

  async function handleSave(values) {
    try {
      await api.createDepartmentAdmin(values);
      setModalOpen(false);
      setError("");
      refresh();
    } catch (err) {
      setError(err.message || "Could not create department admin.");
    }
  }

  async function handleDelete(admin) {
    await api.deleteDepartmentAdmin(admin.id);
    refresh();
  }

  return (
    <section className="content-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Super Admin</p>
          <h2></h2>
        </div>
      </div>
      <section className="data-table-card">
        <div className="data-table-heading">
          <div>
            <h3>Accounts</h3>
          </div>
          <button className="primary-btn compact-btn" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Add
          </button>
        </div>
        {error && <div className="login-error">{error}</div>}
        <div className="table-wrap data-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={2} className="empty-state">
                    <div className="table-empty">
                      <span>No Department Admin yet</span>
                      <button className="secondary-btn compact-action" onClick={() => setModalOpen(true)}>
                        <Plus size={15} />
                        Add Department Admin
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id}>
                    <td data-label="Username">{admin.username}</td>
                    <td data-label="Role">{admin.role}</td>
                    <td data-label="Department">{admin.department}</td>
                    <td data-label="Actions">
                      <div className="action-group">
                        <IconButton label="Delete" onClick={() => handleDelete(admin)} icon={Trash2} tone="danger" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      {modalOpen && (
        <RecordModal
          mode="add"
          row={emptyRowFromFields(FIELDS)}
          fields={FIELDS}
          title="Department Admin"
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </section>
  );
}
