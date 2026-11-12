const API_BASE = (
    window.CODEQUEST_API_URL ||
    (window.location.hostname === "localhost" ||
     window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:5000/api"
        : "https://YOUR-BACKEND-PROJECT.vercel.app/api")
).replace(/\/+$/, "");

async function api(path, options = {}) {
    const token = localStorage.getItem("codequest_token");

    const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${API_BASE}${normalizedPath}`;

    console.log("[CodeQuest API] Request:", url);

    let response;

    try {
        response = await fetch(url, {
            ...options,
            headers
        });
    } catch (error) {
        console.error("[CodeQuest API] Connection failed:", error);
        throw new Error(
            "Cannot connect to CodeQuest API. Check your internet connection or backend deployment."
        );
    }

    const data = await response.json().catch(() => ({}));

    console.log("[CodeQuest API] Response:", response.status, data);

    if (!response.ok) {
        throw new Error(
            data.message || `Request failed with status ${response.status}.`
        );
    }

    return data;
}
