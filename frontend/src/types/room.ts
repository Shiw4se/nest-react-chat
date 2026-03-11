export interface Room {
  id: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE';
  ownerId?: string;
  inviteToken?: string;
  _count?: {
    members: number;
  };
}
