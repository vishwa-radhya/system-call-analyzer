import { Route, Routes } from "react-router-dom"
import { Fragment } from "react"
import Home from "./routes/home.route"
import {Toaster} from './components/ui/sonner';

function App() {

  return (
    <Fragment>
      <Routes>
        <Route path="/" element={<Home/>} />
      </Routes>
      <Toaster position="top-right" richColors />
    </Fragment>
  )
}

export default App
