
/* =========================================
   CODEQUEST - COMMON HELPERS
========================================= */

function escapeHtml(value) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };

  return String(value ?? "").replace(/[&<>"']/g, character => {
    return entities[character];
  });
}

function showPageError(container, message) {
  if (!container) return;

  const paragraph = document.createElement("p");
  paragraph.className = "form-message error";
  paragraph.textContent = message || "Something went wrong. Please try again.";

  container.replaceChildren(paragraph);
}

/* =========================================
   PAGE INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;
  const navActions = document.getElementById("nav-actions");

  if (navActions && localStorage.getItem("codequest_token")) {
    navActions.innerHTML = `
      <a class="btn btn-ghost" href="dashboard.html">My dashboard</a>
      <button class="btn btn-primary" id="nav-logout" type="button">
        Log out
      </button>
    `;

    document.getElementById("nav-logout")
      ?.addEventListener("click", logout);
  }

  document.getElementById("logout-btn")
    ?.addEventListener("click", logout);

  try {
    if (page === "dashboard") await loadDashboard();
    if (page === "languages") await loadLanguages();
    if (page === "lessons") await loadLessons();
  } catch (error) {
    console.error("[CodeQuest] Page initialization failed:", error);

    const grid =
      document.getElementById("lesson-grid") ||
      document.getElementById("language-grid") ||
      document.getElementById("progress-list");

    if (grid) {
      showPageError(grid, error.message);
    }
  }
});

/* =========================================
   LOGOUT
========================================= */

function logout() {
  localStorage.removeItem("codequest_token");
  localStorage.removeItem("codequest_user");
  window.location.href = "index.html";
}

/* =========================================
   YOUTUBE PLAYLIST PANEL
========================================= */

function renderPlaylistPanel(playlist, languageName = "Programming") {
  const searchUrl =
    "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(
      languageName + " complete programming course playlist for beginners"
    );

  const playlistId = playlist?.playlistId || "";
  const playlistUrl = playlist?.playlistUrl || searchUrl;

  return `
    <section class="language-playlist">
      <div class="playlist-heading">
        <span class="playlist-icon">▶</span>

        <div>
          <strong>${escapeHtml(
            playlist?.title || languageName + " YouTube Playlist"
          )}</strong>

          <small>
            ${escapeHtml(playlist?.level || "Beginner")}
            · YouTube learning resources
          </small>
        </div>
      </div>

      ${
        playlistId
          ? `
            <div class="playlist-video">
              <iframe
                src="https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}"
                title="${escapeHtml(languageName)} YouTube playlist"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen>
              </iframe>
            </div>
          `
          : `
            <p class="playlist-description">
              Learn ${escapeHtml(languageName)} with video tutorials
              and programming lessons.
            </p>
          `
      }

      <a
        class="btn btn-ghost playlist-link"
        href="${escapeHtml(playlistUrl)}"
        target="_blank"
        rel="noopener noreferrer">
        ▶ ${
          playlistId
            ? "Open playlist on YouTube ↗"
            : "Find a complete playlist ↗"
        }
      </a>
    </section>
  `;
}

/* =========================================
   DASHBOARD
========================================= */

async function loadDashboard() {
  if (!requireLogin()) return;

  const user = currentUser();

  const studentName = document.getElementById("student-name");
  const studentClass = document.getElementById("student-class");
  const completedCount = document.getElementById("completed-count");
  const attemptCount = document.getElementById("attempt-count");
  const languageCount = document.getElementById("language-count");
  const progressList = document.getElementById("progress-list");

  if (studentName) {
    studentName.textContent = user?.name?.split(" ")[0] || "builder";
  }

  if (studentClass) {
    studentClass.textContent = `Class ${user?.classLevel || 11}`;
  }

  try {
    const [progressData, languageData] = await Promise.all([
      api("/progress/me"),
      api("/languages")
    ]);

    const progress = progressData.progress || [];

    if (completedCount) {
      completedCount.textContent =
        progress.filter(item => item.completed).length;
    }

    if (attemptCount) {
      attemptCount.textContent = progress.reduce(
        (sum, item) => sum + (item.attempts || 0),
        0
      );
    }

    if (languageCount) {
      languageCount.textContent =
        (languageData.languages || []).length;
    }

    const completed = progress.filter(item => item.completed);

    if (progressList) {
      progressList.innerHTML = completed.length
        ? completed.map(item => `
            <div class="progress-item">
              <span class="check-bubble">✓</span>

              <div>
                <b>${escapeHtml(
                  (item.lessonSlug || "").replaceAll("-", " ")
                )}</b>

                <small>
                  Completed ${
                    item.completedAt
                      ? escapeHtml(
                          new Date(item.completedAt).toLocaleDateString()
                        )
                      : ""
                  }
                </small>
              </div>

              <span class="tag">Complete</span>
            </div>
          `).join("")
        : `
            <p class="muted">
              Your completed lessons will appear here.
              Choose a lesson to get started.
            </p>
          `;
    }
  } catch (error) {
    console.error("[CodeQuest] Dashboard failed:", error);

    if (progressList) {
      showPageError(progressList, error.message);
    }
  }
}

/* =========================================
   LANGUAGES PAGE
========================================= */

async function loadLanguages() {
  const grid = document.getElementById("language-grid");
  const searchInput = document.getElementById("language-search");
  const categoryFilter = document.getElementById("category-filter");

  if (!grid || !searchInput || !categoryFilter) return;

  grid.innerHTML = `<p class="muted">Loading languages...</p>`;

  let languages = [];
  let playlistsBySlug = {};

  try {
    const [languageData, playlistData] = await Promise.all([
      api("/languages"),
      api("/playlists")
    ]);

    languages = languageData.languages || [];

    playlistsBySlug = Object.fromEntries(
      (playlistData.playlists || []).map(item => [
        item.languageSlug,
        item
      ])
    );

    if (!languages.length) {
      grid.innerHTML = `
        <p class="muted">
          No languages found yet. Run
          <code>npm.cmd run seed</code> in the backend folder.
        </p>
      `;
      return;
    }

    renderLanguages();
  } catch (error) {
    console.error("[CodeQuest] Languages failed:", error);
    showPageError(grid, error.message);
    return;
  }

  function renderLanguages() {
    const query = (searchInput.value || "").trim().toLowerCase();
    const category = categoryFilter.value;

    const filtered = languages.filter(item => {
      const searchableText = `
        ${item.name || ""}
        ${item.tagline || ""}
        ${(item.uses || []).join(" ")}
      `.toLowerCase();

      return searchableText.includes(query) &&
        (!category || item.category === category);
    });

    grid.innerHTML = filtered.length
      ? filtered.map((item, index) => {
          const playlist = playlistsBySlug[item.slug];

          const playlistPanel = renderPlaylistPanel(
            playlist,
            item.name || item.slug || "Programming"
          );

          return `
            <article class="language-card">
              <div class="language-card-top">
                <span class="language-symbol symbol-${index % 6}">
                  ${escapeHtml((item.name || "PL").slice(0, 2))}
                </span>

                <span class="difficulty">
                  ${escapeHtml(item.difficulty || "Beginner")}
                </span>
              </div>

              <span class="tag">
                ${escapeHtml(item.category || "Programming")}
              </span>

              <h2>${escapeHtml(item.name || "Programming")}</h2>

              <p class="language-tagline">
                ${escapeHtml(item.tagline || "")}
              </p>

              <p>${escapeHtml(item.description || "")}</p>

              <div class="chip-row">
                ${(item.uses || []).slice(0, 3).map(use => `
                  <span class="chip">${escapeHtml(use)}</span>
                `).join("")}
              </div>

              ${
                item.exampleCode
                  ? `
                    <details class="code-details">
                      <summary>View example code</summary>

                      <pre><code>${escapeHtml(item.exampleCode)}</code></pre>

                      ${
                        item.exampleOutput
                          ? `<small>Output: ${escapeHtml(item.exampleOutput)}</small>`
                          : ""
                      }
                    </details>
                  `
                  : ""
              }

              ${playlistPanel}
            </article>
          `;
        }).join("")
      : `
        <p class="muted">
          No matches. Try another search or category.
        </p>
      `;
  }

  searchInput.addEventListener("input", renderLanguages);
  categoryFilter.addEventListener("change", renderLanguages);
}

/* =========================================
   LESSONS PAGE
========================================= */

async function loadLessons() {
  const grid = document.getElementById("lesson-grid");

  if (!grid) return;

  grid.innerHTML = `<p class="muted">Loading lessons...</p>`;

  try {
    const [data, playlistData] = await Promise.all([
      api("/lessons"),
      api("/playlists")
    ]);

    const lessons = data.lessons || [];

    const playlistsBySlug = Object.fromEntries(
      (playlistData.playlists || []).map(playlist => [
        playlist.languageSlug,
        playlist
      ])
    );

    if (!lessons.length) {
      grid.innerHTML = `
        <p class="muted">
          No lessons yet. Run
          <code>npm.cmd run seed</code> in the backend folder.
        </p>
      `;
      return;
    }

    grid.innerHTML = lessons.map((lesson, index) => {
      const languageSlug = lesson.languageSlug || "";
      const languageName = languageSlug.replaceAll("-", " ");
      const playlist = playlistsBySlug[languageSlug];

      return `
        <article class="lesson-card">
          <div class="lesson-number">
            ${String(index + 1).padStart(2, "0")}
          </div>

          <div class="lesson-meta">
            <span class="tag">
              ${escapeHtml(languageName || "Programming")}
            </span>

            <span class="difficulty">
              ${escapeHtml(lesson.difficulty || "Beginner")}
            </span>
          </div>

          <h2>${escapeHtml(lesson.title || "Lesson")}</h2>

          <p>${escapeHtml(lesson.summary || "")}</p>

          <div class="lesson-bottom">
            <span>◷ ${Number(lesson.estimatedMinutes) || 10} min</span>

            <button
              class="btn btn-ghost lesson-open"
              type="button"
              data-slug="${escapeHtml(lesson.slug)}">
              Open lesson →
            </button>
          </div>

          ${renderPlaylistPanel(
            playlist,
            languageName || "Programming"
          )}

          <div
            class="lesson-content"
            id="lesson-${escapeHtml(lesson.slug)}"
            hidden>
          </div>
        </article>
      `;
    }).join("");

    grid.querySelectorAll(".lesson-open").forEach(button => {
      button.addEventListener("click", () => {
        openLesson(button.dataset.slug, button);
      });
    });
  } catch (error) {
    console.error("[CodeQuest] Lessons failed:", error);
    showPageError(grid, error.message);
  }
}

/* =========================================
   OPEN LESSON + SAVE PROGRESS
========================================= */

async function openLesson(slug, button) {
  const box = document.getElementById(`lesson-${slug}`);

  if (!box || !button) return;

  if (!box.hidden) {
    box.hidden = true;
    button.textContent = "Open lesson →";
    return;
  }

  button.disabled = true;
  button.textContent = "Loading...";

  try {
    const data = await api(
      `/lessons/${encodeURIComponent(slug)}`
    );

    const lesson = data.lesson;

    if (!lesson) {
      throw new Error("Lesson not found.");
    }

    const reading = document.createElement("div");
    reading.className = "lesson-reading";

    (lesson.content || []).forEach(part => {
      const heading = document.createElement("h3");
      heading.textContent = part.heading || "";

      const paragraph = document.createElement("p");
      paragraph.textContent = part.body || "";

      reading.append(heading, paragraph);
    });

    const completeButton = document.createElement("button");
    completeButton.type = "button";
    completeButton.className = "btn btn-primary mark-complete";
    completeButton.textContent = "✓ Mark as complete";

    const status = document.createElement("p");
    status.className = "form-message";

    reading.append(completeButton, status);
    box.replaceChildren(reading);
    box.hidden = false;

    button.textContent = "Close lesson ↑";

    completeButton.addEventListener("click", async () => {
      if (!localStorage.getItem("codequest_token")) {
        status.replaceChildren();

        const message = document.createTextNode(
          "Please log in to save your progress. "
        );

        const link = document.createElement("a");
        link.href = "login.html";
        link.textContent = "Log in";

        status.append(message, link);
        return;
      }

      completeButton.disabled = true;
      status.textContent = "Saving progress...";

      try {
        await api("/progress/complete", {
          method: "POST",
          body: JSON.stringify({
            lessonSlug: lesson.slug
          })
        });

        status.textContent =
          "Lesson completed! Your progress has been saved.";

        status.classList.add("success");
        completeButton.textContent = "✓ Completed";
      } catch (error) {
        console.error("[CodeQuest] Progress save failed:", error);

        status.textContent = error.message;
        completeButton.disabled = false;
      }
    });
  } catch (error) {
    console.error("[CodeQuest] Opening lesson failed:", error);

    box.replaceChildren();

    const message = document.createElement("p");
    message.className = "form-message error";
    message.textContent = error.message || "Unable to load this lesson.";

    box.appendChild(message);
    box.hidden = false;
    button.textContent = "Retry";
  } finally {
    button.disabled = false;
  }
}
