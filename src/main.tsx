import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { installStaleChunkReload } from "./lib/staleChunkReload";
import "./index.css";

installStaleChunkReload();

createRoot(document.getElementById("root")!).render(<App />);
