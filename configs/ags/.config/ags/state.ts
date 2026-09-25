import { createState } from "ags"

// Shared UI state. The calendar popup and the control panel are mutually
// exclusive: opening one closes the other.
export const [calendarOpen, setCalendarOpen] = createState(false)
export const [panelOpen, setPanelOpen] = createState(false)
export const [themePickerOpen, setThemePickerOpen] = createState(false)
export const [wallpaperPickerOpen, setWallpaperPickerOpen] = createState(false)
export const [keysOpen, setKeysOpen] = createState(false)
export const [productivityOpen, setProductivityOpen] = createState(false)

export function toggleCalendar() {
  const open = !calendarOpen.get()
  if (open) {
    setPanelOpen(false)
    setThemePickerOpen(false)
    setWallpaperPickerOpen(false)
    setKeysOpen(false)
    setProductivityOpen(false)
  }
  setCalendarOpen(open)
}

export function togglePanel() {
  const open = !panelOpen.get()
  if (open) {
    setCalendarOpen(false)
    setThemePickerOpen(false)
    setWallpaperPickerOpen(false)
    setKeysOpen(false)
    setProductivityOpen(false)
  }
  setPanelOpen(open)
}

export function toggleThemePicker() {
  const open = !themePickerOpen.get()
  if (open) {
    setCalendarOpen(false)
    setPanelOpen(false)
    setWallpaperPickerOpen(false)
    setKeysOpen(false)
    setProductivityOpen(false)
  }
  setThemePickerOpen(open)
}

export function toggleWallpaperPicker() {
  const open = !wallpaperPickerOpen.get()
  if (open) {
    setCalendarOpen(false)
    setPanelOpen(false)
    setThemePickerOpen(false)
    setKeysOpen(false)
    setProductivityOpen(false)
  }
  setWallpaperPickerOpen(open)
}

export function toggleKeys() {
  const open = !keysOpen.get()
  if (open) {
    setCalendarOpen(false)
    setPanelOpen(false)
    setThemePickerOpen(false)
    setWallpaperPickerOpen(false)
    setProductivityOpen(false)
  }
  setKeysOpen(open)
}

export function toggleProductivity() {
  const open = !productivityOpen.get()
  if (open) {
    setCalendarOpen(false)
    setPanelOpen(false)
    setThemePickerOpen(false)
    setWallpaperPickerOpen(false)
    setKeysOpen(false)
  }
  setProductivityOpen(open)
}
