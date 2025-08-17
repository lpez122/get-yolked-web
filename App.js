import "react-native-gesture-handler";
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './screens/HomeScreen';
import ProgramsScreen from './screens/ProgramsScreen';
import ExercisesScreen from './screens/ExercisesScreen';
import HistoryScreen from './screens/HistoryScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';

import ErrorBoundary from './components/ErrorBoundary';
import { SettingsProvider } from './contexts/SettingsContext';
import { SessionProvider } from './contexts/SessionContext';
import * as DC from './contexts/DataContext';
const DataProvider = DC.DataProvider || DC.default;

const Tab = createBottomTabNavigator();

export default function App(){
  return (
    <ErrorBoundary>
      <DataProvider>
        <SettingsProvider>
          <SessionProvider>
            <NavigationContainer>
              <Tab.Navigator screenOptions={{headerShown:false, tabBarStyle:{backgroundColor:'#000'}}}>
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="Programs" component={ProgramsScreen} />
                <Tab.Screen name="Exercises" component={ExercisesScreen} />
                <Tab.Screen name="History" component={HistoryScreen} />
                <Tab.Screen name="Analytics" component={AnalyticsScreen} />
              </Tab.Navigator>
            </NavigationContainer>
          </SessionProvider>
        </SettingsProvider>
      </DataProvider>
    </ErrorBoundary>
  );
}
