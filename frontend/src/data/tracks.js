/* ===================================================================
   WAYPOINT — Mock Track Data
   All tracks, nodes, skills, quiz questions, and insights.
   Shape matches PRD API contracts so backend swap is seamless.
   =================================================================== */

// Node layout order (shared across all tracks — positions differ per view)
export const NODE_ORDER = ['f1', 'f2', 'f3', 'd1', 'd2', 'm1', 'm2', 'm3'];

// Edge definitions
export const EDGES = [
  ['f1', 'f2'], ['f2', 'f3'], ['f3', 'd1'],
  ['d1', 'd2'], ['d2', 'm1'], ['m1', 'm2'], ['m2', 'm3'],
];

// Mock paths for PathSelect screen
export const MOCK_PATHS = [
  {
    id: 'java-spring',
    name: 'Java Backend (Spring Boot)',
    desc: 'The enterprise standard. Focuses on heavy, scalable REST APIs using the Spring ecosystem.',
    shared: ['Java Syntax & OOP', 'Collections & Generics', 'Relational Databases'],
    unique: ['Spring Boot Auto-configuration', 'Hibernate/JPA ORM', 'Spring Security'],
  },
  {
    id: 'java-android',
    name: 'Java Android Development',
    desc: 'Mobile-first focus. Uses core Java but pivots entirely into the Android SDK and mobile lifecycles.',
    shared: ['Java Syntax & OOP', 'Collections & Generics', 'Basic SQLite'],
    unique: ['Android Activity Lifecycle', 'Jetpack Compose / XML', 'Mobile API consumption'],
  }
];

// Tree branch groupings
export const TREE_BRANCHES = [
  { id: 'foundations', label: 'Foundations', color: '#5B5FEF', children: ['f1', 'f2', 'f3'], defaultOpen: true },
  { id: 'core', label: 'Core Build', color: '#0EA5A4', children: ['d1', 'd2'], defaultOpen: false },
  { id: 'advanced', label: 'Advanced / Capstone', color: '#D97706', children: ['m1', 'm2', 'm3'], defaultOpen: false },
];

// ─── TRACKS ───
export const TRACKS = {
  ml: {
    id: 'ml',
    label: 'Machine Learning',
    status: 'active',
    nodeMap: {
      f1: { title: 'Python Basics', status: 'completed', match: 96, duration: '2 wks', stage: 'learn', resources: ['YouTube: Programming with Mosh', 'Course: Python for Everybody'] },
      f2: { title: 'Statistics 101', status: 'completed', match: 91, duration: '2 wks', stage: 'learn', resources: ['YouTube: StatQuest', 'Khan Academy: AP Statistics'] },
      f3: { title: 'SQL for Data', status: 'in_progress', match: 88, duration: '1.5 wks', stage: 'learn', resources: ['YouTube: FreeCodeCamp SQL', 'Course: SQLBolt'] },
      d1: { title: 'Pandas & NumPy', status: 'not_started', match: 93, duration: '2 wks', stage: 'build', resources: ['YouTube: Corey Schafer Pandas', 'Kaggle: Pandas Course'] },
      d2: { title: 'Data Visualization', status: 'not_started', match: 85, duration: '1 wk', stage: 'build', resources: ['YouTube: Sentdex Matplotlib', 'Course: DataCamp Viz'] },
      m1: { title: 'ML Fundamentals', status: 'not_started', match: 90, duration: '3 wks', stage: 'learn', resources: ['YouTube: Andrew Ng ML', 'Course: Fast.ai'] },
      m2: { title: 'Model Evaluation', status: 'not_started', match: 82, duration: '1.5 wks', stage: 'prove', resources: ['YouTube: StatQuest ML', 'Medium: Towards Data Science'] },
      m3: { title: 'Capstone Project', status: 'not_started', match: 97, duration: '2 wks', stage: 'prove', resources: ['Kaggle: Competitions', 'GitHub: ML Projects'] },
    },
    skillData: [
      { skill: 'Python', current: 78, target: 95 },
      { skill: 'Statistics', current: 82, target: 90 },
      { skill: 'SQL', current: 55, target: 88 },
      { skill: 'Data Viz', current: 30, target: 80 },
      { skill: 'Machine Learning', current: 12, target: 85 },
      { skill: 'Communication', current: 60, target: 75 },
    ],
    reasoning: {
      f1: { reason: 'Core language for data science — every tool after this needs solid Python fluency.', prereq: 'No prerequisites — this is your starting point.', time: 'Fits your 6 hrs/week pace in ~2 weeks.' },
      f2: { reason: 'Statistics is the backbone of every ML concept — understanding distributions, hypothesis testing, and correlation is non-negotiable.', prereq: 'Works alongside Python Basics.', time: 'Fits your 6 hrs/week pace in ~2 weeks.' },
      f3: { reason: 'Bridges your completed stats knowledge to real querying — required before touching messy datasets.', prereq: 'Builds on Statistics 101, which you finished last week.', time: 'Fits your 6 hrs/week pace in ~9 days.' },
      d1: { reason: 'The most-used toolkit for every project after this point.', prereq: 'Pairs well with SQL for Data.', time: 'Slightly heavier — plan 2.5 hrs on weekends.' },
      d2: { reason: 'Making data tell a story visually is what separates analysts from coders.', prereq: 'Uses Pandas & NumPy output directly.', time: 'Lightweight — fits in one week easily.' },
      m1: { reason: 'The core theory: supervised/unsupervised, regression, classification — everything builds on this.', prereq: 'Needs Statistics + Pandas fluency.', time: '3 weeks at your pace — heavier module.' },
      m2: { reason: 'Building a model is half the work — knowing if it\'s actually good is the other half.', prereq: 'Builds on ML Fundamentals.', time: '1.5 weeks — focused and practical.' },
      m3: { reason: 'Your capstone — ties together every skill above into one portfolio piece recruiters actually check.', prereq: 'Builds on ML Fundamentals + Model Evaluation.', time: 'Spread across 2 weeks, ~3 hrs/week.' },
    },
  },

  java: {
    id: 'java',
    label: 'Java Backend',
    status: 'active',
    nodeMap: {
      f1: { title: 'Java Syntax & OOP', status: 'in_progress', match: 90, duration: '2 wks', stage: 'learn' },
      f2: { title: 'Collections & Generics', status: 'not_started', match: 84, duration: '1.5 wks', stage: 'learn' },
      f3: { title: 'Exception Handling', status: 'not_started', match: 80, duration: '1 wk', stage: 'learn' },
      d1: { title: 'Spring Boot Basics', status: 'not_started', match: 92, duration: '2 wks', stage: 'build' },
      d2: { title: 'REST APIs with Spring', status: 'not_started', match: 89, duration: '1.5 wks', stage: 'build' },
      m1: { title: 'JPA & Hibernate', status: 'not_started', match: 86, duration: '2 wks', stage: 'build' },
      m2: { title: 'Testing with JUnit', status: 'not_started', match: 78, duration: '1 wk', stage: 'prove' },
      m3: { title: 'Capstone: Task Manager API', status: 'not_started', match: 95, duration: '2.5 wks', stage: 'prove' },
    },
    skillData: [
      { skill: 'Java Core', current: 22, target: 90 },
      { skill: 'OOP Design', current: 18, target: 85 },
      { skill: 'Spring Boot', current: 5, target: 80 },
      { skill: 'Databases/JPA', current: 10, target: 75 },
      { skill: 'Testing', current: 8, target: 70 },
      { skill: 'REST APIs', current: 12, target: 85 },
    ],
    reasoning: {
      f1: { reason: 'Every later node assumes solid OOP fluency — this is the highest-leverage starting point.', prereq: 'No prerequisites — this is your entry point.', time: 'Fits your 6 hrs/week pace in ~2 weeks.' },
      f2: { reason: 'Collections (ArrayList, HashMap, etc.) are used in every real project — they are non-negotiable core knowledge.', prereq: 'Needs Java Syntax & OOP at a solid level.', time: 'About 1.5 weeks at your pace.' },
      f3: { reason: 'Proper error handling separates hobby code from production code.', prereq: 'Builds on Collections & Generics.', time: 'Lightweight — just 1 week.' },
      d1: { reason: 'Spring Boot is the industry-standard framework for almost every Java backend role posted today.', prereq: 'Needs Java Syntax & OOP at a solid level.', time: 'Plan 2.5 hrs on weekends.' },
      d2: { reason: 'REST is how every modern backend communicates — this is where your Java skills become employable.', prereq: 'Builds directly on Spring Boot Basics.', time: 'About 1.5 weeks.' },
      m1: { reason: 'JPA/Hibernate is how Java talks to databases — essential for any backend role.', prereq: 'Needs Spring Boot + SQL understanding.', time: 'A heavier module — 2 weeks.' },
      m2: { reason: 'Writing tests proves you write reliable code — recruiters check for this.', prereq: 'Can run alongside any build phase module.', time: 'Just 1 week — focused.' },
      m3: { reason: 'Your capstone — a real REST API recruiters can actually click through.', prereq: 'Builds on Spring Boot + REST APIs + JPA.', time: 'Spread across 2.5 weeks.' },
    },
  },

  python: {
    id: 'python',
    label: 'Python Foundations',
    status: 'completed',
    nodeMap: {
      f1: { title: 'Python Syntax', status: 'completed', match: 98, duration: '1 wk', stage: 'learn', resources: ['YouTube: Programming with Mosh', 'Course: Python for Everybody'] },
      f2: { title: 'Functions & Modules', status: 'completed', match: 97, duration: '1 wk', stage: 'learn', resources: ['YouTube: Corey Schafer', 'Docs: Python Official'] },
      f3: { title: 'File Handling', status: 'completed', match: 95, duration: '0.5 wk', stage: 'learn', resources: ['YouTube: Sentdex', 'Course: Python Data'] },
      d1: { title: 'OOP in Python', status: 'completed', match: 96, duration: '1 wk', stage: 'build', resources: ['YouTube: Corey Schafer OOP', 'RealPython: OOP Guide'] },
      d2: { title: 'Error Handling', status: 'completed', match: 94, duration: '0.5 wk', stage: 'build', resources: ['YouTube: Socratica', 'Docs: Exceptions'] },
      m1: { title: 'Working with APIs', status: 'completed', match: 93, duration: '1 wk', stage: 'build', resources: ['YouTube: Tech With Tim', 'Course: APIs for Beginners'] },
      m2: { title: 'Testing Basics', status: 'completed', match: 91, duration: '0.5 wk', stage: 'prove', resources: ['YouTube: Corey Schafer Pytest', 'Docs: unittest'] },
      m3: { title: 'Capstone: CLI Tool', status: 'completed', match: 99, duration: '1 wk', stage: 'prove', resources: ['RealPython: Click CLI', 'GitHub: Typer Examples'] },
    },
    skillData: [
      { skill: 'Syntax', current: 96, target: 95 },
      { skill: 'Functions', current: 94, target: 90 },
      { skill: 'OOP', current: 90, target: 85 },
      { skill: 'File I/O', current: 92, target: 85 },
      { skill: 'Testing', current: 88, target: 80 },
      { skill: 'APIs', current: 91, target: 85 },
    ],
    reasoning: {},
  },


  mern: {
    id: 'mern',
    label: 'MERN Stack',
    status: 'active',
    nodeMap: {
      f1: { title: 'HTML/CSS Deep Dive', status: 'completed', match: 94, duration: '1 wk', stage: 'learn' },
      f2: { title: 'JavaScript ES6+', status: 'in_progress', match: 92, duration: '2 wks', stage: 'learn' },
      f3: { title: 'React Fundamentals', status: 'not_started', match: 90, duration: '2 wks', stage: 'learn' },
      d1: { title: 'Node.js & Express', status: 'not_started', match: 88, duration: '2 wks', stage: 'build' },
      d2: { title: 'MongoDB & Mongoose', status: 'not_started', match: 85, duration: '1.5 wks', stage: 'build' },
      m1: { title: 'Auth & Security', status: 'not_started', match: 83, duration: '1 wk', stage: 'build' },
      m2: { title: 'Deployment & DevOps', status: 'not_started', match: 79, duration: '1 wk', stage: 'prove' },
      m3: { title: 'Capstone: Social App', status: 'not_started', match: 96, duration: '3 wks', stage: 'prove' },
    },
    skillData: [
      { skill: 'HTML/CSS', current: 75, target: 85 },
      { skill: 'JavaScript', current: 45, target: 90 },
      { skill: 'React', current: 10, target: 85 },
      { skill: 'Node.js', current: 8, target: 80 },
      { skill: 'MongoDB', current: 5, target: 75 },
      { skill: 'DevOps', current: 3, target: 60 },
    ],
    reasoning: {
      f1: { reason: 'Strong HTML/CSS is the canvas everything renders on — rushing past this shows in every project.', prereq: 'No prerequisites.', time: '1 week — you have a head start here.' },
      f2: { reason: 'Modern JS (destructuring, async/await, modules) is the language of React AND Node — both depend on this.', prereq: 'HTML/CSS should be solid.', time: '2 weeks at your pace.' },
      f3: { reason: 'React is the "M" in MERN that you\'ll spend most of your career in — component thinking changes everything.', prereq: 'Needs strong JavaScript ES6+.', time: '2 weeks — take it steady.' },
      d1: { reason: 'Node.js + Express gives you the backend half of full-stack — same language, different runtime.', prereq: 'JavaScript ES6+ must be solid.', time: '2 weeks.' },
      d2: { reason: 'MongoDB is the database of choice for MERN — document-based, pairs naturally with JS objects.', prereq: 'Node.js basics needed.', time: '1.5 weeks.' },
      m1: { reason: 'No production app ships without auth — JWT, sessions, password hashing are table-stakes knowledge.', prereq: 'Express + MongoDB.', time: '1 week — focused module.' },
      m2: { reason: 'Getting code from localhost to production is the final skill that makes you employable.', prereq: 'Full stack should be working.', time: '1 week — Docker + hosting basics.' },
      m3: { reason: 'Your capstone — a real full-stack app with auth, CRUD, real-time features that lives on a public URL.', prereq: 'All previous modules.', time: '3 weeks — your portfolio centerpiece.' },
    },
  },

  devops: {
    id: 'devops',
    label: 'DevOps Engineering',
    status: 'active',
    nodeMap: {
      f1: { title: 'Linux Fundamentals', status: 'not_started', match: 88, duration: '2 wks', stage: 'learn' },
      f2: { title: 'Networking Basics', status: 'not_started', match: 82, duration: '1.5 wks', stage: 'learn' },
      f3: { title: 'Shell Scripting', status: 'not_started', match: 85, duration: '1 wk', stage: 'learn' },
      d1: { title: 'Docker & Containers', status: 'not_started', match: 93, duration: '2 wks', stage: 'build' },
      d2: { title: 'CI/CD Pipelines', status: 'not_started', match: 90, duration: '1.5 wks', stage: 'build' },
      m1: { title: 'Kubernetes Basics', status: 'not_started', match: 87, duration: '3 wks', stage: 'build' },
      m2: { title: 'Monitoring & Logging', status: 'not_started', match: 80, duration: '1 wk', stage: 'prove' },
      m3: { title: 'Capstone: Deploy Pipeline', status: 'not_started', match: 95, duration: '2 wks', stage: 'prove' },
    },
    skillData: [
      { skill: 'Linux', current: 15, target: 85 },
      { skill: 'Networking', current: 10, target: 75 },
      { skill: 'Docker', current: 5, target: 90 },
      { skill: 'CI/CD', current: 3, target: 80 },
      { skill: 'Kubernetes', current: 0, target: 75 },
      { skill: 'Monitoring', current: 2, target: 70 },
    ],
    reasoning: {
      f1: { reason: 'Every server, container, and pipeline runs on Linux — this is non-negotiable.', prereq: 'None.', time: '2 weeks — take your time with the terminal.' },
      f2: { reason: 'TCP/IP, DNS, ports, firewalls — you can\'t debug deployments without this.', prereq: 'Linux familiarity helps.', time: '1.5 weeks.' },
      f3: { reason: 'Automation starts with scripting — Bash is the glue of DevOps workflows.', prereq: 'Linux Fundamentals.', time: '1 week — focused and practical.' },
    },
  },
};

// ─── QUIZ QUESTIONS BANK ───
// Questions are now dynamically fetched from the backend (Supabase `quiz_questions` table)
export const QUIZ_QUESTIONS = {};

// ─── AI INSIGHTS ───
export const INSIGHTS = [
  { icon: '🚀', text: "You're finishing nodes 20% faster than similar learners.", action: 'Add a stretch goal', type: 'pace' },
  { icon: '🔥', text: '12-day streak — your longest yet. Keep the chain going today.', action: "Do today's task", type: 'streak' },
  { icon: '🧠', text: 'You scored low on the Statistics quiz — a quick refresher is queued.', action: 'Review with AI', type: 'review' },
];

// ─── SUPPORTED ROLES LIST ───
export const SUPPORTED_ROLES = [
  { id: 'ml', label: 'Machine Learning', icon: '🤖' },
  { id: 'java', label: 'Java Backend', icon: '☕' },
  { id: 'mern', label: 'MERN Stack', icon: '⚛️' },
  { id: 'devops', label: 'DevOps Engineering', icon: '🔧' },
  { id: 'cloud', label: 'Cloud Engineering', icon: '☁️' },
  { id: 'uiux', label: 'UI/UX Design', icon: '🎨' },
  { id: 'data', label: 'Data Analytics', icon: '📊' },
  { id: 'cyber', label: 'Cybersecurity', icon: '🛡️' },
];

// ─── DEMO STEPS ───
export const DEMO_STEPS = [
  { screen: 'landing', caption: "1/14 — Landing page: pitch ka pehla impression, 'evidence-based readiness' angle turant clear hota hai." },
  { screen: 'signup', caption: '2/14 — Sign up: naya user account banata hai (Google ya email/password).' },
  { screen: 'onboarding', caption: '3/14 — Onboarding (Hybrid): target role/experience/time ek quick form se, phir chhoti chat se learning style.' },
  { screen: 'onboarding', caption: '4/14 — Form + chat se profile extract karke ek editable summary card dikhata hai.' },
  { screen: 'skillcheck', quizSubmitted: false, caption: '5/14 — Roadmap dene se pehle ek quick quiz — self-declared skills ko verify karta hai, sirf trust nahi karta.' },
  { screen: 'skillcheck', quizSubmitted: true, caption: '6/14 — Result: ek Readiness Score aur kaunse skills verified/weak hain — evidence ke basis pe, guess ke basis pe nahi.' },
  { screen: 'pathselect', caption: '7/14 — Goal broad ho to AI 2 valid career paths suggest karta hai — user ek choose karta hai.' },
  { screen: 'roadmap', view: 'flow', activeTrackId: 'ml', sidebarOpen: false, nodeId: null, caption: "8/14 — Roadmap 'Flow view': sab nodes shuru se hi open hain — koi locking nahi, bas ek 'Suggested next' badge guide karta hai." },
  { screen: 'roadmap', view: 'flow', activeTrackId: 'ml', sidebarOpen: true, nodeId: 'f3', caption: '9/14 — Kisi bhi node pe click karo (aage ka bhi) — AI panel khulta hai reasoning ke saath.' },
  { screen: 'roadmap', view: 'flow', activeTrackId: 'ml', sidebarOpen: true, nodeId: 'f3', toastMsg: 'Got it — inserting a quick review node before your next step. Roadmap updated based on your progress ✨', caption: '10/14 — Sidebar me feedback bhi de sakte ho (Easy/Too hard/Skip) — isi se Adaptive Feedback Loop trigger hota hai, sirf future nodes badalte hain.' },
  { screen: 'roadmap', view: 'tree', activeTrackId: 'ml', sidebarOpen: false, nodeId: null, caption: "11/14 — 'Modules view': wahi roadmap category-wise modules me, expand/collapse ke saath." },
  { screen: 'roadmap', view: 'tree', activeTrackId: 'java', sidebarOpen: false, nodeId: null, caption: "12/14 — Global Track Selector se switch karo — 'Java Backend' apna alag, independent roadmap hai, ML wala touch nahi hota." },
  { screen: 'dashboard', activeTrackId: 'java', sidebarOpen: false, nodeId: null, caption: '13/14 — Dashboard bhi turant selected track pe switch ho jaata hai — readiness, radar, sab Java ke liye.' },
  { screen: 'dashboard', activeTrackId: 'ml', sidebarOpen: false, nodeId: null, caption: "14/14 — Wapas ML pe switch karo — Selector 'Active' aur 'Completed' tracks alag group me dikhata hai (Python Foundations 100% ho chuka hai)." },
];



// ─── HELPER FUNCTIONS ───

/** Calculate completion % for a track */
export function trackCompletionPct(track) {
  const vals = Object.values(track.nodeMap);
  const done = vals.filter(n => n.status === 'completed').length;
  return Math.round((done / vals.length) * 100);
}

/** Calculate readiness % for a track */
export function trackReadinessPct(track) {
  return Math.round(
    (track.skillData.reduce((sum, s) => sum + s.current / s.target, 0) / track.skillData.length) * 100
  );
}

/** Count high-priority gaps */
export function trackHighPriorityGaps(track) {
  return track.skillData.filter(s => s.current / s.target < 0.5).length;
}

/** Count verified skills */
export function trackVerifiedCount(track) {
  return track.skillData.filter(s => s.current / s.target >= 0.75).length;
}

/** Get the suggested next node id (highest-priority not_started) */
export function suggestedNextId(track) {
  return NODE_ORDER.find(id => track.nodeMap[id].status === 'not_started') || null;
}

/** Match-score → Badge variant / semantic tone (see components/ui/badge) */
export function matchTone(m) {
  if (m >= 90) return 'success';
  if (m >= 70) return 'accent';
  return 'warning';
}

/** Match-score → raw hex (for SVG strokes / inline styles that can't use classes) */
export function matchColor(m) {
  if (m >= 90) return '#0ea5a4';
  if (m >= 70) return '#5b5fef';
  return '#d97706';
}

/** Node status → display label + Tailwind class descriptors */
export function statusInfo(status) {
  switch (status) {
    case 'completed':
      return { label: 'Completed', variant: 'success', dot: 'bg-success', ring: 'ring-success/30' };
    case 'in_progress':
      return { label: 'In Progress', variant: 'accent', dot: 'bg-primary', ring: 'ring-primary/30' };
    default:
      return { label: 'Not Started', variant: 'secondary', dot: 'bg-muted-foreground/40', ring: 'ring-border' };
  }
}

/** Learn / Build / Prove stage → label + Badge variant */
export function stageInfo(stage) {
  switch (stage) {
    case 'learn': return { label: 'LEARN', variant: 'accent' };
    case 'build': return { label: 'BUILD', variant: 'success' };
    case 'prove': return { label: 'PROVE', variant: 'warning' };
    default: return { label: 'LEARN', variant: 'accent' };
  }
}

/** Generate mock activity heatmap data (last 90 days) */
export function generateHeatmapData() {
  const data = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const active = Math.random() > 0.35;
    const intensity = active ? Math.floor(Math.random() * 4) + 1 : 0; // 0-4 scale
    data.push({
      date: date.toISOString().split('T')[0],
      active,
      intensity,
    });
  }
  return data;
}

/** Adaptive feedback messages */
export const FEEDBACK_MESSAGES = {
  easy: "Nice pace — we'll compress the easier upcoming basics for you. Roadmap updated based on your progress ✨",
  medium: "Pace optimized — we'll balance the upcoming content for you. Roadmap updated based on your progress ✨",
  hard: 'Got it — inserting a quick review node before your next step. Roadmap updated based on your progress ✨',
  skip: 'Skipping this — re-ranking your remaining path around it. Roadmap updated based on your progress ✨',
};

// ─── CAREER SIMULATION (What-if) HELPERS ───

/** Parse a duration label like "2 wks" / "1.5 wks" / "0.5 wk" → number of weeks */
export function parseWeeks(label) {
  if (!label) return 0;
  const m = String(label).match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

/** Sum of content-weeks still remaining (nodes not yet completed) */
export function remainingContentWeeks(track) {
  return Object.values(track.nodeMap)
    .filter((n) => n.status !== 'completed')
    .reduce((sum, n) => sum + parseWeeks(n.duration), 0);
}

/**
 * Estimate calendar weeks to job-ready given a weekly-hours budget.
 * Content is scoped for `baseline` hrs/week; more hours compresses the timeline.
 */
export function estimatedWeeksToGoal(track, weeklyHours, baseline = 6) {
  const content = remainingContentWeeks(track);
  if (weeklyHours <= 0) return Infinity;
  return Math.max(1, Math.round(content * (baseline / weeklyHours)));
}

/**
 * Project readiness % after committing `weeklyHours` for `horizonWeeks`.
 * Closes the current→target gap proportionally to effort delivered vs effort needed.
 */
export function projectedReadiness(track, weeklyHours, horizonWeeks, baseline = 6) {
  const current = trackReadinessPct(track);
  const needed = estimatedWeeksToGoal(track, baseline, baseline); // weeks at baseline
  if (!isFinite(needed) || needed <= 0) return 100;
  const delivered = (weeklyHours / baseline) * horizonWeeks;
  const progress = Math.min(1, delivered / needed);
  return Math.min(100, Math.round(current + (100 - current) * progress));
}

/** Skill gaps sorted largest-first (for the What-if re-ranked list) */
export function rankedGaps(track) {
  return [...track.skillData]
    .map((s) => ({ ...s, gap: Math.max(0, s.target - s.current) }))
    .sort((a, b) => b.gap - a.gap);
}

/** Scale a duration label based on simulated weekly hours */
export function scaleDuration(durationStr, baselineHours, simulatedHours) {
  if (!durationStr || !simulatedHours || baselineHours === simulatedHours) return durationStr;
  const m = String(durationStr).match(/([\d.]+)\s*(wk|wks|week|weeks)/i);
  if (m) {
    const wks = parseFloat(m[1]);
    const scaled = wks * (baselineHours / simulatedHours);
    const formatted = parseFloat(scaled.toFixed(1));
    return `${formatted} ${m[2]}`;
  }
  return durationStr;
}
