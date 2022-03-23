
import "./progressBar.scss"

export function ProgressBar(props: {progress: number}) {
      return(
            <div className="progressbar">
                  <div
                        className="progressbar done"
                        style={{ width: `${props.progress}%` }}
                  ></div>
          </div>
      )
}