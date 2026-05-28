import axios, { AxiosError } from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor: adjunta el JWT ─────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  // localStorage solo existe en el browser
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response interceptor: maneja 401 ────────────────────────────────────────
//
// IMPORTANTE: el endpoint /api/auth/login devuelve 401 cuando las credenciales
// son inválidas — eso NO es una sesión expirada, es un error de formulario que
// el componente de login debe poder mostrar al usuario. Si redirigimos en ese
// caso, el form se resetea y parece que "el login no funciona".
//
// Solo redirigimos cuando el 401 viene de un endpoint distinto al login.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url ?? "";
    const isLoginRequest = requestUrl.includes("/api/auth/login");

    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !isLoginRequest &&
      error.config?.headers?.["X-Skip-Auth-Redirect"] !== "true"
    ) {
      // Sesión expirada → limpiamos estado y redirigimos
      localStorage.removeItem("token");
      localStorage.removeItem("auth-storage"); // clave del persist de Zustand

      // Evitamos un loop si ya estamos en /login
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
