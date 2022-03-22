import React from 'react';
import './App.css';
import { RecordingBox } from "./components/recordingBox"
import { VideoBox } from "./components/videoBox"

function App() {
  return (
    <div>
      <RecordingBox/>
      <VideoBox source=""/>
    </div>
  );
}

export default App;
