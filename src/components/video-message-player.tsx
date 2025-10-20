
'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoMessagePlayerProps {
    videoUrl: string;
}

const VideoMessagePlayer: React.FC<VideoMessagePlayerProps> = ({ videoUrl }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleEnded = () => {
            setIsPlaying(false);
            // Optionally shrink back when video ends
            // setIsExpanded(false);
        };
        
        video.addEventListener('ended', handleEnded);
        
        // Mute by default in small circle view
        video.muted = !isExpanded;

        return () => {
            video.removeEventListener('ended', handleEnded);
        };
    }, [isExpanded]);
    
    useEffect(() => {
        // Autoplay when expanded
        if(isExpanded && videoRef.current) {
            videoRef.current.play().catch(e => console.error("Video autoplay failed", e));
            setIsPlaying(true);
        }
    }, [isExpanded])

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        if (!isExpanded) {
            setIsExpanded(true);
            return;
        }

        if (video.paused) {
            video.play().catch(e => console.error("Video play failed", e));
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };
    
    const handleContainerClick = () => {
        setIsExpanded(!isExpanded);
         if(isExpanded && videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }

    return (
        <motion.div
            layout
            initial={{ borderRadius: '50%' }}
            animate={{ borderRadius: isExpanded ? '1rem' : '50%' }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
                'relative w-48 h-48 bg-black cursor-pointer overflow-hidden',
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
                loop={!isExpanded} // Loop when small
                muted={!isExpanded} // Mute when small
                className="w-full h-full object-cover scale-[1.3]" // Scale to fill circle
                onLoadedData={() => {
                    // Autoplay muted when small
                    if(!isExpanded && videoRef.current) {
                         videoRef.current.play().catch(e => {});
                    }
                }}
            />
            <AnimatePresence>
                {(isHovered || isExpanded) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/30 flex items-center justify-center"
                        onClick={togglePlay}
                    >
                         {!isPlaying && isExpanded && (
                            <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <Play className="w-6 h-6 text-white" />
                            </div>
                        )}
                        {isPlaying && isExpanded && (
                             <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <Pause className="w-6 h-6 text-white" />
                            </div>
                        )}
                        {!isExpanded && (
                            <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <Maximize className="w-6 h-6 text-white" />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default VideoMessagePlayer;

