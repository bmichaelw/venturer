/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Admin from './pages/Admin';
import AdminRevenue from './pages/AdminRevenue';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminUsers from './pages/AdminUsers';
import Calendar from './pages/Calendar';
import Dump from './pages/Dump';
import ItemDetail from './pages/ItemDetail';
import Kanban from './pages/Kanban';
import Profile from './pages/Profile';
import ProjectDetail from './pages/ProjectDetail';
import Settings from './pages/Settings';
import Stats from './pages/Stats';
import StepKey from './pages/StepKey';
import TeamDashboard from './pages/TeamDashboard';
import TeamEdit from './pages/TeamEdit';
import Teams from './pages/Teams';
import Templates from './pages/Templates';
import VentureDetail from './pages/VentureDetail';
import Ventures from './pages/Ventures';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "AdminRevenue": AdminRevenue,
    "AdminUserDetail": AdminUserDetail,
    "AdminUsers": AdminUsers,
    "Calendar": Calendar,
    "Dump": Dump,
    "ItemDetail": ItemDetail,
    "Kanban": Kanban,
    "Profile": Profile,
    "ProjectDetail": ProjectDetail,
    "Settings": Settings,
    "Stats": Stats,
    "StepKey": StepKey,
    "TeamDashboard": TeamDashboard,
    "TeamEdit": TeamEdit,
    "Teams": Teams,
    "Templates": Templates,
    "VentureDetail": VentureDetail,
    "Ventures": Ventures,
}

export const pagesConfig = {
    mainPage: "Dump",
    Pages: PAGES,
    Layout: __Layout,
};