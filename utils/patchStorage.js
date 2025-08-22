import AsyncStorage from '@react-native-async-storage/async-storage';
const set0=AsyncStorage.setItem.bind(AsyncStorage);
const rem0=AsyncStorage.removeItem.bind(AsyncStorage);
AsyncStorage.setItem=async (key,val,...rest)=>{
  try{
    if(/program/i.test(key)&&/(active|current)/i.test(key)){
      try{
        const v=JSON.parse(val);
        if(v&&(v.programId||v.id)){
          const obj={programId:v.programId||v.id,week:Number(v.week||v.currentWeek||1),day:Number(v.day||v.currentDay||1)};
          await set0('current_program_v1',JSON.stringify(obj));
          await rem0('program_progress_v1');
        }else if(typeof v==='string'){
          await set0('current_program_v1',JSON.stringify({programId:v,week:1,day:1}));
          await rem0('program_progress_v1');
        }
      }catch(e){}
    }
  }catch(e){}
  return set0(key,val,...rest);
};
AsyncStorage.removeItem=async (key,...rest)=>{
  try{
    if(/program/i.test(key)&&/(active|current)/i.test(key)){
      await rem0('current_program_v1');
    }
  }catch(e){}
  return rem0(key,...rest);
};
export default null;
