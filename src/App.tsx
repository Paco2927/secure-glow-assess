import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import AssessmentISO from "./pages/AssessmentISO";
import AssessmentNIST from "./pages/AssessmentNIST";
import Admin from "./pages/Admin";
import Results from "./pages/Results";
import Reportes from "./pages/Reportes";
import Organizations from "./pages/Organizations";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/assessment/iso27001" element={<AssessmentISO />} />
          <Route path="/assessment/nist" element={<AssessmentNIST />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/results" element={<Results />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
