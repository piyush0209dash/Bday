const music = document.querySelector('#royal-music');
const toggle = document.querySelector('#music-toggle');

if (music && toggle) {
  music.volume = 0.24;

  const setMusicState = (playing) => {
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'Pause royal background music' : 'Play royal background music');
    toggle.classList.toggle('is-playing', playing);
    toggle.querySelector('.music-label').textContent = playing ? 'Music on' : 'Royal music';
  };

  toggle.addEventListener('click', async () => {
    if (music.paused) {
      try {
        await music.play();
        setMusicState(true);
      } catch {
        setMusicState(false);
      }
    } else {
      music.pause();
      setMusicState(false);
    }
  });

  music.addEventListener('ended', () => setMusicState(false));
}
