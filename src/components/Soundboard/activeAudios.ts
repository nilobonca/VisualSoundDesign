import { Audios } from '@/interfaces/utils/indexedDB';
import { getSharedAudioContext } from '@/utils/audio/audioContext';
import { Jungle } from '@/utils/audio/jungle';

// Map storing playing audio elements alongside optional active pitch shifters and filters
export const activeSoundboardAudios = new Map<string, { sound: HTMLAudioElement; jungle?: Jungle; filterNode?: BiquadFilterNode }[]>();

let onPlayCallback: ((payload: any) => void) | null = null;
let onStopCallback: ((id: string) => void) | null = null;

export const setPlaySoundboardCallback = (cb: typeof onPlayCallback) => {
    onPlayCallback = cb;
};

export const setStopSoundboardCallback = (cb: typeof onStopCallback) => {
    onStopCallback = cb;
};

export const stopSoundboardAudio = (id: string) => {
    const list = activeSoundboardAudios.get(id);
    if (list) {
        list.forEach(item => {
            item.sound.pause();
            item.sound.currentTime = 0;
            if (item.jungle) {
                try {
                    item.jungle.disconnect();
                } catch (e) {}
            }
            if (item.filterNode) {
                try {
                    item.filterNode.disconnect();
                } catch (e) {}
            }
        });
        activeSoundboardAudios.delete(id);
    }
    if (onStopCallback) {
        onStopCallback(id);
    }
};

export const playSoundboardAudio = (id: string, audioUrl: string, mode: 'restart' | 'overlap', pitch?: number, volume?: number, audioId?: number, filterType?: 'none' | 'lowpass' | 'wall' | 'telephone') => {
    if (mode === 'restart') {
        stopSoundboardAudio(id);
    }

    const sound = new Audio(audioUrl);
    sound.volume = volume !== undefined ? volume : 1.0;
    let jungleInstance: Jungle | undefined;

    const ctx = getSharedAudioContext();
    let filterNode: BiquadFilterNode | undefined;

    if (ctx && (pitch !== undefined && pitch !== 1.0 || (filterType && filterType !== 'none'))) {
        try {
            const sourceNode = ctx.createMediaElementSource(sound);
            let currentNode: AudioNode = sourceNode;

            if (filterType && filterType !== 'none') {
                filterNode = ctx.createBiquadFilter();
                if (filterType === 'telephone') {
                    filterNode.type = 'bandpass';
                    filterNode.frequency.value = 1500;
                } else if (filterType === 'wall') {
                    filterNode.type = 'lowpass';
                    filterNode.frequency.value = 450;
                } else if (filterType === 'lowpass') {
                    filterNode.type = 'lowpass';
                    filterNode.frequency.value = 1000;
                }
                currentNode.connect(filterNode);
                currentNode = filterNode;
            }

            if (pitch !== undefined && pitch !== 1.0) {
                const jungle = new Jungle(ctx);
                jungle.setPitchOffset(pitch - 1.0);
                currentNode.connect(jungle.input);
                jungle.output.connect(ctx.destination);
                jungleInstance = jungle;
            } else {
                currentNode.connect(ctx.destination);
            }
        } catch (e) {
            console.error("Error creating audio nodes for soundboard audio:", e);
        }
    }

    const currentList = activeSoundboardAudios.get(id) || [];
    const playItem = { sound, jungle: jungleInstance, filterNode };
    activeSoundboardAudios.set(id, [...currentList, playItem]);

    sound.onended = () => {
        if (playItem.jungle) {
            try {
                playItem.jungle.disconnect();
            } catch (e) {}
        }
        if (playItem.filterNode) {
            try {
                playItem.filterNode.disconnect();
            } catch (e) {}
        }
        const updated = (activeSoundboardAudios.get(id) || []).filter(item => item !== playItem);
        if (updated.length === 0) {
            activeSoundboardAudios.delete(id);
        } else {
            activeSoundboardAudios.set(id, updated);
        }
    };

    sound.play().catch(err => console.error("Error playing soundboard audio:", err));
    
    if (onPlayCallback) {
        onPlayCallback({
            soundboardItemId: id,
            url: audioUrl,
            audioId,
            mode,
            pitch: pitch || 1.0,
            volume: volume !== undefined ? volume : 1.0,
            filterType: filterType || 'none'
        });
    }

    return sound;
};
