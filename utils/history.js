import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY='workout_history_v1';
export async function getHistory(){try{const v=await AsyncStorage.getItem(KEY);return v?JSON.parse(v):[]}catch(e){return []}}
export async function clearHistory(){try{await AsyncStorage.removeItem(KEY)}catch(e){}}
export async function addHistoryEntry(w){try{const arr=await getHistory();arr.push(w);await AsyncStorage.setItem(KEY,JSON.stringify(arr))}catch(e){}}
