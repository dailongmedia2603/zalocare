import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Chat from "./pages/Chat";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Tags from "./pages/Tags";
import PromptConfig from "./pages/PromptConfig";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={0}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Chat />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/prompt-config" element={<PromptConfig />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;