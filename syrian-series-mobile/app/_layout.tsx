import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="series/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#09090b" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="movie/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#09090b" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#09090b" },
            headerTintColor: "#fff",
            title: "Sign In",
          }}
        />
      </Stack>
    </>
  );
}
