export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
}

export interface UserData {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}
