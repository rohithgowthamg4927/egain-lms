
import {
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import Students from "./pages/Students";
import Instructors from "./pages/Instructors";
import Resources from "./app/resources/page";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AddCourse from "./pages/AddCourse";
import EditCourse from "./pages/EditCourse";
import AddUser from "./pages/AddUser";
import UserProfile from "./pages/UserProfile";
import Index from "./pages/Index";

// Import batch-related routes
import AddBatch from './pages/AddBatch';
import EditBatch from './pages/EditBatch';
import ManageStudents from './pages/ManageStudents';
import Batches from "./pages/Batches";
import BatchDetail from "./pages/BatchDetail";
import Schedules from "./pages/Schedules";

// Import student interface routes
import StudentDashboard from "./components/students/StudentDashboard";
import StudentCourses from "./pages/StudentCourses";
import StudentSchedules from "./pages/StudentSchedules";
import StudentResources from "./pages/StudentResources";
import { Role } from "./lib/types";

function App() {
  console.log("App component rendering");
  return (
    <Routes>
      {/* Default route redirects to Index page */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* Course routes */}
      <Route path="/courses" element={
        <ProtectedRoute>
          <Courses />
        </ProtectedRoute>
      } />
      <Route path="/courses/add" element={
        <ProtectedRoute requiredRoles={[Role.admin, Role.instructor]}>
          <AddCourse />
        </ProtectedRoute>
      } />
      <Route path="/courses/:courseId" element={
        <ProtectedRoute>
          <CourseDetail />
        </ProtectedRoute>
      } />
      <Route path="/courses/edit/:courseId" element={
        <ProtectedRoute requiredRoles={[Role.admin, Role.instructor]}>
          <EditCourse />
        </ProtectedRoute>
      } />
      
      {/* Batch routes */}
      <Route path="/batches" element={
        <ProtectedRoute>
          <Batches />
        </ProtectedRoute>
      } />
      <Route path="/batches/add" element={
        <ProtectedRoute requiredRoles={[Role.admin, Role.instructor]}>
          <AddBatch />
        </ProtectedRoute>
      } />
      <Route path="/batches/:batchId" element={
        <ProtectedRoute>
          <BatchDetail />
        </ProtectedRoute>
      } />
      <Route path="/batches/:batchId/edit" element={
        <ProtectedRoute requiredRoles={[Role.admin, Role.instructor]}>
          <EditBatch />
        </ProtectedRoute>
      } />
      <Route path="/batches/manage-students" element={
        <ProtectedRoute requiredRoles={[Role.admin, Role.instructor]}>
          <ManageStudents />
        </ProtectedRoute>
      } />
      
      {/* Schedule routes */}
      <Route path="/schedules" element={
        <ProtectedRoute>
          <Schedules />
        </ProtectedRoute>
      } />

      {/* Categories routes */}
      <Route path="/categories" element={
        <ProtectedRoute requiredRoles={[Role.admin, Role.instructor]}>
          <Categories />
        </ProtectedRoute>
      } />

      {/* Settings routes */}
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

      {/* Students routes */}
      <Route path="/students" element={
        <ProtectedRoute requiredRoles={[Role.admin, Role.instructor]}>
          <Students />
        </ProtectedRoute>
      } />
      <Route path="/students/:userId" element={
        <ProtectedRoute requiredRoles={[Role.admin, Role.instructor]}>
          <UserProfile />
        </ProtectedRoute>
      } />
      <Route path="/students/:userId/edit" element={
        <ProtectedRoute requiredRoles={[Role.admin, Role.instructor]}>
          <UserProfile />
        </ProtectedRoute>
      } />
      <Route path="/add-user" element={
        <ProtectedRoute requiredRoles={[Role.admin]}>
          <AddUser />
        </ProtectedRoute>
      } />

      {/* Instructors routes */}
      <Route path="/instructors" element={
        <ProtectedRoute requiredRoles={[Role.admin]}>
          <Instructors />
        </ProtectedRoute>
      } />
      <Route path="/instructors/:userId" element={
        <ProtectedRoute requiredRoles={[Role.admin]}>
          <UserProfile />
        </ProtectedRoute>
      } />
      <Route path="/instructors/:userId/edit" element={
        <ProtectedRoute requiredRoles={[Role.admin]}>
          <UserProfile />
        </ProtectedRoute>
      } />

      {/* Resources routes */}
      <Route path="/resources" element={
        <ProtectedRoute>
          <Resources />
        </ProtectedRoute>
      } />
      
      {/* Student dashboard */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute requiredRoles={Role.student}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      
      {/* Student courses */}
      <Route path="/student/courses" element={
        <ProtectedRoute requiredRoles={Role.student}>
          <StudentCourses />
        </ProtectedRoute>
      } />
      
      {/* Student schedules */}
      <Route path="/student/schedules" element={
        <ProtectedRoute requiredRoles={Role.student}>
          <StudentSchedules />
        </ProtectedRoute>
      } />
      
      {/* Student resources */}
      <Route path="/student/resources" element={
        <ProtectedRoute requiredRoles={Role.student}>
          <StudentResources />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
