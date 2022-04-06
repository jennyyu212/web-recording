
import { useEffect } from "react"
import "./progressBar.scss"

interface ProgressBarProps {
      progress: number,
      marks: number[],
      playSegment: (idx: number) => void
}

export function ProgressBar(props: ProgressBarProps) {

      const handleClick = (e: React.MouseEvent) => {
            let progressbar = document.getElementById('progressbar')!
            let bounds = progressbar!.getBoundingClientRect();
            let x = e.clientX - bounds.left;
            let percent = x / progressbar.clientWidth * 100
            
            for (let i = 0; i < props.marks.length; i++) {
                  let start = i == 0 ? 0 : props.marks[i-1];
                  if (percent > start && percent < props.marks[i]) {
                        props.playSegment(i)
                        // console.log(i)
                        // console.log(percent)
                        // console.log(props.marks[i])
                        break
                  }
            }
      }

      return(
            <div className="progressbar" id="progressbar">
                  <div 
                        className="progressbar done"
                        style={{ width: `${props.progress}%` }}
                        onClick={handleClick}
                  ></div>
                  {props.marks.map((mark) => {
                        return <div 
                                    className="progressbar mark"
                                    style={{ width: `${mark}%` }}
                              ></div>
                  })}
          </div>
      )
}