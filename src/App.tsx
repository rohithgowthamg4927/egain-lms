import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Role } from '@/lib/types';
import Dashboard from '@/pages/Dashboard';
import Batches from '@/pages/Batches';
import Students from '@/pages/Students';
import Instructors from '@/pages/Instructors';
import Resources from '@/app/resources/page';
import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentCourses from '@/pages/student/StudentCourses';
import StudentSchedules from '@/pages/student/StudentSchedules';
import StudentResources from '@/pages/student/StudentResources';
import Courses from './pages/Courses';
import Categories from './pages/Categories';
import Schedules from './pages/Schedules';
import AddCourse from './pages/AddCourse';
import CourseDetail from './pages/CourseDetail';
import EditCourse from './pages/EditCourse';
import Index from './pages/Index';
import BatchDetail from './pages/BatchDetail';
import ManageStudents from './pages/ManageStudents';
import AddBatch from './pages/AddBatch';
import EditBatch from './pages/EditBatch';
import AddUser from './pages/AddUser';
import UserProfile from './pages/UserProfile';
import StudentCourseDetail from './pages/student/StudentCourseDetail';
import InstructorDashboard from './pages/instructor/InstructorDashboard';

function App() {
  return (
    <>
      <Routes>
        {/*Global Routes*/}
        <Route path="/login" element={<Index />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/*Admin Routes*/}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={[Role.admin]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/*Instructor Dashboard*/}
        <Route
          path="/instructor/dashboard"
          element={
            <ProtectedRoute allowedRoles={[Role.instructor]}>
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses"
          element={
            <ProtectedRoute allowedRoles={[Role.admin, Role.instructor]}>
              <Courses />
            </ProtectedRoute>
          }
        />

        <Route path="/courses/add" element={
          <ProtectedRoute allowedRoles={[Role.admin]}>
            <AddCourse />
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId" element={
          <ProtectedRoute allowedRoles={[Role.admin, Role.instructor]}>
            <CourseDetail />
          </ProtectedRoute>
        } />
        <Route path="/courses/edit/:courseId" element={
          <ProtectedRoute allowedRoles={[Role.admin]}>
            <EditCourse />
          </ProtectedRoute>
        } />

        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={[Role.admin]}>
              <Categories />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/batches"
          element={
            <ProtectedRoute allowedRoles={[Role.admin, Role.instructor]}>
              <Batches />
            </ProtectedRoute>
          }
        />
         <Route path="/batches/add" element={
          <ProtectedRoute allowedRoles={[Role.admin]}>
            <AddBatch />
          </ProtectedRoute>
        } />
        <Route path="/batches/:batchId" element={
          <ProtectedRoute allowedRoles={[Role.admin, Role.instructor]}>
            <BatchDetail />
          </ProtectedRoute>
        } />
        <Route path="/batches/:batchId/edit" element={
          <ProtectedRoute allowedRoles={[Role.admin]}>
            <EditBatch />
          </ProtectedRoute>
        } />
        <Route path="/batches/manage-students" element={
          <ProtectedRoute allowedRoles={[Role.admin]}>
            <ManageStudents />
          </ProtectedRoute>
        } />

        <Route
          path="/schedules"
          element={
            <ProtectedRoute allowedRoles={[Role.admin, Role.instructor]}>
              <Schedules />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedRoute allowedRoles={[Role.admin, Role.instructor]}>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route path="/students/:userId" element={
          <ProtectedRoute allowedRoles={[Role.admin, Role.instructor]}>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/students/:userId/edit" element={
          <ProtectedRoute allowedRoles={[Role.admin]}>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/add-user" element={
          <ProtectedRoute allowedRoles={[Role.admin]}>
            <AddUser />
          </ProtectedRoute>
        } />


        <Route
          path="/instructors"
          element={
            <ProtectedRoute allowedRoles={[Role.admin]}>
              <Instructors />
            </ProtectedRoute>
          }
        />
        <Route path="/instructors/:userId" element={
          <ProtectedRoute allowedRoles={[Role.admin]}>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/instructors/:userId/edit" element={
          <ProtectedRoute allowedRoles={[Role.admin]}>
            <UserProfile />
          </ProtectedRoute>
        } />


        <Route
          path="/resources"
          element={
            <ProtectedRoute allowedRoles={[Role.admin, Role.instructor]}>
              <Resources />
            </ProtectedRoute>
          }
        />

        {/*Student Routes*/}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={[Role.student]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses"
          element={
            <ProtectedRoute allowedRoles={[Role.student]}>
              <StudentCourses />
            </ProtectedRoute>
          }
        />
        <Route path="/student/courses/:courseId" element={
          <ProtectedRoute allowedRoles={[Role.student]}>
            <StudentCourseDetail />
          </ProtectedRoute>
        } />
        <Route
          path="/student/schedules"
          element={
            <ProtectedRoute allowedRoles={[Role.student]}>
              <StudentSchedules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/resources"
          element={
            <ProtectedRoute allowedRoles={[Role.student]}>
              <StudentResources />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
