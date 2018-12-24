/**
 * Player 组件
 * 只负责歌曲的播放，以及控制歌曲的播放模式
 * 不用关心歌曲列表，以及歌曲的播放顺序的逻辑处理
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { If, Then, Else } from 'react-if';
import {
  getChangePlayingStatusAction,
  playPrevMusicAction,
  playNextMusicAction
} from '../../store/actionCreator';

import ProgressBar from '../../base/ProgressBar';
import PlayTime from '../../base/PlayTime';
import './style.scss';

const DEFAULT_TIME = 0;
const PLAYING_STATUS = {
  playing: true,
  paused: false
};
const DEFAULT_VOLUME = 0.35;

class Player extends Component {
  constructor(props) {
    super(props);
    this.state = {
      duration: DEFAULT_TIME,
      currentTime: DEFAULT_TIME,
      move: false,
      percent: 0,
      volume: DEFAULT_VOLUME
    };
  }

  componentDidMount() {
    this.refs.audio.volume = this.state.volume;
  }

  // 音乐播放触发 audio 标签的 updatetime 事件
  // 这个时候获取 currentTime 得到音乐的时间
  handleUpdateTime = e => {
    if (this.state.move) {
      return;
    }
    const { currentTime, duration } = e.target;
    let percent = Math.floor((currentTime / duration) * 1000) / 1000;
    if (isNaN(percent)) {
      percent = 0;
    }
    this.setState(() => {
      return {
        currentTime,
        percent,
        duration
      };
    });
  };

  percentChange = percent => {
    this.setState(() => {
      return {
        percent,
        move: true
      };
    });
  };

  percentChangeEnd = percent => {
    const currentTime = this.state.duration * percent;
    this.refs.audio.currentTime = currentTime;
    this.setState(() => {
      return {
        currentTime,
        percent,
        move: false
      };
    });
  };

  volumeChange = percent => {
    this.refs.audio.volume = percent;
    this.setState(() => {
      return {
        volume: percent
      };
    });
  };

  volumeChangeEnd = percent => {
    this.refs.audio.volume = percent;
    this.setState(() => {
      return {
        volume: percent
      };
    });
  };

  handleChangePlayingStatus(status) {
    this.props.changePlayingStatus(status);
    const audio = this.refs.audio;
    if (status === PLAYING_STATUS.playing) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  playPrevMusic = () => {
    this.props.playPrevMusic();
  };

  playNextMusic = () => {
    this.props.playNextMusic();
  };

  renderPlayerControl = () => {
    return (
      <div className="player-control-container">
        <div className="play-control-btn">
          <div className="prev-music">
            <i className="iconfont icon-prev" onClick={this.playPrevMusic} />
          </div>
          <div className="play">
            <If condition={this.props.playing}>
              {/* 如果正在播放，显示暂停按钮 */}
              <Then>
                <i
                  className="iconfont icon-stop"
                  onClick={() =>
                    this.handleChangePlayingStatus(PLAYING_STATUS.paused)
                  }
                />
              </Then>
              {/* 如果音乐暂停，显示播放按钮 */}
              <Else>
                <i
                  className="iconfont icon-bofangicon"
                  onClick={() =>
                    this.handleChangePlayingStatus(PLAYING_STATUS.playing)
                  }
                />
              </Else>
            </If>
          </div>
          <div className="next-music">
            <i className="iconfont icon-test" onClick={this.playNextMusic}/>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { currentMusic } = this.props;

    return (
      <div className="player-container">
        <div className="player-left-container">
          {this.renderPlayerControl()}
          <div className="music-img">
            <img src={currentMusic ? currentMusic.albumImgUrl : ''} alt="" />
          </div>
        </div>
        <div className="player-middle-container">
          <div className="music-info">
            <p className="music-name">
              {currentMusic ? currentMusic.musicName : ''}
            </p>
            <p className="singer-name">
              {currentMusic ? currentMusic.singer[0].name : ''}
            </p>
          </div>
          <div className="progress-bar-container">
            <ProgressBar
              percent={this.state.percent}
              percentChange={this.percentChange}
              percentChangeEnd={this.percentChangeEnd}
            />
          </div>
        </div>
        <div className="player-right-container">
          <div className="play-time-container">
            <PlayTime
              currentTime={this.state.currentTime}
              duration={this.state.duration}
            />
          </div>
          <div className="audio-volume">
            <i className="iconfont icon-volume-up" />
            <ProgressBar
              percent={this.state.volume}
              percentChange={this.volumeChange}
              percentChangeEnd={this.volumeChangeEnd}
            />
          </div>
        </div>
        <audio
          autoPlay
          src={currentMusic ? currentMusic.musicUrl : ''}
          ref="audio"
          onTimeUpdate={this.handleUpdateTime}
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    currentMusic: state.currentMusic,
    playing: state.playing
  };
};

const mapDispatchToProps = dispatch => {
  return {
    changePlayingStatus(status) {
      const action = getChangePlayingStatusAction(status);
      dispatch(action);
    },
    playPrevMusic() {
      const action = playPrevMusicAction();
      dispatch(action);
    },
    playNextMusic () {
      const action = playNextMusicAction();
      dispatch(action);
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Player);

/**
 * 点击歌曲播放逻辑：
 * 1. 点击歌曲的时候使用 getChangeCurrentMusic
 * 2. 使用 redux-thunk 中间件，在 actoin 中发出获取歌曲 url 的请求
 * 3. 获取 url 之后在 action 中直接调用 actionCreator 中的 changeCurrentMusicAction 来对 redux 中的 currentMusic 进行修改
 *
 * 点击下一首：
 * 1. 修改 currentIndex 也就是前播放列表 playList 中的歌曲索引
 *    1.
 * 2. 更改 redux 中的 currentMusic 修改为 playList[currentIndex]
 * 3. 重复 播放逻辑
 *
 * 播放完当前歌曲下一首：
 */