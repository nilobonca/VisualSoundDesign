function createFadeBuffer(context: AudioContext, activeTime: number, fadeTime: number): AudioBuffer {
    const length1 = activeTime * context.sampleRate;
    const length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
    const length = length1 + length2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const p = buffer.getChannelData(0);
    
    const fadeLength = fadeTime * context.sampleRate;
    const fadeIndex1 = fadeLength;
    const fadeIndex2 = length1 - fadeLength;
    
    for (let i = 0; i < length1; ++i) {
        let value;
        if (i < fadeIndex1) {
            value = Math.sqrt(i / fadeLength);
        } else if (i >= fadeIndex2) {
            value = Math.sqrt(1 - (i - fadeIndex2) / fadeLength);
        } else {
            value = 1;
        }
        p[i] = value;
    }

    for (let i = length1; i < length; ++i) {
        p[i] = 0;
    }
    
    return buffer;
}

function createDelayTimeBuffer(context: AudioContext, activeTime: number, fadeTime: number, shiftUp: boolean): AudioBuffer {
    const length1 = activeTime * context.sampleRate;
    const length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
    const length = length1 + length2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const p = buffer.getChannelData(0);
    
    for (let i = 0; i < length1; ++i) {
        if (shiftUp) {
            p[i] = (length1 - i) / length;
        } else {
            p[i] = i / length1;
        }
    }

    for (let i = length1; i < length; ++i) {
        p[i] = 0;
    }

    return buffer;
}

const delayTimeValue = 0.100;
const fadeTimeValue = 0.050;
const bufferTimeValue = 0.100;

export class Jungle {
    context: AudioContext;
    input: GainNode;
    output: GainNode;
    
    private shiftDownBuffer: AudioBuffer;
    private shiftUpBuffer: AudioBuffer;
    
    private mod1: AudioBufferSourceNode;
    private mod2: AudioBufferSourceNode;
    private mod3: AudioBufferSourceNode;
    private mod4: AudioBufferSourceNode;
    
    private mod1Gain: GainNode;
    private mod2Gain: GainNode;
    private mod3Gain: GainNode;
    private mod4Gain: GainNode;
    
    private modGain1: GainNode;
    private modGain2: GainNode;
    
    private fade1: AudioBufferSourceNode;
    private fade2: AudioBufferSourceNode;
    
    private mix1: GainNode;
    private mix2: GainNode;
    private bypassGain: GainNode;
    private effectGain: GainNode;
    
    private delay1: DelayNode;
    private delay2: DelayNode;

    constructor(context: AudioContext) {
        this.context = context;
        
        this.input = context.createGain();
        this.output = context.createGain();
        
        this.mod1 = context.createBufferSource();
        this.mod2 = context.createBufferSource();
        this.mod3 = context.createBufferSource();
        this.mod4 = context.createBufferSource();
        
        this.shiftDownBuffer = createDelayTimeBuffer(context, bufferTimeValue, fadeTimeValue, false);
        this.shiftUpBuffer = createDelayTimeBuffer(context, bufferTimeValue, fadeTimeValue, true);
        
        this.mod1.buffer = this.shiftDownBuffer;
        this.mod2.buffer = this.shiftDownBuffer;
        this.mod3.buffer = this.shiftUpBuffer;
        this.mod4.buffer = this.shiftUpBuffer;
        
        this.mod1.loop = true;
        this.mod2.loop = true;
        this.mod3.loop = true;
        this.mod4.loop = true;
        
        this.mod1Gain = context.createGain();
        this.mod2Gain = context.createGain();
        this.mod3Gain = context.createGain();
        this.mod3Gain.gain.value = 0;
        this.mod4Gain = context.createGain();
        this.mod4Gain.gain.value = 0;
        
        this.mod1.connect(this.mod1Gain);
        this.mod2.connect(this.mod2Gain);
        this.mod3.connect(this.mod3Gain);
        this.mod4.connect(this.mod4Gain);
        
        this.modGain1 = context.createGain();
        this.modGain2 = context.createGain();
        
        this.delay1 = context.createDelay();
        this.delay2 = context.createDelay();
        
        this.mod1Gain.connect(this.modGain1);
        this.mod2Gain.connect(this.modGain2);
        this.mod3Gain.connect(this.modGain1);
        this.mod4Gain.connect(this.modGain2);
        
        this.modGain1.connect(this.delay1.delayTime);
        this.modGain2.connect(this.delay2.delayTime);
        
        this.fade1 = context.createBufferSource();
        this.fade2 = context.createBufferSource();
        
        const fadeBuffer = createFadeBuffer(context, bufferTimeValue, fadeTimeValue);
        this.fade1.buffer = fadeBuffer;
        this.fade2.buffer = fadeBuffer;
        this.fade1.loop = true;
        this.fade2.loop = true;
        
        this.mix1 = context.createGain();
        this.mix2 = context.createGain();
        this.mix1.gain.value = 0;
        this.mix2.gain.value = 0;
        
        this.fade1.connect(this.mix1.gain);
        this.fade2.connect(this.mix2.gain);
        
        this.input.connect(this.delay1);
        this.input.connect(this.delay2);
        
        this.delay1.connect(this.mix1);
        this.delay2.connect(this.mix2);
        
        this.bypassGain = context.createGain();
        this.effectGain = context.createGain();
        this.bypassGain.gain.value = 1; // default to bypass if no pitch
        this.effectGain.gain.value = 0;

        this.input.connect(this.bypassGain);
        this.bypassGain.connect(this.output);

        this.mix1.connect(this.effectGain);
        this.mix2.connect(this.effectGain);
        this.effectGain.connect(this.output);
        
        const t = context.currentTime + 0.050;
        const t2 = t + bufferTimeValue - fadeTimeValue;
        
        this.mod1.start(t);
        this.mod2.start(t2);
        this.mod3.start(t);
        this.mod4.start(t2);
        this.fade1.start(t);
        this.fade2.start(t2);
        
        this.setDelay(delayTimeValue);
    }

    setDelay(delayTimeAmount: number) {
        this.modGain1.gain.setTargetAtTime(0.5 * delayTimeAmount, this.context.currentTime, 0.010);
        this.modGain2.gain.setTargetAtTime(0.5 * delayTimeAmount, this.context.currentTime, 0.010);
    }

    setPitchOffset(mult: number) {
        if (mult === 0) {
            this.bypassGain.gain.value = 1;
            this.effectGain.gain.value = 0;
            return;
        } else {
            this.bypassGain.gain.value = 0;
            this.effectGain.gain.value = 1;
        }

        if (mult > 0) { // pitch up
            this.mod1Gain.gain.value = 0;
            this.mod2Gain.gain.value = 0;
            this.mod3Gain.gain.value = 1;
            this.mod4Gain.gain.value = 1;
        } else { // pitch down
            this.mod1Gain.gain.value = 1;
            this.mod2Gain.gain.value = 1;
            this.mod3Gain.gain.value = 0;
            this.mod4Gain.gain.value = 0;
        }
        this.setDelay(delayTimeValue * Math.abs(mult));
    }

    disconnect() {
        try {
            this.mod1.stop();
            this.mod2.stop();
            this.mod3.stop();
            this.mod4.stop();
            this.fade1.stop();
            this.fade2.stop();
        } catch (e) {
            // Ignore error if already stopped
        }
        
        this.input.disconnect();
        this.output.disconnect();
        this.mod1Gain.disconnect();
        this.mod2Gain.disconnect();
        this.mod3Gain.disconnect();
        this.mod4Gain.disconnect();
        this.modGain1.disconnect();
        this.modGain2.disconnect();
        this.delay1.disconnect();
        this.delay2.disconnect();
        this.mix1.disconnect();
        this.mix2.disconnect();
    }
}
