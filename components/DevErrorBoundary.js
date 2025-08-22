import React from 'react';
export default class DevErrorBoundary extends React.Component{
  constructor(p){ super(p); this.state={err:null,info:null}; }
  static getDerivedStateFromError(err){ return {err}; }
  componentDidCatch(err,info){ this.setState({info}); console.error('[ErrorBoundary]', err, info); }
  render(){
    if(!this.state.err) return this.props.children;
    return (
      <div style={{padding:16,color:'#fff',background:'#7c2222'}}>
        <div style={{fontWeight:'bold'}}>Workout crashed</div>
        <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.err?.message||this.state.err)}</pre>
        <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.info?.componentStack||'')}</pre>
      </div>
    );
  }
}
