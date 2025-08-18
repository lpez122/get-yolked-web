import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY='exercise_library_v2';
const Ctx=createContext(null);
function normStr(x){return String(x||'').trim();}
function normArr(a){return (Array.isArray(a)?a:[a]).filter(Boolean).map(normStr);}
const SEED=[
  {name:'Bench Press',muscleGroups:['Chest','Triceps'],equipment:'Barbell',primaryMuscles:['Chest'],secondaryMuscles:['Triceps','Shoulders']},
  {name:'Incline Bench Press',muscleGroups:['Chest','Triceps'],equipment:'Barbell',primaryMuscles:['Chest'],secondaryMuscles:['Triceps','Shoulders']},
  {name:'Decline Bench Press',muscleGroups:['Chest','Triceps'],equipment:'Barbell',primaryMuscles:['Chest'],secondaryMuscles:['Triceps','Shoulders']},
  {name:'Dumbbell Chest Press',muscleGroups:['Chest','Triceps'],equipment:'Dumbbells',primaryMuscles:['Chest'],secondaryMuscles:['Triceps','Shoulders']},
  {name:'Incline Dumbbell Press',muscleGroups:['Chest','Triceps'],equipment:'Dumbbells',primaryMuscles:['Chest'],secondaryMuscles:['Triceps','Shoulders']},
  {name:'Push-Up',muscleGroups:['Chest','Triceps'],equipment:'Bodyweight',primaryMuscles:['Chest'],secondaryMuscles:['Triceps','Shoulders']},
  {name:'Cable Chest Press',muscleGroups:['Chest','Triceps'],equipment:'Cable',primaryMuscles:['Chest'],secondaryMuscles:['Triceps','Shoulders']},
  {name:'Dumbbell Chest Fly',muscleGroups:['Chest'],equipment:'Dumbbells',primaryMuscles:['Chest'],secondaryMuscles:['Shoulders']},
  {name:'Cable Fly',muscleGroups:['Chest'],equipment:'Cable',primaryMuscles:['Chest'],secondaryMuscles:['Shoulders']},
  {name:'Chest Dip',muscleGroups:['Chest','Triceps'],equipment:'Bodyweight',primaryMuscles:['Chest'],secondaryMuscles:['Triceps']},
  {name:'Machine Chest Press',muscleGroups:['Chest','Triceps'],equipment:'Machine',primaryMuscles:['Chest'],secondaryMuscles:['Triceps','Shoulders']},
  {name:'Cable Crossover',muscleGroups:['Chest'],equipment:'Cable',primaryMuscles:['Chest'],secondaryMuscles:['Shoulders']},
  {name:'Incline Cable Fly',muscleGroups:['Chest'],equipment:'Cable',primaryMuscles:['Chest'],secondaryMuscles:['Shoulders']},
  {name:'Decline Dumbbell Fly',muscleGroups:['Chest'],equipment:'Dumbbells',primaryMuscles:['Chest'],secondaryMuscles:['Shoulders']},
  {name:'Machine Chest Fly',muscleGroups:['Chest'],equipment:'Machine',primaryMuscles:['Chest'],secondaryMuscles:['Shoulders']},
  {name:'Close Grip Push-Up',muscleGroups:['Chest','Triceps'],equipment:'Bodyweight',primaryMuscles:['Chest'],secondaryMuscles:['Triceps']},
  {name:'Overhead Press',muscleGroups:['Shoulders','Triceps'],equipment:'Barbell',primaryMuscles:['Shoulders'],secondaryMuscles:['Triceps']},
  {name:'Dumbbell Shoulder Press',muscleGroups:['Shoulders','Triceps'],equipment:'Dumbbells',primaryMuscles:['Shoulders'],secondaryMuscles:['Triceps']},
  {name:'Arnold Press',muscleGroups:['Shoulders','Triceps'],equipment:'Dumbbells',primaryMuscles:['Shoulders'],secondaryMuscles:['Triceps']},
  {name:'Dumbbell Lateral Raise',muscleGroups:['Shoulders'],equipment:'Dumbbells',primaryMuscles:['Shoulders'],secondaryMuscles:[]},
  {name:'Cable Lateral Raise',muscleGroups:['Shoulders'],equipment:'Cable',primaryMuscles:['Shoulders'],secondaryMuscles:[]},
  {name:'Barbell Front Raise',muscleGroups:['Shoulders'],equipment:'Barbell',primaryMuscles:['Shoulders'],secondaryMuscles:['Front Deltoids']},
  {name:'Reverse Dumbbell Fly',muscleGroups:['Shoulders','Back'],equipment:'Dumbbells',primaryMuscles:['Shoulders'],secondaryMuscles:['Back']},
  {name:'Face Pull',muscleGroups:['Shoulders','Back'],equipment:'Cable',primaryMuscles:['Back','Shoulders'],secondaryMuscles:[]},
  {name:'Deadlift',muscleGroups:['Back','Legs'],equipment:'Barbell',primaryMuscles:['Back'],secondaryMuscles:['Glutes','Legs']},
  {name:'Romanian Deadlift',muscleGroups:['Back','Legs'],equipment:'Barbell',primaryMuscles:['Back','Glutes'],secondaryMuscles:['Legs']},
  {name:'Barbell Row',muscleGroups:['Back'],equipment:'Barbell',primaryMuscles:['Back'],secondaryMuscles:['Biceps']},
  {name:'Single-Arm Dumbbell Row',muscleGroups:['Back'],equipment:'Dumbbells',primaryMuscles:['Back'],secondaryMuscles:['Biceps']},
  {name:'T-Bar Row',muscleGroups:['Back'],equipment:'Barbell',primaryMuscles:['Back'],secondaryMuscles:['Biceps']},
  {name:'Lat Pulldown',muscleGroups:['Back'],equipment:'Cable',primaryMuscles:['Back'],secondaryMuscles:['Biceps']},
  {name:'Pull-Up',muscleGroups:['Back','Biceps'],equipment:'Bodyweight',primaryMuscles:['Back'],secondaryMuscles:['Biceps']},
  {name:'Seated Cable Row',muscleGroups:['Back'],equipment:'Cable',primaryMuscles:['Back'],secondaryMuscles:['Biceps']},
  {name:'Cable Row',muscleGroups:['Back'],equipment:'Cable',primaryMuscles:['Back'],secondaryMuscles:['Biceps']},
  {name:'Squat',muscleGroups:['Legs','Glutes'],equipment:'Barbell',primaryMuscles:['Legs'],secondaryMuscles:['Glutes']},
  {name:'Front Squat',muscleGroups:['Legs','Glutes'],equipment:'Barbell',primaryMuscles:['Legs'],secondaryMuscles:['Glutes']},
  {name:'Bulgarian Split Squat',muscleGroups:['Legs','Glutes'],equipment:'Barbell',primaryMuscles:['Legs'],secondaryMuscles:['Glutes']},
  {name:'Lunge',muscleGroups:['Legs','Glutes'],equipment:'Bodyweight',primaryMuscles:['Legs'],secondaryMuscles:['Glutes']},
  {name:'Leg Press',muscleGroups:['Legs','Glutes'],equipment:'Leg Press Machine',primaryMuscles:['Legs'],secondaryMuscles:['Glutes']},
  {name:'Hack Squat',muscleGroups:['Legs','Glutes'],equipment:'Hack Squat Machine',primaryMuscles:['Legs'],secondaryMuscles:['Glutes']},
  {name:'Hip Thrust',muscleGroups:['Glutes'],equipment:'Barbell',primaryMuscles:['Glutes'],secondaryMuscles:['Legs']},
  {name:'Glute Bridge',muscleGroups:['Glutes'],equipment:'Bodyweight',primaryMuscles:['Glutes'],secondaryMuscles:['Legs']},
  {name:'Leg Extension',muscleGroups:['Legs'],equipment:'Selectorized Machine',primaryMuscles:['Legs'],secondaryMuscles:[]},
  {name:'Leg Curl',muscleGroups:['Legs'],equipment:'Selectorized Machine',primaryMuscles:['Legs'],secondaryMuscles:[]},
  {name:'Calf Raise',muscleGroups:['Legs'],equipment:'Bodyweight',primaryMuscles:['Legs'],secondaryMuscles:[]},
  {name:'Barbell Curl',muscleGroups:['Biceps'],equipment:'Barbell',primaryMuscles:['Biceps'],secondaryMuscles:[]},
  {name:'Hammer Curl',muscleGroups:['Biceps'],equipment:'Dumbbells',primaryMuscles:['Biceps'],secondaryMuscles:[]},
  {name:'EZ Bar Curl',muscleGroups:['Biceps'],equipment:'EZ Bar',primaryMuscles:['Biceps'],secondaryMuscles:[]},
  {name:'Preacher Curl',muscleGroups:['Biceps'],equipment:'Machine',primaryMuscles:['Biceps'],secondaryMuscles:[]},
  {name:'Cable Curl',muscleGroups:['Biceps'],equipment:'Cable',primaryMuscles:['Biceps'],secondaryMuscles:[]},
  {name:'Lying Triceps Extension',muscleGroups:['Triceps'],equipment:'Barbell',primaryMuscles:['Triceps'],secondaryMuscles:[]},
  {name:'Tricep Pushdown',muscleGroups:['Triceps'],equipment:'Cable',primaryMuscles:['Triceps'],secondaryMuscles:[]},
  {name:'Overhead Triceps Extension',muscleGroups:['Triceps'],equipment:'Dumbbells',primaryMuscles:['Triceps'],secondaryMuscles:[]},
  {name:'Close Grip Bench Press',muscleGroups:['Chest','Triceps'],equipment:'Barbell',primaryMuscles:['Triceps'],secondaryMuscles:['Chest']},
  {name:'Crunch',muscleGroups:['Core'],equipment:'Bodyweight',primaryMuscles:['Core'],secondaryMuscles:[]},
  {name:'Plank',muscleGroups:['Core'],equipment:'Bodyweight',primaryMuscles:['Core'],secondaryMuscles:[]},
  {name:'Russian Twist',muscleGroups:['Core'],equipment:'Medicine Ball',primaryMuscles:['Core'],secondaryMuscles:[]},
  {name:'Hanging Leg Raise',muscleGroups:['Core'],equipment:'Bodyweight',primaryMuscles:['Core'],secondaryMuscles:[]},
  {name:'Sit-Up',muscleGroups:['Core'],equipment:'Bodyweight',primaryMuscles:['Core'],secondaryMuscles:[]},
  {name:'Ab Wheel Rollout',muscleGroups:['Core'],equipment:'Bodyweight',primaryMuscles:['Core'],secondaryMuscles:[]},
  {name:'Kettlebell Swing',muscleGroups:['Full Body'],equipment:'Kettlebell',primaryMuscles:['Full Body'],secondaryMuscles:['Glutes','Legs']},
  {name:'Rowing Machine',muscleGroups:['Full Body'],equipment:'Rowing Machine',primaryMuscles:['Full Body'],secondaryMuscles:['Back','Legs']},
  {name:'Stationary Bike',muscleGroups:['Full Body'],equipment:'Stationary Bike',primaryMuscles:['Full Body'],secondaryMuscles:['Legs']},
  {name:'Treadmill Running',muscleGroups:['Full Body'],equipment:'Treadmill',primaryMuscles:['Full Body'],secondaryMuscles:['Legs']},
  {name:'Jump Rope',muscleGroups:['Full Body'],equipment:'Bodyweight',primaryMuscles:['Full Body'],secondaryMuscles:['Legs','Arms']},
  {name:'Elliptical Trainer',muscleGroups:['Full Body'],equipment:'Elliptical',primaryMuscles:['Full Body'],secondaryMuscles:['Legs']},
  {name:'Standing Military Press',muscleGroups:['Shoulders','Triceps'],equipment:'Barbell',primaryMuscles:['Shoulders'],secondaryMuscles:['Triceps']},
  {name:'Cable Upright Row',muscleGroups:['Shoulders','Back'],equipment:'Cable',primaryMuscles:['Shoulders'],secondaryMuscles:['Back']},
  {name:'Machine Lateral Raise',muscleGroups:['Shoulders'],equipment:'Machine',primaryMuscles:['Shoulders'],secondaryMuscles:[]},
  {name:'Rear Delt Fly Machine',muscleGroups:['Shoulders','Back'],equipment:'Machine',primaryMuscles:['Shoulders'],secondaryMuscles:['Back']},
  {name:'Seated Dumbbell Clean and Press',muscleGroups:['Shoulders','Triceps'],equipment:'Dumbbells',primaryMuscles:['Shoulders'],secondaryMuscles:['Triceps']},
  {name:'Bent Over Dumbbell Row',muscleGroups:['Back'],equipment:'Dumbbells',primaryMuscles:['Back'],secondaryMuscles:['Biceps']},
  {name:'Chest Supported Row',muscleGroups:['Back'],equipment:'Machine',primaryMuscles:['Back'],secondaryMuscles:['Biceps']},
  {name:'Inverted Row',muscleGroups:['Back','Biceps'],equipment:'Bodyweight',primaryMuscles:['Back'],secondaryMuscles:['Biceps']},
  {name:'Single-Leg Romanian Deadlift',muscleGroups:['Back','Legs'],equipment:'Dumbbells',primaryMuscles:['Legs','Glutes'],secondaryMuscles:['Back']},
  {name:'Goblet Squat',muscleGroups:['Legs','Glutes'],equipment:'Dumbbells',primaryMuscles:['Legs'],secondaryMuscles:['Glutes']},
  {name:'Sumo Deadlift',muscleGroups:['Legs','Glutes','Back'],equipment:'Barbell',primaryMuscles:['Glutes','Legs'],secondaryMuscles:['Back']},
  {name:'Walking Lunge',muscleGroups:['Legs','Glutes'],equipment:'Bodyweight',primaryMuscles:['Legs'],secondaryMuscles:['Glutes']},
  {name:'Smith Machine Leg Press',muscleGroups:['Legs','Glutes'],equipment:'Smith Machine',primaryMuscles:['Legs'],secondaryMuscles:['Glutes']},
  {name:'Donkey Calf Raise',muscleGroups:['Legs'],equipment:'Bodyweight',primaryMuscles:['Legs'],secondaryMuscles:[]},
  {name:'Concentration Curl',muscleGroups:['Biceps'],equipment:'Dumbbells',primaryMuscles:['Biceps'],secondaryMuscles:[]},
  {name:'Cable Triceps Kickback',muscleGroups:['Triceps'],equipment:'Cable',primaryMuscles:['Triceps'],secondaryMuscles:[]},
  {name:'Skull Crushers',muscleGroups:['Triceps'],equipment:'Barbell',primaryMuscles:['Triceps'],secondaryMuscles:[]},
  {name:'Spider Curl',muscleGroups:['Biceps'],equipment:'Dumbbells',primaryMuscles:['Biceps'],secondaryMuscles:[]},
  {name:'Hanging Knee Raise',muscleGroups:['Core'],equipment:'Bodyweight',primaryMuscles:['Core'],secondaryMuscles:[]},
  {name:'Cable Woodchopper',muscleGroups:['Core'],equipment:'Cable',primaryMuscles:['Core'],secondaryMuscles:[]},
  {name:'Flutter Kick',muscleGroups:['Core'],equipment:'Bodyweight',primaryMuscles:['Core'],secondaryMuscles:[]},
  {name:'Burpee',muscleGroups:['Full Body'],equipment:'Bodyweight',primaryMuscles:['Full Body'],secondaryMuscles:['Legs','Arms']},
  {name:'Clean and Press',muscleGroups:['Full Body'],equipment:'Barbell',primaryMuscles:['Full Body'],secondaryMuscles:['Shoulders','Legs']},
  {name:'Thruster',muscleGroups:['Full Body'],equipment:'Barbell',primaryMuscles:['Full Body'],secondaryMuscles:['Shoulders','Legs']}
];
export function ExerciseLibraryProvider({children}){
  const [list,setList]=useState([]);
  useEffect(()=>{(async()=>{
    const raw=await AsyncStorage.getItem(KEY);
    if(raw){setList(JSON.parse(raw));}else{setList(SEED);await AsyncStorage.setItem(KEY,JSON.stringify(SEED));}
  })()},[]);
  const save=async(arr)=>{setList(arr);await AsyncStorage.setItem(KEY,JSON.stringify(arr));};
  const addExercise=async(e)=>{
    const item={
      name:normStr(e.name),
      muscleGroups:normArr(e.muscleGroups||e.primary||[]),
      equipment:normStr(e.equipment||''),
      primaryMuscles:normArr(e.primaryMuscles||e.primary||[]),
      secondaryMuscles:normArr(e.secondaryMuscles||e.secondary||[])
    };
    const exists=list.find(x=>x.name.toLowerCase()===item.name.toLowerCase());
    const next=exists?list.map(x=>x.name.toLowerCase()===item.name.toLowerCase()?item:x):[...list,item];
    await save(next);
    return item;
  };
  const value=useMemo(()=>({list,addExercise,findByName:(name)=>list.find(x=>x.name.toLowerCase()===String(name||'').toLowerCase())}),[list]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useExerciseLibrary(){return useContext(Ctx);}
