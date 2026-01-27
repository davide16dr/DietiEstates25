export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    accessToken: string;
    tokenType: string;
    userId: string;
    email: string;
    role: string;
  }
  