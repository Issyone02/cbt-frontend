import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AvailableExams from './pages/AvailableExams';
import ExamInstructions from './pages/ExamInstructions';
import TakingExam from './pages/TakingExam';
import ResultView from './pages/ResultView';
import MyResults from './pages/MyResults';
import ReviewExam from './pages/ReviewExam';
import AdminDashboard from './pages/AdminDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import CreateExam from './pages/CreateExam';
import ManageUsers from './pages/ManageUsers';
import ViewExams from './pages/ViewExams';
import EditExam from './pages/EditExam';
import ManageQuestions from './pages/ManageQuestions';
import ManageAttempts from './pages/ManageAttempts';
import Reports from './pages/Reports';
import PasswordResets from './pages/Passwordresets';
import AuditLog from './pages/AuditLog';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" />} />

          {/* ========== STUDENT ROUTES ========== */}
          <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/exams" element={<AvailableExams />} />
            <Route path="/exam/:examId/instructions" element={<ExamInstructions />} />
            <Route path="/exam/:examId/take" element={<TakingExam />} />
            <Route path="/result/:attemptId" element={<ResultView />} />
            <Route path="/my-results" element={<MyResults />} />
            <Route path="/review/:attemptId" element={<ReviewExam />} />
          </Route>

          {/* ========== ADMIN-ONLY ROUTES ========== */}
          <Route element={<ProtectedRoute allowedRoles={['SuperAdmin', 'SchoolAdmin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/exams/create" element={<CreateExam />} />
            <Route path="/admin/exams/view" element={<ViewExams />} />
            <Route path="/admin/exams/:examId/edit" element={<EditExam />} />
            <Route path="/admin/attempts" element={<ManageAttempts />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/password-resets" element={<PasswordResets />} />
            <Route path="/admin/audit-log" element={<AuditLog />} />
          </Route>

          {/* ========== SHARED: ADMIN + LECTURER ROUTES ========== */}
          {/* ManageQuestions is accessible to both roles.
              Lecturers can add/edit/delete questions.
              Admins retain full access as before.
              The backend enforces the same permission check independently. */}
          <Route element={<ProtectedRoute allowedRoles={['SuperAdmin', 'SchoolAdmin', 'Lecturer']} />}>
            <Route path="/admin/exams/:examId/questions" element={<ManageQuestions />} />
          </Route>

          {/* ========== LECTURER ROUTES ========== */}
          <Route element={<ProtectedRoute allowedRoles={['Lecturer']} />}>
            <Route path="/lecturer" element={<LecturerDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
