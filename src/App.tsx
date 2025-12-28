import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import Index from "./pages/Index";
import Tests from "./pages/Tests";
import Cart from "./pages/Cart";
import Booking from "./pages/Booking";
import Confirmation from "./pages/Confirmation";
import Track from "./pages/Track";
import MyOrders from "./pages/MyOrders";
import Testing from "./pages/Testing";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/track" element={<Track />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/testing" element={<Testing />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
