import React, { useState } from 'react';
import { usePolls } from '@/contexts/PollsContext';
import { useTracking } from '@/contexts/TrackingContext';
import { Poll, PollQuestion, PollResponse } from '@/interfaces/utils/indexedDB';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trash2, Plus, GripVertical, CheckCircle, Circle, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Need to check if Select exists, otherwise default HTML select

const PollManager = () => {
    const { polls, createPoll, updatePoll, deletePoll, pollResponses, togglePollActive } = usePolls();
    const { trackEvent } = useTracking();
    const [isCreating, setIsCreating] = useState(false);
    const [isViewingResponses, setIsViewingResponses] = useState<string | null>(null);

    // Form Stats
    const [title, setTitle] = useState('');
    const [cooldownMinutes, setCooldownMinutes] = useState(0);
    const [forceShow, setForceShow] = useState(false);
    const [questions, setQuestions] = useState<PollQuestion[]>([]);

    const handleCreatePoll = () => {
        setIsCreating(true);
        setTitle('');
        setCooldownMinutes(0);
        setForceShow(false);
        setQuestions([]);
        setIsViewingResponses(null);
    };

    const addQuestion = () => {
        setQuestions([...questions, {
            id: crypto.randomUUID(),
            text: '',
            type: 'text',
            required: false,
            options: [],
            charLimit: 200
        }]);
    };

    const updateQuestion = (index: number, updates: Partial<PollQuestion>) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        setQuestions(newQuestions);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const savePoll = () => {
        if (!title) return alert('Title is required');

        const newPoll: Poll = {
            id: crypto.randomUUID(),
            title,
            active: false,
            questions,
            createdAt: new Date(),
            cooldownMinutes: cooldownMinutes > 0 ? cooldownMinutes : undefined,
            forceShow
        };

        createPoll(newPoll);
        trackEvent('create_poll', { pollId: newPoll.id, title: newPoll.title });
        setIsCreating(false);
    };

    const toggleActive = (poll: Poll) => {
        togglePollActive(poll.id);
    };

    if (isViewingResponses) {
        const poll = polls.find(p => p.id === isViewingResponses);
        const responses = pollResponses.filter(r => r.pollId === isViewingResponses);

        if (!poll) return <div>Poll not found</div>;

        return (
            <div className="space-y-4">
                <Button variant="outline" onClick={() => setIsViewingResponses(null)} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <h2 className="text-2xl font-bold">{poll.title} Results</h2>
                <div className="text-sm text-muted-foreground mb-4">{responses.length} responses</div>

                <div className="grid gap-6">
                    {poll.questions.map(q => {
                        const answers = responses.map(r => r.answers.find(a => a.questionId === q.id)?.value).filter(v => v !== undefined);

                        return (
                            <Card key={q.id}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{q.text}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {q.type === 'text' ? (
                                        <ul className="list-disc pl-5 space-y-1">
                                            {answers.map((ans, i) => (
                                                <li key={i} className="text-sm">{ans as string}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="space-y-2">
                                            {/* Simple count for choice questions */}
                                            {q.options?.map(opt => {
                                                const count = answers.reduce((acc, curr) => {
                                                    if (Array.isArray(curr)) return curr.includes(opt) ? acc + 1 : acc;
                                                    return curr === opt ? acc + 1 : acc;
                                                }, 0);
                                                const percent = responses.length > 0 ? (count / responses.length) * 100 : 0;
                                                return (
                                                    <div key={opt} className="flex items-center justify-between text-sm">
                                                        <span>{opt}</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                                                                <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                                                            </div>
                                                            <span className="w-8 text-right">{count}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        );
    }

    if (isCreating) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Create New Poll</h2>
                    <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="poll-title">Poll Title</Label>
                        <Input
                            id="poll-title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., User Satisfaction Survey"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="space-y-2 w-1/2">
                            <Label htmlFor="poll-cooldown">Cooldown (minutes)</Label>
                            <Input
                                id="poll-cooldown"
                                type="number"
                                min="0"
                                value={cooldownMinutes}
                                onChange={e => setCooldownMinutes(parseInt(e.target.value) || 0)}
                                placeholder="0 to disable"
                            />
                            <p className="text-[10px] text-muted-foreground">Time before showing another poll after this one.</p>
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Checkbox
                                id="poll-force"
                                checked={forceShow}
                                onCheckedChange={c => setForceShow(c as boolean)}
                            />
                            <Label htmlFor="poll-force">Force Show (Ignore Cooldown)</Label>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {questions.map((q, idx) => (
                        <Card key={q.id} className="relative">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <Label>Question {idx + 1}</Label>
                                    <Button variant="ghost" size="sm" onClick={() => removeQuestion(idx)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    value={q.text}
                                    onChange={e => updateQuestion(idx, { text: e.target.value })}
                                    placeholder="Question text..."
                                />

                                <div className="flex gap-4">
                                    <div className="w-1/2">
                                        <Label className="text-xs">Type</Label>
                                        <select
                                            className="w-full mt-1 border rounded p-2 text-sm bg-background"
                                            value={q.type}
                                            onChange={e => updateQuestion(idx, { type: e.target.value as any })}
                                        >
                                            <option value="text">Text Input</option>
                                            <option value="single">Single Select</option>
                                            <option value="multiple">Multiple Select</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center pt-6 space-x-2">
                                        <Checkbox
                                            id={`req-${q.id}`}
                                            checked={q.required}
                                            onCheckedChange={c => updateQuestion(idx, { required: c as boolean })}
                                        />
                                        <Label htmlFor={`req-${q.id}`}>Required</Label>
                                    </div>
                                </div>

                                {q.type === 'text' && (
                                    <div>
                                        <Label className="text-xs">Max Characters</Label>
                                        <Input
                                            type="number"
                                            value={q.charLimit}
                                            onChange={e => updateQuestion(idx, { charLimit: parseInt(e.target.value) })}
                                            className="w-24 mt-1"
                                        />
                                    </div>
                                )}

                                {(q.type === 'single' || q.type === 'multiple') && (
                                    <div className="space-y-2">
                                        <Label className="text-xs">Options</Label>
                                        <div className="space-y-2">
                                            {q.options?.map((opt, optIdx) => (
                                                <div key={optIdx} className="flex gap-2">
                                                    <Input
                                                        value={opt}
                                                        onChange={e => {
                                                            const newOptions = [...(q.options || [])];
                                                            newOptions[optIdx] = e.target.value;
                                                            updateQuestion(idx, { options: newOptions });
                                                        }}
                                                        placeholder={`Option ${optIdx + 1}`}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            const newOptions = [...(q.options || [])];
                                                            newOptions.splice(optIdx, 1);
                                                            updateQuestion(idx, { options: newOptions });
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const newOptions = [...(q.options || [])];
                                                    newOptions.push('');
                                                    updateQuestion(idx, { options: newOptions });
                                                }}
                                            >
                                                <Plus className="mr-2 h-4 w-4" /> Add Option
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    <Button variant="outline" className="w-full" onClick={addQuestion}>
                        <Plus className="mr-2 h-4 w-4" /> Add Question
                    </Button>
                </div>

                <div className="flex justify-end gap-2 pt-6">
                    <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                    <Button onClick={savePoll}>Save Poll</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Feedback Polls</h1>
                <Button onClick={handleCreatePoll}>
                    <Plus className="mr-2 h-4 w-4" /> Create Poll
                </Button>
            </div>

            <div className="grid gap-4">
                {polls.length === 0 && <p className="text-muted-foreground text-center py-10">No polls created yet.</p>}

                {polls.map(poll => (
                    <Card key={poll.id} className={poll.active ? "border-primary" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xl">{poll.title}</CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant={poll.active ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleActive(poll)}
                                >
                                    {poll.active ? <CheckCircle className="mr-2 h-4 w-4" /> : <Circle className="mr-2 h-4 w-4" />}
                                    {poll.active ? 'Active' : 'Inactive'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{poll.questions.length} Questions</span>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => {
                                        setIsViewingResponses(poll.id);
                                        trackEvent('view_poll_results', { pollId: poll.id });
                                    }}>
                                        View Results
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => deletePoll(poll.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default PollManager;
