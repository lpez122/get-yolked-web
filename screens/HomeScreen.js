import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeProgramCard from '../components/HomeProgramCard';
import { theme } from '../constants/theme';
import SettingsModal from './SettingsModal';

export default function HomeScreen(){
  const nav=useNavigation();
  const { top } = useSafeAreaInsets();
  const [settingsOpen, setSettingsOpen] = useState(false);
  function startEmpty(){ nav.navigate('Workout',{mode:'empty'}) }

  return (
    <View style={{flex:1,backgroundColor:theme.bg}}>
      <ScrollView
        style={{flex:1,backgroundColor:theme.bg}}
        contentContainerStyle={{
          // push content below the header (header uses SafeAreaView + 56 inner height)
          paddingTop: top + 56 + 16,
          paddingHorizontal: 16,
          paddingBottom: 16
        }}
      >
        {/* program card (no inline gear) */}
        <HomeProgramCard/>
        <Pressable onPress={startEmpty} style={{backgroundColor:theme.accent,alignSelf:'flex-start',paddingHorizontal:18,paddingVertical:12,borderRadius:14,marginTop:12}}>
          <Text style={{color:'#fff',fontWeight:'800'}}>Start Empty Workout</Text>
        </Pressable>
        <SettingsModal visible={settingsOpen} onClose={()=>setSettingsOpen(false)} />
      </ScrollView>
    </View>
  );
}
