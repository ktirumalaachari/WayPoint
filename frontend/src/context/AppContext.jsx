/* ===================================================================
   WAYPOINT — Global App Context
   Centralizes all state: theme, active track, user profile, progress.
   Every screen reads from here so the Global Track Selector updates
   Roadmap, Radar, Dashboard, and Sidebar simultaneously.
   =================================================================== */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect, 
} from 'react';
import { toast as sonnerToast } from 'sonner';
import { api, clearAuthToken, AUTH_ENFORCED, hasAuthToken } from '../services/api';
import { FEEDBACK_MESSAGES } from '../data/tracks';

// Isolated for component testing

const AppContext = createContext(null);

// ─── Migration helper ───
// Converts old `syllabus: ["string"]` to new `modules: [{title, status}]`
// Runs silently on load — zero data loss, backward-compatible.
function migrateNodeMap(nodeMap) {
  if (!nodeMap) return {};
  const migrated = {};
  for (const [key, node] of Object.entries(nodeMap)) {
    if (node.syllabus && !node.modules) {
      migrated[key] = {
        ...node,
        modules: node.syllabus.map((title) => ({ title, status: node.status === 'completed' ? 'completed' : 'not_started' })),
      };
      delete migrated[key].syllabus;
    } else if (!node.modules || node.modules.length === 0) {
      // Fallback: generate default modules if missing completely
      const defaultStatus = node.status === 'completed' ? 'completed' : 'not_started';
      migrated[key] = {
        ...node,
        modules: [
          { title: `${node.title || 'Topic'} - Fundamentals`, status: defaultStatus },
          { title: `${node.title || 'Topic'} - Practice`, status: defaultStatus },
          { title: `${node.title || 'Topic'} - Applied`, status: defaultStatus }
        ]
      };
    } else {
      let finalModules = node.modules;
      if (!Array.isArray(finalModules)) {
        // If LLM returned an object/dict instead of an array, extract values
        finalModules = typeof finalModules === 'object' ? Object.values(finalModules) : [];
      }
      
      // Enforce: if parent is completed, all modules must be completed
      if (node.status === 'completed') {
        finalModules = finalModules.map(m => ({ ...m, status: 'completed' }));
      }
      
      migrated[key] = { ...node, modules: finalModules };
    }
  }
  return migrated;
}

export function AppProvider({ children }) {
  // ─── Theme (shadcn .dark class, light-first) ───
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('waypoint-theme');
      if (stored === 'light' || stored === 'dark') return stored;
      // Default to light theme on first visit
      return 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    localStorage.setItem('waypoint-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // ─── Demo-safety mode (?demo=1 or ⌘K toggle) ───
  const [demoMode, setDemoMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('demo') === '1';
    }
    return false;
  });

  // ─── Tracks (fetched from API) ───
  const [tracks, setTracks] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('waypoint-strict-cache');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const migratedTracks = {};
          for (const [key, track] of Object.entries(parsed)) {
            migratedTracks[key] = {
              ...track,
              nodeMap: migrateNodeMap(track.nodeMap)
            };
          }
          return migratedTracks;
        } catch {
          // Ignore invalid cached JSON
        }
      }
    }
    return {};
  });

  // ─── Active Track ───
  const [activeTrackId, setActiveTrackId] = useState(() => {
    return localStorage.getItem('waypoint-active-track') || null;
  });

  useEffect(() => {
    localStorage.setItem('waypoint-active-track', activeTrackId);
  }, [activeTrackId]);

  useEffect(() => {
    if (Object.keys(tracks).length > 0) {
      localStorage.setItem('waypoint-strict-cache', JSON.stringify(tracks));
    }
  }, [tracks]);

  const [isLoading, setIsLoading] = useState(true);

  const [userProfile, setUserProfile] = useState({
    id: 'user-001',
    name: 'User',
    email: 'user@example.com',
    targetRole: 'Machine Learning Engineer',
    skillLevel: 'beginner',
    weeklyTimeHours: 6,
    learningStyle: 'project-first',
    pastExperience: 'Basic Python knowledge',
    isOnboarded: false,
    stats: {
      xp: 0,
      streak: 0
    },
    heatmapData: []
  });

  useEffect(() => {
    async function loadInitialData() {
      if (AUTH_ENFORCED && !hasAuthToken()) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [tracksRes, profileRes] = await Promise.all([
          api.getRoadmaps(),
          api.getUserProfile().catch(() => null) // Allow to fail gracefully if not authed
        ]);
        
        if (tracksRes && tracksRes.success) {
          setTracks((prev) => {
            const newTracks = {};
            for (const key of Object.keys(tracksRes.data)) {
              const incoming = tracksRes.data[key];
              // Apply migration on incoming data
              const migratedNodeMap = migrateNodeMap(incoming.nodeMap);
              if (!prev[key]) {
                newTracks[key] = { ...incoming, nodeMap: migratedNodeMap };
              } else {
                newTracks[key] = {
                  ...prev[key],
                  ...incoming,
                  nodeMap: { ...(prev[key].nodeMap || {}), ...migratedNodeMap }
                };
              }
            }
            return newTracks;
          });
          const currentTrack = localStorage.getItem('waypoint-active-track') || 'ml';
          if (Object.keys(tracksRes.data).length > 0 && !tracksRes.data[currentTrack]) {
            setActiveTrackId(Object.keys(tracksRes.data)[0]);
          }
        }
        if (profileRes && profileRes.success) {
          setUserProfile(profileRes.profile);
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const generateAndLoadRoadmap = useCallback(async (roleId) => {
    try {
      const res = await api.generateRoadmap(roleId);
      if (res.success && res.roadmap) {
        const migratedNodeMap = migrateNodeMap(res.roadmap.nodeMap);
        const roadmap = { ...res.roadmap, nodeMap: migratedNodeMap };
        setTracks((prev) => ({ ...prev, [roleId]: roadmap }));
        return roadmap;
      }
    } catch (err) {
      console.error('Failed to generate roadmap', err);
    }
    return null;
  }, []);



  // Re-fetch all tracks from the API and update state.
  // Called after quiz submission so Dashboard reflects updated skill levels.
  const refreshTracks = useCallback(async () => {
    try {
      const res = await api.getRoadmaps();
      if (res && res.success) {
        setTracks((prev) => {
          const newTracks = {};
          for (const key of Object.keys(res.data)) {
            const incoming = res.data[key];
            const migratedNodeMap = migrateNodeMap(incoming.nodeMap);
            if (!prev[key]) {
              newTracks[key] = { ...incoming, nodeMap: migratedNodeMap };
            } else {
              newTracks[key] = {
                ...prev[key],
                ...incoming,
                nodeMap: { ...(prev[key].nodeMap || {}), ...migratedNodeMap }
              };
            }
          }
          return newTracks;
        });
      }
    } catch (err) {
      console.error('Failed to refresh tracks', err);
    }
  }, []);

  // ─── Reload after login: re-fetch all user data once token is set ───
  const reloadAfterLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tracksRes, profileRes] = await Promise.all([
        api.getRoadmaps(),
        api.getUserProfile().catch(() => null)
      ]);
      if (tracksRes && tracksRes.success) {
        const newTracks = {};
        for (const key of Object.keys(tracksRes.data)) {
          const incoming = tracksRes.data[key];
          newTracks[key] = { ...incoming, nodeMap: migrateNodeMap(incoming.nodeMap) };
        }
        setTracks(newTracks);
        // Set active track to first real track, not hardcoded 'ml'
        const keys = Object.keys(tracksRes.data);
        if (keys.length > 0) {
          setActiveTrackId(keys[0]);
        }
      }
      if (profileRes && profileRes.success) {
        setUserProfile(profileRes.profile);
      }
    } catch (err) {
      console.error('Failed to reload data after login', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const activeTrack = tracks[activeTrackId] || null;

  const deleteTrack = useCallback(async (trackId) => {
    try {
      const res = await api.deleteRoadmap(trackId);
      if (res.success) {
        const remainingIds = Object.keys(tracks).filter(id => id !== trackId);
        setTracks((prev) => {
          const updated = { ...prev };
          delete updated[trackId];
          return updated;
        });
        if (activeTrackId === trackId) {
          setActiveTrackId(remainingIds.length > 0 ? remainingIds[0] : null);
        }
        sonnerToast.success('Track deleted successfully');
        return true;
      }
    } catch (err) {
      console.error('Failed to delete roadmap', err);
      sonnerToast.error('Failed to delete track');
    }
    return false;
  }, [activeTrackId, tracks]);



  // ─── Sidebar State ───
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const openNode = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
    setSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    // Keep selectedNodeId so re-opening shows the last node
  }, []);

  // ─── Roadmap View ───
  const [roadmapView, setRoadmapView] = useState('flow'); // 'flow' | 'tree'
  const [simulatedHours, setSimulatedHours] = useState(null);
  const [adaptationPopupOpen, setAdaptationPopupOpen] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);

  // Track which node to auto-expand in Tree mode (set by "View Modules" button in Flow)
  const [expandedNodeId, setExpandedNodeId] = useState(null);

  // ─── Command Palette (⌘K) ───
  const [commandOpen, setCommandOpen] = useState(false);

  // ─── Toasts (backed by sonner) ───
  const showToast = useCallback((message, opts = {}) => {
    if (!message) return;
    sonnerToast(message, opts);
  }, []);

  // ─── Adaptive Feedback ───
  const giveFeedback = useCallback(
    (type) => {
      if (isAdapting) {
        console.log('[FRONTEND] [FEEDBACK] Blocked duplicate adaptation request (already in progress)');
        return;
      }
      if (!activeTrackId || !selectedNodeId) return;

      const startTime = Date.now();
      console.log(`[FRONTEND] [FEEDBACK] Selected: ${type} for node: ${selectedNodeId} on track: ${activeTrackId} at ${new Date(startTime).toISOString()}`);
      
      setIsAdapting(true);

      api.adaptRoadmap(activeTrackId, selectedNodeId, type)
        .then((res) => {
          const duration = Date.now() - startTime;
          console.log(`[FRONTEND] [FEEDBACK] Response received for type: ${type} in ${duration}ms:`, res);
          
          if (res.success && res.roadmap) {
            const previousRoadmap = tracks[activeTrackId];
            console.log(`[FRONTEND] [FEEDBACK] Previous roadmap data:`, previousRoadmap);
            console.log(`[FRONTEND] [FEEDBACK] New roadmap data returned by API:`, res.roadmap);
            
            // Log node titles before/after to prove data flow difference
            const prevTitle = previousRoadmap?.nodeMap?.[selectedNodeId]?.title;
            const newTitle = res.roadmap?.nodeMap?.[selectedNodeId]?.title;
            console.log(`[FRONTEND] [FEEDBACK] Data Flow Proof -> Selected Node Title: [${prevTitle}] -> [${newTitle}]`);

            console.log(`[FRONTEND] [FEEDBACK] Updating global tracks state with adapted roadmap for: ${activeTrackId}`);
            setTracks((prev) => ({ ...prev, [activeTrackId]: res.roadmap }));
            setAdaptationPopupOpen(true);

            const msg = FEEDBACK_MESSAGES[type];
            sonnerToast.success('Roadmap adapted', { 
              description: msg || 'Roadmap updated based on your progress ✨' 
            });
          } else {
            console.error('[FRONTEND] [FEEDBACK] Backend returned success: false', res);
            sonnerToast.error('Failed to adapt roadmap', {
              description: res.message || 'Please try again later.'
            });
          }
        })
        .catch((err) => {
          console.error('[FRONTEND] [FEEDBACK] Failed to adapt roadmap:', err);
          sonnerToast.error('Failed to adapt roadmap', {
            description: err.message || 'Check connection to the server.'
          });
        })
        .finally(() => {
          setIsAdapting(false);
        });
    },
    [activeTrackId, selectedNodeId, isAdapting, tracks]
  );

  // ─── Log out ───
  // Mock auth: there's no token to revoke, so we close every overlay, drop the
  // session-ish profile flags and let the caller navigate to /auth. Theme is a
  // device preference, so it deliberately survives a logout.
  const logout = useCallback(() => {
    clearAuthToken(); // real-mode: drop the stored bearer token (no-op in mock)
    localStorage.removeItem('waypoint-active-track');
    localStorage.removeItem('waypoint-strict-cache');
    setTracks({});
    setSidebarOpen(false);
    setSelectedNodeId(null);
    setCommandOpen(false);
    setDemoMode(false);
    setUserProfile((p) => ({ ...p, isOnboarded: false }));
    window.location.href = "/auth?mode=login";
  }, []);

  // ─── Node Status Update ───
  const updateNodeStatus = useCallback((trackId, nodeId, newStatus) => {
    // Guard: if trying to mark complete, ensure all modules are done
    if (newStatus === 'completed') {
      const node = tracks[trackId]?.nodeMap?.[nodeId];
      const modules = node?.modules || [];
      if (modules.length > 0) {
        const allDone = modules.every((m) => m.status === 'completed');
        if (!allDone) {
          // Don't complete — redirect to modules view to finish modules
          sonnerToast.error('Complete all modules first', {
            description: 'Open Modules view to check off pending topics.',
          });
          setRoadmapView('tree');
          setExpandedNodeId(nodeId);
          return;
        }
      }
    }

    // Optimistic UI update
    setTracks((prev) => {
      const updated = { ...prev };
      const track = { ...updated[trackId] };
      const nodeMap = { ...track.nodeMap };
      const oldStatus = nodeMap[nodeId]?.status;

      nodeMap[nodeId] = { ...nodeMap[nodeId], status: newStatus };
      track.nodeMap = nodeMap;

      // Locally compute the skill bump to ensure instant UI update
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        const remaining = Object.values(nodeMap).filter((n) => n.status !== 'completed').length;
        const newSkillData = track.skillData.map((skill) => {
          const current = skill.current || 0;
          const target = skill.target || 100;
          if (current < target) {
            if (remaining === 0) {
              return { ...skill, current: target };
            } else {
              const gap = target - current;
              const increment = Math.max(2, Math.floor(gap / (remaining + 1)));
              return { ...skill, current: Math.min(target, current + increment) };
            }
          }
          return skill;
        });
        track.skillData = newSkillData;
      }

      updated[trackId] = track;
      return updated;
    });

    // Async API call
    api.updateNodeStatus(trackId, nodeId, newStatus)
      .then(() => { /* optimistic update already applied */ })
      .catch((err) => {
        console.error('Failed to update node status:', err);
      });
  }, [tracks, setRoadmapView]);

  // ─── Module Status Update ───
  // Updates a single module's completion state and derives parent status locally.
  const updateModuleStatus = useCallback((trackId, nodeId, moduleIndex, newStatus) => {
    setTracks((prev) => {
      const track = prev[trackId];
      if (!track) return prev;
      const node = track.nodeMap[nodeId];
      if (!node) return prev;

      const modules = [...(node.modules || [])];
      modules[moduleIndex] = { ...modules[moduleIndex], status: newStatus };

      // Derive parent status from all modules
      const allDone = modules.every((m) => m.status === 'completed');
      const anyDone = modules.some((m) => m.status === 'completed');
      const parentStatus = allDone ? 'completed' : anyDone ? 'in_progress' : 'not_started';

      const oldParentStatus = node.status;
      const newNodeMap = {
        ...track.nodeMap,
        [nodeId]: { ...node, modules, status: parentStatus },
      };

      let skillData = track.skillData;
      // Trigger skill bump when parent becomes completed
      if (parentStatus === 'completed' && oldParentStatus !== 'completed') {
        const remaining = Object.values(newNodeMap).filter((n) => n.status !== 'completed').length;
        skillData = skillData.map((skill) => {
          const current = skill.current || 0;
          const target = skill.target || 100;
          if (current < target) {
            if (remaining === 0) return { ...skill, current: target };
            const gap = target - current;
            const increment = Math.max(2, Math.floor(gap / (remaining + 1)));
            return { ...skill, current: Math.min(target, current + increment) };
          }
          return skill;
        });
      }

      return {
        ...prev,
        [trackId]: { ...track, nodeMap: newNodeMap, skillData },
      };
    });

    // Async API call - Return the promise so caller can await it
    return api.updateModuleStatus(trackId, nodeId, moduleIndex, newStatus)
      .catch((err) => {
        console.error('Failed to update module status on backend', err);
      });
  }, []);

  const updateAllModulesStatus = useCallback((trackId, nodeId, newStatus) => {
    setTracks((prev) => {
      const track = prev[trackId];
      if (!track) return prev;
      const node = track.nodeMap[nodeId];
      if (!node) return prev;

      const modules = (node.modules || []).map(m => ({ ...m, status: newStatus }));
      const parentStatus = newStatus;
      const oldParentStatus = node.status;

      const newNodeMap = {
        ...track.nodeMap,
        [nodeId]: { ...node, modules, status: parentStatus },
      };

      let skillData = track.skillData;
      if (parentStatus === 'completed' && oldParentStatus !== 'completed') {
        const remaining = Object.values(newNodeMap).filter((n) => n.status !== 'completed').length;
        skillData = skillData.map((skill) => {
          const current = skill.current || 0;
          const target = skill.target || 100;
          if (current < target) {
            if (remaining === 0) return { ...skill, current: target };
            const gap = target - current;
            const increment = Math.max(2, Math.floor(gap / (remaining + 1)));
            return { ...skill, current: Math.min(target, current + increment) };
          }
          return skill;
        });
      }

      return {
        ...prev,
        [trackId]: { ...track, nodeMap: newNodeMap, skillData },
      };
    });

    return api.updateAllModulesStatus(trackId, nodeId, newStatus).catch((err) => {
      console.error('Failed to update all modules status on backend', err);
    });
  }, []);

  const value = {
    // Theme
    theme,
    toggleTheme,

    // Demo mode
    demoMode,
    setDemoMode,

    // Tracks
    tracks,
    isLoading,
    activeTrackId,
    setActiveTrackId,
    activeTrack,
    generateAndLoadRoadmap,
    refreshTracks,
    reloadAfterLogin,
    deleteTrack,

    // User
    userProfile,
    setUserProfile,
    logout,

    // Sidebar
    sidebarOpen,
    setSidebarOpen,
    selectedNodeId,
    setSelectedNodeId,
    openNode,
    closeSidebar,

    // Roadmap view
    roadmapView,
    setRoadmapView,
    simulatedHours,
    setSimulatedHours,
    expandedNodeId,
    setExpandedNodeId,

    // Command palette
    commandOpen,
    setCommandOpen,
    adaptationPopupOpen,
    setAdaptationPopupOpen,

    // Toast + feedback
    showToast,
    giveFeedback,
    isAdapting,

    // Node + module updates
    updateNodeStatus,
    updateModuleStatus,
    updateAllModulesStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
