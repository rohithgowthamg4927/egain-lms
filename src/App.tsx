
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Batches from "./pages/Batches";
import Schedules from "./pages/Schedules";
import Students from "./pages/Students";
import Instructors from "./pages/Instructors";
import Resources from "./pages/Resources";
import Profile from "./pages/Profile";
import AddUser from "./pages/AddUser";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:courseId" element={<Courses />} />
              <Route path="/batches" element={<Batches />} />
              <Route path="/batches/:batchId" element={<Batches />} />
              <Route path="/schedules" element={<Schedules />} />
              <Route path="/students" element={<Students />} />
              <Route path="/students/:userId" element={<UserProfile />} />
              <Route path="/instructors" element={<Instructors />} />
              <Route path="/instructors/:userId" element={<UserProfile />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/add-user" element={<AddUser />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
