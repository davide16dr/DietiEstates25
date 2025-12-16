import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component/login.component';
import { RegisterUserComponent } from './auth/register/register-user.component/register-user.component';
import { RegisterBusinessComponent } from './auth/register/register-business.component/register-business.component';
export const routes: Routes = [
    {
        path: 'auth/login', 
        title: 'Login',
        component: LoginComponent
    },

    {
        path: 'auth/register', 
        title: 'Register',
        component: RegisterUserComponent
    },

    {
        path: 'auth/register-business',
        title: 'Register Business',
        component: RegisterBusinessComponent
    }
  ]