import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type FinConTab =
  | 'overview'
  | 'transactions'
  | 'revenue'
  | 'expenses'
  | 'reports'
  | 'reconciliation';

export type FinConPeriod = 'MTD' | 'QTD' | 'YTD';

interface FinConUiState {
  activeTab: FinConTab;
  period: FinConPeriod;
  txSearch: string;
  txType: string;
  txBranch: string;
  txVisible: number;
  expModal: boolean;
  reportPeriod: string;
}

const initialState: FinConUiState = {
  activeTab: 'overview',
  period: 'MTD',
  txSearch: '',
  txType: 'All',
  txBranch: 'All',
  txVisible: 10,
  expModal: false,
  reportPeriod: 'Monthly',
};

const finConUiSlice = createSlice({
  name: 'finConUi',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<FinConTab>) => {
      state.activeTab = action.payload;
    },
    setPeriod: (state, action: PayloadAction<FinConPeriod>) => {
      state.period = action.payload;
    },
    setTxSearch: (state, action: PayloadAction<string>) => {
      state.txSearch = action.payload;
    },
    setTxType: (state, action: PayloadAction<string>) => {
      state.txType = action.payload;
    },
    setTxBranch: (state, action: PayloadAction<string>) => {
      state.txBranch = action.payload;
    },
    setTxVisible: (state, action: PayloadAction<number>) => {
      state.txVisible = action.payload;
    },
    openExpenseModal: (state) => {
      state.expModal = true;
    },
    closeExpenseModal: (state) => {
      state.expModal = false;
    },
    setReportPeriod: (state, action: PayloadAction<string>) => {
      state.reportPeriod = action.payload;
    },
  },
});

export const {
  setActiveTab,
  setPeriod,
  setTxSearch,
  setTxType,
  setTxBranch,
  setTxVisible,
  openExpenseModal,
  closeExpenseModal,
  setReportPeriod,
} = finConUiSlice.actions;

export default finConUiSlice.reducer;
