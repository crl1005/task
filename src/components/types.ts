export interface CalEvent {
  id: string;
  title: string;
  startHour: number;
  endHour: number;
  color: string;
  lightColor: string;
  date: string;
}

export const HOUR_HEIGHT = 64;
export const START_HOUR = 6;
export const END_HOUR = 21;
export const TIME_COL_W = 60;

export const DAY_LABELS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const PALETTE = [
  { bg: "#5B8DB8", light: "#EBF2F9" },
  { bg: "#6BA67A", light: "#EBF5EF" },
  { bg: "#C4943A", light: "#FBF3E6" },
  { bg: "#B86060", light: "#F9EDED" },
  { bg: "#8B6BA8", light: "#F0EBF6" },
  { bg: "#5BA69A", light: "#EBF5F3" },
];

export interface AddFormState {
  date: string;
  startHour: number;
  endHour: number;
  title: string;
  paletteIdx: number;
}