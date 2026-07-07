import React from "react";
import { createRoot } from "react-dom/client";

// Bearing brand fonts (Fontsource) — same stack as the proposal entry.
// Lora = display/serif, Geist = body/UI, JetBrains Mono = technical labels.
import "@fontsource/lora/400.css";
import "@fontsource/lora/500.css";
import "@fontsource/lora/600.css";
import "@fontsource/lora/700.css";
import "@fontsource-variable/geist";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

import Docs from "./Docs.jsx";

createRoot(document.getElementById("root")).render(<Docs />);
