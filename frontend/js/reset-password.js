const form = document.getElementById("reset-form");
const message = document.getElementById("form-message");
const token = new URLSearchParams(window.location.search).get("token");

if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    message.textContent = "Invalid or missing reset link. Request a new link.";
    form.querySelector("button[type='submit']").disabled = true;
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = form.elements.password.value;
    const confirmPassword = form.elements.confirmPassword.value;

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
        message.textContent = "Please request a new reset link.";
        return;
    }

    if (password.length < 8) {
        message.textContent = "Password must be at least 8 characters.";
        return;
    }

    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        return;
    }

    message.textContent = "Resetting password...";

    try {
        const response = await api("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ token, password, confirmPassword })
        });

        message.textContent = response.message ||
            "Password reset successfully. You can now log in.";

        if (response.message?.toLowerCase().includes("success")) {
            form.reset();
        }
    } catch (error) {
        message.textContent = error.message ||
            "Reset failed. The link may have expired.";
    }
});
