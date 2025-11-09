import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Heart, Plus, Pill, User } from 'lucide-react-native';
import { Colors, Spacing, Shadows } from '../constants/theme';

const getActiveTabColor = (routeName: string): string => {
  const navigatorColors = Colors.navigatorColors as Record<string, string>;
  return navigatorColors[routeName] ?? Colors.primary.main;
};

const getTabIcon = (routeName: string, isFocused: boolean, activeColor: string) => {
  const iconColor = isFocused ? activeColor : Colors.text.tertiary;
  const size = 24;

  const icons: Record<string, React.ReactNode> = {
    HomeTab: <Home size={size} color={iconColor} />,
    VitalsTab: <Heart size={size} color={iconColor} />,
    AddMedicine: <Plus size={28} color={Colors.primary.contrast} />,
    MedicationsTab: <Pill size={size} color={iconColor} />,
    ProfileTab: <User size={size} color={iconColor} />,
  };
  return icons[routeName] || <Home size={size} color={iconColor} />;
};

const getTabLabel = (routeName: string, label: any): string => {
  if (typeof label === 'string') return label;

  const labels: Record<string, string> = {
    HomeTab: 'Home',
    VitalsTab: 'Vitals',
    AddMedicine: '',
    MedicationsTab: 'Meds',
    ProfileTab: 'Profile',
  };
  return labels[routeName] || routeName;
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const activeRouteName = state.routes[state.index]?.name;
  const activeNavigatorColor = activeRouteName ? getActiveTabColor(activeRouteName) : Colors.primary.main;

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const activeColor = getActiveTabColor(route.name);

          // Special styling for center AddMedicine button
          if (route.name === 'AddMedicine') {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.addButton}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
              >
                <View style={[styles.addButtonCircle, { backgroundColor: activeNavigatorColor }]}>
                  {getTabIcon(route.name, isFocused, activeColor)}
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
            >
              {getTabIcon(route.name, isFocused, activeColor)}
              <Text style={[
                styles.tabLabel,
                isFocused && styles.tabLabelFocused,
                isFocused && { color: activeColor }
              ]}>
                {getTabLabel(route.name, label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingBottom: Spacing.md + 4,
    paddingHorizontal: Spacing.lg + Spacing.md,
    paddingTop: Spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 100,
    height: 70,
    ...Shadows.lg,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  tabLabelFocused: {
    fontWeight: '600',
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32,
  },
  addButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
