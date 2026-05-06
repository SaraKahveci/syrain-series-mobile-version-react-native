import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../firebase";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const redirectUri = AuthSession.makeRedirectUri({});
  console.log(redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      "238736725806-dupjfqqsdlhcjm1pqnf0iidaas7qkkr5.apps.googleusercontent.com",
    androidClientId:
      "238736725806-4psnb4u4idktbooqhq17iot1f0kmidcb.apps.googleusercontent.com",
    webClientId:
      "1052594174245-466u670t522q5nh13sen983kki4omjug.apps.googleusercontent.com",
  });

  async function handleGoogle() {
    setError("");
    try {
      const result = await promptAsync();
      if (result.type === "success") {
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        await signInWithCredential(auth, credential);
        router.replace("/profile");
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, password);
        router.replace("/");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        router.replace("/profile");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === "login" ? "Login" : "Create Account"}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#71717a"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#71717a"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {mode === "login" ? "Login" : "Register"}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogle}
        disabled={!request}
      >
        <Text style={styles.googleText}>🔵 Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setMode(mode === "login" ? "register" : "login")}
      >
        <Text style={styles.toggle}>
          {mode === "login"
            ? "Create an account"
            : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#27272a",
    color: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 14,
  },
  error: { color: "#f87171", fontSize: 13, marginBottom: 12 },
  button: {
    backgroundColor: "#db2777",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  line: { flex: 1, height: 1, backgroundColor: "#27272a" },
  orText: { color: "#71717a", fontSize: 13 },
  googleButton: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  googleText: { color: "#111", fontWeight: "bold", fontSize: 16 },
  toggle: { color: "#a1a1aa", textAlign: "center", fontSize: 13 },
});
