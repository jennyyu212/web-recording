import * as React from 'react';
import "./recordingBox.scss";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";

interface RecordingBoxProps {
      
}

enum RecordingStatus {
      Recording,
      Stopped,
      Paused
}
    

export class RecordingBox extends React.Component {

      state = { videos : [] }
      private recorder: any;
      private DEFAULT_MEDIA_CONSTRAINTS = {
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

      private videoElement : HTMLVideoElement | null = null;
      private videoPieces : string[] = []
      private currentPiece : number = 0

      componentDidMount() {
            if (!navigator.mediaDevices) {
                  console.log('This browser does not support getUserMedia.')
            }
            this.videoElement = document.getElementById('video') as HTMLVideoElement;
            // this.startShowingStream();
      }

      
      getMediaStream = async(mediaConstraints = this.DEFAULT_MEDIA_CONSTRAINTS) => {
          const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
          return stream
      }

      startShowingStream = async() => {
            const stream = await this.getMediaStream();
          
            this.videoElement!.src = ""
            this.videoElement!.srcObject = stream
            this.videoElement!.muted = true

            return stream
      }
        
      record = async () => {
            const stream = await this.startShowingStream();
            
            this.recorder = new MediaRecorder(stream)
            
            // temporary chunks of video
            let chunks : any = []
            
            this.recorder.ondataavailable = (event : any) => {
                  // store the video chunks as it is recording
                  console.log("data available")
                  if (event.data.size > 0) {
                        chunks.push(event.data)
                  }
            }
          
            this.recorder.onstop = () => {
                  // if we have a last portion
                  if ( chunks.length !== 0) {
                         // create a url for the last portion
                        const blob = new Blob(chunks, {
                              type: 'video/webm'
                        })
                        const blobUrl = URL.createObjectURL(blob)

                         // append the current portion to the video pieces
                        this.videoPieces.push(blobUrl)
                        this.setState({video: [...this.state.videos], blobUrl})

                        // reset the temporary chunks
                        chunks = []
                  }
                  
                  // start playing the last portion
                  this.playFromStart()
            }
            
            // recording paused
            this.recorder.onpause = () => {

                  // create a url for the current portion
                  const blob = new Blob(chunks, {
                        type: 'video/webm'
                  })
                  const blobUrl = URL.createObjectURL(blob)

                  // reset the temporary chunks
                  chunks = []
                  
                  // append the current portion to the video pieces
                  this.videoPieces.push(blobUrl)
                  this.setState({video: [...this.state.videos], blobUrl})

                  // start playing the last portion
                  this.playVideoPiece(this.videoPieces.length - 1)
                  // this.playVideoPiece(this.state.videos.length - 1)
                  
            }

            this.recorder.onresume = async() => {
                  await this.startShowingStream();
            }
            
            this.recorder.start(200)
        }
      
      // componentDidUpdate(prevState: any, prevProps: any) {
      //       // if (prevState.videos !== this.state.videos) {
      //             this.playVideoPiece(this.state.videos.length - 1)
      //       // }
      // }

      stop = () => {
            this.recorder.stream.getTracks().forEach((track: any) => track.stop())
      }

      pauseOrResume = () => {
            if(this.recorder.state === "recording") {
                  this.recorder.pause();
            } else if(this.recorder.state === "paused") {
                  this.recorder.resume();
            }
      }

      playVideoPiece = (idx: number) => {
            this.videoElement!.srcObject = null
            this.videoElement!.src = this.videoPieces[idx]
            this.videoElement!.muted = false 
      }

      playFromStart = () => {
            this.playVideoPiece(0)
            this.videoElement!.onended = () => {
                  this.currentPiece >= this.videoPieces.length - 1 ? this.currentPiece = 0 : this.currentPiece++
                  this.playVideoPiece(this.currentPiece)
            }
      }

      clearPrevious = () => {
            // removes the last piece
            this.videoPieces.pop();
            const numVideos = this.state.videos.length
            this.setState({videos: this.state.videos.filter((_, idx) => idx !== numVideos-1)});

            // play the previous piece if there is one
            if (this.videoPieces.length > 0) {
                  this.playVideoPiece(this.videoPieces.length - 1)
            }

      }

      render() {
            return (
            <div>
                  <video id="video" autoPlay muted></video>

                  <div>
                        <button onClick={this.record}>Record</button>
                        <button onClick={this.stop}>Stop</button>
                        <button onClick={this.pauseOrResume}>Pause/Resume</button>
                        <button onClick={this.clearPrevious}>Clear Previous</button>
                  </div>
                  {this.videoPieces.map((elt, idx) => {
                        return <p>{elt}</p>
                  })}
                  {this.state.videos.map((elt, idx) => {
                        return <p>{elt}</p>
                  })}
            </div>)
      }
}