import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { searchActors, searchContent } from "../../services/tmdb";

type Result = {
  actor: string;
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  profile_path?: string | null;
  vote_average?: number;
  popularity?: number;
  type: "series" | "movie" | "actor";
  known_for?: string;
};

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);

    const [contentData, actorsData] = await Promise.all([
      searchContent(text),
      searchActors(text),
    ]);

    const combined: Result[] = [
      ...contentData.series.map((s: any) => ({
        ...s,
        type: "series" as const,
      })),
      ...contentData.movies.map((m: any) => ({ ...m, type: "movie" as const })),
      ...(actorsData.results ?? []).map((a: any) => ({
        ...a,
        type: "actor" as const,
        known_for:
          a.known_for?.map((k: any) => k.name || k.title).join(", ") || "",
      })),
    ];

    setResults(combined);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search series, movies, or actors..."
        placeholderTextColor="#71717a"
        value={query}
        onChangeText={handleSearch}
      />
      {loading && (
        <ActivityIndicator color="#db2777" style={{ marginTop: 20 }} />
      )}
      <FlatList
        data={results}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              if (item.type === "actor") router.push(`/actor/${item.id}`);
              else
                router.push(
                  item.type === "series"
                    ? `/series/${item.id}`
                    : `/movie/${item.id}`,
                );
            }}
          >
            <Image
              source={{
                uri: item.poster_path
                  ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                  : item.profile_path
                    ? `https://image.tmdb.org/t/p/w92${item.profile_path}`
                    : "https://via.placeholder.com/92x138",
              }}
              style={styles.image}
            />
            <View style={styles.info}>
              <Text style={styles.title}>{item.name ?? item.title}</Text>
              <Text style={styles.type}>
                {item.type === "series"
                  ? "📺 Series"
                  : item.type === "movie"
                    ? "🎬 Movie"
                    : "🎭 Actor"}
              </Text>
              {item.type === "actor" && item.known_for && (
                <Text style={styles.knownFor} numberOfLines={1}>
                  Known for: {item.known_for}
                </Text>
              )}
              {item.type !== "actor" && (
                <Text style={styles.rating}>
                  ⭐ {((item.vote_average ?? 0) / 2).toFixed(1)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b", padding: 12 },
  input: {
    backgroundColor: "#27272a",
    color: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    backgroundColor: "#18181b",
    borderRadius: 10,
    overflow: "hidden",
  },
  image: { width: 60, height: 90 },
  info: { flex: 1, padding: 10, justifyContent: "center" },
  title: { color: "#fff", fontSize: 13, fontWeight: "600" },
  type: { color: "#a1a1aa", fontSize: 11, marginTop: 4 },
  rating: { color: "#facc15", fontSize: 11, marginTop: 4 },
  knownFor: { color: "#71717a", fontSize: 10, marginTop: 4 },
});
