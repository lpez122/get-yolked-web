import React,{useEffect,useMemo,useState} from 'react';
import {View,Text,Pressable,ScrollView,Modal,FlatList} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {theme} from '../constants/theme';

function fmt(sec){const s=Math.max(0,Math.floor(Number(sec||0)));const h=Math.floor(s/3600);const m=Math.floor((s%3600)/60);const r=s%60;return (h?`${h}:`:'')+String(m).padStart(2,'0')+':'+String(r).padStart(2,'0')}
function keyOf(ms){const d=new Date(ms||Date.now());const y=d.getFullYear();const m=d.getMonth()+1;const day=d.getDate();return `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`}
function startOfMonth(d){return new Date(d.getFullYear(),d.getMonth(),1)}
function endOfMonth(d){return new Date(d.getFullYear(),d.getMonth()+1,0)}
function monthMatrix(d){
  const y=d.getFullYear();const m=d.getMonth();
  const firstIdx=new Date(y,m,1).getDay();
  const days=endOfMonth(d).getDate();
  const prevDays=endOfMonth(new Date(y,m-1,1)).getDate();
  const out=[];
  for(let r=0;r<6;r++){
    const row=[];
    for(let c=0;c<7;c++){
      const idx=r*7+c;
      let dayNum,moff,inMonth=true;
      if(idx<firstIdx){dayNum=prevDays-firstIdx+idx+1;moff=-1;inMonth=false}
      else if(idx>=firstIdx+days){dayNum=idx-(firstIdx+days)+1;moff=1;inMonth=false}
      else {dayNum=idx-firstIdx+1;moff=0;inMonth=true}
      const ds=keyOf(new Date(y,m+moff,dayNum));
      row.push({label:String(dayNum),dateStr:ds,inMonth});
    }
    out.push(row);
  }
  return out;
}
async function getHistory(){try{const raw=await AsyncStorage.getItem('workout_history_v1');return JSON.parse(raw||'[]')}catch(e){return []}}
async function clearHistory(){await AsyncStorage.removeItem('workout_history_v1')}

export default function History(){
  const [month,setMonth]=useState(startOfMonth(new Date()));
  const [items,setItems]=useState([]);
  const [selected,setSelected]=useState(keyOf(Date.now()));
  const [pickMonth,setPickMonth]=useState(false);
  const [pickYear,setPickYear]=useState(false);

  async function load(){const arr=await getHistory();setItems(Array.isArray(arr)?arr:[])}
  useEffect(()=>{load()},[]);

  const byDate=useMemo(()=>{const m={};for(const w of items){const k=keyOf(w.endedAt||w.startedAt||Date.now());if(!m[k])m[k]=[];m[k].push(w)}return m},[items]);
  const grid=useMemo(()=>monthMatrix(month),[month]);
  const workouts=byDate[selected]||[];

  const months=useMemo(()=>['January','February','March','April','May','June','July','August','September','October','November','December'],[]);
  const years=useMemo(()=>{
    const now=new Date().getFullYear();
    let min=now,max=now;
    for(const w of items){const y=new Date(w.endedAt||w.startedAt||Date.now()).getFullYear();if(y<min)min=y;if(y>max)max=y}
    min=Math.min(min,now-5);max=Math.max(max,now+1);
    const out=[];for(let y=min;y<=max;y++) out.push(y);return out;
  },[items]);

  function onSelectMonth(idx){const y=month.getFullYear();setMonth(startOfMonth(new Date(y,idx,1)));setPickMonth(false)}
  function onSelectYear(y){const m=month.getMonth();setMonth(startOfMonth(new Date(y,m,1)));setPickYear(false)}
  async function doClear(){await clearHistory();await load()}

  return(
    <View style={{flex:1,backgroundColor:theme.bg}}>
      <View style={{paddingHorizontal:16,paddingTop:12,paddingBottom:6}}>
        <Text style={{color:theme.text,fontSize:20,fontWeight:'800',marginBottom:10}}>History</Text>
        <View style={{flexDirection:'row',gap:10}}>
          <Pressable onPress={()=>setPickMonth(true)} style={{flex:1,backgroundColor:theme.card,borderRadius:12,paddingVertical:10,alignItems:'center',borderWidth:1,borderColor:theme.border}}>
            <Text style={{color:theme.text,fontWeight:'700'}}>{months[month.getMonth()]}</Text>
          </Pressable>
          <Pressable onPress={()=>setPickYear(true)} style={{width:120,backgroundColor:theme.card,borderRadius:12,paddingVertical:10,alignItems:'center',borderWidth:1,borderColor:theme.border}}>
            <Text style={{color:theme.text,fontWeight:'700'}}>{month.getFullYear()}</Text>
          </Pressable>
          <Pressable onPress={doClear} style={{width:100,backgroundColor:theme.accent,borderRadius:12,paddingVertical:10,alignItems:'center'}}>
            <Text style={{color:'#fff',fontWeight:'800'}}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={{marginHorizontal:12,marginTop:12,backgroundColor:theme.card,borderRadius:12,padding:10}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6}}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><Text key={d} style={{flex:1,textAlign:'center',color:theme.textDim,fontWeight:'700'}}>{d}</Text>)}
        </View>
        {grid.map((row,ri)=>(
          <View key={ri} style={{flexDirection:'row',marginBottom:6}}>
            {row.map(cell=>{
              const has=(byDate[cell.dateStr]||[]).length>0;
              const sel=selected===cell.dateStr;
              const bg=has?theme.accent:(sel?'#0F1A26':'transparent');
              const tc=has?'#fff':(cell.inMonth?theme.text:theme.textDim);
              return(
                <Pressable key={cell.dateStr} onPress={()=>setSelected(cell.dateStr)} style={{flex:1,alignItems:'center',paddingVertical:12,borderRadius:10,backgroundColor:bg,marginHorizontal:2}}>
                  <Text style={{color:tc,fontWeight:'800'}}>{cell.label}</Text>
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{padding:16}}>
        <Text style={{color:theme.text,fontSize:16,fontWeight:'800',marginBottom:8}}>{new Date(selected).toLocaleDateString()}</Text>
        {workouts.length===0?(
          <Text style={{color:theme.textDim}}>No workouts.</Text>
        ):workouts.map((w,i)=>{
          const exs=Array.isArray(w.exercises)?w.exercises:[]; 
          const totalSets=exs.reduce((n,e)=>n+(Array.isArray(e.sets)?e.sets.length:0),0);
          const doneSets=exs.reduce((n,e)=>n+(Array.isArray(e.sets)?e.sets.filter(s=>s&&s.done).length:0),0);
          return(
            <View key={i} style={{backgroundColor:theme.card,borderRadius:12,padding:12,marginBottom:12}}>
              <Text style={{color:theme.text,fontWeight:'800'}}>{w.programName||'Workout'}</Text>
              <Text style={{color:theme.textDim,marginTop:4}}>Duration {fmt(w.durationSec)} • Sets {doneSets}/{totalSets}</Text>
              <View style={{marginTop:8}}>
                {exs.map((ex,ei)=>(
                  <View key={ei} style={{backgroundColor:theme.surface,borderRadius:10,padding:10,marginBottom:8}}>
                    <Text style={{color:theme.text,fontWeight:'700'}}>{ex.name||'Exercise'}</Text>
                    {(ex.sets||[]).map((s,si)=>{
                      const lbs=s.lbs??s.weight??0;
                      const reps=s.reps??0;
                      const rpe=s.rpe??null;
                      const mark=s.done?'✓':'○';
                      return(
                        <View key={si} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:4,borderBottomWidth:si<(ex.sets.length-1)?1:0,borderBottomColor:theme.border}}>
                          <Text style={{color:theme.textDim}}>Set {si+1}</Text>
                          <Text style={{color:theme.text}}>{String(lbs)} lb × {String(reps)}{rpe!==null?` @ RPE ${String(rpe)}`:''}</Text>
                          <Text style={{color:s.done?theme.accent:'#334B63',fontWeight:'800'}}>{mark}</Text>
                        </View>
                      )
                    })}
                  </View>
                ))}
              </View>
            </View>
          )
        })}
      </ScrollView>

      <Modal visible={pickMonth} transparent animationType="fade" onRequestClose={()=>setPickMonth(false)}>
        <View style={{flex:1,backgroundColor:'#0009',alignItems:'center',justifyContent:'center'}}>
          <View style={{backgroundColor:theme.card,borderRadius:14,padding:12,width:'80%',maxHeight:'70%'}}>
            <Text style={{color:theme.text,fontWeight:'800',fontSize:18,marginBottom:10}}>Select Month</Text>
            <FlatList
              data={months.map((m,i)=>({label:m,index:i}))}
              keyExtractor={(x)=>String(x.index)}
              renderItem={({item})=>(
                <Pressable onPress={()=>onSelectMonth(item.index)} style={{padding:12,borderBottomWidth:1,borderBottomColor:theme.border}}>
                  <Text style={{color:theme.text}}>{item.label}</Text>
                </Pressable>
              )}
            />
            <Pressable onPress={()=>setPickMonth(false)} style={{marginTop:10,alignSelf:'flex-end',paddingHorizontal:14,paddingVertical:10,backgroundColor:theme.accent,borderRadius:10}}>
              <Text style={{color:'#fff',fontWeight:'800'}}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={pickYear} transparent animationType="fade" onRequestClose={()=>setPickYear(false)}>
        <View style={{flex:1,backgroundColor:'#0009',alignItems:'center',justifyContent:'center'}}>
          <View style={{backgroundColor:theme.card,borderRadius:14,padding:12,width:'60%',maxHeight:'70%'}}>
            <Text style={{color:theme.text,fontWeight:'800',fontSize:18,marginBottom:10}}>Select Year</Text>
            <FlatList
              data={years}
              keyExtractor={(y)=>String(y)}
              renderItem={({item})=>(
                <Pressable onPress={()=>onSelectYear(item)} style={{padding:12,borderBottomWidth:1,borderBottomColor:theme.border}}>
                  <Text style={{color:theme.text}}>{item}</Text>
                </Pressable>
              )}
            />
            <Pressable onPress={()=>setPickYear(false)} style={{marginTop:10,alignSelf:'flex-end',paddingHorizontal:14,paddingVertical:10,backgroundColor:theme.accent,borderRadius:10}}>
              <Text style={{color:'#fff',fontWeight:'800'}}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}
