/**
 * AI Roadmap Generator — Dashboard Script
 * Handles navigation, generation, rendering, history, analytics
 */

// ===== STATE =====
let currentRoadmap = null;
let currentInput = null;
let loaderInterval = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initCircuitLines();
  initCharCounter();
  loadInitialData();
  setUserAvatar();

  // Enter shortcut
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generateRoadmap();
  });
});

// ===== CIRCUIT LINES BACKGROUND =====
function initCircuitLines() {
  const container = document.getElementById('circuitLines');
  if (!container) return;
  const lines = [
    { top: '20%', left: '0', width: '200px', height: '2px' },
    { top: '40%', right: '0', width: '150px', height: '2px' },
    { top: '0', left: '30%', width: '2px', height: '150px' },
    { top: '0', right: '20%', width: '2px', height: '200px' },
    { top: '60%', left: '10%', width: '100px', height: '2px' },
    { bottom: '30%', right: '15%', width: '2px', height: '120px' },
  ];
  lines.forEach((style, i) => {
    const line = document.createElement('div');
    line.className = 'circuit-line';
    Object.assign(line.style, { animationDelay: `${i * 0.8}s`, ...style });
    container.appendChild(line);
  });
}

// ===== USER AVATAR =====
function setUserAvatar() {
  const name = document.getElementById('sidebarUsername')?.textContent || 'U';
  const avatar = document.getElementById('userAvatar');
  if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
}

// ===== CHAR COUNTER =====
function initCharCounter() {
  const ta = document.getElementById('goalInput');
  const cc = document.getElementById('charCount');
  if (!ta || !cc) return;
  ta.addEventListener('input', () => {
    const len = ta.value.length;
    cc.textContent = `${len}/300`;
    cc.style.color = len > 270 ? '#ef4444' : len > 240 ? '#f59e0b' : '';
  });
}

// ===== NAVIGATION =====
function showView(viewId) {
  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  // Show target
  const target = document.getElementById(`view-${viewId}`);
  if (target) target.classList.add('active');

  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('onclick')?.includes(viewId)) n.classList.add('active');
  });

  // Update breadcrumb
  const labels = {
    'generator': 'Generator',
    'roadmap-view': 'Current Roadmap',
    'tips-view': 'Tips & Strategy',
    'history': 'History',
    'stats': 'Analytics'
  };
  const bc = document.getElementById('breadcrumbCurrent');
  if (bc) bc.textContent = labels[viewId] || viewId;

  // Load view-specific data
  if (viewId === 'history') loadHistory();
  if (viewId === 'stats') loadStats();
  if (viewId === 'roadmap-view') renderFullRoadmap();
  if (viewId === 'tips-view') renderTipsView();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 900) {
    sidebar.classList.toggle('mobile-open');
  } else {
    sidebar.classList.toggle('collapsed');
  }
}

// ===== LOAD INITIAL DATA =====
async function loadInitialData() {
  try {
    const res = await fetch('/stats');
    const data = await res.json();
    const count = data.total_roadmaps || 0;
    document.getElementById('topbarRoadmaps').textContent = count;
    document.getElementById('historyCount').textContent = count;
  } catch (e) {}
}

// ===== LOADER =====
function startLoader() {
  document.getElementById('loaderCard').style.display = 'block';
  document.getElementById('errorCard').style.display = 'none';
  document.getElementById('overviewBar').style.display = 'none';
  document.getElementById('cardsGrid').style.display = 'none';
  document.getElementById('motiveBanner').style.display = 'none';

  const steps = ['ls1', 'ls2', 'ls3', 'ls4'];
  let cur = 0;
  const fill = document.getElementById('loaderFill');
  fill.style.width = '0%';

  steps.forEach(id => {
    const el = document.getElementById(id);
    el.className = 'lstep';
    el.querySelector('i').className = 'fas fa-circle';
  });

  loaderInterval = setInterval(() => {
    if (cur < steps.length) {
      if (cur > 0) {
        const prev = document.getElementById(steps[cur - 1]);
        prev.className = 'lstep done';
        prev.querySelector('i').className = 'fas fa-check-circle';
      }
      const curr = document.getElementById(steps[cur]);
      curr.className = 'lstep active';
      fill.style.width = `${((cur + 1) / steps.length) * 90}%`;
      cur++;
    }
  }, 1200);
}

function stopLoader() {
  clearInterval(loaderInterval);
  document.getElementById('loaderFill').style.width = '100%';
  setTimeout(() => {
    document.getElementById('loaderCard').style.display = 'none';
  }, 500);
}

// ===== ERROR =====
function showError(msg) {
  document.getElementById('errorText').textContent = msg;
  document.getElementById('errorCard').style.display = 'block';
}
function hideError() {
  document.getElementById('errorCard').style.display = 'none';
}

// ===== GENERATE ROADMAP =====
async function generateRoadmap() {
  const goal = document.getElementById('goalInput')?.value.trim() || '';
  const time = document.getElementById('timeInput')?.value.trim() || '';
  const level = document.getElementById('levelSelect')?.value || '';
  const notes = document.getElementById('notesInput')?.value.trim() || '';

  if (!goal) { flashInput('goalInput', 'Please enter your learning goal'); return; }
  if (!time) { flashInput('timeInput', 'Please enter your available time'); return; }

  const btn = document.getElementById('genBtn');
  btn.disabled = true;
  startLoader();

  try {
    const res = await fetch('/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, time_available: time, current_level: level, extra_notes: notes })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Generation failed');

    stopLoader();
    currentRoadmap = data.roadmap;
    currentInput = data.input;

    renderOverview(data.roadmap);
    renderCardsGrid(data.roadmap);
    renderMotivation(data.roadmap);

    // Enable roadmap nav items
    document.getElementById('roadmapNavItem').style.opacity = '1';
    document.getElementById('roadmapNavItem').style.pointerEvents = 'auto';
    document.getElementById('tipsNavItem').style.opacity = '1';
    document.getElementById('tipsNavItem').style.pointerEvents = 'auto';

    // Update counts
    loadInitialData();

    // Scroll to overview
    document.getElementById('overviewBar')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (err) {
    stopLoader();
    showError(err.message || 'Something went wrong. Please try again.');
  } finally {
    btn.disabled = false;
  }
}

function flashInput(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  const orig = el.placeholder;
  el.style.borderColor = '#ef4444';
  el.placeholder = msg;
  el.focus();
  setTimeout(() => { el.style.borderColor = ''; el.placeholder = orig; }, 2000);
}

// ===== RENDER OVERVIEW BAR =====
function renderOverview(r) {
  document.getElementById('overviewBar').style.display = 'flex';

  document.getElementById('ovLevel').textContent = r.level_detected || '—';
  const feasEl = document.getElementById('ovFeas');
  const v = r.feasibility?.verdict || '—';
  feasEl.textContent = v;
  feasEl.className = 'ov-value feas-' + v.toLowerCase().replace(/\s/g, '');
  document.getElementById('ovTopics').textContent = (r.priority_topics || []).length;
  document.getElementById('ovSteps').textContent = (r.roadmap || []).length;
}

// ===== RENDER CARDS GRID =====
function renderCardsGrid(r) {
  // Priority Topics
  document.getElementById('priorityBody').innerHTML = (r.priority_topics || []).map(t => `
    <div class="priority-item">
      <div class="priority-row">
        <span class="priority-name">${esc(t.topic)}</span>
        <span class="priority-time">${esc(t.time_estimate || '')}</span>
      </div>
      <div class="priority-why">${esc(t.why)}</div>
    </div>
  `).join('');

  // Skip Topics
  document.getElementById('skipBody').innerHTML = (r.topics_to_skip || []).map(t => `
    <div class="skip-item">
      <div class="skip-topic">${esc(t.topic)}</div>
      <div class="skip-reason">${esc(t.reason)}</div>
    </div>
  `).join('');

  // Burnout Tips
  document.getElementById('burnoutBody').innerHTML = (r.burnout_aware_tips || []).map(tip => `
    <div class="burnout-tip">${esc(tip)}</div>
  `).join('');

  // Revision Strategy
  const rev = r.revision_strategy || {};
  document.getElementById('revisionBody').innerHTML = `
    <div class="rev-badge">${esc(rev.method || 'Strategy')}</div>
    <div class="rev-row"><strong>Schedule</strong><span>${esc(rev.schedule || '—')}</span></div>
    <div class="rev-row"><strong>Tools</strong><span>${(rev.tools || []).map(t => `<span class="tool-tag">${esc(t)}</span>`).join('')}</span></div>
  `;

  // Practice Plan
  const pr = r.practice_plan || {};
  document.getElementById('practiceBody').innerHTML = `
    <div class="practice-row"><strong>Frequency</strong><span>${esc(pr.frequency || '—')}</span></div>
    <div class="practice-row"><strong>Type</strong><span>${esc(pr.type || '—')}</span></div>
    <div style="margin-top:8px;font-size:11px;font-family:var(--mono);color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Milestones</div>
    ${(pr.milestones || []).map(m => `<div class="milestone-item">${esc(m)}</div>`).join('')}
  `;

  // Smart Tips
  document.getElementById('smartTipsBody').innerHTML = (r.smart_tips || []).map((tip, i) => `
    <div class="tip-item"><div class="tip-num">${i + 1}</div><span>${esc(tip)}</span></div>
  `).join('');

  document.getElementById('cardsGrid').style.display = 'grid';
}

// ===== RENDER MOTIVATION =====
function renderMotivation(r) {
  if (r.motivational_message) {
    document.getElementById('motiveText').textContent = r.motivational_message;
    document.getElementById('motiveBanner').style.display = 'flex';
  }
}

// ===== RENDER FULL ROADMAP VIEW =====
function renderFullRoadmap() {
  const container = document.getElementById('timelineContainer');
  if (!currentRoadmap || !currentRoadmap.roadmap?.length) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-map-location-dot"></i><p>Generate a roadmap first</p></div>`;
    return;
  }

  const colors = ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
  const items = currentRoadmap.roadmap;

  container.innerHTML = `
    <div class="timeline-wrap">
      ${items.map((item, i) => `
        <div class="timeline-item" style="animation-delay:${i * 0.08}s">
          <div class="timeline-dot" style="background:${colors[i % colors.length]}"></div>
          <div class="timeline-card">
            <div class="timeline-meta">
              <span class="timeline-period">${esc(item.week_or_day)}</span>
              ${item.hours_per_day ? `<span class="timeline-hours">⏱ ${esc(item.hours_per_day)}</span>` : ''}
            </div>
            <div class="timeline-focus" style="color:${colors[i % colors.length]}">${esc(item.focus)}</div>
            ${item.goal ? `<div class="timeline-goal">${esc(item.goal)}</div>` : ''}
            <div class="timeline-tasks">
              ${(item.tasks || []).map(task => `
                <div class="task-item">
                  <div class="task-bullet"><i class="fas fa-code"></i></div>
                  <span>${esc(task)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ===== RENDER TIPS VIEW =====
function renderTipsView() {
  const container = document.getElementById('tipsContainer');
  if (!currentRoadmap) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-lightbulb"></i><p>Generate a roadmap first</p></div>`;
    return;
  }

  const r = currentRoadmap;
  const sections = [
    {
      title: 'Feasibility Analysis', icon: 'fa-chart-line', color: '#6366f1',
      content: `<div style="padding:16px;background:var(--surface2);border-radius:12px;border-left:4px solid #6366f1">
        <div style="font-weight:700;font-size:16px;color:#6366f1;margin-bottom:8px">${esc(r.feasibility?.verdict || '—')}</div>
        <div style="font-size:14px;color:var(--text-secondary);line-height:1.6">${esc(r.feasibility?.explanation || '—')}</div>
      </div>`
    },
    {
      title: 'Smart Tips', icon: 'fa-lightbulb', color: '#8b5cf6',
      content: (r.smart_tips || []).map((tip, i) => `
        <div class="tip-item"><div class="tip-num">${i + 1}</div><span style="font-size:14px;line-height:1.5">${esc(tip)}</span></div>
      `).join('')
    },
    {
      title: 'Burnout Prevention', icon: 'fa-heart-pulse', color: '#10b981',
      content: (r.burnout_aware_tips || []).map(tip => `
        <div style="padding:10px 0;border-bottom:1px solid var(--border);font-size:14px;color:var(--text-secondary);display:flex;gap:10px;align-items:flex-start">
          <span style="color:#10b981">✦</span>${esc(tip)}
        </div>
      `).join('')
    },
    {
      title: 'Revision Strategy', icon: 'fa-rotate', color: '#06b6d4',
      content: (() => {
        const rev = r.revision_strategy || {};
        return `
          <div class="rev-badge">${esc(rev.method || '—')}</div><br>
          <div style="font-size:14px;color:var(--text-secondary);margin:12px 0"><strong>Schedule:</strong> ${esc(rev.schedule || '—')}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${(rev.tools || []).map(t => `<span class="tool-tag">${esc(t)}</span>`).join('')}</div>
        `;
      })()
    }
  ];

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px">
      ${sections.map(s => `
        <div class="output-card">
          <div class="oc-header">
            <div class="oc-icon" style="background:linear-gradient(135deg,${s.color}cc,${s.color}88)"><i class="fas ${s.icon}"></i></div>
            <div><h3>${s.title}</h3></div>
          </div>
          <div class="oc-body">${s.content}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ===== HISTORY =====
async function loadHistory() {
  const container = document.getElementById('historyContainer');
  container.innerHTML = `<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading history...</p></div>`;

  try {
    const res = await fetch('/history');
    const data = await res.json();
    const items = data.history || [];

    if (!items.length) {
      container.innerHTML = `<div class="empty-state"><i class="fas fa-clock-rotate-left"></i><p>No roadmaps generated yet. <a href="#" onclick="showView('generator')" style="color:var(--accent)">Generate your first one!</a></p></div>`;
      return;
    }

    document.getElementById('historyCount').textContent = items.length;

    container.innerHTML = `
      <div class="history-list">
        ${items.map(h => `
          <div class="history-item" onclick="loadHistoryItem(${h.id})">
            <div class="history-num">#${h.id}</div>
            <div class="history-info">
              <div class="history-goal">${esc(h.goal)}</div>
              <div class="history-meta">${esc(h.time_available)} · ${formatDate(h.created_at)}</div>
            </div>
            <div class="history-tags">
              <span class="h-tag level">${esc(h.level_detected)}</span>
              <span class="h-tag ${h.feasibility?.toLowerCase().replace(' ', '') || ''}">${esc(h.feasibility)}</span>
            </div>
            <i class="fas fa-chevron-right" style="color:var(--text-muted);font-size:12px"></i>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-triangle-exclamation"></i><p>Failed to load history</p></div>`;
  }
}

async function loadHistoryItem(id) {
  try {
    const res = await fetch(`/history/${id}`);
    const data = await res.json();
    if (data.success) {
      currentRoadmap = data.item.roadmap;
      currentInput = { goal: data.item.goal, time_available: data.item.time_available };
      document.getElementById('roadmapNavItem').style.opacity = '1';
      document.getElementById('roadmapNavItem').style.pointerEvents = 'auto';
      document.getElementById('tipsNavItem').style.opacity = '1';
      document.getElementById('tipsNavItem').style.pointerEvents = 'auto';
      showView('roadmap-view');
    }
  } catch (e) {}
}

// ===== STATS =====
async function loadStats() {
  try {
    const res = await fetch('/stats');
    const data = await res.json();

    document.getElementById('statTotal').textContent = data.total_roadmaps || 0;
    const lb = data.level_breakdown || {};
    document.getElementById('statBeginner').textContent = (lb.Beginner || 0) + (lb['Absolute Beginner'] || 0);
    document.getElementById('statInter').textContent = lb.Intermediate || 0;
    document.getElementById('statAdv').textContent = lb.Advanced || 0;

    const fb = data.feasibility_breakdown || {};
    const total = data.total_roadmaps || 1;
    if (total > 0) {
      const feasChart = document.getElementById('feasChart');
      feasChart.style.display = 'block';
      const colors = { Realistic: '#10b981', Ambitious: '#f59e0b', 'Very Ambitious': '#ef4444' };
      document.getElementById('feasBars').innerHTML = Object.entries(fb).map(([label, count]) => `
        <div class="feas-bar-item">
          <div class="feas-bar-label"><span>${label}</span><span>${count}</span></div>
          <div class="feas-bar-track">
            <div class="feas-bar-fill" style="width:${(count/total)*100}%;background:${colors[label]||'#6366f1'}"></div>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {}
}

// ===== UTILS =====
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return iso; }
}
