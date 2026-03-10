export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
  };
}

export interface UserData {
  id: string;
  username: string;
}