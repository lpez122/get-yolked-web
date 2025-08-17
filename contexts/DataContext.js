import React, { createContext, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Data model definitions
// Each exercise: { id, name, primaryMuscles: [], secondaryMuscles: [], equipment }
// Each program: { id, name, startDate: 'YYYY-MM-DD', weeks, days: [ { id, dow, name, exercises: [...] } ] }
// Each day exercise: { exerciseId, sets, repsMin, repsMax, targetRpe, restSec }
// Each workout: { id, programId, date: 'YYYY-MM-DD', week, dow, sets: [ { id, exerciseId, setNumber, weight, reps, rpe, completed, restSec } ], notes, startedAt, completedAt }

const DataContext = createContext();
export const useData = () => useContext(DataContext);

// Some default muscle groups and equipment types
export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Full Body'
];
export const EQUIPMENT_TYPES = [
  'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell'
];

// A small default exercise list as a starting point
const DEFAULT_EXERCISES = [
  { id: uuidv4(), name: 'Bench Press', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'], equipment: 'Barbell' },
  { id: uuidv4(), name: 'Squat', primaryMuscles: ['Legs'], secondaryMuscles: ['Glutes'], equipment: 'Barbell' },
  { id: uuidv4(), name: 'Deadlift', primaryMuscles: ['Back'], secondaryMuscles: ['Glutes', 'Legs'], equipment: 'Barbell' },
  { id: uuidv4(), name: 'Overhead Press', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Triceps'], equipment: 'Barbell' },
  { id: uuidv4(), name: 'Pull-Up', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'], equipment: 'Bodyweight' },
  { id: uuidv4(), name: 'Bicep Curl', primaryMuscles: ['Biceps'], secondaryMuscles: [], equipment: 'Dumbbell' },
  { id: uuidv4(), name: 'Tricep Pushdown', primaryMuscles: ['Triceps'], secondaryMuscles: [], equipment: 'Cable' },
  { id: uuidv4(), name: 'Lunge', primaryMuscles: ['Legs'], secondaryMuscles: ['Glutes'], equipment: 'Bodyweight' },
  { id: uuidv4(), name: 'Plank', primaryMuscles: ['Core'], secondaryMuscles: [], equipment: 'Bodyweight' }
];

// Brzycki and Epley 1RM formulas
const computeOneRmEpley = (weight, reps) => {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
};
const computeOneRmBrzycki = (weight, reps) => {
  if (!weight || !reps || reps >= 37) return 0;
  return weight * (36 / (37 - reps));
};

// Compute PRs from all workouts
const computeGlobalPrs = (workouts) => {
  const prs = {};
  workouts.forEach(w => {
    w.sets.forEach(set => {
      const key = set.exerciseId;
      if (!prs[key]) {
        prs[key] = { maxWeight: 0, maxVolume: 0, maxOneRmEpley: 0, maxOneRmBrzycki: 0 };
      }
      const volume = (set.weight || 0) * (set.reps || 0);
      const oneRmE = computeOneRmEpley(set.weight, set.reps);
      const oneRmB = computeOneRmBrzycki(set.weight, set.reps);
      prs[key].maxWeight = Math.max(prs[key].maxWeight, set.weight || 0);
      prs[key].maxVolume = Math.max(prs[key].maxVolume, volume);
      prs[key].maxOneRmEpley = Math.max(prs[key].maxOneRmEpley, oneRmE);
      prs[key].maxOneRmBrzycki = Math.max(prs[key].maxOneRmBrzycki, oneRmB);
    });
  });
  return prs;
};

const initialState = {
  exercises: [],
  programs: [],
  workouts: [],
  dayTemplates: [],
  weekTemplates: [],
  currentProgramId: null,
  quickPlan: []
};

function dataReducer(state, action) {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, ...action.payload };
    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.payload] };
    case 'UPDATE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e)
      };
    case 'DELETE_EXERCISES':
      return {
        ...state,
        exercises: state.exercises.filter(e => !action.payload.includes(e.id))
      };
    case 'ADD_PROGRAM':
      return { ...state, programs: [...state.programs, action.payload] };
    case 'UPDATE_PROGRAM':
      return {
        ...state,
        programs: state.programs.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p)
      };
    case 'DELETE_PROGRAM':
      return {
        ...state,
        programs: state.programs.filter(p => p.id !== action.payload)
      };
    case 'SET_CURRENT_PROGRAM':
      return { ...state, currentProgramId: action.payload };
    case 'ADD_WORKOUT':
      return { ...state, workouts: [...state.workouts, action.payload] };
    case 'UPDATE_WORKOUT':
      return {
        ...state,
        workouts: state.workouts.map(w => w.id === action.payload.id ? { ...w, ...action.payload } : w)
      };
    case 'DELETE_WORKOUT':
      return { ...state, workouts: state.workouts.filter(w => w.id !== action.payload) };
    case 'ADD_DAY_TEMPLATE':
      return { ...state, dayTemplates: [...state.dayTemplates, action.payload] };
    case 'ADD_WEEK_TEMPLATE':
      return { ...state, weekTemplates: [...state.weekTemplates, action.payload] };
    case 'SET_QUICK_PLAN':
      return { ...state, quickPlan: action.payload };
    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  useEffect(() => {
    async function loadData() {
      try {
        const json = await AsyncStorage.getItem('getYolkedData');
        if (json) {
          const parsed = JSON.parse(json);
          dispatch({ type: 'SET_DATA', payload: parsed });
        } else {
          // seed default exercises if none stored
          dispatch({ type: 'SET_DATA', payload: { ...initialState, exercises: DEFAULT_EXERCISES } });
        }
      } catch (e) {
        console.error('Failed to load data', e);
        dispatch({ type: 'SET_DATA', payload: { ...initialState, exercises: DEFAULT_EXERCISES } });
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    // persist data changes
    AsyncStorage.setItem('getYolkedData', JSON.stringify(state));
  }, [state]);

  // helper functions
  const addExercise = (exercise) => {
    dispatch({ type: 'ADD_EXERCISE', payload: { id: uuidv4(), ...exercise } });
  };

  const updateExercise = (exercise) => {
    dispatch({ type: 'UPDATE_EXERCISE', payload: exercise });
  };

  const deleteExercises = (ids) => {
    dispatch({ type: 'DELETE_EXERCISES', payload: ids });
  };

  const addProgram = (program) => {
    dispatch({ type: 'ADD_PROGRAM', payload: { id: uuidv4(), ...program } });
  };

  const updateProgram = (program) => {
    dispatch({ type: 'UPDATE_PROGRAM', payload: program });
  };

  const deleteProgram = (id) => {
    dispatch({ type: 'DELETE_PROGRAM', payload: id });
  };

  const setCurrentProgram = (id) => {
    dispatch({ type: 'SET_CURRENT_PROGRAM', payload: id });
  };

  const addWorkout = (workout) => {
    dispatch({ type: 'ADD_WORKOUT', payload: { id: uuidv4(), ...workout } });
  };

  const updateWorkout = (workout) => {
    dispatch({ type: 'UPDATE_WORKOUT', payload: workout });
  };

  const deleteWorkout = (id) => {
    dispatch({ type: 'DELETE_WORKOUT', payload: id });
  };

  const addDayTemplate = (template) => {
    dispatch({ type: 'ADD_DAY_TEMPLATE', payload: { id: uuidv4(), ...template } });
  };
  const addWeekTemplate = (template) => {
    dispatch({ type: 'ADD_WEEK_TEMPLATE', payload: { id: uuidv4(), ...template } });
  };

  const setQuickPlan = (plan) => {
    dispatch({ type: 'SET_QUICK_PLAN', payload: plan });
  };

  const value = {
    data: state,
    addExercise,
    updateExercise,
    deleteExercises,
    addProgram,
    updateProgram,
    deleteProgram,
    setCurrentProgram,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    addDayTemplate,
    addWeekTemplate,
    setQuickPlan,
    computeGlobalPrs: () => computeGlobalPrs(state.workouts)
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
