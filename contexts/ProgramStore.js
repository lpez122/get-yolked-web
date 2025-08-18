import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'active_program_v1';
const TPL_KEY = 'day_templates_v1';
const FINISH_FLAG = 'recent_program_finished';

async function readJSON(key){ try{ return JSON.parse(await AsyncStorage.getItem(key) || 'null'); }catch{ return null; } }
async function writeJSON(key,val){ try{ await AsyncStorage.setItem(key, JSON.stringify(val)); }catch{} }

export async function loadActive(){ return await readJSON(KEY); }
export async function clearActive(){ try{ await AsyncStorage.removeItem(KEY); }catch{} }
export async function setActive(program){
  const days = program.days || 7;
  const weeks = Math.max(1, Number(program.weeks || 4));
  const name = String(program.name || 'Program');
  const dayTemplates = program.dayTemplates || {};
  const firstDay = Number(Object.keys(dayTemplates).map(Number).sort()[0] || 1);
  const obj = { id:String(Date.now()), name, days, weeks, dayTemplates, currentWeek:1, currentDay:firstDay };
  await writeJSON(KEY, obj);
  return obj;
}

async function getTemplatesMap(){
  const list = await readJSON(TPL_KEY) || [];
  const map = new Map();
  for(const t of list){ map.set(t.id, t); }
  return map;
}

export async function getNextSummary(){
  const active = await loadActive();
  if(!active) return null;
  const map = await getTemplatesMap();
  const tplId = active.dayTemplates[String(active.currentDay)];
  const tpl = map.get(tplId);
  const exercises = tpl?.exercises || [];
  return { programName: active.name, week: active.currentWeek, day: active.currentDay, isLastDay: (active.currentWeek===active.weeks && isLastDayInPlan(active)), plan:{exercises} };
}

function isLastDayInPlan(active){
  const keys = Object.keys(active.dayTemplates).map(Number).sort((a,b)=>a-b);
  const lastDay = keys[keys.length-1] || active.days;
  return active.currentDay === lastDay;
}

export async function advanceAfterWorkout(){
  const active = await loadActive();
  if(!active) return { finished:false, current:null };
  const keys = Object.keys(active.dayTemplates).map(Number).sort((a,b)=>a-b);
  if(keys.length===0){ await clearActive(); await AsyncStorage.setItem(FINISH_FLAG,'1'); return { finished:true, current:null }; }
  const idx = Math.max(0, keys.indexOf(active.currentDay));
  const atEndOfWeek = (idx === keys.length-1);
  if(atEndOfWeek){
    const nextWeek = active.currentWeek + 1;
    if(nextWeek > active.weeks){
      await clearActive();
      await AsyncStorage.setItem(FINISH_FLAG,'1');
      return { finished:true, current:null };
    } else {
      active.currentWeek = nextWeek;
      active.currentDay = keys[0];
    }
  } else {
    active.currentDay = keys[idx+1];
  }
  await writeJSON(KEY, active);
  return { finished:false, current:active };
}

export async function consumeFinishFlag(){
  const k = 'recent_program_finished';
  const v = await AsyncStorage.getItem(k);
  if(v==='1'){ await AsyncStorage.removeItem(k); return true; }
  return false;
}
