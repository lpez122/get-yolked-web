import React,{useMemo,useState,useEffect} from 'react';
import {View,Text,TextInput,Pressable,ScrollView,Alert} from 'react-native';
import {theme} from '../constants/theme';
import ExercisePicker from '../components/ExercisePicker';
import {getSavedPrograms,savePrograms,deleteProgram,startProgramById,getActive,stopActive} from '../utils/programState';
import {useNavigation} from '@react-navigation/native';

function defSet(){return {weight:0,reps:0,rpe:7}}
function ensure(plan,w,d){const W=String(w),D=String(d);if(!plan[W]) plan[W]={}; if(!Array.isArray(plan[W][D])) plan[W][D]=[]; return plan}
function newProg(){return {id:String(Date.now()),name:'New Program',weeks:1,days:3,plan:{'1':{'1':[]}},cursorW:1,cursorD:1}}

export default function ProgramsScreen(){
  const nav=useNavigation();
  const [p,setP]=useState(newProg());
  const [pickerOpen,setPickerOpen]=useState(false);
  const [saved,setSaved]=useState([]);
  const [active,setActive]=useState(null);

  async function loadSaved(){setSaved(await getSavedPrograms());setActive(await getActive())}
  useEffect(()=>{loadSaved()},[])

  function setField(k,v){setP(prev=>({...prev,[k]:v}))}
  function inc(field,delta,min,max){
    setP(prev=>{
      let v=Number(prev[field]||0)+delta; if(isNaN(v)) v=min; v=Math.max(min,Math.min(max,v));
      const next={...prev,[field]:v};
      for(let w=1; w<=next.weeks; w++){for(let d=1; d<=next.days; d++){ensure(next.plan,w,d)}}
      if(next.cursorW>next.weeks) next.cursorW=next.weeks;
      if(next.cursorD>next.days) next.cursorD=next.days;
      return next;
    })
  }
  function move(field,delta,limitField){
    setP(prev=>{const lim=Number(prev[limitField]||1);let v=Number(prev[field]||1)+delta; if(v<1)v=1; if(v>lim)v=lim; return {...prev,[field]:v}})
  }

  function openPicker(){setPickerOpen(true)}
  function onConfirm(list){
    if(!Array.isArray(list)||!list.length){setPickerOpen(false);return}
    setP(prev=>{
      const plan={...prev.plan}; ensure(plan,prev.cursorW,prev.cursorD);
      const mapped=list.map(x=>({name:x.name,sets:[defSet()]}));
      plan[String(prev.cursorW)][String(prev.cursorD)]=[...plan[String(prev.cursorW)][String(prev.cursorD)],...mapped];
      return {...prev,plan};
    });
    setPickerOpen(false);
  }

  const dayItems=useMemo(()=>(((p.plan||{})[String(p.cursorW)]||{})[String(p.cursorD)]||[]),[p]);

  function setSets(idx,count){
    setP(prev=>{
      const plan={...prev.plan}; ensure(plan,prev.cursorW,prev.cursorD);
      const arr=plan[String(prev.cursorW)][String(prev.cursorD)].slice();
      const it={...arr[idx]};
      const c=Math.max(1,Number(count||1));
      it.sets=Array.from({length:c},(_,i)=>it.sets?.[i]??defSet());
      arr[idx]=it; plan[String(prev.cursorW)][String(prev.cursorD)]=arr;
      return {...prev,plan};
    })
  }
  function setReps(idx,val){
    setP(prev=>{
      const plan={...prev.plan}; ensure(plan,prev.cursorW,prev.cursorD);
      const arr=plan[String(prev.cursorW)][String(prev.cursorD)].slice();
      const it={...arr[idx]};
      const reps=Math.max(0,Number(val||0));
      it.sets=(it.sets||[]).map(s=>({weight:s.weight??0,reps,rpe:s.rpe??7}));
      arr[idx]=it; plan[String(prev.cursorW)][String(prev.cursorD)]=arr;
      return {...prev,plan};
    })
  }
  function setRpe(idx,val){
    setP(prev=>{
      const plan={...prev.plan}; ensure(plan,prev.cursorW,prev.cursorD);
      const arr=plan[String(prev.cursorW)][String(prev.cursorD)].slice();
      const it={...arr[idx]};
      const rpe=Math.max(1,Math.min(10,Number(val||7)));
      it.sets=(it.sets||[]).map(s=>({weight:s.weight??0,reps:s.reps??0,rpe}));
      arr[idx]=it; plan[String(prev.cursorW)][String(prev.cursorD)]=arr;
      return {...prev,plan};
    })
  }

  async function save(){
    const list=await getSavedPrograms();
    const idx=list.findIndex(x=>String(x.id)===String(p.id));
    const store={id:p.id,name:p.name,weeks:p.weeks,days:p.days,plan:p.plan};
    if(idx>=0) list[idx]=store; else list.push(store);
    await savePrograms(list);
    Alert.alert('Saved','Program saved');
    setP(newProg());
    loadSaved();
  }

  async function activate(id){
    await startProgramById(id);
    setActive(await getActive());
    nav.navigate('Home');
  }
  async function deactivate(){
    await stopActive();
    setActive(null);
  }

  function loadForEdit(item){setP({...item,cursorW:1,cursorD:1})}
  async function removeProg(id){await deleteProgram(id);loadSaved()}

  return(
    <ScrollView style={{flex:1,backgroundColor:theme.bg}} contentContainerStyle={{padding:16}}>
      <View style={{backgroundColor:theme.card,borderRadius:16,padding:14,marginBottom:16}}>
        <Text style={{color:theme.text,fontWeight:'800',fontSize:18,marginBottom:10}}>Your Programs</Text>
        {saved.length===0?(
          <Text style={{color:theme.textDim}}>No saved programs yet.</Text>
        ):(
          saved.map(item=>{
            const isActive=active&&String(active.id)===String(item.id);
            return (
              <View key={item.id} style={{paddingVertical:10,borderBottomWidth:1,borderBottomColor:theme.border}}>
                <Text style={{color:theme.text,fontWeight:'700'}} numberOfLines={1}>{item.name}</Text>
                <Text style={{color:theme.textDim,marginTop:2}}>Weeks {item.weeks||1} • Days {item.days||1}</Text>
                <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:10}}>
                  {isActive?(
                    <Pressable onPress={deactivate} style={{paddingHorizontal:12,paddingVertical:9,backgroundColor:'#273241',borderRadius:10}}>
                      <Text style={{color:'#fff',fontWeight:'700'}}>Deactivate</Text>
                    </Pressable>
                  ):(
                    <Pressable onPress={()=>activate(item.id)} style={{paddingHorizontal:12,paddingVertical:9,backgroundColor:theme.accent,borderRadius:10}}>
                      <Text style={{color:'#fff',fontWeight:'800'}}>Activate</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={()=>loadForEdit(item)} style={{paddingHorizontal:12,paddingVertical:9,backgroundColor:'#1B2733',borderRadius:10}}>
                    <Text style={{color:theme.text,fontWeight:'700'}}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={()=>removeProg(item.id)} style={{paddingHorizontal:12,paddingVertical:9,backgroundColor:'#2b1111',borderRadius:10}}>
                    <Text style={{color:'#fff',fontWeight:'700'}}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            )
          })
        )}
      </View>

      <View style={{backgroundColor:theme.card,borderRadius:16,padding:14,marginBottom:16}}>
        <Text style={{color:theme.text,fontWeight:'800',fontSize:18,marginBottom:10}}>Program Details</Text>
        <Text style={{color:theme.textDim,marginBottom:6}}>Name</Text>
        <TextInput value={p.name} onChangeText={t=>setField('name',t)} placeholder="Name" placeholderTextColor={theme.textDim} style={{borderWidth:1,borderColor:theme.border,borderRadius:12,paddingHorizontal:12,paddingVertical:10,color:theme.text,backgroundColor:theme.surface,marginBottom:12}}/>
        <View style={{flexDirection:'row',gap:12,marginBottom:12}}>
          <View style={{flex:1}}>
            <Text style={{color:theme.textDim,marginBottom:6}}>Weeks</Text>
            <View style={{flexDirection:'row',gap:8}}>
              <Pressable onPress={()=>inc('weeks',-1,1,52)} style={{paddingHorizontal:14,paddingVertical:10,backgroundColor:'#0F1A26',borderRadius:12}}><Text style={{color:theme.text}}>-</Text></Pressable>
              <TextInput editable={false} value={String(p.weeks)} style={{flex:1,textAlign:'center',borderWidth:1,borderColor:theme.border,borderRadius:12,color:theme.text,paddingVertical:10,backgroundColor:theme.surface}}/>
              <Pressable onPress={()=>inc('weeks',1,1,52)} style={{paddingHorizontal:14,paddingVertical:10,backgroundColor:'#0F1A26',borderRadius:12}}><Text style={{color:theme.text}}>+</Text></Pressable>
            </View>
          </View>
          <View style={{flex:1}}>
            <Text style={{color:theme.textDim,marginBottom:6}}>Days/Week</Text>
            <View style={{flexDirection:'row',gap:8}}>
              <Pressable onPress={()=>inc('days',-1,1,7)} style={{paddingHorizontal:14,paddingVertical:10,backgroundColor:'#0F1A26',borderRadius:12}}><Text style={{color:theme.text}}>-</Text></Pressable>
              <TextInput editable={false} value={String(p.days)} style={{flex:1,textAlign:'center',borderWidth:1,borderColor:theme.border,borderRadius:12,color:theme.text,paddingVertical:10,backgroundColor:theme.surface}}/>
              <Pressable onPress={()=>inc('days',1,1,7)} style={{paddingHorizontal:14,paddingVertical:10,backgroundColor:'#0F1A26',borderRadius:12}}><Text style={{color:theme.text}}>+</Text></Pressable>
            </View>
          </View>
        </View>

        <Text style={{color:theme.text,fontWeight:'800',fontSize:18,marginTop:6,marginBottom:10}}>Schedule Builder</Text>
        <View style={{flexDirection:'row',alignItems:'center',gap:12,marginBottom:12}}>
          <Text style={{color:theme.textDim}}>Week {p.cursorW}</Text>
          <Pressable onPress={()=>move('cursorW',-1,'weeks')} style={{paddingHorizontal:10,paddingVertical:8,backgroundColor:'#0F1A26',borderRadius:10}}><Text style={{color:theme.text}}>-</Text></Pressable>
          <Pressable onPress={()=>move('cursorW',1,'weeks')} style={{paddingHorizontal:10,paddingVertical:8,backgroundColor:'#0F1A26',borderRadius:10}}><Text style={{color:theme.text}}>+</Text></Pressable>
          <View style={{width:16}}/>
          <Text style={{color:theme.textDim}}>Day {p.cursorD}</Text>
          <Pressable onPress={()=>move('cursorD',-1,'days')} style={{paddingHorizontal:10,paddingVertical:8,backgroundColor:'#0F1A26',borderRadius:10}}><Text style={{color:theme.text}}>-</Text></Pressable>
          <Pressable onPress={()=>move('cursorD',1,'days')} style={{paddingHorizontal:10,paddingVertical:8,backgroundColor:'#0F1A26',borderRadius:10}}><Text style={{color:theme.text}}>+</Text></Pressable>
        </View>

        <Pressable onPress={openPicker} style={{backgroundColor:theme.accent,borderRadius:12,paddingVertical:14,alignItems:'center',marginBottom:10}}>
          <Text style={{color:'#fff',fontWeight:'800'}}>Add Exercises</Text>
        </Pressable>

        {dayItems.map((it,idx)=>(
          <View key={idx} style={{backgroundColor:theme.surface,borderRadius:12,padding:12,marginBottom:10,borderWidth:1,borderColor:theme.border}}>
            <Text style={{color:theme.text,fontWeight:'700',marginBottom:10}} numberOfLines={1}>{it.name}</Text>
            <View style={{flexDirection:'row',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                <Text style={{color:theme.textDim}}>Sets</Text>
                <TextInput keyboardType="number-pad" value={String(it.sets?.length||1)} onChangeText={(t)=>setSets(idx,Number(t||1))} style={{width:64,textAlign:'center',borderWidth:1,borderColor:theme.border,borderRadius:10,color:theme.text,paddingVertical:8,backgroundColor:'#0F141B'}}/>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                <Text style={{color:theme.textDim}}>Reps</Text>
                <TextInput keyboardType="number-pad" value={String(it.sets?.[0]?.reps??0)} onChangeText={(t)=>setReps(idx,Number(t||0))} style={{width:64,textAlign:'center',borderWidth:1,borderColor:theme.border,borderRadius:10,color:theme.text,paddingVertical:8,backgroundColor:'#0F141B'}}/>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                <Text style={{color:theme.textDim}}>RPE</Text>
                <TextInput keyboardType="number-pad" value={String(it.sets?.[0]?.rpe??7)} onChangeText={(t)=>setRpe(idx,Number(t||7))} style={{width:64,textAlign:'center',borderWidth:1,borderColor:theme.border,borderRadius:10,color:theme.text,paddingVertical:8,backgroundColor:'#0F141B'}}/>
              </View>
            </View>
          </View>
        ))}

        <Pressable onPress={save} style={{backgroundColor:theme.accent,borderRadius:12,paddingVertical:14,alignItems:'center',marginTop:8}}>
          <Text style={{color:'#fff',fontWeight:'800'}}>Review & Save</Text>
        </Pressable>
        <Pressable onPress={()=>activate(p.id)} style={{backgroundColor:'#173152',borderRadius:12,paddingVertical:14,alignItems:'center',marginTop:10}}>
          <Text style={{color:'#fff',fontWeight:'800'}}>Activate This Program</Text>
        </Pressable>
      </View>

      <ExercisePicker visible={pickerOpen} onClose={()=>setPickerOpen(false)} onConfirm={onConfirm} multi={true}/>
    </ScrollView>
  )
}
