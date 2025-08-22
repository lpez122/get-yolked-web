import React from 'react';
import { View, Text, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

export default function HeaderBar({ title = '' }) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: top + 6, backgroundColor: theme.bg }}>
      <View style={{ height: 56, backgroundColor: theme.bg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
        <Image source={require('../assets/get_yolked_logo.png')} style={{ width: 28, height: 28, marginRight: 10, borderRadius: 4 }}/>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{title}</Text>
      </View>
    </View>
  );
}
