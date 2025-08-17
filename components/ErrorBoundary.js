import React from 'react';
import { View, Text, ScrollView } from 'react-native';
export default class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state={error:null}; }
  static getDerivedStateFromError(e){ return { error:e }; }
  componentDidCatch(e, info){ console.error(e, info); }
  render(){
    if (this.state.error){
      return (
        <ScrollView style={{flex:1, backgroundColor:'#120'}}>
          <Text style={{color:'#fff', fontWeight:'700', padding:12}}>Render error</Text>
          <Text style={{color:'#f88', padding:12}}>{String(this.state.error)}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}
