import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { MorningIntentionModal, EveningReflectionModal } from "./src/screens";
import { addNotificationResponseListener, getLastNotificationResponse } from "./src/lib/pushNotifications";

function AppContent() {
  const { session } = useAuth();
  const [showMorningModal, setShowMorningModal] = useState(false);
  const [showEveningModal, setShowEveningModal] = useState(false);

  useEffect(() => {
    // Check if app was opened from a notification tap
    getLastNotificationResponse().then((response) => {
      if (response?.notification?.request?.content?.data?.type === "morning_intention") {
        setShowMorningModal(true);
      } else if (response?.notification?.request?.content?.data?.type === "evening_reflection") {
        setShowEveningModal(true);
      }
    });

    // Listen for notification taps while app is running
    const unsubscribe = addNotificationResponseListener((response) => {
      const type = response.notification.request.content.data?.type;
      if (type === "morning_intention") {
        setShowMorningModal(true);
      } else if (type === "evening_reflection") {
        setShowEveningModal(true);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
      {session && (
        <>
          <MorningIntentionModal visible={showMorningModal} onClose={() => setShowMorningModal(false)} />
          <EveningReflectionModal visible={showEveningModal} onClose={() => setShowEveningModal(false)} />
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
