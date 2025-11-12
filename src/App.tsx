import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import Contacts from "./pages/Contacts";
import Conversations from "./pages/Conversations";
import Marketing from "./pages/Marketing";
import Sales from "./pages/Sales";
import Services from "./pages/Services";
import Automation from "./pages/Automation";
import Reporting from "./pages/Reporting";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={0}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/services" element={<Services />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/reporting" element={<Reporting />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;