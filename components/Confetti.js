import React from 'react';
import { Platform } from 'react-native';
let Impl=null;
try{ if(Platform.OS!=='web'){ Impl=require('react-native-confetti-cannon').default; } }catch(e){}
export default function Confetti(props){ if(!Impl) return null; return <Impl {...props}/>; }
