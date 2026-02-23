// Backend API URL - use environment variable or default to local development
export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";
export const WEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || "";
export const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || "";
