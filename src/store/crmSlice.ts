import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { HCP, Interaction, ScheduleItem, ViewType } from '../types';
import { FollowUp, fetchHcps, fetchInteractions, fetchSchedule, fetchFollowups, createHcp, createInteraction, createSchedule } from '../api';

interface CrmState {
  currentView: ViewType;
  hcps: HCP[];
  interactions: Interaction[];
  schedule: ScheduleItem[];
  followups: FollowUp[];
  isLoading: boolean;
  directorySearch: string;
  interactionsSearch: string;
  presetLogHcp: HCP | null;
}

const initialState: CrmState = {
  currentView: 'dashboard',
  hcps: [],
  interactions: [],
  schedule: [],
  followups: [],
  isLoading: true,
  directorySearch: '',
  interactionsSearch: '',
  presetLogHcp: null,
};

export const loadInitialData = createAsyncThunk(
  'crm/loadInitialData',
  async () => {
    const [hcpsData, interactionsData, scheduleData, followupsData] = await Promise.all([
      fetchHcps(),
      fetchInteractions(),
      fetchSchedule(),
      fetchFollowups()
    ]);
    return { hcpsData, interactionsData, scheduleData, followupsData };
  }
);

export const addHcp = createAsyncThunk(
  'crm/addHcp',
  async (newHcp: HCP) => {
    return await createHcp(newHcp);
  }
);

export const addScheduleItem = createAsyncThunk(
  'crm/addScheduleItem',
  async (newSched: Omit<ScheduleItem, 'id'>) => {
    const item: ScheduleItem = { ...newSched, id: `sched-${Date.now()}` };
    return await createSchedule(item);
  }
);

export const logInteraction = createAsyncThunk(
  'crm/logInteraction',
  async (newLog: Omit<Interaction, 'refId' | 'timestamp'>) => {
    const indexCode = `#IX-${Math.floor(1000 + Math.random() * 9000)}`;
    const savedLog = await createInteraction({
      ...newLog,
      refId: indexCode
    } as Omit<Interaction, 'timestamp'>);
    // Refetch followups and HCPs since backend may auto-create both
    const [updatedFollowups, updatedHcps] = await Promise.all([
      fetchFollowups(),
      fetchHcps()
    ]);
    return { savedLog, updatedFollowups, updatedHcps };
  }
);

const crmSlice = createSlice({
  name: 'crm',
  initialState,
  reducers: {
    setCurrentView(state, action: PayloadAction<ViewType>) {
      state.currentView = action.payload;
    },
    setDirectorySearch(state, action: PayloadAction<string>) {
      state.directorySearch = action.payload;
    },
    setInteractionsSearch(state, action: PayloadAction<string>) {
      state.interactionsSearch = action.payload;
    },
    setPresetLogHcp(state, action: PayloadAction<HCP | null>) {
      state.presetLogHcp = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadInitialData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadInitialData.fulfilled, (state, action) => {
        state.hcps = action.payload.hcpsData;
        state.interactions = action.payload.interactionsData;
        state.schedule = action.payload.scheduleData;
        state.followups = action.payload.followupsData;
        state.isLoading = false;
      })
      .addCase(loadInitialData.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(addHcp.fulfilled, (state, action) => {
        state.hcps.unshift(action.payload);
      })
      .addCase(addScheduleItem.fulfilled, (state, action) => {
        state.schedule.unshift(action.payload);
      })
      .addCase(logInteraction.fulfilled, (state, action) => {
        state.interactions.unshift(action.payload.savedLog);
        if (action.payload.updatedFollowups) {
           state.followups = action.payload.updatedFollowups;
        }
        if (action.payload.updatedHcps) {
           state.hcps = action.payload.updatedHcps;
        }
        // Update HCP last activity
        const hcp = state.hcps.find(h => h.id === action.payload.savedLog.hcpId);
        if (hcp) {
          hcp.lastActivity = 'Just Now';
          hcp.lastCallDays = 0;
        }
        state.currentView = 'interactions';
      })
      .addCase(logInteraction.rejected, (state, action) => {
        console.error('logInteraction rejected:', action.error);
      });
  }
});

export const { setCurrentView, setDirectorySearch, setInteractionsSearch, setPresetLogHcp } = crmSlice.actions;
export default crmSlice.reducer;
