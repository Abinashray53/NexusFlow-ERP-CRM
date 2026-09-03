import axios from "axios";
export const api = axios.create({
baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
});
// Attach the JWT (if we have one) to every outgoing request.
api.interceptors.request.use((config) => {
const token = localStorage.getItem("token");
if (token) {
config.headers.Authorization = `Bearer ${token}`;
}
return config;
});
// If the token is invalid/expired, the API replies 401 - bounce to login.
api.interceptors.response.use(
(response) => response,
(error) => {
if (error.response?.status === 401) {
localStorage.removeItem("token");
localStorage.removeItem("user");
if (window.location.pathname !== "/login") {
window.location.href = "/login";
}
}
return Promise.reject(error);
}
);
// Every backend error comes back as { error: "message" } - this pulls
// that out so components can show it directly.
export function getErrorMessage(err: unknown): string {
if (axios.isAxiosError(err)) {
return err.response?.data?.error || err.message || "Something went wrong";
}
return "Something went wrong";
}
