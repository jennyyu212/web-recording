import { useState, useEffect } from "react";

const useVideoPlayer = (videoElement: any) => {
      const [playing, setPlaying] = useState(false);
      const [progress, setProgress] = useState(0);
      const [speed, setSpeed] = useState(1);
      const [muted, setMuted] = useState(false);

      const togglePlay = () => {
            setPlaying(!playing)
      };

      useEffect(() => {
            playing
                  ? videoElement.current.play()
                  : videoElement.current.pause();
      }, [playing, videoElement]);

      const handleOnTimeUpdate = () => {
            const newProgress = (videoElement.current.currentTime / videoElement.current.duration) * 100;
            setProgress(newProgress)
      };

      const handleVideoProgress = (event: any) => {
            const manualChange = Number(event.target.value);
            console.log(manualChange)
            videoElement.current.currentTime = (videoElement.current.duration / 100) * manualChange;
            setProgress(manualChange)
      };

      const handleVideoSpeed = (event: any) => {
            const newSpeed = Number(event.target.value);
            videoElement.current.playbackRate = speed;
            setSpeed(newSpeed)
      };

      const toggleMute = () => {
            setMuted(!muted)
      };

      useEffect(() => {
            muted
                  ? (videoElement.current.muted = true)
                  : (videoElement.current.muted = false);
      }, [muted, videoElement]);

      return {
            playing,
            progress,
            speed,
            muted,
            togglePlay,
            handleOnTimeUpdate,
            handleVideoProgress,
            handleVideoSpeed,
            toggleMute,
      };
};

export default useVideoPlayer;