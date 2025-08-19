import { Route, Routes } from "react-router-dom"
import LogsViewer from "./components/LogsViewer"
import { Fragment } from "react"
import Home from "./routes/home.route"

function App() {

  return (
    <Fragment>
      <Routes>
        <Route path="/" element={<Home/>} />
      </Routes>
    </Fragment>
  )
}

export default App
