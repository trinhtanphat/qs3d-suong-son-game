'use strict';
(() => {
  const source = 'https://op7418.github.io/guizang-game-skill/';
  const frame = document.getElementById('official-game');
  const status = document.getElementById('frame-status');
  const slow = document.getElementById('slow-panel');
  const slowHeading = slow.querySelector('strong');
  const reload = document.getElementById('reload-game');
  const dialog = document.getElementById('reload-confirm');
  const cancelReload = document.getElementById('cancel-reload');
  const confirmReload = document.getElementById('confirm-reload');
  const focus = document.getElementById('focus-toggle');
  const fullscreen = document.getElementById('fullscreen-toggle');
  const help = document.getElementById('help-toggle');
  const panel = document.getElementById('help-panel');
  let slowTimer, statusTimer, loading = false;
  const clearTimers = () => { clearTimeout(slowTimer); clearTimeout(statusTimer); };
  const showOffline = () => {
    clearTimers();
    loading = false;
    status.hidden = false;
    status.textContent = 'Thiết bị đang ngoại tuyến. Game có thể bị gián đoạn.';
    slowHeading.textContent = 'Kết nối mạng bị gián đoạn.';
    slow.hidden = false;
  };
  const begin = () => {
    clearTimers();
    loading = true;
    slow.hidden = true;
    slowHeading.textContent = 'Khung trò chơi tải lâu hơn dự kiến.';
    status.hidden = false;
    status.textContent = 'Đang mở máy chủ game gốc…';
    if (!navigator.onLine) { showOffline(); return; }
    slowTimer = setTimeout(() => {
      if (!loading) return;
      status.textContent = 'Khung trò chơi tải lâu hơn dự kiến.';
      slow.hidden = false;
    }, 18000);
  };
  const loaded = () => {
    if (!navigator.onLine) { showOffline(); return; }
    loading = false;
    clearTimeout(slowTimer);
    slow.hidden = true;
    status.hidden = false;
    status.textContent = 'Khung nguồn đã kết nối. Game có thể tiếp tục tải tài nguyên…';
    statusTimer = setTimeout(() => { status.hidden = true; }, 4800);
  };
  const doReload = () => {
    begin();
    frame.src = source;
    frame.focus();
  };
  frame.addEventListener('load', loaded);
  // A fast cached iframe can finish before this deferred script attaches its listener.
  window.addEventListener('load', () => { if (loading) loaded(); }, {once:true});
  frame.addEventListener('error', () => {
    if (!navigator.onLine) { showOffline(); return; }
    loading = false;
    clearTimers();
    status.hidden = false;
    status.textContent = 'Không thể mở khung trò chơi.';
    slowHeading.textContent = 'Không thể tải khung trò chơi.';
    slow.hidden = false;
  });
  window.addEventListener('offline', showOffline);
  window.addEventListener('online', () => {
    clearTimers();
    loading = false;
    status.hidden = false;
    status.textContent = 'Kết nối đã phục hồi. Nếu game chưa hiển thị, hãy chọn Tải lại game.';
    slowHeading.textContent = 'Kết nối đã trở lại.';
    slow.hidden = true;
    // Never silently reload an active game: that could destroy unsaved progress.
  });
  reload.addEventListener('click', () => {
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
      cancelReload.focus();
    } else if (window.confirm('Tải lại game sẽ làm mất tiến trình chưa lưu. Bạn có muốn tiếp tục?')) {
      doReload();
    }
  });
  cancelReload.addEventListener('click', () => dialog.close());
  confirmReload.addEventListener('click', () => { dialog.close(); doReload(); });
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