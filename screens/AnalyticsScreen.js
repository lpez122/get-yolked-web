import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { theme } from '../constants/theme';
import { getHistory } from '../contexts/HistoryStore';
import { useSettings } from '../contexts/SettingsContext';

const HISTORY_KEY = 'workout_history_v1';

function fmtDate(iso){ const d=new Date(iso); return d.toLocaleString(); }

export default function AnalyticsScreen(){
  const [records,setRecords]=useState([]);
  const [filterType,setFilterType]=useState('all'); // all | day | month | year | exercise
  const [filterValue,setFilterValue]=useState('');
  const { settings } = useSettings();
  useEffect(()=>{(async()=>{
    try{ 
      const all = await getHistory(); 
      const filtered = settings?.id ? all.filter(r => String(r?.user?.id) === String(settings.id)) : all; 
      setRecords(filtered || []); 
    }catch(e){}
  })();},[settings?.id]);

  const filtered = useMemo(()=>{
    if(!filterType || filterType==='all') return records;
    if(filterType==='exercise'){
      const q = (filterValue||'').trim().toLowerCase();
      if(!q) return records;
      return records.filter(r => (r.exercises||[]).some(ex => String(ex.name||'').toLowerCase().includes(q)));
    }
    // day/month/year filter by dateISO
    return records.filter(r=>{
      const d = new Date(r.dateISO||r.startedAt||r.endedAt||Date.now());
      const v = new Date(filterValue || '');
      if(!filterValue) return true;
      if(filterType==='day') return d.toDateString() === v.toDateString();
      if(filterType==='month') return d.getFullYear()===v.getFullYear() && d.getMonth()===v.getMonth();
      if(filterType==='year') return d.getFullYear()===v.getFullYear();
      return true;
    });
  },[records,filterType,filterValue]);

  return (
    <ScrollView style={{flex:1,backgroundColor:theme.bg}} contentContainerStyle={{padding:16,gap:12}}>
      <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
        <Pressable onPress={()=>{setFilterType('all');setFilterValue('')}} style={{padding:8,backgroundColor:filterType==='all'?theme.accent:theme.card,borderRadius:8}}><Text style={{color:filterType==='all'?'#fff':theme.text}}>All</Text></Pressable>
        <Pressable onPress={()=>{setFilterType('day');setFilterValue('')}} style={{padding:8,backgroundColor:filterType==='day'?theme.accent:theme.card,borderRadius:8}}><Text style={{color:filterType==='day'?'#fff':theme.text}}>Day</Text></Pressable>
        <Pressable onPress={()=>{setFilterType('month');setFilterValue('')}} style={{padding:8,backgroundColor:filterType==='month'?theme.accent:theme.card,borderRadius:8}}><Text style={{color:filterType==='month'?'#fff':theme.text}}>Month</Text></Pressable>
        <Pressable onPress={()=>{setFilterType('year');setFilterValue('')}} style={{padding:8,backgroundColor:filterType==='year'?theme.accent:theme.card,borderRadius:8}}><Text style={{color:filterType==='year'?'#fff':theme.text}}>Year</Text></Pressable>
        <Pressable onPress={()=>{setFilterType('exercise');setFilterValue('')}} style={{padding:8,backgroundColor:filterType==='exercise'?theme.accent:theme.card,borderRadius:8}}><Text style={{color:filterType==='exercise'?'#fff':theme.text}}>Exercise</Text></Pressable>
      </View>

      {filterType!=='all' && (
        <View>
          <Text style={{color:theme.muted,fontSize:12,marginBottom:6}}>Filter value</Text>
          <TextInput
            placeholder={filterType==='exercise' ? 'exercise name' : 'YYYY-MM-DD (for day/month) or YYYY (for year)'}
            placeholderTextColor={theme.muted}
            value={filterValue}
            onChangeText={setFilterValue}
            style={{backgroundColor:theme.card,borderWidth:1,borderColor:theme.border,color:theme.text,padding:10,borderRadius:8}}
          />
        </View>
      )}

      <Text style={{color:theme.text,fontWeight:'800',fontSize:18}}>History ({filtered.length})</Text>

      {filtered.map((r,idx)=>(
        <View key={idx} style={{backgroundColor:theme.card,borderRadius:12,padding:12}}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <Text style={{color:theme.text,fontWeight:'700'}}>{fmtDate(r.dateISO||r.startedAt||r.endedAt)}</Text>
            <Text style={{color:theme.muted}}>{r.totalSets || (r.exercises? r.exercises.reduce((a,ex)=>a+ (ex.sets||0),0):0)} sets</Text>
          </View>
          <View style={{marginTop:8}}>
            <Text style={{color:theme.muted}}>Reps: <Text style={{color:theme.text,fontWeight:'700'}}>{r.totalReps??'–'}</Text>  Volume: <Text style={{color:theme.text,fontWeight:'700'}}>{r.totalVolume??'–'}</Text>  Calories: <Text style={{color:theme.text,fontWeight:'700'}}>{r.calories??'–'}</Text></Text>
          </View>
          <View style={{marginTop:8,borderTopWidth:1,borderTopColor:theme.border,paddingTop:8}}>
            {(r.exercises||[]).map((ex,i)=>(
              <View key={i} style={{marginBottom:6}}>
                <Text style={{color:theme.accent,fontWeight:'700'}}>{ex.name}</Text>
                <Text style={{color:theme.muted}}>{ex.sets || (ex.sets && ex.sets.length) ? `${ex.sets || ex.sets.length} sets` : ''} · {ex.reps??'–'} reps · {ex.volume??'–'} vol</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
