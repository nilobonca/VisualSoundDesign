let sharedAudioCtx: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!sharedAudioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
            sharedAudioCtx = new AudioCtxClass();
        }
    }
    return sharedAudioCtx;
}

export const resumeAudioContext = async () => {
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
    }
};

if (typeof window !== 'undefined') {
    const resumeOnGesture = () => {
        resumeAudioContext();
        window.removeEventListener('click', resumeOnGesture);
        window.removeEventListener('keydown', resumeOnGesture);
    };
    window.addEventListener('click', resumeOnGesture);
    window.addEventListener('keydown', resumeOnGesture);
}
