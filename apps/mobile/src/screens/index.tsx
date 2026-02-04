import React, { useMemo, useState, useRef, useEffect } from "react";
import { ActivityIndicator, Alert, Button, Modal, RefreshControl, SafeAreaView, ScrollView, Switch, Text, TextInput, View, TouchableOpacity, Platform, Dimensions, StyleSheet } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, Easing } from "react-native";
import { Calendar, Flame, Lightbulb, Share2, RefreshCw, MoreVertical, MessageSquarePlus, Users, Mic, Send, X, Check, Play, Square, MessageCircle, User, Search, Grid, Gift, Crown, Award, TrendingUp, Sparkles, Wand2, Download, Lock, Star, Mail, LogOut, ChevronRight, Shield, Bell, HelpCircle, Info, ClipboardList, CheckCircle, Circle, UserCircle, Settings, Heart, ExternalLink, Trophy, Target, BarChart3, Plus, Database, Trash2, Pencil, Tag, Filter, Eye, EyeOff, Clock } from "lucide-react-native";
import { useAuth } from "../auth/AuthContext";
import { supabase, supabaseUrl } from "../lib/supabase";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows, lineHeight } from "../theme/colors";
import { GrowthTree } from "../components/GrowthTree";

function ScreenShell({ title }: { title: string }) {
  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 12 }}>{title}</Text>
      <Text style={{ color: "#444" }}>
        Placeholder screen. UI implementation will mirror `aicoachui/` without redesign.
      </Text>
    </SafeAreaView>
  );
}

export function SplashScreen() {
  return <ScreenShell title="Compass" />;
}

export function OnboardingScreen() {
  const { isProfileLoading, profile, updateProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const onComplete = async () => {
    try {
      setBusy(true);
      setErrorText(null);
      await updateProfile({
        onboarding_completed: true,
        onboarding_data: { completed_at: new Date().toISOString() },
      });
    } catch (e: any) {
      setErrorText(e?.message ?? "Failed to complete onboarding");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
        Onboarding
      </Text>
      <Text style={{ textAlign: "center", color: "#666", marginBottom: 24 }}>
        We’ll collect a few details to personalize your coaching.
      </Text>

      <View style={{ gap: 12 }}>
        {profile?.email ? (
          <Text style={{ textAlign: "center", color: "#444" }}>Signed in as {profile.email}</Text>
        ) : null}

        {(isProfileLoading || busy) && (
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <ActivityIndicator />
          </View>
        )}

        {errorText && <Text style={{ color: "#b00020" }}>{errorText}</Text>}

        <Button title="Complete onboarding" onPress={() => void onComplete()} disabled={busy} />
      </View>
    </SafeAreaView>
  );
}

export function IntakeScreen() {
  const navigation = useNavigation<any>();
  const { isProfileLoading, profile, updateProfile } = useAuth();
  const [goal, setGoal] = useState("");
  const [challenge, setChallenge] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const onSave = async () => {
    try {
      setBusy(true);
      setErrorText(null);
      await updateProfile({
        intake_data: {
          goal: goal.trim() || null,
          challenge: challenge.trim() || null,
          updated_at: new Date().toISOString(),
        },
      });
      navigation.goBack();
    } catch (e: any) {
      setErrorText(e?.message ?? "Failed to save intake");
    } finally {
      setBusy(false);
    }
  };

  const onMarkComplete = async () => {
    try {
      setBusy(true);
      setErrorText(null);
      await updateProfile({
        intake_data: {
          goal: goal.trim() || null,
          challenge: challenge.trim() || null,
          updated_at: new Date().toISOString(),
        },
        intake_completed: true,
        intake_completed_at: new Date().toISOString(),
      });
      navigation.goBack();
    } catch (e: any) {
      setErrorText(e?.message ?? "Failed to complete intake");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 8 }}>Deep Intake</Text>
      <Text style={{ color: "#666", marginBottom: 16 }}>
        Optional. You can do this later — it helps the coach personalize guidance.
      </Text>

      {profile?.email ? <Text style={{ color: "#444", marginBottom: 12 }}>{profile.email}</Text> : null}

      <View style={{ gap: 12 }}>
        <TextInput
          value={goal}
          onChangeText={setGoal}
          placeholder="What do you want help with right now?"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 10,
          }}
        />
        <TextInput
          value={challenge}
          onChangeText={setChallenge}
          placeholder="What’s the biggest challenge?"
          multiline
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 10,
            minHeight: 90,
            textAlignVertical: "top",
          }}
        />

        {(isProfileLoading || busy) && (
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <ActivityIndicator />
          </View>
        )}

        {errorText && <Text style={{ color: "#b00020" }}>{errorText}</Text>}

        <Button title="Save for later" onPress={() => void onSave()} disabled={busy} />
        <Button title="Mark intake complete" onPress={() => void onMarkComplete()} disabled={busy} />
      </View>
    </SafeAreaView>
  );
}

// Phase 3: Smart Session Types (labels for UI only; backend uses same keys)
const SESSION_TYPES: { id: string; label: string }[] = [
  { id: "quick_checkin", label: "Quick Check-in" },
  { id: "deep_dive", label: "Deep Dive" },
  { id: "reflection", label: "Reflection" },
  { id: "goal_review", label: "Goal Review" },
  { id: "celebration", label: "Celebration" },
  { id: "grounding", label: "Grounding" },
];

export function CoachingScreen() {
  const { session, profile } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<string>("deep_dive");
  const [messages, setMessages] = useState<
    { id: string; sender: "user" | "coach"; content: string; type?: string; metadata?: any; created_at: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<{ id: string; name: string } | null>(null);
  const [showCoachSelector, setShowCoachSelector] = useState(false);
  const [availableCoaches, setAvailableCoaches] = useState<any[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice playback state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const canSend = (input.trim().length > 0 || isRecording) && !busy;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Animated pulse for recording indicator
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.8)).current;
  const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isRecording) {
      pulseAnimation.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseScale, {
              toValue: 1.3,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseScale, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, {
              toValue: 0.3,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.8,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseAnimation.current.start();
    } else {
      pulseAnimation.current?.stop();
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.8);
    }
    return () => {
      pulseAnimation.current?.stop();
    };
  }, [isRecording, pulseScale, pulseOpacity]);

  // Request audio permissions
  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      setErrorText("Microphone permission is required for voice messages");
      return false;
    }
    return true;
  };

  // Start recording
  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch (e: any) {
      console.error("Failed to start recording:", e);
      setErrorText(e?.message ?? "Failed to start recording");
    }
  };

  // Stop recording and send
  const stopRecordingAndSend = async () => {
    if (!recordingRef.current) return;

    try {
      setBusy(true);
      setErrorText(null);

      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);

      if (!uri) {
        throw new Error("No recording URI");
      }

      // Get session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error("No active session");
      }

      // Upload to Supabase Storage using FormData (works in React Native)
      const fileName = `${currentSession.user.id}/${conversationId ?? "new"}/${Date.now()}.m4a`;
      
      // Create FormData with the file
      const formData = new FormData();
      formData.append("file", {
        uri: uri,
        name: "recording.m4a",
        type: "audio/mp4",
      } as any);

      // Upload using fetch directly to Supabase Storage API
      const uploadUrl = `${supabaseUrl}/storage/v1/object/voice-messages/${fileName}`;
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
          "x-upsert": "false",
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text().catch(() => "");
        throw new Error(`Upload failed: ${uploadResponse.status} ${errText}`);
      }

      // Get signed URL for transcription
      const { data: signedUrlData } = await supabase.storage
        .from("voice-messages")
        .createSignedUrl(fileName, 3600);

      if (!signedUrlData?.signedUrl) {
        throw new Error("Failed to get signed URL");
      }

      // Call transcribe function
      const transcribeResponse = await fetch(`${supabaseUrl}/functions/v1/transcribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({ audioUrl: signedUrlData.signedUrl }),
      });

      if (!transcribeResponse.ok) {
        let errorMessage = "Voice transcription failed. Please try typing your message instead.";
        
        try {
          const errorData = await transcribeResponse.json();
          // Use user-friendly message if available, otherwise fallback
          errorMessage = errorData.userMessage || errorData.error || errorMessage;
        } catch {
          // If response isn't JSON, use status-based message
          if (transcribeResponse.status === 429) {
            errorMessage = "Voice transcription is temporarily unavailable due to high usage. Please try typing your message instead, or wait a few minutes.";
          } else if (transcribeResponse.status === 400) {
            errorMessage = "Could not transcribe your audio. The recording might be too quiet or unclear. Please try again or type your message.";
          }
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await transcribeResponse.json();
      const transcript = responseData.transcript;

      if (!transcript || transcript.trim().length === 0) {
        throw new Error("Could not transcribe your audio. The recording might be too quiet or unclear. Please try again or type your message.");
      }

      // Send to coach-turn with the transcript
      const coachResponse = await fetch(`${supabaseUrl}/functions/v1/coach-turn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          coachId: selectedCoach?.id ?? profile?.selected_coach_id ?? undefined,
          message: transcript,
          voiceMessageUrl: fileName,
          sessionType: conversationId ? undefined : selectedSessionType,
        }),
      });

      if (!coachResponse.ok) {
        let errorMessage = "Failed to get coach response. Please try again.";
        
        try {
          const errorData = await coachResponse.json();
          errorMessage = errorData.userMessage || errorData.error || errorMessage;
        } catch {
          const errText = await coachResponse.text().catch(() => "");
          if (coachResponse.status === 429 || errText.includes("quota") || errText.includes("RESOURCE_EXHAUSTED")) {
            errorMessage = "We're experiencing high demand. Please wait a moment and try again.";
          } else if (coachResponse.status >= 500) {
            errorMessage = "Service temporarily unavailable. Please try again in a moment.";
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await coachResponse.json();
      const nextConversationId = data.conversationId as string | undefined;
      const returnedMessages = (data.messages ?? []) as any[];

      if (!nextConversationId) {
        throw new Error("Missing conversationId in response");
      }

      setConversationId(nextConversationId);
      setMessages((prev) => [...prev, ...returnedMessages]);
    } catch (e: any) {
      console.error("Voice message error:", e);
      const errorMessage = e?.message ?? "Failed to send voice message";
      setErrorText(errorMessage);
      
      // Show alert for important errors (quota, service unavailable)
      if (errorMessage.includes("temporarily unavailable") || 
          errorMessage.includes("high demand") ||
          errorMessage.includes("quota") ||
          errorMessage.includes("rate limit")) {
        Alert.alert(
          "Service Unavailable",
          errorMessage,
          [{ text: "OK" }]
        );
      }
    } finally {
      setBusy(false);
    }
  };

  // Cancel recording
  const cancelRecording = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }

    setIsRecording(false);
    setRecordingDuration(0);
  };

  // Play voice message
  const playVoiceMessage = async (messageId: string, mediaUrl: string) => {
    try {
      // Stop any currently playing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (playingMessageId === messageId) {
        setPlayingMessageId(null);
        return;
      }

      // Get session for signed URL
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;

      // Get signed URL
      const { data: signedUrlData } = await supabase.storage
        .from("voice-messages")
        .createSignedUrl(mediaUrl, 3600);

      if (!signedUrlData?.signedUrl) {
        throw new Error("Failed to get audio URL");
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: signedUrlData.signedUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingMessageId(null);
            soundRef.current?.unloadAsync();
            soundRef.current = null;
          }
        }
      );

      soundRef.current = sound;
      setPlayingMessageId(messageId);
    } catch (e: any) {
      console.error("Playback error:", e);
      setErrorText(e?.message ?? "Failed to play voice message");
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Load available coaches for selector
  const loadAvailableCoaches = async () => {
    if (!session) return;
    try {
      setLoadingCoaches(true);
      // Load system coaches
      const { data: systemData } = await supabase
        .from("coaches")
        .select("*")
        .eq("coach_type", "system")
        .order("is_default", { ascending: false });

      // Load owned coaches
      const { data: ownedData } = await supabase
        .from("coach_ownership")
        .select("coach_id, coaches(*)")
        .eq("user_id", session.user.id);

      // Load user's private coaches
      const { data: privateData } = await supabase
        .from("coaches")
        .select("*")
        .eq("coach_type", "private")
        .eq("creator_id", session.user.id);

      const owned = (ownedData || []).map((o: any) => o.coaches).filter(Boolean);
      const allCoaches = [...(systemData || []), ...owned, ...(privateData || [])];
      setAvailableCoaches(allCoaches);
    } catch (e) {
      console.error("Failed to load coaches:", e);
    } finally {
      setLoadingCoaches(false);
    }
  };

  // Load selected coach info (from profile or conversation)
  React.useEffect(() => {
    const loadSelectedCoach = async () => {
      // If conversation exists, load coach from conversation
      if (conversationId) {
        try {
          const { data: convData } = await supabase
            .from("conversations")
            .select("coach_id, coaches(name)")
            .eq("id", conversationId)
            .maybeSingle();
          if (convData?.coaches) {
            setSelectedCoach({ id: convData.coach_id, name: convData.coaches.name });
            return;
          }
        } catch (e) {
          console.error("Failed to load conversation coach:", e);
        }
      }

      // Otherwise use profile selected coach
      if (!profile?.selected_coach_id) {
        setSelectedCoach(null);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("coaches")
          .select("id, name")
          .eq("id", profile.selected_coach_id)
          .maybeSingle();
        if (!error && data) {
          setSelectedCoach({ id: data.id, name: data.name });
        }
      } catch (e) {
        console.error("Failed to load selected coach:", e);
      }
    };
    void loadSelectedCoach();
  }, [profile?.selected_coach_id, conversationId]);

  // Load available coaches when selector opens
  React.useEffect(() => {
    if (showCoachSelector && session) {
      void loadAvailableCoaches();
    }
  }, [showCoachSelector, session]);

  const onSend = async () => {
    const text = input.trim();
    if (!text) return;

    try {
      setBusy(true);
      setErrorText(null);

      // Explicitly get session to ensure it's hydrated before calling the function
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("getSession error:", sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!currentSession) {
        console.error("No session found");
        throw new Error("No active session. Please sign in again.");
      }

      if (!currentSession.access_token) {
        console.error("Session exists but no access_token");
        throw new Error("Session token missing. Please sign in again.");
      }

      console.log("Calling coach-turn with token:", currentSession.access_token.substring(0, 20) + "...");

      // Use fetch directly to guarantee the Authorization header is sent
      const response = await fetch(`${supabaseUrl}/functions/v1/coach-turn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          coachId: selectedCoach?.id ?? profile?.selected_coach_id ?? undefined,
          message: text,
          sessionType: conversationId ? undefined : selectedSessionType,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to send message. Please try again.";
        
        try {
          const errorData = await response.json();
          // Use user-friendly message if available
          errorMessage = errorData.userMessage || errorData.error || errorMessage;
        } catch {
          const errorText = await response.text().catch(() => "");
          
          // Handle specific error types
          if (response.status === 429 || errorText.includes("quota") || errorText.includes("RESOURCE_EXHAUSTED")) {
            errorMessage = "We're experiencing high demand. Please wait a moment and try again.";
          } else if (response.status === 401) {
            errorMessage = "Session expired. Please sign in again.";
          } else if (response.status >= 500) {
            errorMessage = "Service temporarily unavailable. Please try again in a moment.";
          } else if (errorText) {
            // Try to extract a readable error from the text
            try {
              const parsed = JSON.parse(errorText);
              errorMessage = parsed.error || parsed.message || errorMessage;
            } catch {
              // Keep default message
            }
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const error = null;

      if (error) {
        throw error;
      }

      if (!data || typeof data !== "object") {
        throw new Error("Unexpected response from coach-turn");
      }

      const nextConversationId = (data as any).conversationId as string | undefined;
      const returnedMessages = ((data as any).messages ?? []) as {
        id: string;
        sender: "user" | "coach";
        type: string;
        content: string;
        created_at: string;
      }[];

      if (!nextConversationId) {
        throw new Error("Missing conversationId in coach-turn response");
      }

      setConversationId(nextConversationId);
      setMessages((prev) => [...prev, ...returnedMessages]);
      setInput("");
    } catch (e: any) {
      const errorMessage = e?.message ?? "Failed to send message";
      setErrorText(errorMessage);
      
      // Show alert for important errors (quota, service unavailable, auth)
      if (errorMessage.includes("high demand") ||
          errorMessage.includes("quota") ||
          errorMessage.includes("rate limit") ||
          errorMessage.includes("temporarily unavailable") ||
          errorMessage.includes("Session expired")) {
        Alert.alert(
          errorMessage.includes("Session expired") ? "Authentication Error" : "Service Unavailable",
          errorMessage,
          [{ text: "OK" }]
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={{ flex: 1 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
            {/* Premium Header Card */}
            <View style={chatStyles.headerCard}>
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                {/* Coach Avatar */}
                <View style={chatStyles.coachAvatar}>
                  <User size={24} color={colors.primary} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={chatStyles.headerTitle}>
                    {selectedCoach ? selectedCoach.name : "Select a Coach"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                    {conversationId ? (
                      <>
                        <View style={chatStyles.activeIndicator} />
                        <Text style={chatStyles.headerSubtitle}>Active Session</Text>
                      </>
                    ) : (
                      <Text style={chatStyles.headerSubtitle}>Ready to begin</Text>
                    )}
                  </View>
                </View>
              </View>
              
              {/* Action Buttons */}
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                {conversationId && (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        "Start New Conversation",
                        "This will reset the current session. You'll be able to select a different coach.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "New Chat",
                            style: "destructive",
                            onPress: () => {
                              setConversationId(null);
                              setMessages([]);
                              setInput("");
                              setSelectedCoach(null);
                              setSelectedSessionType("deep_dive");
                            },
                          },
                        ]
                      );
                    }}
                    activeOpacity={0.7}
                    style={chatStyles.headerButton}
                  >
                    <MessageSquarePlus size={18} color={colors.foreground} strokeWidth={1.5} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    if (!conversationId) {
                      setShowCoachSelector(true);
                    } else {
                      Alert.alert("Coach Locked", "Coach is locked for this session. Tap the + button to start a new conversation.");
                    }
                  }}
                  activeOpacity={0.7}
                  style={[
                    chatStyles.headerButton,
                    conversationId && { opacity: 0.5 }
                  ]}
                >
                  <Users size={18} color={conversationId ? colors.mutedForeground : colors.foreground} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Phase 3: Session type selector (only when no active conversation) */}
            {!conversationId && (
              <View style={chatStyles.sessionTypeRow}>
                <Text style={chatStyles.sessionTypeLabel}>Session type</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={chatStyles.sessionTypeScroll}
                >
                  {SESSION_TYPES.map((st) => (
                    <TouchableOpacity
                      key={st.id}
                      onPress={() => setSelectedSessionType(st.id)}
                      activeOpacity={0.8}
                      style={[
                        chatStyles.sessionTypeChip,
                        selectedSessionType === st.id && chatStyles.sessionTypeChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          chatStyles.sessionTypeChipText,
                          selectedSessionType === st.id && chatStyles.sessionTypeChipTextSelected,
                        ]}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Chat Container with Glassmorphism */}
            <View style={chatStyles.chatContainer}>
              <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={{ paddingVertical: spacing.md, paddingHorizontal: spacing.sm }}
                showsVerticalScrollIndicator={false}
              >
                {messages.map((m) => {
                  const isUser = m.sender === "user";
                  const isVoice = m.type === "voice" && m.metadata?.media_url;
                  const isPlaying = playingMessageId === m.id;

                  return (
                    <View
                      key={m.id}
                      style={[
                        chatStyles.messageBubble,
                        isUser ? chatStyles.userBubble : chatStyles.coachBubble,
                      ]}
                    >
                      {!isUser && (
                        <View style={chatStyles.messageAvatar}>
                          <User size={12} color={colors.primary} strokeWidth={2} />
                        </View>
                      )}
                      <View style={[
                        chatStyles.messageContent,
                        isUser ? chatStyles.userMessageContent : chatStyles.coachMessageContent,
                      ]}>
                        {isVoice && (
                          <TouchableOpacity
                            onPress={() => playVoiceMessage(m.id, m.metadata.media_url)}
                            style={chatStyles.voiceIndicator}
                          >
                            <View style={[
                              chatStyles.playButton,
                              { backgroundColor: isPlaying ? colors.destructive : (isUser ? "rgba(255,255,255,0.2)" : colors.primary) }
                            ]}>
                              {isPlaying ? (
                                <Square size={12} color={colors.primaryForeground} fill={colors.primaryForeground} />
                              ) : (
                                <Play size={12} color={isUser ? colors.primary : colors.primaryForeground} fill={isUser ? colors.primary : colors.primaryForeground} />
                              )}
                            </View>
                            <Text style={[
                              chatStyles.voiceText,
                              { color: isUser ? "rgba(255,255,255,0.8)" : colors.mutedForeground }
                            ]}>
                              {isPlaying ? "Playing..." : "Voice message"}
                            </Text>
                          </TouchableOpacity>
                        )}
                        <Text style={[
                          chatStyles.messageText,
                          isUser ? chatStyles.userMessageText : chatStyles.coachMessageText,
                          isVoice && { fontStyle: "italic" }
                        ]}>
                          {m.content}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                {messages.length === 0 && (
                  <View style={chatStyles.emptyState}>
                    <View style={chatStyles.emptyIcon}>
                      <MessageCircle size={40} color={colors.mutedForeground} strokeWidth={1} />
                    </View>
                    <Text style={chatStyles.emptyTitle}>Start Your Conversation</Text>
                    <Text style={chatStyles.emptyText}>
                      Share what's on your mind or where you feel stuck. Your coach is here to guide you.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Error Message */}
            {errorText && (
              <View style={chatStyles.errorContainer}>
                <Text style={chatStyles.errorText}>{errorText}</Text>
              </View>
            )}

            {/* Input Area with Glassmorphism */}
            {isRecording ? (
              <View style={chatStyles.recordingBar}>
                <View style={chatStyles.recordingPulseContainer}>
                  <Animated.View style={[chatStyles.recordingPulse, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
                  <View style={[chatStyles.recordingPulse, { position: "absolute" }]} />
                </View>
                <Text style={chatStyles.recordingText}>
                  Recording... {formatDuration(recordingDuration)}
                </Text>
                <TouchableOpacity
                  onPress={() => void cancelRecording()}
                  style={chatStyles.recordingCancel}
                  activeOpacity={0.7}
                >
                  <X size={20} color={colors.mutedForeground} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => void stopRecordingAndSend()}
                  disabled={busy}
                  activeOpacity={0.8}
                  style={chatStyles.recordingSend}
                >
                  <Send size={18} color={colors.primaryForeground} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={chatStyles.inputBar}>
                <TouchableOpacity
                  onPress={() => void startRecording()}
                  disabled={busy}
                  activeOpacity={0.7}
                  style={chatStyles.micButton}
                >
                  <Mic size={20} color={colors.foreground} strokeWidth={1.5} />
                </TouchableOpacity>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type a message..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  style={chatStyles.textInput}
                  editable={!busy}
                />
                <TouchableOpacity
                  onPress={() => void onSend()}
                  disabled={!input.trim() || busy}
                  activeOpacity={0.8}
                  style={[
                    chatStyles.sendButton,
                    (!input.trim() || busy) && chatStyles.sendButtonDisabled
                  ]}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Send size={18} color={input.trim() ? colors.primaryForeground : colors.mutedForeground} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Coach Selector Modal */}
      <Modal
        visible={showCoachSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCoachSelector(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}>
          <LinearGradient
            colors={[colors.gradientStart, colors.background]}
            style={chatStyles.modalContainer}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.3 }}
          >
            <View style={chatStyles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Users size={22} color={colors.foreground} strokeWidth={1.5} />
                <Text style={chatStyles.modalTitle}>Select Coach</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowCoachSelector(false)}
                style={chatStyles.modalClose}
                activeOpacity={0.7}
              >
                <X size={20} color={colors.mutedForeground} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {loadingCoaches ? (
              <ActivityIndicator size="large" style={{ marginVertical: spacing.xxl }} color={colors.primary} />
            ) : availableCoaches.length === 0 ? (
              <View style={chatStyles.modalEmptyState}>
                <View style={chatStyles.modalEmptyIcon}>
                  <User size={32} color={colors.mutedForeground} strokeWidth={1} />
                </View>
                <Text style={chatStyles.modalEmptyTitle}>No coaches available</Text>
                <Text style={chatStyles.modalEmptyText}>
                  Check back soon or create your own coach in the Marketplace
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={{ maxHeight: 400 }} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: spacing.md }}
              >
                {availableCoaches.map((coach) => {
                  const isSelected = selectedCoach?.id === coach.id;
                  return (
                    <TouchableOpacity
                      key={coach.id}
                      onPress={() => {
                        setSelectedCoach({ id: coach.id, name: coach.name });
                        setShowCoachSelector(false);
                      }}
                      activeOpacity={0.7}
                      style={[
                        chatStyles.coachCard,
                        isSelected && chatStyles.coachCardSelected
                      ]}
                    >
                      <View style={[
                        chatStyles.coachCardAvatar,
                        isSelected && { borderColor: colors.primary, borderWidth: 2 }
                      ]}>
                        <User size={20} color={isSelected ? colors.primary : colors.mutedForeground} strokeWidth={1.5} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                          <Text style={chatStyles.coachCardName}>{coach.name}</Text>
                          {coach.coach_type === "system" && (
                            <View style={chatStyles.coachBadge}>
                              <Text style={chatStyles.coachBadgeText}>System</Text>
                            </View>
                          )}
                          {coach.coach_type === "private" && (
                            <View style={[chatStyles.coachBadge, { backgroundColor: colors.accentLight }]}>
                              <Text style={[chatStyles.coachBadgeText, { color: colors.accent }]}>Private</Text>
                            </View>
                          )}
                        </View>
                        {coach.description && (
                          <Text style={chatStyles.coachCardDescription} numberOfLines={2}>
                            {coach.description}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <View style={chatStyles.coachCardCheck}>
                          <Check size={14} color={colors.primaryForeground} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => setShowCoachSelector(false)}
              activeOpacity={0.8}
              style={chatStyles.modalDoneButton}
            >
              <Text style={chatStyles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const chatStyles = StyleSheet.create({
  // Header
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.glass,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.md,
  },
  coachAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glassLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  // Phase 3: Session type selector
  sessionTypeRow: {
    marginBottom: spacing.md,
  },
  sessionTypeLabel: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  sessionTypeScroll: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sessionTypeChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  sessionTypeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sessionTypeChipText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },
  sessionTypeChipTextSelected: {
    color: colors.primaryForeground,
  },

  // Chat Container
  chatContainer: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
  },

  // Messages
  messageBubble: {
    flexDirection: "row",
    marginBottom: spacing.md,
    alignItems: "flex-end",
  },
  userBubble: {
    justifyContent: "flex-end",
  },
  coachBubble: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.glassLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  messageContent: {
    maxWidth: "80%",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  userMessageContent: {
    backgroundColor: colors.primary,
    marginLeft: "auto",
    borderBottomRightRadius: spacing.xs,
    ...shadows.md,
  },
  coachMessageContent: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    ...shadows.sm,
  },
  messageText: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.relaxed * fontSize.base,
  },
  userMessageText: {
    color: colors.primaryForeground,
  },
  coachMessageText: {
    color: colors.foreground,
  },
  voiceIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  voiceText: {
    fontSize: fontSize.xs,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.glassLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: lineHeight.relaxed * fontSize.base,
  },

  // Error
  errorContainer: {
    backgroundColor: colors.destructiveLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.destructive,
    fontSize: fontSize.sm,
    textAlign: "center",
  },

  // Input Bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.xxl,
    padding: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.md,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glassLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.foreground,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: colors.muted,
    shadowOpacity: 0,
  },

  // Recording Bar
  recordingBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.xxl,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.destructive,
    ...shadows.md,
  },
  recordingPulseContainer: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.destructive,
  },
  recordingText: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  recordingCancel: {
    padding: spacing.sm,
  },
  recordingSend: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },

  // Modal
  modalContainer: {
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxxl,
    maxHeight: "85%",
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glassLight,
    alignItems: "center",
    justifyContent: "center",
  },
  modalEmptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  modalEmptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  modalEmptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  modalEmptyText: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: lineHeight.relaxed * fontSize.base,
    paddingHorizontal: spacing.xl,
  },
  coachCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  coachCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.glassLight,
  },
  coachCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  coachCardName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  coachCardDescription: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
    lineHeight: lineHeight.normal * fontSize.sm,
  },
  coachBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.secondary,
  },
  coachBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.mutedForeground,
  },
  coachCardCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  modalDoneButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    marginTop: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalDoneText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primaryForeground,
  },
});

export function SessionsScreen() {
  const { session } = useAuth();
  const navigation = useNavigation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [creating, setCreating] = useState(false);
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);
  const [endingTakeaway, setEndingTakeaway] = useState("");
  const [endingBusy, setEndingBusy] = useState(false);

  React.useEffect(() => {
    if (!session) return;
    void loadSessions();
  }, [session]);

  const loadSessions = async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from("coaching_sessions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setSessions(data || []);
    } catch (e) {
      console.error("Failed to load sessions:", e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const startNewSession = async () => {
    if (!newGoal.trim() || creating) return;

    try {
      setCreating(true);
      const { data, error } = await supabase
        .from("coaching_sessions")
        .insert({
          user_id: session!.user.id,
          goal: newGoal.trim(),
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      setNewGoal("");
      setShowNewSession(false);
      await loadSessions();

      // Navigate to coaching screen
      (navigation as any).navigate("Coaching");
    } catch (e: any) {
      console.error("Failed to create session:", e);
      alert(e?.message ?? "Failed to start session");
    } finally {
      setCreating(false);
    }
  };

  const completeSession = async (sessionId: string, takeaway: string) => {
    try {
      setEndingBusy(true);
      const { error } = await supabase
        .from("coaching_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          takeaway: takeaway.trim() || null,
        })
        .eq("id", sessionId);

      if (error) throw error;
      await loadSessions();
      setEndingSessionId(null);
      setEndingTakeaway("");
    } catch (e: any) {
      console.error("Failed to complete session:", e);
      alert(e?.message ?? "Failed to complete session");
    } finally {
      setEndingBusy(false);
    }
  };

  const activeSession = sessions.find((s) => s.status === "active");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={{ fontSize: fontSize.xxl, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
            Coaching Sessions
          </Text>
          <Text style={{ fontSize: fontSize.base, color: colors.mutedForeground, lineHeight: 24 }}>
            Start focused sessions with specific goals to guide your coaching conversations.
          </Text>
        </View>

        {/* Active Session */}
        {activeSession && (
          <View style={{
            backgroundColor: colors.card,
            padding: spacing.xl,
            borderRadius: borderRadius.lg,
            borderWidth: 2,
            borderColor: colors.primary,
            marginBottom: spacing.xl,
            ...shadows.lg,
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary }}>
                ACTIVE SESSION
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>
                {new Date(activeSession.started_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.md }}>
              {activeSession.goal}
            </Text>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate("Coaching")}
              activeOpacity={0.8}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: spacing.md,
                borderRadius: borderRadius.md,
                alignItems: "center",
                marginBottom: spacing.sm,
                ...shadows.md,
              }}
            >
              <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.primaryForeground }}>
                Continue Session
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setEndingSessionId(activeSession.id);
                setEndingTakeaway("");
              }}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.secondary,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.md,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.foreground }}>
                End Session
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Start New Session */}
        {!activeSession && !showNewSession && (
          <TouchableOpacity
            onPress={() => setShowNewSession(true)}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: spacing.lg,
              borderRadius: borderRadius.lg,
              alignItems: "center",
              marginBottom: spacing.xl,
              ...shadows.lg,
            }}
          >
            <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primaryForeground }}>
              Start New Session
            </Text>
          </TouchableOpacity>
        )}

        {/* New Session Form */}
        {!activeSession && showNewSession && (
          <View style={{
            backgroundColor: colors.card,
            padding: spacing.xl,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: spacing.xl,
            ...shadows.md,
          }}>
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
              What do you want to focus on?
            </Text>
            <TextInput
              value={newGoal}
              onChangeText={setNewGoal}
              placeholder="e.g., Clarify my career direction, Process a difficult decision..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                borderRadius: borderRadius.md,
                fontSize: fontSize.base,
                color: colors.foreground,
                minHeight: 80,
                marginBottom: spacing.md,
                backgroundColor: colors.input,
                fontWeight: fontWeight.medium,
              }}
            />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => void startNewSession()}
            disabled={!newGoal.trim() || creating}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: newGoal.trim() && !creating ? colors.primary : colors.border,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.md,
              alignItems: "center",
              ...(newGoal.trim() && !creating ? shadows.md : {}),
            }}
          >
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: newGoal.trim() && !creating ? colors.primaryForeground : colors.mutedForeground }}>
              {creating ? "Starting..." : "Start Session"}
            </Text>
          </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowNewSession(false);
                  setNewGoal("");
                }}
                style={{
                  flex: 1,
                  backgroundColor: colors.secondary,
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.sm,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Past Sessions */}
        <View>
          <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.lg }}>
            Past Sessions
          </Text>

          {loading ? (
            <ActivityIndicator size="large" style={{ marginTop: spacing.xxl }} />
          ) : sessions.filter((s) => s.status !== "active").length === 0 ? (
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, textAlign: "center", marginTop: spacing.xl }}>
              No completed sessions yet.
            </Text>
          ) : (
            <View style={{ gap: spacing.md }}>
              {sessions
                .filter((s) => s.status !== "active")
                .map((sess) => (
                  <View
                    key={sess.id}
                    style={{
                      backgroundColor: colors.card,
                      padding: spacing.lg,
                      borderRadius: borderRadius.lg,
                      borderWidth: 1,
                      borderColor: colors.border,
                      ...shadows.sm,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
                      <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>
                        {new Date(sess.started_at).toLocaleDateString()}
                      </Text>
                      <View style={{
                        backgroundColor: sess.status === "completed" ? colors.success : colors.muted,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 2,
                        borderRadius: borderRadius.sm,
                      }}>
                        <Text style={{ fontSize: fontSize.xs, color: "#fff", fontWeight: fontWeight.semibold }}>
                          {sess.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: fontSize.base, color: colors.foreground, marginBottom: spacing.sm }}>
                      {sess.goal}
                    </Text>
                    {sess.takeaway && (
                      <View style={{
                        backgroundColor: colors.secondary,
                        padding: spacing.md,
                        borderRadius: borderRadius.sm,
                        marginTop: spacing.sm,
                      }}>
                        <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginBottom: 4 }}>
                          Takeaway:
                        </Text>
                        <Text style={{ fontSize: fontSize.sm, color: colors.foreground, fontStyle: "italic" }}>
                          {sess.takeaway}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* End Session modal */}
      <Modal
        visible={endingSessionId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setEndingSessionId(null);
          setEndingTakeaway("");
        }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.xl }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
              End session
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.md }}>
              What's your key takeaway from this session? (optional)
            </Text>
            <TextInput
              value={endingTakeaway}
              onChangeText={setEndingTakeaway}
              placeholder="e.g. I want to focus on one thing at a time"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                borderRadius: borderRadius.md,
                fontSize: fontSize.base,
                color: colors.foreground,
                minHeight: 80,
                marginBottom: spacing.lg,
                backgroundColor: colors.input,
              }}
              editable={!endingBusy}
            />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => {
                  setEndingSessionId(null);
                  setEndingTakeaway("");
                }}
                disabled={endingBusy}
                style={{
                  flex: 1,
                  backgroundColor: colors.secondary,
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.sm,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => endingSessionId && void completeSession(endingSessionId, endingTakeaway)}
                disabled={endingBusy}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.sm,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.primaryForeground }}>
                  {endingBusy ? "Ending..." : "End session"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export function PersonalContextScreen() {
  const { profile, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [busy, setBusy] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const onSave = async () => {
    try {
      setBusy(true);
      setErrorText(null);
      setSuccessMessage(null);
      await updateProfile({ display_name: displayName.trim() || null });
      setSuccessMessage("Profile updated successfully");
    } catch (e: any) {
      setErrorText(e?.message ?? "Failed to update profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={{ fontSize: fontSize.xxl, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
            Personal Context
          </Text>
          <Text style={{ fontSize: fontSize.base, color: colors.mutedForeground, lineHeight: 24 }}>
            Help your coach understand you better by sharing context about your life, values, and preferences.
          </Text>
        </View>

        {/* Display Name */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
            Display Name
          </Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="How should your coach address you?"
            placeholderTextColor={colors.mutedForeground}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              fontSize: fontSize.base,
              color: colors.foreground,
              backgroundColor: colors.input,
              fontWeight: fontWeight.medium,
            }}
            editable={!busy}
          />
        </View>

        {/* Email (read-only) */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
            Email
          </Text>
          <View style={{ 
            padding: spacing.md, 
            backgroundColor: colors.secondary, 
            borderRadius: borderRadius.sm 
          }}>
            <Text style={{ fontSize: fontSize.base, color: colors.mutedForeground }}>
              {profile?.email || "Not set"}
            </Text>
          </View>
        </View>

        {/* Future Features */}
        <View style={{ 
          marginBottom: spacing.xl, 
          padding: spacing.lg, 
          backgroundColor: "#FEF3C7", 
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: "#FDE68A"
        }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginBottom: spacing.sm, color: "#92400E" }}>
            Coming Soon
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: "#78350F", lineHeight: 20 }}>
            • Select your core values{"\n"}
            • Set coaching style preferences (gentle, balanced, direct){"\n"}
            • Share life context and current focus areas
          </Text>
        </View>

        {successMessage && (
          <Text style={{ color: colors.success, marginBottom: spacing.md, fontSize: fontSize.sm }}>
            {successMessage}
          </Text>
        )}
        {errorText && (
          <Text style={{ color: colors.destructive, marginBottom: spacing.md, fontSize: fontSize.sm }}>
            {errorText}
          </Text>
        )}

        <TouchableOpacity
          onPress={() => void onSave()}
          disabled={busy}
          style={{
            backgroundColor: busy ? colors.muted : colors.primary,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.sm,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.primaryForeground }}>
            {busy ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export function ToolsScreen() {
  return <ScreenShell title="Supporting Tools" />;
}

// Circular Metric Component for Home Screen
function CircleMetric({ 
  value, 
  label, 
  icon: Icon 
}: { 
  value: string | number; 
  label: string; 
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}) {
  return (
    <View style={homeStyles.circleMetricContainer}>
      <View style={homeStyles.circleMetric}>
        <Icon size={16} color={colors.mutedForeground} strokeWidth={1.5} />
        <Text style={homeStyles.circleMetricValue}>{value}</Text>
        <Text style={homeStyles.circleMetricLabel}>{label}</Text>
      </View>
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation();
  const { profile, session } = useAuth();
  const [recentInsights, setRecentInsights] = useState<any[]>([]);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [insightsCount, setInsightsCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [pendingCommitments, setPendingCommitments] = useState<any[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [showAddCommitment, setShowAddCommitment] = useState(false);
  const [newCommitment, setNewCommitment] = useState("");
  const [commitmentDueDate, setCommitmentDueDate] = useState("");
  const [commitmentReminderDate, setCommitmentReminderDate] = useState("");
  const [commitmentContext, setCommitmentContext] = useState("");
  const [editingCommitmentId, setEditingCommitmentId] = useState<string | null>(null);

  const loadData = async () => {
    if (!session) return;
    try {
      // Load insights
      const { data: insights, error: insightsError } = await supabase
        .from("insights")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!insightsError && insights) {
        setRecentInsights(insights);
        setInsightsCount(insights.length);
      }

      // Load sessions count and streak from profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("total_sessions, streak_count")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setSessionsCount(profileData.total_sessions || 0);
        setStreakCount(profileData.streak_count || 0);
      } else {
        // Fallback to counting sessions
        const { count } = await supabase
          .from("coaching_sessions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id);
        if (count !== null) setSessionsCount(count);
      }

      // Load pending commitments
      const { data: commitments, error: commitmentsError } = await supabase
        .from("commitments")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "pending")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(3);

      if (!commitmentsError && commitments) {
        setPendingCommitments(commitments);
      }

      // Set a personalized prompt based on commitments or insights
      if (commitments && commitments.length > 0) {
        const commitment = commitments[0];
        setLastPrompt(`You committed to "${commitment.commitment}". How's that going?`);
      } else if (insights && insights.length > 0) {
        const lastInsight = insights[0];
        const summary = lastInsight.summary || "";
        if (summary.toLowerCase().includes("boundaries")) {
          setLastPrompt("Yesterday, we explored setting boundaries. How did that tough conversation go?");
        } else if (summary.toLowerCase().includes("goal")) {
          setLastPrompt("Last time, we discussed your goals. Have you made progress on your first step?");
        } else {
          setLastPrompt("Ready to continue your growth journey? Let's pick up where we left off.");
        }
      } else {
        setLastPrompt("Start your first coaching session to begin your growth journey.");
      }
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setLoadingInsights(false);
    }
  };

  const markCommitmentDone = async (commitmentId: string) => {
    try {
      await supabase
        .from("commitments")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", commitmentId);
      
      // Refresh data
      await loadData();
      Alert.alert("Well done!", "Great job completing your commitment!");
    } catch (e) {
      console.error("Failed to mark commitment done:", e);
      Alert.alert("Error", "Failed to mark commitment as done. Please try again.");
    }
  };

  const addDays = (yyyyMmDd: string | null | undefined, days: number) => {
    const base = yyyyMmDd ? new Date(yyyyMmDd + "T00:00:00") : new Date();
    const next = new Date(base.getTime());
    next.setDate(next.getDate() + days);
    return next.toISOString().slice(0, 10);
  };

  const openCommitmentActions = (commitment: any) => {
    Alert.alert(
      "Commitment",
      commitment.commitment,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit",
          onPress: () => {
            setEditingCommitmentId(commitment.id);
            setNewCommitment(commitment.commitment ?? "");
            setCommitmentContext(commitment.context ?? "");
            setCommitmentDueDate(commitment.due_date ?? "");
            setCommitmentReminderDate(commitment.reminder_date ?? "");
            setShowAddCommitment(true);
          },
        },
        {
          text: "Snooze 1 day",
          onPress: async () => {
            if (!session) return;
            try {
              const nextDue = addDays(commitment.due_date ?? null, 1);
              const { error } = await supabase
                .from("commitments")
                .update({
                  due_date: nextDue,
                  reminder_date: nextDue,
                  status: "rescheduled",
                })
                .eq("id", commitment.id)
                .eq("user_id", session.user.id);
              if (error) throw error;
              await loadData();
            } catch (e: any) {
              console.error("Failed to snooze commitment:", e);
              Alert.alert("Error", e?.message || "Failed to snooze commitment.");
            }
          },
        },
        {
          text: "Mark done",
          style: "default",
          onPress: () => void markCommitmentDone(commitment.id),
        },
      ],
    );
  };

  const addCommitment = async () => {
    if (!newCommitment.trim() || !session) return;
    
    try {
      const commitmentData: any = {
        commitment: newCommitment.trim(),
        context: commitmentContext.trim() || null,
        status: "pending",
        due_date: commitmentDueDate || null,
        reminder_date: commitmentReminderDate || null,
      };

      if (editingCommitmentId) {
        const { error } = await supabase
          .from("commitments")
          .update(commitmentData)
          .eq("id", editingCommitmentId)
          .eq("user_id", session.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("commitments")
          .insert({
            user_id: session.user.id,
            ...commitmentData,
          });
        if (error) throw error;
      }

      // Reset form and refresh
      setNewCommitment("");
      setCommitmentDueDate("");
      setCommitmentReminderDate("");
      setCommitmentContext("");
      setEditingCommitmentId(null);
      setShowAddCommitment(false);
      await loadData();
      Alert.alert("Success", editingCommitmentId ? "Commitment updated!" : "Commitment added!");
    } catch (e: any) {
      console.error("Failed to add commitment:", e);
      Alert.alert("Error", e?.message || "Failed to add commitment. Please try again.");
    }
  };

  React.useEffect(() => {
    void loadData();
  }, [session]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    };
    return new Date().toLocaleDateString("en-US", options);
  };

  const userName = profile?.display_name || "there";

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={{ flex: 1 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView 
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={homeStyles.header}>
              <View style={{ flex: 1 }}>
                <Text style={homeStyles.greeting}>
                  {getGreeting()}, <Text style={{ fontWeight: fontWeight.bold }}>{userName}</Text>
                </Text>
                <Text style={homeStyles.dateText}>{getFormattedDate()}</Text>
              </View>
              <TouchableOpacity 
                style={homeStyles.menuButton}
                activeOpacity={0.7}
              >
                <MoreVertical size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Your Growth Journey Section */}
            <View style={homeStyles.sectionHeader}>
              <Text style={homeStyles.sectionTitle}>Your Growth Journey</Text>
            </View>

            {/* Metric Circles Row */}
            <View style={homeStyles.metricsRow}>
              <CircleMetric 
                value={sessionsCount} 
                label="Sessions" 
                icon={Calendar} 
              />
              <CircleMetric 
                value={`${streakCount}`} 
                label="Day Streak" 
                icon={Flame} 
              />
              <CircleMetric 
                value={insightsCount} 
                label="Insights Gained" 
                icon={Lightbulb} 
              />
            </View>

            {/* Growth Tree */}
            <View style={homeStyles.treeContainer}>
              <GrowthTree 
                insightsCount={insightsCount} 
                sessionsCount={sessionsCount} 
              />
            </View>

            {/* Daily Spark Card */}
            <View style={homeStyles.dailySparkCard}>
              <Text style={homeStyles.dailySparkTitle}>Daily Spark</Text>
              
              {/* Primary CTA */}
              <TouchableOpacity
                onPress={() => (navigation as any).navigate("Coaching")}
                activeOpacity={0.85}
                style={homeStyles.primaryButton}
              >
                <Text style={homeStyles.primaryButtonText}>
                  Start a coaching session
                </Text>
              </TouchableOpacity>

              {/* Personalized Prompt */}
              <Text style={homeStyles.personalizedPrompt}>
                {lastPrompt}
              </Text>

              {/* Pending Commitments */}
              <View style={homeStyles.commitmentsSection}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
                  <Text style={homeStyles.commitmentsSectionTitle}>Your Commitments</Text>
                  <TouchableOpacity
                    onPress={() => setShowAddCommitment(true)}
                    style={homeStyles.addCommitmentButton}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color={colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                {pendingCommitments.length > 0 ? (
                  pendingCommitments.map((commitment) => (
                    <View key={commitment.id} style={homeStyles.commitmentCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={homeStyles.commitmentText}>{commitment.commitment}</Text>
                        {!!commitment.context && (
                          <Text style={homeStyles.commitmentContext} numberOfLines={2}>
                            {commitment.context}
                          </Text>
                        )}
                        {commitment.due_date && (
                          <Text style={homeStyles.commitmentDueDate}>
                            Due: {new Date(commitment.due_date).toLocaleDateString()}
                          </Text>
                        )}
                        {commitment.reminder_date && (
                          <Text style={homeStyles.commitmentReminder}>
                            Reminder: {new Date(commitment.reminder_date).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => openCommitmentActions(commitment)}
                        style={homeStyles.commitmentMenuButton}
                        activeOpacity={0.7}
                      >
                        <MoreVertical size={18} color={colors.mutedForeground} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => markCommitmentDone(commitment.id)}
                        style={homeStyles.commitmentCheckButton}
                        activeOpacity={0.7}
                      >
                        <Check size={20} color={colors.success} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowAddCommitment(true)}
                    style={homeStyles.emptyCommitmentCard}
                    activeOpacity={0.7}
                  >
                    <Plus size={20} color={colors.mutedForeground} strokeWidth={2} />
                    <Text style={homeStyles.emptyCommitmentText}>Add a commitment</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Add Commitment Modal */}
              <Modal
                visible={showAddCommitment}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddCommitment(false)}
              >
                <View style={homeStyles.modalOverlay}>
                  <View style={homeStyles.modalContent}>
                    <View style={homeStyles.modalHeader}>
                      <Text style={homeStyles.modalTitle}>{editingCommitmentId ? "Edit Commitment" : "Add Commitment"}</Text>
                      <TouchableOpacity
                        onPress={() => setShowAddCommitment(false)}
                        style={homeStyles.modalCloseButton}
                      >
                        <X size={24} color={colors.foreground} />
                      </TouchableOpacity>
                    </View>
                    
                    <TextInput
                      value={newCommitment}
                      onChangeText={setNewCommitment}
                      placeholder="What do you want to commit to?"
                      multiline
                      style={homeStyles.modalInput}
                      placeholderTextColor={colors.mutedForeground}
                    />

                    <TextInput
                      value={commitmentContext}
                      onChangeText={setCommitmentContext}
                      placeholder="Why does this matter to you? (optional)"
                      multiline
                      style={homeStyles.modalInput}
                      placeholderTextColor={colors.mutedForeground}
                    />
                    
                    <TextInput
                      value={commitmentDueDate}
                      onChangeText={setCommitmentDueDate}
                      placeholder="Due date (YYYY-MM-DD) - Optional"
                      style={[homeStyles.modalInput, { minHeight: 52, textAlignVertical: "center" }]}
                      placeholderTextColor={colors.mutedForeground}
                    />

                    <TextInput
                      value={commitmentReminderDate}
                      onChangeText={setCommitmentReminderDate}
                      placeholder="Reminder date (YYYY-MM-DD) - Optional"
                      style={[homeStyles.modalInput, { minHeight: 52, textAlignVertical: "center" }]}
                      placeholderTextColor={colors.mutedForeground}
                    />
                    
                    <TouchableOpacity
                      onPress={addCommitment}
                      style={[homeStyles.modalButton, !newCommitment.trim() && homeStyles.modalButtonDisabled]}
                      disabled={!newCommitment.trim()}
                      activeOpacity={0.7}
                    >
                      <Text style={homeStyles.modalButtonText}>{editingCommitmentId ? "Save" : "Add Commitment"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {/* Secondary Actions Row */}
              <View style={homeStyles.secondaryActionsRow}>
                <TouchableOpacity 
                  style={homeStyles.secondaryButton}
                  activeOpacity={0.7}
                  onPress={() => {}}
                >
                  <Share2 size={16} color={colors.foreground} strokeWidth={1.5} />
                  <Text style={homeStyles.secondaryButtonText}>Share experience</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={homeStyles.secondaryButton}
                  activeOpacity={0.7}
                  onPress={() => (navigation as any).navigate("Coaching")}
                >
                  <RefreshCw size={16} color={colors.foreground} strokeWidth={1.5} />
                  <Text style={homeStyles.secondaryButtonText}>Try a Quick Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const homeStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
    marginBottom: 4,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  menuButton: {
    padding: spacing.sm,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  circleMetricContainer: {
    alignItems: "center",
  },
  circleMetric: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  circleMetricValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginTop: 4,
  },
  circleMetricLabel: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: 2,
    textAlign: "center",
  },
  treeContainer: {
    alignItems: "center",
    marginVertical: spacing.lg,
    minHeight: 200,
  },
  dailySparkCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  dailySparkTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primaryForeground,
  },
  personalizedPrompt: {
    fontSize: fontSize.base,
    color: colors.foreground,
    lineHeight: lineHeight.relaxed * fontSize.base,
    marginBottom: spacing.lg,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  secondaryButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  // Commitments Section
  commitmentsSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  commitmentsSectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  commitmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glassLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  commitmentText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
    flex: 1,
  },
  commitmentDueDate: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
  commitmentContext: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  commitmentReminder: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
  commitmentMenuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassLight,
  },
  commitmentCheckButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  addCommitmentButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  emptyCommitmentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.glassLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderStyle: "dashed",
  },
  emptyCommitmentText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.foreground,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    marginTop: spacing.md,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: colors.primaryForeground,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});

// Achievement badge definitions for Phase 2 Growth Dashboard
const JOURNEY_BADGES = [
  { id: "first_session", title: "First Step", icon: Sparkles, minSessions: 1 },
  { id: "week_streak", title: "7-Day Streak", icon: Flame, minStreak: 7 },
  { id: "ten_sessions", title: "10 Sessions", icon: MessageCircle, minSessions: 10 },
  { id: "thirty_sessions", title: "30 Sessions", icon: Trophy, minSessions: 30 },
  { id: "five_insights", title: "5 Insights", icon: Lightbulb, minInsights: 5 },
  { id: "commitment_keeper", title: "Commitment Keeper", icon: CheckCircle, minCommitmentsKept: 3 },
] as const;

const journeyStyles = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxxl },
  headerCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
    ...shadows.md,
  },
  headerTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.semibold, color: colors.foreground, marginBottom: spacing.xs },
  headerSubtitle: { fontSize: fontSize.sm, color: colors.mutedForeground, lineHeight: 20 },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: spacing.lg, marginBottom: spacing.xl, gap: spacing.md },
  metricCard: {
    minWidth: "30%",
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    ...shadows.sm,
  },
  metricValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.foreground },
  metricLabel: { fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 2 },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.foreground, marginBottom: spacing.md, marginHorizontal: spacing.lg },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: spacing.lg, marginBottom: spacing.xl, gap: spacing.sm },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: spacing.xs,
  },
  badgeLocked: { opacity: 0.5 },
  badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.foreground },
  timelineSection: { marginHorizontal: spacing.lg, marginBottom: spacing.xl },
  timelineItem: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  timelineItemSummary: { borderLeftColor: colors.primary },
  timelineItemInsight: { borderLeftColor: colors.accent },
  timelineDate: { fontSize: fontSize.xs, color: colors.mutedForeground, marginBottom: spacing.xs },
  timelineBody: { fontSize: fontSize.sm, color: colors.foreground, lineHeight: 20, fontWeight: fontWeight.medium },
  timelineMeta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  timelineTag: { backgroundColor: colors.secondary, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  timelineTagText: { fontSize: fontSize.xs, color: colors.mutedForeground },
  emptyState: { alignItems: "center", paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground, marginBottom: spacing.sm, textAlign: "center" },
  emptyText: { fontSize: fontSize.sm, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
  errorCard: { alignItems: "center", marginTop: spacing.xl, padding: spacing.xl },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md, ...shadows.sm },
  retryButtonText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.primaryForeground },
});

export function JourneyScreen() {
  const { session, profile } = useAuth();
  const [insights, setInsights] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [commitmentsTotal, setCommitmentsTotal] = useState(0);
  const [commitmentsDone, setCommitmentsDone] = useState(0);
  const [goalsCompleted, setGoalsCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    const userId = session.user.id;
    try {
      setError(null);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("total_sessions, streak_count")
        .eq("id", userId)
        .single();
      setTotalSessions(profileData?.total_sessions ?? 0);
      setStreakCount(profileData?.streak_count ?? 0);

      const { data: insightsData, error: insightsErr } = await supabase
        .from("insights")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (insightsErr) throw insightsErr;
      setInsights(insightsData || []);

      const [summariesRes, commitmentsRes, goalsRes] = await Promise.all([
        supabase.from("session_summaries").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
        supabase.from("commitments").select("status").eq("user_id", userId),
        supabase.from("user_goals").select("status").eq("user_id", userId),
      ]);
      setSummaries(summariesRes.data ?? []);
      const commitments = commitmentsRes.data ?? [];
      setCommitmentsTotal(commitments.length);
      setCommitmentsDone(commitments.filter((c: any) => c.status === "completed").length);
      setGoalsCompleted((goalsRes.data ?? []).filter((g: any) => g.status === "completed").length);
    } catch (e: any) {
      console.error("Journey load error:", e);
      setError(e?.message || "Failed to load progress");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void loadData();
  }, [session]);

  useFocusEffect(
    React.useCallback(() => {
      if (session) void loadData();
    }, [session])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const commitmentsKeptPct = commitmentsTotal > 0 ? Math.round((commitmentsDone / commitmentsTotal) * 100) : null;
  const timelineItems = useMemo(() => {
    const items: { type: "summary" | "insight"; date: string; data: any }[] = [];
    summaries.forEach((s) => items.push({ type: "summary", date: s.created_at, data: s }));
    insights.forEach((i) => items.push({ type: "insight", date: i.created_at, data: i }));
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items.slice(0, 25);
  }, [summaries, insights]);

  const unlockedBadges = useMemo(() => {
    return JOURNEY_BADGES.filter((b) => {
      if ("minSessions" in b && (b as any).minSessions) return totalSessions >= (b as any).minSessions;
      if ("minStreak" in b && (b as any).minStreak) return streakCount >= (b as any).minStreak;
      if ("minInsights" in b && (b as any).minInsights) return insights.length >= (b as any).minInsights;
      if ("minCommitmentsKept" in b && (b as any).minCommitmentsKept) return commitmentsDone >= (b as any).minCommitmentsKept;
      return false;
    });
  }, [totalSessions, streakCount, insights.length, commitmentsDone]);

  return (
    <View style={journeyStyles.wrapper}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={journeyStyles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <View style={journeyStyles.headerCard}>
            <Text style={journeyStyles.headerTitle}>Growth Dashboard</Text>
            <Text style={journeyStyles.headerSubtitle}>
              Your progress, milestones, and journey at a glance.
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" style={{ marginTop: spacing.xxl }} />
          ) : error ? (
            <View style={journeyStyles.errorCard}>
              <Text style={[journeyStyles.emptyTitle, { color: colors.destructive }]}>Failed to load</Text>
              <Text style={journeyStyles.emptyText}>{error}</Text>
              <TouchableOpacity onPress={() => void loadData()} style={journeyStyles.retryButton}>
                <Text style={journeyStyles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={journeyStyles.metricsRow}>
                <View style={journeyStyles.metricCard}>
                  <BarChart3 size={20} color={colors.primary} />
                  <Text style={journeyStyles.metricValue}>{totalSessions}</Text>
                  <Text style={journeyStyles.metricLabel}>Sessions</Text>
                </View>
                <View style={journeyStyles.metricCard}>
                  <Flame size={20} color={colors.warning} />
                  <Text style={journeyStyles.metricValue}>{streakCount}</Text>
                  <Text style={journeyStyles.metricLabel}>Streak</Text>
                </View>
                <View style={journeyStyles.metricCard}>
                  <Lightbulb size={20} color={colors.accent} />
                  <Text style={journeyStyles.metricValue}>{insights.length}</Text>
                  <Text style={journeyStyles.metricLabel}>Insights</Text>
                </View>
                <View style={journeyStyles.metricCard}>
                  <Target size={20} color={colors.success} />
                  <Text style={journeyStyles.metricValue}>{goalsCompleted}</Text>
                  <Text style={journeyStyles.metricLabel}>Goals</Text>
                </View>
                <View style={journeyStyles.metricCard}>
                  <CheckCircle size={20} color={colors.primary} />
                  <Text style={journeyStyles.metricValue}>{commitmentsKeptPct != null ? `${commitmentsKeptPct}%` : "—"}</Text>
                  <Text style={journeyStyles.metricLabel}>Kept</Text>
                </View>
              </View>

              <Text style={journeyStyles.sectionTitle}>Achievements</Text>
              <View style={journeyStyles.badgesRow}>
                {JOURNEY_BADGES.map((badge) => {
                  const unlocked = unlockedBadges.some((u) => u.id === badge.id);
                  const Icon = badge.icon;
                  return (
                    <View key={badge.id} style={[journeyStyles.badge, !unlocked && journeyStyles.badgeLocked]}>
                      <Icon size={14} color={unlocked ? colors.primary : colors.mutedForeground} />
                      <Text style={journeyStyles.badgeText}>{badge.title}</Text>
                    </View>
                  );
                })}
              </View>

              <Text style={journeyStyles.sectionTitle}>Timeline</Text>
              <View style={journeyStyles.timelineSection}>
                {timelineItems.length === 0 ? (
                  <View style={journeyStyles.emptyState}>
                    <View style={journeyStyles.emptyIcon}>
                      <MessageCircle size={28} color={colors.mutedForeground} />
                    </View>
                    <Text style={journeyStyles.emptyTitle}>No activity yet</Text>
                    <Text style={journeyStyles.emptyText}>
                      Start coaching sessions to see summaries and insights here.
                    </Text>
                  </View>
                ) : (
                  timelineItems.map((item) => {
                    const isSummary = item.type === "summary";
                    const key = isSummary ? `s-${item.data.id}` : `i-${item.data.id}`;
                    return (
                      <View
                        key={key}
                        style={[
                          journeyStyles.timelineItem,
                          isSummary ? journeyStyles.timelineItemSummary : journeyStyles.timelineItemInsight,
                        ]}
                      >
                        <Text style={journeyStyles.timelineDate}>
                          {new Date(item.date).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })}
                        </Text>
                        <Text style={journeyStyles.timelineBody} numberOfLines={4}>
                          {isSummary ? item.data.summary : item.data.summary}
                        </Text>
                        <View style={journeyStyles.timelineMeta}>
                          {isSummary && item.data.key_topics?.length > 0 && (
                            <View style={journeyStyles.timelineTag}>
                              <Text style={journeyStyles.timelineTagText}>{item.data.key_topics[0]}</Text>
                            </View>
                          )}
                          {isSummary && item.data.emotional_tone && (
                            <View style={journeyStyles.timelineTag}>
                              <Text style={journeyStyles.timelineTagText}>{item.data.emotional_tone}</Text>
                            </View>
                          )}
                          {!isSummary && item.data.themes && (
                            <View style={journeyStyles.timelineTag}>
                              <Text style={journeyStyles.timelineTagText}>
                                {Array.isArray(item.data.themes) ? item.data.themes[0] : String(item.data.themes).split(",")[0]}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export function MarketplaceScreen() {
  const navigation = useNavigation<any>();
  const { session, profile, updateProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "free" | "premium" | "top-rated" | "popular">("all");
  const [systemCoaches, setSystemCoaches] = useState<any[]>([]);
  const [marketplaceCoaches, setMarketplaceCoaches] = useState<any[]>([]);
  const [ownedCoaches, setOwnedCoaches] = useState<any[]>([]);
  const [privateCoaches, setPrivateCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);

  const selectedCoachId = profile?.selected_coach_id;

  const loadCoaches = async () => {
    if (!session) return;
    try {
      // Load system coaches
      const { data: systemData } = await supabase
        .from("coaches")
        .select("*")
        .eq("coach_type", "system")
        .order("is_default", { ascending: false });

      // Load marketplace coaches (public creator coaches)
      const { data: marketplaceData } = await supabase
        .from("coaches")
        .select("*")
        .eq("coach_type", "creator")
        .eq("is_public", true)
        .order("download_count", { ascending: false });

      // Load owned coaches
      const { data: ownedData } = await supabase
        .from("coach_ownership")
        .select("coach_id, coaches(*)")
        .eq("user_id", session.user.id);

      // Load user's private coaches
      const { data: privateData } = await supabase
        .from("coaches")
        .select("*")
        .eq("coach_type", "private")
        .eq("creator_id", session.user.id);

      setSystemCoaches(systemData || []);
      setMarketplaceCoaches(marketplaceData || []);
      setOwnedCoaches((ownedData || []).map((o: any) => o.coaches).filter(Boolean));
      setPrivateCoaches(privateData || []);
    } catch (e) {
      console.error("Failed to load coaches:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void loadCoaches();
  }, [session]);

  // Refresh when screen comes into focus (e.g., after creating a coach)
  useFocusEffect(
    React.useCallback(() => {
      void loadCoaches();
    }, [session])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCoaches();
    setRefreshing(false);
  };

  const selectCoach = async (coachId: string) => {
    try {
      setSelecting(coachId);
      // Check if user owns this coach (or it's free/system)
      const coach = [...systemCoaches, ...marketplaceCoaches, ...ownedCoaches, ...privateCoaches].find(c => c.id === coachId);
      if (!coach) throw new Error("Coach not found");

      // If it's a paid marketplace coach and user doesn't own it, add to ownership (free for now)
      if (coach.coach_type === "creator" && coach.price_type !== "free") {
        const { error: ownershipError } = await supabase
          .from("coach_ownership")
          .insert({
            user_id: session!.user.id,
            coach_id: coachId,
            purchase_type: coach.price_type,
            purchase_price: coach.price_amount || 0,
          })
          .select()
          .single();

        if (ownershipError && ownershipError.code !== "23505") { // Ignore duplicate key error
          throw ownershipError;
        }
      }

      await updateProfile({ selected_coach_id: coachId });
    } catch (e: any) {
      console.error("Failed to select coach:", e);
      alert(e?.message ?? "Failed to select coach");
    } finally {
      setSelecting(null);
    }
  };

  const startCoaching = async (coachId: string) => {
    try {
      // First select the coach if not already selected
      if (selectedCoachId !== coachId) {
        await selectCoach(coachId);
      }
      // Navigate to coaching screen
      navigation.navigate("Coaching");
    } catch (e: any) {
      console.error("Failed to start coaching:", e);
      alert(e?.message ?? "Failed to start coaching");
    }
  };

  // Calculate relevance score for a coach based on search query
  const calculateRelevanceScore = (coach: any, query: string): number => {
    if (!query) return 0;
    
    const lowerQuery = query.toLowerCase().trim();
    const lowerName = coach.name?.toLowerCase() || "";
    const lowerDescription = coach.description?.toLowerCase() || "";
    const lowerCategory = coach.category?.toLowerCase() || "";
    const focusAreas = (coach.focus_areas || []).map((fa: string) => fa.toLowerCase());
    const lowerIntendedUse = coach.intended_use?.toLowerCase() || "";
    
    let score = 0;
    
    // Exact name match (highest priority)
    if (lowerName === lowerQuery) {
      score += 1000;
    }
    // Name starts with query
    else if (lowerName.startsWith(lowerQuery)) {
      score += 500;
    }
    // Name contains query
    else if (lowerName.includes(lowerQuery)) {
      score += 300;
      // Bonus if it's at the beginning of a word
      const words = lowerName.split(/\s+/);
      if (words.some(word => word.startsWith(lowerQuery))) {
        score += 100;
      }
    }
    
    // Description contains query
    if (lowerDescription.includes(lowerQuery)) {
      score += 100;
      // Bonus if it's near the beginning
      const index = lowerDescription.indexOf(lowerQuery);
      if (index < 50) {
        score += 50;
      }
    }
    
    // Category match
    if (lowerCategory.includes(lowerQuery)) {
      score += 150;
    }
    
    // Focus areas match
    focusAreas.forEach((area: string) => {
      if (area.includes(lowerQuery)) {
        score += 80;
      }
    });
    
    // Intended use match
    if (lowerIntendedUse.includes(lowerQuery)) {
      score += 70;
    }
    
    // Boost system coaches slightly (they're more reliable)
    if (coach.coach_type === "system") {
      score += 10;
    }
    
    // Boost owned coaches (user already has them)
    if (isOwned(coach.id)) {
      score += 5;
    }
    
    return score;
  };

  const getFilteredCoaches = () => {
    let all: any[] = [];
    
    // When searching, include ALL coaches (system, owned, created, marketplace)
    if (searchQuery) {
      all = [...systemCoaches, ...ownedCoaches, ...privateCoaches, ...marketplaceCoaches];
    } else {
      // When not searching, use filter logic
      all = [...systemCoaches];
      
      if (activeFilter === "all") {
        all = [...all, ...marketplaceCoaches];
      } else if (activeFilter === "free") {
        all = [...all, ...marketplaceCoaches.filter(c => c.price_type === "free" || !c.price_type)];
      } else if (activeFilter === "premium") {
        all = marketplaceCoaches.filter(c => c.price_type !== "free" && c.price_type);
      } else if (activeFilter === "top-rated") {
        all = [...all, ...marketplaceCoaches].sort((a, b) => (b.rating_average || 0) - (a.rating_average || 0));
      } else if (activeFilter === "popular") {
        all = [...all, ...marketplaceCoaches].sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.trim();
      // Filter coaches that match the search
      all = all.filter(c => {
        const lowerQuery = query.toLowerCase();
        const lowerName = c.name?.toLowerCase() || "";
        const lowerDescription = c.description?.toLowerCase() || "";
        const lowerCategory = c.category?.toLowerCase() || "";
        const focusAreas = (c.focus_areas || []).map((fa: string) => fa.toLowerCase());
        const lowerIntendedUse = c.intended_use?.toLowerCase() || "";
        
        return (
          lowerName.includes(lowerQuery) ||
          lowerDescription.includes(lowerQuery) ||
          lowerCategory.includes(lowerQuery) ||
          focusAreas.some((area: string) => area.includes(lowerQuery)) ||
          lowerIntendedUse.includes(lowerQuery)
        );
      });
      
      // Sort by relevance score (highest first)
      all = all.sort((a, b) => {
        const scoreA = calculateRelevanceScore(a, query);
        const scoreB = calculateRelevanceScore(b, query);
        return scoreB - scoreA; // Descending order
      });
    }

    return all;
  };

  const isOwned = (coachId: string) => {
    return ownedCoaches.some(c => c.id === coachId) || 
           systemCoaches.some(c => c.id === coachId) ||
           privateCoaches.some(c => c.id === coachId);
  };

  const getPriceDisplay = (coach: any) => {
    if (coach.coach_type === "system" || coach.price_type === "free" || !coach.price_type) return "Free";
    if (coach.price_type === "one_time") return `$${coach.price_amount?.toFixed(2) || "0.00"}`;
    if (coach.price_type === "subscription") return `$${coach.price_amount?.toFixed(2) || "0.00"}/mo`;
    return "Free";
  };

  const renderCoachCard = (coach: any) => {
    const owned = isOwned(coach.id);
    const isSelected = selectedCoachId === coach.id || (!selectedCoachId && coach.is_default);
    const isSelecting = selecting === coach.id;

    return (
      <TouchableOpacity
        key={coach.id}
        activeOpacity={0.95}
        style={[
          marketplaceStyles.coachCard,
          isSelected && marketplaceStyles.coachCardSelected
        ]}
      >
        {/* Coach Avatar and Header */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md }}>
          <View style={[
            marketplaceStyles.coachAvatar,
            isSelected && { borderColor: colors.primary, borderWidth: 2 }
          ]}>
            <User size={20} color={isSelected ? colors.primary : colors.mutedForeground} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: spacing.xs }}>
              <Text style={marketplaceStyles.coachName}>{coach.name}</Text>
              {coach.coach_type === "system" && (
                <View style={[marketplaceStyles.coachTypeBadge, { backgroundColor: colors.accentLight }]}>
                  <Sparkles size={10} color={colors.accent} strokeWidth={2} />
                  <Text style={[marketplaceStyles.coachTypeBadgeText, { color: colors.accent }]}>System</Text>
                </View>
              )}
              {coach.coach_type === "private" && (
                <View style={[marketplaceStyles.coachTypeBadge, { backgroundColor: colors.successLight }]}>
                  <Text style={[marketplaceStyles.coachTypeBadgeText, { color: colors.success }]}>Private</Text>
                </View>
              )}
              {coach.coach_type === "creator" && (
                <View style={[marketplaceStyles.coachTypeBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={marketplaceStyles.coachTypeBadgeText}>Creator</Text>
                </View>
              )}
              {coach.price_type && coach.price_type !== "free" && (
                <View style={[marketplaceStyles.coachTypeBadge, { backgroundColor: colors.warning + "20" }]}>
                  <Crown size={10} color={colors.warning} strokeWidth={2} />
                  <Text style={[marketplaceStyles.coachTypeBadgeText, { color: colors.warning }]}>Premium</Text>
                </View>
              )}
            </View>
            {coach.description && (
              <Text style={marketplaceStyles.coachDescription}>
                {coach.description}
              </Text>
            )}
          </View>
        </View>

        {/* Focus Areas - Glassmorphism Tags */}
        {coach.focus_areas && coach.focus_areas.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md }}>
            {coach.focus_areas.slice(0, 3).map((area: string, idx: number) => (
              <View key={idx} style={marketplaceStyles.focusTag}>
                <Text style={marketplaceStyles.focusTagText}>{area}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stats and Actions Row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            {coach.rating_average && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Star size={14} color={colors.warning} fill={colors.warning} strokeWidth={1.5} />
                <Text style={marketplaceStyles.coachStat}>{coach.rating_average.toFixed(1)}</Text>
              </View>
            )}
            {coach.download_count > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Download size={14} color={colors.mutedForeground} strokeWidth={1.5} />
                <Text style={marketplaceStyles.coachStat}>
                  {(coach.download_count / 1000).toFixed(1)}k
                </Text>
              </View>
            )}
            {owned && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Check size={14} color={colors.success} strokeWidth={2} />
                <Text style={[marketplaceStyles.coachStat, { color: colors.success }]}>Owned</Text>
              </View>
            )}
          </View>
          {isSelected ? (
            <TouchableOpacity
              onPress={() => startCoaching(coach.id)}
              activeOpacity={0.8}
              style={marketplaceStyles.startButton}
            >
              <Text style={marketplaceStyles.startButtonText}>
                Start Coaching
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => selectCoach(coach.id)}
              disabled={isSelecting || (!owned && coach.price_type !== "free" && coach.coach_type !== "private")}
              activeOpacity={0.7}
              style={[
                marketplaceStyles.selectButton,
                (!owned && coach.price_type !== "free" && coach.coach_type !== "private") && marketplaceStyles.selectButtonDisabled
              ]}
            >
              {isSelecting ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Text style={[
                  marketplaceStyles.selectButtonText,
                  (!owned && coach.price_type !== "free" && coach.coach_type !== "private") && { color: colors.mutedForeground }
                ]}>
                  {owned || coach.coach_type === "private" ? "Select" : getPriceDisplay(coach)}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const totalCoaches = systemCoaches.length + marketplaceCoaches.length + ownedCoaches.length + privateCoaches.length;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={{ flex: 1 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}
          >
            {/* Premium Header Card */}
            <View style={marketplaceStyles.headerCard}>
              <View style={{ flex: 1 }}>
                <Text style={marketplaceStyles.headerTitle}>
                  Coach Marketplace
                </Text>
                <Text style={marketplaceStyles.headerSubtitle}>
                  Discover coaches created by the community
                </Text>
              </View>
              {!loading && (
                <View style={marketplaceStyles.statsBadge}>
                  <Text style={marketplaceStyles.statsBadgeText}>{totalCoaches}</Text>
                </View>
              )}
            </View>

            {/* Search Bar with Glassmorphism */}
            <View style={{ marginBottom: spacing.md }}>
              <View style={marketplaceStyles.searchBar}>
                <Search size={20} color={colors.mutedForeground} strokeWidth={1.5} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search coaches..."
                  placeholderTextColor={colors.mutedForeground}
                  style={marketplaceStyles.searchInput}
                />
              </View>
            </View>

        {/* Filter Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {(["all", "free", "premium", "top-rated", "popular"] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.full,
                  backgroundColor: activeFilter === filter ? colors.primary : colors.card,
                  borderWidth: activeFilter === filter ? 0 : 1,
                  borderColor: colors.border,
                  ...(activeFilter === filter ? shadows.sm : {}),
                }}
              >
                <Text style={{
                  fontSize: fontSize.sm,
                  fontWeight: activeFilter === filter ? fontWeight.semibold : fontWeight.medium,
                  color: activeFilter === filter ? colors.primaryForeground : colors.foreground,
                }}>
                  {filter === "all" ? "All" : filter === "top-rated" ? "Top Rated" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

            {/* Create Your Own Coach Card - Premium */}
            <TouchableOpacity
              onPress={() => navigation.navigate("CreateCoach")}
              activeOpacity={0.8}
              style={marketplaceStyles.createCoachCard}
            >
              <View style={marketplaceStyles.createCoachIcon}>
                <Sparkles size={24} color={colors.accent} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={marketplaceStyles.createCoachTitle}>
                  Create Your Own Coach
                </Text>
                <Text style={marketplaceStyles.createCoachDescription}>
                  Design a coach that fits how you think
                </Text>
              </View>
            </TouchableOpacity>

        {loading ? (
          <View style={{ alignItems: "center", marginTop: spacing.xxl, padding: spacing.xl }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: spacing.md, fontSize: fontSize.base, color: colors.mutedForeground }}>
              Loading coaches...
            </Text>
          </View>
        ) : (
          <>
            {searchQuery ? (
              // When searching, show all results together sorted by relevance
              <>
                {getFilteredCoaches().length > 0 ? (
                  <View style={{ marginBottom: spacing.xl }}>
                    <View style={marketplaceStyles.sectionHeader}>
                      <Search size={18} color={colors.primary} strokeWidth={1.5} />
                      <Text style={marketplaceStyles.sectionTitle}>
                        Search Results ({getFilteredCoaches().length})
                      </Text>
                    </View>
                    <Text style={marketplaceStyles.sectionSubtitle}>
                      Showing most relevant coaches first
                    </Text>
                    {getFilteredCoaches().map(renderCoachCard)}
                  </View>
                ) : (
                  <View style={marketplaceStyles.emptyState}>
                    <View style={marketplaceStyles.emptyIcon}>
                      <Search size={32} color={colors.mutedForeground} strokeWidth={1} />
                    </View>
                    <Text style={marketplaceStyles.emptyTitle}>
                      No coaches found
                    </Text>
                    <Text style={marketplaceStyles.emptyText}>
                      Try searching with different keywords or browse all coaches
                    </Text>
                  </View>
                )}
              </>
            ) : (
              // When not searching, show sections as before
              <>
                {/* Featured Coaches (System) */}
                {systemCoaches.length > 0 && (
                  <View style={{ marginBottom: spacing.xl }}>
                    <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground, marginBottom: spacing.md }}>
                      Featured Coaches
                    </Text>
                    {systemCoaches.map(renderCoachCard)}
                  </View>
                )}

                {/* Your Created Coaches */}
                {privateCoaches.length > 0 && (
                  <View style={{ marginBottom: spacing.xl }}>
                    <View style={marketplaceStyles.sectionHeader}>
                      <Wand2 size={18} color={colors.success} strokeWidth={1.5} />
                      <Text style={marketplaceStyles.sectionTitle}>
                        Your Created Coaches
                      </Text>
                    </View>
                    {privateCoaches.map((coach) => {
                      const isSelected = selectedCoachId === coach.id;
                      return (
                        <View
                          key={coach.id}
                          style={[
                            marketplaceStyles.coachCard,
                            isSelected && marketplaceStyles.coachCardSelected
                          ]}
                        >
                          {/* Coach Avatar and Header */}
                          <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md }}>
                            <View style={[
                              marketplaceStyles.coachAvatar,
                              isSelected && { borderColor: colors.primary, borderWidth: 2 }
                            ]}>
                              <Wand2 size={20} color={isSelected ? colors.primary : colors.success} strokeWidth={1.5} />
                            </View>
                            <View style={{ flex: 1, marginLeft: spacing.md }}>
                              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: spacing.xs }}>
                                <Text style={marketplaceStyles.coachName}>{coach.name}</Text>
                                <View style={[marketplaceStyles.coachTypeBadge, { backgroundColor: colors.successLight }]}>
                                  <Text style={[marketplaceStyles.coachTypeBadgeText, { color: colors.success }]}>Private</Text>
                                </View>
                                {isSelected && (
                                  <View style={{ marginLeft: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm }}>
                                    <Text style={{ fontSize: fontSize.xs, color: colors.primaryForeground, fontWeight: fontWeight.semibold }}>
                                      ACTIVE
                                    </Text>
                                  </View>
                                )}
                              </View>
                              {coach.description && (
                                <Text style={marketplaceStyles.coachDescription}>
                                  {coach.description}
                                </Text>
                              )}
                            </View>
                          </View>

                          {coach.focus_areas && coach.focus_areas.length > 0 && (
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md }}>
                              {coach.focus_areas.slice(0, 3).map((area: string, idx: number) => (
                                <View key={idx} style={marketplaceStyles.focusTag}>
                                  <Text style={marketplaceStyles.focusTagText}>{area}</Text>
                                </View>
                              ))}
                            </View>
                          )}

                          <TouchableOpacity
                            onPress={() => startCoaching(coach.id)}
                            activeOpacity={0.8}
                            style={[
                              marketplaceStyles.startButton,
                              !isSelected && { backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.glassBorder }
                            ]}
                          >
                            <Text style={[
                              marketplaceStyles.startButtonText,
                              !isSelected && { color: colors.foreground }
                            ]}>
                              {isSelected ? "Begin Coaching with This Coach" : "Select & Start Coaching"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Your Owned Coaches */}
                {ownedCoaches.length > 0 && (
                  <View style={{ marginBottom: spacing.xl }}>
                    <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground, marginBottom: spacing.md }}>
                      Your Coaches
                    </Text>
                    {ownedCoaches.map(renderCoachCard)}
                  </View>
                )}

                {/* Marketplace Coaches */}
                {getFilteredCoaches().length > 0 && (
                  <View style={{ marginBottom: spacing.xl }}>
                    <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground, marginBottom: spacing.md }}>
                      {activeFilter === "free" ? "Free Coaches" : activeFilter === "premium" ? "Premium Coaches" : activeFilter === "top-rated" ? "Top Rated" : activeFilter === "popular" ? "Most Popular" : "Marketplace"}
                    </Text>
                    {getFilteredCoaches().map(renderCoachCard)}
                  </View>
                )}
              </>
            )}
          </>
        )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const marketplaceStyles = StyleSheet.create({
  // Header
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.glass,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.md,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
    lineHeight: lineHeight.relaxed * fontSize.base,
  },
  statsBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  statsBadgeText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primaryForeground,
  },

  // Search Bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glass,
    borderRadius: borderRadius.xxl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: spacing.sm,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },

  // Filter Pills
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    ...shadows.sm,
  },
  filterPillText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  filterPillTextActive: {
    fontWeight: fontWeight.semibold,
    color: colors.primaryForeground,
  },

  // Create Coach Card
  createCoachCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glass,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: "dashed",
    gap: spacing.md,
    ...shadows.lg,
  },
  createCoachIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  createCoachTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  createCoachDescription: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
    lineHeight: lineHeight.relaxed * fontSize.base,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },

  // Coach Cards
  coachCard: {
    backgroundColor: colors.glass,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.md,
  },
  coachCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.glassLight,
  },
  coachAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glassLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  coachName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginRight: spacing.xs,
  },
  coachDescription: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    lineHeight: lineHeight.relaxed * fontSize.sm,
  },
  coachTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  coachTypeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.mutedForeground,
  },
  focusTag: {
    backgroundColor: colors.glassLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  focusTagText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
  },
  coachStat: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  startButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primaryForeground,
  },
  selectButton: {
    backgroundColor: colors.glassLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  selectButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  selectButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },

  // Empty States
  emptyState: {
    alignItems: "center",
    marginTop: spacing.xxl,
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.glassLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: lineHeight.relaxed * fontSize.base,
  },
});

export function CreateCoachScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Identity
  const [coachName, setCoachName] = useState("");
  const [description, setDescription] = useState("");
  const [intendedUse, setIntendedUse] = useState("");

  // Step 2: Style
  const [tone, setTone] = useState<"gentle" | "balanced" | "direct">("balanced");
  const [pacing, setPacing] = useState<"slow" | "medium" | "fast">("medium");
  const [challengeLevel, setChallengeLevel] = useState<"low" | "medium" | "high">("medium");

  // Step 3: Coaching Rules
  const [advicePolicy, setAdvicePolicy] = useState<"never" | "optional" | "always">("optional");
  const [questionDepth, setQuestionDepth] = useState<"surface" | "moderate" | "deep">("moderate");
  const [emotionalWarmth, setEmotionalWarmth] = useState<"low" | "medium" | "high">("medium");

  // Step 4: Philosophy
  const [philosophy, setPhilosophy] = useState("");

  const canProceed = () => {
    if (step === 1) return coachName.trim().length > 0 && description.trim().length > 0;
    if (step === 2) return true; // All have defaults
    if (step === 3) return true; // All have defaults
    if (step === 4) return philosophy.trim().length > 0;
    return false;
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const buildCoachPrompt = () => {
    const toneDesc = tone === "gentle" ? "calm, patient, supportive" : tone === "direct" ? "straightforward, action-oriented, challenging" : "balanced, warm but honest";
    const pacingDesc = pacing === "slow" ? "take time to reflect" : pacing === "fast" ? "move quickly to action" : "balance reflection and action";
    const challengeDesc = challengeLevel === "low" ? "gentle guidance" : challengeLevel === "high" ? "push back respectfully" : "balanced support and challenge";

    return `
You are ${coachName}.

${description}

COACHING APPROACH:
• Tone: ${toneDesc}
• Pacing: ${pacingDesc}
• Challenge level: ${challengeLevel === "low" ? "gentle guidance" : challengeLevel === "high" ? "push back respectfully" : "balanced support and challenge"}

ADVICE POLICY:
${advicePolicy === "never" ? "• Never offer direct advice. Only ask questions." : advicePolicy === "optional" ? "• Offer suggestions only when helpful, framed as experiments." : "• Provide actionable suggestions when appropriate."}

QUESTION DEPTH:
${questionDepth === "surface" ? "• Ask clarifying questions about the immediate situation." : questionDepth === "moderate" ? "• Explore underlying patterns and values." : "• Dive deep into root causes and beliefs."}

EMOTIONAL WARMTH:
${emotionalWarmth === "low" ? "• Keep responses analytical and objective." : emotionalWarmth === "medium" ? "• Balance logic with empathy." : "• Show high emotional intelligence and warmth."}

PHILOSOPHY:
${philosophy}

SAFETY BOUNDARIES (non-negotiable):
• Never provide medical, mental health, or crisis advice
• Encourage professional help when appropriate
• Maintain coaching boundaries
`.trim();
  };

  const saveCoach = async () => {
    if (!session || !canProceed()) return;
    try {
      setSaving(true);
      const slug = generateSlug(coachName);

      const { data, error } = await supabase
        .from("coaches")
        .insert({
          name: coachName.trim(),
          slug: `${slug}-${Date.now()}`, // Ensure uniqueness
          style: tone,
          persona_key: `custom-${Date.now()}`,
          coach_type: "private",
          creator_id: session.user.id,
          is_public: false,
          description: description.trim(),
          intended_use: intendedUse.trim() || null,
          style_config: {
            tone,
            pacing,
            challenge_level: challengeLevel,
          },
          coaching_rules: {
            advice_policy: advicePolicy,
            question_depth: questionDepth,
            emotional_warmth: emotionalWarmth,
          },
          philosophy: philosophy.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update the coaches.ts file would require server-side changes, but for now
      // we'll store the prompt in a custom field that coach-turn can read
      // For MVP, we'll use the philosophy field to store the full prompt

      navigation.goBack();
    } catch (e: any) {
      console.error("Failed to create coach:", e);
      alert(e?.message ?? "Failed to create coach");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <View>
          <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground, marginBottom: spacing.md }}>
            Step 1: Identity
          </Text>
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
              Coach Name *
            </Text>
            <TextInput
              value={coachName}
              onChangeText={setCoachName}
              placeholder="e.g. My Life Coach"
              placeholderTextColor={colors.mutedForeground}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                borderRadius: borderRadius.md,
                fontSize: fontSize.base,
                color: colors.foreground,
                backgroundColor: colors.input,
                fontWeight: fontWeight.medium,
              }}
            />
          </View>
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
              Description *
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What does this coach help with?"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                borderRadius: borderRadius.md,
                fontSize: fontSize.base,
                color: colors.foreground,
                backgroundColor: colors.input,
                minHeight: 100,
                fontWeight: fontWeight.medium,
              }}
            />
          </View>
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
              Intended Use (optional)
            </Text>
            <TextInput
              value={intendedUse}
              onChangeText={setIntendedUse}
              placeholder="e.g. life, work, faith, study"
              placeholderTextColor={colors.mutedForeground}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                borderRadius: borderRadius.md,
                fontSize: fontSize.base,
                color: colors.foreground,
                backgroundColor: colors.input,
                fontWeight: fontWeight.medium,
              }}
            />
          </View>
        </View>
      );
    }

    if (step === 2) {
      return (
        <View>
          <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground, marginBottom: spacing.md }}>
            Step 2: Style
          </Text>
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
              Tone
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {(["gentle", "balanced", "direct"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTone(t)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    backgroundColor: tone === t ? colors.primary : colors.card,
                    borderWidth: tone === t ? 2 : 1,
                    borderColor: tone === t ? colors.primary : colors.border,
                    ...(tone === t ? shadows.sm : {}),
                  }}
                >
                  <Text style={{
                    fontSize: fontSize.sm,
                    fontWeight: tone === t ? fontWeight.semibold : fontWeight.medium,
                    color: tone === t ? colors.primaryForeground : colors.foreground,
                    textAlign: "center",
                  }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
              Pacing
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {(["slow", "medium", "fast"] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPacing(p)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    backgroundColor: pacing === p ? colors.primary : colors.card,
                    borderWidth: pacing === p ? 2 : 1,
                    borderColor: pacing === p ? colors.primary : colors.border,
                    ...(pacing === p ? shadows.sm : {}),
                  }}
                >
                  <Text style={{
                    fontSize: fontSize.sm,
                    fontWeight: pacing === p ? fontWeight.semibold : fontWeight.medium,
                    color: pacing === p ? colors.primaryForeground : colors.foreground,
                    textAlign: "center",
                  }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
              Challenge Level
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {(["low", "medium", "high"] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setChallengeLevel(c)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    backgroundColor: challengeLevel === c ? colors.primary : colors.card,
                    borderWidth: challengeLevel === c ? 2 : 1,
                    borderColor: challengeLevel === c ? colors.primary : colors.border,
                    ...(challengeLevel === c ? shadows.sm : {}),
                  }}
                >
                  <Text style={{
                    fontSize: fontSize.sm,
                    fontWeight: challengeLevel === c ? fontWeight.semibold : fontWeight.medium,
                    color: challengeLevel === c ? colors.primaryForeground : colors.foreground,
                    textAlign: "center",
                  }}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    }

    if (step === 3) {
      return (
        <View>
          <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground, marginBottom: spacing.md }}>
            Step 3: Coaching Rules
          </Text>
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
              Advice Policy
            </Text>
            <View style={{ gap: spacing.sm }}>
              {(["never", "optional", "always"] as const).map((a) => (
                <TouchableOpacity
                  key={a}
                  onPress={() => setAdvicePolicy(a)}
                  activeOpacity={0.7}
                  style={{
                    padding: spacing.lg,
                    borderRadius: borderRadius.md,
                    backgroundColor: advicePolicy === a ? colors.primary : colors.card,
                    borderWidth: advicePolicy === a ? 2 : 1,
                    borderColor: advicePolicy === a ? colors.primary : colors.border,
                    ...(advicePolicy === a ? shadows.sm : {}),
                  }}
                >
                  <Text style={{
                    fontSize: fontSize.sm,
                    fontWeight: advicePolicy === a ? fontWeight.semibold : fontWeight.medium,
                    color: advicePolicy === a ? colors.primaryForeground : colors.foreground,
                    lineHeight: lineHeight.relaxed * fontSize.sm,
                  }}>
                    {a === "never" ? "Never give advice (questions only)" : a === "optional" ? "Optional suggestions" : "Always provide actionable advice"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
              Question Depth
            </Text>
            <View style={{ gap: spacing.sm }}>
              {(["surface", "moderate", "deep"] as const).map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => setQuestionDepth(q)}
                  activeOpacity={0.7}
                  style={{
                    padding: spacing.lg,
                    borderRadius: borderRadius.md,
                    backgroundColor: questionDepth === q ? colors.primary : colors.card,
                    borderWidth: questionDepth === q ? 2 : 1,
                    borderColor: questionDepth === q ? colors.primary : colors.border,
                    ...(questionDepth === q ? shadows.sm : {}),
                  }}
                >
                  <Text style={{
                    fontSize: fontSize.sm,
                    fontWeight: questionDepth === q ? fontWeight.semibold : fontWeight.medium,
                    color: questionDepth === q ? colors.primaryForeground : colors.foreground,
                    lineHeight: lineHeight.relaxed * fontSize.sm,
                  }}>
                    {q === "surface" ? "Surface level questions" : q === "moderate" ? "Moderate depth" : "Deep exploration"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm }}>
              Emotional Warmth
            </Text>
            <View style={{ gap: spacing.sm }}>
              {(["low", "medium", "high"] as const).map((e) => (
                <TouchableOpacity
                  key={e}
                  onPress={() => setEmotionalWarmth(e)}
                  activeOpacity={0.7}
                  style={{
                    padding: spacing.lg,
                    borderRadius: borderRadius.md,
                    backgroundColor: emotionalWarmth === e ? colors.primary : colors.card,
                    borderWidth: emotionalWarmth === e ? 2 : 1,
                    borderColor: emotionalWarmth === e ? colors.primary : colors.border,
                    ...(emotionalWarmth === e ? shadows.sm : {}),
                  }}
                >
                  <Text style={{
                    fontSize: fontSize.sm,
                    fontWeight: emotionalWarmth === e ? fontWeight.semibold : fontWeight.medium,
                    color: emotionalWarmth === e ? colors.primaryForeground : colors.foreground,
                    lineHeight: lineHeight.relaxed * fontSize.sm,
                  }}>
                    {e === "low" ? "Analytical & Objective" : e === "medium" ? "Balanced" : "High Warmth & Empathy"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    }

    if (step === 4) {
      return (
        <View>
          <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground, marginBottom: spacing.md }}>
            Step 4: Philosophy
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.lg }}>
            What should this coach believe about growth and change? This shapes how they approach coaching.
          </Text>
          <TextInput
            value={philosophy}
            onChangeText={setPhilosophy}
            placeholder="e.g. Growth happens through small, consistent actions. Change requires both self-awareness and courage..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={8}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              fontSize: fontSize.base,
              color: colors.foreground,
              backgroundColor: colors.input,
              minHeight: 200,
              textAlignVertical: "top",
              fontWeight: fontWeight.medium,
              lineHeight: lineHeight.relaxed * fontSize.base,
            }}
          />
          <View style={{
            marginTop: spacing.md,
            padding: spacing.md,
            backgroundColor: colors.secondary,
            borderRadius: borderRadius.sm,
          }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>
              ⚠️ Safety boundaries will be automatically added to ensure ethical coaching practices.
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: spacing.md }}>
          <Text style={{ fontSize: fontSize.base, color: colors.primary }}>Cancel</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground }}>
            Create Your Coach
          </Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>
            Step {step} of 4
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {renderStep()}
      </ScrollView>

      <View style={{
        flexDirection: "row",
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: spacing.sm,
      }}>
        {step > 1 && (
          <TouchableOpacity
            onPress={() => setStep(step - 1)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              padding: spacing.md,
              backgroundColor: colors.secondary,
              borderRadius: borderRadius.md,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.foreground }}>
              Back
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => {
            if (step < 4) {
              setStep(step + 1);
            } else {
              void saveCoach();
            }
          }}
          disabled={!canProceed() || saving}
          activeOpacity={0.8}
          style={{
            flex: 1,
            padding: spacing.md,
            backgroundColor: canProceed() && !saving ? colors.primary : colors.border,
            borderRadius: borderRadius.md,
            alignItems: "center",
            ...(canProceed() && !saving ? shadows.md : {}),
          }}
        >
          <Text style={{
            fontSize: fontSize.base,
            fontWeight: fontWeight.bold,
            color: canProceed() && !saving ? colors.primaryForeground : colors.mutedForeground,
          }}>
            {saving ? "Creating..." : step < 4 ? "Next" : "Create Coach"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export function CoachesScreen() {
  return <ScreenShell title="Coaches" />;
}

type MemoryType = "fact" | "preference" | "story" | "relationship" | "challenge" | "win" | "value";
type MemoryImportance = "low" | "normal" | "high" | "critical";

const MEMORY_TYPES: { key: MemoryType; label: string }[] = [
  { key: "fact", label: "Fact" },
  { key: "preference", label: "Preference" },
  { key: "story", label: "Story" },
  { key: "relationship", label: "Relationship" },
  { key: "challenge", label: "Challenge" },
  { key: "win", label: "Win" },
  { key: "value", label: "Value" },
];

const MEMORY_IMPORTANCE: { key: MemoryImportance; label: string }[] = [
  { key: "low", label: "Low" },
  { key: "normal", label: "Normal" },
  { key: "high", label: "High" },
  { key: "critical", label: "Critical" },
];

function importanceRank(i: string | null | undefined): number {
  if (i === "critical") return 4;
  if (i === "high") return 3;
  if (i === "normal") return 2;
  if (i === "low") return 1;
  return 0;
}

export function MemoryVaultScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [memories, setMemories] = useState<any[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [typeFilter, setTypeFilter] = useState<MemoryType | "all">("all");
  const [importanceFilter, setImportanceFilter] = useState<MemoryImportance | "all">("all");

  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [memoryType, setMemoryType] = useState<MemoryType>("fact");
  const [importance, setImportance] = useState<MemoryImportance>("normal");
  const [content, setContent] = useState("");
  const [tagsText, setTagsText] = useState("");

  const loadMemories = async () => {
    if (!session) return;
    setErrorText(null);
    try {
      let q = supabase
        .from("user_memory")
        .select("*")
        .eq("user_id", session.user.id);

      if (!showInactive) q = q.eq("is_active", true);
      if (typeFilter !== "all") q = q.eq("memory_type", typeFilter);
      if (importanceFilter !== "all") q = q.eq("importance", importanceFilter);

      const { data, error } = await q.order("created_at", { ascending: false }).limit(200);
      if (error) throw error;

      const sorted = (data ?? []).slice().sort((a: any, b: any) => {
        const r = importanceRank(b.importance) - importanceRank(a.importance);
        if (r !== 0) return r;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setMemories(sorted);
    } catch (e: any) {
      console.error("MemoryVault: load failed", e);
      setErrorText(e?.message ?? "Failed to load memory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, showInactive, typeFilter, importanceFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMemories();
    setRefreshing(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setMemoryType("fact");
    setImportance("normal");
    setContent("");
    setTagsText("");
    setShowEditor(true);
  };

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setMemoryType((m.memory_type as MemoryType) ?? "fact");
    setImportance((m.importance as MemoryImportance) ?? "normal");
    setContent(m.content ?? "");
    setTagsText(Array.isArray(m.tags) ? m.tags.join(", ") : "");
    setShowEditor(true);
  };

  const saveMemory = async () => {
    if (!session) return;
    if (!content.trim()) return;
    setSaving(true);
    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12);

      if (editingId) {
        const { error } = await supabase
          .from("user_memory")
          .update({
            memory_type: memoryType,
            importance,
            content: content.trim(),
            tags,
            is_active: true,
          })
          .eq("id", editingId)
          .eq("user_id", session.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_memory").insert({
          user_id: session.user.id,
          memory_type: memoryType,
          importance,
          content: content.trim(),
          tags,
          is_active: true,
        });
        if (error) throw error;
      }

      setShowEditor(false);
      await loadMemories();
    } catch (e: any) {
      console.error("MemoryVault: save failed", e);
      Alert.alert("Error", e?.message ?? "Failed to save memory");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m: any, isActive: boolean) => {
    if (!session) return;
    try {
      const { error } = await supabase
        .from("user_memory")
        .update({ is_active: isActive })
        .eq("id", m.id)
        .eq("user_id", session.user.id);
      if (error) throw error;
      await loadMemories();
    } catch (e: any) {
      console.error("MemoryVault: toggle active failed", e);
      Alert.alert("Error", e?.message ?? "Failed to update memory");
    }
  };

  const deleteMemory = async (m: any) => {
    if (!session) return;
    Alert.alert(
      "Delete memory?",
      "This will permanently delete this memory.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("user_memory")
                .delete()
                .eq("id", m.id)
                .eq("user_id", session.user.id);
              if (error) throw error;
              await loadMemories();
            } catch (e: any) {
              console.error("MemoryVault: delete failed", e);
              Alert.alert("Error", e?.message ?? "Failed to delete memory");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={{ flex: 1 }} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}
          >
            <View style={memoryVaultStyles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={memoryVaultStyles.title}>Memory Vault</Text>
                <Text style={memoryVaultStyles.subtitle}>You control what Compass remembers.</Text>
              </View>
              <TouchableOpacity onPress={openAdd} activeOpacity={0.8} style={memoryVaultStyles.addButton}>
                <Plus size={18} color={colors.primaryForeground} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={memoryVaultStyles.filterCard}>
              <View style={memoryVaultStyles.filterRow}>
                <View style={memoryVaultStyles.filterIcon}>
                  <Filter size={16} color={colors.mutedForeground} strokeWidth={1.5} />
                </View>
                <Text style={memoryVaultStyles.filterLabel}>Filters</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={() => setShowInactive((v) => !v)}
                  activeOpacity={0.8}
                  style={memoryVaultStyles.toggleButton}
                >
                  {showInactive ? <EyeOff size={16} color={colors.foreground} /> : <Eye size={16} color={colors.foreground} />}
                  <Text style={memoryVaultStyles.toggleButtonText}>{showInactive ? "Hide inactive" : "Show inactive"}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={memoryVaultStyles.chipsRow}>
                <TouchableOpacity
                  onPress={() => setTypeFilter("all")}
                  activeOpacity={0.8}
                  style={[memoryVaultStyles.chip, typeFilter === "all" && memoryVaultStyles.chipSelected]}
                >
                  <Text style={[memoryVaultStyles.chipText, typeFilter === "all" && memoryVaultStyles.chipTextSelected]}>All types</Text>
                </TouchableOpacity>
                {MEMORY_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    onPress={() => setTypeFilter(t.key)}
                    activeOpacity={0.8}
                    style={[memoryVaultStyles.chip, typeFilter === t.key && memoryVaultStyles.chipSelected]}
                  >
                    <Text style={[memoryVaultStyles.chipText, typeFilter === t.key && memoryVaultStyles.chipTextSelected]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={memoryVaultStyles.chipsRow}>
                <TouchableOpacity
                  onPress={() => setImportanceFilter("all")}
                  activeOpacity={0.8}
                  style={[memoryVaultStyles.chip, importanceFilter === "all" && memoryVaultStyles.chipSelected]}
                >
                  <Text style={[memoryVaultStyles.chipText, importanceFilter === "all" && memoryVaultStyles.chipTextSelected]}>All importance</Text>
                </TouchableOpacity>
                {MEMORY_IMPORTANCE.map((i) => (
                  <TouchableOpacity
                    key={i.key}
                    onPress={() => setImportanceFilter(i.key)}
                    activeOpacity={0.8}
                    style={[memoryVaultStyles.chip, importanceFilter === i.key && memoryVaultStyles.chipSelected]}
                  >
                    <Text style={[memoryVaultStyles.chipText, importanceFilter === i.key && memoryVaultStyles.chipTextSelected]}>{i.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {loading ? (
              <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
                <ActivityIndicator />
              </View>
            ) : errorText ? (
              <View style={memoryVaultStyles.errorCard}>
                <Text style={memoryVaultStyles.errorTitle}>Couldn’t load memory</Text>
                <Text style={memoryVaultStyles.errorText}>{errorText}</Text>
                <TouchableOpacity onPress={() => void loadMemories()} style={memoryVaultStyles.retryButton} activeOpacity={0.8}>
                  <Text style={memoryVaultStyles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : memories.length === 0 ? (
              <View style={memoryVaultStyles.emptyCard}>
                <View style={memoryVaultStyles.emptyIcon}>
                  <Database size={20} color={colors.mutedForeground} strokeWidth={1.5} />
                </View>
                <Text style={memoryVaultStyles.emptyTitle}>No memories yet</Text>
                <Text style={memoryVaultStyles.emptyText}>Add a few helpful facts or preferences so your coach can personalize better.</Text>
                <TouchableOpacity onPress={openAdd} style={memoryVaultStyles.primaryCta} activeOpacity={0.85}>
                  <Text style={memoryVaultStyles.primaryCtaText}>Add your first memory</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: spacing.lg }}>
                {memories.map((m) => (
                  <View key={m.id} style={[memoryVaultStyles.memoryCard, m.is_active === false && { opacity: 0.6 }]}>
                    <View style={memoryVaultStyles.memoryHeader}>
                      <View style={memoryVaultStyles.badgesRow}>
                        <View style={memoryVaultStyles.badge}>
                          <Tag size={14} color={colors.mutedForeground} strokeWidth={1.5} />
                          <Text style={memoryVaultStyles.badgeText}>{String(m.memory_type).toUpperCase()}</Text>
                        </View>
                        <View style={[memoryVaultStyles.badge, m.importance === "critical" ? memoryVaultStyles.badgeCritical : m.importance === "high" ? memoryVaultStyles.badgeHigh : null]}>
                          <Clock size={14} color={colors.mutedForeground} strokeWidth={1.5} />
                          <Text style={memoryVaultStyles.badgeText}>{String(m.importance ?? "normal").toUpperCase()}</Text>
                        </View>
                      </View>
                      <View style={memoryVaultStyles.actionsRow}>
                        <TouchableOpacity onPress={() => openEdit(m)} style={memoryVaultStyles.iconButton} activeOpacity={0.7}>
                          <Pencil size={18} color={colors.foreground} strokeWidth={1.5} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => void toggleActive(m, !(m.is_active === true))} style={memoryVaultStyles.iconButton} activeOpacity={0.7}>
                          {m.is_active === false ? <Eye size={18} color={colors.foreground} strokeWidth={1.5} /> : <EyeOff size={18} color={colors.foreground} strokeWidth={1.5} />}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => void deleteMemory(m)} style={memoryVaultStyles.iconButton} activeOpacity={0.7}>
                          <Trash2 size={18} color={colors.destructive} strokeWidth={1.5} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={memoryVaultStyles.memoryContent}>{m.content}</Text>
                    {Array.isArray(m.tags) && m.tags.length > 0 && (
                      <View style={memoryVaultStyles.tagsRow}>
                        {m.tags.slice(0, 6).map((t: string) => (
                          <View key={t} style={memoryVaultStyles.tagPill}>
                            <Text style={memoryVaultStyles.tagText}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <Modal visible={showEditor} transparent animationType="slide" onRequestClose={() => setShowEditor(false)}>
            <View style={memoryVaultStyles.modalOverlay}>
              <View style={memoryVaultStyles.modalSheet}>
                <View style={memoryVaultStyles.modalHeader}>
                  <Text style={memoryVaultStyles.modalTitle}>{editingId ? "Edit memory" : "Add memory"}</Text>
                  <TouchableOpacity onPress={() => setShowEditor(false)} activeOpacity={0.7} style={memoryVaultStyles.iconButton}>
                    <X size={22} color={colors.mutedForeground} strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                <Text style={memoryVaultStyles.fieldLabel}>Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={memoryVaultStyles.chipsRow}>
                  {MEMORY_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.key}
                      onPress={() => setMemoryType(t.key)}
                      activeOpacity={0.8}
                      style={[memoryVaultStyles.chip, memoryType === t.key && memoryVaultStyles.chipSelected]}
                    >
                      <Text style={[memoryVaultStyles.chipText, memoryType === t.key && memoryVaultStyles.chipTextSelected]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={memoryVaultStyles.fieldLabel}>Importance</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={memoryVaultStyles.chipsRow}>
                  {MEMORY_IMPORTANCE.map((i) => (
                    <TouchableOpacity
                      key={i.key}
                      onPress={() => setImportance(i.key)}
                      activeOpacity={0.8}
                      style={[memoryVaultStyles.chip, importance === i.key && memoryVaultStyles.chipSelected]}
                    >
                      <Text style={[memoryVaultStyles.chipText, importance === i.key && memoryVaultStyles.chipTextSelected]}>{i.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={memoryVaultStyles.fieldLabel}>Memory</Text>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="e.g., I prefer short, practical steps when I'm overwhelmed."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  style={memoryVaultStyles.textArea}
                />

                <Text style={memoryVaultStyles.fieldLabel}>Tags (optional)</Text>
                <TextInput
                  value={tagsText}
                  onChangeText={setTagsText}
                  placeholder="comma-separated, e.g. work, stress, boundaries"
                  placeholderTextColor={colors.mutedForeground}
                  style={memoryVaultStyles.input}
                />

                <TouchableOpacity
                  onPress={() => void saveMemory()}
                  disabled={!content.trim() || saving}
                  activeOpacity={0.85}
                  style={[memoryVaultStyles.saveButton, (!content.trim() || saving) && { opacity: 0.6 }]}
                >
                  {saving ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={memoryVaultStyles.saveButtonText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const memoryVaultStyles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  filterCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  filterIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  toggleButtonText: {
    fontSize: fontSize.xs,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipSelected: {
    backgroundColor: colors.primary + "15",
    borderColor: colors.primary + "55",
  },
  chipText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: fontWeight.medium,
  },
  chipTextSelected: {
    color: colors.primary,
  },
  emptyCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  primaryCta: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primaryCtaText: {
    color: colors.primaryForeground,
    fontWeight: fontWeight.semibold,
  },
  memoryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.md,
  },
  memoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  badgesRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  badgeHigh: {
    borderColor: colors.primary + "55",
  },
  badgeCritical: {
    borderColor: colors.destructive + "55",
  },
  badgeText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  memoryContent: {
    fontSize: fontSize.base,
    color: colors.foreground,
    lineHeight: lineHeight.relaxed * fontSize.base,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  tagPill: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  errorCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  errorText: {
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryButtonText: {
    color: colors.primaryForeground,
    fontWeight: fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  fieldLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: fontWeight.semibold,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.foreground,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.foreground,
    minHeight: 110,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
    ...shadows.md,
  },
  saveButtonText: {
    color: colors.primaryForeground,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
});

const MORNING_TIMES = ["07:00", "08:00", "09:00"];
const EVENING_TIMES = ["18:00", "19:00", "20:00"];

export function SettingsScreen() {
  const { profile, updateProfile, refreshProfile, signOut, session, getAccessToken } = useAuth();
  const navigation = useNavigation<any>();
  const [notifBusy, setNotifBusy] = useState(false);

  const openIntake = () => {
    const parent = navigation.getParent?.();
    if (parent?.navigate) parent.navigate("Intake");
    else navigation.navigate("Intake");
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => void signOut() },
      ]
    );
  };

  // Settings item component
  const SettingsItem = ({ 
    icon: Icon, 
    iconColor = colors.foreground,
    title, 
    subtitle,
    onPress, 
    showArrow = true,
    rightElement,
    destructive = false,
  }: {
    icon: any;
    iconColor?: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightElement?: React.ReactNode;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={settingsStyles.settingsItem}
    >
      <View style={[settingsStyles.settingsItemIcon, { backgroundColor: iconColor + "15" }]}>
        <Icon size={20} color={iconColor} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[
          settingsStyles.settingsItemTitle,
          destructive && { color: colors.destructive }
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={settingsStyles.settingsItemSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightElement}
      {showArrow && !rightElement && (
        <ChevronRight size={20} color={colors.mutedForeground} strokeWidth={1.5} />
      )}
    </TouchableOpacity>
  );

  // Status badge component
  const StatusBadge = ({ completed }: { completed: boolean }) => (
    <View style={[
      settingsStyles.statusBadge,
      { backgroundColor: completed ? colors.successLight : colors.warningLight }
    ]}>
      {completed ? (
        <CheckCircle size={14} color={colors.success} strokeWidth={2} />
      ) : (
        <Circle size={14} color={colors.warning} strokeWidth={2} />
      )}
      <Text style={[
        settingsStyles.statusBadgeText,
        { color: completed ? colors.success : colors.warning }
      ]}>
        {completed ? "Complete" : "Incomplete"}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={{ flex: 1 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={settingsStyles.header}>
              <Text style={settingsStyles.headerTitle}>Settings</Text>
            </View>

            {/* Profile Card */}
            <View style={settingsStyles.profileCard}>
              <View style={settingsStyles.profileAvatar}>
                <UserCircle size={32} color={colors.primary} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={settingsStyles.profileName}>
                  {profile?.display_name || "User"}
                </Text>
                {profile?.email && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                    <Mail size={14} color={colors.mutedForeground} strokeWidth={1.5} />
                    <Text style={settingsStyles.profileEmail}>{profile.email}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Notifications Section (Phase 4) */}
            <View style={settingsStyles.section}>
              <Text style={settingsStyles.sectionTitle}>Notifications</Text>
              <View style={settingsStyles.sectionCard}>
                <View style={settingsStyles.settingsItem}>
                  <View style={[settingsStyles.settingsItemIcon, { backgroundColor: colors.accent + "15" }]}>
                    <Bell size={20} color={colors.accent} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={settingsStyles.settingsItemTitle}>Enable notifications</Text>
                    <Text style={settingsStyles.settingsItemSubtitle}>Morning & evening check-ins, reminders</Text>
                  </View>
                  <Switch
                    value={profile?.notifications_enabled !== false}
                    onValueChange={async (v) => {
                      setNotifBusy(true);
                      try {
                        await updateProfile({ notifications_enabled: v });
                      } finally {
                        setNotifBusy(false);
                      }
                    }}
                    disabled={notifBusy}
                    trackColor={{ false: colors.border, true: colors.primary + "80" }}
                    thumbColor={profile?.notifications_enabled !== false ? colors.primary : colors.mutedForeground}
                  />
                </View>
                <View style={settingsStyles.divider} />
                <View style={settingsStyles.settingsItem}>
                  <View style={[settingsStyles.settingsItemIcon, { backgroundColor: colors.warning + "15" }]}>
                    <Calendar size={20} color={colors.warning} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={settingsStyles.settingsItemTitle}>Morning check-in</Text>
                    <Text style={settingsStyles.settingsItemSubtitle}>Set a daily intention</Text>
                  </View>
                  <Switch
                    value={profile?.morning_checkin_enabled === true}
                    onValueChange={async (v) => {
                      setNotifBusy(true);
                      try {
                        await updateProfile({
                          morning_checkin_enabled: v,
                          morning_checkin_time: v && !profile?.morning_checkin_time ? "08:00" : profile?.morning_checkin_time ?? null,
                        });
                      } finally {
                        setNotifBusy(false);
                      }
                    }}
                    disabled={notifBusy}
                    trackColor={{ false: colors.border, true: colors.primary + "80" }}
                    thumbColor={profile?.morning_checkin_enabled ? colors.primary : colors.mutedForeground}
                  />
                </View>
                {profile?.morning_checkin_enabled && (
                  <>
                    <View style={settingsStyles.timePresetRow}>
                      {MORNING_TIMES.map((t) => (
                        <TouchableOpacity
                          key={t}
                          onPress={async () => {
                            setNotifBusy(true);
                            try {
                              await updateProfile({ morning_checkin_time: t });
                            } finally {
                              setNotifBusy(false);
                            }
                          }}
                          style={[
                            settingsStyles.timePreset,
                            profile?.morning_checkin_time === t && settingsStyles.timePresetSelected,
                          ]}
                        >
                          <Text style={[settingsStyles.timePresetText, profile?.morning_checkin_time === t && settingsStyles.timePresetTextSelected]}>
                            {t === "07:00" ? "7 AM" : t === "08:00" ? "8 AM" : "9 AM"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={settingsStyles.divider} />
                  </>
                )}
                <View style={settingsStyles.settingsItem}>
                  <View style={[settingsStyles.settingsItemIcon, { backgroundColor: colors.info + "15" }]}>
                    <Heart size={20} color={colors.info} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={settingsStyles.settingsItemTitle}>Evening reflection</Text>
                    <Text style={settingsStyles.settingsItemSubtitle}>Mood & gratitude</Text>
                  </View>
                  <Switch
                    value={profile?.evening_checkin_enabled === true}
                    onValueChange={async (v) => {
                      setNotifBusy(true);
                      try {
                        await updateProfile({
                          evening_checkin_enabled: v,
                          evening_checkin_time: v && !profile?.evening_checkin_time ? "19:00" : profile?.evening_checkin_time ?? null,
                        });
                      } finally {
                        setNotifBusy(false);
                      }
                    }}
                    disabled={notifBusy}
                    trackColor={{ false: colors.border, true: colors.primary + "80" }}
                    thumbColor={profile?.evening_checkin_enabled ? colors.primary : colors.mutedForeground}
                  />
                </View>
                {profile?.evening_checkin_enabled && (
                  <View style={settingsStyles.timePresetRow}>
                    {EVENING_TIMES.map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={async () => {
                          setNotifBusy(true);
                          try {
                            await updateProfile({ evening_checkin_time: t });
                          } finally {
                            setNotifBusy(false);
                          }
                        }}
                        style={[
                          settingsStyles.timePreset,
                          profile?.evening_checkin_time === t && settingsStyles.timePresetSelected,
                        ]}
                      >
                        <Text style={[settingsStyles.timePresetText, profile?.evening_checkin_time === t && settingsStyles.timePresetTextSelected]}>
                          {t === "18:00" ? "6 PM" : t === "19:00" ? "7 PM" : "8 PM"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Account Section */}
            <View style={settingsStyles.section}>
              <Text style={settingsStyles.sectionTitle}>Account</Text>
              <View style={settingsStyles.sectionCard}>
                <SettingsItem
                  icon={Shield}
                  iconColor={colors.primary}
                  title="Profile & Security"
                  subtitle="Manage your account details"
                />
              </View>
            </View>

            {/* Coaching Progress Section */}
            <View style={settingsStyles.section}>
              <Text style={settingsStyles.sectionTitle}>Coaching Progress</Text>
              <View style={settingsStyles.sectionCard}>
                <SettingsItem
                  icon={CheckCircle}
                  iconColor={profile?.onboarding_completed ? colors.success : colors.warning}
                  title="Onboarding"
                  subtitle="Initial setup and preferences"
                  showArrow={false}
                  rightElement={
                    typeof profile?.onboarding_completed === "boolean" && (
                      <StatusBadge completed={profile.onboarding_completed} />
                    )
                  }
                />
                <View style={settingsStyles.divider} />
                <SettingsItem
                  icon={Database}
                  iconColor={colors.primary}
                  title="Memory Vault"
                  subtitle="Review, edit, or remove what Compass remembers"
                  onPress={() => navigation.navigate("MemoryVault")}
                />
                <View style={settingsStyles.divider} />
                <SettingsItem
                  icon={ClipboardList}
                  iconColor={profile?.intake_completed ? colors.success : colors.primary}
                  title="Deep Intake"
                  subtitle="Detailed coaching profile (optional)"
                  onPress={openIntake}
                  rightElement={
                    typeof profile?.intake_completed === "boolean" ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                        <StatusBadge completed={profile.intake_completed} />
                        <ChevronRight size={20} color={colors.mutedForeground} strokeWidth={1.5} />
                      </View>
                    ) : (
                      <ChevronRight size={20} color={colors.mutedForeground} strokeWidth={1.5} />
                    )
                  }
                  showArrow={false}
                />
              </View>
            </View>

            {/* Support Section */}
            <View style={settingsStyles.section}>
              <Text style={settingsStyles.sectionTitle}>Support</Text>
              <View style={settingsStyles.sectionCard}>
                <SettingsItem
                  icon={HelpCircle}
                  iconColor={colors.info}
                  title="Help & FAQ"
                  subtitle="Get answers to common questions"
                />
                <View style={settingsStyles.divider} />
                <SettingsItem
                  icon={MessageCircle}
                  iconColor={colors.success}
                  title="Contact Support"
                  subtitle="Reach out for assistance"
                />
                <View style={settingsStyles.divider} />
                <SettingsItem
                  icon={Heart}
                  iconColor={colors.destructive}
                  title="Rate the App"
                  subtitle="Share your feedback"
                  rightElement={
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                      <ExternalLink size={16} color={colors.mutedForeground} strokeWidth={1.5} />
                    </View>
                  }
                  showArrow={false}
                />
              </View>
            </View>

            {/* Developer / Testing Section (only in dev mode) */}
            {__DEV__ && (
              <View style={settingsStyles.section}>
                <Text style={settingsStyles.sectionTitle}>Developer</Text>
                <View style={settingsStyles.sectionCard}>
                  <SettingsItem
                    icon={Info}
                    iconColor={colors.accent}
                    title="Get Access Token"
                    subtitle="Copy token for API testing"
                    onPress={() => {
                      const token = getAccessToken?.();
                      if (token) {
                        Alert.alert(
                          "Access Token",
                          `Token logged to console. Check your terminal/logs.\n\nToken preview: ${token.substring(0, 30)}...`,
                          [{ text: "OK" }]
                        );
                      } else {
                        Alert.alert("No Token", "Please log in first.");
                      }
                    }}
                  />
                </View>
              </View>
            )}

            {/* About Section */}
            <View style={settingsStyles.section}>
              <Text style={settingsStyles.sectionTitle}>About</Text>
              <View style={settingsStyles.sectionCard}>
                <SettingsItem
                  icon={Info}
                  iconColor={colors.mutedForeground}
                  title="About Compass"
                  subtitle="Version 1.0.0"
                />
                <View style={settingsStyles.divider} />
                <SettingsItem
                  icon={Shield}
                  iconColor={colors.mutedForeground}
                  title="Privacy Policy"
                  rightElement={
                    <ExternalLink size={16} color={colors.mutedForeground} strokeWidth={1.5} />
                  }
                  showArrow={false}
                />
                <View style={settingsStyles.divider} />
                <SettingsItem
                  icon={ClipboardList}
                  iconColor={colors.mutedForeground}
                  title="Terms of Service"
                  rightElement={
                    <ExternalLink size={16} color={colors.mutedForeground} strokeWidth={1.5} />
                  }
                  showArrow={false}
                />
              </View>
            </View>

            {/* Sign Out */}
            <View style={settingsStyles.section}>
              <TouchableOpacity
                onPress={handleSignOut}
                activeOpacity={0.7}
                style={settingsStyles.signOutButton}
              >
                <LogOut size={20} color={colors.destructive} strokeWidth={1.5} />
                <Text style={settingsStyles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={settingsStyles.footer}>
              <Text style={settingsStyles.footerText}>
                Made with care for your growth
              </Text>
              <Text style={settingsStyles.footerVersion}>
                Compass AI Coach v1.0.0
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const settingsStyles = StyleSheet.create({
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },

  // Profile Card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glass,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: spacing.md,
    ...shadows.md,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },

  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
    ...shadows.sm,
  },

  // Settings Items
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsItemTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  settingsItemSubtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  timePresetRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
  },
  timePreset: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timePresetSelected: {
    backgroundColor: colors.primary + "20",
    borderColor: colors.primary,
  },
  timePresetText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },
  timePresetTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginLeft: spacing.md + 40 + spacing.md,
  },

  // Status Badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Sign Out
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.destructive + "10",
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.destructive + "30",
  },
  signOutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.destructive,
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  footerVersion: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    opacity: 0.7,
  },
});

// Phase 4: Morning Intention & Evening Reflection Modals
export function MorningIntentionModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { session } = useAuth();
  const [intention, setIntention] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!session || !intention.trim()) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase
        .from("daily_checkins")
        .upsert(
          {
            user_id: session.user.id,
            date: today,
            morning_intention: intention.trim(),
            morning_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,date", ignoreDuplicates: false }
        );
      if (error) throw error;
      setIntention("");
      onClose();
      Alert.alert("Saved", "Your intention has been saved. Have a great day! 🌅");
    } catch (e: any) {
      console.error("Failed to save morning intention:", e);
      Alert.alert("Error", e?.message || "Failed to save intention. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: spacing.xl }}>
        <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.xl, width: "100%", maxWidth: 400, ...shadows.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.warningLight, alignItems: "center", justifyContent: "center" }}>
                <Calendar size={20} color={colors.warning} />
              </View>
              <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground }}>Morning Intention</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <X size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: fontSize.base, color: colors.mutedForeground, marginBottom: spacing.md, lineHeight: 22 }}>
            What's one thing you want to focus on today?
          </Text>
          <TextInput
            value={intention}
            onChangeText={setIntention}
            placeholder="e.g., Have that difficult conversation..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              fontSize: fontSize.base,
              color: colors.foreground,
              minHeight: 80,
              textAlignVertical: "top",
              marginBottom: spacing.lg,
            }}
          />
          <TouchableOpacity
            onPress={() => void handleSave()}
            disabled={!intention.trim() || saving}
            activeOpacity={0.8}
            style={{
              backgroundColor: intention.trim() && !saving ? colors.primary : colors.border,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.md,
              alignItems: "center",
              ...shadows.sm,
            }}
          >
            {saving ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.primaryForeground }}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function EveningReflectionModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { session } = useAuth();
  const [mood, setMood] = useState<number | null>(null);
  const [gratitude, setGratitude] = useState("");
  const [win, setWin] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!session || mood === null) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("daily_checkins").upsert(
        {
          user_id: session.user.id,
          date: today,
          evening_mood: mood,
          evening_gratitude: gratitude.trim() || null,
          evening_win: win.trim() || null,
          evening_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,date", ignoreDuplicates: false }
      );
      if (mood) {
        await supabase.from("mood_entries").insert({
          user_id: session.user.id,
          mood_score: mood,
          mood_label: mood >= 7 ? "good" : mood >= 4 ? "okay" : "tough",
          note: gratitude || win || null,
        });
      }
      setMood(null);
      setGratitude("");
      setWin("");
      onClose();
      Alert.alert("Saved", "Thank you for reflecting. Rest well! 🌙");
    } catch (e: any) {
      console.error("Failed to save evening reflection:", e);
      Alert.alert("Error", e?.message || "Failed to save reflection. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: spacing.xl }}>
        <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.xl, width: "100%", maxWidth: 400, maxHeight: "80%", ...shadows.lg }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.infoLight, alignItems: "center", justifyContent: "center" }}>
                  <Heart size={20} color={colors.info} />
                </View>
                <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground }}>Evening Reflection</Text>
              </View>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <X size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: fontSize.base, color: colors.mutedForeground, marginBottom: spacing.md, lineHeight: 22 }}>
              How did your day go?
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.sm }}>Mood (1-10)</Text>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg, flexWrap: "wrap" }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setMood(n)}
                  activeOpacity={0.7}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: mood === n ? colors.primary : colors.secondary,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: mood === n ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: mood === n ? colors.primaryForeground : colors.foreground }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.sm }}>One thing you're grateful for (optional)</Text>
            <TextInput
              value={gratitude}
              onChangeText={setGratitude}
              placeholder="e.g., A supportive friend..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={2}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                fontSize: fontSize.base,
                color: colors.foreground,
                minHeight: 60,
                textAlignVertical: "top",
                marginBottom: spacing.md,
              }}
            />
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.sm }}>One win today (optional)</Text>
            <TextInput
              value={win}
              onChangeText={setWin}
              placeholder="e.g., Finished that project..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={2}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                fontSize: fontSize.base,
                color: colors.foreground,
                minHeight: 60,
                textAlignVertical: "top",
                marginBottom: spacing.lg,
              }}
            />
            <TouchableOpacity
              onPress={() => void handleSave()}
              disabled={mood === null || saving}
              activeOpacity={0.8}
              style={{
                backgroundColor: mood !== null && !saving ? colors.primary : colors.border,
                paddingVertical: spacing.md,
                borderRadius: borderRadius.md,
                alignItems: "center",
                ...shadows.sm,
              }}
            >
              {saving ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.primaryForeground }}>Save</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function AuthScreen() {
  const { isLoading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length >= 6, [email, password]);

  const onSubmit = async () => {
    try {
      setBusy(true);
      setErrorText(null);
      if (mode === "signin") {
        await signIn({ email: email.trim(), password });
      } else {
        await signUp({ email: email.trim(), password });
      }
    } catch (e: any) {
      setErrorText(e?.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 32, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
        Compass
      </Text>
      <Text style={{ textAlign: "center", color: "#666", marginBottom: 24 }}>
        Thoughtful guidance, when it matters.
      </Text>

      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 10,
          }}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password (min 6 chars)"
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 10,
          }}
        />

        {(isLoading || busy) && (
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <ActivityIndicator />
          </View>
        )}

        {errorText && <Text style={{ color: "#b00020" }}>{errorText}</Text>}

        <Button
          title={mode === "signin" ? "Sign in" : "Sign up"}
          onPress={() => void onSubmit()}
          disabled={!canSubmit || isLoading || busy}
        />

        <Button
          title={mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
        />
      </View>
    </SafeAreaView>
  );
}

