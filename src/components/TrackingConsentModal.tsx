import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TrackingConsentModalProps {
    onComplete: (name: string | null) => void;
}

export const TrackingConsentModal: React.FC<TrackingConsentModalProps> = ({ onComplete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        // Check if user has already made a choice
        const choice = localStorage.getItem('tracking_consent_choice');
        if (!choice) {
            setIsOpen(true);
        }
    }, []);

    const handleAccept = () => {
        if (!name.trim()) return;
        localStorage.setItem('tracking_consent_choice', 'accepted');
        localStorage.setItem('tracking_user_name', name.trim());
        setIsOpen(false);
        onComplete(name.trim());
    };

    const handleDecline = () => {
        localStorage.setItem('tracking_consent_choice', 'declined');
        setIsOpen(false);
        onComplete(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Ajudar a melhorar o App?</DialogTitle>
                    <DialogDescription>
                        Gostaríamos de monitorar como você usa o sistema para melhorá-lo.
                        Podemos identificar você nessas estatísticas?
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Seu Nome
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Nilo"
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={handleDecline} className="sm:w-auto w-full">
                        Prefiro não me identificar
                    </Button>
                    <Button onClick={handleAccept} disabled={!name.trim()} className="sm:w-auto w-full">
                        Sim, pode usar meu nome
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
