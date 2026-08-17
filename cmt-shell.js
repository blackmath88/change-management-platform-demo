(function() {
  'use strict';

  // Command Center is the only OVERVIEW item; the five units are the WORKSPACE.
  // Each WORKSPACE entry has a numeric prefix (01–05) and a progress dot keyed
  // off the underlying module name (filled when that module has any saved data).
  const OVERVIEW_ITEM = {
    href: 'index.html', icon: '▦', label: 'Command Center',
  };
  const WORKSPACE_ITEMS = [
    { href: 'unit1-vision.html',        num: '01', label: 'Vision',       module: 'vision' },
    { href: 'unit2-forces.html',        num: '02', label: 'Forces',       module: 'forces' },
    { href: 'unit3-stakeholders.html',  num: '03', label: 'Stakeholders', module: 'stakeholders' },
    { href: 'unit4-communication.html', num: '04', label: 'Messaging',    module: 'communication' },
    { href: 'unit5-nudges.html',        num: '05', label: 'Nudges',       module: 'nudges' },
    { href: 'unit6-coordinate.html',   num: '06', label: 'Coordinate',   module: 'coordinate' },
  ];

  function renderSidebar(activeHref) {
    const overviewActive = OVERVIEW_ITEM.href === activeHref;
    const overviewHtml =
      `<a class="nav-item${overviewActive ? ' is-active' : ''}" href="${OVERVIEW_ITEM.href}">`
      + `<span class="nav-icon">${OVERVIEW_ITEM.icon}</span>`
      + `<span>${OVERVIEW_ITEM.label}</span>`
      + `</a>`;

    const workspaceHtml = WORKSPACE_ITEMS.map(item => {
      const isActive = item.href === activeHref;
      return `<a class="nav-item${isActive ? ' is-active' : ''}" href="${item.href}" data-module="${item.module}">`
        + `<span class="nav-num">${item.num}</span>`
        + `<span>${item.label}</span>`
        + `<span class="nav-progress-dot" data-dot="${item.module}"></span>`
        + `</a>`;
    }).join('');

    return `
      <aside class="sidebar" aria-label="Product navigation">
        <div class="brand">
          <a class="brand-lockup" href="index.html">
            <div class="brand-mark">CM</div>
            <div>
              <div class="brand-title">Change Management Platform</div>
              <div class="brand-subtitle">Operating workspace</div>
            </div>
          </a>
        </div>
        <div class="side-section">
          <div class="side-title meta-label">Overview</div>
          <nav class="nav-list">${overviewHtml}</nav>
        </div>
        <div class="side-section">
          <div class="side-title meta-label">Workspace</div>
          <nav class="nav-list">${workspaceHtml}</nav>
        </div>
        <div class="sidebar-footer">
          <div class="workspace-chip">
            <div class="meta-label">Active project</div>
            <div class="workspace-chip-title" id="topbar-project"></div>
            <div class="workspace-chip-sub" id="topbar-org"></div>
          </div>
        </div>
      </aside>
    `;
  }

  function mountSidebar() {
    const mount = document.getElementById('sidebar-mount');
    if (!mount) return;
    const activeHref = mount.getAttribute('data-active') || '';
    mount.outerHTML = renderSidebar(activeHref);
    refreshDots();
  }

  // Sets the filled/empty state on each progress dot based on the touched
  // modules for the current project. Safe to call before the sidebar mounts —
  // it just no-ops until the dots exist in the DOM.
  async function refreshDots(projectId) {
    const dots = document.querySelectorAll('.nav-progress-dot');
    if (!dots.length) return;
    const id = projectId
      || (window.CMT && CMT.getCurrentProjectId && CMT.getCurrentProjectId())
      || localStorage.getItem('cmt_current_project');
    if (!id || !window.CMT || !CMT.getTouchedModules) {
      dots.forEach(el => el.classList.remove('filled'));
      return;
    }
    let touched = [];
    try { touched = await CMT.getTouchedModules(id); } catch(e) {}
    dots.forEach(el => {
      const m = el.getAttribute('data-dot');
      el.classList.toggle('filled', !!(m && touched.includes(m)));
    });
  }

  window.CMTShell = { mountSidebar, renderSidebar, refreshDots };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountSidebar);
  } else {
    mountSidebar();
  }
})();
