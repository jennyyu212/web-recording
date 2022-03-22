import * as React from 'react';
import "./recordingBox.scss";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { VideoBox } from "./videoBox"
import useVideoPlayer from "./useVideoPlayer";

interface RecordingBoxProps {

}

enum RecordingStatus {
      Recording,
      Stopped,
      Paused
}


export function RecordingBox() {

      const [playing, setPlaying] = useState(false);
      const [progress, setProgress] = useState(0);
      const [speed, setSpeed] = useState(1);
      const [muted, setMuted] = useState(false);

      const [videos, setVideos] = useState<string[]>([]);
      const [currentVid, setCurrentVid] = useState<number>(0);
      let videoElement: HTMLVideoElement | null = null;

      let recorder: any
      const DEFAULT_MEDIA_CONSTRAINTS = {
            video: {
                  width: 1280,
                  height: 720,
            },
            audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  sampleRate: 44100
            }
      }

      

      useEffect(() => {
            if (!navigator.mediaDevices) {
                  console.log('This browser does not support getUserMedia.')
            }
            videoElement = document.getElementById('video') as HTMLVideoElement;
            // this.startShowingStream();
      })

      useEffect(() => {
            videoElement!.srcObject = null
            videoElement!.src = videos[currentVid]
            videoElement!.muted = false
            
            playing
                  ? videoElement!.play()
                  : videoElement!.pause();
      }, [playing, videoElement]);


      const getMediaStream = async (mediaConstraints = DEFAULT_MEDIA_CONSTRAINTS) => {
            const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
            return stream
      }

      const startShowingStream = async () => {
            const stream = await getMediaStream();

            videoElement!.src = ""
            videoElement!.srcObject = stream
            videoElement!.muted = true

            return stream
      }

      const record = async () => {
            const stream = await startShowingStream();

            recorder = new MediaRecorder(stream)

            // temporary chunks of video
            let chunks: any = []

            recorder.ondataavailable = (event: any) => {
                  // store the video chunks as it is recording
                  console.log("data available")
                  if (event.data.size > 0) {
                        chunks.push(event.data)
                  }
            }

            recorder.onstop = () => {
                  // if we have a last portion
                  if (chunks.length !== 0) {
                        // create a url for the last portion
                        const blob = new Blob(chunks, {
                              type: 'video/webm'
                        })
                        const blobUrl = URL.createObjectURL(blob)

                        // append the current portion to the video pieces
                        setVideos([...videos, blobUrl])

                        // reset the temporary chunks
                        chunks = []
                  }

                  // start playing the last portion
                  // playFromStart()
            }

            // recording paused
            recorder.onpause = () => {

                  // create a url for the current portion
                  const blob = new Blob(chunks, {
                        type: 'video/webm'
                  })
                  const blobUrl = URL.createObjectURL(blob)
                  console.log(blobUrl)

                  // reset the temporary chunks
                  chunks = []

                  // append the current portion to the video pieces
                  setVideos([...videos, blobUrl])

                  // start playing the last portion
                  playVideoPiece(videos.length - 1)
                  // this.playVideoPiece(this.state.videos.length - 1)

            }

            recorder.onresume = async () => {
                  await startShowingStream();
            }

            recorder.start(200)
      }


      const stop = () => {
            recorder.stream.getTracks().forEach((track: any) => track.stop())
      }

      const pauseOrResume = () => {
            if (recorder.state === "recording") {
                  recorder.pause();
            } else if (recorder.state === "paused") {
                  recorder.resume();
            }
      }

      const playVideoPiece = (idx: number) => {
            videoElement!.srcObject = null
            videoElement!.src = videos[currentVid]
            videoElement!.muted = false
      }

      const playFromStart = () => {
            playVideoPiece(0)
            videoElement!.onended = () => {
                  currentVid >= videos.length - 1 ? setCurrentVid(0) : setCurrentVid(currentVid + 1)
                  playVideoPiece(currentVid)
            }
      }

      const clearPrevious = () => {
            // removes the last piece
            const numVideos = videos.length
            setVideos(videos.filter((_, idx) => idx !== numVideos - 1));

            // play the previous piece if there is one
            if (videos.length > 0) {
                  playVideoPiece(videos.length - 1)
            }

      }

      const handleVideoProgress = (event: any) => {
            const manualChange = Number(event.target.value);
            videoElement!.currentTime = (videoElement!.duration / 100) * manualChange;
            setProgress(manualChange)
      };

      const handleVideoSpeed = (event: any) => {
            const newSpeed = Number(event.target.value);
            videoElement!.playbackRate = speed;
            setSpeed(newSpeed)
      };

      return (
            <div className="container">
                  <div className="video-wrapper">
                        <video id="video" 
                              autoPlay 
                              muted
                        />
                        <div className="controls">
                                    <div className="actions">
                                          <button
                                                onClick={() => setPlaying(!playing)}>
                                                {!playing ? (
                                                      <p>play</p>
                                                      // <i className="bx bx-play"></i>
                                                ) : (
                                                      <p>pause</p>
                                                      // <i className="bx bx-pause"></i>
                                                )}
                                          </button>
                                    </div>
                                    <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          value={progress}
                                          onChange={(e) => handleVideoProgress(e)}
                                    />
                                    <select
                                          className="velocity"
                                          value={speed}
                                          onChange={(e) => handleVideoSpeed(e)}
                                    >
                                          <option value="0.50">0.50x</option>
                                          <option value="1">1x</option>
                                          <option value="1.25">1.25x</option>
                                          <option value="2">2x</option>
                                    </select>
                                    
                                    <button className="mute-btn" onClick={() => setMuted(!muted)}>
                                          {!muted ? (
                                                <i className="bx bxs-volume-full"></i>
                                          ) : (
                                                <i className="bx bxs-volume-mute"></i>
                                          )}
                                    </button> 
                              </div>

                        <div>
                              <button onClick={record}>Record</button>
                              <button onClick={stop}>Stop</button>
                              <button onClick={pauseOrResume}>Pause/Resume</button>
                              <button onClick={clearPrevious}>Clear Previous</button>
                        </div>
                        
                  </div>
                  {videos.map((elt, idx) => {
                              return <p>{elt}</p>
                        })}
            </div>)
}