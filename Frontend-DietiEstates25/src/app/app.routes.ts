import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component/login.component';
import { RegisterUserComponent } from './auth/register/register-user.component/register-user.component';
import { RegisterBusinessComponent } from './auth/register/register-business.component/register-business.component';
import { HomepageComponent } from './pages/homepage.component/homepage.component';
import { PropertiesPageComponent } from './pages/properties-page.component/properties-page.component';
import { guestGuard } from './shared/guards/guest.guard';
import { PropertyDetailPage } from './pages/property-detail/property-detail.page/property-detail.page';

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
    }
  ]