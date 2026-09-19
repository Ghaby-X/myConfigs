import { createState } from "ags"

// Shared between the bar's clock (toggle + "open" highlight) and the popup.
export const [calendarOpen, setCalendarOpen] = createState(false)
