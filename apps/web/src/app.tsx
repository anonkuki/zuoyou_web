import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, Protected, useAuth } from './auth';
import { ConsoleLayout, PublicLayout } from './layouts';
import { ActivatePage, LoginPage } from './pages-auth';
import { ActivitiesPage, ActivityDetailPage, AnnouncementDetailPage, AnnouncementsPage, ApplicationStatusPage, ChroniclePage, DepartmentDetailPage, DepartmentsPage, JoinPage, NotFoundPage, WorksPage } from './pages-public';
import { HomePage } from './components/home/HomePage';
import { MemberActivitiesPage, MemberFilesPage, MemberTasksPage, MemberWorksPage, PortalHomePage } from './pages-portal';
import { ChatPage, MemberDirectoryPage, MemberHomepagePage, ProfileEditorPage } from './pages-social';
import { ActivitiesAdminPage, AdminDashboardPage, AnalyticsAdminPage, AnnouncementsAdminPage, AuditAdminPage, ChronicleAdminPage, DepartmentsAdminPage, FilesAdminPage, MembersAdminPage, RecruitmentAdminPage, SettingsAdminPage, TasksAdminPage, WorksAdminPage } from './pages-admin';

function AdminIndex(){const {user}=useAuth();return user?.role==='MEMBER'?<Navigate to="/portal" replace/>:user?.role==='DEPARTMENT_LEAD'?<Navigate to="/admin/activities" replace/>:<AdminDashboardPage/>}

export function App(){
  return <AuthProvider><Routes>
    <Route element={<PublicLayout/>}><Route index element={<HomePage/>}/><Route path="chronicle" element={<ChroniclePage/>}/><Route path="departments" element={<DepartmentsPage/>}/><Route path="departments/:slug" element={<DepartmentDetailPage/>}/><Route path="activities" element={<ActivitiesPage/>}/><Route path="activities/:id" element={<ActivityDetailPage/>}/><Route path="announcements" element={<AnnouncementsPage/>}/><Route path="announcements/:id" element={<AnnouncementDetailPage/>}/><Route path="works" element={<WorksPage/>}/><Route path="join" element={<JoinPage/>}/><Route path="application/:token" element={<ApplicationStatusPage/>}/></Route>
    <Route path="login" element={<LoginPage/>}/><Route path="activate" element={<ActivatePage/>}/>
    <Route path="portal" element={<Protected><ConsoleLayout/></Protected>}><Route index element={<PortalHomePage/>}/><Route path="profile" element={<ProfileEditorPage/>}/><Route path="members" element={<MemberDirectoryPage/>}/><Route path="members/:id" element={<MemberHomepagePage/>}/><Route path="chat" element={<ChatPage/>}/><Route path="activities" element={<MemberActivitiesPage/>}/><Route path="works" element={<MemberWorksPage/>}/><Route path="tasks" element={<MemberTasksPage/>}/><Route path="files" element={<MemberFilesPage/>}/></Route>
    <Route path="admin" element={<Protected manager><ConsoleLayout admin/></Protected>}><Route index element={<AdminIndex/>}/><Route path="members" element={<MembersAdminPage/>}/><Route path="departments" element={<Protected adminOnly><DepartmentsAdminPage/></Protected>}/><Route path="activities" element={<ActivitiesAdminPage/>}/><Route path="announcements" element={<Protected adminOnly><AnnouncementsAdminPage/></Protected>}/><Route path="recruitment" element={<Protected adminOnly><RecruitmentAdminPage/></Protected>}/><Route path="works" element={<WorksAdminPage/>}/><Route path="files" element={<FilesAdminPage/>}/><Route path="tasks" element={<TasksAdminPage/>}/><Route path="history" element={<Protected adminOnly><ChronicleAdminPage/></Protected>}/><Route path="analytics" element={<Protected adminOnly><AnalyticsAdminPage/></Protected>}/><Route path="settings" element={<Protected adminOnly><SettingsAdminPage/></Protected>}/><Route path="audit" element={<Protected adminOnly><AuditAdminPage/></Protected>}/></Route>
    <Route path="*" element={<NotFoundPage/>}/>
  </Routes></AuthProvider>;
}
