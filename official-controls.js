'use strict';
(() => {
  const source = 'https://op7418.github.io/guizang-game-skill/';
  const frame = document.getElementById('official-game');
  const status = document.getElementById('frame-status');
  const slow = document.getElementById('slow-panel');
  const reload = document.getElementById('reload-game');
  const focus = document.getElementById('focus-toggle');
  const fullscreen = document.getElementById('fullscreen-toggle');
  const help = document.getElementById('help-toggle');
  const panel = document.getElementById('help-panel');
  let slowTimer, statusTimer, loading = false;
  const clearTimers = () => { clearTimeout(slowTimer); clearTimeout(statusTimer); };
  const begin = () => {
    clearTimers();
    loading = true;
    slow.hidden = true;
    status.hidden = false;
    status.textContent = 'Đang mở máy chủ game gốc…';
    slowTimer = setTimeout(() => {
      if (!loading) return;
      status.textContent = 'Khung trò chơi tải lâu hơn dự kiến.';
      slow.hidden = false;
    }, 18000);
  };
  const loaded = () => {
    loading = false;
    clearTimeout(slowTimer);
    slow.hidden = true;
    status.hidden = false;
    status.textContent = 'Khung nguồn đã kết nối. Game có thể tiếp tục tải tài nguyên…';
    statusTimer = setTimeout(() => { status.hidden = true; }, 4800);
  };
  frame.addEventListener('load', loaded);
  // A cached cross-origin iframe may finish before deferred script attaches its listener.
  // The parent load event still signals completion of the iframe load, without reading its contents.
  window.addEventListener('load', () => { if (loading) loaded(); }, {once: true});
  frame.addEventListener('error', () => {
    loading = false;
    clearTimers();
    status.textContent = 'Không thể mở khung trò chơi.';
    slow.hidden = false;
  });
  reload.addEventListener('click', () => { begin(); frame.src = source; frame.focus(); });
  focus.addEventListener('click', () => {
    const active = document.body.classList.toggle('focus-mode');
    focus.setAttribute('aria-pressed', String(active));
    focus.textContent = active ? 'Thu gọn' : 'Tập trung';
  });
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else throw Error('Fullscreen unavailable');
    } catch {
      status.hidden = false;
      status.textContent = 'Trình duyệt không cho phép toàn màn hình. Hãy dùng chế độ Tập trung.';
    }
  });
  document.addEventListener('fullscreenchange', () => {
    const active = Boolean(document.fullscreenElement);
    fullscreen.setAttribute('aria-pressed', String(active));
    fullscreen.textContent = active ? 'Thoát toàn màn hình' : 'Toàn màn hình';
  });
  help.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    help.setAttribute('aria-expanded', String(!panel.hidden));
  });
  begin();
})();
