import { useState, useMemo } from "react";
import {
  GraduationCap,
  Users,
  CalendarCheck,
  BadgeCheck,
  Building2,
  Layers,
  BookOpen,
  ClipboardCheck,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";
import DataTable from "../components/DataTable.jsx";
import RecordModal from "../components/RecordModal.jsx";
import { BOARD_ROLES, ENTITY_FIELDS, ENTITY_COLUMNS } from "../data.js";
import { isStatusVisibleForRole, withDefaultStatus, emptyRowFromFields } from "../utils.js";

export default function Dashboard({ data, role, routes, setActiveRoute, updateEntity }) {
  if (BOARD_ROLES.includes(role)) {
    return (
      <BoardDashboard role={role} data={data} updateEntity={updateEntity} setActiveRoute={setActiveRoute} />
    );
  }

  const stats = [
    { label: "Students", value: data.students.length, icon: GraduationCap },
    { label: "Users", value: data.users.length, icon: Users },
    { label: "Schedules", value: data.schedules.length, icon: CalendarCheck },
    { label: "Marks", value: data.studentMarks.length, icon: BadgeCheck },
  ];
  const visibleWorkflows = data.workflows.filter((workflow) => isStatusVisibleForRole(workflow.status, role));

  return (
    <section className="content-stack">
      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className="stat-card" key={stat.label}>
              <Icon size={20} />
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          );
        })}
      </div>
      <div className="quick-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Queues</p>
              <h2>Workflow Tasks</h2>
            </div>
            <span className="count-pill">{visibleWorkflows.length}</span>
          </div>
          <div className="queue-list">
            {visibleWorkflows.map((workflow) => (
              <div className="queue-row" key={workflow.id}>
                <div>
                  <strong>{workflow.task}</strong>
                  <span>
                    {workflow.module} / {workflow.board}
                  </span>
                </div>
                <StatusBadge status={workflow.status} />
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Access</p>
              <h2>Available Modules</h2>
            </div>
          </div>
          <div className="module-grid">
            {routes
              .filter((route) => route.type !== "dashboard")
              .slice(0, 8)
              .map((route) => {
                const Icon = route.icon;
                return (
                  <button className="module-tile" key={route.key} onClick={() => setActiveRoute(route.key)}>
                    <Icon size={18} />
                    <span>{route.label}</span>
                  </button>
                );
              })}
          </div>
        </section>
      </div>
    </section>
  );
}

// Dashboard shown to board roles (BOME/BOEN): institution -> course -> subject hierarchy
// management plus quick stats and quick actions.
function BoardDashboard({ role, data, updateEntity, setActiveRoute }) {
  const institutions = data.institutions.filter((institution) => institution.board === role);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [addModal, setAddModal] = useState(null);

  const institutionIds = useMemo(() => new Set(institutions.map((i) => i.id)), [institutions]);
  const courses = data.courses.filter((course) => institutionIds.has(course.institutionId));
  const courseIds = useMemo(() => new Set(courses.map((c) => c.id)), [courses]);
  const boardSubjects = data.boardSubjects.filter((subject) => courseIds.has(subject.courseId));
  const pendingApprovals = data.workflows.filter(
    (workflow) => workflow.board === role && ["Submitted", "Verified"].includes(workflow.status),
  ).length;

  const selectedInstitution = institutions.find((i) => i.id === selectedInstitutionId) || null;
  const selectedInstitutionIdResolved = selectedInstitution?.id || null;
  const coursesForInstitution = selectedInstitutionIdResolved
    ? data.courses.filter((course) => course.institutionId === selectedInstitutionIdResolved)
    : [];
  const selectedCourse = coursesForInstitution.find((c) => c.id === selectedCourseId) || null;
  const selectedCourseIdResolved = selectedCourse?.id || null;
  const subjectsForCourse = selectedCourseIdResolved
    ? data.boardSubjects.filter((subject) => subject.courseId === selectedCourseIdResolved)
    : [];
  const selectedSubject = subjectsForCourse.find((s) => s.id === selectedSubjectId) || null;

  function saveRow(entity, values, defaults = {}) {
    const rows = data[entity] || [];
    const normalized = withDefaultStatus({ ...defaults, ...values });
    if (normalized.id) {
      updateEntity(
        entity,
        rows.map((row) => (row.id === normalized.id ? normalized : row)),
      );
      return;
    }
    const nextId = rows.reduce((max, row) => Math.max(max, row.id || 0), 0) + 1;
    const newRow = { ...normalized, id: nextId };
    updateEntity(entity, [...rows, newRow]);
    if (entity === "institutions") {
      setSelectedInstitutionId(newRow.id);
      setSelectedCourseId(null);
      setSelectedSubjectId(null);
    }
    if (entity === "courses") {
      setSelectedCourseId(newRow.id);
      setSelectedSubjectId(null);
    }
    if (entity === "boardSubjects") setSelectedSubjectId(newRow.id);
  }

  function deleteRow(entity, row) {
    updateEntity(entity, (data[entity] || []).filter((r) => r.id !== row.id));
    if (entity === "institutions" && selectedInstitutionIdResolved === row.id) {
      setSelectedInstitutionId(null);
      setSelectedCourseId(null);
      setSelectedSubjectId(null);
    }
    if (entity === "courses" && selectedCourseIdResolved === row.id) {
      setSelectedCourseId(null);
      setSelectedSubjectId(null);
    }
    if (entity === "boardSubjects" && selectedSubjectId === row.id) setSelectedSubjectId(null);
  }

  function toggleRow(entity, row) {
    const rows = data[entity] || [];
    const nextStatus = row.status === "Inactive" ? "Active" : "Inactive";
    updateEntity(
      entity,
      rows.map((r) => (r.id === row.id ? { ...r, status: nextStatus } : r)),
    );
  }

  function openAddModal(type) {
    const config = {
      institution: { title: "Institution", fields: ENTITY_FIELDS.institution },
      course: { title: "Course", fields: ENTITY_FIELDS.course },
      subject: { title: "Subject", fields: ENTITY_FIELDS.boardSubject },
    }[type];
    setAddModal({ type, title: config.title, fields: config.fields, row: emptyRowFromFields(config.fields) });
  }

  function handleAddModalSave(values) {
    if (addModal.type === "institution") saveRow("institutions", values, { board: role });
    if (addModal.type === "course") saveRow("courses", values, { institutionId: selectedInstitutionIdResolved });
    if (addModal.type === "subject") saveRow("boardSubjects", values, { courseId: selectedCourseIdResolved });
    setAddModal(null);
  }

  const metrics = [
    { label: "Institutions", value: institutions.length, icon: Building2 },
    { label: "Courses", value: courses.length, icon: Layers },
    { label: "Subjects", value: boardSubjects.length, icon: BookOpen },
    { label: "Pending Approvals", value: pendingApprovals, icon: ClipboardCheck },
  ];

  return (
    <section className="board-dashboard">
      <section className="board-summary-card">
        <div className="board-summary-head">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>{role} Portal</h2>
          </div>
          <div className="board-quick-actions" aria-label="Quick actions">
            <button className="secondary-btn compact-action" onClick={() => openAddModal("institution")}>
              <Building2 size={16} />
              Add Institution
            </button>
            <button
              className="secondary-btn compact-action"
              disabled={!selectedInstitutionIdResolved}
              title={selectedInstitutionIdResolved ? "Add course" : "Select institution first"}
              onClick={() => openAddModal("course")}
            >
              <Layers size={16} />
              Add Course
            </button>
            <button
              className="secondary-btn compact-action"
              disabled={!selectedCourseIdResolved}
              title={selectedCourseIdResolved ? "Add subject" : "Select course first"}
              onClick={() => openAddModal("subject")}
            >
              <BookOpen size={16} />
              Add Subject
            </button>
            <button className="primary-btn compact-action" onClick={() => setActiveRoute("reports")}>
              <FileText size={16} />
              View MIS
            </button>
          </div>
        </div>
        <div className="board-metric-grid" aria-label="Board summary">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article className="board-metric-card" key={metric.label}>
                <Icon size={18} />
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            );
          })}
        </div>
        <div className="hierarchy-strip" aria-label="Selected hierarchy">
          <HierarchyItem
            label="Institution"
            value={selectedInstitution?.name || "Select institution"}
            active={!!selectedInstitution}
          />
          <ChevronRight size={16} />
          <HierarchyItem
            label="Course"
            value={selectedCourse?.name || "Select course"}
            active={!!selectedCourse}
          />
          <ChevronRight size={16} />
          <HierarchyItem
            label="Subject"
            value={selectedSubject?.subject || "Select subject"}
            active={!!selectedSubject}
          />
        </div>
      </section>
      <div className="board-flow-grid">
        <DataTable
          title="Institutions"
          rows={institutions}
          columns={ENTITY_COLUMNS.institutions}
          fields={ENTITY_FIELDS.institution}
          selectedId={selectedInstitutionIdResolved}
          onSelect={(row) => {
            setSelectedInstitutionId(row.id);
            setSelectedCourseId(null);
            setSelectedSubjectId(null);
          }}
          onSave={(row) => saveRow("institutions", row, { board: role })}
          onDelete={(row) => deleteRow("institutions", row)}
          onToggle={(row) => toggleRow("institutions", row)}
          emptyHint="No institutions"
          emptyActionLabel="Add Institution"
          onEmptyAction={() => openAddModal("institution")}
          statusFilterOptions={["Active", "Inactive"]}
        />
        <DataTable
          key={selectedInstitutionIdResolved || "no-institution"}
          title="Courses"
          rows={coursesForInstitution}
          columns={ENTITY_COLUMNS.courses}
          fields={ENTITY_FIELDS.course}
          selectedId={selectedCourseIdResolved}
          disabled={!selectedInstitutionIdResolved}
          disabledHint="Select institution first"
          emptyHint={selectedInstitutionIdResolved ? "No courses mapped" : "Select institution first"}
          emptyActionLabel={selectedInstitutionIdResolved ? "Add Course" : ""}
          onEmptyAction={() => openAddModal("course")}
          onSelect={(row) => {
            setSelectedCourseId(row.id);
            setSelectedSubjectId(null);
          }}
          onSave={(row) => saveRow("courses", row, { institutionId: selectedInstitutionIdResolved })}
          onDelete={(row) => deleteRow("courses", row)}
          onToggle={(row) => toggleRow("courses", row)}
          statusFilterOptions={["Active", "Inactive"]}
        />
      </div>
      <div className="subject-workspace">
        <DataTable
          key={selectedCourseIdResolved || "no-course"}
          title="Subjects"
          rows={subjectsForCourse}
          columns={ENTITY_COLUMNS.boardSubjects}
          fields={ENTITY_FIELDS.boardSubject}
          selectedId={selectedSubject?.id || null}
          disabled={!selectedCourseIdResolved}
          disabledHint="Select course first"
          emptyHint={selectedCourseIdResolved ? "No subjects mapped" : "Select course first"}
          emptyActionLabel={selectedCourseIdResolved ? "Add Subject" : ""}
          onEmptyAction={() => openAddModal("subject")}
          wide
          onSelect={(row) => setSelectedSubjectId(row.id)}
          onSave={(row) => saveRow("boardSubjects", row, { courseId: selectedCourseIdResolved })}
          onDelete={(row) => deleteRow("boardSubjects", row)}
          onToggle={(row) => toggleRow("boardSubjects", row)}
          statusFilterOptions={["Active", "Inactive"]}
        />
        <SubjectPreviewPanel
          course={selectedCourse}
          subject={selectedSubject}
          subjectCount={subjectsForCourse.length}
          disabled={!selectedCourseIdResolved}
          onAdd={(row) => saveRow("boardSubjects", row, { courseId: selectedCourseIdResolved })}
          onEdit={(row) => saveRow("boardSubjects", row, { courseId: selectedCourseIdResolved })}
          onDelete={(row) => deleteRow("boardSubjects", row)}
        />
      </div>
      {addModal && (
        <RecordModal
          mode="add"
          row={addModal.row}
          fields={addModal.fields}
          title={addModal.title}
          onClose={() => setAddModal(null)}
          onSave={handleAddModalSave}
        />
      )}
    </section>
  );
}

function HierarchyItem({ label, value, active }) {
  return (
    <div className={active ? "hierarchy-item active" : "hierarchy-item"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

// Read-only preview of the selected course/subject with quick add/edit/delete for the subject.
function SubjectPreviewPanel({ course, subject, subjectCount, disabled, onAdd, onEdit, onDelete }) {
  const [modalState, setModalState] = useState(null);
  const courseDetails = course
    ? [
        ["Course", course.name],
        ["Code", course.code],
        ["Duration", course.duration],
        ["Subjects", subjectCount],
      ]
    : [];
  const subjectDetails = subject
    ? [
        ["Subject", subject.subject],
        ["Year", subject.year],
        ["Semester", subject.semester],
        ["Priority", subject.priority],
      ]
    : [];

  function handleSave(row) {
    if (modalState?.mode === "add") onAdd(row);
    else onEdit(row);
    setModalState(null);
  }

  return (
    <section className="subject-preview-panel">
      <div className="mini-table-heading">
        <h3>Subject Preview</h3>
        <button
          className="primary-btn compact-btn"
          disabled={disabled}
          onClick={() => setModalState({ mode: "add", row: emptyRowFromFields(ENTITY_FIELDS.boardSubject) })}
        >
          <Plus size={16} />
          Add
        </button>
      </div>
      {course ? (
        <>
          <div className="preview-table-wrap">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Course Detail</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {courseDetails.map(([label, value]) => (
                  <tr key={label}>
                    <td data-label="Course Detail">{label}</td>
                    <td data-label="Value">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {subject ? (
            <>
              <div className="preview-table-wrap">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Subject Detail</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectDetails.map(([label, value]) => (
                      <tr key={label}>
                        <td data-label="Subject Detail">{label}</td>
                        <td data-label="Value">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="preview-actions">
                <button className="secondary-btn" onClick={() => setModalState({ mode: "edit", row: subject })}>
                  <Pencil size={16} />
                  Edit
                </button>
                <button className="secondary-btn danger-text" onClick={() => onDelete(subject)}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="preview-empty small">Select subject</div>
          )}
        </>
      ) : (
        <div className="preview-empty">{disabled ? "Select course first" : "Select subject"}</div>
      )}
      {modalState && (
        <RecordModal
          mode={modalState.mode}
          row={modalState.row}
          fields={ENTITY_FIELDS.boardSubject}
          title="Subject Details"
          onClose={() => setModalState(null)}
          onSave={handleSave}
        />
      )}
    </section>
  );
}
