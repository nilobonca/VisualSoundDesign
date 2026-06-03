import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
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
    const [isLoading, setIsLoading] = useState(true);
    const [answeredPollIds, setAnsweredPollIds] = useState<string[]>([]);

    const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);

    useEffect(() => {
        // Load answered polls and last response time from localStorage on mount
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

    const loadPolls = async () => {
        setIsLoading(true);
        // Fetch polls
        const { data: pollsData, error: pollsError } = await supabase
            .from('polls')
            .select('*')
            .order('created_at', { ascending: false });

        if (pollsError) console.error('Error loading polls:', pollsError);
        else setPolls(pollsData || []);

        // Fetch responses
        // NOTE: In a real app with many responses, we wouldn't fetch ALL. 
        // But for this use case, we fetch all to calculate stats on client.
        const { data: responsesData, error: responsesError } = await supabase
            .from('poll_responses')
            .select('*');

        if (responsesError) console.error('Error loading responses:', responsesError);
        else setPollResponses(responsesData || []);

        setIsLoading(false);
    };

    useEffect(() => {
        loadPolls();

        // Optional: Realtime subscription could go here
    }, []);

    useEffect(() => {
        // Filter out answered polls and handle cooldown
        const now = Date.now();

        const filtered = polls.filter(p => {
            // 0. Base check: must be active
            if (!p.active) return false;

            // 1. Check if already answered
            if (answeredPollIds.includes(p.id)) return false;

            // 2. Check Force Show (Ignore cooldown if true)
            if (p.forceShow) return true;

            // 3. Check Cooldown
            if (p.cooldownMinutes && lastResponseTime) {
                const cooldownMs = p.cooldownMinutes * 60 * 1000;
                if (now - lastResponseTime < cooldownMs) {
                    return false; // Still in cooldown
                }
            }

            return true;
        });

        setUnansweredPolls(filtered);
    }, [polls, answeredPollIds, lastResponseTime]);


    const createPoll = async (poll: Poll) => {
        // We exclude 'id' if we want Supabase to generate it, but our Poll interface generates UUID on client.
        // It's fine to rely on client UUID if column supports it.
        const { error } = await supabase
            .from('polls')
            .insert([{
                id: poll.id,
                title: poll.title,
                active: poll.active,
                questions: poll.questions,
                created_at: new Date().toISOString(),
                cooldown_minutes: poll.cooldownMinutes,
                force_show: poll.forceShow
            }]);

        if (error) console.error('Error creating poll:', error);
        else {
            setPolls(prev => [poll, ...prev]);
        }
    };

    const updatePoll = async (poll: Poll) => {
        const { error } = await supabase
            .from('polls')
            .update({
                title: poll.title,
                active: poll.active,
                questions: poll.questions,
                cooldown_minutes: poll.cooldownMinutes,
                force_show: poll.forceShow
            })
            .eq('id', poll.id);

        if (error) console.error('Error updating poll:', error);
        else {
            setPolls(prev => prev.map(p => p.id === poll.id ? poll : p));
        }
    };

    const deletePoll = async (id: string) => {
        const { error } = await supabase
            .from('polls')
            .delete()
            .eq('id', id);

        if (error) console.error('Error deleting poll:', error);
        else {
            setPolls(prev => prev.filter(p => p.id !== id));
        }
    };

    const togglePollActive = async (id: string) => {
        // 1. Deactivate others locally and remotely
        // This is tricky with Supabase RLS policies if we don't have update rights, but we assume admin rights.
        // Batch update? Supabase doesn't easily support "update active where active=true" without logic.
        // We'll iterate for simplicity or use a function if we had one.

        // Deactivate currently active poll(s)
        const activePolls = polls.filter(p => p.active && p.id !== id);
        for (const p of activePolls) {
            await supabase.from('polls').update({ active: false }).eq('id', p.id);
        }

        // Activate target
        // First check if target is currently active to toggle OFF?
        const target = polls.find(p => p.id === id);
        const newState = !target?.active;

        await supabase.from('polls').update({ active: newState }).eq('id', id);

        // Refresh state
        loadPolls();
    };

    const submitResponse = async (response: PollResponse) => {
        const { error } = await supabase
            .from('poll_responses')
            .insert([{
                id: response.id,
                poll_id: response.pollId,
                answers: response.answers,
                submitted_at: new Date().toISOString()
            }]);

        if (error) console.error('Error submitting response:', error);
        else {
            setPollResponses(prev => [...prev, response]);

            // Mark as answered locally
            const newAnswered = [...answeredPollIds, response.pollId];
            setAnsweredPollIds(newAnswered);
            localStorage.setItem('answeredPollIds', JSON.stringify(newAnswered));

            // Save timestamp for cooldown
            const now = Date.now();
            setLastResponseTime(now);
            localStorage.setItem('lastResponseTime', now.toString());
        }
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
