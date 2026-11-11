const form = document.getElementById("forgot-form");
const message = document.getElementById("form-message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "Sending request...";

    try {
        const response = await api("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({
                email: form.elements.email.value.trim()
            })
        });

        message.textContent = response.message ||
            "If an account exists, a reset link will be sent.";
    } catch (error) {
        message.textContent = error.message ||
            "Request failed. Please try again.";
    }
});
