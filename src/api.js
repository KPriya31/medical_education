// Thin fetch wrappers for the Flask API backing the Institutions / Courses /
// Subjects hierarchy on the BOME/BOEN board dashboard. Everything else in the
// app keeps reading from the mock SEED_DATA - only these endpoints are real.

// Use whatever host the frontend itself was loaded from (localhost, a LAN IP,
// etc.) instead of hardcoding "localhost" - otherwise a browser on another
// machine would try to reach its OWN localhost:5000, not this one.
const BASE_URL = `http://${window.location.hostname}:5000/api`;
//const BASE_URL = "/api";

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message);
  }
  return res.json();
}

export function getRegions() {
  return request("/regions");
}

export function getYears() {
  return request("/years");
}

export function getExamSems() {
  return request("/exam-sems");
}

export function getListCourses() {
  return request("/courses");
}

export function getListSubjects() {
  return request("/subjects");
}

export function getInstitutions(board) {
  return request(`/institutions?board=${encodeURIComponent(board)}`);
}

export function createInstitution(payload) {
  return request("/institutions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateInstitution(id, payload) {
  return request(`/institutions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteInstitution(id) {
  return request(`/institutions/${id}`, { method: "DELETE" });
}

export function getCourses(institutionId) {
  return request(`/institutions/${institutionId}/courses`);
}

export function createCourse(institutionId, payload) {
  return request(`/institutions/${institutionId}/courses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCourse(courseId, payload) {
  return request(`/courses/${courseId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCourse(courseId) {
  return request(`/courses/${courseId}`, { method: "DELETE" });
}

export function getSubjects(courseId) {
  return request(`/courses/${courseId}/subjects`);
}

export function createSubject(courseId, payload) {
  return request(`/courses/${courseId}/subjects`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSubject(courseSubjectId, payload) {
  return request(`/subjects/${courseSubjectId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteSubject(courseSubjectId) {
  return request(`/subjects/${courseSubjectId}`, { method: "DELETE" });
}

export function login(username, password) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getDepartmentAdmins() {
  return request("/users");
}

export function createDepartmentAdmin(payload) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteDepartmentAdmin(id) {
  return request(`/users/${id}`, { method: "DELETE" });
}
