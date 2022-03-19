import * as React from 'react';
import "./recordingBox.scss";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";

interface RecordingBoxProps {
      
}

export type RecordingStatus =
  | "recording"
  | "stopped"
  | "paused";
    

export class RecordingBox extends React.Component<RecordingBoxProps> {
      
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

      componentDidMount() {
            if (!navigator.mediaDevices) {
                  console.log('This browser does not support getUserMedia.')
            }
            this.videoElement = document.getElementById('video') as HTMLVideoElement;

      }

      
      getMediaStream = async(mediaConstraints = this.DEFAULT_MEDIA_CONSTRAINTS) => {
          const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
          
          this.videoElement!.src = ""
          this.videoElement!.srcObject = stream
          this.videoElement!.muted = true
          
          return stream
      }
        
      record = async () => {
          const stream = await this.getMediaStream();
          
          this.videoElement!.src = ""
          this.videoElement!.srcObject = stream
          this.videoElement!.muted = true
          
          this.recorder = new MediaRecorder(stream)
          
          let chunks : any = []
        
          this.recorder.ondataavailable = (event : any) => {
            if (event.data.size > 0) {
                  console.log("got here")
                  chunks.push(event.data)
            }
          }
          
          this.recorder.onstop = () => {
            const blob = new Blob(chunks, {
                  type: 'video/webm'
            })
            
            chunks = []
            const blobUrl = URL.createObjectURL(blob)
            
            this.videoElement!.srcObject = null
            this.videoElement!.src = blobUrl
            this.videoElement!.muted = false
           }
          
          this.recorder.start(200)
        }
        
      stop = () => {
            this.recorder.stream.getTracks().forEach((track: any) => track.stop())
      }


      render() {
            return (
            <div>
                  <video id="video" autoPlay muted></video>

                  <div>
                        <button onClick={this.record}>Record</button>
                        <button onClick={this.stop}>Stop</button>
                  </div>
            </div>)
      }
}