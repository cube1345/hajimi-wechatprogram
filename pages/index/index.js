// index.js

Page({
  /* 此处存放数据 */
  data: {
    gifVisible: Array(16).fill(false),
    redNoteScore: 0,
    timerId: null,
    gifDuration: 1500,
    scoreChange: 0,
    isMusicPlaying: false,
    bgMusic: null
  },

  onLoad() {
    this.startRandomShow();
    this.initBackgroundMusic();
  },

  onUnload() {
    clearTimeout(this.data.timerId);
    this.stopBackgroundMusic();
  },

  initBackgroundMusic() {
    const bgMusic = wx.createInnerAudioContext();
    bgMusic.src = '/music/no_more_manbo.mp3'; 
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    this.setData({ bgMusic });
  },

  toggleBackgroundMusic() {
    const { bgMusic, isMusicPlaying } = this.data;

    if (isMusicPlaying) {
      bgMusic.pause();
    } else {
      bgMusic.play();
    }
    this.setData({ isMusicPlaying: !isMusicPlaying });
  },
  stopBackgroundMusic() {
    const { bgMusic } = this.data;
    if (bgMusic) {
      bgMusic.stop();
      bgMusic.destroy();
    }
  },

  toggleGif: function(e) {
    const index = e.currentTarget.dataset.index;
    const key = `gifVisible[${index}]`;
    const currentVisible = this.data.gifVisible[index];

    if (currentVisible) {
      const scoreChange = 10;
      const newScore = this.data.redNoteScore + scoreChange;

      this.setData({
        [key]: false,
        redNoteScore: newScore,
        showScoreAnimation: true,
        scoreChange: `+${scoreChange}`,
      });
      clearTimeout(this.data.timerId);
      this.startRandomShow();
    }
  },

  startRandomShow() {
    const gifDuration = Math.floor(Math.random() * 1200) + 500;
    this.setData({ gifDuration });
    const gifArray = Array(16).fill(false);
    this.setData({ gifVisible: gifArray });
    const delay = Math.floor(Math.random() * 2000);
    this.data.timerId = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * 16);
      const key = `gifVisible[${randomIndex}]`;
      this.setData({ [key]: true });
      setTimeout(() => {
        if (this.data.gifVisible[randomIndex]) {
          this.setData({
            [key]: false,
            redNoteScore: this.data.redNoteScore - 50
          });

          this.startRandomShow();
        }
      }, this.data.gifDuration);

    }, delay);
  }
})