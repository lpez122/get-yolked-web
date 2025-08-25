import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_BASE = 'active_program_v1';
const TPL_KEY_BASE = 'day_templates_v1';
const FINISH_FLAG_BASE = 'recent_program_finished';

function keyFor(base, userId){ return userId ? `${base}_user_${String(userId)}` : base; }

async function readJSON(key){ try{ return JSON.parse(await AsyncStorage.getItem(key) || 'null'); }catch{ return null; } }
async function writeJSON(key,val){ try{ await AsyncStorage.setItem(key, JSON.stringify(val)); }catch{} }

// load active program (optionally scoped to a userId)
export async function loadActive(userId){
  const key = keyFor(KEY_BASE, userId);
  return await readJSON(key);
}
export async function clearActive(userId){ try{ await AsyncStorage.removeItem(keyFor(KEY_BASE, userId)); }catch{} }
export async function setActive(program, userId){
  const days = program.days || 7;
  const weeks = Math.max(1, Number(program.weeks || 4));
  const name = String(program.name || 'Program');
  const dayTemplates = program.dayTemplates || {};
  const firstDay = Number(Object.keys(dayTemplates).map(Number).sort()[0] || 1);
  const obj = { id:String(Date.now()), name, days, weeks, dayTemplates, currentWeek:1, currentDay:firstDay };
  await writeJSON(keyFor(KEY_BASE, userId), obj);
  return obj;
}

async function getTemplatesMap(userId){
  const list = await readJSON(keyFor(TPL_KEY_BASE, userId)) || [];
  const map = new Map();
  for(const t of list){ map.set(t.id, t); }
  return map;
}

export async function getNextSummary(userId){
  const active = await loadActive(userId);
  if(!active) return null;
  const map = await getTemplatesMap(userId);
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

export async function advanceAfterWorkout(userId){
  const active = await loadActive(userId);
  if(!active) return { finished:false, current:null };
  const keys = Object.keys(active.dayTemplates).map(Number).sort((a,b)=>a-b);
  if(keys.length===0){ await clearActive(userId); await AsyncStorage.setItem(keyFor(FINISH_FLAG_BASE, userId),'1'); return { finished:true, current:null }; }
  const idx = Math.max(0, keys.indexOf(active.currentDay));
  const atEndOfWeek = (idx === keys.length-1);
  if(atEndOfWeek){
    const nextWeek = active.currentWeek + 1;
    if(nextWeek > active.weeks){
      await clearActive(userId);
      await AsyncStorage.setItem(keyFor(FINISH_FLAG_BASE, userId),'1');
      return { finished:true, current:null };
    } else {
      active.currentWeek = nextWeek;
      active.currentDay = keys[0];
    }
  } else {
    active.currentDay = keys[idx+1];
  }
  await writeJSON(keyFor(KEY_BASE, userId), active);
  return { finished:false, current:active };
}

export async function consumeFinishFlag(userId){
  const k = keyFor(FINISH_FLAG_BASE, userId);
  const v = await AsyncStorage.getItem(k);
  if(v==='1'){ await AsyncStorage.removeItem(k); return true; }
  return false;
}
