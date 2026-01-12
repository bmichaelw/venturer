import Calendar from './pages/Calendar';
import Dump from './pages/Dump';
import Kanban from './pages/Kanban';
import Profile from './pages/Profile';
import ProjectDetail from './pages/ProjectDetail';
import Stats from './pages/Stats';
import StepKey from './pages/StepKey';
import TeamDashboard from './pages/TeamDashboard';
import Teams from './pages/Teams';
import VentureDetail from './pages/VentureDetail';
import Ventures from './pages/Ventures';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import AdminUsers from './pages/AdminUsers';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminRevenue from './pages/AdminRevenue';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Calendar": Calendar,
    "Dump": Dump,
    "Kanban": Kanban,
    "Profile": Profile,
    "ProjectDetail": ProjectDetail,
    "Stats": Stats,
    "StepKey": StepKey,
    "TeamDashboard": TeamDashboard,
    "Teams": Teams,
    "VentureDetail": VentureDetail,
    "Ventures": Ventures,
    "Settings": Settings,
    "Admin": Admin,
    "AdminUsers": AdminUsers,
    "AdminUserDetail": AdminUserDetail,
    "AdminRevenue": AdminRevenue,
}

export const pagesConfig = {
    mainPage: "Dump",
    Pages: PAGES,
    Layout: __Layout,
};