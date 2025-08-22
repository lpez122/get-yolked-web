import React,{useEffect,useMemo,useState} from 'react';
import {View,Text,Pressable,FlatList} from 'react-native';
import {theme} from '../constants/theme';
import {getHistory,clearHistory} from '../utils/history';

function startOfMonth(d){return new Date(d.getFullYear(),d.getMonth(),1)}
function endOfMonth(d){return new Date(d.getFullYear(),d.getMonth()+1,0)}
function daysInMonth(d){const e=endOfMonth(d);return e.getDate()}
function ymd(ms){const d=new Date(ms);const y=d.getFullYear();const m=d.getMonth()+1;const dd=d.getDate();return `${y}-${String(m).padStart(2,'0')}-${String(dd).padStart(2,'0')}`}
function fmt(sec){const s=Math.max(0,Math.floor(sec));const h=Math.floor(s/3600);const m=Math.floor((s%3600)/60);const r=s%60;return (h?`${h}:`:'')+String(m).padStart(2,'0')+':'+String(r).padStart(2,'0')}

export default function HistoryScreen(){
  const [items,setItems]=useState([]);
  const [month,setMonth]=useState(()=>new Date());
  const [selected,setSelected]=useState(null);

  useEffect(()=>{load()},[]);
  async function load(){const arr=await getHistory();setItems(arr)}

  const grouped=useMemo(()=>{
    const g={}; for(const w of items){const k=ymd(w.endedAt||w.startedAt||Date.now()); if(!g[k]) g[k]=[]; g[k].push(w)} return g;
  },[items]);

  const year=month.getFullYear();
  const mon=month.getMonth();
  const dim=daysInMonth(month);
  const firstDow=startOfMonth(month).getDay();
  const cells=useMemo(()=>{
    const arr=[]; for(let i=0;i<firstDow;i++) arr.push(null); for(let d=1;d<=dim;d++) arr.push(new Date(year,mon,d)); return arr;
  },[month,dim,firstDow,year,mon]);

  const selKey=selected?ymd(selected):null;

  return(
    <View style={{flex:1,backgroundColor:theme.bg,padding:16}}>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <Pressable onPress={()=>setMonth(new Date(year,mon-1,1))} style={{paddingHorizontal:12,paddingVertical:8,backgroundColor:'#0F1A26',borderRadius:10}}><Text style={{color:theme.text}}>{'<'}</Text></Pressable>
        <Text style={{color:theme.text,fontSize:18,fontWeight:'800'}}>{month.toLocaleString(undefined,{month:'long'})} {year}</Text>
        <Pressable onPress={()=>setMonth(new Date(year,mon+1,1))} style={{paddingHorizontal:12,paddingVertical:8,backgroundColor:'#0F1A26',borderRadius:10}}><Text style={{color:theme.text}}>{'>'}</Text></Pressable>
      </View>

      <View style={{flexDirection:'row',flexWrap:'wrap',borderWidth:1,borderColor:theme.border,borderRadius:12,overflow:'hidden',marginBottom:12}}>
        {cells.map((d,i)=>{
          if(!d) return <View key={i} style={{width:'14.285%',aspectRatio:1,backgroundColor:theme.card}}/>;
          const key=ymd(d.getTime());
          const has=grouped[key]&&grouped[key].length;
          const isSel=selKey===key;
          return(
            <Pressable key={i} onPress={()=>setSelected(d)} style={{width:'14.285%',aspectRatio:1,alignItems:'center',justifyContent:'center',backgroundColor:isSel?theme.accent:theme.card,borderRightWidth:(i%7===6)?0:1,borderBottomWidth:1,borderColor:theme.border}}>
              <Text style={{color:isSel?'#fff':theme.text,fontWeight:'800'}}>{d.getDate()}</Text>
              {has?<View style={{marginTop:6,width:8,height:8,borderRadius:4,backgroundColor:isSel?'#fff':theme.accent}}/>:null}
            </Pressable>
          )
        })}
      </View>

      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <Text style={{color:theme.text,fontWeight:'800'}}>Details</Text>
        <Pressable onPress={async()=>{await clearHistory();setSelected(null);load()}} style={{paddingHorizontal:12,paddingVertical:8,backgroundColor:theme.accent,borderRadius:10}}><Text style={{color:'#fff',fontWeight:'800'}}>Clear</Text></Pressable>
      </View>

      <FlatList
        data={grouped[selKey]||[]}
        keyExtractor={(_,i)=>String(i)}
        renderItem={({item})=>{
          const exs=item.exercises||[];
          return(
            <View style={{backgroundColor:theme.card,borderRadius:12,padding:12,marginBottom:10}}>
              <Text style={{color:theme.text,fontWeight:'700'}}>{item.programName||'Workout'} • {fmt(Number(item.durationSec||0))}</Text>
              {exs.map((ex,i)=>(
                <View key={i} style={{marginTop:6,backgroundColor:theme.surface,borderRadius:10,padding:8}}>
                  <Text style={{color:theme.text,fontWeight:'700'}}>{ex.name}</Text>
                  {(ex.sets||[]).map((s,j)=>(
                    <View key={j} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:4,borderBottomWidth:j<(ex.sets.length-1)?1:0,borderBottomColor:theme.border}}>
                      <Text style={{color:theme.textDim}}>Set {j+1}</Text>
                      <Text style={{color:theme.text}}>{String(s.lbs||0)} lb × {String(s.reps||0)}  RPE {String(s.rpe||7)}</Text>
                      <Text style={{color:s.done?theme.accent:theme.textDim,fontWeight:'800'}}>{s.done?'✓':'○'}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )
        }}
        ListEmptyComponent={<Text style={{color:theme.textDim}}>Select a highlighted day.</Text>}
      />
    </View>
  )
}
