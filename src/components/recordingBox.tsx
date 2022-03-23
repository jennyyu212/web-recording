import * as React from 'react';
import "./recordingBox.scss";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { ProgressBar } from "./progressBar"
import useVideoPlayer from "./useVideoPlayer";

interface RecordingBoxProps {

}

enum RecordingStatus {
      Recording,
      Stopped,
      Paused
}

interface VideoSegment {
      url: string,
      duration: number
}


export function RecordingBox() {

      const [recording, setRecording] = useState(false);
      const [recordingTimer, setRecordingTimer] = useState(0); // unit is 0.01 second
      const [playing, setPlaying] = useState(false);
      const [progress, setProgress] = useState(0);
      const [speed, setSpeed] = useState(1);
      const [muted, setMuted] = useState(false);

      const [videos, setVideos] = useState<VideoSegment[]>([]);
      // const [videos, setVideos] = useState<string[]>([]);
      const [currentVid, setCurrentVid] = useState<number>(0);
      const recorder = useRef<MediaRecorder | null>(null);

      let videoElement: HTMLVideoElement | null = null;
      // let recorder: any;

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
            // check if the browser supports media devices on first load
            if (!navigator.mediaDevices) {
                  console.log('This browser does not support getUserMedia.')
            }
      }, [])

      useEffect(() => {
            // get access to the video element on every render
            videoElement = document.getElementById('video') as HTMLVideoElement;
      })

      useEffect(() => {
            if (playing) {
                  videoElement!.srcObject = null
                  videoElement!.src = videos[currentVid].url
                  videoElement!.muted = false
                  videoElement!.play()
            } else {
                  videoElement!.pause();
            }
      }, [playing, videoElement]);

      useEffect(() => {
            let interval: any = null;
            if (recording) {
                  interval = setInterval(() => {
                        setRecordingTimer(unit => unit + 1);
                  }, 10);
            } else if (!recording && recordingTimer !== 0) {
                  clearInterval(interval);
            }
            return () => clearInterval(interval);
      }, [recording])

      useEffect(() => {
            setVideoProgressHelper(recordingTimer)
      }, [recordingTimer])

      useEffect(() => {
            console.log(videos)
      }, [videos])

      const setVideoProgressHelper = (progress: number) => {
            const newProgress = (progress / 10000) * 100;
            setProgress(newProgress)
      }
      const startShowingStream = async (mediaConstraints = DEFAULT_MEDIA_CONSTRAINTS) => {
            const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)

            videoElement!.src = ""
            videoElement!.srcObject = stream
            videoElement!.muted = true

            return stream
      }

      const record = async () => {
            const stream = await startShowingStream();
            recorder.current = new MediaRecorder(stream)

            // temporary chunks of video
            let chunks: any = []
            recorder.current.ondataavailable = (event: any) => {
                  // store the video chunks as it is recording
                  console.log("data available")
                  if (event.data.size > 0) {
                        chunks.push(event.data)
                  }
            }

            recorder.current.onstart = () => {
                  console.log("on start")
                  setRecording(true);
            }

            recorder.current.onstop = () => {
                  console.log("on stop")
                  // if we have a last portion
                  if (chunks.length !== 0) {
                        // create a url for the last portion
                        const blob = new Blob(chunks, {
                              type: 'video/webm'
                        })
                        const blobUrl = URL.createObjectURL(blob)

                        // append the current portion to the video pieces
                        setVideos(videos => [...videos, {url: blobUrl, duration: recordingTimer}])

                        // reset the temporary chunks
                        chunks = []
                  }

                  setRecording(false);

                  // start playing the last portion
                  // playFromStart()
            }

            // recording paused
            recorder.current.onpause = () => {

                  // create a url for the current portion
                  const blob = new Blob(chunks, {
                        type: 'video/webm'
                  })
                  const blobUrl = URL.createObjectURL(blob)
                  console.log(blobUrl)

                  // reset the temporary chunks
                  chunks = []

                  // append the current portion to the video pieces
                  setVideos(videos => [...videos, {url: blobUrl, duration: recordingTimer}])

                  // start playing the last portion
                  // playVideoPiece(videos.length - 1)

                  setRecording(false);
            }

            recorder.current.onresume = async () => {
                  await startShowingStream();

                  setRecording(true);
            }

            recorder.current.start(200)
      }


      const stop = () => {
            if (recorder.current) {
                  if (recorder.current.state !== "inactive") {
                        recorder.current.stream.getTracks().forEach((track: any) => track.stop())
                  }
            }
      }

      const pause = () => {
            if (recorder.current) {
                  if (recorder.current.state === "recording") {
                        recorder.current.pause();
                  }
            }
      }

      const startOrResume = () => {
            if (!recorder.current || recorder.current.state === "inactive") {
                  record();
            } else if (recorder.current.state === "paused") {
                  recorder.current.resume();
            }
      }

      const playVideoPiece = (idx: number) => {
            videoElement!.srcObject = null
            videoElement!.src = videos[currentVid].url
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
            setVideoProgressHelper(videos[numVideos - 2].duration)
            setVideos(videos.filter((_, idx) => idx !== numVideos - 1));
            
            // play the previous piece if there is one
            // if (videos.length > 0) {
            //       playVideoPiece(videos.length - 1)
            // }

      }

      // const handleVideoProgress = (event: any) => {
      //       const manualChange = Number(event.target.value);
      //       videoElement!.currentTime = (videoElement!.duration / 100) * manualChange;
      //       setProgress(manualChange)
      // };

      // const handleVideoSpeed = (event: any) => {
      //       const newSpeed = Number(event.target.value);
      //       videoElement!.playbackRate = speed;
      //       setSpeed(newSpeed)
      // };

      const handleOnTimeUpdate = () => {
            if (playing) {
                  setVideoProgressHelper(videoElement!.currentTime)
            }
      };

      return (
            <div className="container">
                  <div className="video-wrapper">
                        <video id="video"
                              autoPlay
                              muted
                              onTimeUpdate={handleOnTimeUpdate}
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
                              <ProgressBar progress={progress} />
                              {/* <select
                                          className="velocity"
                                          value={speed}
                                          onChange={(e) => handleVideoSpeed(e)}
                                    >
                                          <option value="0.50">0.50x</option>
                                          <option value="1">1x</option>
                                          <option value="1.25">1.25x</option>
                                          <option value="2">2x</option>
                                    </select> */}

                              {/* <button className="mute-btn" onClick={() => setMuted(!muted)}>
                                          {!muted ? (
                                                <i className="bx bxs-volume-full"></i>
                                          ) : (
                                                <i className="bx bxs-volume-mute"></i>
                                          )}
                                    </button>  */}
                        </div>

                        <div>
                              <button onClick={startOrResume}>Record</button>
                              <button onClick={stop}>Stop</button>
                              <button onClick={pause}>Pause</button>
                              <button onClick={clearPrevious}>Clear Previous</button>
                        </div>

                  </div>
                  <div>
                        <p>timer: {recordingTimer}</p>
                  </div>
            </div>)
}