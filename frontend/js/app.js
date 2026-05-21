// ═══════════════════════════════════════════════════════
//  app.js — DevOps Academy LMS Frontend
//  All API calls go to /api/* (served by Express)
//  Auth token is stored in localStorage
// ═══════════════════════════════════════════════════════

const API = '/api';

// ── Auth helpers ───────────────────────────────
function getToken() { return localStorage.getItem('lms_token'); }
function setToken(t) { localStorage.setItem('lms_token', t); }
function clearToken() { localStorage.removeItem('lms_token'); localStorage.removeItem('lms_user'); }

function getUser() {
  try { return JSON.parse(localStorage.getItem('lms_user')); } catch { return null; }
}
function setUser(u) { localStorage.setItem('lms_user', JSON.stringify(u)); }

// ── Core fetch wrapper ─────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (getToken()) headers['Authorization'] = `Bearer ${getToken()}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

// ── Auth tab switch ────────────────────────────
function switchTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('login-form').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('auth-error').style.display = 'none';
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = 'block';
}

// ── Login ──────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data);
    launchApp();
  } catch (err) {
    showAuthError(err.message);
  }
}

// ── Register ───────────────────────────────────
async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    setToken(data.token);
    setUser(data);
    launchApp();
  } catch (err) {
    showAuthError(err.message);
  }
}

// ── Logout ─────────────────────────────────────
function doLogout() {
  clearToken();
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
}

// ── Launch app ─────────────────────────────────
function launchApp() {
  const user = getUser();
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('sidebar-avatar').textContent = user.name[0].toUpperCase();
  document.getElementById('sidebar-user-name').textContent = user.name;
  document.getElementById('sidebar-user-email').textContent = user.email;
  document.getElementById('sidebar-role-badge').textContent =
    user.role.charAt(0).toUpperCase() + user.role.slice(1);
  buildNav();
  showPage('dashboard');
}

// ═══════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════
function buildNav() {
  const role = getUser().role;
  const items = [{ label: 'Dashboard', icon: '🏠', page: 'dashboard' }];

  if (role === 'admin') {
    items.push({ section: 'Management' });
    items.push({ label: 'Users', icon: '👥', page: 'admin-users' });
    items.push({ label: 'Courses', icon: '📚', page: 'admin-courses' });
    items.push({ label: 'Announcements', icon: '📢', page: 'announcements' });
    items.push({ label: 'Reports', icon: '📊', page: 'admin-reports' });
  }

  if (role === 'instructor') {
    items.push({ section: 'Teaching' });
    items.push({ label: 'My Courses', icon: '📚', page: 'instructor-courses' });
    items.push({ label: 'Assignments', icon: '📝', page: 'instructor-assignments' });
    items.push({ label: 'Submissions', icon: '📬', page: 'instructor-submissions' });
    items.push({ label: 'Announcements', icon: '📢', page: 'announcements' });
  }

  if (role === 'student') {
    items.push({ section: 'Learning' });
    items.push({ label: 'Courses', icon: '📚', page: 'student-courses' });
    items.push({ label: 'My Assignments', icon: '📝', page: 'student-assignments' });
    items.push({ label: 'My Progress', icon: '📈', page: 'student-progress' });
  }

  items.push({ section: 'Account' });
  items.push({ label: 'Profile', icon: '👤', page: 'profile' });

  document.getElementById('sidebar-nav').innerHTML = items.map(item => {
    if (item.section) return `<div class="nav-section-label">${item.section}</div>`;
    return `<div class="nav-item" data-page="${item.page}" onclick="showPage('${item.page}')">
      <span>${item.icon}</span><span>${item.label}</span>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════
//  PAGE ROUTER
// ═══════════════════════════════════════════════════════
const pageTitles = {
  dashboard: 'Dashboard',
  'admin-users': 'User Management',
  'admin-courses': 'Course Management',
  'admin-reports': 'Reports',
  'instructor-courses': 'My Courses',
  'instructor-assignments': 'Assignments',
  'instructor-submissions': 'Submissions',
  'student-courses': 'Browse Courses',
  'student-assignments': 'My Assignments',
  'student-progress': 'My Progress',
  announcements: 'Announcements',
  profile: 'Profile',
};

function showPage(page) {
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.page === page)
  );
  document.getElementById('topbar-title').textContent = pageTitles[page] || page;
  document.getElementById('topbar-actions').innerHTML = '';
  document.getElementById('page-content').innerHTML = '<div class="loading">Loading...</div>';

  const pages = {
    dashboard: renderDashboard,
    'admin-users': renderAdminUsers,
    'admin-courses': renderAdminCourses,
    'admin-reports': renderAdminReports,
    'instructor-courses': renderInstructorCourses,
    'instructor-assignments': renderInstructorAssignments,
    'instructor-submissions': renderInstructorSubmissions,
    'student-courses': renderStudentCourses,
    'student-assignments': renderStudentAssignments,
    'student-progress': renderStudentProgress,
    announcements: renderAnnouncements,
    profile: renderProfile,
  };

  if (pages[page]) pages[page]();
}

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════
function setContent(html) { document.getElementById('page-content').innerHTML = html; }
function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function levelBadge(l) {
  const map = { Beginner: 'badge-green', Intermediate: 'badge-amber', Advanced: 'badge-red' };
  return `<span class="badge ${map[l] || 'badge-gray'}">${l || '—'}</span>`;
}
function showError(msg) {
  setContent(`<div class="alert alert-danger">${msg}</div>`);
}

// ═══════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════
async function renderDashboard() {
  const role = getUser().role;
  try {
    if (role === 'admin') await renderAdminDashboard();
    else if (role === 'instructor') await renderInstructorDashboard();
    else await renderStudentDashboard();
  } catch (err) { showError(err.message); }
}

async function renderAdminDashboard() {
  const [users, courses, enrollments, submissions, announcements] = await Promise.all([
    apiFetch('/users'),
    apiFetch('/courses?all=true'),
    apiFetch('/enrollments'),
    apiFetch('/submissions'),
    apiFetch('/announcements'),
  ]);
  setContent(`
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Total Users</div><div class="stat-value">${users.length}</div><div class="stat-sub">${users.filter(u => u.role === 'student').length} students</div></div>
      <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-label">Courses</div><div class="stat-value">${courses.length}</div><div class="stat-sub">${courses.filter(c => c.status === 'published').length} published</div></div>
      <div class="stat-card"><div class="stat-icon">🎓</div><div class="stat-label">Enrollments</div><div class="stat-value">${enrollments.length}</div></div>
      <div class="stat-card"><div class="stat-icon">📬</div><div class="stat-label">Submissions</div><div class="stat-value">${submissions.length}</div><div class="stat-sub">${submissions.filter(s => s.grade === null).length} pending</div></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">📢 Recent Announcements</div><button class="btn btn-sm btn-primary" onclick="showPage('announcements')">View All</button></div>
        ${announcements.slice(0, 3).map(a => `
          <div class="announcement">
            <div class="announcement-title">${a.title}</div>
            <div class="announcement-body">${a.body}</div>
            <div class="announcement-meta">By ${a.author?.name || '—'} · ${fmt(a.createdAt)}</div>
          </div>`).join('') || '<div class="text-sm text-muted">No announcements yet.</div>'}
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">📚 Courses</div><button class="btn btn-sm btn-primary" onclick="showPage('admin-courses')">Manage</button></div>
        ${courses.slice(0, 4).map(c => `
          <div class="flex items-center gap-2 mb-2 pb-2" style="border-bottom:1px solid var(--border)">
            <span style="font-size:22px">${c.emoji}</span>
            <div style="flex:1"><div class="font-medium text-sm">${c.title}</div><div class="text-xs text-muted">${c.category} · ${c.level}</div></div>
            <span class="badge ${c.status === 'published' ? 'badge-green' : 'badge-gray'}">${c.status}</span>
          </div>`).join('')}
      </div>
    </div>`);
}

async function renderInstructorDashboard() {
  const [courses, assignments, submissions, announcements] = await Promise.all([
    apiFetch('/courses?all=true'),
    apiFetch('/assignments'),
    apiFetch('/submissions'),
    apiFetch('/announcements'),
  ]);
  const myCourses = courses.filter(c => c.instructor?._id === getUser()._id || c.instructor === getUser()._id);
  const pending = submissions.filter(s => s.grade === null);
  setContent(`
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-label">My Courses</div><div class="stat-value">${myCourses.length}</div></div>
      <div class="stat-card"><div class="stat-icon">📝</div><div class="stat-label">Assignments</div><div class="stat-value">${assignments.length}</div></div>
      <div class="stat-card"><div class="stat-icon">📬</div><div class="stat-label">Submissions</div><div class="stat-value">${submissions.length}</div></div>
      <div class="stat-card"><div class="stat-icon">⏳</div><div class="stat-label">Pending Grading</div><div class="stat-value">${pending.length}</div></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">📚 My Courses</div><button class="btn btn-sm btn-primary" onclick="showPage('instructor-courses')">View All</button></div>
        ${myCourses.slice(0, 4).map(c => `<div class="flex items-center gap-2 mb-2"><span style="font-size:22px">${c.emoji}</span><div style="flex:1"><div class="font-medium text-sm">${c.title}</div><div class="text-xs text-muted">${c.level} · ${c.duration}</div></div>${levelBadge(c.level)}</div>`).join('') || '<div class="text-sm text-muted">No courses yet.</div>'}
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">📬 Pending Grading</div><button class="btn btn-sm btn-outline" onclick="showPage('instructor-submissions')">Grade All</button></div>
        ${pending.length === 0 ? '<div class="text-sm text-muted">All caught up! 🎉</div>' : pending.slice(0, 4).map(s => `
          <div class="submission-row">
            <div class="font-medium text-sm">${s.assignment?.title || '—'}</div>
            <div class="text-xs text-muted">By ${s.student?.name || '—'} · ${fmt(s.createdAt)}</div>
          </div>`).join('')}
      </div>
    </div>`);
}

async function renderStudentDashboard() {
  const [enrollments, submissions, announcements] = await Promise.all([
    apiFetch('/enrollments/my'),
    apiFetch('/submissions/my'),
    apiFetch('/announcements'),
  ]);
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length)
    : 0;
  setContent(`
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-label">Enrolled Courses</div><div class="stat-value">${enrollments.length}</div></div>
      <div class="stat-card"><div class="stat-icon">📝</div><div class="stat-label">Submissions</div><div class="stat-value">${submissions.length}</div></div>
      <div class="stat-card"><div class="stat-icon">📈</div><div class="stat-label">Avg Progress</div><div class="stat-value">${avgProgress}%</div></div>
      <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-label">Graded</div><div class="stat-value">${submissions.filter(s => s.grade !== null).length}</div></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">📚 My Courses</div><button class="btn btn-sm btn-primary" onclick="showPage('student-courses')">Browse More</button></div>
        ${enrollments.length === 0 ? '<div class="text-sm text-muted">Not enrolled yet. <a href="#" onclick="showPage(\'student-courses\')">Browse courses!</a></div>'
          : enrollments.map(e => `
            <div class="mb-2">
              <div class="flex items-center gap-2 mb-1">
                <span style="font-size:18px">${e.course?.emoji || '📚'}</span>
                <span class="font-medium text-sm" style="flex:1">${e.course?.title || '—'}</span>
                <span class="text-xs text-muted">${e.progress}%</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${e.progress}%"></div></div>
            </div>`).join('')}
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">📢 Announcements</div></div>
        ${announcements.slice(0, 3).map(a => `
          <div class="announcement">
            <div class="announcement-title">${a.title}</div>
            <div class="announcement-body">${a.body}</div>
            <div class="announcement-meta">By ${a.author?.name || '—'} · ${fmt(a.createdAt)}</div>
          </div>`).join('') || '<div class="text-sm text-muted">No announcements.</div>'}
      </div>
    </div>`);
}

// ═══════════════════════════════════════════════════════
//  ADMIN — USERS
// ═══════════════════════════════════════════════════════
async function renderAdminUsers() {
  document.getElementById('topbar-actions').innerHTML =
    `<button class="btn btn-primary btn-sm" onclick="openAddUserModal()">+ Add User</button>`;
  try {
    const users = await apiFetch('/users');
    setContent(`
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><div class="flex items-center gap-2"><div class="avatar" style="width:28px;height:28px;font-size:11px">${u.name[0]}</div><span class="font-medium">${u.name}</span></div></td>
                  <td class="text-sm text-muted">${u.email}</td>
                  <td><span class="badge ${u.role === 'admin' ? 'badge-red' : u.role === 'instructor' ? 'badge-blue' : 'badge-green'}">${u.role}</span></td>
                  <td class="text-sm text-muted">${fmt(u.createdAt)}</td>
                  <td><div class="flex gap-1">
                    <button class="btn btn-sm btn-outline" onclick="openEditUserModal('${u._id}','${u.name}','${u.email}','${u.role}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${u._id}')">Delete</button>
                  </div></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`);
  } catch (err) { showError(err.message); }
}

function openAddUserModal() {
  openModal(`
    <div class="modal-title">Add New User</div>
    <div class="form-group"><label class="form-label">Full Name</label><input id="m-name" class="form-input" /></div>
    <div class="form-group"><label class="form-label">Email</label><input id="m-email" class="form-input" type="email" /></div>
    <div class="form-group"><label class="form-label">Password</label><input id="m-password" class="form-input" type="password" /></div>
    <div class="form-group"><label class="form-label">Role</label><select id="m-role" class="form-select"><option>student</option><option>instructor</option><option>admin</option></select></div>
    <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveNewUser()">Add User</button></div>
  `);
}

async function saveNewUser() {
  try {
    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('m-name').value.trim(),
        email: document.getElementById('m-email').value.trim(),
        password: document.getElementById('m-password').value,
        role: document.getElementById('m-role').value,
      }),
    });
    closeModal();
    renderAdminUsers();
  } catch (err) { alert(err.message); }
}

function openEditUserModal(id, name, email, role) {
  openModal(`
    <div class="modal-title">Edit User</div>
    <div class="form-group"><label class="form-label">Full Name</label><input id="m-name" class="form-input" value="${name}" /></div>
    <div class="form-group"><label class="form-label">Email</label><input id="m-email" class="form-input" value="${email}" /></div>
    <div class="form-group"><label class="form-label">Role</label>
      <select id="m-role" class="form-select">
        <option ${role === 'student' ? 'selected' : ''}>student</option>
        <option ${role === 'instructor' ? 'selected' : ''}>instructor</option>
        <option ${role === 'admin' ? 'selected' : ''}>admin</option>
      </select>
    </div>
    <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveEditUser('${id}')">Save</button></div>
  `);
}

async function saveEditUser(id) {
  try {
    await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: document.getElementById('m-name').value.trim(),
        email: document.getElementById('m-email').value.trim(),
        role: document.getElementById('m-role').value,
      }),
    });
    closeModal();
    renderAdminUsers();
  } catch (err) { alert(err.message); }
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  try {
    await apiFetch(`/users/${id}`, { method: 'DELETE' });
    renderAdminUsers();
  } catch (err) { alert(err.message); }
}

// ═══════════════════════════════════════════════════════
//  COURSES (Admin / Instructor)
// ═══════════════════════════════════════════════════════
async function renderAdminCourses() {
  document.getElementById('topbar-actions').innerHTML =
    `<button class="btn btn-primary btn-sm" onclick="openCourseModal()">+ New Course</button>`;
  try {
    const [courses, enrollments] = await Promise.all([
      apiFetch('/courses?all=true'),
      apiFetch('/enrollments'),
    ]);
    setContent(`
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Course</th><th>Level</th><th>Instructor</th><th>Enrolled</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${courses.map(c => `
                <tr>
                  <td><div class="flex items-center gap-2"><span style="font-size:20px">${c.emoji}</span><div><div class="font-medium text-sm">${c.title}</div><div class="text-xs text-muted">${c.category} · ${c.duration}</div></div></div></td>
                  <td>${levelBadge(c.level)}</td>
                  <td class="text-sm text-muted">${c.instructor?.name || '—'}</td>
                  <td class="text-sm">${enrollments.filter(e => e.course?._id === c._id || e.course === c._id).length}</td>
                  <td><span class="badge ${c.status === 'published' ? 'badge-green' : 'badge-amber'}">${c.status}</span></td>
                  <td><div class="flex gap-1">
                    <button class="btn btn-sm btn-outline" onclick="openCourseModal('${c._id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCourse('${c._id}')">Delete</button>
                  </div></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`);
  } catch (err) { showError(err.message); }
}

async function renderInstructorCourses() {
  document.getElementById('topbar-actions').innerHTML =
    `<button class="btn btn-primary btn-sm" onclick="openCourseModal()">+ New Course</button>`;
  try {
    const courses = await apiFetch('/courses?all=true');
    setContent(`
      <div class="grid-3">
        ${courses.length === 0
          ? '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">No courses yet</div></div>'
          : courses.map(c => `
            <div class="course-card">
              <div class="course-thumb">${c.emoji}</div>
              <div class="course-body">
                <div class="course-title">${c.title}</div>
                <div class="course-meta">${c.category} · ${c.duration}</div>
                <div class="course-tags">${levelBadge(c.level)}<span class="badge ${c.status === 'published' ? 'badge-green' : 'badge-amber'}">${c.status}</span></div>
                <div class="flex gap-1">
                  <button class="btn btn-sm btn-outline" style="flex:1" onclick="openCourseModal('${c._id}')">Edit</button>
                  <button class="btn btn-sm btn-outline" style="flex:1" onclick="showAssignmentsModal('${c._id}')">Assignments</button>
                </div>
              </div>
            </div>`).join('')}
      </div>`);
  } catch (err) { showError(err.message); }
}

async function openCourseModal(id) {
  let course = null;
  if (id) {
    try { course = await apiFetch(`/courses/${id}`); } catch {}
  }
  openModal(`
    <div class="modal-title">${course ? 'Edit' : 'New'} Course</div>
    <div class="form-group"><label class="form-label">Title</label><input id="m-title" class="form-input" value="${course?.title || ''}" placeholder="Course title" /></div>
    <div class="form-group"><label class="form-label">Description</label><textarea id="m-desc" class="form-input" rows="3">${course?.description || ''}</textarea></div>
    <div class="grid-2" style="gap:10px">
      <div class="form-group"><label class="form-label">Category</label><input id="m-cat" class="form-input" value="${course?.category || ''}" placeholder="e.g. Docker" /></div>
      <div class="form-group"><label class="form-label">Emoji</label><input id="m-emoji" class="form-input" value="${course?.emoji || '📚'}" /></div>
    </div>
    <div class="grid-2" style="gap:10px">
      <div class="form-group"><label class="form-label">Level</label>
        <select id="m-level" class="form-select">
          <option ${course?.level === 'Beginner' ? 'selected' : ''}>Beginner</option>
          <option ${course?.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
          <option ${course?.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Duration</label><input id="m-dur" class="form-input" value="${course?.duration || ''}" placeholder="e.g. 4 weeks" /></div>
    </div>
    <div class="form-group"><label class="form-label">Status</label>
      <select id="m-status" class="form-select">
        <option value="draft" ${course?.status === 'draft' ? 'selected' : ''}>Draft</option>
        <option value="published" ${course?.status === 'published' ? 'selected' : ''}>Published</option>
      </select>
    </div>
    <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveCourse('${id || ''}')">Save</button></div>
  `);
}

async function saveCourse(id) {
  const data = {
    title: document.getElementById('m-title').value.trim(),
    description: document.getElementById('m-desc').value.trim(),
    category: document.getElementById('m-cat').value.trim(),
    emoji: document.getElementById('m-emoji').value.trim() || '📚',
    level: document.getElementById('m-level').value,
    duration: document.getElementById('m-dur').value.trim(),
    status: document.getElementById('m-status').value,
  };
  if (!data.title) return alert('Title required');
  try {
    if (id) {
      await apiFetch(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } else {
      await apiFetch('/courses', { method: 'POST', body: JSON.stringify(data) });
    }
    closeModal();
    const role = getUser().role;
    role === 'admin' ? renderAdminCourses() : renderInstructorCourses();
  } catch (err) { alert(err.message); }
}

async function deleteCourse(id) {
  if (!confirm('Delete this course?')) return;
  try {
    await apiFetch(`/courses/${id}`, { method: 'DELETE' });
    renderAdminCourses();
  } catch (err) { alert(err.message); }
}

// ═══════════════════════════════════════════════════════
//  ASSIGNMENTS
// ═══════════════════════════════════════════════════════
async function renderInstructorAssignments() {
  document.getElementById('topbar-actions').innerHTML =
    `<button class="btn btn-primary btn-sm" onclick="openAssignmentModal()">+ New Assignment</button>`;
  try {
    const assignments = await apiFetch('/assignments');
    setContent(`
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Assignment</th><th>Course</th><th>Due Date</th><th>Points</th><th>Actions</th></tr></thead>
            <tbody>
              ${assignments.length === 0
                ? `<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">No assignments yet</div></div></td></tr>`
                : assignments.map(a => `
                  <tr>
                    <td><div class="font-medium text-sm">${a.title}</div><div class="text-xs text-muted">${(a.description || '').slice(0, 60)}...</div></td>
                    <td class="text-sm">${a.course?.emoji || ''} ${a.course?.title || '—'}</td>
                    <td class="text-sm ${new Date(a.dueDate) < new Date() ? 'text-danger' : ''}">${fmt(a.dueDate)}</td>
                    <td class="text-sm font-medium">${a.points}</td>
                    <td><div class="flex gap-1">
                      <button class="btn btn-sm btn-outline" onclick="openAssignmentModal('${a._id}')">Edit</button>
                      <button class="btn btn-sm btn-danger" onclick="deleteAssignment('${a._id}')">Delete</button>
                    </div></td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`);
  } catch (err) { showError(err.message); }
}

async function openAssignmentModal(id) {
  const courses = await apiFetch('/courses?all=true');
  let a = null;
  if (id) { try { a = await apiFetch(`/assignments/${id}`); } catch {} }
  openModal(`
    <div class="modal-title">${a ? 'Edit' : 'New'} Assignment</div>
    <div class="form-group"><label class="form-label">Course</label>
      <select id="m-course" class="form-select">${courses.map(c => `<option value="${c._id}" ${a?.course?._id === c._id || a?.course === c._id ? 'selected' : ''}>${c.emoji} ${c.title}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label class="form-label">Title</label><input id="m-title" class="form-input" value="${a?.title || ''}" placeholder="Assignment title" /></div>
    <div class="form-group"><label class="form-label">Instructions</label><textarea id="m-desc" class="form-input" rows="4" placeholder="Detailed instructions...">${a?.description || ''}</textarea></div>
    <div class="grid-2" style="gap:10px">
      <div class="form-group"><label class="form-label">Due Date</label><input id="m-due" class="form-input" type="date" value="${a?.dueDate ? a.dueDate.slice(0, 10) : ''}" /></div>
      <div class="form-group"><label class="form-label">Points</label><input id="m-pts" class="form-input" type="number" value="${a?.points || 100}" /></div>
    </div>
    <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveAssignment('${id || ''}')">Save</button></div>
  `);
}

async function saveAssignment(id) {
  const data = {
    courseId: document.getElementById('m-course').value,
    course: document.getElementById('m-course').value,
    title: document.getElementById('m-title').value.trim(),
    description: document.getElementById('m-desc').value.trim(),
    dueDate: document.getElementById('m-due').value,
    points: parseInt(document.getElementById('m-pts').value) || 100,
  };
  if (!data.title) return alert('Title required');
  try {
    if (id) {
      await apiFetch(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } else {
      await apiFetch('/assignments', { method: 'POST', body: JSON.stringify(data) });
    }
    closeModal();
    renderInstructorAssignments();
  } catch (err) { alert(err.message); }
}

async function deleteAssignment(id) {
  if (!confirm('Delete this assignment?')) return;
  try {
    await apiFetch(`/assignments/${id}`, { method: 'DELETE' });
    renderInstructorAssignments();
  } catch (err) { alert(err.message); }
}

// ═══════════════════════════════════════════════════════
//  SUBMISSIONS (Instructor)
// ═══════════════════════════════════════════════════════
async function renderInstructorSubmissions() {
  try {
    const submissions = await apiFetch('/submissions');
    const pending = submissions.filter(s => s.grade === null);
    setContent(`
      ${pending.length > 0 ? `<div class="alert alert-info mb-2">⏳ ${pending.length} submission${pending.length !== 1 ? 's' : ''} waiting for grading.</div>` : ''}
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Assignment</th><th>Course</th><th>Submitted</th><th>Grade</th><th>Action</th></tr></thead>
            <tbody>
              ${submissions.length === 0
                ? `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">No submissions yet</div></div></td></tr>`
                : submissions.map(s => `
                  <tr>
                    <td><div class="flex items-center gap-2"><div class="avatar" style="width:26px;height:26px;font-size:11px">${(s.student?.name || '?')[0]}</div><span class="text-sm font-medium">${s.student?.name || '—'}</span></div></td>
                    <td class="text-sm">${s.assignment?.title || '—'}</td>
                    <td class="text-sm text-muted">${s.assignment?.course?.emoji || ''} ${s.assignment?.course?.title || '—'}</td>
                    <td class="text-sm text-muted">${fmt(s.createdAt)}</td>
                    <td>${s.grade !== null ? `<span class="badge ${s.grade >= 70 ? 'badge-green' : 'badge-red'}">${s.grade}/${s.assignment?.points || 100}</span>` : '<span class="badge badge-amber">Pending</span>'}</td>
                    <td><button class="btn btn-sm btn-outline" onclick="openGradeModal('${s._id}','${(s.student?.name || '').replace(/'/g,'')}','${(s.assignment?.title || '').replace(/'/g,'')}','${s.assignment?.points || 100}','${(s.text || '').replace(/'/g,'').replace(/\n/g,' ').slice(0,200)}','${s.grade || ''}','${(s.feedback || '').replace(/'/g,'')}')">Grade</button></td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`);
  } catch (err) { showError(err.message); }
}

function openGradeModal(id, student, assignment, points, text, grade, feedback) {
  openModal(`
    <div class="modal-title">Grade Submission</div>
    <div class="submission-row mb-2">
      <div class="text-sm font-medium">📝 ${assignment}</div>
      <div class="text-xs text-muted">Submitted by ${student}</div>
    </div>
    <div class="card mb-2" style="background:var(--surface2)">
      <div class="text-sm font-medium mb-1">Student's Answer</div>
      <div class="text-sm text-muted">${text || '(No text submitted)'}</div>
    </div>
    <div class="form-group"><label class="form-label">Grade (out of ${points})</label><input id="m-grade" class="form-input" type="number" min="0" max="${points}" value="${grade}" /></div>
    <div class="form-group"><label class="form-label">Feedback</label><textarea id="m-feedback" class="form-input" rows="3">${feedback}</textarea></div>
    <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveGrade('${id}')">Save Grade</button></div>
  `);
}

async function saveGrade(id) {
  const grade = parseInt(document.getElementById('m-grade').value);
  const feedback = document.getElementById('m-feedback').value.trim();
  if (isNaN(grade)) return alert('Enter a valid grade');
  try {
    await apiFetch(`/submissions/${id}/grade`, { method: 'PUT', body: JSON.stringify({ grade, feedback }) });
    closeModal();
    renderInstructorSubmissions();
  } catch (err) { alert(err.message); }
}

// ═══════════════════════════════════════════════════════
//  STUDENT — COURSES
// ═══════════════════════════════════════════════════════
async function renderStudentCourses() {
  try {
    const [courses, enrollments] = await Promise.all([
      apiFetch('/courses'),
      apiFetch('/enrollments/my'),
    ]);
    setContent(`
      <div class="grid-3">
        ${courses.map(c => {
          const enrolled = enrollments.find(e => e.course?._id === c._id || e.course === c._id);
          return `
            <div class="course-card">
              <div class="course-thumb">${c.emoji}</div>
              <div class="course-body">
                <div class="course-title">${c.title}</div>
                <div class="course-meta">${c.category} · ${c.duration} · By ${c.instructor?.name || '—'}</div>
                <div class="course-tags">${levelBadge(c.level)}</div>
                <div class="text-sm text-muted mb-2" style="font-size:12px;line-height:1.5">${(c.description || '').slice(0, 100)}...</div>
                ${enrolled
                  ? `<div class="mb-2">
                       <div class="flex justify-between text-xs text-muted mb-1"><span>Progress</span><span>${enrolled.progress}%</span></div>
                       <div class="progress-bar"><div class="progress-fill" style="width:${enrolled.progress}%"></div></div>
                     </div>
                     <div class="flex gap-1">
                       <button class="btn btn-sm btn-outline" style="flex:1" onclick="openProgressModal('${enrolled._id}','${enrolled.progress}')">Update Progress</button>
                       <button class="btn btn-sm btn-outline" style="flex:1" onclick="unenroll('${enrolled._id}')">Unenroll</button>
                     </div>`
                  : `<button class="btn btn-sm btn-primary btn-full" onclick="enroll('${c._id}')">Enroll Now →</button>`}
              </div>
            </div>`;
        }).join('')}
      </div>`);
  } catch (err) { showError(err.message); }
}

async function enroll(courseId) {
  try {
    await apiFetch('/enrollments', { method: 'POST', body: JSON.stringify({ courseId }) });
    renderStudentCourses();
  } catch (err) { alert(err.message); }
}

async function unenroll(enrollmentId) {
  if (!confirm('Unenroll from this course?')) return;
  try {
    await apiFetch(`/enrollments/${enrollmentId}`, { method: 'DELETE' });
    renderStudentCourses();
  } catch (err) { alert(err.message); }
}

function openProgressModal(enrollmentId, current) {
  openModal(`
    <div class="modal-title">Update Progress</div>
    <div class="text-sm text-muted mb-2">Current: ${current}%</div>
    <div class="form-group"><label class="form-label">New Progress (%)</label><input id="m-progress" class="form-input" type="number" min="0" max="100" value="${current}" /></div>
    <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveProgress('${enrollmentId}')">Save</button></div>
  `);
}

async function saveProgress(enrollmentId) {
  const progress = Math.min(100, Math.max(0, parseInt(document.getElementById('m-progress').value) || 0));
  try {
    await apiFetch(`/enrollments/${enrollmentId}`, { method: 'PUT', body: JSON.stringify({ progress }) });
    closeModal();
    renderStudentCourses();
  } catch (err) { alert(err.message); }
}

// ═══════════════════════════════════════════════════════
//  STUDENT — ASSIGNMENTS
// ═══════════════════════════════════════════════════════
async function renderStudentAssignments() {
  try {
    const [enrollments, mySubmissions] = await Promise.all([
      apiFetch('/enrollments/my'),
      apiFetch('/submissions/my'),
    ]);
    // Get assignments for all enrolled courses
    const courseIds = enrollments.map(e => e.course?._id || e.course);
    const allAssignments = (await Promise.all(courseIds.map(id => apiFetch(`/assignments/course/${id}`)))).flat();

    setContent(`
      <div style="display:flex;flex-direction:column;gap:12px;max-width:800px">
        ${allAssignments.length === 0
          ? '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">No assignments yet</div><div class="empty-state-sub">Enroll in a course to see assignments</div></div>'
          : allAssignments.map(a => {
              const sub = mySubmissions.find(s => s.assignment?._id === a._id || s.assignment === a._id);
              const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();
              return `
                <div class="assignment-card card">
                  <div class="flex justify-between items-center mb-2">
                    <div>
                      <div class="font-semibold">${a.title}</div>
                      <div class="text-xs text-muted mt-1">${a.course?.emoji || ''} ${a.course?.title || '—'} · ${a.points} pts</div>
                    </div>
                    <div class="flex" style="flex-direction:column;align-items:flex-end;gap:4px">
                      ${sub
                        ? `<span class="badge ${sub.grade !== null ? 'badge-green' : 'badge-amber'}">${sub.grade !== null ? `Graded: ${sub.grade}/${a.points}` : 'Submitted'}</span>`
                        : `<span class="badge ${isOverdue ? 'badge-red' : 'badge-gray'}">${isOverdue ? 'Overdue' : 'Pending'}</span>`}
                      <span class="text-xs text-muted">Due ${fmt(a.dueDate)}</span>
                    </div>
                  </div>
                  <div class="text-sm text-muted mb-2">${a.description || ''}</div>
                  ${sub
                    ? `<div class="submission-row">
                         <div class="text-xs font-medium text-muted mb-1">Your submission</div>
                         <div class="text-sm">${sub.text}</div>
                         ${sub.feedback ? `<div class="text-xs text-success mt-1">💬 ${sub.feedback}</div>` : ''}
                       </div>`
                    : `<button class="btn btn-sm btn-primary" onclick="openSubmitModal('${a._id}','${a.title.replace(/'/g,'')}')">Submit Assignment</button>`}
                </div>`;
            }).join('')}
      </div>`);
  } catch (err) { showError(err.message); }
}

function openSubmitModal(assignmentId, title) {
  openModal(`
    <div class="modal-title">Submit: ${title}</div>
    <div class="form-group"><label class="form-label">Your Answer / Notes</label><textarea id="m-text" class="form-input" rows="5" placeholder="Describe what you did, paste links, write your answer..."></textarea></div>
    <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitAssignment('${assignmentId}')">Submit</button></div>
  `);
}

async function submitAssignment(assignmentId) {
  const text = document.getElementById('m-text').value.trim();
  if (!text) return alert('Please write something before submitting');
  try {
    await apiFetch('/submissions', { method: 'POST', body: JSON.stringify({ assignmentId, text }) });
    closeModal();
    renderStudentAssignments();
  } catch (err) { alert(err.message); }
}

// ═══════════════════════════════════════════════════════
//  STUDENT — PROGRESS
// ═══════════════════════════════════════════════════════
async function renderStudentProgress() {
  try {
    const [enrollments, submissions] = await Promise.all([
      apiFetch('/enrollments/my'),
      apiFetch('/submissions/my'),
    ]);
    const graded = submissions.filter(s => s.grade !== null);
    const avgGrade = graded.length ? Math.round(graded.reduce((s, x) => s + x.grade, 0) / graded.length) : null;
    const avgProgress = enrollments.length ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length) : 0;

    setContent(`
      <div class="stats-grid mb-3">
        <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-label">Enrolled</div><div class="stat-value">${enrollments.length}</div></div>
        <div class="stat-card"><div class="stat-icon">📈</div><div class="stat-label">Avg Progress</div><div class="stat-value">${avgProgress}%</div></div>
        <div class="stat-card"><div class="stat-icon">📬</div><div class="stat-label">Submissions</div><div class="stat-value">${submissions.length}</div></div>
        <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-label">Avg Grade</div><div class="stat-value">${avgGrade !== null ? avgGrade + '%' : '—'}</div></div>
      </div>
      <div class="card" style="max-width:700px">
        <div class="card-header"><div class="card-title">📚 Course Progress</div></div>
        ${enrollments.length === 0
          ? '<div class="text-sm text-muted">Not enrolled in any courses yet.</div>'
          : enrollments.map(e => `
            <div class="mb-3 pb-3" style="border-bottom:1px solid var(--border)">
              <div class="flex items-center gap-2 mb-2">
                <span style="font-size:22px">${e.course?.emoji || '📚'}</span>
                <div style="flex:1">
                  <div class="font-medium">${e.course?.title || '—'}</div>
                  <div class="text-xs text-muted">${e.course?.level || ''} · ${e.course?.duration || ''}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${e.progress}%"></div></div>
                <span class="text-sm font-medium" style="min-width:36px">${e.progress}%</span>
              </div>
              <div class="text-xs text-muted mt-1">Enrolled ${fmt(e.createdAt)}</div>
            </div>`).join('')}
      </div>
      ${graded.length > 0 ? `
        <div class="card mt-2" style="max-width:700px">
          <div class="card-header"><div class="card-title">📊 Graded Submissions</div></div>
          ${graded.map(s => `
            <div class="flex justify-between items-center py-2" style="border-bottom:1px solid var(--border)">
              <div>
                <div class="text-sm font-medium">${s.assignment?.title || '—'}</div>
                ${s.feedback ? `<div class="text-xs text-success">💬 ${s.feedback}</div>` : ''}
              </div>
              <span class="badge ${s.grade >= 70 ? 'badge-green' : 'badge-red'}">${s.grade}/${s.assignment?.points || 100}</span>
            </div>`).join('')}
        </div>` : ''}
    `);
  } catch (err) { showError(err.message); }
}

// ═══════════════════════════════════════════════════════
//  ADMIN — REPORTS
// ═══════════════════════════════════════════════════════
async function renderAdminReports() {
  try {
    const [users, courses, enrollments, submissions] = await Promise.all([
      apiFetch('/users'),
      apiFetch('/courses?all=true'),
      apiFetch('/enrollments'),
      apiFetch('/submissions'),
    ]);
    setContent(`
      <div class="stats-grid mb-3">
        <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Students</div><div class="stat-value">${users.filter(u => u.role === 'student').length}</div></div>
        <div class="stat-card"><div class="stat-icon">👨‍🏫</div><div class="stat-label">Instructors</div><div class="stat-value">${users.filter(u => u.role === 'instructor').length}</div></div>
        <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-label">Total Enrollments</div><div class="stat-value">${enrollments.length}</div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">Graded Submissions</div><div class="stat-value">${submissions.filter(s => s.grade !== null).length}</div></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">📈 Course Performance</div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Course</th><th>Enrolled</th><th>Avg Progress</th><th>Submissions</th></tr></thead>
            <tbody>
              ${courses.map(c => {
                const enrolled = enrollments.filter(e => e.course?._id === c._id || e.course === c._id);
                const avgProg = enrolled.length ? Math.round(enrolled.reduce((s, e) => s + e.progress, 0) / enrolled.length) : 0;
                return `<tr>
                  <td><div class="flex items-center gap-2"><span style="font-size:18px">${c.emoji}</span><span class="font-medium text-sm">${c.title}</span></div></td>
                  <td class="text-sm">${enrolled.length}</td>
                  <td><div class="flex items-center gap-2"><div class="progress-bar" style="width:80px;flex-shrink:0"><div class="progress-fill" style="width:${avgProg}%"></div></div><span class="text-xs text-muted">${avgProg}%</span></div></td>
                  <td class="text-sm">${submissions.length}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`);
  } catch (err) { showError(err.message); }
}

// ═══════════════════════════════════════════════════════
//  ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════
async function renderAnnouncements() {
  const role = getUser().role;
  if (role !== 'student') {
    document.getElementById('topbar-actions').innerHTML =
      `<button class="btn btn-primary btn-sm" onclick="openAnnouncementModal()">+ New Announcement</button>`;
  }
  try {
    const announcements = await apiFetch('/announcements');
    setContent(`
      <div style="max-width:700px">
        ${announcements.length === 0
          ? '<div class="empty-state"><div class="empty-state-icon">📢</div><div class="empty-state-text">No announcements yet</div></div>'
          : announcements.map(a => `
            <div class="card mb-2" style="border-left:4px solid var(--brand)">
              <div class="flex justify-between items-center mb-1">
                <div class="font-semibold">${a.title}</div>
                ${role !== 'student' ? `<div class="flex gap-1">
                  <button class="btn btn-sm btn-outline" onclick="openAnnouncementModal('${a._id}','${a.title.replace(/'/g,'')}','${a.body.replace(/'/g,'').replace(/\n/g,' ')}')">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteAnnouncement('${a._id}')">Delete</button>
                </div>` : ''}
              </div>
              <div class="text-sm text-muted mb-1">${a.body}</div>
              <div class="text-xs text-muted">By ${a.author?.name || '—'} · ${fmt(a.createdAt)}</div>
            </div>`).join('')}
      </div>`);
  } catch (err) { showError(err.message); }
}

function openAnnouncementModal(id, title, body) {
  openModal(`
    <div class="modal-title">${id ? 'Edit' : 'New'} Announcement</div>
    <div class="form-group"><label class="form-label">Title</label><input id="m-title" class="form-input" value="${title || ''}" placeholder="Announcement title" /></div>
    <div class="form-group"><label class="form-label">Message</label><textarea id="m-body" class="form-input" rows="4" placeholder="Write your message...">${body || ''}</textarea></div>
    <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveAnnouncement('${id || ''}')">Post</button></div>
  `);
}

async function saveAnnouncement(id) {
  const data = {
    title: document.getElementById('m-title').value.trim(),
    body: document.getElementById('m-body').value.trim(),
  };
  if (!data.title || !data.body) return alert('Fill all fields');
  try {
    if (id) {
      await apiFetch(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } else {
      await apiFetch('/announcements', { method: 'POST', body: JSON.stringify(data) });
    }
    closeModal();
    renderAnnouncements();
  } catch (err) { alert(err.message); }
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete announcement?')) return;
  try {
    await apiFetch(`/announcements/${id}`, { method: 'DELETE' });
    renderAnnouncements();
  } catch (err) { alert(err.message); }
}

// ═══════════════════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════════════════
async function renderProfile() {
  const user = getUser();
  setContent(`
    <div style="max-width:560px">
      <div class="card mb-3">
        <div class="flex items-center gap-3 mb-3">
          <div class="avatar avatar-lg">${user.name[0]}</div>
          <div>
            <div class="font-semibold" style="font-size:18px">${user.name}</div>
            <div class="text-sm text-muted">${user.email}</div>
            <span class="badge ${user.role === 'admin' ? 'badge-red' : user.role === 'instructor' ? 'badge-blue' : 'badge-green'} mt-1">${user.role}</span>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title mb-2">Edit Profile</div>
        <div class="form-group"><label class="form-label">Full Name</label><input id="p-name" class="form-input" value="${user.name}" /></div>
        <div class="form-group"><label class="form-label">Email</label><input id="p-email" class="form-input" value="${user.email}" /></div>
        <div class="form-group"><label class="form-label">New Password <span class="text-muted">(leave blank to keep current)</span></label><input id="p-pw" class="form-input" type="password" placeholder="New password" /></div>
        <button class="btn btn-primary" onclick="saveProfile()">Save Changes</button>
        <div id="profile-msg" style="margin-top:8px;font-size:13px;display:none"></div>
      </div>
    </div>`);
}

async function saveProfile() {
  const name = document.getElementById('p-name').value.trim();
  const email = document.getElementById('p-email').value.trim();
  const pw = document.getElementById('p-pw').value;
  const msg = document.getElementById('profile-msg');
  // Profile update would need a PUT /api/auth/profile endpoint — good task for students to add!
  const user = getUser();
  user.name = name; user.email = email;
  setUser(user);
  document.getElementById('sidebar-user-name').textContent = name;
  document.getElementById('sidebar-user-email').textContent = email;
  document.getElementById('sidebar-avatar').textContent = name[0];
  msg.style.display = 'block';
  msg.style.color = 'var(--success)';
  msg.textContent = '✓ Profile updated locally. Ask your instructor how to persist this to the DB!';
  setTimeout(() => msg.style.display = 'none', 4000);
}

// ═══════════════════════════════════════════════════════
//  MODAL HELPERS
// ═══════════════════════════════════════════════════════
function openModal(html) {
  document.getElementById('modal-box').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function closeModalOnBg(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

// ═══════════════════════════════════════════════════════
//  BOOT — check for existing session on page load
// ═══════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  const token = getToken();
  const user = getUser();
  if (token && user) {
    launchApp();
  }
});
