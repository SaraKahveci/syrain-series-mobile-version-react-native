import { useRouter } from "expo-router";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebase";

type Review = {
  id: string;
  contentId: string;
  text: string;
  rating: number;
  createdAt: any; // Handled as Firestore Timestamp or string
};

type WatchlistItem = {
  id: string;
  contentId: string;
  type: "series" | "movie";
  title: string;
  image: string;
  addedAt: string;
};

type FavoriteItem = {
  id: string;
  seriesId: string;
  title: string;
  image: string;
  rating: number;
};

export default function Profile() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  const [tab, setTab] = useState<"favorites" | "watchlist" | "reviews">(
    "favorites",
  );

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        router.replace("/login");
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    setDisplayName(user.displayName || "");

    const loadData = async () => {
      setLoading(true);
      try {
        const [favSnapshot, watchSnapshot, reviewSnapshot] = await Promise.all([
          getDocs(
            query(collection(db, "favorites"), where("uid", "==", user.uid)),
          ),
          getDocs(
            query(collection(db, "watchlist"), where("uid", "==", user.uid)),
          ),
          getDocs(
            query(collection(db, "reviews"), where("uid", "==", user.uid)),
          ),
        ]);

        setFavorites(
          favSnapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              seriesId: data?.seriesId || "",
              title: data?.title || "Untitled",
              image: data?.image || "https://via.placeholder.com/150",
              rating: Number(data?.rating || 0),
            };
          }),
        );

        setWatchlist(
          watchSnapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              contentId: data?.contentId || "",
              type: data?.type || "series",
              title: data?.title || "Untitled",
              image: data?.image || "https://via.placeholder.com/150",
              addedAt: data?.addedAt || "",
            };
          }),
        );

        setReviews(
          reviewSnapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              contentId: data?.contentId || "",
              text: data?.text || "",
              rating: Number(data?.rating || 0),
              createdAt: data?.createdAt || null,
            };
          }),
        );
      } catch (e) {
        console.error("Profile load error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid]);

  // Helper to safely format dates from Firestore Timestamps
  const formatDate = (dateInput: any) => {
    if (!dateInput) return "";
    try {
      const d =
        dateInput instanceof Timestamp
          ? dateInput.toDate()
          : new Date(dateInput);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    } catch {
      return "";
    }
  };

  async function handleSaveName() {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      Alert.alert("Success", "Name updated!");
    } catch {
      Alert.alert("Error", "Failed to update name");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/login");
        },
      },
    ]);
  }

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#db2777" size="large" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.userInfo}>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.nameRow}>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Add your name..."
                placeholderTextColor="#71717a"
                style={styles.nameInput}
              />
              <TouchableOpacity
                onPress={handleSaveName}
                disabled={saving}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.stats}>
              <Text style={styles.stat}>{favorites.length} favs</Text>
              <Text style={styles.stat}>{reviews.length} reviews</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(["favorites", "watchlist", "reviews"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.activeTab]}
          >
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {tab === "favorites" && (
          <View style={styles.grid}>
            {favorites.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => router.push(`/series/${f.seriesId}`)}
                style={styles.gridItem}
              >
                <Image source={{ uri: f.image }} style={styles.gridImage} />
                <Text style={styles.gridTitle} numberOfLines={1}>
                  {f.title}
                </Text>
                <Text style={styles.gridRating}>{"★".repeat(f.rating)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === "watchlist" && (
          <View style={styles.grid}>
            {watchlist.map((w) => (
              <TouchableOpacity
                key={w.id}
                onPress={() =>
                  router.push(
                    w.type === "movie"
                      ? `/movie/${w.contentId}`
                      : `/series/${w.contentId}`,
                  )
                }
                style={styles.gridItem}
              >
                <Image source={{ uri: w.image }} style={styles.gridImage} />
                <Text style={styles.gridTitle} numberOfLines={1}>
                  {w.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === "reviews" &&
          reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewRating}>{"★".repeat(r.rating)}</Text>
                <Text style={styles.reviewDate}>{formatDate(r.createdAt)}</Text>
              </View>
              <Text style={styles.reviewText}>{r.text}</Text>
            </View>
          ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  center: {
    flex: 1,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
  },
  userCard: {
    backgroundColor: "#18181b",
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  userHeader: { flexDirection: "row", gap: 16, marginBottom: 16 },
  avatar: { width: 70, height: 70, borderRadius: 35 },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#db2777",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  userInfo: { flex: 1 },
  email: { color: "#a1a1aa", fontSize: 12, marginBottom: 4 },
  nameRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  nameInput: {
    flex: 1,
    backgroundColor: "#27272a",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: "#db2777",
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  stats: { flexDirection: "row", gap: 12 },
  stat: { color: "#71717a", fontSize: 11 },
  logoutButton: { alignSelf: "flex-end" },
  logoutText: { color: "#f87171", fontSize: 12 },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    backgroundColor: "#27272a",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: { backgroundColor: "#db2777" },
  tabText: { color: "#a1a1aa", fontSize: 12, fontWeight: "600" },
  activeTabText: { color: "#fff" },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    backgroundColor: "#18181b",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  gridImage: { width: "100%", height: 160 },
  gridTitle: { color: "#fff", fontSize: 12, fontWeight: "600", padding: 8 },
  gridRating: {
    color: "#facc15",
    fontSize: 10,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  reviewCard: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewRating: { color: "#facc15", fontSize: 12 },
  reviewDate: { color: "#71717a", fontSize: 11 },
  reviewText: { color: "#a1a1aa", fontSize: 13 },
});
