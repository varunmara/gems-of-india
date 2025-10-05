export const ENTITY_LIMITS_VARIABLES = {
  TODAY_LIMIT: 20,
  YESTERDAY_LIMIT: 5,
  MONTH_LIMIT: 5,
  VIEW_ALL_PAGE_TODAY_YESTERDAY_LIMIT: 20,
  VIEW_ALL_PAGE_MONTH_LIMIT: 20,
} as const

export const DATE_FORMAT = {
  DISPLAY: "EEE, MMM d, yyyy", // Format: Mon, Jan 1, 2024
  DISPLAY_MONTH: "MMMM yyyy", // Format: January 2024
  DISPLAY_DAY: "EEE d", // Format: Mon 1
  API: "yyyy-MM-dd",
  FULL: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", // Full ISO format with time
} as const

// Rate limits for different APIs
export const API_RATE_LIMITS = {
  SEARCH: {
    REQUESTS: 15, // 15 requests
    WINDOW: 60 * 1000, // per minute
  },
  DEFAULT: {
    REQUESTS: 10, // 10 requests
    WINDOW: 60 * 1000, // per minute
  },
} as const

// Upvote limits
export const UPVOTE_LIMITS = {
  ACTIONS_PER_WINDOW: 100, // Maximum number of upvote actions per time window
  TIME_WINDOW_MS: 5 * 60 * 1000, // Time window for rate limit (5 minutes)
  TIME_WINDOW_MINUTES: 5, // Time window for rate limit (5 minutes)
  MIN_TIME_BETWEEN_ACTIONS_MS: 2000, // Minimum time between two actions on the same entity (2 seconds)
  MIN_TIME_BETWEEN_ACTIONS_SECONDS: 2, // Minimum time between two actions on the same entity (2 seconds)
  DEBOUNCE_TIME_MS: 100, // Client-side debounce time (500ms)
} as const

export const DOMAIN_AUTHORITY = 37

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
]
