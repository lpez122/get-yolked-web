import AsyncStorage from '@react-native-async-storage/async-storage';
function normalize(arr){return (arr||[]).map((e,i)=>({id:e.id||`ex_${i}_${(e.name||"").toLowerCase().replace(/\s+/g,"_")}`,name:e.name||"Exercise",...e}));}
export function registerExercisesProvider(fn){if(typeof fn==="function")global.__getExercisesLibrary=fn;}
export async function loadExercisesLibrary(){
  try{if(typeof global.__getExercisesLibrary==="function"){const list=await global.__getExercisesLibrary();if(Array.isArray(list)&&list.length)return normalize(list);}}catch(e){}
  try{const raw=await AsyncStorage.getItem("exercise_library_v1");const arr=JSON.parse(raw||"[]");if(Array.isArray(arr)&&arr.length)return normalize(arr);}catch(e){}
  return normalize([{id:"ex_bench",name:"Barbell Bench Press"},{id:"ex_incline_db",name:"Incline Dumbbell Press"},{id:"ex_ohp",name:"Overhead Press"},{id:"ex_row",name:"Barbell Row"},{id:"ex_lat_raise",name:"Lateral Raise"},{id:"ex_pullup",name:"Pull-Up"},{id:"ex_curl_db",name:"Bicep Curl (Dumbbell)"},{id:"ex_tricep_push",name:"Tricep Pushdown"},{id:"ex_squat",name:"Back Squat"},{id:"ex_rdl",name:"Romanian Deadlift"},{id:"ex_deadlift",name:"Conventional Deadlift"},{id:"ex_leg_press",name:"Leg Press"},{id:"ex_leg_curl",name:"Leg Curl"},{id:"ex_leg_ext",name:"Leg Extension"},{id:"ex_calf_raise",name:"Calf Raise"},{id:"ex_face_pull",name:"Face Pull"},{id:"ex_hip_thrust",name:"Hip Thrust"}]);
}
