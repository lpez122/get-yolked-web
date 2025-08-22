import AsyncStorage from '@react-native-async-storage/async-storage';
function parseSavedIdFromTemplates(dt){try{const first=Object.values(dt||{})[0];const m=String(first||'').match(/^tpl_(\d+)_/);return m?m[1]:null}catch(e){return null}}
async function readJSON(k){try{const v=await AsyncStorage.getItem(k);return v?JSON.parse(v):null}catch(e){return null}}
async function writeJSON(k,v){await AsyncStorage.setItem(k,JSON.stringify(v))}
export async function normalizePointer(){
  const ptr=await readJSON('current_program_v1');
  const saved=await readJSON('saved_programs_v1')||[];
  const act=await readJSON('active_program_v1');
  if(ptr&&saved.find(p=>String(p.id)===String(ptr.programId))){
    return {programId:ptr.programId,week:Number(ptr.week||1),day:Number(ptr.day||1)};
  }
  if(act){
    const savedId=parseSavedIdFromTemplates(act.dayTemplates)||act.sourceProgramId||act.programId||act.id;
    if(saved.find(p=>String(p.id)===String(savedId))){
      const week=Number(act.currentWeek||1),day=Number(act.currentDay||1);
      const fixed={programId:savedId,week,day};
      await writeJSON('current_program_v1',fixed);
      return fixed;
    }
  }
  return null;
}
export async function getSavedProgramById(id){
  const list=await readJSON('saved_programs_v1')||[];
  return list.find(p=>String(p.id)===String(id))||null;
}
