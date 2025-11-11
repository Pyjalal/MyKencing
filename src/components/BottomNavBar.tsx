import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Heart, Pill, User, BotMessageSquare } from 'lucide-react-native';
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
    MedicationsTab: <Pill size={size} color={iconColor} />,
    ChatBotTab: <BotMessageSquare size={size} color={iconColor} />,
    ProfileTab: <User size={size} color={iconColor} />,
  };
  return icons[routeName] || <Home size={size} color={iconColor} />;
};

const getTabLabel = (routeName: string, label: any): string => {
  if (typeof label === 'string') return label;

  const labels: Record<string, string> = {
    HomeTab: 'Home',
    VitalsTab: 'Vitals',
    MedicationsTab: 'Meds',
    ChatBotTab: '',
    ProfileTab: 'Profile',
  };
  return labels[routeName] || routeName;
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const chatRoute = state.routes.find((route) => route.name === 'ChatBotTab');
  const regularRoutes = state.routes.filter((route) => route.name !== 'ChatBotTab');

  const renderTab = (route: typeof state.routes[number]) => {
    const { options } = descriptors[route.key];
    const label = options.tabBarLabel !== undefined
      ? options.tabBarLabel
      : options.title !== undefined
      ? options.title
      : route.name;

    const isFocused = state.routes[state.index]?.key === route.key;

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
  };

  const renderChatButton = () => {
    if (!chatRoute) return null;

    const isFocused = state.routes[state.index]?.key === chatRoute.key;
    const activeColor = getActiveTabColor(chatRoute.name);
    const iconColor = isFocused ? Colors.primary.contrast : Colors.text.tertiary;
    const backgroundColor = isFocused ? activeColor : Colors.background.card;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: chatRoute.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(chatRoute.name);
      }
    };

    return (
      <TouchableOpacity
        key={chatRoute.key}
        onPress={onPress}
        style={[styles.chatButtonWrapper, isFocused && styles.chatButtonWrapperActive]}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
      >
        <View style={[styles.chatButton, { backgroundColor }]}>
          <BotMessageSquare size={28} color={iconColor} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.tabBar}>
          {regularRoutes.map(renderTab)}
        </View>
        {renderChatButton()}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 100,
    height: 70,
    ...Shadows.lg,
    paddingHorizontal: Spacing.md,
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
  chatButtonWrapper: {
    marginLeft: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonWrapperActive: {
    transform: [{ scale: 1.04 }],
  },
  chatButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
