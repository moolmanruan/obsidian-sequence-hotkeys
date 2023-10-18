import { createSlice, configureStore, PayloadAction } from "@reduxjs/toolkit";

export type FilterOption = "All" | "Assigned" | "Unassigned";

interface IAppState {
	filter: string;
	filterOption: FilterOption;
}

const initialState: IAppState = {
	filter: "",
	filterOption: "All",
};

const appSlice = createSlice({
	name: "app",
	initialState,
	reducers: {
		changeFilter: (state, action: PayloadAction<string>) => {
			state.filter = action.payload;
		},
		changeFilterOption: (state, action: PayloadAction<FilterOption>) => {
			state.filterOption = action.payload;
		},
	},
});

export const { changeFilter, changeFilterOption } = appSlice.actions;

export const store = configureStore({
	reducer: appSlice.reducer,
});
