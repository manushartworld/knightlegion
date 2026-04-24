import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

export function mediaUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  if (pathOrUrl.startsWith("/api/")) return `${BACKEND_URL}${pathOrUrl}`;
  return pathOrUrl;
}
