import * as React from 'react';
import "./recordingBox.scss";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { ProgressBar } from "./progressBar"
import useVideoPlayer from "./useVideoPlayer";
import { MdBackspace } from 'react-icons/md';
import { FaCheckCircle } from 'react-icons/fa';
import { IconContext } from "react-icons";


enum RecordingStatus {
      Recording,
      Stopped,
      Paused
}

interface VideoSegment {
      chunks: any[],
      endTime: number
}

const MAXTIME = 1000;

export function RecordingBox() {

      const [recording, setRecording] = useState(false);
      const recordingTimerRef = useRef<number>(0);
      const [recordingTimer, setRecordingTimer] = useState(0); // unit is 0.01 second
      const [playing, setPlaying] = useState(false);
      const [progress, setProgress] = useState(0);
      const [speed, setSpeed] = useState(1);
      const [muted, setMuted] = useState(false);

      const [videos, setVideos] = useState<VideoSegment[]>([]);
      // const [videos, setVideos] = useState<string[]>([]);
      const [currentVid, setCurrentVid] = useState<number>(0);
      const recorder = useRef<MediaRecorder | null>(null);
      const videoElementRef = useRef<HTMLVideoElement | null>(null);

      const [finished, setFinished] = useState<Boolean>(false)

      

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

            if (finished) {
                  let allVideoChunks : any = []
                  console.log(videos)
                  videos.forEach((vid) => {
                        console.log(vid.chunks)
                        allVideoChunks = allVideoChunks.concat(vid.chunks)
                  })

                  console.log(allVideoChunks)

                  const blob = new Blob(allVideoChunks, {
                              type: 'video/webm'
                  })
                  const blobUrl = URL.createObjectURL(blob)

                  videoElementRef.current!.srcObject = null
                  videoElementRef.current!.src = blobUrl
                  videoElementRef.current!.muted = false
            }
            

      }, [finished])

      useEffect(() => {
            // check if the browser supports media devices on first load
            if (!navigator.mediaDevices) {
                  console.log('This browser does not support getUserMedia.')
            }
      }, [])

      useEffect(() => {
            // get access to the video element on every render
            // videoElement = document.getElementById('video') as HTMLVideoElement;
            videoElementRef.current = document.getElementById('video') as HTMLVideoElement;
      })

      // useEffect(() => {
      //       if (playing) {
      //             videoElement!.srcObject = null
      //             // videoElement!.src = videos[currentVid].url
      //             videoElement!.muted = false
      //             videoElement!.play()
      //       } else {
      //             videoElement!.pause();
      //       }
      // }, [playing, videoElement]);

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
            recordingTimerRef.current = recordingTimer;
      }, [recordingTimer])

      const setVideoProgressHelper = (progress: number) => {
            const newProgress = (progress / MAXTIME) * 100;
            setProgress(newProgress)
      }
      const startShowingStream = async (mediaConstraints = DEFAULT_MEDIA_CONSTRAINTS) => {
            const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)

            videoElementRef.current!.src = ""
            videoElementRef.current!.srcObject = stream
            videoElementRef.current!.muted = true

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

            recorder.current.onstart = (event: any) => {
                  console.log(event)
                  console.log("on start")
                  setRecording(true);
            }

            recorder.current.onstop = () => {
                  // if we have a last portion
                  if (chunks.length > 1) {
                        // append the current portion to the video pieces
                        setVideos(videos => [...videos, {chunks: chunks, endTime: recordingTimerRef.current}]) 
                  }

                  // reset the temporary chunks
                  chunks = []
                  setRecording(false);
                  setFinished(true);
            }

            // recording paused
            recorder.current.onpause = (event: any) => {
                  // append the current portion to the video pieces
                  setVideos(videos => [...videos, {chunks: chunks, endTime: recordingTimerRef.current}])

                  // reset the temporary chunks
                  chunks = []
                  setRecording(false);
            }

            recorder.current.onresume = async (event: any) => {
                  console.log(event)
                  await startShowingStream();
                  setRecording(true);
            }

            recorder.current.start(200)
      }


      const stop = () => {
            if (recorder.current) {
                  if (recorder.current.state !== "inactive") {
                        recorder.current.stop();
                        // recorder.current.stream.getTracks().forEach((track: any) => track.stop())
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

      // const playVideoPiece = (idx: number) => {
      //       videoElement!.srcObject = null
      //       // videoElement!.src = videos[currentVid].url
      //       videoElement!.muted = false
      // }

      // const playFromStart = () => {
      //       playVideoPiece(0)
      //       videoElement!.onended = () => {
      //             currentVid >= videos.length - 1 ? setCurrentVid(0) : setCurrentVid(currentVid + 1)
      //             playVideoPiece(currentVid)
      //       }
      // }

      const clearPrevious = () => {
            // removes the last piece
            const numVideos = videos.length
            setRecordingTimer(numVideos == 1 ? 0 : videos[numVideos - 2].endTime)
            setVideoProgressHelper(numVideos == 1 ? 0 : videos[numVideos - 2].endTime)
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
                  setVideoProgressHelper(videoElementRef.current!.currentTime)
            }
      };

      const millisecondToMinuteSecond = (milliseconds: number) => {
            const toTwoDigit = (digit: number) => {
                  return String(digit).length == 1 ? "0" + digit : digit
            }
            const minutes = Math.floor(( milliseconds % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
            return toTwoDigit(minutes) + " : " + toTwoDigit(seconds);
      }

      


      useEffect(() => {
            console.log(videos.map((elt) => elt.endTime / MAXTIME * 100))
            console.log(videos)
      }, [videos])

      return (
            <div className="container">
                  <div className="video-wrapper">
                        <video id="video"
                              autoPlay
                              muted
                              onTimeUpdate={handleOnTimeUpdate}
                        />
                        <div className="recording-sign">
                              <span className="dot"/>
                              <p className="timer">{millisecondToMinuteSecond(recordingTimer * 10)}</p>
                        </div>
                        <div className="controls">
                              
                              <div className="controls-inner-container">
                                    <div className="record-button-wrapper">
                                          {recording ? 
                                          <button className="stop-button" onClick={pause}/> :
                                          <button className="record-button" onClick={startOrResume}/>
                                          }
                                    </div>
                                    {videos.length > 0 ? 

                                    <div className="video-edit-wrapper">
                                          <IconContext.Provider value={{ color: "grey", className: "video-edit-buttons" }}>
                                                <MdBackspace onClick={clearPrevious}/>
                                          </IconContext.Provider>
                                          <IconContext.Provider value={{ color: "#cc1c08", className: "video-edit-buttons" }}>
                                                <FaCheckCircle onClick={stop}/>
                                          </IconContext.Provider>
                                    </div>
                                    
                                     : <></>}
                                    
                              </div>
                              
                              <ProgressBar progress={progress} marks={videos.map((elt) => elt.endTime / MAXTIME * 100)}/>

                              {/* <button className="mute-btn" onClick={() => setMuted(!muted)}>
                                          {!muted ? (
                                                <i className="bx bxs-volume-full"></i>
                                          ) : (
                                                <i className="bx bxs-volume-mute"></i>
                                          )}
                                    </button>  */}
                        </div>

                  </div>
            </div>)
}