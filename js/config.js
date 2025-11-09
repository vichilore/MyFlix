// js/config.js
// Config globale del frontend

window.CONFIG = {
  // In locale:
  API_BASE_URL: "https://itanime-api.onrender.com",
  WATCH_BASE_URL: "https://itanime-render.com",

  TMDB_API_KEY: "d901992e1c28dc2c682596bcbee39800",
  TMDB_V4_TOKEN: "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkOTAxOTkyZTFjMjhkYzJjNjgyNTk2YmNiZWUzOTgwMCIsIm5iZiI6MTc2MjE4NTk3MS44MTksInN1YiI6IjY5MDhkMmYzNGYxNzU2NmE1NTJmZjFhZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.KAiCHRGcJmnZ7IMv3eXZUPr9smH_dxmp5mcnFdaSI68",
  TMDB_V4_ACCOUNT_ID: "6908d2f34f17566a552ff1ae",

  TMDB_PROVIDER_DEFAULT_PARAMS: {
    language: "it-IT",
    watch_region: "IT",
    sort_by: "popularity.desc",
    include_adult: "false",
    include_null_first_air_dates: "false",
    with_watch_monetization_types: "flatrate"
  },

  TMDB_PROVIDERS: {
    "8": {
      name: "Netflix",
      providerId: "8",
      endpoint: "/discover/tv",
      params: {}
    },
    "119": {
      name: "Prime Video",
      providerId: "119",
      endpoint: "/discover/movie",
      params: {}
    },
    "337": {
      name: "Disney+",
      providerId: "337",
      endpoint: "/discover/tv",
      params: { include_null_first_air_dates: "false" }
    },
    "39": {
      name: "NOW",
      providerId: "39",
      endpoint: "/discover/movie",
      params: {}
    },
    "350": {
      name: "Apple TV+",
      providerId: "350",
      endpoint: "/discover/movie",
      params: {}
    },
    "531": {
      name: "Paramount+",
      providerId: "531",
      endpoint: "/discover/movie",
      params: {}
    },
    "99": {
      name: "RaiPlay",
      providerId: "99",
      endpoint: "/discover/movie",
      params: {
        with_watch_monetization_types: "free"
      }
    },
    "146": {
      name: "Mediaset Infinity",
      providerId: "146",
      endpoint: "/discover/tv",
      params: {}
    },
    "72": {
      name: "TIMVISION",
      providerId: "72",
      endpoint: "/discover/tv",
      params: {}
    },
    "283": {
      name: "Crunchyroll",
      providerId: "283",
      endpoint: "/discover/tv",
      params: {}
    }
  }

};
