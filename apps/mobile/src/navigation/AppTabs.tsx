import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Compass, Store, MessageCircle, Settings } from "lucide-react-native";
import {
  CoachingScreen,
  HomeScreen,
  JourneyScreen,
  MarketplaceScreen,
  SettingsScreen,
} from "../screens";
import { colors, fontSize } from "../theme/colors";

export type AppTabParamList = {
  Home: undefined;
  Journey: undefined;
  Marketplace: undefined;
  Coaching: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0,
          paddingTop: 10,
          paddingBottom: 10,
          height: 65,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: "500",
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Home 
              size={22} 
              color={color} 
              strokeWidth={focused ? 2 : 1.5}
              fill={focused ? color : "transparent"}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Journey"
        component={JourneyScreen}
        options={{
          tabBarLabel: "Journey",
          tabBarIcon: ({ color, focused }) => (
            <Compass 
              size={22} 
              color={color} 
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          tabBarLabel: "Coaches",
          tabBarIcon: ({ color, focused }) => (
            <Store 
              size={22} 
              color={color} 
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Coaching"
        component={CoachingScreen}
        options={{
          tabBarLabel: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle 
              size={22} 
              color={color} 
              strokeWidth={focused ? 2 : 1.5}
              fill={focused ? color : "transparent"}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Settings 
              size={22} 
              color={color} 
              strokeWidth={focused ? 2 : 1.5}
              fill={focused ? color : "transparent"}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

