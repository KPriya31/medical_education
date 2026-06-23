import { useState, useEffect, useMemo, useCallback } from "react";
import {
  GraduationCap,
  Users,
  CalendarCheck,
  BadgeCheck,
  Building2,
  Layers,
  BookOpen,
  ClipboardCheck,
  ArrowLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";
import DataTable from "../components/DataTable.jsx";
import RecordModal from "../components/RecordModal.jsx";
import CourseSelectModal from "../components/CourseSelectModal.jsx";
import { BOARD_ROLES, ENTITY_FIELDS, ENTITY_COLUMNS } from "../data.js";
import { isStatusVisibleForRole, emptyRowFromFields } from "../utils.js";
import * as api from "../api.js";

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
// management plus quick stats and quick actions. Institutions/courses/subjects are
// DB-backed via the Flask API (everything else on this page stays on mock data).
function BoardDashboard({ role, data, setActiveRoute }) {
  const [institutions, setInstitutions] = useState([]);
  const [coursesForInstitution, setCoursesForInstitution] = useState([]);
  const [subjectsForCourse, setSubjectsForCourse] = useState([]);
  const [regions, setRegions] = useState([]);
  const [years, setYears] = useState([]);
  const [examSems, setExamSems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedInstitutionId, setSelectedInstitutionId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [addModal, setAddModal] = useState(null);

  const pendingApprovals = data.workflows.filter(
    (workflow) => workflow.board === role && ["Submitted", "Verified"].includes(workflow.status),
  ).length;

  const refreshInstitutions = useCallback(() => {
    api.getInstitutions(role).then(setInstitutions).catch(() => setInstitutions([]));
  }, [role]);

  const refreshCourses = useCallback((institutionId) => {
    if (!institutionId) {
      setCoursesForInstitution([]);
      return;
    }
    api.getCourses(institutionId).then(setCoursesForInstitution).catch(() => setCoursesForInstitution([]));
  }, []);

  const refreshSubjects = useCallback((courseId) => {
    if (!courseId) {
      setSubjectsForCourse([]);
      return;
    }
    api.getSubjects(courseId).then(setSubjectsForCourse).catch(() => setSubjectsForCourse([]));
  }, []);

  useEffect(() => {
    refreshInstitutions();
    setSelectedInstitutionId(null);
    setSelectedCourseId(null);
    setSelectedSubjectId(null);
  }, [role, refreshInstitutions]);

  useEffect(() => {
  api.getRegions().then(setRegions).catch(() => setRegions([]));
  api.getYears().then(setYears).catch(() => setYears([]));
  api.getExamSems().then(setExamSems).catch(() => setExamSems([]));
  api.getListCourses().then(setCourses).catch(() => setCourses([]));
  api.getListSubjects().then(setSubjects).catch(() => setSubjects([]));  // ← add
  }, []);

  useEffect(() => {
    refreshCourses(selectedInstitutionId);
  }, [selectedInstitutionId, refreshCourses]);

  useEffect(() => {
    refreshSubjects(selectedCourseId);
  }, [selectedCourseId, refreshSubjects]);

  const selectedInstitution = institutions.find((i) => i.id === selectedInstitutionId) || null;
  const selectedInstitutionIdResolved = selectedInstitution?.id || null;
  const selectedCourse = coursesForInstitution.find((c) => c.id === selectedCourseId) || null;
  const selectedCourseIdResolved = selectedCourse?.id || null;
  const selectedSubject = subjectsForCourse.find((s) => s.id === selectedSubjectId) || null;

  const regionOptions = useMemo(
    () => regions.map((r) => ({ value: String(r.id), label: r.name })),
    [regions],
  );
  const yearOptions = useMemo(
    () => years.map((y) => ({ value: String(y.id), label: y.name })),
    [years],
  );
  const semOptions = useMemo(
    () => examSems.map((s) => ({ value: String(s.id), label: s.name })),
    [examSems],
  );

  const subjectOptions = useMemo(
  () => subjects.map((s) => ({ value: String(s.id), label: s.name })),
  [subjects],
  );

  const institutionFields = useMemo(
    () =>
      ENTITY_FIELDS.institution.map(([key, label, options]) =>
        key === "region" ? [key, label, regionOptions] : [key, label, options],
      ),
    [regionOptions],
  );
  // "subject" stays plain text - used by the table's own "+ Add" button so
  // typing a name creates it directly in the subject master table.
  const subjectFields = useMemo(
  () =>
    ENTITY_FIELDS.boardSubject.map(([key, label, options]) => {
      if (key === "year") return [key, label, yearOptions];
      if (key === "semester") return [key, label, semOptions];
      return [key, label, options];
    }),
  [yearOptions, semOptions],
  );

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: String(c.id), label: c.name })),
    [courses],
  );

  // Plain text "name" field - used by the table's own "+ Add" button so typing
  // a new name creates it directly in the course master table.
  const courseFields = ENTITY_FIELDS.course;

  // `values.region` is either the region id (string, if the dropdown was
  // touched) or the original region_desc (if the modal was opened on an
  // existing row and the field was left untouched) - resolve either form.
  function resolveRegionId(regionValue) {
    if (!regionValue) return null;
    const byId = regions.find((r) => String(r.id) === String(regionValue));
    if (byId) return byId.id;
    const byName = regions.find((r) => r.name === regionValue);
    return byName ? byName.id : null;
  }

  function resolveYearId(yearValue) {
    if (!yearValue) return null;
    const byId = years.find((y) => String(y.id) === String(yearValue));
    if (byId) return byId.id;
    const byName = years.find((y) => y.name === yearValue);
    return byName ? byName.id : null;
  }

  function resolveSemId(semValue) {
    if (!semValue) return null;
    const byId = examSems.find((s) => String(s.id) === String(semValue));
    if (byId) return byId.id;
    const byName = examSems.find((s) => s.name === semValue);
    return byName ? byName.id : null;
  }

  function resolveCourseId(courseValue) {
    if (!courseValue) return null;
    const byId = courses.find((c) => String(c.id) === String(courseValue));
    if (byId) return byId.id;
    const byName = courses.find((c) => c.name === courseValue);
    return byName ? byName.id : null;
  }

  function resolveSubjectDesc(subjectValue) {
  if (!subjectValue) return subjectValue;
  // if it's an ID, find the name
  const byId = subjects.find((s) => String(s.id) === String(subjectValue));
  if (byId) return byId.name;
  // already a plain name (wasn't changed in the modal)
  return subjectValue;
 }

 function resolveCourseDesc(courseValue) {
  if (!courseValue) return courseValue;
  const byId = courses.find((c) => String(c.id) === String(courseValue));
  if (byId) return byId.name;
  return courseValue;
}

  async function saveInstitution(values) {
    const payload = {
      name: values.name,
      region_id: resolveRegionId(values.region),
      status: values.status || "Active",
      board: role,
    };
    if (values.id) {
      await api.updateInstitution(values.id, payload);
    } else {
      const created = await api.createInstitution(payload);
      setSelectedInstitutionId(created.id);
      setSelectedCourseId(null);
      setSelectedSubjectId(null);
    }
    refreshInstitutions();
  }

  async function deleteInstitutionRow(row) {
    await api.deleteInstitution(row.id);
    if (selectedInstitutionIdResolved === row.id) {
      setSelectedInstitutionId(null);
      setSelectedCourseId(null);
      setSelectedSubjectId(null);
    }
    refreshInstitutions();
  }

  async function toggleInstitutionRow(row) {
    const nextStatus = row.status === "Inactive" ? "Active" : "Inactive";
    await api.updateInstitution(row.id, {
      name: row.name,
      region_id: resolveRegionId(row.region),
      status: nextStatus,
    });
    refreshInstitutions();
  }

  async function saveCourse(values) {
    const payload = { name: resolveCourseDesc(values.name), status: values.status || "Active" };
    if (values.id) {
      await api.updateCourse(values.id, payload);
    } else {
      const created = await api.createCourse(selectedInstitutionIdResolved, payload);
      setSelectedCourseId(created.id);
      setSelectedSubjectId(null);
    }
    refreshCourses(selectedInstitutionIdResolved);
  }

  async function deleteCourseRow(row) {
    await api.deleteCourse(row.id);
    if (selectedCourseIdResolved === row.id) {
      setSelectedCourseId(null);
      setSelectedSubjectId(null);
    }
    refreshCourses(selectedInstitutionIdResolved);
  }

  async function toggleCourseRow(row) {
    const nextStatus = row.status === "Inactive" ? "Active" : "Inactive";
    await api.updateCourse(row.id, { name: resolveCourseDesc(row.name), status: nextStatus });
    refreshCourses(selectedInstitutionIdResolved);
  }

  async function saveSubject(values) {
    const payload = {
      subject: resolveSubjectDesc(values.subject),
      year_id: resolveYearId(values.year),
      sem_id: resolveSemId(values.semester),
      priority: values.priority || null,
      status: values.status || "Active",
    };
    if (values.id) {
      await api.updateSubject(values.id, payload);
    } else {
      const created = await api.createSubject(selectedCourseIdResolved, payload);
      setSelectedSubjectId(created.id);
    }
    refreshSubjects(selectedCourseIdResolved);
  }

  async function deleteSubjectRow(row) {
    await api.deleteSubject(row.id);
    if (selectedSubjectId === row.id) setSelectedSubjectId(null);
    refreshSubjects(selectedCourseIdResolved);
  }

  async function toggleSubjectRow(row) {
    const nextStatus = row.status === "Inactive" ? "Active" : "Inactive";
    await api.updateSubject(row.id, {
      subject: resolveSubjectDesc(row.subject),
      year_id: resolveYearId(row.year),
      sem_id: resolveSemId(row.semester),
      priority: row.priority,
      status: nextStatus,
    });
    refreshSubjects(selectedCourseIdResolved);
  }

  // Field/option lists are looked up by type at render time (not snapshotted
  // into addModal) so a slow-to-load region/year/semester fetch still shows
  // up if it resolves after the modal was opened.
  const addModalConfig = {
    institution: { title: "Institution", fields: institutionFields },
  };

  const [courseSelectOpen, setCourseSelectOpen] = useState(false);
  const courseSelectOptions = courseOptions.filter(
    (option) => !coursesForInstitution.some((c) => c.name === option.label),
  );

  const [subjectSelectOpen, setSubjectSelectOpen] = useState(false);
  const subjectSelectOptions = subjectOptions.filter(
    (option) => !subjectsForCourse.some((s) => s.subject === option.label),
  );

  function openAddModal(type) {
    if (type === "course") {
      setCourseSelectOpen(true);
      return;
    }
    if (type === "subject") {
      setSubjectSelectOpen(true);
      return;
    }
    const fields = addModalConfig[type].fields;
    setAddModal({ type, row: emptyRowFromFields(fields) });
  }

  async function handleAddModalSave(values) {
    if (addModal.type === "institution") await saveInstitution(values);
    setAddModal(null);
  }

  async function handleCourseSelectSave(names) {
    for (const name of names) {
      await saveCourse({ name });
    }
    setCourseSelectOpen(false);
  }

  async function handleSubjectSelectSave(names, extraValues) {
    for (const name of names) {
      await saveSubject({ subject: name, year: extraValues.year, semester: extraValues.semester });
    }
    setSubjectSelectOpen(false);
  }

  const metrics = [
    { label: "Institutions", value: institutions.length, icon: Building2 },
    { label: "Courses", value: coursesForInstitution.length, icon: Layers },
    { label: "Subjects", value: subjectsForCourse.length, icon: BookOpen },
    { label: "Pending Approvals", value: pendingApprovals, icon: ClipboardCheck },
  ];

  // Drill-down flow: institutions -> courses (for the picked institution) ->
  // subjects (for the picked course). Only the relevant step is shown at a
  // time, with the hierarchy strip doubling as breadcrumb navigation back up.
  const view = selectedCourseIdResolved ? "subjects" : selectedInstitutionIdResolved ? "courses" : "institutions";

  function goToInstitutions() {
    setSelectedInstitutionId(null);
    setSelectedCourseId(null);
    setSelectedSubjectId(null);
  }

  function goToCourses() {
    setSelectedCourseId(null);
    setSelectedSubjectId(null);
  }

  function goBackOneLevel() {
    if (view === "subjects") {
      goToCourses();
      return;
    }
    if (view === "courses") {
      goToInstitutions();
    }
  }

  return (
    <section className="board-dashboard">
      <section className="board-summary-card">
        <div className="board-summary-head">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>{role} Portal</h2>
          </div>
          <div className="board-quick-actions" aria-label="Quick actions">
            {view !== "institutions" && (
              <button className="secondary-btn compact-action" onClick={goBackOneLevel}>
                <ArrowLeft size={16} />
                {view === "subjects" ? "Back to Courses" : "Back to Institutions"}
              </button>
            )}
            {view === "institutions" && (
              <button className="secondary-btn compact-action" onClick={() => openAddModal("institution")}>
                <Building2 size={16} />
                Add Institution
              </button>
            )}
            {/* {view === "courses" && (
              <button className="secondary-btn compact-action" onClick={() => openAddModal("course")}>
                <Layers size={16} />
                Add Course
              </button>
            )} */}
            {/* {view === "subjects" && (
              <button className="secondary-btn compact-action" onClick={() => openAddModal("subject")}>
                <BookOpen size={16} />
                Add Subject
              </button>
            )} */}
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
        <div className="hierarchy-strip" aria-label="Navigation">
          <HierarchyItem
            label="Institution"
            value={selectedInstitution?.name || "All Institutions"}
            active={view === "institutions"}
            onClick={goToInstitutions}
          />
          {selectedInstitution && (
            <>
              <ChevronRight size={16} />
              <HierarchyItem
                label="Course"
                value={selectedCourse?.name || "All Courses"}
                active={view === "courses"}
                onClick={goToCourses}
              />
            </>
          )}
          {selectedCourse && (
            <>
              <ChevronRight size={16} />
              <HierarchyItem label="Subject" value="Subjects" active={view === "subjects"} />
            </>
          )}
        </div>
      </section>
      {view === "institutions" && (
        <DataTable
          title="Institutions"
          rows={institutions}
          columns={ENTITY_COLUMNS.institutions}
          fields={institutionFields}
          selectedId={selectedInstitutionIdResolved}
          onSelect={(row) => {
            setSelectedInstitutionId(row.id);
            setSelectedCourseId(null);
            setSelectedSubjectId(null);
          }}
          onSave={(row) => saveInstitution(row)}
          onDelete={(row) => deleteInstitutionRow(row)}
          onToggle={(row) => toggleInstitutionRow(row)}
          emptyHint="No institutions"
          emptyActionLabel="Add Institution"
          onEmptyAction={() => openAddModal("institution")}
          statusFilterOptions={["Active", "Inactive"]}
        />
      )}
      {view === "courses" && (
        <DataTable
          key={selectedInstitutionIdResolved}
          title={`Courses - ${selectedInstitution?.name || ""}`}
          rows={coursesForInstitution}
          columns={ENTITY_COLUMNS.courses}
          fields={courseFields}
          addLabel="Add New Course"
          secondaryAddLabel="Add Existing Course"
          onSecondaryAdd={() => setCourseSelectOpen(true)}
          selectedId={selectedCourseIdResolved}
          emptyHint="No courses mapped"
          emptyActionLabel="Add Course"
          onEmptyAction={() => openAddModal("course")}
          onSelect={(row) => {
            setSelectedCourseId(row.id);
            setSelectedSubjectId(null);
          }}
          onSave={(row) => saveCourse(row)}
          onDelete={(row) => deleteCourseRow(row)}
          onToggle={(row) => toggleCourseRow(row)}
          statusFilterOptions={["Active", "Inactive"]}
        />
      )}
      {view === "subjects" && (
        <div className="subject-workspace">
          <DataTable
            key={selectedCourseIdResolved}
            title={`Subjects - ${selectedCourse?.name || ""}`}
            rows={subjectsForCourse}
            columns={ENTITY_COLUMNS.boardSubjects}
            fields={subjectFields}
            addLabel="Add New Subject"
            secondaryAddLabel="Add Existing Subject"
            onSecondaryAdd={() => setSubjectSelectOpen(true)}
            selectedId={selectedSubject?.id || null}
            emptyHint="No subjects mapped"
            emptyActionLabel="Add Subject"
            onEmptyAction={() => openAddModal("subject")}
            wide
            onSelect={(row) => setSelectedSubjectId(row.id)}
            onSave={(row) => saveSubject(row)}
            onDelete={(row) => deleteSubjectRow(row)}
            onToggle={(row) => toggleSubjectRow(row)}
            statusFilterOptions={["Active", "Inactive"]}
          />
          <SubjectPreviewPanel
            course={selectedCourse}
            subject={selectedSubject}
            subjectCount={subjectsForCourse.length}
            disabled={false}
            subjectFields={subjectFields}
            onAdd={(row) => saveSubject(row)}
            onEdit={(row) => saveSubject(row)}
            onDelete={(row) => deleteSubjectRow(row)}
          />
        </div>
      )}
      {addModal && (
        <RecordModal
          mode="add"
          row={addModal.row}
          fields={addModalConfig[addModal.type].fields}
          title={addModalConfig[addModal.type].title}
          onClose={() => setAddModal(null)}
          onSave={handleAddModalSave}
        />
      )}
      {courseSelectOpen && (
        <CourseSelectModal
          title="Course"
          emptyMessage="No more courses available to add."
          options={courseSelectOptions}
          onClose={() => setCourseSelectOpen(false)}
          onSave={handleCourseSelectSave}
        />
      )}
      {subjectSelectOpen && (
        <CourseSelectModal
          title="Subject"
          emptyMessage="No more subjects available to add."
          options={subjectSelectOptions}
          extraFields={[
            ["year", "Year", yearOptions],
            ["semester", "Semester", semOptions],
          ]}
          onClose={() => setSubjectSelectOpen(false)}
          onSave={handleSubjectSelectSave}
        />
      )}
    </section>
  );
}

// Doubles as breadcrumb navigation when `onClick` is given (jumps back up the
// institution -> course -> subject drill-down).
function HierarchyItem({ label, value, active, onClick }) {
  const className = active ? "hierarchy-item active" : "hierarchy-item";
  if (!onClick) {
    return (
      <div className={className}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

// Read-only preview of the selected course/subject with quick add/edit/delete for the subject.
function SubjectPreviewPanel({ course, subject, subjectCount, disabled, subjectFields, onAdd, onEdit, onDelete }) {
  const [modalState, setModalState] = useState(null);
  const courseDetails = course
    ? [
        ["Course", course.name],
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
        {/* <button
          className="primary-btn compact-btn"
          disabled={disabled}
          onClick={() => setModalState({ mode: "add", row: emptyRowFromFields(subjectFields) })}
        >
          <Plus size={16} />
          Add
        </button> */}
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
          fields={subjectFields}
          title="Subject Details"
          onClose={() => setModalState(null)}
          onSave={handleSave}
        />
      )}
    </section>
  );
}
