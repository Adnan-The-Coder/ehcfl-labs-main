import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App.tsx";
import "./index.css";
import { CartProvider } from "./contexts/CartContext";
import { PincodeProvider } from "./contexts/PincodeContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PincodeProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </PincodeProvider>
  </StrictMode>
);
