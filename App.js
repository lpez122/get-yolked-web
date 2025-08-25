import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import EvenTabBar from './components/EvenTabBar';
import { theme } from './constants/theme';
import SettingsModal from './screens/SettingsModal';
// debug: temporarily disable top-level patch to see if it causes raw-text rendering issues
// import './utils/patchStorage';

import AnalyticsScreen from './screens/AnalyticsScreen';
import ExercisesScreen from './screens/ExercisesScreen';
import HistoryFallback from './screens/HistoryFallback';
import HomeScreen from './screens/HomeScreen';
import ProgramsScreen from './screens/ProgramsScreen';

import ErrorBoundary from './components/ErrorBoundary';
import * as DC from './contexts/DataContext';
import { ExerciseLibraryProvider } from './contexts/ExerciseLibrary';
import { ProgramProgressProvider } from './contexts/ProgramProgressContext';
import { SessionProvider } from './contexts/SessionContext';
import { SettingsProvider } from './contexts/SettingsContext';
import StableWorkout from './screens/StableWorkout';

// Debug helper: finds raw string/number children under non-Text elements and surfaces an Error
// so RedBox/Metro shows the component stack. Remove after you locate the offending component.
function DebugTextCheck({ children }) {
  const isTextType = (type) => type === 'Text' || type === Text;
  function walk(node, curPath = []) {
    if (node == null) return;
    if (Array.isArray(node)) { node.forEach(n => walk(n, curPath)); return; }
    if (typeof node === 'string' || typeof node === 'number') return;
    if (React.isValidElement(node)) {
      const t = typeof node.type === 'string' ? node.type : (node.type?.name || '<Fn>');
      const newPath = [...curPath, t];
      React.Children.forEach(node.props.children, child => {
        if (typeof child === 'string' || typeof child === 'number') {
          if (!isTextType(node.type)) {
            // Surface a proper Error so RN RedBox shows the stack (component path will help locate file)
            const msg = `[DebugTextCheck] raw string child under non-Text element: path="${newPath.join(' > ')}" child=${JSON.stringify(child)}`;
            // log as error with stack
            console.error(new Error(msg));
          }
        } else {
          walk(child, newPath);
        }
      });
    }
  }
  try { walk(children, []); } catch (e) { console.error(e); }
  return <>{children}</>;
}

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

function Header({title, showSettings, onSettingsPress}){
  // keep header height in sync with headerStyle.height below (56)
  return (
    <GestureHandlerRootView>
      <SafeAreaView edges={['top']} style={{backgroundColor: theme.bg}}>
        <View style={{height:56,backgroundColor:theme.bg,flexDirection:'row',alignItems:'center',paddingHorizontal:12}}>
          <Image source={require('./assets/get_yolked_logo.png')} style={{width:48,height:48,marginRight:10,borderRadius:4}}/>
          <Text style={{color:theme.text,fontSize:18,fontWeight:'700'}}>{title}</Text>
          {showSettings ? (
            <Pressable onPress={onSettingsPress} style={{marginLeft:'auto',padding:8}}>
              <Ionicons name="settings-outline" size={27} color={theme.text} />
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const navTheme={
  ...DarkTheme,
  colors:{...DarkTheme.colors,background:theme.bg,card:theme.bg,text:theme.text,primary:theme.accent,border:theme.border}
};

export default function App(){
  const [settingsVisible, setSettingsVisible] = useState(false);
  const HEADER_INNER_HEIGHT = 56;
  // wrapper to push screen content below the app header
  const withHeaderPadding = (ScreenComponent) => {
    return (props) => {
      const { top } = useSafeAreaInsets();
      return (
        <View style={{flex:1,backgroundColor: theme.bg, paddingTop: top + HEADER_INNER_HEIGHT}}>
          <ScreenComponent {...props} />
        </View>
      );
    };
  };
  return(
    <ErrorBoundary>
      <DebugTextCheck>
        <DataProvider>
          <ExerciseLibraryProvider>
            <SettingsProvider>
              <SessionProvider>
                <ProgramProgressProvider>
                  <NavigationContainer theme={navTheme}>
                    <SettingsModal visible={settingsVisible} onClose={()=>setSettingsVisible(false)} />
                    <Tab.Navigator tabBar={props => <EvenTabBar {...props} />} 
                      screenOptions={({route})=>({
                        // use app Header component; make sure the navigator reserves the same height
                        header: ({navigation, route: r, options, back}) => <Header title={route.name} showSettings={route.name==='Home'} onSettingsPress={()=>setSettingsVisible(true)} />,
                        headerStyle: { backgroundColor: theme.bg, height: 56, borderBottomColor: theme.border },
                        headerTransparent: false,
                        tabBarStyle:{backgroundColor:theme.bg,borderTopColor:theme.border,paddingHorizontal:0,justifyContent:"space-between",marginHorizontal:0},
                        tabBarActiveTintColor:'#9CA3AF',
                        tabBarInactiveTintColor:'#9CA3AF', tabBarLabelStyle:{marginBottom:5}, tabBarIconStyle:{margin:0}, tabBarItemStyle:{flex:1,width:'20%'},
                        tabBarIcon:({color,size})=>(<Ionicons name={iconFor(route.name)} size={size} color={color}/>)
                      })}
                    >
                      <Tab.Screen name="Home" component={HomeScreen}/>
                      <Tab.Screen name="Programs" component={withHeaderPadding(ProgramsScreen)}/>
                      <Tab.Screen name="Exercises" component={withHeaderPadding(ExercisesScreen)}/>
                      <Tab.Screen name="History" component={withHeaderPadding(HistoryFallback)}/>
                      <Tab.Screen name="Analytics" component={withHeaderPadding(AnalyticsScreen)}/>
                      <Tab.Screen name="Workout" component={StableWorkout} options={{ tabBarButton: () => null, tabBarItemStyle:{display:"none"}, tabBarIcon:() => null, tabBarLabel:"", headerShown:false }} />
                    </Tab.Navigator>
                  </NavigationContainer>
                </ProgramProgressProvider>
              </SessionProvider>
            </SettingsProvider>
          </ExerciseLibraryProvider>
        </DataProvider>
      </DebugTextCheck>
    </ErrorBoundary>
  );
}
