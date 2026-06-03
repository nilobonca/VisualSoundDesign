import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { usePolls } from '@/contexts/PollsContext';
import { useTracking } from '@/contexts/TrackingContext';

export const FeedbackWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { unansweredPolls } = usePolls();
    const { trackEvent } = useTracking();

    const toggleOpen = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState) {
            trackEvent('open_feedback_widget');
        }
    };

    const hasUnanswered = unansweredPolls.length > 0;

    if (!hasUnanswered && !isOpen) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999]">
            <Button
                variant="outline"
                size="icon"
                className="rounded-full shadow-lg bg-background hover:bg-accent relative"
                onClick={toggleOpen}
            >
                <MessageSquarePlus className="w-5 h-5" />
                {hasUnanswered && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                )}
            </Button>
            {isOpen && <FeedbackModal onClose={() => setIsOpen(false)} />}
        </div>
    );
};
