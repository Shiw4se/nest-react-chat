import { RoomType } from '@prisma/client';
import { RoomsRepository } from './rooms.repository';

export type PublicRooms = Awaited<ReturnType<RoomsRepository['findPublicRooms']>>;
export type MyRooms = Awaited<ReturnType<RoomsRepository['findMyRooms']>>;

export interface IRoomsRepository {
  create(ownerId: string, name: string, type: RoomType, inviteToken: string | null): Promise<Awaited<ReturnType<RoomsRepository['create']>>>;
  findMyRooms(userId: string): Promise<MyRooms>;
  findPublicRooms(): Promise<PublicRooms>;
  findById(id: string): ReturnType<RoomsRepository['findById']>;
  findByInviteToken(inviteToken: string): ReturnType<RoomsRepository['findByInviteToken']>;
  findMember(userId: string, roomId: string): ReturnType<RoomsRepository['findMember']>;
  addMember(userId: string, roomId: string): ReturnType<RoomsRepository['addMember']>;
  updateToken(roomId: string, inviteToken: string): ReturnType<RoomsRepository['updateToken']>;
}
