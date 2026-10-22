document.addEventListener('DOMContentLoaded', async () => {
  const page = document.body.dataset.page;
  const user = currentUser();
  const navActions = document.getElementById('nav-actions');
  if (navActions && localStorage.getItem('codequest_token')) {
    navActions.innerHTML = `<a class="btn btn-ghost" href="dashboard.html">My dashboard</a><button class="btn btn-primary" id="nav-logout">Log out</button>`;
    document.getElementById('nav-logout')?.addEventListener('click', logout);
  }
  document.getElementById('logout-btn')?.addEventListener('click', logout);
  if (page === 'dashboard') await loadDashboard();
  if (page === 'languages') await loadLanguages();
  if (page === 'lessons') await loadLessons();
});
function logout() {
  localStorage.removeItem('codequest_token');
  localStorage.removeItem('codequest_user');
  window.location.href = 'index.html';
}
async function loadDashboard() {
  if (!requireLogin()) return;
  const user = currentUser();
  document.getElementById('student-name').textContent = user?.name?.split(' ')[0] || 'builder';
  document.getElementById('student-class').textContent = `Class ${user?.classLevel || 11}`;
  try {
    const [progressData, languageData] = await Promise.all([api('/progress/me'), api('/languages')]);
    const progress = progressData.progress || [];
    document.getElementById('completed-count').textContent = progress.filter(item => item.completed).length;
    document.getElementById('attempt-count').textContent = progress.reduce((sum, item) => sum + (item.attempts || 0), 0);
    document.getElementById('language-count').textContent = (languageData.languages || []).length;
    const completed = progress.filter(item => item.completed);
    document.getElementById('progress-list').innerHTML = completed.length
      ? completed.map(item => `<div class="progress-item"><span class="check-bubble">✓</span><div><b>${escapeHtml(item.lessonSlug.replaceAll('-', ' '))}</b><small>Completed ${item.completedAt ? new Date(item.completedAt).toLocaleDateString() : ''}</small></div><span class="tag">Complete</span></div>`).join('')
      : '<p class="muted">Your completed lessons will appear here. Choose a lesson to get started.</p>';
  } catch (error) {
    document.getElementById('progress-list').innerHTML = `<p class="form-message error">${escapeHtml(error.message)}</p>`;
  }
}
async function loadLanguages() {
  const grid = document.getElementById('language-grid');
  const message = document.getElementById('page-message');
  let languages = [];
  try {
    const data = await api('/languages');
    languages = data.languages || [];
    if (!languages.length) grid.innerHTML = '<p class="muted">No languages found yet. Run <code>npm run seed</code> in the backend folder.</p>';
    renderLanguages();
  } catch (error) { grid.innerHTML = `<p class="form-message error">${escapeHtml(error.message)}</p>`; }
  function renderLanguages() {
    const query = (document.getElementById('language-search').value || '').toLowerCase();
    const category = document.getElementById('category-filter').value;
    const filtered = languages.filter(item => `${item.name} ${item.tagline} ${(item.uses || []).join(' ')}`.toLowerCase().includes(query) && (!category || item.category === category));
    grid.innerHTML = filtered.length ? filtered.map((item, index) => `<article class="language-card"><div class="language-card-top"><span class="language-symbol symbol-${index % 6}">${escapeHtml(item.name.slice(0, 2))}</span><span class="difficulty">${escapeHtml(item.difficulty || 'Beginner')}</span></div><span class="tag">${escapeHtml(item.category)}</span><h2>${escapeHtml(item.name)}</h2><p class="language-tagline">${escapeHtml(item.tagline)}</p><p>${escapeHtml(item.description || '')}</p><div class="chip-row">${(item.uses || []).slice(0, 3).map(use => `<span class="chip">${escapeHtml(use)}</span>`).join('')}</div>${item.exampleCode ? `<details class="code-details"><summary>View example code</summary><pre><code>${escapeHtml(item.exampleCode)}</code></pre>${item.exampleOutput ? `<small>Output: ${escapeHtml(item.exampleOutput)}</small>` : ''}</details>` : ''}</article>`).join('') : '<p class="muted">No matches. Try another search or category.</p>';
  }
  document.getElementById('language-search').addEventListener('input', renderLanguages);
  document.getElementById('category-filter').addEventListener('change', renderLanguages);
}
async function loadLessons() {
  const grid = document.getElementById('lesson-grid');
  try {
    const data = await api('/lessons');
    const lessons = data.lessons || [];
    grid.innerHTML = lessons.length ? lessons.map((lesson, index) => `<article class="lesson-card"><div class="lesson-number">${String(index + 1).padStart(2, '0')}</div><div class="lesson-meta"><span class="tag">${escapeHtml(lesson.languageSlug)}</span><span class="difficulty">${escapeHtml(lesson.difficulty || 'Beginner')}</span></div><h2>${escapeHtml(lesson.title)}</h2><p>${escapeHtml(lesson.summary)}</p><div class="lesson-bottom"><span>◷ ${lesson.estimatedMinutes || 10} min</span><button class="btn btn-ghost lesson-open" data-slug="${escapeHtml(lesson.slug)}">Open lesson →</button></div><div class="lesson-content" id="lesson-${escapeHtml(lesson.slug)}" hidden></div></article>`).join('') : '<p class="muted">No lessons yet. Run <code>npm run seed</code> in the backend folder.</p>';
    grid.querySelectorAll('.lesson-open').forEach(button => button.addEventListener('click', () => openLesson(button.dataset.slug, button)));
  } catch (error) { grid.innerHTML = `<p class="form-message error">${escapeHtml(error.message)}</p>`; }
}
async function openLesson(slug, button) {
  const box = document.getElementById(`lesson-${slug}`);
  if (!box.hidden) { box.hidden = true; button.textContent = 'Open lesson →'; return; }
  button.disabled = true; button.textContent = 'Loading…';
  try {
    const data = await api(`/lessons/${encodeURIComponent(slug)}`);
    const lesson = data.lesson;
    box.innerHTML = `<div class="lesson-reading">${(lesson.content || []).map(part => `<h3>${escapeHtml(part.heading || '')}</h3><p>${escapeHtml(part.body || '')}</p>`).join('')}<button class="btn btn-primary mark-complete" data-slug="${escapeHtml(lesson.slug)}">✓ Mark as complete</button><p class="form-message" id="lesson-message-${escapeHtml(lesson.slug)}"></p></div>`;
    box.hidden = false; button.textContent = 'Close lesson ↑';
    box.querySelector('.mark-complete').addEventListener('click', async event => {
      const status = box.querySelector('.form-message');
      if (!localStorage.getItem('codequest_token')) { status.innerHTML = 'Please <a href="login.html">log in</a> to save your progress.'; return; }
      event.target.disabled = true;
      try { await api('/progress/complete', { method: 'POST', body: JSON.stringify({ lessonSlug: lesson.slug }) }); status.textContent = 'Lesson completed! Your progress has been saved.'; status.classList.add('success'); event.target.textContent = '✓ Completed'; }
      catch (error) { status.textContent = error.message; event.target.disabled = false; }
    });
  } catch (error) { box.hidden = false; box.innerHTML = `<p class="form-message error">${escapeHtml(error.message)}</p>`; button.textContent = 'Retry'; }
  finally { button.disabled = false; }
}
