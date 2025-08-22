import React from 'react';
import {ScrollView, View, Text} from 'react-native';
import {theme} from '../constants/theme';

export default function AnalyticsScreen(){
  return (
    <ScrollView style={{flex:1,backgroundColor:theme.bg}} contentContainerStyle={{padding:16}}>
      <View style={{backgroundColor:theme.card,borderRadius:16,padding:16}}>
        <Text style={{color:theme.text,fontSize:18,fontWeight:'800',marginBottom:8}}>Sets per Muscle Group</Text>
        <Text style={{color:theme.textDim}}>No completed sets logged yet.</Text>
      </View>
    </ScrollView>
  );
}
