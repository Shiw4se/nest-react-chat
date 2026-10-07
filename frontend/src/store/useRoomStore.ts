import { create } from 'zustand';
import toast from 'react-hot-toast';
import { RoomsApi } from '../api/services/roomsApi';
import { getApiErrorMessage } from '../api/axios';
import type { Room } from '../types/room';
import i18n from '../config/i18n';

interface RoomState {
  myRooms: Room[];
  publicRooms: Room[];
  activeRoomId: string | null;
  isLoading: boolean;
  fetchMyRooms: () => Promise<void>;
  fetchPublicRooms: () => Promise<void>;
  setActiveRoom: (roomId: string | null) => void;
  createAndJoinRoom: (name: string, type: 'PUBLIC' | 'PRIVATE') => Promise<void>;
  leaveRoom: (roomId: string) => Promise<boolean>;
  deleteRoom: (roomId: string) => Promise<boolean>;
  clearRooms: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  myRooms: [],
  publicRooms: [],
  activeRoomId: null,
  isLoading: false,

  fetchMyRooms: async () => {
    set({ isLoading: true });
    try {
      const rooms = await RoomsApi.getMyRooms();
      set({ myRooms: rooms });
    } catch {
      toast.error(i18n.t('rooms.fetch_error', 'Failed to load your rooms'));
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPublicRooms: async () => {
    set({ isLoading: true });
    try {
      const rooms = await RoomsApi.getPublicRooms();
      set({ publicRooms: rooms });
    } catch {
      toast.error(i18n.t('rooms.fetch_error', 'Failed to load public rooms'));
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveRoom: (roomId) => {
    set({ activeRoomId: roomId });
  },

  createAndJoinRoom: async (name, type) => {
    try {
      const newRoom = await RoomsApi.createRoom(name, type);
      await get().fetchMyRooms();
      set({ activeRoomId: newRoom.id });

      toast.success(i18n.t('rooms.create_success', 'Room {{name}} created!', { name }));
    } catch {
      toast.error(i18n.t('rooms.create_error', 'Failed to create room'));
    }
  },

  leaveRoom: async (roomId) => {
    try {
      await RoomsApi.leaveRoom(roomId);
      set((state) => ({
        activeRoomId: state.activeRoomId === roomId ? null : state.activeRoomId,
        myRooms: state.myRooms.filter((r) => r.id !== roomId),
      }));
      toast.success(i18n.t('room.left', 'You left the room'));
      void get().fetchPublicRooms();
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error) || i18n.t('room.leave_error', 'Failed to leave room'));
      return false;
    }
  },

  deleteRoom: async (roomId) => {
    try {
      await RoomsApi.deleteRoom(roomId);
      set((state) => ({
        activeRoomId: state.activeRoomId === roomId ? null : state.activeRoomId,
        myRooms: state.myRooms.filter((r) => r.id !== roomId),
        publicRooms: state.publicRooms.filter((r) => r.id !== roomId),
      }));
      toast.success(i18n.t('room.deleted', 'Room deleted'));
      return true;
    } catch (error) {
      toast.error(
        getApiErrorMessage(error) || i18n.t('room.delete_error', 'Failed to delete room'),
      );
      return false;
    }
  },

  clearRooms: () => set({ myRooms: [], publicRooms: [], activeRoomId: null }),
}));
