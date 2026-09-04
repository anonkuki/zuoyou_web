import { useEffect } from 'react';
import { matchPath, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AuthProvider, Protected, useAuth } from './auth';
import { ConsoleLayout, PublicLayout } from './layouts';
import { ActivatePage, LoginPage } from './pages-auth';
import { ActivitiesPage, ActivityDetailPage, AnnouncementDetailPage, AnnouncementsPage, ApplicationStatusPage, ChroniclePage, DepartmentDetailPage, DepartmentsPage, JoinPage, NotFoundPage, WorksPage } from './pages-public';
import { HomePage } from './components/home/HomePage';
import { MemberActivitiesPage, MemberFilesPage, MemberTasksPage, PortalHomePage } from './pages-portal';
import { ChatPage, MemberDirectoryPage, MemberHomepagePage, ProfileEditorPage } from './pages-social';
import { AvatarStudioPage } from './pages-avatar';
import { MatchPage, PostDetailPage, PostsPage, PublicPostPage } from './pages-tavern';
import { WorldAreaPage, WorldLobbyPage } from './pages-world';
import { ActivitiesAdminPage, AdminDashboardPage, AnalyticsAdminPage, AnnouncementsAdminPage, AuditAdminPage, ChronicleAdminPage, DepartmentsAdminPage, FilesAdminPage, MembersAdminPage, RecruitmentAdminPage, SettingsAdminPage, TasksAdminPage, WorksAdminPage } from './pages-admin';
import { showcaseBySlug } from './components/departments/showcase-data';
import { isExecutiveRole } from '@guild/contracts';

function AdminIndex(){const {user}=useAuth();return user?.role==='MEMBER'?<Navigate to="/portal" replace/>:user&&isExecutiveRole(user.role)?<AdminDashboardPage/>:<Navigate to="/admin/activities" replace/>}

/** 路由切换回到顶部（instant，避免平滑滚动带来的漂浮感） */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

/** hub → 部门详情跳转时，用目标部门主题色做色块扫过转场 */
function RouteWipe() {
  const location = useLocation();
  const reduce = useReducedMotion();
  const slug = matchPath('/departments/:slug', location.pathname)?.params.slug ?? '';
  const color = showcaseBySlug[slug]?.accent;
  if (reduce || !color) return null;
  return <motion.div key={location.key} className="route-wipe" style={{ background: color }} aria-hidden="true"
    initial={{ x: '-104%', skewX: -6 }} animate={{ x: '104%', skewX: -6 }} transition={{ duration: .68, ease: [0.7, 0, 0.3, 1] }} />;
}

function AppRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();
  const routes = <Routes location={location}>
    <Route element={<PublicLayout/>}><Route index element={<HomePage/>}/><Route path="chronicle" element={<ChroniclePage/>}/><Route path="departments" element={<DepartmentsPage/>}/><Route path="departments/:slug" element={<DepartmentDetailPage/>}/><Route path="posts/:id" element={<PublicPostPage/>}/><Route path="activities" element={<ActivitiesPage/>}/><Route path="activities/:id" element={<ActivityDetailPage/>}/><Route path="announcements" element={<AnnouncementsPage/>}/><Route path="announcements/:id" element={<AnnouncementDetailPage/>}/><Route path="works" element={<WorksPage/>}/><Route path="join" element={<JoinPage/>}/><Route path="application/:token" element={<ApplicationStatusPage/>}/></Route>
    <Route path="login" element={<LoginPage/>}/>
    <Route path="activate" element={<ActivatePage/>}/>
    <Route path="portal" element={<Protected><ConsoleLayout/></Protected>}><Route index element={<PortalHomePage/>}/><Route path="profile" element={<ProfileEditorPage/>}/><Route path="avatar" element={<AvatarStudioPage/>}/><Route path="members" element={<MemberDirectoryPage/>}/><Route path="members/:id" element={<MemberHomepagePage/>}/><Route path="tavern" element={<PostsPage/>}/><Route path="tavern/:id" element={<PostDetailPage/>}/><Route path="match" element={<MatchPage/>}/><Route path="world" element={<WorldLobbyPage/>}/><Route path="world/:areaId" element={<WorldAreaPage/>}/><Route path="chat" element={<ChatPage/>}/><Route path="activities" element={<MemberActivitiesPage/>}/><Route path="works" element={<Navigate to="/portal/tavern" replace/>}/><Route path="tasks" element={<MemberTasksPage/>}/><Route path="files" element={<MemberFilesPage/>}/></Route>
    <Route path="admin" element={<Protected manager><ConsoleLayout admin/></Protected>}><Route index element={<AdminIndex/>}/><Route path="members" element={<MembersAdminPage/>}/><Route path="departments" element={<Protected adminOnly><DepartmentsAdminPage/></Protected>}/><Route path="activities" element={<ActivitiesAdminPage/>}/><Route path="announcements" element={<Protected adminOnly><AnnouncementsAdminPage/></Protected>}/><Route path="recruitment" element={<Protected adminOnly><RecruitmentAdminPage/></Protected>}/><Route path="works" element={<WorksAdminPage/>}/><Route path="files" element={<FilesAdminPage/>}/><Route path="tasks" element={<TasksAdminPage/>}/><Route path="history" element={<Protected adminOnly><ChronicleAdminPage/></Protected>}/><Route path="analytics" element={<Protected adminOnly><AnalyticsAdminPage/></Protected>}/><Route path="settings" element={<Protected adminOnly><SettingsAdminPage/></Protected>}/><Route path="audit" element={<Protected adminOnly><AuditAdminPage/></Protected>}/></Route>
    <Route path="*" element={<NotFoundPage/>}/>
  </Routes>;
  if (reduce) return routes;
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div key={location.pathname} className="route-page"
        initial={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
        transition={{ duration: .3, ease: [0.22, 1, 0.36, 1] }}>
        {routes}
      </motion.div>
    </AnimatePresence>
  );
}

export function App(){
  return <AuthProvider><ScrollToTop/><RouteWipe/><AppRoutes/></AuthProvider>;
}
