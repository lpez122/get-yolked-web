import React,{useEffect,useMemo,useState} from 'react';
import {View,Text,ScrollView,Pressable,TextInput,Alert,Modal} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {theme} from '../constants/theme';
import ExerciseSelectModal from '../components/ExerciseSelectModal';
import * as P from '../contexts/ProgramStore';

const PROGRAMS_KEY='saved_programs_v1';
const ACTIVE_IDS_KEY='active_saved_program_ids';

function Section({title,children}){
  return(
    <View style={{backgroundColor:theme.card,borderRadius:12,padding:12}}>
      <Text style={{color:theme.text,fontWeight:'700',marginBottom:8}}>{title}</Text>
      {children}
    </View>
  );
}

export default function ProgramsScreen(){
  const [view,setView]=useState('list');
  const [saved,setSaved]=useState([]);
  const [activeIds,setActiveIds]=useState([]);
  const [pickerOpen,setPickerOpen]=useState(false);
  const [form,setForm]=useState({name:'',weeks:'4',days:'4'});
  const weeks=Number(form.weeks||1);
  const days=Number(form.days||1);
  const [plan,setPlan]=useState({});
  const [weekIdx,setWeekIdx]=useState(1);
  const [dayIdx,setDayIdx]=useState(1);
  const [dupMode,setDupMode]=useState(null);
  const [dupTargetWeek,setDupTargetWeek]=useState(1);
  const [dupTargetDay,setDupTargetDay]=useState(1);
  const [incompleteSticky,setIncompleteSticky]=useState(false);

  useEffect(()=>{(async()=>{
    const raw=JSON.parse(await AsyncStorage.getItem(PROGRAMS_KEY)||'[]');
    setSaved(raw);
    const ids=JSON.parse(await AsyncStorage.getItem(ACTIVE_IDS_KEY)||'[]');
    setActiveIds(Array.isArray(ids)?ids:[]);
  })()},[]);

  const savePrograms=async(arr)=>{
    setSaved(arr);
    await AsyncStorage.setItem(PROGRAMS_KEY,JSON.stringify(arr));
  };

  const persistActive=async(ids)=>{
    setActiveIds(ids);
    await AsyncStorage.setItem(ACTIVE_IDS_KEY,JSON.stringify(ids));
  };

  const computeMissing=()=>{
    const miss=[];
    for(let w=1;w<=weeks;w++){
      for(let d=1;d<=days;d++){
        const list=(((plan[w]||{})[d])||[]);
        if(!list.length) miss.push({w,d});
      }
    }
    return miss;
  };

  useEffect(()=>{
    if(incompleteSticky){
      const miss=computeMissing();
      if(miss.length===0) setIncompleteSticky(false);
    }
  },[plan,weeks,days,incompleteSticky]);

  const startFromSaved=async(id)=>{
    const prog=saved.find(x=>x.id===id);
    if(!prog) return;
    const templates=[];
    const map={};
    let dayCounter=1;
    for(let w=1;w<=prog.weeks;w++){
      for(let d=1;d<=prog.days;d++){
        const day=(((prog.plan||{})[w]||{})[d]||[]);
        const tpl={id:`tpl_${prog.id}_${w}_${d}`,name:`${prog.name} W${w}D${d}`,exercises:day.map(e=>({name:e.name,sets:e.sets.map(s=>({weight:s.weight||0,reps:s.reps||0,rpe:s.rpe||7}))}))};
        templates.push(tpl);
        map[String(dayCounter)]=tpl.id;
        dayCounter++;
      }
    }
    const prev=JSON.parse(await AsyncStorage.getItem('day_templates_v1')||'[]');
    const keep=prev.filter(t=>!t.id.startsWith(`tpl_${prog.id}_`));
    await AsyncStorage.setItem('day_templates_v1',JSON.stringify([...keep,...templates]));
    await P.setActive({name:prog.name,weeks:prog.weeks,days:(prog.weeks*prog.days),dayTemplates:map});
    const ids=new Set(activeIds);
    ids.add(id);
    await persistActive(Array.from(ids));
    Alert.alert('Program Started',`${prog.name} added to active.`);
  };

  const stopActive=async(id)=>{
    const ids=activeIds.filter(x=>x!==id);
    await persistActive(ids);
    Alert.alert('Program Stopped','Removed from active.');
  };

  const removeSaved=async(id)=>{
    const arr=saved.filter(x=>x.id!==id);
    await savePrograms(arr);
    if(activeIds.includes(id)){
      await stopActive(id);
    }
  };

  const exercisesForCurrent=useMemo(()=>(((plan[weekIdx]||{})[dayIdx])||[]),[plan,weekIdx,dayIdx]);

  const addExercisesByNames=(names)=>{
    const items=names.map(n=>({name:n,sets:[{weight:'',reps:'',rpe:7}]}));
    setPlan(prev=>{
      const w={...(prev[weekIdx]||{})};
      const d=[...(((prev[weekIdx]||{})[dayIdx])||[]),...items];
      return {...prev,[weekIdx]:{...w,[dayIdx]:d}};
    });
  };

  const addSet=(i)=>{
    setPlan(prev=>{
      const w={...(prev[weekIdx]||{})};
      const d=[...(((prev[weekIdx]||{})[dayIdx])||[])];
      const e={...d[i]};
      e.sets=[...e.sets,{weight:e.sets[e.sets.length-1]?.weight||'',reps:e.sets[e.sets.length-1]?.reps||'',rpe:e.sets[e.sets.length-1]?.rpe||7}];
      d[i]=e;
      return {...prev,[weekIdx]:{...w,[dayIdx]:d}};
    });
  };

  const editSet=(i,si,key,val)=>{
    setPlan(prev=>{
      const w={...(prev[weekIdx]||{})};
      const d=[...(((prev[weekIdx]||{})[dayIdx])||[])];
      const e={...d[i]};
      const s={...e.sets[si],[key]:val};
      e.sets=e.sets.map((x,idx)=>idx===si?s:x);
      d[i]=e;
      return {...prev,[weekIdx]:{...w,[dayIdx]:d}};
    });
  };

  const moveWeek=(to)=>{
    const t=Math.max(1,Math.min(weeks,to));
    setWeekIdx(t);
    setDayIdx(1);
  };

  const openDupDay=()=>{
    setDupMode('day');
    setDupTargetWeek(weekIdx);
    setDupTargetDay(dayIdx);
  };

  const openDupWeek=()=>{
    setDupMode('week');
    setDupTargetWeek(weekIdx<weeks?weekIdx+1:weeks);
  };

  const performDuplicate=()=>{
    if(dupMode==='day'){
      setPlan(prev=>{
        const src=((prev[weekIdx]||{})[dayIdx])||[];
        const w={...(prev[dupTargetWeek]||{})};
        w[dupTargetDay]=JSON.parse(JSON.stringify(src));
        return {...prev,[dupTargetWeek]:w};
      });
    }else if(dupMode==='week'){
      setPlan(prev=>{
        const src=prev[weekIdx]||{};
        const copy={};
        for(let d=1;d<=days;d++){ copy[d]=JSON.parse(JSON.stringify(src[d]||[])); }
        return {...prev,[dupTargetWeek]:copy};
      });
    }
    setDupMode(null);
  };

  const saveProgram=async()=>{
    if(!form.name.trim()||weeks<1||days<1){Alert.alert('Missing info','Enter name, weeks, and days.');return;}
    const miss=[];
    for(let w=1;w<=weeks;w++){
      for(let d=1;d<=days;d++){
        if(!(((plan[w]||{})[d]||[]).length)) miss.push(1);
      }
    }
    if(miss.length){
      setIncompleteSticky(true);
      return;
    }
    const obj={id:String(Date.now()),name:form.name.trim(),weeks,days,plan};
    const arr=[obj,...saved];
    await savePrograms(arr);
    setView('list');
    Alert.alert('Saved',`${obj.name} saved.`);
  };

  const handlePickerDone=(names)=>{
    addExercisesByNames(names);
  };

  if(view==='list'){
    return(
      <View style={{flex:1,backgroundColor:theme.bg}}>
        <ScrollView contentContainerStyle={{padding:16,gap:16}}>
          <Section title="Programs">
            {saved.length===0?<Text style={{color:theme.muted}}>No programs yet.</Text>:null}
            {saved.map(p=>(
              <View key={p.id} style={{paddingVertical:10,borderBottomWidth:1,borderColor:theme.border}}>
                <Text style={{color:theme.text,fontWeight:'600'}}>{p.name}</Text>
                <Text style={{color:theme.muted}}>Weeks {p.weeks} • Days/week {p.days}</Text>
                <View style={{flexDirection:'row',gap:8,marginTop:8}}>
                  {activeIds.includes(p.id)
                    ? <Pressable onPress={()=>stopActive(p.id)} style={{padding:10,borderRadius:8,backgroundColor:theme.surface}}><Text style={{color:theme.text}}>Stop</Text></Pressable>
                    : <Pressable onPress={()=>startFromSaved(p.id)} style={{padding:10,borderRadius:8,backgroundColor:theme.accent}}><Text style={{color:theme.text}}>Start</Text></Pressable>
                  }
                  <Pressable onPress={()=>{setForm({name:p.name,weeks:String(p.weeks),days:String(p.days)});setPlan(p.plan);setWeekIdx(1);setDayIdx(1);setView('create');}} style={{padding:10,borderRadius:8,backgroundColor:theme.surface}}><Text style={{color:theme.text}}>Edit</Text></Pressable>
                  <Pressable onPress={()=>removeSaved(p.id)} style={{padding:10,borderRadius:8,backgroundColor:theme.surface}}><Text style={{color:theme.text}}>Delete</Text></Pressable>
                </View>
              </View>
            ))}
          </Section>
          <Pressable onPress={()=>{setForm({name:'',weeks:'4',days:'4'});setPlan({});setWeekIdx(1);setDayIdx(1);setView('create');}} style={{padding:14,borderRadius:10,backgroundColor:theme.accent,alignItems:'center'}}>
            <Text style={{color:theme.text,fontWeight:'700'}}>Create Program</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const missingCount=(()=>{
    let n=0;
    for(let w=1;w<=weeks;w++){ for(let d=1;d<=days;d++){ if(!(((plan[w]||{})[d]||[]).length)) n++; } }
    return n;
  })();

  return(
    <View style={{flex:1,backgroundColor:theme.bg}}>
      <ScrollView contentContainerStyle={{padding:16,gap:16,paddingBottom:incompleteSticky?80:16}}>
        <Section title="Program Details">
          <Text style={{color:theme.muted,marginBottom:6}}>Name</Text>
          <TextInput value={form.name} onChangeText={(v)=>setForm(s=>({...s,name:v}))} style={{backgroundColor:theme.surface,color:theme.text,padding:10,borderRadius:8}}/>
          <View style={{height:10}}/>
          <View style={{flexDirection:'row',gap:12}}>
            <View style={{flex:1}}>
              <Text style={{color:theme.muted,marginBottom:6}}>Weeks</Text>
              <TextInput value={form.weeks} onChangeText={(v)=>setForm(s=>({...s,weeks:v}))} keyboardType="numeric" style={{backgroundColor:theme.surface,color:theme.text,padding:10,borderRadius:8,textAlign:'center'}}/>
            </View>
            <View style={{flex:1}}>
              <Text style={{color:theme.muted,marginBottom:6}}>Days/Week</Text>
              <TextInput value={form.days} onChangeText={(v)=>setForm(s=>({...s,days:v}))} keyboardType="numeric" style={{backgroundColor:theme.surface,color:theme.text,padding:10,borderRadius:8,textAlign:'center'}}/>
            </View>
          </View>
        </Section>

        <Section title="Schedule Builder">
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8}}>
            {Array.from({length:weeks},(_,i)=>i+1).map(w=>(
              <Pressable key={w} onPress={()=>moveWeek(w)} style={{paddingVertical:6,paddingHorizontal:10,borderRadius:8,backgroundColor:w===weekIdx?theme.accent:theme.surface}}>
                <Text style={{color:theme.text}}>Week {w}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12}}>
            {Array.from({length:days},(_,i)=>i+1).map(d=>(
              <Pressable key={d} onPress={()=>setDayIdx(d)} style={{paddingVertical:6,paddingHorizontal:10,borderRadius:8,backgroundColor:d===dayIdx?theme.accent:theme.surface}}>
                <Text style={{color:theme.text}}>Day {d}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={()=>setPickerOpen(true)} style={{padding:12,borderRadius:10,backgroundColor:theme.accent,alignItems:'center',marginBottom:12}}>
            <Text style={{color:theme.text,fontWeight:'700'}}>Add Exercises</Text>
          </Pressable>

          {exercisesForCurrent.map((e,ei)=>(
            <View key={ei} style={{paddingVertical:10,borderBottomWidth:1,borderColor:theme.border}}>
              <Text style={{color:theme.text,fontWeight:'600',marginBottom:6}}>{e.name}</Text>
              {e.sets.map((s,si)=>(
                <View key={si} style={{flexDirection:'row',gap:8,alignItems:'center',marginBottom:6}}>
                  <Text style={{color:theme.muted,width:28,textAlign:'center'}}>{si+1}</Text>
                  <TextInput value={String(s.weight??'')} onChangeText={(v)=>editSet(ei,si,'weight',v)} keyboardType="numeric" placeholder="lb/kg" placeholderTextColor={theme.muted} style={{flex:1,backgroundColor:theme.surface,color:theme.text,padding:8,borderRadius:8,textAlign:'center'}}/>
                  <TextInput value={String(s.reps??'')} onChangeText={(v)=>editSet(ei,si,'reps',v)} keyboardType="numeric" placeholder="reps" placeholderTextColor={theme.muted} style={{flex:1,backgroundColor:theme.surface,color:theme.text,padding:8,borderRadius:8,textAlign:'center'}}/>
                  <TextInput value={String(s.rpe??'')} onChangeText={(v)=>editSet(ei,si,'rpe',v)} keyboardType="numeric" placeholder="RPE" placeholderTextColor={theme.muted} style={{flex:1,backgroundColor:theme.surface,color:theme.text,padding:8,borderRadius:8,textAlign:'center'}}/>
                </View>
              ))}
              <Pressable onPress={()=>addSet(ei)} style={{padding:10,borderRadius:8,backgroundColor:theme.surface,alignItems:'center'}}>
                <Text style={{color:theme.text}}>Add Set</Text>
              </Pressable>
            </View>
          ))}

          <View style={{flexDirection:'row',gap:8,marginTop:12}}>
            <Pressable onPress={openDupDay} style={{flex:1,padding:12,borderRadius:10,backgroundColor:theme.surface,alignItems:'center'}}>
              <Text style={{color:theme.text}}>Duplicate Day…</Text>
            </Pressable>
            <Pressable onPress={openDupWeek} style={{flex:1,padding:12,borderRadius:10,backgroundColor:theme.surface,alignItems:'center'}}>
              <Text style={{color:theme.text}}>Duplicate Week…</Text>
            </Pressable>
          </View>
        </Section>

        <Pressable onPress={saveProgram} style={{padding:14,borderRadius:10,backgroundColor:theme.accent,alignItems:'center'}}>
          <Text style={{color:theme.text,fontWeight:'700'}}>Review & Save</Text>
        </Pressable>
        <Pressable onPress={()=>setView('list')} style={{padding:12,borderRadius:10,backgroundColor:theme.surface,alignItems:'center'}}>
          <Text style={{color:theme.text}}>Back</Text>
        </Pressable>
      </ScrollView>

      <ExerciseSelectModal visible={pickerOpen} onClose={()=>setPickerOpen(false)} onDone={handlePickerDone} />

      <Modal visible={!!dupMode} transparent animationType="fade" onRequestClose={()=>setDupMode(null)}>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',padding:16}}>
          <View style={{backgroundColor:theme.card,borderRadius:12,padding:12}}>
            <Text style={{color:theme.text,fontWeight:'700',marginBottom:8}}>{dupMode==='day'?'Duplicate Day':'Duplicate Week'}</Text>
            {dupMode==='day'
              ? (
                <View>
                  <Text style={{color:theme.muted,marginBottom:6}}>{`From Week ${weekIdx} Day ${dayIdx} to:`}</Text>
                  <Text style={{color:theme.muted,marginBottom:6}}>Week</Text>
                  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:10}}>
                    {Array.from({length:weeks},(_,i)=>i+1).map(w=>(
                      <Pressable key={w} onPress={()=>setDupTargetWeek(w)} style={{paddingVertical:6,paddingHorizontal:10,borderRadius:8,backgroundColor:dupTargetWeek===w?theme.accent:theme.surface}}>
                        <Text style={{color:theme.text}}>{w}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={{color:theme.muted,marginBottom:6}}>Day</Text>
                  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:10}}>
                    {Array.from({length:days},(_,i)=>i+1).map(d=>(
                      <Pressable key={d} onPress={()=>setDupTargetDay(d)} style={{paddingVertical:6,paddingHorizontal:10,borderRadius:8,backgroundColor:dupTargetDay===d?theme.accent:theme.surface}}>
                        <Text style={{color:theme.text}}>{d}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )
              : (
                <View>
                  <Text style={{color:theme.muted,marginBottom:6}}>{`From Week ${weekIdx} to:`}</Text>
                  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:10}}>
                    {Array.from({length:weeks},(_,i)=>i+1).map(w=>(
                      <Pressable key={w} onPress={()=>setDupTargetWeek(w)} style={{paddingVertical:6,paddingHorizontal:10,borderRadius:8,backgroundColor:dupTargetWeek===w?theme.accent:theme.surface}}>
                        <Text style={{color:theme.text}}>{w}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )
            }
            <View style={{flexDirection:'row',gap:10,marginTop:6}}>
              <Pressable onPress={()=>setDupMode(null)} style={{flex:1,padding:12,borderRadius:10,backgroundColor:theme.surface,alignItems:'center'}}>
                <Text style={{color:theme.text}}>Cancel</Text>
              </Pressable>
              <Pressable onPress={performDuplicate} style={{flex:1,padding:12,borderRadius:10,backgroundColor:theme.accent,alignItems:'center'}}>
                <Text style={{color:theme.text,fontWeight:'700'}}>Duplicate</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {incompleteSticky && missingCount>0 ? (
        <View style={{position:'absolute',left:0,right:0,bottom:0,backgroundColor:'#0b2533',padding:12,borderTopWidth:1,borderColor:theme.border}}>
          <Text style={{color:theme.text}}>
            Add at least one exercise to every day of every week. Missing: {missingCount}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
