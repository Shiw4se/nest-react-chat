import { RoomType } from '@prisma/client';
import { RoomsRepository } from './rooms.repository';

export type PublicRooms = Awaited<
  ReturnType<RoomsRepository['findPublicRooms']>
>;
export type MyRooms = Awaited<ReturnType<RoomsRepository['findMyRooms']>>;
export type RoomMembers = Awaited<ReturnType<RoomsRepository['findMembers']>>;

export interface IRoomsRepository {
  create(
    ownerId: string,
    name: string,
    type: RoomType,
    inviteToken: string | null,
  ): Promise<Awaited<ReturnType<RoomsRepository['create']>>>;
  findMyRooms(userId: string): Promise<MyRooms>;
  findPublicRooms(): Promise<PublicRooms>;
  findById(id: string): ReturnType<RoomsRepository['findById']>;
  findByInviteToken(
    inviteToken: string,
  ): ReturnType<RoomsRepository['findByInviteToken']>;
  findMember(
    userId: string,
    roomId: string,
  ): ReturnType<RoomsRepository['findMember']>;
  findMembers(roomId: string): Promise<RoomMembers>;
  findMemberIds(roomId: string): Promise<string[]>;
  markRead(userId: string, roomId: string): Promise<void>;
  findLastMessage(
    roomId: string,
  ): ReturnType<RoomsRepository['findLastMessage']>;
  addMember(
    userId: string,
    roomId: string,
  ): ReturnType<RoomsRepository['addMember']>;
  removeMember(
    userId: string,
    roomId: string,
  ): ReturnType<RoomsRepository['removeMember']>;
  updateToken(
    roomId: string,
    inviteToken: string,
  ): ReturnType<RoomsRepository['updateToken']>;
  delete(roomId: string): ReturnType<RoomsRepository['delete']>;
}
