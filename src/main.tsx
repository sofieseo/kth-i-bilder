import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import archiveFolderBg from "@/assets/archive-folder-bg.jpg";

// Preload the archive folder background so it's ready before first paint
const preload = document.createElement("link");
preload.rel = "preload";
preload.as = "image";
preload.href = archiveFolderBg;
preload.fetchPriority = "high";
document.head.appendChild(preload);

// Also kick off the actual image load immediately
const img = new Image();
img.src = archiveFolderBg;

createRoot(document.getElementById("root")!).render(<App />);
