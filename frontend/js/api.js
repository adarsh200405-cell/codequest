
const API_BASE = (
    window.CODEQUEST_API_URL ||
    (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
            ? "http://127.0.0.1:5000/api"
            : "https://codequest-backened.vercel.app/api"
    )
).replace(/\/+$/, "");


async function api(path, options = {}) {
    const token = localStorage.getItem("codequest_token");

    // Request headers
    const headers = {
        ...(options.body && !(options.body instanceof FormData)
            ? { "Content-Type": "application/json" }
            : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    // Normalize API path
    const normalizedPath = path.startsWith("/")
        ? path
        : `/${path}`;

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
            "Cannot connect to CodeQuest API. Please check your internet connection or backend deployment."
        );
    }

    // Handle API response
    let data = {};

    try {
        const responseText = await response.text();
        data = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
        console.error("[CodeQuest API] Invalid JSON response:", error);

        throw new Error(
            "Server returned an invalid response. Please try again later."
        );
    }

    console.log(
        "[CodeQuest API] Response:",
        response.status,
        data
    );

    // Handle HTTP errors
    if (!response.ok) {
        throw new Error(
            data.message ||
            `Request failed with status ${response.status}.`
        );
    }

    return data;
}


// Make API function globally accessible
window.api = api;
