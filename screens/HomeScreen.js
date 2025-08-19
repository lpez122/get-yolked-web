import React,{useEffect,useMemo,useRef,useState} from 'react';
import {View,Text,ScrollView,Pressable,FlatList,Dimensions} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {theme} from '../constants/theme';
import NextProgramCard from '../components/NextProgramCard';

const PROGRAMS_KEY='saved_programs_v1';
const ACTIVE_ID_KEY_OLD='active_saved_program_id';
const ACTIVE_IDS_KEY='active_saved_program_ids';
const PROG_PROGRESS_PREFIX='prog_progress_';

function Section({title,children}){
  return(
    <View style={{paddingHorizontal:16}}>
      <Text style={{color:theme.text,fontSize:22,fontWeight:'800',marginTop:10,marginBottom:12}}>{title}</Text>
      {children}
    </View>
  );
}

function computeSnapshot(prog,progress){
  const daysPerWeek=Number(prog.days||1);
  const totalDays=Number(prog.weeks||1)*daysPerWeek;
  const clampedIndex=Math.max(1,Math.min(progress,totalDays));
  const week=Math.ceil(clampedIndex/daysPerWeek);
  const day=((clampedIndex-1)%daysPerWeek)+1;
  const ex=(((prog.plan||{})[week]||{})[day])||[];
  const items=ex.map(e=>{
    const count=Array.isArray(e.sets)?e.sets.length:(typeof e.sets==='number'?e.sets:0);
    let top='';
    if(Array.isArray(e.sets)&&e.sets.length>0){
      const last=e.sets[e.sets.length-1];
      if(last&&typeof last.reps!=='undefined') top=`${last.reps} reps`;
    }
    return {name:e.name,sets:count,topSet:top};
  });
  return {week,day,items};
}

export default function HomeScreen({navigation}){
  const [saved,setSaved]=useState([]);
  const [activeIds,setActiveIds]=useState([]);
  const [progressById,setProgressById]=useState({});
  const [page,setPage]=useState(0);
  const width=Dimensions.get('window').width;
  const pager=useRef(null);

  useEffect(()=>{(async()=>{
    const raw=JSON.parse(await AsyncStorage.getItem(PROGRAMS_KEY)||'[]');
    setSaved(raw);
    let ids=JSON.parse(await AsyncStorage.getItem(ACTIVE_IDS_KEY)||'[]');
    if(!ids||!Array.isArray(ids)||ids.length===0){
      const legacy=await AsyncStorage.getItem(ACTIVE_ID_KEY_OLD);
      if(legacy){ ids=[legacy]; await AsyncStorage.setItem(ACTIVE_IDS_KEY,JSON.stringify(ids)); await AsyncStorage.removeItem(ACTIVE_ID_KEY_OLD); }
    }
    setActiveIds(ids||[]);
    const entries={};
    for(const id of ids||[]){
      const pRaw=JSON.parse(await AsyncStorage.getItem(PROG_PROGRESS_PREFIX+id)||'{}');
      entries[id]=Number(pRaw.nextIndex||1);
    }
    setProgressById(entries);
  })()},[]);

  const cards=useMemo(()=>{
    return (activeIds||[]).map(id=>{
      const prog=saved.find(x=>x.id===id);
      if(!prog) return null;
      const pr=progressById[id]||1;
      const snap=computeSnapshot(prog,pr);
      return {id,prog,week:snap.week,day:snap.day,items:snap.items};
    }).filter(Boolean);
  },[activeIds,saved,progressById]);

  const startProgramCard=async(index)=>{
    const c=cards[index];
    if(!c){ navigation?.navigate?.('Workout',{mode:'empty',startNow:true}); return; }
    const next={nextIndex:(progressById[c.id]||1)};
    await AsyncStorage.setItem(PROG_PROGRESS_PREFIX+c.id,JSON.stringify(next));
    navigation?.navigate?.('Workout',{programId:c.id,week:c.week,day:c.day,mode:'program',startNow:true});
  };

  const startEmpty=()=>{
    navigation?.navigate?.('Workout',{mode:'empty',startNow:true});
  };

  const emptyCTA=(
    <View style={{paddingHorizontal:16}}>
      <Pressable onPress={startEmpty} style={{backgroundColor:theme.accent,paddingVertical:14,borderRadius:12,alignItems:'center'}}>
        <Text style={{color:theme.text,fontWeight:'700'}}>Start Empty Workout</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{flex:1,backgroundColor:theme.bg}}>
      <ScrollView contentContainerStyle={{paddingVertical:16,gap:16}}>
        <Section title={cards.length?'Continue Program':'No Active Program'}>
          {cards.length?(
            <View>
              <FlatList
                ref={pager}
                data={cards}
                keyExtractor={(x)=>x.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e)=>{
                  const p=Math.round(e.nativeEvent.contentOffset.x/width);
                  setPage(p);
                }}
                renderItem={({item,index})=>(
                  <View style={{width,paddingHorizontal:16}}>
                    <NextProgramCard
                      title={item.prog.name}
                      subtitle={`Week ${item.week} · Day ${item.day}`}
                      items={item.items}
                      buttonLabel={`Start Week ${item.week} · Day ${item.day}`}
                      onStart={()=>startProgramCard(index)}
                    />
                  </View>
                )}
              />
              <View style={{flexDirection:'row',justifyContent:'center',gap:8,marginTop:10}}>
                {cards.map((_,i)=>(
                  <View key={i} style={{width:8,height:8,borderRadius:4,backgroundColor:i===page?theme.accent:'#2a2a2a'}}/>
                ))}
              </View>
            </View>
          ):null}
        </Section>

        <Section title="Workout Tracker">
          {emptyCTA}
        </Section>
      </ScrollView>
    </View>
  );
}
