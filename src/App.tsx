import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FeedsManagement from "./pages/FeedsManagement";
import Pinned from "./pages/Pinned";
import FeedDetail from "./pages/FeedDetail";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Gone from "./pages/Gone";
import Changelog from "./pages/Changelog";
import PolitiqueCookies from "./pages/PolitiqueCookies";
import LegacyRedirect from "./components/LegacyRedirect";
import { CookieBanner } from "./components/CookieBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/feeds" element={<FeedsManagement />} />
          <Route path="/pinned" element={<Pinned />} />
          <Route path="/feed/:feedId" element={<FeedDetail />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/politique-cookies" element={<PolitiqueCookies />} />
          <Route path="/gone" element={<Gone />} />
          
          {/* Legacy URL redirects */}
          <Route path="/flux/*" element={<LegacyRedirect />} />
          <Route path="/account/*" element={<LegacyRedirect />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
