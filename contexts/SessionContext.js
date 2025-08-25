import React, { createContext, useContext, useMemo, useState } from 'react';
import { useSettings } from './SettingsContext';

const Ctx=createContext(null);

export function estimateCalories(sets,durationSec,settings){
  const wkg=settings.weightKg||75;
  const rpes=(sets||[]).map(s=>typeof s?.rpe==='number'?s.rpe:null).filter(x=>x!==null);
  const avgRPE=rpes.length?rpes.reduce((a,b)=>a+b,0)/rpes.length:5;
  const MET=Math.max(3,Math.min(6,3+3*(avgRPE/10)));
  const kcalPerMin=MET*3.5*wkg/200;
  const minutes=Math.max(1,durationSec/60);
  return Math.round(kcalPerMin*minutes);
}

export function SessionProvider({children}){
  const {settings}=useSettings();
  const [current,setCurrent]=useState(null);
  const [sheetVisible,setSheetVisible]=useState(false);

  const startSession = async ({ plan, programName = '', week = 1, day = 1, adHoc = true }) => {
    const startAt = Date.now();
    const next = {
      startAt,
      plan: plan || { exercises: [] },
      programName,
      week,
      day,
      adHoc,
      isLastDay: false
    };
    setCurrent(next);
    setSheetVisible(true);
  };
  

  const endSession = async (partial) => {
    if (!current) return null;
  
    const endAt = Date.now();
    const durationSec = Math.max(1, Math.round((endAt - (current.startAt || endAt)) / 1000));
  
    const out = {
      id: String(endAt),
      dateISO: new Date(current.startAt || endAt).toISOString(),
      startAt: current.startAt || endAt,
      endAt,
      durationSec,
      units: partial?.units || 'lb',
      notes: partial?.notes || '',
      programName: current.programName || '',
      week: current.week || 1,
      day: current.day || 1,
      adHoc: !!current.adHoc,
      exercises: Array.isArray(partial?.exercises) ? partial.exercises : [],
      calories: estimateCalories(
        (partial?.exercises || []).flatMap(e => Array.isArray(e.rows) ? e.rows : []),
        durationSec,
        settings
      )
    };
    // attach user snapshot so history entries are attributed consistently
    out.user = {
      id: settings?.id || null,
      name: settings?.name || '',
      email: settings?.email || '',
      units: settings?.units || 'lb',
      weightKg: settings?.weightKg ?? null,
      heightCm: settings?.heightCm ?? null,
      bodyFatPct: settings?.bodyFatPct ?? null,
      age: settings?.age ?? null,
      profileImageUri: settings?.profileImageUri || ''
    };
  
    try {
      const P = await import('../utils/programProgress.js');
      const H = await import('./HistoryStore.js');
      await H.appendWorkoutSession(out);
      if (!current.adHoc && out.programName) {
        await P.markCompleteAndAdvance({
          programName: out.programName,
          week: out.week,
          day: out.day
        });
        await P.ensureActiveProgram(out.programName, out.week, out.day);
        await P.getNextUp();
      }
    } catch {}
  
    const ret = { ...out, adHoc: current.adHoc, isLastDay: current.isLastDay };
    setCurrent(null);
    setSheetVisible(false);
    return ret;
  };
  

  const value=useMemo(()=>({current,startSession,endSession,sheetVisible,setSheetVisible}),[current,sheetVisible,settings]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(){return useContext(Ctx);}
