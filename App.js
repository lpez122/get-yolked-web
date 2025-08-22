import "react-native-gesture-handler";
import './utils/patchStorage';
import React from 'react';
import {View,Text,Image} from 'react-native';
import {NavigationContainer,DarkTheme} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Ionicons} from '@expo/vector-icons';
import {theme} from './constants/theme';
import EvenTabBar from './components/EvenTabBar';
import HeaderBar from './components/HeaderBar';

import HomeScreen from './screens/HomeScreen';
import ProgramsScreen from './screens/ProgramsScreen';
import ExercisesScreen from './screens/ExercisesScreen';
import HistoryFallback from './screens/HistoryFallback';
import AnalyticsScreen from './screens/AnalyticsScreen';

import ErrorBoundary from './components/ErrorBoundary';
import {SettingsProvider} from './contexts/SettingsContext';
import {SessionProvider} from './contexts/SessionContext';
import {ExerciseLibraryProvider} from './contexts/ExerciseLibrary';
import * as DC from './contexts/DataContext';
import StableWorkout from './screens/StableWorkout';
import { ProgramProgressProvider } from './contexts/ProgramProgressContext';

const DataProvider=DC.DataProvider||DC.default;
const Tab=createBottomTabNavigator();

function iconFor(routeName){
  switch(routeName){
    case 'Home': return 'home-outline';
    case 'Programs': return 'list-outline';
    case 'Exercises': return 'barbell-outline';
    case 'History': return 'time-outline';
    case 'Analytics': return 'stats-chart-outline';
    default: return 'ellipse-outline';
  }
}

function Header({title}){
  return (
    <View style={{height:56,backgroundColor:theme.bg,flexDirection:'row',alignItems:'center',paddingHorizontal:12}}>
      <Image source={require('./assets/get_yolked_logo.png')} style={{width:28,height:28,marginRight:10,borderRadius:4}}/>
      <Text style={{color:theme.text,fontSize:18,fontWeight:'700'}}>{title}</Text>
    </View>
  );
}

const navTheme={
  
  ...DarkTheme,
  colors:{...DarkTheme.colors,background:theme.bg,card:theme.bg,text:theme.text,primary:theme.accent,border:theme.border}
};

export default function App(){
  return(
    <ErrorBoundary>
      <DataProvider>
        <ExerciseLibraryProvider>
          <SettingsProvider>
            <SessionProvider>
              <ProgramProgressProvider>
                <NavigationContainer theme={navTheme}>
                  <Tab.Navigator tabBar={props => <EvenTabBar {...props} />} 
                    screenOptions={({route})=>({
                      header: () => <HeaderBar title={route.name} />,
                      tabBarStyle:{backgroundColor:theme.bg,borderTopColor:theme.border,paddingHorizontal:0,justifyContent:"space-between",marginHorizontal:0},
                      tabBarActiveTintColor:'#9CA3AF',
                      tabBarInactiveTintColor:'#9CA3AF', tabBarLabelStyle:{marginBottom:4}, tabBarIconStyle:{margin:0}, tabBarItemStyle:{flex:1,width:'20%'},
                      tabBarIcon:({color,size})=>(<Ionicons name={iconFor(route.name)} size={size} color={color}/>)
                    })}
                  >
                    <Tab.Screen name="Home" component={HomeScreen}/>
                    <Tab.Screen name="Programs" component={ProgramsScreen}/>
                    <Tab.Screen name="Exercises" component={ExercisesScreen}/>
                    <Tab.Screen name="History" component={HistoryFallback}/>
                    <Tab.Screen name="Analytics" component={AnalyticsScreen}/>
                    <Tab.Screen name="Workout" component={StableWorkout} options={{ tabBarButton: () => null, tabBarItemStyle:{display:"none"}, tabBarIcon:() => null, tabBarLabel:"", headerShown:false }} />
                  </Tab.Navigator>
                </NavigationContainer>
              </ProgramProgressProvider>
            </SessionProvider>
          </SettingsProvider>
        </ExerciseLibraryProvider>
      </DataProvider>
    </ErrorBoundary>
  );
}
