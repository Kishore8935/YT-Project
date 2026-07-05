import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router";
import { Landing } from "./screens/Landing";
import { VideoPage } from "./screens/VideoPage";
import { Signin } from "./screens/Signin";
import { Signup } from "./screens/Signup";
import { Upload } from "./screens/Upload";
import { Channel } from "./screens/Channel";
import { Appbar } from "./components/Appbar";

export function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <Appbar />
        <div className="main-content">
          <Routes>
            <Route path="/watch" element={<VideoPage />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/channel/:id" element={<Channel />} />
            <Route path="/" element={<Landing />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
