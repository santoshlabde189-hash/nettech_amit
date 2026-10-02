/**
 * Route protection guard for frontend pages
 */
async function checkAuth(requiredRole = null) {
  try {
    const res = await api.get('/auth/me');
    const user = res.data.user;
    api.setUser(user);

    // Check Role access
    if (requiredRole && user.role !== requiredRole) {
      if (user.role === 'admin') {
        window.location.href = '/admin/dashboard.html';
      } else {
        window.location.href = '/user/dashboard.html';
      }
      return null;
    }

    // Populate user info in navbars if elements exist
    const userNameEls = document.querySelectorAll('.nav-user-name');
    const userRoleEls = document.querySelectorAll('.nav-user-role');
    const userAvatarEls = document.querySelectorAll('.nav-user-avatar');

    userNameEls.forEach(el => { el.textContent = user.name; });
    userRoleEls.forEach(el => { el.textContent = user.role.toUpperCase(); });
    userAvatarEls.forEach(el => {
      if (user.profilePicture) {
        el.src = user.profilePicture;
      } else {
        el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`;
      }
    });

    return user;
  } catch (err) {
    console.warn('Auth check failed:', err.message);
    window.location.href = '/index.html?unauth=1';
    return null;
  }
}

// Global logout handler
async function handleLogout() {
  try {
    await api.post('/auth/logout', {});
  } catch (e) {
    // Ignore error and proceed to clear
  }
  api.clearToken();
  window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtns = document.querySelectorAll('.btn-logout');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  });

  // Universal mobile sidebar toggle & overlay
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (mobileToggle && sidebar) {
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(3px);z-index:1035;display:none;opacity:0;transition:opacity 0.25s ease;';
      document.body.appendChild(overlay);
    }

    const openSidebar = () => {
      sidebar.classList.add('show');
      overlay.style.display = 'block';
      setTimeout(() => overlay.style.opacity = '1', 10);
    };

    const closeSidebar = () => {
      sidebar.classList.remove('show');
      overlay.style.opacity = '0';
      setTimeout(() => overlay.style.display = 'none', 250);
    };

    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sidebar.classList.contains('show')) closeSidebar();
      else openSidebar();
    });

    overlay.addEventListener('click', closeSidebar);
  }
});
