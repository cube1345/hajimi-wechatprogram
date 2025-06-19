Page({
  /* 此处存放数据 */
  data: {
    // 游戏相关数据
    gifVisible: Array(16).fill(false),
    redNoteScore: 0,
    timerId: null,
    gifDuration: 1500,
    scoreChange: 0,
    showScoreAnimation: false,
    scorePosition: { left: 0, top: 0 },
    isGameOver: false,

    musicList: [
      { id: 1, title: "Counting_Stars", artist: "全民制作人", src: "/music/Counting_Stars.mp3" },
      { id: 2, title: "出山", artist: "全民制作人", src: "music/go-out-mountain.mp3" },
      { id: 3, title: "不再曼波", artist: "全民制作人", src: "/music/no_more_manbo.mp3" },
      { id: 4, title: "牵私人戏", artist: "全民制作人", src: "/music/private-game.mp3" },
      { id: 5, title: "青藏高原", artist: "全民制作人", src: "/music/qin-zang-gao-yuan.mp3" },
      { id: 6, title: "套哈杆", artist: "全民制作人", src: "/music/tao-ha-gan.mp3" },
      { id: 7, title: "新基米醉酒", artist: "全民制作人", src: "/music/xin-ji-mi-zui-jiu.mp3" },
      { id: 8, title: "一键没", artist: "全民制作人", src: "/music/yi-jian-mei.mp3" },
      { id: 9, title: "耄耋A梦", artist: "全民制作人", src: "/music/mao-dei-A-meng.mp3"}
    ],
    currentMusic: null,
    currentIndex: 0,
    isPlaying: false,
    currentTime: "00:00",
    totalTime: "00:00",
    progressPercent: 0,
    audioContext: null,
    isMenuVisible: false,
    lastPlayedMusic: null // 记录最后播放的歌曲
  },

  onLoad() {
    this.initAudioContext(); // 先初始化音频上下文
    
    // 默认播放第一首音乐
    if (this.data.musicList.length > 0) {
      const firstMusic = this.data.musicList[0];
      this.setData({ currentMusic: firstMusic, currentIndex: 0 });
      this.data.audioContext.src = firstMusic.src;
      this.data.audioContext.play();
    }
    
    this.startRandomShow(); // 开始游戏逻辑
  },

  onUnload() {
    clearTimeout(this.data.timerId);
    this.stopAudio();
  },

  // 游戏相关方法
  toggleGif(e) {
    const index = e.currentTarget.dataset.index;
    if (this.data.gifVisible[index]) {
      this.setData({
        [`gifVisible[${index}]`]: false,
        redNoteScore: this.data.redNoteScore + 10,
        showScoreAnimation: true,
        scoreChange: "+10",
        scorePosition: {
          left: e.currentTarget.offsetLeft,
          top: e.currentTarget.offsetTop
        }
      });
      clearTimeout(this.data.timerId);
      this.startRandomShow();
    }
    this.checkGameOver();
  },

  startRandomShow() {
    const gifDuration = Math.floor(Math.random() * 1200) + 500;
    this.setData({ gifDuration });

    // 先隐藏所有图片
    const gifArray = Array(16).fill(false);
    this.setData({ gifVisible: gifArray });

    // 随机显示一张图片
    const delay = Math.floor(Math.random() * 2000);
    this.data.timerId = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * 16);
      this.setData({ [`gifVisible[${randomIndex}]`]: true });

      // 如果超时未点击，扣除分数
      setTimeout(() => {
        if (this.data.gifVisible[randomIndex]) {
          this.setData({
            [`gifVisible[${randomIndex}]`]: false,
            redNoteScore: this.data.redNoteScore - 50
          });
          this.startRandomShow();
        }
        this.checkGameOver();
      }, this.data.gifDuration);
    }, delay);
  },

  // 重新开始游戏
  restartGame() {
    this.setData({
      gifVisible: Array(16).fill(false),
      redNoteScore: 0,
      isGameOver: false
    });
    clearTimeout(this.data.timerId);
    this.startRandomShow();

    // 播放上一局最后播放的音乐
    if (this.data.lastPlayedMusic) {
      // 确保音乐存在于列表中
      const musicIndex = this.data.musicList.findIndex(
        item => item.id === this.data.lastPlayedMusic.id
      );
      
      if (musicIndex !== -1) {
        const music = this.data.musicList[musicIndex];
        this.setData({ currentMusic: music, currentIndex: musicIndex });
        this.data.audioContext.src = music.src;
        this.data.audioContext.play();
      } else {
        // 如果音乐不存在，播放默认音乐
        this.playDefaultMusic();
      }
    } else {
      // 如果没有记录，播放默认音乐
      this.playDefaultMusic();
    }
  },
  
  // 播放默认音乐
  playDefaultMusic() {
    if (this.data.musicList.length > 0) {
      const firstMusic = this.data.musicList[0];
      this.setData({ currentMusic: firstMusic, currentIndex: 0 });
      this.data.audioContext.src = firstMusic.src;
      this.data.audioContext.play();
    }
  },

  // 检查游戏是否结束
  checkGameOver() {
    if (this.data.redNoteScore < -150) {
      this.setData({
        isGameOver: true,
        lastPlayedMusic: this.data.currentMusic // 记录最后播放的歌曲
      });
      clearTimeout(this.data.timerId);
      this.data.audioContext.pause();
    }
  },

  // 音乐相关方法
  initAudioContext() {
    const audioContext = wx.createInnerAudioContext();
    audioContext.onPlay(() => {
      this.setData({ isPlaying: true });
    });
    audioContext.onPause(() => {
      this.setData({ isPlaying: false });
    });
    audioContext.onStop(() => {
      this.setData({ isPlaying: false });
    });
    audioContext.onEnded(() => {
      this.playNextMusic();
    });
    audioContext.onTimeUpdate(() => {
      this.updateProgress();
    });
    audioContext.onError((err) => {
      console.error("音乐播放错误:", err);
      wx.showToast({
        title: '音乐播放失败',
        icon: 'none'
      });
    });
    this.setData({ audioContext });
  },

  playMusic(e) {
    const musicId = e.currentTarget.dataset.id;
    const musicIndex = this.data.musicList.findIndex(item => item.id === musicId);

    if (musicIndex !== -1 && musicIndex !== this.data.currentIndex) {
      const music = this.data.musicList[musicIndex];
      this.setData({ currentMusic: music, currentIndex: musicIndex });

      this.data.audioContext.src = music.src;
      this.data.audioContext.play();

      this.setData({ isMenuVisible: false });
      if (!this.data.isGameOver) {
        this.startRandomShow();
      }
    }
  },

  togglePlayPause() {
    if (!this.data.currentMusic) {
      if (this.data.musicList.length > 0) {
        this.playMusic({ currentTarget: { dataset: { id: this.data.musicList[0].id } } });
      }
      return;
    }

    if (this.data.isPlaying) {
      this.data.audioContext.pause();
    } else {
      this.data.audioContext.play();
    }
  },

  playNextMusic() {
    const nextIndex = (this.data.currentIndex + 1) % this.data.musicList.length;
    const nextMusic = this.data.musicList[nextIndex];
    this.setData({ currentMusic: nextMusic, currentIndex: nextIndex });

    this.data.audioContext.src = nextMusic.src;
    this.data.audioContext.play();
  },

  updateProgress() {
    const currentTime = this.formatTime(this.data.audioContext.currentTime);
    const duration = this.formatTime(this.data.audioContext.duration || 0);
    const progressPercent = this.data.audioContext.duration
      ? (this.data.audioContext.currentTime / this.data.audioContext.duration) * 100
      : 0;

    this.setData({ currentTime, totalTime: duration, progressPercent });
  },

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  seekMusic(e) {
    if (!this.data.currentMusic) return;

    const progressBarWidth = e.currentTarget.width;
    const touchPosition = e.touches[0].x;
    const percent = (touchPosition / progressBarWidth) * 100;
    const seekTime = (percent / 100) * this.data.audioContext.duration;

    this.data.audioContext.seek(seekTime);
    this.setData({ progressPercent: percent });
  },

  stopAudio() {
    if (this.data.audioContext) {
      this.data.audioContext.stop();
      this.data.audioContext.destroy();
    }
  },

  toggleMenu() {
    const isMenuVisible = !this.data.isMenuVisible;
    this.setData({ isMenuVisible });

    if (isMenuVisible) {
      clearTimeout(this.data.timerId);
      if (this.data.isPlaying) {
        this.data.audioContext.pause();
      }
    } else {
      if (!this.data.isGameOver) {
        this.startRandomShow();
      }
      if (this.data.currentMusic) {
        this.data.audioContext.play();
      }
    }
  },

  closeMenu() {
    this.setData({ isMenuVisible: false });
    if (!this.data.isGameOver) {
      this.startRandomShow();
    }
    if (this.data.currentMusic) {
      this.data.audioContext.play();
    }
  }
});