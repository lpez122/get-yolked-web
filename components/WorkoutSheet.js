import React,{useEffect,useRef} from 'react';
import {Animated,Dimensions,View,Pressable} from 'react-native';
export default function WorkoutSheet({visible,onClose,children,heightRatio=0.9}){
  const H=Dimensions.get('window').height*heightRatio;
  const y=useRef(new Animated.Value(H)).current;
  useEffect(()=>{Animated.timing(y,{toValue:visible?0:H,duration:220,useNativeDriver:true}).start();},[visible]);
  return (
    <View pointerEvents={visible?'auto':'none'} style={{position:'absolute',left:0,right:0,bottom:0,top:0}}>
      <Pressable onPress={onClose} style={{flex:1,backgroundColor:visible?'rgba(0,0,0,0.35)':'transparent'}}/>
      <Animated.View style={{position:'absolute',left:0,right:0,bottom:0,height:H,borderTopLeftRadius:16,borderTopRightRadius:16,backgroundColor:'#111',transform:[{translateY:y}]}}>
        <View style={{height:18,alignItems:'center',justifyContent:'center'}}><View style={{width:48,height:5,borderRadius:2.5,backgroundColor:'#444'}}/></View>
        {children}
      </Animated.View>
    </View>
  );
}
