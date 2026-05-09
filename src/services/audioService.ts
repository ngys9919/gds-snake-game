/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private boostOsc: OscillatorNode | null = null;
  private boostGain: GainNode | null = null;

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);
  }

  private ensureContext() {
    if (!this.ctx) {
      this.init();
    }
  }

  playCollect() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playDeath() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();

    // Low boom
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.5);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    noise.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    noise.start();
    osc.stop(this.ctx.currentTime + 0.5);
    noise.stop(this.ctx.currentTime + 0.5);
  }

  setBoost(active: boolean) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    if (active) {
      if (!this.boostOsc) {
        this.boostOsc = this.ctx.createOscillator();
        this.boostGain = this.ctx.createGain();

        this.boostOsc.type = 'sawtooth';
        this.boostOsc.frequency.setValueAtTime(60, this.ctx.currentTime);
        
        this.boostGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.boostGain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);

        this.boostOsc.connect(this.boostGain);
        this.boostGain.connect(this.masterGain);

        this.boostOsc.start();
      }
    } else {
      if (this.boostOsc && this.boostGain) {
        const osc = this.boostOsc;
        const gain = this.boostGain;
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
        osc.stop(this.ctx.currentTime + 0.2);
        this.boostOsc = null;
        this.boostGain = null;
      }
    }
  }

  playJoin() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    const startTime = this.ctx.currentTime;
    
    notes.forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, startTime + i * 0.1);
    });

    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, startTime + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(startTime + 0.5);
  }
}

export const audioService = new AudioService();
