import { useState, useEffect } from 'react';
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
import Login from './pages/Login';
import { supabase } from './integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import MediaLibrary from './pages/MediaLibrary';
import AccountManagement from './pages/AccountManagement';

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null; // Hoặc một component loading
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <Toaster />
        <Sonner />
        {!session ? (
          <Login />
        ) : (
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Chat />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/tags" element={<Tags />} />
                <Route path="/media-library" element={<MediaLibrary />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/prompt-config" element={<PromptConfig />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/account-management" element={<AccountManagement />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;