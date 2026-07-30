import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTranslation } from "@/i18n/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];
  const { t } = useTranslation();
  const { signIn, signUp, setStorageMode } = useAuth();
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (isSignUp) {
      const result = await signUp(email.trim(), password);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(t("auth.signUpSuccess"));
        setIsSignUp(false);
      }
    } else {
      const result = await signIn(email.trim(), password);
      if (result.error) {
        setError(result.error);
      } else {
        // Successfully signed in — go back
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)");
        }
      }
    }
    setLoading(false);
  };

  const handleContinueLocal = async () => {
    await setStorageMode("local");
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleContinueLocal}
          >
            <MaterialIcons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Hero section */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={[colors.tint + "30", colors.accentTeal + "20", "transparent"]}
              style={styles.heroBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={[styles.iconContainer, { backgroundColor: colors.tint }]}>
              <MaterialIcons name="cloud-sync" size={40} color="#FFFFFF" />
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              {t("auth.welcomeTitle")}
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              {t("auth.welcomeSubtitle")}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* Success message */}
            {success && (
              <View style={[styles.messageBanner, { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }]}>
                <MaterialIcons name="check-circle" size={18} color={colors.success} />
                <Text style={[styles.messageText, { color: colors.success }]}>
                  {success}
                </Text>
              </View>
            )}

            {/* Error message */}
            {error && (
              <View style={[styles.messageBanner, { backgroundColor: colors.danger + "20", borderColor: colors.danger + "40" }]}>
                <MaterialIcons name="error" size={18} color={colors.danger} />
                <Text style={[styles.messageText, { color: colors.danger }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Email */}
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <MaterialIcons name="email" size={20} color={colors.placeholder} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("auth.email")}
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Password */}
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <MaterialIcons name="lock" size={20} color={colors.placeholder} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("auth.password")}
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color={colors.placeholder}
                />
              </TouchableOpacity>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={[styles.submitButton, { opacity: loading || !email.trim() || !password.trim() ? 0.6 : 1 }]}
              onPress={handleSubmit}
              disabled={loading || !email.trim() || !password.trim()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.tint, colors.accentTeal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>
                    {isSignUp ? t("auth.signUp") : t("auth.signIn")}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Toggle sign in / sign up */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
            >
              <Text style={[styles.toggleText, { color: colors.tint }]}>
                {isSignUp ? t("auth.switchToSignIn") : t("auth.switchToSignUp")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.placeholder }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Continue local */}
          <TouchableOpacity
            style={[styles.localButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={handleContinueLocal}
            disabled={loading}
            activeOpacity={0.7}
          >
            <MaterialIcons name="smartphone" size={20} color={colors.textSecondary} />
            <Text style={[styles.localButtonText, { color: colors.text }]}>
              {t("auth.continueLocal")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
    marginBottom: 8,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 40,
    overflow: "hidden",
  },
  heroBg: {
    ...StyleSheet.absoluteFill,
    borderRadius: 200,
    transform: [{ scale: 2 }],
    opacity: 0.5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  formSection: {
    gap: 14,
  },
  messageBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  eyeButton: {
    padding: 6,
  },
  submitButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  submitGradient: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  toggleButton: {
    alignSelf: "center",
    padding: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  localButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
  },
  localButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
