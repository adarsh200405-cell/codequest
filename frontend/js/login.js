
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    if (!loginForm) {
        console.error("Login form not found in login.html");
        return;
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const emailInput = loginForm.querySelector('[type="email"]');
        const passwordInput = loginForm.querySelector('[type="password"]');

        const email = emailInput?.value.trim();
        const password = passwordInput?.value;

        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        const submitButton = loginForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        const originalText = submitButton
            ? (submitButton.textContent || submitButton.value)
            : "";

        if (submitButton) {
            submitButton.disabled = true;
            if ("value" in submitButton && submitButton.tagName === "INPUT") {
                submitButton.value = "Logging in...";
            } else {
                submitButton.textContent = "Logging in...";
            }
        }

        try {
            const result = await api("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            if (!result.token) {
                throw new Error("Login response did not contain an authentication token.");
            }

            localStorage.setItem("codequest_token", result.token);

            if (result.user) {
                localStorage.setItem("codequest_user", JSON.stringify(result.user));
            }

            window.location.href = "dashboard.html";
        } catch (error) {
            alert(error.message || "Login failed. Please try again.");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;

                if (submitButton.tagName === "INPUT") {
                    submitButton.value = originalText || "Login";
                } else {
                    submitButton.textContent = originalText || "Login";
                }
            }
        }
    });
});
