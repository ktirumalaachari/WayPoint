/* ===================================================================
   WAYPOINT — API layer
   The single seam between the frontend and the backend. Two implementations
   with IDENTICAL signatures and return shapes:
     • mock — offline hardcoded data (default; a demo can never break)
     • real — fetch() calls to the FastAPI backend
   Which one runs is decided by VITE_USE_MOCK (see waypoint-app/.env.example):
     VITE_USE_MOCK=true  (or unset)  → mock   ← default, safe for demos
     VITE_USE_MOCK=false             → real   ← calls VITE_API_BASE_URL
   Because both objects expose the same shape, NO other file changes when we
   flip the flag. Contract: docs/backend/API-Contract.md
   =================================================================== */

// ─── Config ───
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'; // default → mock
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'waypoint-token';

// ─── Real HTTP helper ───
// Prefixes the base URL, sends JSON, attaches the bearer token if we have one,
// and normalizes errors into a thrown Error the UI can surface.
async function http(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Network error — could not reach the server. Check your connection.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    
    /* non-JSON / empty response — leave data null */
  }

  if (!res.ok || (data && data.success === false)) {
    // FastAPI wraps HTTPException payloads in `detail`
    const detail = data?.detail;
    const detailMsg = typeof detail === 'string' ? detail : detail?.error?.message;
    const msg = data?.error?.message || data?.message || detailMsg || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ─── Real implementation (matches docs/backend/API-Contract.md) ───
// Persist the bearer token returned by login/signup so subsequent calls are authed.
function persistToken(res) {
  if (res?.token && typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, res.token);
  }
  return res;
}

const real = {
  login: (email, password) =>
    http('/api/auth/login', { method: 'POST', body: { email, password } }).then(persistToken),
  signup: (email, password, name) =>
    http('/api/auth/signup', { method: 'POST', body: { email, password, name } }).then(persistToken),
  googleAuth: (email, name) =>
    http('/api/auth/google', { method: 'POST', body: { email, name } }).then(persistToken),
  forgotPassword: (email) =>
    http('/api/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (email, otp, newPassword) =>
    http('/api/auth/reset-password', { method: 'POST', body: { email, otp, new_password: newPassword } }),
  submitOnboarding: (profileData) =>
    http('/api/onboarding/confirm', { method: 'POST', body: profileData }),
  onboardingChat: (messages, roleId) =>
    http('/api/onboarding/chat', { method: 'POST', body: { role_id: roleId, messages } }),
  getQuiz: (roleId, skillLevel = 'beginner', quizType = 'initial') =>
    http(`/api/assessment/quiz?target_role=${encodeURIComponent(roleId)}&skill_level=${encodeURIComponent(skillLevel)}&quiz_type=${encodeURIComponent(quizType)}`),
  submitQuiz: (roleId, answers, quizType = 'initial') =>
    http('/api/assessment/submit', { method: 'POST', body: { target_role: roleId, answers, quiz_type: quizType } }),
  getRoadmaps: () => http('/api/roadmaps/list'),
  generateRoadmap: (roleId) =>
    http('/api/roadmap/generate', { method: 'POST', body: { target_role: roleId } }),
  updateNodeStatus: (trackId, nodeId, status) =>
    http(`/api/roadmap/${trackId}/nodes/${nodeId}`, { method: 'PATCH', body: { status } }),
  updateModuleStatus: (trackId, nodeId, moduleIndex, status) =>
    http(`/api/roadmap/${trackId}/nodes/${nodeId}/modules`, { method: 'PATCH', body: { module_index: moduleIndex, status } }),
  updateAllModulesStatus: (trackId, nodeId, status) =>
    http(`/api/roadmap/${trackId}/nodes/${nodeId}/modules/all`, { method: 'PATCH', body: { status } }),
  chatWithNode: (trackId, nodeId, query) =>
    http(`/api/roadmap/${trackId}/nodes/${nodeId}/chat`, { method: 'POST', body: { query } }),
  adaptRoadmap: (trackId, nodeId, feedback) =>
    http(`/api/roadmap/${trackId}/nodes/${nodeId}/adapt`, { method: 'POST', body: { feedback } }),
  deleteRoadmap: (trackId) =>
    http(`/api/roadmap/${trackId}`, { method: 'DELETE' }),
  generalChat: (messages) =>
    http('/api/chat/general', { method: 'POST', body: { messages } }),
  getUserProfile: () => http('/api/user/profile'),
  updateUserProfile: (profileData) =>
    http('/api/user/profile', { method: 'PATCH', body: profileData }),
};


// The one export the app consumes. Mock has been completely removed to enforce separation of concerns.
export const api = real;

// Lets logout drop the stored bearer token.
export function clearAuthToken() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
}

// ─── Route-guard helpers ───
// Auth is only enforced when talking to a real backend. In mock/demo mode the
// whole app stays open so a live demo can never get stuck behind a login wall.
export const AUTH_ENFORCED = !USE_MOCK;
export function hasAuthToken() {
  return typeof localStorage !== 'undefined' && !!localStorage.getItem(TOKEN_KEY);
}
