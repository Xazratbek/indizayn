
'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface VideoMessagePlayerProps {
    videoUrl: string;
}

const VideoMessagePlayer: React.FC<VideoMessagePlayerProps> = ({ videoUrl }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [hasPlayedOnce, setHasPlayedOnce] = useState(false);

    const handleEnded = () => {
        setIsPlaying(false);
        setHasPlayedOnce(true);
        // Automatically collapse when video ends
        setIsExpanded(false); 
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Mute by default in small circle view
        video.muted = !isExpanded;
        video.loop = false; // Ensure loop is always false for main playback

        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('ended', handleEnded);
        };
    }, [isExpanded]);
    
    useEffect(() => {
        // Autoplay with sound when expanded
        if(isExpanded && videoRef.current) {
            videoRef.current.play().catch(e => console.error("Video autoplay failed", e));
            setIsPlaying(true);
        }
    }, [isExpanded]);

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play().catch(e => console.error("Video play failed", e));
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };
    
    const handleContainerClick = () => {
        if (!isExpanded) {
            setIsExpanded(true);
        } else {
            // In expanded view, clicking the container toggles play/pause
            togglePlay();
        }
    }

    const handleToggleSize = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };


    return (
        <motion.div
            layout
            initial={{ borderRadius: '50%' }}
            animate={{ borderRadius: isExpanded ? '1rem' : '50%' }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
                'relative w-48 h-48 bg-black cursor-pointer overflow-hidden shadow-lg',
                isExpanded && 'w-72 h-72'
            )}
            onClick={handleContainerClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.video
                ref={videoRef}
                layout
                src={videoUrl}
                playsInline
                className="w-full h-full object-cover scale-[1.4]" // Scale to fill circle
                onLoadedData={() => {
                    // Autoplay muted and looping only when small and if it hasn't played once
                     if(!isExpanded && videoRef.current && !hasPlayedOnce) {
                         videoRef.current.loop = true;
                         videoRef.current.muted = true;
                         videoRef.current.play().catch(e => {});
                    } else if (videoRef.current) {
                        videoRef.current.loop = false;
                    }
                }}
            />
            <AnimatePresence>
                {(isHovered || isExpanded) && !isPlaying && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/30 flex items-center justify-center"
                    >
                         <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center" onClick={togglePlay}>
                            <Play className="w-6 h-6 text-white" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
             <div className="absolute bottom-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
                    onClick={handleToggleSize}
                >
                    {isExpanded ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
            </div>
        </motion.div>
    );
};

export default VideoMessagePlayer;
