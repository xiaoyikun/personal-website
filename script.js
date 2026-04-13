/* ========== ArtFolio 前台渲染脚本 ========== */
(function () {
  const DATA = window.ARTFOLIO_DATA || { works: [], profile: {}, contact: {} };
  const CATEGORY_MAP = { oil: '油画', sketch: '素描', digital: '数字艺术', watercolor: '水彩' };

  /* ===== 作品画廊渲染 ===== */
  function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    const works = DATA.works || [];
    if (works.length === 0) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary,#888);padding:40px 0;">暂无作品</p>';
      return;
    }
    grid.innerHTML = works.map(w => `
      <div class="gallery-item" data-category="${w.category}">
        <img src="${w.image}" alt="${w.title}" loading="lazy"
             onerror="this.style.background='linear-gradient(135deg,#ddd,#bbb)';this.src='';">
        <div class="gallery-overlay">
          <h3>${w.title}</h3>
          <p>${w.desc || ''}</p>
        </div>
      </div>
    `).join('');
    bindLightbox();
  }

  /* ===== 个人信息渲染 ===== */
  function renderProfile() {
    const p = DATA.profile || {};
    // 头像
    const avatarImg = document.querySelector('.about-image img');
    if (avatarImg && p.avatar) avatarImg.src = p.avatar;
    // 简介文字
    const aboutText = document.querySelector('.about-text');
    if (aboutText) {
      const paragraphs = aboutText.querySelectorAll('p');
      if (paragraphs[0] && p.bio1) paragraphs[0].textContent = p.bio1;
      if (paragraphs[1] && p.bio2) paragraphs[1].textContent = p.bio2;
      // 如果 bio2 为空则隐藏第二段
      if (paragraphs[1] && !p.bio2) paragraphs[1].style.display = 'none';
    }
    // 统计数字
    const stats = document.querySelectorAll('.about-stats .stat');
    if (stats[0]) stats[0].querySelector('.stat-num').textContent = p.statWorks || '0';
    if (stats[1]) stats[1].querySelector('.stat-num').textContent = p.statExhibitions || '0';
    if (stats[2]) stats[2].querySelector('.stat-num').textContent = p.statYears || '0';
    // 页面标题中的名字
    if (p.name) {
      const heroTitle = document.querySelector('.hero-title');
      // 不覆盖 hero 标题，保持原样
    }
  }

  /* ===== 联系方式渲染 ===== */
  function renderContact() {
    const c = DATA.contact || {};
    const infoItems = document.querySelectorAll('.contact-info .info-item');
    // 邮箱
    if (infoItems[0] && c.email) {
      const a = infoItems[0].querySelector('a');
      if (a) { a.href = 'mailto:' + c.email; a.textContent = c.email; }
    }
    // 电话
    if (infoItems[1] && c.phone) {
      const a = infoItems[1].querySelector('a');
      if (a) { a.href = 'tel:' + c.phone; a.textContent = c.phone; }
    }
    // 地址
    if (infoItems[2] && c.address) {
      const p = infoItems[2].querySelector('p');
      if (p) p.textContent = c.address;
    }
    // 社交链接
    const socialLinks = document.querySelectorAll('.social-links .social-icon');
    const socialMap = [c.weibo, c.instagram, c.behance, c.artstation];
    socialLinks.forEach((link, i) => {
      if (socialMap[i]) {
        link.href = socialMap[i];
        link.target = '_blank';
        link.style.display = '';
      } else {
        link.style.display = 'none';
      }
    });
  }

  /* ===== 灯箱 ===== */
  function bindLightbox() {
    const items = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightboxImg');
    const lbTitle = document.getElementById('lightboxTitle');
    const lbDesc = document.getElementById('lightboxDesc');
    let currentIdx = 0;
    const visibleItems = () => Array.from(document.querySelectorAll('.gallery-item')).filter(
      el => el.style.display !== 'none'
    );

    items.forEach(item => {
      item.addEventListener('click', () => {
        const vis = visibleItems();
        currentIdx = vis.indexOf(item);
        const img = item.querySelector('img');
        const overlay = item.querySelector('.gallery-overlay');
        lbImg.src = img.src;
        lbTitle.textContent = overlay.querySelector('h3').textContent;
        lbDesc.textContent = overlay.querySelector('p').textContent;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

    document.getElementById('lightboxPrev').addEventListener('click', () => {
      const vis = visibleItems();
      currentIdx = (currentIdx - 1 + vis.length) % vis.length;
      showLightboxItem(vis[currentIdx]);
    });
    document.getElementById('lightboxNext').addEventListener('click', () => {
      const vis = visibleItems();
      currentIdx = (currentIdx + 1) % vis.length;
      showLightboxItem(vis[currentIdx]);
    });

    function showLightboxItem(item) {
      const img = item.querySelector('img');
      const overlay = item.querySelector('.gallery-overlay');
      lbImg.src = img.src;
      lbTitle.textContent = overlay.querySelector('h3').textContent;
      lbDesc.textContent = overlay.querySelector('p').textContent;
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }

    // 键盘导航
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev').click();
      if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
    });
  }

  /* ===== 筛选 ===== */
  function bindFilter() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.gallery-item').forEach(item => {
          item.style.display = (filter === 'all' || item.dataset.category === filter) ? '' : 'none';
        });
      });
    });
  }

  /* ===== 主题切换 ===== */
  function bindTheme() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    const saved = localStorage.getItem('artfolio_theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('artfolio_theme', next);
    });
  }

  /* ===== 导航栏 ===== */
  function bindNav() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
      });
      navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          navLinks.classList.remove('active');
          hamburger.classList.remove('active');
        });
      });
    }
    // 滚动时导航栏样式
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  /* ===== 联系表单 ===== */
  function bindContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      alert('感谢您的留言！我会尽快回复。');
      form.reset();
    });
  }

  /* ===== 初始化 ===== */
  function init() {
    renderGallery();
    renderProfile();
    renderContact();
    bindFilter();
    bindTheme();
    bindNav();
    bindContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
