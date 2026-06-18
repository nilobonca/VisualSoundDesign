
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePolls } from '@/contexts/PollsContext';
import { Poll, PollResponse } from '@/interfaces/utils/indexedDB';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface FeedbackModalProps {
    onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
    const { unansweredPolls, submitResponse } = usePolls();
    const [activePoll, setActivePoll] = useState<Poll | null>(null);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        // Find the first unanswered poll
        const current = unansweredPolls[0];
        setActivePoll(current || null);
    }, [unansweredPolls]);

    const handleInputChange = (questionId: string, value: string | string[]) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleCheckboxChange = (questionId: string, value: string, checked: boolean) => {
        setAnswers(prev => {
            const current = (prev[questionId] as string[]) || [];
            if (checked) {
                return { ...prev, [questionId]: [...current, value] };
            } else {
                return { ...prev, [questionId]: current.filter(v => v !== value) };
            }
        });
    };

    const handleSubmit = () => {
        if (!activePoll) return;

        // Basic Validation
        for (const q of activePoll.questions) {
            if (q.required && !answers[q.id]) {
                alert(`Please answer "${q.text}"`);
                return;
            }
        }

        const response: PollResponse = {
            id: uuidv4(),
            pollId: activePoll.id,
            answers: Object.entries(answers).map(([qid, val]) => ({
                questionId: qid,
                value: val
            })),
            submittedAt: new Date()
        };

        submitResponse(response);
        setSubmitted(true);
        setTimeout(() => {
            onClose();
            setSubmitted(false);
            setAnswers({});
        }, 2000);
    };

    if (!activePoll) {
        return (
            <Card className="absolute top-12 right-0 w-80 shadow-xl animate-in fade-in slide-in-from-top-5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Feedback</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No active polls at the moment.</p>
                </CardContent>
            </Card>
        );
    }

    if (submitted) {
        return (
            <Card className="absolute top-12 right-0 w-80 shadow-xl animate-in fade-in slide-in-from-top-5 border-green-500">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                        <div className="text-2xl">🎉</div>
                        <h3 className="font-semibold text-green-600">Thank You!</h3>
                        <p className="text-sm text-muted-foreground">Your feedback has been recorded.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="absolute top-12 right-0 w-80 max-h-[80vh] overflow-y-auto shadow-xl animate-in fade-in slide-in-from-top-5 z-[1000]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="grid gap-1">
                    <CardTitle>{activePoll.title}</CardTitle>
                    <CardDescription>We value your opinion.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="-mt-4 -mr-4"><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="grid gap-4 py-4">
                {activePoll.questions.map((q) => (
                    <div key={q.id} className="grid gap-2">
                        <Label htmlFor={q.id}>
                            {q.text} {q.required && <span className="text-red-500">*</span>}
                        </Label>

                        {q.type === 'text' && (
                            <Input
                                id={q.id}
                                value={answers[q.id] as string || ''}
                                onChange={(e) => handleInputChange(q.id, e.target.value)}
                                maxLength={q.charLimit}
                                placeholder="Type your answer..."
                            />
                        )}

                        {q.type === 'single' && q.options && (
                            <RadioGroup
                                onValueChange={(val) => handleInputChange(q.id, val)}
                                value={answers[q.id] as string}
                            >
                                {q.options.map((opt, i) => (
                                    <div key={i} className="flex items-center space-x-2">
                                        <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
                                        <Label htmlFor={`${q.id}-${i}`} className="font-normal">{opt}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}

                        {q.type === 'multiple' && q.options && (
                            <div className="grid gap-2">
                                {q.options.map((opt, i) => (
                                    <div key={i} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`${q.id}-${i}`}
                                            checked={(answers[q.id] as string[] || []).includes(opt)}
                                            onCheckedChange={(checked) => handleCheckboxChange(q.id, opt, checked as boolean)}
                                        />
                                        <Label htmlFor={`${q.id}-${i}`} className="font-normal">{opt}</Label>
                                    </div>
                                ))}
                            </div>
                        )}
                        {q.charLimit && q.type === 'text' && (
                            <div className="text-xs text-right text-muted-foreground">
                                {(answers[q.id] as string || '').length} / {q.charLimit}
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleSubmit}>Submit</Button>
            </CardFooter>
        </Card>
    );
};

export default FeedbackModal;
