
import {
  Routes,
  Route,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import Students from "./pages/Students";
import Instructors from "./pages/Instructors";
import Resources from "./pages/Resources";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./hooks/use-auth";
import AddCourse from "./pages/AddCourse";
import EditCourse from "./pages/EditCourse";
import UserProfile from "./pages/UserProfile";

// Import batch-related routes
import AddBatch from './pages/AddBatch';
import EditBatch from './pages/EditBatch';
import ManageStudents from './pages/ManageStudents';
import Batches from "./pages/Batches";
import BatchDetail from "./pages/BatchDetail";
import Schedules from "./pages/Schedules";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Course routes */}
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/courses/add" element={<ProtectedRoute><AddCourse /></ProtectedRoute>} />
          <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
          <Route path="/courses/:courseId/edit" element={<ProtectedRoute><EditCourse /></ProtectedRoute>} />
          
          {/* Batch routes */}
          <Route path="/batches" element={<ProtectedRoute><Batches /></ProtectedRoute>} />
          <Route path="/batches/add" element={<ProtectedRoute><AddBatch /></ProtectedRoute>} />
          <Route path="/batches/:batchId" element={<ProtectedRoute><BatchDetail /></ProtectedRoute>} />
          <Route path="/batches/:batchId/edit" element={<ProtectedRoute><EditBatch /></ProtectedRoute>} />
          <Route path="/batches/manage-students" element={<ProtectedRoute><ManageStudents /></ProtectedRoute>} />
          
          {/* Schedule routes */}
          <Route path="/schedules" element={<ProtectedRoute><Schedules /></ProtectedRoute>} />

          {/* Categories routes */}
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />

          {/* Settings routes */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Students routes */}
          <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
          <Route path="/students/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

          {/* Instructors routes */}
          <Route path="/instructors" element={<ProtectedRoute><Instructors /></ProtectedRoute>} />
          <Route path="/instructors/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

          {/* Resources routes */}
          <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
