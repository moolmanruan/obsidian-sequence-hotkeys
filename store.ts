import { createSlice, configureStore, PayloadAction } from "@reduxjs/toolkit";

interface IAppState {
	filter: string;
}

const initialState: IAppState = {
	filter: "",
};

const appSlice = createSlice({
	name: "app",
	initialState,
	reducers: {
		changeFilter: (state, action: PayloadAction<string>) => {
			state.filter = action.payload;
		},
	},
});

export const { changeFilter } = appSlice.actions;

export const store = configureStore({
	reducer: appSlice.reducer,
});
