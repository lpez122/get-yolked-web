import AsyncStorage from '@react-native-async-storage/async-storage';

async function read(k){try{const v=await AsyncStorage.getItem(k);return v?JSON.parse(v):null}catch(e){return null}}
async function write(k,v){try{await AsyncStorage.setItem(k,JSON.stringify(v))}catch(e){}}
async function remove(k){try{await AsyncStorage.removeItem(k)}catch(e){}}

export async function getSavedPrograms(){return (await read('saved_programs_v1'))||[]}
export async function savePrograms(list){await write('saved_programs_v1',list||[])}
export async function deleteProgram(id){const list=await getSavedPrograms();const next=list.filter(p=>String(p.id)!==String(id));await savePrograms(next);const a=await read('active_program_v1');if(a&&String(a.id)===String(id)){await stopActive()}}

export async function getActive(){return await read('active_program_v1')}
export async function getPointer(){return await read('current_program_v1')}
export async function setPointer(ptr){await write('current_program_v1',ptr)}

export async function startProgramById(programId){
  const list=await getSavedPrograms();
  const prog=list.find(p=>String(p.id)===String(programId));
  if(!prog) return null;
  const active={id:prog.id,name:prog.name,weeks:Number(prog.weeks||1),days:Number(prog.days||1),currentWeek:1,currentDay:1,dayTemplates:{}};
  let tpls=(await read('day_templates_v1'))||[];
  tpls=tpls.filter(t=>!String(t.id).startsWith(`tpl_${prog.id}_`));
  for(let d=1; d<=active.days; d++){
    const exs=(((prog.plan||{})['1']||{})[String(d)]||[]);
    const id=`tpl_${prog.id}_1_${d}`;
    active.dayTemplates[String(d)]=id;
    tpls.push({id,name:`${prog.name} W1D${d}`,exercises:exs});
  }
  await write('day_templates_v1',tpls);
  await write('active_program_v1',active);
  await write('current_program_v1',{programId:prog.id,programName:prog.name,week:1,day:1});
  return active;
}

export async function stopActive(){
  await remove('active_program_v1');
  await remove('current_program_v1');
}

export async function getDayExercises({programId,programName,week,day}){
  const list=await getSavedPrograms();
  const prog=list.find(p=>String(p.id)===String(programId)||p.name===programName);
  const w=String(week||1), d=String(day||1);
  let arr=[];
  if(prog&&prog.plan&&prog.plan[w]&&Array.isArray(prog.plan[w][d])) arr=prog.plan[w][d];
  if(!arr.length){
    const active=await getActive();
    const tpls=(await read('day_templates_v1'))||[];
    const tplId=active?.dayTemplates?.[d];
    if(tplId){const tpl=tpls.find(t=>t.id===tplId); if(tpl&&Array.isArray(tpl.exercises)) arr=tpl.exercises}
  }
  return arr;
}

export async function advanceAfterFinish(){
  const active=await getActive();
  if(!active) return null;
  const ptr=await getPointer()||{programId:active.id,programName:active.name,week:active.currentWeek||1,day:active.currentDay||1};
  let week=Number(ptr.week||1);
  let day=Number(ptr.day||1);
  if(day<active.days){day+=1}else{day=1;week+=1}
  if(week>active.weeks){await stopActive();return null}
  const next={programId:active.id,programName:active.name,week,day};
  await setPointer(next);
  await write('active_program_v1',{...active,currentWeek:week,currentDay:day});
  return next;
}

export async function navigateDay(delta){
  const active=await getActive(); if(!active) return null;
  let week=active.currentWeek||1;
  let day=active.currentDay||1;
  day+=delta;
  if(day<1){day=active.days}else if(day>active.days){day=1}
  const ptr={programId:active.id,programName:active.name,week,day};
  await write('active_program_v1',{...active,currentWeek:week,currentDay:day});
  await setPointer(ptr);
  return ptr;
}
