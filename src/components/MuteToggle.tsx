'use client';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';

interface MuteToggleProps {
    isMuted: boolean;
    toggleMute: () => void;
}

export function MuteToggle({ isMuted, toggleMute }: MuteToggleProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="fixed bottom-4 right-4 z-50 text-white hover:bg-white/10 hover:text-white"
        >
            {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </Button>
    )
}
