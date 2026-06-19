import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Search, Filter, ChevronLeft, ChevronRight, FileText, Pencil, ToggleLeft, CircleCheck, BadgeCheck, Trash2 } from "lucide-react";
import { FIELD_LABELS, STATUS_OPTIONS } from "../data.js";
import { emptyRowFromFields, humanizeKey, canVerify, canApprove } from "../utils.js";
import StatusBadge from "./StatusBadge.jsx";
import IconButton from "./IconButton.jsx";
import RecordModal from "./RecordModal.jsx";

// Generic searchable / filterable / paginated table used everywhere in the app.
// Opens RecordModal for add/edit/view, and renders per-row action buttons
// (View/Edit/Active-Inactive toggle/Verify/Approve/Delete) gated by role checks.
export default function DataTable({
  title,
  rows,
  columns,
  fields = [],
  selectedId,
  disabled = false,
  disabledHint = "",
  wide = false,
  emptyHint = "No records found",
  emptyActionLabel = "",
  statusFilterOptions = STATUS_OPTIONS,
  onEmptyAction,
  addLabel = "Add",
  secondaryAddLabel = "",
  onSecondaryAdd,
  onSelect,
  onSave,
  onDelete,
  onToggle,
  onWorkflow,
  role,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState(null);
  const prevRowCount = useRef(rows.length);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesSearch = Object.values(row)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesStatus = statusFilter === "All" || row.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [rows, search, statusFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );
  const rangeStart = filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const rangeEnd = Math.min(currentPage * rowsPerPage, filteredRows.length);
  const canAdd = !!(onSave && fields.length);

  useEffect(() => {
    if (rows.length > prevRowCount.current) {
      setPage(Math.max(1, Math.ceil(rows.length / rowsPerPage)));
    }
    prevRowCount.current = rows.length;
  }, [rows.length, rowsPerPage]);

  function handleSave(row) {
    const isNew = !row.id;
    onSave(row);
    setModalState(null);
    if (isNew) setPage(Math.max(1, Math.ceil((rows.length + 1) / rowsPerPage)));
  }

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilterChange(value) {
    setStatusFilter(value);
    setPage(1);
  }

  function handleRowsPerPageChange(value) {
    setRowsPerPage(value);
    setPage(1);
  }

  return (
    <section className={wide ? "data-table-card wide" : "data-table-card"}>
      <div className="data-table-heading">
        <div>
          <h3>{title}</h3>
          {disabled && disabledHint && <span>{disabledHint}</span>}
        </div>
        <div className="data-table-heading-actions">
          {secondaryAddLabel && onSecondaryAdd && (
            <button
              className="secondary-btn compact-btn"
              disabled={disabled}
              onClick={onSecondaryAdd}
            >
              <Plus size={16} />
              {secondaryAddLabel}
            </button>
          )}
          {canAdd && (
            <button
              className="primary-btn compact-btn"
              disabled={disabled}
              onClick={() => setModalState({ mode: "add", row: emptyRowFromFields(fields) })}
            >
              <Plus size={16} />
              {addLabel}
            </button>
          )}
        </div>
      </div>
      <div className="table-toolbar">
        <label className="search-box small">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search"
            disabled={disabled}
          />
        </label>
        <label className="select-box small">
          <Filter size={15} />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            disabled={disabled}
          >
            <option>All</option>
            {statusFilterOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="select-box small rows-select">
          Rows
          <select
            value={rowsPerPage}
            onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
            disabled={disabled}
          >
            {[5, 10, 20].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="table-wrap data-table-scroll">
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              {columns.map((column) => (
                <th key={column}>{FIELD_LABELS[column] || humanizeKey(column)}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="empty-state">
                  <div className="table-empty">
                    <span>{disabled && disabledHint ? disabledHint : emptyHint}</span>
                    {/* {!disabled && emptyActionLabel && (
                      <button
                        className="secondary-btn compact-action"
                        onClick={
                          onEmptyAction ||
                          (() => canAdd && setModalState({ mode: "add", row: emptyRowFromFields(fields) }))
                        }
                      >
                        <Plus size={15} />
                        {emptyActionLabel}
                      </button>
                    )} */}
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`${row.id === selectedId ? "selected-row" : ""} ${onSelect ? "clickable-row" : ""}`}
                  onClick={() => onSelect && onSelect(row)}
                >
                  <td data-label="S.No">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  {columns.map((column) => (
                    <td key={column} data-label={FIELD_LABELS[column] || humanizeKey(column)}>
                      {column === "status" ? <StatusBadge status={row[column]} /> : row[column]}
                    </td>
                  ))}
                  <td data-label="Actions" onClick={(e) => e.stopPropagation()}>
                    <div className="action-group">
                      {fields.length > 0 && (
                        <IconButton
                          label="View"
                          onClick={() => setModalState({ mode: "view", row })}
                          icon={FileText}
                        />
                      )}
                      {canAdd && (
                        <IconButton
                          label="Edit"
                          onClick={() => setModalState({ mode: "edit", row })}
                          icon={Pencil}
                        />
                      )}
                      {onToggle && (
                        <IconButton
                          label={row.status === "Inactive" ? "Activate" : "Active / Inactive"}
                          onClick={() => onToggle(row)}
                          icon={ToggleLeft}
                        />
                      )}
                      {onWorkflow && canVerify(role) && (
                        <IconButton
                          label="Verify"
                          onClick={() => onWorkflow(row, "verify")}
                          icon={CircleCheck}
                        />
                      )}
                      {onWorkflow && canApprove(role) && (
                        <IconButton
                          label="Approve"
                          onClick={() => onWorkflow(row, "approve")}
                          icon={BadgeCheck}
                        />
                      )}
                      {onDelete && (
                        <IconButton
                          label="Delete"
                          onClick={() => onDelete(row)}
                          icon={Trash2}
                          tone="danger"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>
          {rangeStart}-{rangeEnd} of {filteredRows.length}
        </span>
        <div>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label={`${title} previous page`}
          >
            <ChevronLeft size={17} />
          </button>
          <strong>
            {currentPage} / {totalPages}
          </strong>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label={`${title} next page`}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      {modalState && (
        <RecordModal
          mode={modalState.mode}
          row={modalState.row}
          fields={fields}
          title={title}
          onClose={() => setModalState(null)}
          onSave={handleSave}
        />
      )}
    </section>
  );
}
