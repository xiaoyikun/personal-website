/**
 * 美术作品集网站 - 交互逻辑
 * 功能：从后台数据动态渲染、主题切换、移动端菜单、作品分类筛选、灯箱查看、表单处理
 */

(function () {
  'use strict';

  // ========== DOM 缓存 ==========
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const themeToggle = $('#themeToggle');
  const hamburger = $('#hamburger');
  const navLinks = $('#navLinks');
  const galleryGrid = $('#galleryGrid');
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxTitle = $('#lightboxTitle');
  const lightboxDesc = $('#lightboxDesc');
  const lightboxClose = $('#lightboxClose');
  const lightboxPrev = $('#lightboxPrev');
  const lightboxNext = $('#lightboxNext');
  const contactForm = $('#contactForm');

  let currentLightboxIndex = 0;
  let visibleItems = [];

  // ========== 数据读取 ==========
  function getData(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  }

  // ========== 动态渲染后台数据 ==========
  function renderFromAdmin() {
    // —— 作品画廊 ——
    const works = getData('artfolio_works');
    if (works && works.length > 0) {
      galleryGrid.innerHTML = works.map(w => `
        <div class="gallery-item" data-category="${w.category}">
          <img src="${w.image}" alt="${w.title}" loading="lazy">
          <div class="gallery-overlay">
            <h3>${w.title}</h3>
            <p>${w.desc}</p>
          </div>
        </div>
      `).join('');
    }
    // 否则保留 HTML 中的默认占位作品

    // —— 个人信息 ——
    const profile = getData('artfolio_profile');
    if (profile) {
      const aboutText = $('.about-text');
      if (aboutText) {
        const paragraphs = aboutText.querySelectorAll('p');
        if (profile.bio1 && paragraphs[0]) paragraphs[0].textContent = profile.bio1;
        if (profile.bio2 && paragraphs[1]) paragraphs[1].textContent = profile.bio2;

        const statNums = aboutText.querySelectorAll('.stat-num');
        const statLabels = aboutText.querySelectorAll('.stat-label');
        if (profile.statWorks && statNums[0]) statNums[0].textContent = profile.statWorks;
        if (profile.statExhibitions && statNums[1]) statNums[1].textContent = profile.statExhibitions;
        if (profile.statYears && statNums[2]) statNums[2].textContent = profile.statYears;
      }
      const aboutImg = $('.about-image img');
      if (profile.avatar && aboutImg) aboutImg.src = profile.avatar;
    }

    // —— 联系方式 ——
    const contact = getData('artfolio_contact');
    if (contact) {
      const infoItems = $$('.contact-info .info-item');
      if (contact.email && infoItems[0]) {
        const a = infoItems[0].querySelector('a');
        if (a) { a.textContent = contact.email; a.href = 'mailto:' + contact.email; }
      }
      if (contact.phone && infoItems[1]) {
        const a = infoItems[1].querySelector('a');
        if (a) { a.textContent = contact.phone; a.href = 'tel:' + contact.phone.replace(/-/g, ''); }
      }
      if (contact.address && infoItems[2]) {
        const p = infoItems[2].querySelector('p');
        if (p) p.textContent = contact.address;
      }

      // 社交链接
      const socialLinks = $$('.social-links .social-icon');
      const urls = [contact.weibo, contact.instagram, contact.behance, contact.artstation];
      socialLinks.forEach((link, i) => {
        if (urls[i]) link.href = urls[i];
      });
    }
  }

  renderFromAdmin();

  // ========== 主题切换 ==========
  function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  initTheme();
  themeToggle.addEventListener('click', toggleTheme);

  // ========== 移动端菜单 ==========
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // ========== 作品分类筛选 ==========
  function bindGalleryEvents() {
    const filterBtns = $$('.filter-btn');
    const items = $$('.gallery-item');

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        items.forEach((item) => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });
        updateVisibleItems();
      });
    });

    // 点击作品打开灯箱
    items.forEach((item) => {
      item.addEventListener('click', () => {
        const index = visibleItems.indexOf(item);
        if (index !== -1) openLightbox(index);
      });
    });

    updateVisibleItems();
  }

  function updateVisibleItems() {
    visibleItems = Array.from($$('.gallery-item')).filter(
      (item) => !item.classList.contains('hidden')
    );
  }

  bindGalleryEvents();

  // ========== 灯箱功能 ==========
  function openLightbox(index) {
    currentLightboxIndex = index;
    const item = visibleItems[index];
    if (!item) return;

    const img = item.querySelector('img');
    const overlay = item.querySelector('.gallery-overlay');
    const title = overlay ? overlay.querySelector('h3').textContent : '';
    const desc = overlay ? overlay.querySelector('p').textContent : '';

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxTitle.textContent = title;
    lightboxDesc.textContent = desc;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function prevImage() {
    currentLightboxIndex =
      (currentLightboxIndex - 1 + visibleItems.length) % visibleItems.length;
    openLightbox(currentLightboxIndex);
  }

  function nextImage() {
    currentLightboxIndex =
      (currentLightboxIndex + 1) % visibleItems.length;
    openLightbox(currentLightboxIndex);
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', prevImage);
  lightboxNext.addEventListener('click', nextImage);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
  });

  // ========== 联系表单 ==========
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    alert(`感谢 ${name}！您的消息已收到，我会尽快回复。`);
    contactForm.reset();
  });

  // ========== 导航栏滚动效果 ==========
  const navbar = $('#navbar');
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 100) {
      navbar.style.boxShadow = '0 2px 20px var(--shadow)';
    } else {
      navbar.style.boxShadow = 'none';
    }
  }, { passive: true });

  // ========== 图片错误处理 ==========
  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', function () {
      this.style.background = 'linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%)';
      this.style.minHeight = '200px';
      this.removeAttribute('src');
    });
  });
})();
