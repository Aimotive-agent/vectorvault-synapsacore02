import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import { AuthPage } from "./pages/Auth";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import AIChatPage from "./pages/AIChatPage";
import SettingsPage from "./pages/SettingsPage";
import VectorVault from "./pages/VectorVault";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./components/vectorvault/contexts/AppContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen bg-dark-bg text-foreground font-sans">
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Protected routes: Rendered within the Index layout */}
                <Route path="/" element={<ProtectedRoute><AppProvider><Index /></AppProvider></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="ai-chat" element={<AIChatPage />} />
                  <Route path="vector-vault" element={
                    <ProtectedRoute requiredPermission="vector_vault_access">
                      <VectorVault />
                    </ProtectedRoute>
                  } />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
