const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = "255227246862979880faf00116fac593";

export async function getPopularSeries() {
  const res = await fetch(
    `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=ar&with_original_language=ar`,
  );
  const data = await res.json();
  return data.results ?? [];
}

export async function getPopularMovies() {
  const res = await fetch(
    `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ar&with_original_language=ar`,
  );
  const data = await res.json();
  return data.results ?? [];
}

export async function getSeriesDetails(id: number) {
  const res = await fetch(
    `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=ar`,
  );
  return res.json();
}

export async function getMovieDetails(id: number) {
  const res = await fetch(
    `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=ar`,
  );
  return res.json();
}

export async function searchContent(query: string) {
  const [series, movies] = await Promise.all([
    fetch(
      `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=ar`,
    ).then((r) => r.json()),
    fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=ar`,
    ).then((r) => r.json()),
  ]);
  return {
    series: series.results ?? [],
    movies: movies.results ?? [],
  };
}
export async function searchActors(query: string) {
  const res = await fetch(
    `${BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=ar`,
  );
  return res.json();
}
