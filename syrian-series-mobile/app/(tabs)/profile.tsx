import { useRouter } from "expo-router";
import { signOut, updateProfile } from "firebase/auth";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
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
  createdAt: string;
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
  const user = auth.currentUser;
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
    if (!user) {
      setLoading(false);
      return;
    }

    const uid = user.uid;
    setDisplayName(user.displayName || "");

    const favUnsubscribe = onSnapshot(
      query(collection(db, "favorites"), where("uid", "==", uid)),
      (snapshot) => {
        setFavorites(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as FavoriteItem),
        );
      },
    );

    const watchUnsubscribe = onSnapshot(
      query(collection(db, "watchlist"), where("uid", "==", uid)),
      (snapshot) => {
        setWatchlist(
          snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as WatchlistItem,
          ),
        );
      },
    );

    const loadReviews = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, "reviews"), where("uid", "==", uid)),
        );

        setReviews(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Review),
        );
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();

    return () => {
      favUnsubscribe();
      watchUnsubscribe();
    };
  }, [user]);

  async function handleSaveName() {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      Alert.alert("Success", "Name updated!");
    } catch (err) {
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

  if (!user) return null;

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#db2777" size="large" />
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      {/* User Info Card */}
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
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.stats}>
              <Text style={styles.stat}>{favorites.length} favorites</Text>
              <Text style={styles.stat}>{reviews.length} reviews</Text>
              <Text style={styles.stat}>{watchlist.length} watchlist</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setTab("favorites")}
          style={[styles.tab, tab === "favorites" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              tab === "favorites" && styles.activeTabText,
            ]}
          >
            ❤️ Favorites ({favorites.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("watchlist")}
          style={[styles.tab, tab === "watchlist" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              tab === "watchlist" && styles.activeTabText,
            ]}
          >
            🕐 Watchlist ({watchlist.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("reviews")}
          style={[styles.tab, tab === "reviews" && styles.activeTab]}
        >
          <Text
            style={[styles.tabText, tab === "reviews" && styles.activeTabText]}
          >
            ⭐ Reviews ({reviews.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {tab === "favorites" &&
          (favorites.length === 0 ? (
            <Text style={styles.emptyText}>No favorites yet.</Text>
          ) : (
            <View style={styles.grid}>
              {favorites.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => router.push(`/series/${f.seriesId}`)}
                  style={styles.gridItem}
                >
                  <Image source={{ uri: f.image }} style={styles.gridImage} />
                  <Text style={styles.gridTitle} numberOfLines={2}>
                    {f.title}
                  </Text>
                  <Text style={styles.gridRating}>
                    {"★".repeat(Math.round(f.rating))}
                    {"☆".repeat(5 - Math.round(f.rating))}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

        {tab === "watchlist" &&
          (watchlist.length === 0 ? (
            <Text style={styles.emptyText}>Your watchlist is empty.</Text>
          ) : (
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
                  <Text style={styles.gridTitle} numberOfLines={2}>
                    {w.title}
                  </Text>
                  <Text style={styles.gridType}>
                    {w.type === "movie" ? "🎬 Movie" : "📺 Series"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

        {tab === "reviews" &&
          (reviews.length === 0 ? (
            <Text style={styles.emptyText}>No reviews yet.</Text>
          ) : (
            reviews.map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => router.push(`/series/${r.contentId}`)}
                style={styles.reviewCard}
              >
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewRating}>
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </Text>
                  <Text style={styles.reviewDate}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.reviewText}>{r.text}</Text>
              </TouchableOpacity>
            ))
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
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#db2777",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  userInfo: { flex: 1 },
  email: { color: "#a1a1aa", fontSize: 13, marginBottom: 8 },
  nameRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  nameInput: {
    flex: 1,
    backgroundColor: "#27272a",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: "#db2777",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  stats: { flexDirection: "row", gap: 12 },
  stat: { color: "#71717a", fontSize: 12 },
  logoutButton: { alignSelf: "flex-end" },
  logoutText: { color: "#f87171", fontSize: 13 },
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
  emptyText: {
    color: "#71717a",
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridItem: {
    width: "48%",
    backgroundColor: "#18181b",
    borderRadius: 12,
    overflow: "hidden",
  },
  gridImage: { width: "100%", height: 150 },
  gridTitle: { color: "#fff", fontSize: 12, fontWeight: "600", padding: 8 },
  gridRating: {
    color: "#facc15",
    fontSize: 11,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  gridType: {
    color: "#a1a1aa",
    fontSize: 11,
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
    alignItems: "center",
    marginBottom: 8,
  },
  reviewRating: { color: "#facc15", fontSize: 13 },
  reviewDate: { color: "#71717a", fontSize: 11 },
  reviewText: { color: "#a1a1aa", fontSize: 13 },
});
