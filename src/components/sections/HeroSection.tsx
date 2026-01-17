'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Calendar, Play, Pause, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';

const HeroSection = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [hasWatchedVideo, setHasWatchedVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoError = () => {
    setShowVideo(false);
  };

  const toggleOverlay = () => {
    setShowOverlay(!showOverlay);
    // Don't affect sound when toggling overlay
  };

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      // Try to play the video automatically with sound
      video.muted = false;
      setIsMuted(false);
      video.play().catch(err => {
        console.log('Autoplay with sound failed, trying muted:', err);
        // If autoplay with sound fails, try muted
        video.muted = true;
        setIsMuted(true);
        video.play().catch(playErr => {
          console.log('Autoplay failed completely:', playErr);
          setIsPlaying(false);
        });
      });
      
      const handleVideoEnd = () => {
        console.log('Video ended');
        setHasWatchedVideo(true);
        // Don't auto-show overlay on video end
      };

      const handleTimeUpdate = () => {
        // Track video progress but don't auto-show overlay
        if (video.duration && (video.currentTime / video.duration > 0.8 || video.currentTime > 10)) {
          if (!hasWatchedVideo) {
            console.log('Video watched threshold reached');
            setHasWatchedVideo(true);
            // Don't auto-show overlay anymore
          }
        }
      };

      video.addEventListener('ended', handleVideoEnd);
      video.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        video.removeEventListener('ended', handleVideoEnd);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [hasWatchedVideo, showOverlay]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'rgb(253, 251, 247)' }}>
      {/* Video/Image Background */}
      <div className="absolute inset-0">
        {showVideo ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover md:object-cover object-center hero-video"
              style={{
                minHeight: '100vh',
                minWidth: '100vw'
              }}
              poster="/invitation-poster.jpg"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onError={handleVideoError}
              onLoadedData={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                }
              }}
            >
              <source src="/invitation-video.mp4" type="video/mp4" />
            </video>
            
            {/* Video overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-deep-blue/70 via-deep-blue/20 to-deep-blue/50"></div>
            
            {/* Subtle unmute hint */}
            
            {/* Video controls */}
            <div className="absolute bottom-6 right-6 z-30">
              <div className="flex space-x-3 items-center">
                <button
                  onClick={togglePlay}
                  className="bg-white/20 backdrop-blur-sm border border-white/30 text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300 shadow-lg"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleMute}
                  className="bg-white/20 backdrop-blur-sm border border-white/30 text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300 shadow-lg"
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                
                {/* Overlay toggle button */}
                <button
                  onClick={toggleOverlay}
                  className="bg-pacific-cyan/80 backdrop-blur-sm border border-white/30 text-white p-3 rounded-full hover:bg-pacific-cyan transition-all duration-300 shadow-lg"
                  aria-label={showOverlay ? "Hide text overlay" : "Show text overlay"}
                >
                  {showOverlay ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img
              src="/invitation-poster.jpg"
              alt="Chanika & David Wedding Invitation"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-deep-blue/60 via-transparent to-deep-blue/40"></div>
          </div>
        )}
      </div>
      
      {/* Elegant floating elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-sparkle opacity-60"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-pacific-cyan/60 rounded-full animate-sparkle opacity-80" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3/4 left-1/2 w-1.5 h-1.5 bg-white/30 rounded-full animate-sparkle opacity-50" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-pacific-cyan/40 rounded-full animate-sparkle opacity-70" style={{ animationDelay: '6s' }}></div>
      </div>

      {/* Content Overlay */}
      {showOverlay && (
        <div className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto transition-all duration-500 ease-in-out bg-deep-blue/30 backdrop-blur-sm rounded-3xl p-8">
          <div className="animate-fade-in-up">
            {/* Elegant introduction text */}
            <div className="mb-8">
              <p className="font-poppins text-lg md:text-xl font-light mb-4 tracking-wide opacity-90">
                You're Cordially Invited
              </p>
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-12 h-0.5 bg-pacific-cyan/80"></div>
                <Heart className="w-5 h-5 text-pacific-cyan animate-pulse" />
                <div className="w-12 h-0.5 bg-pacific-cyan/80"></div>
              </div>
            </div>
            
            <h1 className="font-dancing text-5xl md:text-7xl lg:text-8xl font-bold italic mb-8 leading-tight text-shadow-lg">
              Chanika & David
            </h1>
            
            <div className="bg-white/40 backdrop-blur-lg border border-white/60 rounded-2xl p-6 md:p-8 mb-8 shadow-2xl">
              <p className="font-poppins text-xl md:text-2xl font-light mb-6 tracking-wide">
                Where Dreams Come True ✨
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-center space-x-3">
                  <Calendar className="w-5 h-5 text-pacific-cyan" />
                  <span className="font-poppins text-lg font-medium">Saturday, January 31, 2026 • 3:00 PM</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <MapPin className="w-5 h-5 text-pacific-cyan" />
                  <span className="font-poppins text-lg font-medium">COMO Point Yamu, Phuket, Thailand</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button 
                size="lg" 
                className="bg-pacific-cyan hover:bg-honolulu-blue text-deep-blue font-semibold px-8 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                onClick={() => scrollToSection('rsvp')}
              >
                RSVP Now
              </Button>
              <Button 
                size="lg"
                className="bg-white/15 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-white/25 hover:border-white/60 font-semibold px-8 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                onClick={() => scrollToSection('schedule')}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
