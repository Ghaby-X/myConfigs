import { createState } from "ags"

// Shared UI state. The calendar popup and the control panel are mutually
// exclusive: opening one closes the other.
export const [calendarOpen, setCalendarOpen] = createState(false)
export const [panelOpen, setPanelOpen] = createState(false)
export const [themePickerOpen, setThemePickerOpen] = createState(false)

export function toggleCalendar() {
  const open = !calendarOpen.get()
  if (open) {
    setPanelOpen(false)
    setThemePickerOpen(false)
  }
  setCalendarOpen(open)
}

export function togglePanel() {
  const open = !panelOpen.get()
  if (open) {
    setCalendarOpen(false)
    setThemePickerOpen(false)
  }
  setPanelOpen(open)
}

export function toggleThemePicker() {
  const open = !themePickerOpen.get()
  if (open) {
    setCalendarOpen(false)
    setPanelOpen(false)
  }
  setThemePickerOpen(open)
}
