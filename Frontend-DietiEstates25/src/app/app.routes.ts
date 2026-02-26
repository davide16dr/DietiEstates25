import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component/login.component';
import { RegisterUserComponent } from './auth/register/register-user.component/register-user.component';
import { RegisterBusinessComponent } from './auth/register/register-business.component/register-business.component';
import { HomepageComponent } from './pages/homepage.component/homepage.component';
import { PropertiesPageComponent } from './pages/properties-page.component/properties-page.component';
import { guestGuard } from './shared/guards/guest.guard';
import { PropertyDetailPage } from './pages/property-detail/property-detail.page/property-detail.page';
import { DashboardComponent } from './pages/dashboard/dashboard.component/dashboard.component';
import { DashboardHomeComponent } from './pages/dashboard/dashboard-home.component/dashboard-home.component';
import { SavedSearchesComponent } from './pages/dashboard/saved-searches.component/saved-searches.component';
import { MyVisitsComponent } from './pages/dashboard/my-visits.component/my-visits.component';
import { MyOffersComponent } from './pages/dashboard/my-offers.component/my-offers.component';
import { NotificationsComponent } from './pages/dashboard/notifications.component/notifications.component';
import { AgentPropertiesComponent } from './pages/dashboard/agent-properties.component/agent-properties.component';
import { AgentVisitsComponent } from './pages/dashboard/agent-visits.component/agent-visits.component';
import { AgentOffersComponent } from './pages/dashboard/agent-offers.component/agent-offers.component';
import { ManagerDashboardComponent } from './pages/dashboard/manager-dashboard.component/manager-dashboard.component';
import { ManagerAgentsComponent } from './pages/dashboard/manager-agents.component/manager-agents.component';
import { ManagerPropertiesComponent } from './pages/dashboard/manager-properties.component/manager-properties.component';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component/admin-dashboard.component';
import { AdminManagersComponent } from './pages/dashboard/admin-managers.component/admin-managers.component';
import { AdminAgentsComponent } from './pages/dashboard/admin-agents.component/admin-agents.component';
import { AdminAgencyInfoComponent } from './pages/dashboard/admin-agency-info.component/admin-agency-info.component';
import { dashboardRoleGuard } from './shared/guards/dashboard-role.guard';

export const routes: Routes = [
    {
      path: '',
      title: 'Home',
      component: HomepageComponent
    },
    {
        path: 'auth/login', 
        title: 'Login',
        component: LoginComponent,
        canActivate: [guestGuard]
    },
    {
        path: 'auth/register', 
        title: 'Register',
        component: RegisterUserComponent,
        canActivate: [guestGuard]
    },
    {
        path: 'auth/register-business',
        title: 'Register Business',
        component: RegisterBusinessComponent,
        canActivate: [guestGuard]
    },
    {
        path: 'pages/properties-page',
        title: 'Properties',
        component: PropertiesPageComponent
    },
    {
        path: 'pages/property-detail/:id',
        title: 'Property Detail',
        component: PropertyDetailPage
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [dashboardRoleGuard],
        children: [
            { path: 'home', title: 'Dashboard', component: DashboardHomeComponent },
            { path: 'saved-searches', title: 'Ricerche Salvate', component: SavedSearchesComponent },
            { path: 'visits', title: 'Le Mie Visite', component: MyVisitsComponent },
            { path: 'offers', title: 'Le Mie Offerte', component: MyOffersComponent },
            { path: 'notifications', title: 'Notifiche', component: NotificationsComponent },
            { path: 'agent-properties', title: 'I Miei Immobili', component: AgentPropertiesComponent },
            { path: 'agent-visits', title: 'Visite', component: AgentVisitsComponent },
            { path: 'agent-offers', title: 'Offerte', component: AgentOffersComponent },
            { path: 'manager-home', title: 'Dashboard Manager', component: ManagerDashboardComponent },
            { path: 'manager-agents', title: 'Gestione Agenti', component: ManagerAgentsComponent },
            { path: 'manager-properties', title: 'Gestione Immobili', component: ManagerPropertiesComponent },
            { path: 'admin-home', title: 'Dashboard Admin', component: AdminDashboardComponent },
            { path: 'admin-managers', title: 'Gestori Agenzia', component: AdminManagersComponent },
            { path: 'admin-agents', title: 'Agenti Agenzia', component: AdminAgentsComponent },
            { path: 'admin-agency-info', title: 'Info Azienda', component: AdminAgencyInfoComponent },
        ]
    }
]