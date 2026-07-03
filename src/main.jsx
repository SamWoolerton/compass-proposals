import React from "react";
import { createRoot } from "react-dom/client";

// Bearing brand fonts (Fontsource — reliable for plain Vite, no network at runtime).
// Lora = display/serif, Geist = body/UI, JetBrains Mono = technical labels.
import "@fontsource/lora/400.css";
import "@fontsource/lora/500.css";
import "@fontsource/lora/600.css";
import "@fontsource/lora/700.css";
import "@fontsource-variable/geist";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

// Tailwind (theme + utilities; Preflight intentionally omitted — see index.css).
import "./index.css";

import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
