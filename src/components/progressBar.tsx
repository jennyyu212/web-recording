
import "./progressBar.scss"

interface ProgressBarProps {
      progress: number,
      marks: number[]
}

export function ProgressBar(props: ProgressBarProps) {
      return(
            <div className="progressbar">
                  <div
                        className="progressbar done"
                        style={{ width: `${props.progress}%` }}
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