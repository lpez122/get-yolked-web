// Backward-compat shim: re-export unified history API from contexts/HistoryStore
import {
    getHistory,
    clearHistory,
    appendWorkoutSession as addHistoryEntry,
  } from '../contexts/HistoryStore';
  
  export { getHistory, clearHistory, addHistoryEntry };
  