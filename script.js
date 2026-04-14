/* ========== 沉浸式作品集 — 前台脚本 ========== */
(function () {
  const DATA = window.ARTFOLIO_DATA || { works: [], profile: {}, contact: {} };

  const CATEGORY_MAP = {
    character: '角色设计', scene: '场景设计', ui: 'UI设计',
    concept: '概念设计', '3d': '3D建模', effect: '特效',
    oil: '油画', sketch: '素描', digital: '数字艺术', watercolor: '水彩'
  };

  const STYLE_MAP = {
    realistic: '写实', stylized: '风格化', cartoon: '卡通',
    pixel: '像素', lowpoly: 'Low Poly'
  };

  let currentPage = 'home';

  /* ===== 生成作品页面 ===== */
  function renderWorkPages() {
    const container = document.getElementById('workPages');
    if (!container) return;
    const works = DATA.works || [];
    if (works.length === 0) return;

    container.innerHTML = works.map((w, i) => {
      const tags = [];
      if (w.category && CATEGORY_MAP[w.category]) tags.push(CATEGORY_MAP[w.category]);
      if (w.artStyle && STYLE_MAP[w.artStyle]) tags.push(STYLE_MAP[w.artStyle]);
      if (w.software) w.software.split(',').forEach(s => tags.push(s.trim()));

      const pageId = 'work-' + i;
      // 移动端图片位置：支持 mobilePosition 字段（如 "center top", "left center"）
      const mobilePos = w.mobilePosition || '';
      const bgContain = w.mobileFit === 'contain' ? ' bg-contain' : '';
      return `
      <section class="page" id="${pageId}" data-page="${pageId}">
        <div class="page-bg${bgContain}" style="background-image:url('${w.image}');" data-mobile-pos="${mobilePos}"></div>
        <div class="page-overlay"></div>
        <div class="page-text page-text-work">
          ${w.story ? `<div class="work-text-columns">
            <div class="work-text-col"><p>${w.story}</p></div>
            <div class="work-text-col"><p>${w.desc || ''}</p></div>
          </div>` : (w.desc ? `<p class="page-desc">${w.desc}</p>` : '')}
          <div class="page-dots"><span class="page-dot"></span><span class="page-dot"></span></div>
          <h2 class="page-title-red">${w.title}</h2>
          ${w.titleCn ? `<p class="page-title-cn">${w.titleCn}</p>` : ''}
          ${tags.length ? '<div class="page-work-tags">' + tags.map(t => `<span class="page-work-tag">${t}</span>`).join('') + '</div>' : ''}
        </div>
      </section>`;
    }).join('');
  }

  /* ===== 生成左侧导航作品列表 ===== */
  function renderNavWorks() {
    const list = document.getElementById('navWorksList');
    if (!list) return;
    const works = DATA.works || [];

    list.innerHTML = works.map((w, i) => {
      return `<li><a href="#work-${i}" data-page="work-${i}">${w.title}</a></li>`;
    }).join('');
  }

  /* ===== 页面切换 ===== */
  function switchPage(pageId) {
    if (currentPage === pageId) return;

    // 隐藏当前页
    document.querySelectorAll('.page.page-active').forEach(p => {
      p.classList.remove('page-active');
    });

    // 显示目标页
    const target = document.getElementById(pageId);
    if (target) {
      target.classList.add('page-active');
      currentPage = pageId;
    }

    // 更新导航高亮
    document.querySelectorAll('.side-nav-works a, .side-nav-link').forEach(a => {
      a.classList.remove('active');
    });
    const activeLink = document.querySelector(`[data-page="${pageId}"]`);
    if (activeLink) activeLink.classList.add('active');

    // 更新页面指示器
    updatePageIndicator();

    // 移动端关闭菜单
    closeMobileMenu();
  }

  function bindNavigation() {
    // 作品列表点击
    document.addEventListener('click', e => {
      const link = e.target.closest('[data-page]');
      if (!link) return;
      e.preventDefault();
      const pageId = link.dataset.page;
      if (pageId) switchPage(pageId + '-page' === pageId ? pageId : (document.getElementById(pageId) ? pageId : pageId + '-page'));
    });

    // 修正：直接用 data-page 匹配 section id
    document.addEventListener('click', e => {
      const link = e.target.closest('.side-nav-works a, .side-nav-link');
      if (!link) return;
      e.preventDefault();
      const pageId = link.dataset.page;
      if (pageId && document.getElementById(pageId)) {
        switchPage(pageId);
      } else if (pageId && document.getElementById(pageId + '-page')) {
        switchPage(pageId + '-page');
      }
    });

    // 键盘导航（上下箭头切换作品）
    document.addEventListener('keydown', e => {
      const pages = getAllPageIds();
      const idx = pages.indexOf(currentPage);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (idx < pages.length - 1) switchPage(pages[idx + 1]);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (idx > 0) switchPage(pages[idx - 1]);
      }
    });

    // 鼠标滚轮切换
    let wheelTimeout = null;
    document.addEventListener('wheel', e => {
      if (wheelTimeout) return;
      wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 800);

      const pages = getAllPageIds();
      const idx = pages.indexOf(currentPage);
      if (e.deltaY > 0 && idx < pages.length - 1) {
        switchPage(pages[idx + 1]);
      } else if (e.deltaY < 0 && idx > 0) {
        switchPage(pages[idx - 1]);
      }
    }, { passive: true });

    // 触摸滑动翻页（移动端）
    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartTime = 0;
    document.addEventListener('touchstart', e => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', e => {
      const deltaY = touchStartY - e.changedTouches[0].clientY;
      const deltaX = touchStartX - e.changedTouches[0].clientX;
      const elapsed = Date.now() - touchStartTime;

      // 忽略太慢的滑动和水平滑动
      if (elapsed > 800 || Math.abs(deltaX) > Math.abs(deltaY)) return;
      // 最小滑动距离 50px
      if (Math.abs(deltaY) < 50) return;

      const pages = getAllPageIds();
      const idx = pages.indexOf(currentPage);
      if (deltaY > 0 && idx < pages.length - 1) {
        switchPage(pages[idx + 1]);
      } else if (deltaY < 0 && idx > 0) {
        switchPage(pages[idx - 1]);
      }
    }, { passive: true });
  }

  function getAllPageIds() {
    return Array.from(document.querySelectorAll('.page')).map(p => p.id);
  }

  /* ===== 渲染个人信息 ===== */
  function renderProfile() {
    const p = DATA.profile || {};

    const navName = document.getElementById('navName');
    if (navName && p.name) navName.textContent = p.name;

    const navNameCn = document.getElementById('navNameCn');
    if (navNameCn && p.nameCn) navNameCn.textContent = p.nameCn;

    const aboutAvatar = document.getElementById('aboutAvatar');
    if (aboutAvatar && p.avatar) aboutAvatar.src = p.avatar;

    const bio1 = document.getElementById('aboutBio1');
    if (bio1 && p.bio1) bio1.textContent = p.bio1;

    const bio2 = document.getElementById('aboutBio2');
    if (bio2 && p.bio2) bio2.textContent = p.bio2;
    if (bio2 && !p.bio2) bio2.style.display = 'none';

    const statW = document.getElementById('statWorks');
    if (statW) statW.textContent = p.statWorks || '0';
    const statP = document.getElementById('statProjects');
    if (statP) statP.textContent = p.statExhibitions || '0';
    const statY = document.getElementById('statYears');
    if (statY) statY.textContent = p.statYears || '0';
  }

  /* ===== 渲染联系方式 ===== */
  function renderContact() {
    const c = DATA.contact || {};

    const email = document.getElementById('contactEmail');
    if (email && c.email) { email.href = 'mailto:' + c.email; email.textContent = c.email; }

    const phone = document.getElementById('contactPhone');
    if (phone && c.phone) { phone.href = 'tel:' + c.phone; phone.textContent = c.phone; }

    const addr = document.getElementById('contactAddress');
    if (addr && c.address) addr.textContent = c.address;

    // 关于页社交链接
    const social = document.getElementById('aboutSocial');
    if (social) {
      const links = [];
      if (c.artstation) links.push(`<a href="${c.artstation}" target="_blank">ArtStation</a>`);
      if (c.behance) links.push(`<a href="${c.behance}" target="_blank">Behance</a>`);
      if (c.bilibili) links.push(`<a href="${c.bilibili}" target="_blank">B站</a>`);
      if (c.weibo) links.push(`<a href="${c.weibo}" target="_blank">微博</a>`);
      social.innerHTML = links.join('');
    }
  }

  /* ===== 移动端菜单 ===== */
  function bindMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('sideNav');
    const overlay = document.getElementById('mobileOverlay');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
      nav.classList.toggle('open');
      btn.classList.toggle('active');
      if (overlay) overlay.classList.toggle('active', nav.classList.contains('open'));
    });

    if (overlay) {
      overlay.addEventListener('click', closeMobileMenu);
    }
  }

  function closeMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('sideNav');
    const overlay = document.getElementById('mobileOverlay');
    if (nav) nav.classList.remove('open');
    if (btn) btn.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  }

  /* ===== 页面指示器（移动端右侧小圆点） ===== */
  function renderPageIndicator() {
    const pages = getAllPageIds();
    if (pages.length === 0) return;

    const indicator = document.createElement('div');
    indicator.className = 'page-indicator';
    indicator.id = 'pageIndicator';
    indicator.innerHTML = pages.map((id, i) =>
      `<span class="page-indicator-dot${i === 0 ? ' active' : ''}" data-target="${id}"></span>`
    ).join('');
    document.body.appendChild(indicator);

    indicator.addEventListener('click', e => {
      const dot = e.target.closest('.page-indicator-dot');
      if (dot) switchPage(dot.dataset.target);
    });
  }

  function updatePageIndicator() {
    document.querySelectorAll('.page-indicator-dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.target === currentPage);
    });
  }

  /* ===== 移动端图片位置适配 ===== */
  function applyMobileImagePositions() {
    if (window.innerWidth > 900) return;
    document.querySelectorAll('.page-bg[data-mobile-pos]').forEach(bg => {
      const pos = bg.dataset.mobilePos;
      if (pos) bg.style.backgroundPosition = pos;
    });
  }

  /* ===== 初始化 ===== */
  function init() {
    renderWorkPages();
    renderNavWorks();
    renderProfile();
    renderContact();
    bindNavigation();
    renderPageIndicator();
    bindMobileMenu();
    applyMobileImagePositions();
    window.addEventListener('resize', applyMobileImagePositions);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
