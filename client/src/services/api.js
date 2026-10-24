
import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL;
const API_URL =
    (rawApiUrl ? rawApiUrl.replace(/\/+$/, "") : "") ||
    "http://localhost:8085";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

export { API_URL };
export default api;
