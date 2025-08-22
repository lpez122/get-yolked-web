import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

export default function EvenTabBar({ state, descriptors, navigation }) {
  const { bottom } = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter(r => {
    const desc = descriptors[r.key] || {};
    const opts = desc.options || {};
    const hiddenByFlag =
      opts.tabBarVisible === false ||
      (opts.tabBarItemStyle && opts.tabBarItemStyle.display === 'none') ||
      opts.tabBarButton === null;
    const hiddenByName = r.name === 'Workout';
    return !(hiddenByFlag || hiddenByName);
  });

  return (
    <View style={{ flexDirection: 'row', backgroundColor: theme.bg, borderTopWidth: 1, borderTopColor: theme.border }}>
      {visibleRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const color = isFocused ? (options.tabBarActiveTintColor || theme.accent) : (options.tabBarInactiveTintColor || '#9CA3AF');
        const size = 22;
        const icon = options.tabBarIcon ? options.tabBarIcon({ focused: isFocused, color, size }) : null;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, merge: true });
          }
        };
        const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: Math.max(6, bottom / 2) }}
          >
            {icon}
            <Text style={{ color, fontSize: 12, marginTop: 2 }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
