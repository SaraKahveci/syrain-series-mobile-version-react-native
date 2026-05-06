import { useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
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
import { getSeriesDetails } from "../../services/tmdb";

type Series = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  genres: { id: number; name: string }[];
};

type Review = {
  id: string;
  uid: string;
  userEmail: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: string;
};

export default function SeriesDetail() {
  const { id } = useLocalSearchParams();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteDocId, setFavoriteDocId] = useState<string | null>(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (!id) return;
    getSeriesDetails(Number(id)).then((data) => {
      if (user) {
        const favQuery = query(
          collection(db, "favorites"),
          where("uid", "==", user.uid),
          where("seriesId", "==", id.toString()),
        );

        getDocs(favQuery).then((snapshot) => {
          if (!snapshot.empty) {
            setIsFavorite(true);
            setFavoriteDocId(snapshot.docs[0].id);
          } else {
            setIsFavorite(false);
            setFavoriteDocId(null);
          }
        });
      }
      setSeries(data);
      setLoading(false);
    });

    // Load reviews
    const q = query(
      collection(db, "reviews"),
      where("contentId", "==", id.toString()),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Review,
      );

      data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setReviews(data);

      if (user) {
        const existing = data.find((r) => r.uid === user.uid);
        setUserReview(existing ?? null);
        if (existing) {
          setReviewText(existing.text);
          setRating(existing.rating);
        }
      }
    });

    return unsubscribe;
  }, [id, user]);

  async function handleToggleFavorite() {
    if (!user) {
      Alert.alert("Login Required", "Please login first");
      return;
    }

    try {
      if (isFavorite && favoriteDocId) {
        await deleteDoc(doc(db, "favorites", favoriteDocId));
        setIsFavorite(false);
        setFavoriteDocId(null);
      } else {
        const docRef = await addDoc(collection(db, "favorites"), {
          uid: user.uid,
          seriesId: id!.toString(),
          title: series?.name,
          image: series?.poster_path
            ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
            : "",
          rating: series ? series.vote_average / 2 : 0,
          createdAt: new Date().toISOString(),
        });

        setIsFavorite(true);
        setFavoriteDocId(docRef.id);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update favorites");
    }
  }

  async function handleSubmitReview() {
    if (!user || !reviewText.trim() || rating === 0) {
      Alert.alert("Error", "Please provide a rating and review text");
      return;
    }

    const reviewData = {
      contentId: id!.toString(),
      uid: user.uid,
      userEmail: user.email ?? "",
      userName: user.displayName ?? user.email ?? "Anonymous",
      rating,
      text: reviewText.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      if (userReview) {
        await setDoc(doc(db, "reviews", userReview.id), reviewData);
        Alert.alert("Success", "Review updated!");
      } else {
        await addDoc(collection(db, "reviews"), reviewData);
        Alert.alert("Success", "Review submitted!");
      }
      setShowReviewForm(false);
    } catch (err) {
      Alert.alert("Error", "Failed to submit review");
    }
  }

  async function handleDeleteReview(reviewId: string) {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteDoc(doc(db, "reviews", reviewId));
            Alert.alert("Success", "Review deleted");
          },
        },
      ],
    );
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#db2777" size="large" />
      </View>
    );

  if (!series)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Series not found</Text>
      </View>
    );

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{
          uri: series.backdrop_path
            ? `https://image.tmdb.org/t/p/w780${series.backdrop_path}`
            : series.poster_path
              ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
              : "https://via.placeholder.com/780x440",
        }}
        style={styles.backdrop}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{series.name}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
          >
            <Text style={styles.favoriteButtonText}>
              {isFavorite ? "❤️ Remove Favorite" : "🤍 Add to Favorites"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>
            ⭐ {(series.vote_average / 2).toFixed(1)} / 5
          </Text>
        </View>

        <Text style={styles.overview}>
          {series.overview || "No description available."}
        </Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>First Aired</Text>
            <Text style={styles.infoValue}>{series.first_air_date || "—"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Seasons</Text>
            <Text style={styles.infoValue}>
              {series.number_of_seasons || "—"}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Episodes</Text>
            <Text style={styles.infoValue}>
              {series.number_of_episodes || "—"}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{series.status || "—"}</Text>
          </View>
        </View>

        {series.genres && series.genres.length > 0 && (
          <View style={styles.genresContainer}>
            <Text style={styles.genresLabel}>Genres</Text>
            <View style={styles.genresList}>
              {series.genres.map((g) => (
                <View key={g.id} style={styles.genreChip}>
                  <Text style={styles.genreText}>{g.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>Reviews ({reviews.length})</Text>
            {reviews.length > 0 && (
              <Text style={styles.avgRating}>
                ⭐ {avgRating.toFixed(1)} avg
              </Text>
            )}
          </View>

          {user && !userReview && !showReviewForm && (
            <TouchableOpacity
              style={styles.writeReviewButton}
              onPress={() => setShowReviewForm(true)}
            >
              <Text style={styles.writeReviewText}>Write a Review</Text>
            </TouchableOpacity>
          )}

          {user && (userReview || showReviewForm) && (
            <View style={styles.reviewForm}>
              <Text style={styles.formTitle}>
                {userReview ? "Edit Your Review" : "Write a Review"}
              </Text>

              <View style={styles.starPicker}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Text style={styles.star}>
                      {rating >= star ? "★" : "☆"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.reviewInput}
                placeholder="Share your thoughts..."
                placeholderTextColor="#71717a"
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={4}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitReview}
                >
                  <Text style={styles.submitButtonText}>
                    {userReview ? "Update" : "Submit"}
                  </Text>
                </TouchableOpacity>
                {showReviewForm && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowReviewForm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {!user && (
            <Text style={styles.loginPrompt}>Sign in to write a review</Text>
          )}

          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewUser}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {review.userName[0].toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.reviewUserName}>{review.userName}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reviewRating}>
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </Text>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
              {user?.uid === review.uid && (
                <TouchableOpacity onPress={() => handleDeleteReview(review.id)}>
                  <Text style={styles.deleteButton}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    marginBottom: 16,
  },

  favoriteButton: {
    backgroundColor: "#db2777",
    padding: 12,
    borderRadius: 10,
  },

  favoriteButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  container: { flex: 1, backgroundColor: "#09090b" },
  center: {
    flex: 1,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: { width: "100%", height: 250 },
  content: { padding: 16 },
  title: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  rating: { color: "#facc15", fontSize: 16, fontWeight: "600" },
  overview: {
    color: "#a1a1aa",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "#18181b",
    borderRadius: 10,
    padding: 12,
    width: "48%",
  },
  infoLabel: { color: "#71717a", fontSize: 11, marginBottom: 4 },
  infoValue: { color: "#fff", fontSize: 13, fontWeight: "600" },
  genresContainer: { marginBottom: 20 },
  genresLabel: { color: "#71717a", fontSize: 13, marginBottom: 8 },
  genresList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genreChip: {
    backgroundColor: "#27272a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreText: { color: "#fff", fontSize: 12 },
  reviewsSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#27272a",
    paddingTop: 20,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  reviewsTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  avgRating: { color: "#facc15", fontSize: 14 },
  writeReviewButton: {
    backgroundColor: "#db2777",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  writeReviewText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  reviewForm: {
    backgroundColor: "#18181b",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  formTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  starPicker: { flexDirection: "row", gap: 8, marginBottom: 12 },
  star: { fontSize: 32, color: "#facc15" },
  reviewInput: {
    backgroundColor: "#27272a",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  formButtons: { flexDirection: "row", gap: 8 },
  submitButton: {
    flex: 1,
    backgroundColor: "#db2777",
    padding: 12,
    borderRadius: 8,
  },
  submitButtonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  cancelButton: {
    flex: 1,
    backgroundColor: "#27272a",
    padding: 12,
    borderRadius: 8,
  },
  cancelButtonText: { color: "#fff", textAlign: "center" },
  loginPrompt: { color: "#71717a", fontSize: 14, marginBottom: 16 },
  reviewCard: {
    backgroundColor: "#18181b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewUser: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#db2777",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  reviewUserName: { color: "#fff", fontSize: 13, fontWeight: "600" },
  reviewDate: { color: "#71717a", fontSize: 11 },
  reviewRating: { color: "#facc15", fontSize: 14 },
  reviewText: { color: "#a1a1aa", fontSize: 13, lineHeight: 20 },
  deleteButton: { color: "#f87171", fontSize: 12, marginTop: 8 },
  errorText: { color: "#fff", fontSize: 16 },
});
