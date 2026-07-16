import { BrowserRouter, Routes, Route } from "react-router";
import { AdminLayout } from "./layouts/AdminLayout";
import { Dashboard } from "./pages/Dashboard";
import { Groups } from "./pages/Groups";
import { GroupDetail } from "./pages/GroupDetail";
import { Members } from "./pages/Members";
import { MemberDetail } from "./pages/MemberDetail";
import { Pending } from "./pages/Pending";
import { Releases } from "./pages/Releases";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Payments } from "./pages/Payments";
import { Login } from "./pages/Login";
import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pending" element={<Pending />} />
            <Route path="groups" element={<Groups />} />
            <Route path="groups/:id" element={<GroupDetail />} />
            <Route path="releases" element={<Releases />} />
            <Route path="members" element={<Members />} />
            <Route path="members/:id" element={<MemberDetail />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            {/* Add more routes here as we build them */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
