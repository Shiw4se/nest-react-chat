import { create } from 'zustand';
import toast from 'react-hot-toast';
import { RoomsApi } from '../api/services/roomsApi';
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
    } catch (error: any) {
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
    } catch (error: any) {
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

      toast.success(
        i18n.t('rooms.create_success', 'Room {{name}} created!', { name })
      );
    } catch (error: any) {
      toast.error(
        i18n.t('rooms.create_error', 'Failed to create room')
      );
    }
  },

  clearRooms: () => set({ myRooms: [], publicRooms: [], activeRoomId: null }),
}));