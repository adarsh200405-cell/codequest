
const API_BASE = "http://127.0.0.1:5000/api";

async function api(path, options = {}) {
    const token = localStorage.getItem("codequest_token");

    const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    const url = `${API_BASE}${path}`;
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
            "Cannot connect to API. Check that the backend is running on port 5000."
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
