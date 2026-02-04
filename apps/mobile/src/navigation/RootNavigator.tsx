import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../auth/AuthContext";
import { AppTabs } from "./AppTabs";
import {
  AuthScreen,
  CoachingScreen,
  CreateCoachScreen,
  IntakeScreen,
  MemoryVaultScreen,
  OnboardingScreen,
  PersonalContextScreen,
  SessionsScreen,
  SplashScreen,
  ToolsScreen,
} from "../screens";

export type RootStackParamList = {
  Auth: undefined;
  Splash: undefined;
  Onboarding: undefined;
  Intake: undefined;
  Coaching: undefined;
  Sessions: undefined;
  PersonalContext: undefined;
  Tools: undefined;
  CreateCoach: undefined;
  MemoryVault: undefined;
  CreatorCoach: undefined;
  Tabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function FullScreenLoader() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}

export function RootNavigator() {
  const { isLoading, isProfileLoading, profile, session } = useAuth();

  if (isLoading) return <FullScreenLoader />;
  if (session && (isProfileLoading || !profile)) return <FullScreenLoader />;

  if (!session) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
      </Stack.Navigator>
    );
  }

  if (!profile?.onboarding_completed) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  // After onboarding, always land in Tabs so the tab bar (incl. Settings) is visible.
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Tabs">
      <Stack.Screen name="Tabs" component={AppTabs} />

      {/* Optional stack-only routes */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Intake" component={IntakeScreen} />
      <Stack.Screen name="Coaching" component={CoachingScreen} />
      <Stack.Screen name="Sessions" component={SessionsScreen} />
      <Stack.Screen name="PersonalContext" component={PersonalContextScreen} />
      <Stack.Screen name="Tools" component={ToolsScreen} />
      <Stack.Screen name="CreateCoach" component={CreateCoachScreen} />
      <Stack.Screen name="MemoryVault" component={MemoryVaultScreen} />
    </Stack.Navigator>
  );
}

