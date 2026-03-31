import React from "react";
import { createRoot } from "react-dom/client";
import { initStorage } from "./storage.js";
import App from "./App.jsx";

initStorage();

createRoot(document.getElementById("root")).render(<App />);
