import 'react-native-get-random-values';
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
let el=document.getElementById('root');
if(!el){el=document.createElement('div');el.id='root';document.body.appendChild(el);}
const root=createRoot(el);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
