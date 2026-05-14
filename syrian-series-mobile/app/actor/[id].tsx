import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = "255227246862979880faf00116fac593";

type Actor = {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  birthday: string;
  place_of_birth: string;
  known_for_department: string;
};

type Credit = {
  id: number;
  name?: string;
  title?: string;
  poster_path: string | null;
  vote_average: number;
  character: string;
};

export default function ActorDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [actor, setActor] = useState<Actor | null>(null);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function loadActor() {
      try {
        const [actorRes, creditsRes] = await Promise.all([
          fetch(`${BASE_URL}/person/${id}?api_key=${API_KEY}&language=ar`),
          fetch(
            `${BASE_URL}/person/${id}/tv_credits?api_key=${API_KEY}&language=ar`,
          ),
        ]);

        const actorData = await actorRes.json();
        const creditsData = await creditsRes.json();

        setActor(actorData);
        setCredits((creditsData.cast || []).slice(0, 20));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadActor();
  }, [id]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#db2777" size="large" />
      </View>
    );

  if (!actor)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Actor not found</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {actor.profile_path && (
          <Image
            source={{
              uri: `https://image.tmdb.org/t/p/w500${actor.profile_path}`,
            }}
            style={styles.profileImage}
          />
        )}
        <Text style={styles.name}>{actor.name}</Text>
        {actor.known_for_department && (
          <Text style={styles.department}>{actor.known_for_department}</Text>
        )}
      </View>

      <View style={styles.content}>
        {actor.biography && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biography</Text>
            <Text style={styles.biography}>{actor.biography}</Text>
          </View>
        )}

        <View style={styles.infoGrid}>
          {actor.birthday && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Birthday</Text>
              <Text style={styles.infoValue}>{actor.birthday}</Text>
            </View>
          )}
          {actor.place_of_birth && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Place of Birth</Text>
              <Text style={styles.infoValue}>{actor.place_of_birth}</Text>
            </View>
          )}
        </View>

        {credits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Known For</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.creditsScroll}
            >
              {credits.map((credit) => (
                <TouchableOpacity
                  key={credit.id}
                  onPress={() => router.push(`/series/${credit.id}`)}
                  style={styles.creditCard}
                >
                  <Image
                    source={{
                      uri: credit.poster_path
                        ? `https://image.tmdb.org/t/p/w185${credit.poster_path}`
                        : "https://via.placeholder.com/185x278",
                    }}
                    style={styles.creditImage}
                  />
                  <Text style={styles.creditTitle} numberOfLines={2}>
                    {credit.name || credit.title}
                  </Text>
                  {credit.character && (
                    <Text style={styles.creditCharacter} numberOfLines={1}>
                      as {credit.character}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  header: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#18181b",
  },
  profileImage: { width: 150, height: 150, borderRadius: 75, marginBottom: 16 },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  department: { color: "#a1a1aa", fontSize: 14, marginTop: 4 },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  biography: { color: "#a1a1aa", fontSize: 14, lineHeight: 22 },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: "#18181b",
    borderRadius: 10,
    padding: 12,
    width: "48%",
  },
  infoLabel: { color: "#71717a", fontSize: 11, marginBottom: 4 },
  infoValue: { color: "#fff", fontSize: 13 },
  creditsScroll: { marginHorizontal: -16, paddingHorizontal: 16 },
  creditCard: { width: 120, marginRight: 12 },
  creditImage: { width: 120, height: 180, borderRadius: 8, marginBottom: 8 },
  creditTitle: { color: "#fff", fontSize: 12, fontWeight: "600" },
  creditCharacter: { color: "#71717a", fontSize: 10, marginTop: 2 },
  errorText: { color: "#fff", fontSize: 16 },
});
