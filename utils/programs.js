import AsyncStorage from '@react-native-async-storage/async-storage';
export async function loadPrograms(){try{const r=await AsyncStorage.getItem('saved_programs_v1');return r?JSON.parse(r):[]}catch(e){return[]}}
export async function setCurrentProgramPointer(programId,week=1,day=1){await AsyncStorage.setItem('current_program_v1',JSON.stringify({programId,week,day}));await AsyncStorage.removeItem('program_progress_v1')}
export async function clearCurrentProgramPointer(){await AsyncStorage.removeItem('current_program_v1');await AsyncStorage.removeItem('program_progress_v1')}
export async function getCurrentProgramPointer(){try{const r=await AsyncStorage.getItem('current_program_v1');return r?JSON.parse(r):null}catch(e){return null}}
