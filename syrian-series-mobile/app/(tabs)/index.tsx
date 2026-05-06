import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getPopularSeries } from "../../services/tmdb";

type Series = {
  id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
};

export default function Home() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getPopularSeries().then((data) => {
      setSeries(data);
      setLoading(false);
    });
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#db2777" size="large" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Arabic Series</Text>
      <FlatList
        data={series}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/series/${item.id}`)}
          >
            <Image
              source={{
                uri: item.poster_path
                  ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                  : "https://via.placeholder.com/300x450",
              }}
              style={styles.image}
            />
            <Text style={styles.title} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.rating}>
              ⭐ {(item.vote_average / 2).toFixed(1)}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b", padding: 12 },
  center: {
    flex: 1,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  row: { justifyContent: "space-between" },
  card: {
    width: "48%",
    marginBottom: 16,
    backgroundColor: "#18181b",
    borderRadius: 12,
    overflow: "hidden",
  },
  image: { width: "100%", height: 200 },
  title: { color: "#fff", fontSize: 12, fontWeight: "600", padding: 8 },
  rating: {
    color: "#facc15",
    fontSize: 11,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
});
