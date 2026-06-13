import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Poll, PollResponse, PollQuestion } from '@/interfaces/utils/indexedDB';

interface PollsContextProps {
    polls: Poll[];
    unansweredPolls: Poll[];
    createPoll: (poll: Poll) => Promise<void>;
    updatePoll: (poll: Poll) => Promise<void>;
    deletePoll: (id: string) => Promise<void>;
    togglePollActive: (id: string) => Promise<void>;
    pollResponses: PollResponse[];
    submitResponse: (response: PollResponse) => Promise<void>;
    isLoading: boolean;
}

const PollsContext = createContext<PollsContextProps | undefined>(undefined);

export const PollsProvider = ({ children }: { children: ReactNode }) => {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [unansweredPolls, setUnansweredPolls] = useState<Poll[]>([]);
    const [pollResponses, setPollResponses] = useState<PollResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [answeredPollIds, setAnsweredPollIds] = useState<string[]>([]);
    const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('answeredPollIds');
        const storedTime = localStorage.getItem('lastResponseTime');
        if (stored) {
            try {
                setAnsweredPollIds(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse answered polls", e);
            }
        }
        if (storedTime) {
            setLastResponseTime(parseInt(storedTime));
        }
    }, []);

    useEffect(() => {
        const now = Date.now();
        const filtered = polls.filter(p => {
            if (!p.active) return false;
            if (answeredPollIds.includes(p.id)) return false;
            if (p.forceShow) return true;
            if (p.cooldownMinutes && lastResponseTime) {
                const cooldownMs = p.cooldownMinutes * 60 * 1000;
                if (now - lastResponseTime < cooldownMs) {
                    return false;
                }
            }
            return true;
        });
        setUnansweredPolls(filtered);
    }, [polls, answeredPollIds, lastResponseTime]);

    const createPoll = async (poll: Poll) => {
        setPolls(prev => [poll, ...prev]);
    };

    const updatePoll = async (poll: Poll) => {
        setPolls(prev => prev.map(p => p.id === poll.id ? poll : p));
    };

    const deletePoll = async (id: string) => {
        setPolls(prev => prev.filter(p => p.id !== id));
    };

    const togglePollActive = async (id: string) => {
        setPolls(prev => prev.map(p => {
            if (p.id === id) return { ...p, active: !p.active };
            return { ...p, active: false }; // deactivate others
        }));
    };

    const submitResponse = async (response: PollResponse) => {
        setPollResponses(prev => [...prev, response]);
        const newAnswered = [...answeredPollIds, response.pollId];
        setAnsweredPollIds(newAnswered);
        localStorage.setItem('answeredPollIds', JSON.stringify(newAnswered));
        const now = Date.now();
        setLastResponseTime(now);
        localStorage.setItem('lastResponseTime', now.toString());
    };

    return (
        <PollsContext.Provider value={{
            polls,
            unansweredPolls,
            createPoll,
            updatePoll,
            deletePoll,
            togglePollActive,
            pollResponses,
            submitResponse,
            isLoading
        }}>
            {children}
        </PollsContext.Provider>
    );
};

export const usePolls = () => {
    const context = useContext(PollsContext);
    if (context === undefined) {
        throw new Error('usePolls must be used within a PollsProvider');
    }
    return context;
};
