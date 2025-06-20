Page({
  data: {
    gifVisible: Array(16).fill(false),
    redNoteScore: 0,
    timerId: null,
    gifDuration: 1500,
    scoreChange: 0,
    showScoreAnimation: false,
    scorePosition: { left: 0, top: 0 },
    isGameOver: false,
    isGamePaused: false, // 新增：游戏暂停状态
    
    musicList: [
      { id: 1, title: "Counting_Stars", artist: "全民制作人", src: "/music/Counting_Stars.mp3" },
      { id: 2, title: "出山", artist: "全民制作人", src: "music/go-out-mountain.mp3" },
      { id: 3, title: "不再曼波", artist: "全民制作人", src: "/music/no_more_manbo.mp3" },
      { id: 4, title: "牵私人戏", artist: "全民制作人", src: "/music/private-game.mp3" },
      { id: 5, title: "青藏高原", artist: "全民制作人", src: "/music/qin-zang-gao-yuan.mp3" },
      { id: 6, title: "套哈杆", artist: "全民制作人", src: "/music/tao-ha-gan.mp3" },
      { id: 7, title: "新基米醉酒", artist: "全民制作人", src: "/music/xin-ji-mi-zui-jiu.mp3" },
      { id: 8, title: "一键没", artist: "全民制作人", src: "/music/yi-jian-mei.mp3" },
      { id: 9, title: "耄耋A梦", artist: "全民制作人", src: "/music/mao-die-A-meng.mp3"}
    ],
    currentMusic: null,
    currentIndex: 0,
    isPlaying: false,
    currentTime: "00:00",
    totalTime: "00:00",
    progressPercent: 0,
    audioContext: null,
    effectContext: null, // 音效上下文
    isEffectPlaying: false, // 音效播放状态
    isMenuVisible: false,
    lastPlayedMusic: null 
  },

  onLoad() {
    this.initAudioContext();
    this.initEffectContext(); // 初始化音效上下文
    if (this.data.musicList.length > 0) {
      const firstMusic = this.data.musicList[0];
      this.setData({ currentMusic: firstMusic, currentIndex: 0 });
      this.data.audioContext.src = firstMusic.src;
      this.data.audioContext.play();
    }
    
    this.startRandomShow(); 
  },

  onUnload() {
    clearTimeout(this.data.timerId);
    this.stopAudio();
    this.stopEffect(); // 停止音效并释放资源
  },

  // 初始化音效上下文
  initEffectContext() {
    const effectContext = wx.createInnerAudioContext();
    effectContext.loop = false; // 不循环播放
    effectContext.autoplay = false;
    effectContext.src = "/music/attack.mp3";
    effectContext.volume = 1; // 音效音量设为最大
    
    effectContext.onStop(() => {
      this.setData({ isEffectPlaying: false });
    });
    
    effectContext.onError((err) => {
      console.error("音效播放错误:", err);
    });
    
    this.setData({ effectContext });
  },

  playEffect() {
    const { effectContext, isEffectPlaying } = this.data;
    if (effectContext && !isEffectPlaying && !this.data.isGamePaused) {
        effectContext.seek(0); // 重置播放位置
        effectContext.play();
        this.setData({ isEffectPlaying: true });
    }
  },

  // 停止音效
  stopEffect() {
    const { effectContext } = this.data;
    if (effectContext) {
      effectContext.stop();
      this.setData({ isEffectPlaying: false });
    }
  },

  toggleGif(e) {
    const index = e.currentTarget.dataset.index;
    if (this.data.gifVisible[index] && !this.data.isGamePaused) {
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
      this.stopEffect(); // 隐藏GIF时停止音效
      this.startRandomShow();
    }
    this.checkGameOver();
  },

  startRandomShow() {
    if (this.data.isGamePaused) return; // 游戏暂停时不启动逻辑
    
    const gifDuration = Math.floor(Math.random() * 1200) + 500;
    this.setData({ gifDuration });

    // 先隐藏所有图片
    const gifArray = Array(16).fill(false);
    this.setData({ gifVisible: gifArray });
    this.stopEffect(); // 隐藏所有GIF时停止音效

    // 随机显示一张图片
    const delay = Math.floor(Math.random() * 2000);
    this.data.timerId = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * 16);
      this.setData({ [`gifVisible[${randomIndex}]`]: true });
      this.playEffect(); // 显示GIF时播放音效

      // 如果超时未点击，扣除分数
      setTimeout(() => {
        if (this.data.gifVisible[randomIndex]) {
          this.setData({
            [`gifVisible[${randomIndex}]`]: false,
            redNoteScore: this.data.redNoteScore - 50
          });
          this.stopEffect(); // 隐藏GIF时停止音效
          this.startRandomShow();
        }
        this.checkGameOver();
      }, this.data.gifDuration);
    }, delay);
  },

  // 暂停游戏
  pauseGame() {
    this.setData({ isGamePaused: true });
    clearTimeout(this.data.timerId);
    if (this.data.isPlaying) {
      this.data.audioContext.pause();
    }
    this.stopEffect();
  },

  // 继续游戏
  resumeGame() {
    this.setData({ isGamePaused: false });
    if (!this.data.isGameOver) {
      this.startRandomShow();
    }
    if (this.data.currentMusic && !this.data.isPlaying) {
      this.data.audioContext.play();
    }
  },

  // 重新开始游戏
  restartGame() {
    this.setData({
      gifVisible: Array(16).fill(false),
      redNoteScore: 0,
      isGameOver: false,
      isGamePaused: false
    });
    clearTimeout(this.data.timerId);
    this.stopEffect(); // 重新开始时停止音效
    this.startRandomShow();

    // 播放上一局最后播放的音乐
    if (this.data.lastPlayedMusic) {
      const musicIndex = this.data.musicList.findIndex(
        item => item.id === this.data.lastPlayedMusic.id
      );
      
      if (musicIndex !== -1) {
        const music = this.data.musicList[musicIndex];
        this.setData({ currentMusic: music, currentIndex: musicIndex });
        this.data.audioContext.src = music.src;
        this.data.audioContext.play();
      } else {
        this.playDefaultMusic();
      }
    } else {
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
        lastPlayedMusic: this.data.currentMusic
      });
      clearTimeout(this.data.timerId);
      this.data.audioContext.pause();
      this.stopEffect(); // 游戏结束时停止音效
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
    audioContext.volume = 0.05; // 背景音乐音量设为0.2
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
      if (!this.data.isGameOver && !this.data.isGamePaused) {
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
      this.pauseGame(); // 菜单显示时暂停游戏
    } else {
      this.resumeGame(); // 菜单隐藏时恢复游戏
    }
  },

  closeMenu() {
    this.setData({ isMenuVisible: false });
    this.resumeGame(); // 关闭菜单时恢复游戏
  }
});