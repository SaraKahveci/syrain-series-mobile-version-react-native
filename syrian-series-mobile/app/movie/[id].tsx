import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getMovieDetails } from "../../services/tmdb";

type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  runtime: number;
  status: string;
  genres: { id: number; name: string }[];
  budget: number;
};

export default function MovieDetail() {
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getMovieDetails(Number(id)).then((data) => {
      setMovie(data);
      setLoading(false);
    });
  }, [id]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#db2777" size="large" />
      </View>
    );

  if (!movie)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Movie not found</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{
          uri: movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
            : movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : "https://via.placeholder.com/780x440",
        }}
        style={styles.backdrop}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{movie.title}</Text>

        <View style={styles.ratingRow}>
          <Text style={styles.rating}>
            ⭐ {(movie.vote_average / 2).toFixed(1)} / 5
          </Text>
        </View>

        <Text style={styles.overview}>
          {movie.overview || "No description available."}
        </Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Release Date</Text>
            <Text style={styles.infoValue}>{movie.release_date || "—"}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Runtime</Text>
            <Text style={styles.infoValue}>
              {movie.runtime ? `${movie.runtime} min` : "—"}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{movie.status || "—"}</Text>
          </View>
          {movie.budget > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Budget</Text>
              <Text style={styles.infoValue}>
                ${movie.budget.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {movie.genres && movie.genres.length > 0 && (
          <View style={styles.genresContainer}>
            <Text style={styles.genresLabel}>Genres</Text>
            <View style={styles.genresList}>
              {movie.genres.map((g) => (
                <View key={g.id} style={styles.genreChip}>
                  <Text style={styles.genreText}>{g.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
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
  errorText: { color: "#fff", fontSize: 16 },
});
