import React,{useEffect,useMemo,useState} from 'react';
import {Modal,View,Text,TextInput,Pressable,FlatList,ScrollView} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {theme} from '../constants/theme';

async function readJSON(k){try{const v=await AsyncStorage.getItem(k);return v?JSON.parse(v):null}catch(e){return null}}
async function loadLibrary(){
  const v2=await readJSON('exercise_library_v2'); if(Array.isArray(v2)) return v2;
  const gy=await readJSON('getYolkedData'); if(gy&&Array.isArray(gy.exercises)) return gy.exercises;
  return [];
}
function uniq(arr){const s=new Set();const out=[];for(const x of arr){const v=String(x||'').trim();if(v&&!s.has(v.toLowerCase())){s.add(v.toLowerCase());out.push(v)}}return out}
function musclesOf(x){const a=[...(x.primaryMuscles||[]),...(x.secondaryMuscles||[]),...(x.muscleGroups||[])];return uniq(a)}
function Chip({label,active,onPress}){return(<Pressable onPress={onPress} style={{paddingHorizontal:12,paddingVertical:8,borderRadius:999,marginRight:8,marginBottom:8,backgroundColor:active?theme.accent:'#0F1A26',borderWidth:1,borderColor:active?theme.accent:theme.border}}><Text style={{color:active?'#fff':theme.text,fontWeight:'700'}}>{label}</Text></Pressable>)}

export default function ExercisePicker({visible,onClose,onConfirm,multi=true}) {
  const [all,setAll]=useState([]);
  const [q,setQ]=useState('');
  const [equip,setEquip]=useState('All');
  const [muscle,setMuscle]=useState('All');
  const [sel,setSel]=useState(new Set());

  useEffect(()=>{if(visible){loadLibrary().then(setAll);setQ('');setEquip('All');setMuscle('All');setSel(new Set())}},[visible]);

  const equipTags=useMemo(()=>['All',...uniq(all.map(x=>x.equipment).filter(Boolean))], [all]);
  const muscleTags=useMemo(()=>['All',...uniq(all.flatMap(musclesOf))], [all]);

  const data=useMemo(()=>{
    const t=String(q||'').toLowerCase();
    return all.filter(x=>{
      if(t && !String(x.name||'').toLowerCase().includes(t)) return false;
      if(equip!=='All' && String(x.equipment||'')!==equip) return false;
      if(muscle!=='All' && !musclesOf(x).some(m=>m===muscle)) return false;
      return true;
    }).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
  },[all,q,equip,muscle]);

  function toggle(id){
    if(!multi){const s=new Set();s.add(id);setSel(s);return}
    setSel(prev=>{const n=new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n;});
  }
  function add(){
    const chosen=all.filter(x=>sel.has(x.id||x.name));
    if(chosen.length===0) return;
    onConfirm && onConfirm(chosen);
    onClose && onClose();
  }

  return(
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{flex:1,backgroundColor:'#0009',alignItems:'center',justifyContent:'center'}}>
        <View style={{width:'94%',maxHeight:'92%',backgroundColor:theme.card,borderRadius:16,padding:14}}>
          <Text style={{color:theme.text,fontWeight:'800',fontSize:22,marginBottom:10}}>Add Exercises</Text>
          <TextInput value={q} onChangeText={setQ} placeholder="Search" placeholderTextColor={theme.textDim} style={{borderWidth:1,borderColor:theme.border,borderRadius:12,paddingHorizontal:12,paddingVertical:10,color:theme.text,backgroundColor:theme.surface,marginBottom:12}}/>

          <Text style={{color:theme.textDim,marginBottom:6,fontWeight:'700'}}>Equipment</Text>
          <View style={{maxHeight:110,marginBottom:12,borderWidth:1,borderColor:theme.border,borderRadius:12,padding:8,backgroundColor:theme.surface}}>
            <ScrollView>
              <View style={{flexDirection:'row',flexWrap:'wrap'}}>
                {equipTags.map(t=><Chip key={t} label={t} active={equip===t} onPress={()=>setEquip(t)}/>)}
              </View>
            </ScrollView>
          </View>

          <Text style={{color:theme.textDim,marginBottom:6,fontWeight:'700'}}>Muscles</Text>
          <View style={{maxHeight:140,marginBottom:12,borderWidth:1,borderColor:theme.border,borderRadius:12,padding:8,backgroundColor:theme.surface}}>
            <ScrollView>
              <View style={{flexDirection:'row',flexWrap:'wrap'}}>
                {muscleTags.map(t=><Chip key={t} label={t} active={muscle===t} onPress={()=>setMuscle(t)}/>)}
              </View>
            </ScrollView>
          </View>

          <FlatList
            data={data}
            keyExtractor={(item,i)=>String(item.id||item.name||i)}
            ItemSeparatorComponent={()=> <View style={{height:1,backgroundColor:theme.border}}/>}
            renderItem={({item})=>{
              const id=item.id||item.name;
              const checked=sel.has(id);
              const sub=[item.equipment, musclesOf(item).join(', ')].filter(Boolean).join(' • ');
              return(
                <Pressable onPress={()=>toggle(id)} style={{paddingVertical:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                  <View style={{flex:1,marginRight:12}}>
                    <Text style={{color:theme.text,fontWeight:'700'}} numberOfLines={1}>{item.name||'Exercise'}</Text>
                    <Text style={{color:theme.textDim,marginTop:4}} numberOfLines={1}>{sub}</Text>
                  </View>
                  <View style={{width:28,height:28,borderRadius:8,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:checked?theme.accent:theme.border,backgroundColor:checked?theme.accent:'#0000'}}>
                    {checked?<Text style={{color:'#fff',fontWeight:'900'}}>✓</Text>:null}
                  </View>
                </Pressable>
              )
            }}
          />

          <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:12}}>
            <Pressable onPress={()=>setSel(new Set())} style={{paddingHorizontal:18,paddingVertical:12,backgroundColor:'#1B2733',borderRadius:12}}>
              <Text style={{color:theme.text,fontWeight:'700'}}>Clear</Text>
            </Pressable>
            <View style={{flexDirection:'row',gap:8}}>
              <Pressable onPress={onClose} style={{paddingHorizontal:18,paddingVertical:12,backgroundColor:'#1B2733',borderRadius:12}}>
                <Text style={{color:theme.text,fontWeight:'700'}}>Cancel</Text>
              </Pressable>
              <Pressable onPress={add} style={{paddingHorizontal:22,paddingVertical:12,backgroundColor:theme.accent,borderRadius:12,opacity:sel.size?1:0.6}}>
                <Text style={{color:'#fff',fontWeight:'800'}}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}
