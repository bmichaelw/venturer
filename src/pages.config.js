import Dump from './pages/Dump';
import Ventures from './pages/Ventures';
import Calendar from './pages/Calendar';
import Stats from './pages/Stats';
import Profile from './pages/Profile';
import VentureDetail from './pages/VentureDetail';
import StepKey from './pages/StepKey';
import Teams from './pages/Teams';
import TeamDashboard from './pages/TeamDashboard';
import ProjectDetail from './pages/ProjectDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dump": Dump,
    "Ventures": Ventures,
    "Calendar": Calendar,
    "Stats": Stats,
    "Profile": Profile,
    "VentureDetail": VentureDetail,
    "StepKey": StepKey,
    "Teams": Teams,
    "TeamDashboard": TeamDashboard,
    "ProjectDetail": ProjectDetail,
}

export const pagesConfig = {
    mainPage: "Dump",
    Pages: PAGES,
    Layout: __Layout,
};