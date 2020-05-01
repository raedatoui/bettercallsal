import * as utils from 'audio-buffer-utils';
import { baseurl } from '../utils';

class AudioBuffers {
  constructor(callback) {
    this.soundList = null;
    this.onload = callback;
    this.loadCount = 0;
    this.listCount = 0;
    this.context = null;
    this.analyzer = null;
    this.createContext();
    this.createUrlList();
  }

  createContext() {
    if (this.context === null) {
      const contextClass =
        window.AudioContext ||
        window.webkitAudioContext ||
        window.mozAudioContext ||
        window.oAudioContext ||
        window.msAudioContext;

      if (contextClass) {
        // eslint-disable-next-line new-cap
        this.context = new contextClass();
      }
      if (this.context) {
        this.analyzer = this.context.createAnalyser();
        this.analyzer.fftSize = 1024;
      }
    }
  }

  createUrlList() {
    this.soundList = {
      airhorn: {
        url: `${baseurl}/audio/airhorn.wav`,
        source: '',
        buffer: null,
        startedAt: 0,
        pausedAt: 0,
        playing: false,
      },
      phoneRing: {
        url: `${baseurl}/audio/phone-ring.wav`,
        source: null,
        buffer: null,
        startedAt: 0,
        pausedAt: 0,
        playing: false,
      },
      hold: {
        url: `${baseurl}/audio/holdmusic.wav`,
        source: null,
        buffer: null,
        startedAt: 0,
        pausedAt: 0,
        playing: false,
      },
      drone: {
        url: `${baseurl}/audio/drone.wav`,
        source: null,
        buffer: null,
        startedAt: 0,
        pausedAt: 0,
        playing: false,
      },
    };
  }

  load() {
    const keys = Object.keys(this.soundList);
    this.listCount = keys.length;
    keys.forEach(key => {
      this.loadBuffer(key, this.soundList[key]);
    });
  }

  loadBuffer(sound, obj) {
    // Load buffer asynchronously
    const request = new XMLHttpRequest();
    request.responseType = 'arraybuffer';
    request.async = false;
    request.onload = () => {
      // Asynchronously decode the audio file data in request.response
      this.context.decodeAudioData(
        request.response,
        buffer => {
          if (!buffer) {
            console.error(`error decoding file data: ${obj.url}`);
            return;
          }

          this.soundList[sound].buffer = buffer;
          if (sound === 'airhorn') {
            this.soundList.airhorn2 = {
              source: '',
              buffer: utils.clone(buffer),
              startedAt: 0,
              pausedAt: 0,
            };
          }

          if (++this.loadCount === this.listCount) {
            this.onload();
          }
        },
        error => {
          console.error('decodeAudioData error', error);
        }
      );
    };
    request.onerror = () => {
      console.error('BufferLoader: XHR error');
    };
    request.open('GET', obj.url, true);
    request.send();
  }

  updateBuffers(buffers) {
    this.buffers = buffers;
  }

  getBuffers() {
    return this.buffers;
  }

  play(sound, loop = false) {
    const obj = this.soundList[sound];
    const source = this.context.createBufferSource();
    // set the buffer in the AudioBufferSourceNode
    source.buffer = obj.buffer;
    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    // source.connect(this.context.destination);
    // connect analyser
    // connect them up into a chain
    source.connect(this.analyzer);
    this.analyzer.connect(this.context.destination);
    // start the source playing
    source.start(0, obj.pausedAt);
    source.loop = loop;
    obj.startedAt = this.context.currentTime - obj.pausedAt;
    obj.source = source;
    obj.playing = true;
    return source;
  }

  stop(sound) {
    const obj = this.soundList[sound];
    if (!obj.source) {
      console.warn('cant stop source!');
      return;
    }
    obj.source.disconnect();
    obj.source.stop(0);
    obj.startedAt = 0;
    obj.pausedAt = 0;
    obj.playing = false;
  }

  pause(sound) {
    const obj = this.soundList[sound];
    if (!obj.source) {
      console.warn('cant pause source!');
      return;
    }
    let elapsed = this.context.currentTime - obj.startedAt;
    this.stop(sound);
    if (elapsed > obj.buffer.duration) {
      elapsed = 0;
    }
    obj.pausedAt = elapsed;
    obj.playing = false;
  }

  toggle(sound) {
    const obj = this.soundList[sound];
    if (obj.playing) this.stop(sound);
    else this.play(sound, true);
  }

  stopAll() {
    Object.keys(this.soundList).forEach(k => this.stop(k));
  }
}

export default AudioBuffers;
