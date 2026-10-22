document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#login-form, #signup-form');
  if (!form) return;
  const isSignup = form.id === 'signup-form';
  const message = document.getElementById('form-message');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = isSignup ? 'Creating account…' : 'Logging in…';
    message.textContent = '';
    message.className = 'form-message';
    const fields = Object.fromEntries(new FormData(form).entries());
    if (isSignup) fields.classLevel = Number(fields.classLevel);
    try {
      const result = await api(isSignup ? '/auth/signup' : '/auth/login', {
        method: 'POST', body: JSON.stringify(fields)
      });
      localStorage.setItem('codequest_token', result.token);
      localStorage.setItem('codequest_user', JSON.stringify(result.user));
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get('next') || 'dashboard.html';
    } catch (error) {
      message.textContent = error.message;
      message.classList.add('error');
      button.disabled = false;
      button.innerHTML = isSignup ? 'Create account <span>→</span>' : 'Log in <span>→</span>';
    }
  });
});
