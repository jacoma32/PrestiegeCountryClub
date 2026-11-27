(() => {
  const video = document.getElementById('gameplay');
  video.defaultMuted = true;
  video.muted = true;

  let playPending = false;
  function resumeGameplay() {
    if (document.hidden || !video.paused || playPending || video.error) return;
    playPending = true;
    video.play().catch(() => {
      // Browsers that block autoplay can start playback on the next interaction.
    }).finally(() => {
      playPending = false;
    });
  }

  video.addEventListener('canplay', resumeGameplay);
  video.addEventListener('pause', resumeGameplay);
  document.addEventListener('visibilitychange', resumeGameplay);
  window.addEventListener('pageshow', resumeGameplay);
  window.addEventListener('click', resumeGameplay, true);
  window.addEventListener('keyup', resumeGameplay, true);
  resumeGameplay();
})();
