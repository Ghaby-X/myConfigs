import { createState } from "ags"

// Shared UI state. The calendar popup and the control panel are mutually
// exclusive: opening one closes the other.
export const [calendarOpen, setCalendarOpen] = createState(false)
export const [panelOpen, setPanelOpen] = createState(false)
export const [themePickerOpen, setThemePickerOpen] = createState(false)
export const [wallpaperPickerOpen, setWallpaperPickerOpen] = createState(false)

export function toggleCalendar() {
  const open = !calendarOpen.get()
  if (open) {
    setPanelOpen(false)
    setThemePickerOpen(false)
    setWallpaperPickerOpen(false)
  }
  setCalendarOpen(open)
}

export function togglePanel() {
  const open = !panelOpen.get()
  if (open) {
    setCalendarOpen(false)
    setThemePickerOpen(false)
    setWallpaperPickerOpen(false)
  }
  setPanelOpen(open)
}

export function toggleThemePicker() {
  const open = !themePickerOpen.get()
  if (open) {
    setCalendarOpen(false)
    setPanelOpen(false)
    setWallpaperPickerOpen(false)
  }
  setThemePickerOpen(open)
}

export function toggleWallpaperPicker() {
  const open = !wallpaperPickerOpen.get()
  if (open) {
    setCalendarOpen(false)
    setPanelOpen(false)
    setThemePickerOpen(false)
  }
  setWallpaperPickerOpen(open)
}
