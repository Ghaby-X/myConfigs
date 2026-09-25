import { createState } from "ags"
import { readJSON, writeJSON } from "./store"

// One-off tasks — persist until checked off and cleared (as opposed to
// routine.ts, which resets daily). See routine.ts for that distinction.
export type Todo = { id: number; text: string; done: boolean }

const initial = readJSON<Todo[]>("todos", [])
export const [todos, setTodos] = createState<Todo[]>(initial)
let nextId = 1 + initial.reduce((m, t) => Math.max(m, t.id), 0)

function persist(list: Todo[]) {
  setTodos(list)
  writeJSON("todos", list)
}

export function addTodo(text: string) {
  const t = text.trim()
  if (!t) return
  persist([...todos.get(), { id: nextId++, text: t, done: false }])
}

export function toggleTodo(id: number) {
  persist(todos.get().map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
}

export function removeTodo(id: number) {
  persist(todos.get().filter((t) => t.id !== id))
}

export function clearCompletedTodos() {
  persist(todos.get().filter((t) => !t.done))
}
