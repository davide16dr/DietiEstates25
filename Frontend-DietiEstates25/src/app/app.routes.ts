import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component/login.component';

export const routes: Routes = [
    {
        path: 'auth/login', 
        title: 'Login',
        component: LoginComponent
    }
  ]