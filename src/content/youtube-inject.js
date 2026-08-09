(function () {
  window.addEventListener('badnet_set_quality', (event) => {
    const { ytQuality } = event.detail;
    const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
    if (player) {
      if (typeof player.setPlaybackQualityRange === 'function') {
        player.setPlaybackQualityRange(ytQuality, ytQuality);
      }
      if (typeof player.setVideoQuality === 'function') {
        player.setVideoQuality(ytQuality);
      }
    }
  });
})();
