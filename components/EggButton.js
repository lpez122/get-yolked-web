import React, { useRef } from 'react';
import { TouchableOpacity, Text, Animated, Easing } from 'react-native';
export default function EggButton({ onCrack, size=48, label, style, cracked=false }) {
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scale,{toValue:1.12,duration:120,useNativeDriver:true}),
      Animated.timing(scale,{toValue:1.00,duration:120,useNativeDriver:true}),
      Animated.timing(rotate,{toValue:1,duration:180,easing:Easing.ease,useNativeDriver:true}),
      Animated.timing(rotate,{toValue:0,duration:1,useNativeDriver:true}),
    ]).start(()=>{ onCrack && onCrack(); });
  };
  const rot = rotate.interpolate({inputRange:[0,1],outputRange:['0deg','10deg']});
  return (
    <TouchableOpacity onPress={press} activeOpacity={0.9} style={style}>
      <Animated.View style={{alignItems:'center',transform:[{scale},{rotate:rot}]}}>
        <Text style={{fontSize:size}}>{cracked?'🍳':'🥚'}</Text>
        {label?<Text style={{marginTop:6,fontWeight:'600'}}>{label}</Text>:null}
      </Animated.View>
    </TouchableOpacity>
  );
}
