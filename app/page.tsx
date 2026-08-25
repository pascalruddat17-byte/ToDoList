"use client";

import type { CSSProperties, ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type View = "tasks" | "calendar" | "cosmetics";
type Filter = "today" | "all" | "done";
type Priority = "low" | "medium" | "high";
type Radius = "sharp" | "soft" | "round";
type Density = "cozy" | "compact";

type Task = {
  id: string;
  title: string;
  note: string;
  priority: Priority;
  categoryId: string;
  done: boolean;
  createdAt: string;
  due: string;
};

type Category = {
  id: string;
  name: string;
  color: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  note: string;
  categoryId: string;
};

type CalendarDay = {
  date: Date;
  value: string;
  inMonth: boolean;
  events: CalendarEvent[];
};

type ThemeSettings = {
  appName: string;
  accent: string;
  background: string;
  surface: string;
  ink: string;
  radius: Radius;
  density: Density;
};

type AppBackup = {
  version: number;
  savedAt: string;
  tasks: Partial<Task>[];
  categories: Partial<Category>[];
  theme: Partial<ThemeSettings>;
  events: Partial<CalendarEvent>[];
};

const taskStorageKey = "pulse-todo-tasks";
const categoryStorageKey = "pulse-todo-categories";
const themeStorageKey = "pulse-todo-theme";
const eventStorageKey = "pulse-calendar-events";
const backupStorageKey = "pulse-todo-full-backup";
const backupVersion = 1;

const defaultCategories: Category[] = [
  { id: "cat-personal", name: "Privat", color: "#246bfe" },
  { id: "cat-work", name: "Arbeit", color: "#ef594c" },
  { id: "cat-ideas", name: "Ideen", color: "#0f8f62" },
  { id: "cat-fitness", name: "Fitness", color: "#9b5cff" },
];

const defaultTheme: ThemeSettings = {
  appName: "Pulse Tasks",
  accent: "#246bfe",
  background: "#f5f4ee",
  surface: "#fffefa",
  ink: "#171a1f",
  radius: "soft",
  density: "cozy",
};

const starterTasks: Task[] = [
  {
    id: "starter-1",
    title: "Morgenroutine planen",
    note: "10 Minuten, Kaffee, Überblick.",
    priority: "high",
    categoryId: "cat-personal",
    done: false,
    createdAt: new Date().toISOString(),
    due: "today",
  },
  {
    id: "starter-2",
    title: "Eine Sache wirklich fertig machen",
    note: "Kein Multitasking.",
    priority: "medium",
    categoryId: "cat-work",
    done: false,
    createdAt: new Date().toISOString(),
    due: "today",
  },
  {
    id: "starter-3",
    title: "Neue App-Farben testen",
    note: "Im Cosmetics Tab.",
    priority: "low",
    categoryId: "cat-ideas",
    done: true,
    createdAt: new Date().toISOString(),
    due: "soon",
  },
];

const priorityCopy: Record<Priority, string> = {
  low: "Leicht",
  medium: "Normal",
  high: "Fokus",
};

const radiusValue: Record<Radius, string> = {
  sharp: "0.55rem",
  soft: "1.05rem",
  round: "1.45rem",
};

const palettes = [
  ["Ocean", "#246bfe", "#f5f4ee", "#fffefa", "#171a1f"],
  ["Matcha", "#0f8f62", "#eff6ee", "#fffefa", "#172018"],
  ["Candy", "#e94986", "#fff2f7", "#ffffff", "#21151b"],
  ["Night", "#9b5cff", "#15161d", "#222432", "#f7f3ff"],
  ["Solar", "#f2a51f", "#fff6df", "#fffefa", "#241b0d"],
  ["Glacier", "#37a2ff", "#eef8ff", "#ffffff", "#102238"],
  ["Royal", "#3853d8", "#f0f2ff", "#ffffff", "#14172f"],
  ["Mint", "#00a878", "#ecfff8", "#ffffff", "#08251d"],
  ["Lime", "#75a900", "#f6ffe9", "#ffffff", "#1b2408"],
  ["Rose", "#ff4d7d", "#fff0f4", "#ffffff", "#29111a"],
  ["Coral", "#ff6b4a", "#fff3ef", "#ffffff", "#2b1510"],
  ["Lavender", "#8c6cff", "#f5f1ff", "#ffffff", "#1d1538"],
  ["Grape", "#b347d9", "#fbf0ff", "#ffffff", "#26122f"],
  ["Cyber", "#00c2ff", "#07131c", "#101f2b", "#ecfbff"],
  ["Matrix", "#45e06f", "#07140b", "#102015", "#edfff1"],
  ["Ruby", "#d7264d", "#18080e", "#271018", "#fff1f5"],
  ["Amber", "#f59e0b", "#191006", "#2a1b0a", "#fff7e8"],
  ["Ice", "#60a5fa", "#f8fbff", "#ffffff", "#0b1f38"],
  ["Slate", "#64748b", "#f3f5f8", "#ffffff", "#111827"],
  ["Peach", "#fb7185", "#fff6f2", "#ffffff", "#2a1715"],
  ["Aqua", "#14b8a6", "#ecfeff", "#ffffff", "#082f35"],
  ["Violet", "#7c3aed", "#f6f0ff", "#ffffff", "#21133d"],
  ["Neon", "#22d3ee", "#050816", "#111827", "#e9fbff"],
  ["Graphite", "#94a3b8", "#101216", "#1b2027", "#f4f7fb"],
  ["Bubble", "#ec4899", "#fff7fd", "#ffffff", "#311020"],
];

function getDateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T12:00:00`));
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getDateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getReadableTextColor(color: string) {
  const hex = color.replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return "#ffffff";
  }

  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? "#111827" : "#ffffff";
}

function addMonthsToDate(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

function getMonthDays(cursor: Date, events: CalendarEvent[]): CalendarDay[] {
  const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12);
  const start = new Date(firstDay);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  start.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const value = getDateValue(date);

    return {
      date,
      value,
      inMonth: date.getMonth() === cursor.getMonth(),
      events: events.filter((event) => event.date === value),
    };
  });
}

function readJson<T>(key: string, fallback: T): T {
  const saved = window.localStorage.getItem(key);

  if (!saved) {
    return fallback;
  }

  try {
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

function createBackup(
  tasks: Task[],
  categories: Category[],
  theme: ThemeSettings,
  events: CalendarEvent[],
): AppBackup {
  return {
    version: backupVersion,
    savedAt: new Date().toISOString(),
    tasks,
    categories,
    theme,
    events,
  };
}

function normalizeCategories(categories: Partial<Category>[] | undefined) {
  const cleanCategories = (categories ?? [])
    .filter((category) => category.name?.trim())
    .map((category, index) => ({
      id: category.id ?? `cat-${index}-${Date.now()}`,
      name: category.name?.trim() ?? "Kategorie",
      color: category.color ?? defaultCategories[index % defaultCategories.length].color,
    }));

  return cleanCategories.length ? cleanCategories : defaultCategories;
}

function normalizeTasks(tasks: Partial<Task>[], categories: Category[]) {
  const fallbackCategory = categories[0]?.id ?? defaultCategories[0].id;

  return tasks.map((task, index) => ({
    id: task.id ?? `task-${index}-${Date.now()}`,
    title: task.title ?? "Neue Aufgabe",
    note: task.note ?? "",
    priority: task.priority ?? "medium",
    categoryId: task.categoryId ?? fallbackCategory,
    done: Boolean(task.done),
    createdAt: task.createdAt ?? new Date().toISOString(),
    due: task.due ?? "today",
  }));
}

function normalizeEvents(
  events: Partial<CalendarEvent>[] | undefined,
  categories: Category[],
) {
  const fallbackCategory = categories[0]?.id ?? defaultCategories[0].id;

  return (events ?? []).map((event, index) => ({
    id: event.id ?? `event-${index}-${Date.now()}`,
    title: event.title ?? "Neuer Termin",
    date: event.date ?? getDateInputValue(1),
    time: event.time ?? "",
    note: event.note ?? "",
    categoryId: event.categoryId ?? fallbackCategory,
  }));
}

function findCategory(categories: Category[], id: string) {
  return categories.find((category) => category.id === id) ?? categories[0];
}

export default function Home() {
  const [view, setView] = useState<View>("tasks");
  const [tasks, setTasks] = useState<Task[]>(starterTasks);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(getDateInputValue(1));
  const [selectedDate, setSelectedDate] = useState(getDateInputValue(0));
  const [eventTime, setEventTime] = useState("09:00");
  const [eventNote, setEventNote] = useState("");
  const [eventCategoryId, setEventCategoryId] = useState(defaultCategories[0].id);
  const [calendarCursor, setCalendarCursor] = useState(
    new Date(`${getDateInputValue(0)}T12:00:00`),
  );
  const [priority, setPriority] = useState<Priority>("medium");
  const [taskCategoryId, setTaskCategoryId] = useState(defaultCategories[0].id);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#246bfe");
  const [filter, setFilter] = useState<Filter>("today");
  const [isReady, setIsReady] = useState(false);
  const [backupStatus, setBackupStatus] = useState("Automatisch geschützt");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedBackup = readJson<AppBackup | null>(backupStorageKey, null);
      const savedCategories = readJson<Category[]>(
        categoryStorageKey,
        normalizeCategories(savedBackup?.categories),
      );
      const cleanCategories = normalizeCategories(savedCategories);
      const savedTasks = readJson<Partial<Task>[]>(
        taskStorageKey,
        savedBackup?.tasks ?? starterTasks,
      );
      const savedTheme = readJson<Partial<ThemeSettings>>(
        themeStorageKey,
        savedBackup?.theme ?? defaultTheme,
      );
      const savedEvents = readJson<Partial<CalendarEvent>[]>(
        eventStorageKey,
        savedBackup?.events ?? [],
      );

      setCategories(cleanCategories);
      setTasks(normalizeTasks(savedTasks, cleanCategories));
      setEvents(normalizeEvents(savedEvents, cleanCategories));
      setTheme({ ...defaultTheme, ...savedTheme });
      setTaskCategoryId(cleanCategories[0].id);
      setEventCategoryId(cleanCategories[0].id);
      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isReady) {
      window.localStorage.setItem(taskStorageKey, JSON.stringify(tasks));
      window.localStorage.setItem(categoryStorageKey, JSON.stringify(categories));
      window.localStorage.setItem(themeStorageKey, JSON.stringify(theme));
      window.localStorage.setItem(eventStorageKey, JSON.stringify(events));
      window.localStorage.setItem(
        backupStorageKey,
        JSON.stringify(createBackup(tasks, categories, theme, events)),
      );
    }
  }, [categories, events, isReady, tasks, theme]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.done).length;
    const open = total - done;
    const focus = tasks.filter(
      (task) => !task.done && task.priority === "high",
    ).length;
    const progress = total ? Math.round((done / total) * 100) : 0;

    return { total, done, open, focus, progress };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    let nextTasks = tasks;

    if (filter === "done") {
      nextTasks = nextTasks.filter((task) => task.done);
    }

    if (filter === "today") {
      nextTasks = nextTasks.filter((task) => task.due === "today" && !task.done);
    }

    if (categoryFilter !== "all") {
      nextTasks = nextTasks.filter((task) => task.categoryId === categoryFilter);
    }

    return nextTasks;
  }, [categoryFilter, filter, tasks]);

  const sortedEvents = useMemo(
    () =>
      [...events].sort((first, second) =>
        `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`),
      ),
    [events],
  );

  const tomorrowEvents = useMemo(() => {
    const tomorrow = getDateInputValue(1);
    return sortedEvents.filter((event) => event.date === tomorrow);
  }, [sortedEvents]);

  const calendarDays = useMemo(
    () => getMonthDays(calendarCursor, sortedEvents),
    [calendarCursor, sortedEvents],
  );

  const appStyle = {
    "--app-bg": theme.background,
    "--app-surface": theme.surface,
    "--app-accent": theme.accent,
    "--app-accent-contrast": getReadableTextColor(theme.accent),
    "--app-bg-contrast": getReadableTextColor(theme.background),
    "--app-surface-contrast": getReadableTextColor(theme.surface),
    "--app-ink-contrast": getReadableTextColor(theme.ink),
    "--app-ink": theme.ink,
    "--app-radius": radiusValue[theme.radius],
    "--density-pad": theme.density === "compact" ? "0.52rem" : "0.72rem",
  } as CSSProperties;

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      note: note.trim(),
      priority,
      categoryId: taskCategoryId,
      done: false,
      createdAt: new Date().toISOString(),
      due: "today",
    };

    setTasks((current) => [newTask, ...current]);
    setTitle("");
    setNote("");
    setPriority("medium");
    setFilter("today");
    setView("tasks");
  }

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );
  }

  function deleteTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function clearDone() {
    setTasks((current) => current.filter((task) => !task.done));
  }

  function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = newCategoryName.trim();

    if (!cleanName) {
      return;
    }

    const newCategory = {
      id: crypto.randomUUID(),
      name: cleanName,
      color: newCategoryColor,
    };

    setCategories((current) => [...current, newCategory]);
    setTaskCategoryId(newCategory.id);
    setNewCategoryName("");
  }

  function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = eventTitle.trim();

    if (!cleanTitle) {
      return;
    }

    setEvents((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: cleanTitle,
        date: eventDate,
        time: eventTime,
        note: eventNote.trim(),
        categoryId: eventCategoryId,
      },
    ]);
    setEventTitle("");
    setEventNote("");
    setEventDate(getDateInputValue(1));
    setEventTime("09:00");
    setSelectedDate(eventDate);
    setCalendarCursor(new Date(`${eventDate}T12:00:00`));
  }

  function deleteEvent(id: string) {
    setEvents((current) => current.filter((event) => event.id !== id));
  }

  function updateCategory(id: string, changes: Partial<Category>) {
    setCategories((current) =>
      current.map((category) =>
        category.id === id ? { ...category, ...changes } : category,
      ),
    );
  }

  function deleteCategory(id: string) {
    if (categories.length <= 1) {
      return;
    }

    const fallbackId =
      categories.find((category) => category.id !== id)?.id ?? defaultCategories[0].id;
    const nextCategories = categories.filter((category) => category.id !== id);

    setCategories(nextCategories);
    setTasks((current) =>
      current.map((task) =>
        task.categoryId === id ? { ...task, categoryId: fallbackId } : task,
      ),
    );
    setEvents((current) =>
      current.map((event) =>
        event.categoryId === id ? { ...event, categoryId: fallbackId } : event,
      ),
    );
    setCategoryFilter((current) => (current === id ? "all" : current));
    setTaskCategoryId((current) => (current === id ? fallbackId : current));
    setEventCategoryId((current) => (current === id ? fallbackId : current));
  }

  function resetCosmetics() {
    setTheme(defaultTheme);
    setCategories(defaultCategories);
    setTaskCategoryId(defaultCategories[0].id);
    setCategoryFilter("all");
    setTasks((current) =>
      current.map((task) => ({ ...task, categoryId: defaultCategories[0].id })),
    );
    setEvents((current) =>
      current.map((event) => ({ ...event, categoryId: defaultCategories[0].id })),
    );
  }

  function exportBackup() {
    const backup = createBackup(tasks, categories, theme, events);
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pulse-tasks-backup-${backup.savedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupStatus("Backup gespeichert");
  }

  function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result)) as Partial<AppBackup>;
        const cleanCategories = normalizeCategories(backup.categories);

        setCategories(cleanCategories);
        setTasks(normalizeTasks(backup.tasks ?? [], cleanCategories));
        setEvents(normalizeEvents(backup.events, cleanCategories));
        setTheme({ ...defaultTheme, ...backup.theme });
        setTaskCategoryId(cleanCategories[0].id);
        setEventCategoryId(cleanCategories[0].id);
        setCategoryFilter("all");
        setBackupStatus("Backup geladen");
      } catch {
        setBackupStatus("Backup konnte nicht geladen werden");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <main className="app-root" style={appStyle}>
      <section className="phone-shell">
        <header className="app-topbar">
          <div>
            <p className="eyebrow">
              {view === "tasks"
                ? "Heute"
                : view === "calendar"
                  ? "Kalender"
                  : "Customize"}
            </p>
            <h1>{theme.appName}</h1>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Erledigte Aufgaben entfernen"
            onClick={clearDone}
            title="Erledigte entfernen"
          >
            x
          </button>
        </header>

        <section className="tomorrow-strip" aria-label="Morgen">
          <div>
            <p className="hero-kicker">Morgen</p>
            <h2>
              {tomorrowEvents.length
                ? `${tomorrowEvents.length} Termin${tomorrowEvents.length > 1 ? "e" : ""}`
                : "Nichts geplant"}
            </h2>
          </div>
          <p>
            {tomorrowEvents[0]
              ? `${tomorrowEvents[0].time || "Ganztags"} · ${tomorrowEvents[0].title}`
              : "Dein morgiger Tag ist noch frei."}
          </p>
        </section>

        <section className="overview-grid" aria-label="Übersicht">
          <article>
            <span>Heute</span>
            <strong>{stats.open}</strong>
            <small>offen</small>
          </article>
          <article>
            <span>Morgen</span>
            <strong>{tomorrowEvents.length}</strong>
            <small>Termine</small>
          </article>
          <article>
            <span>Kalender</span>
            <strong>{events.length}</strong>
            <small>gesamt</small>
          </article>
        </section>

        <nav className="view-tabs" aria-label="App Bereiche">
          {[
            ["tasks", "Tasks"],
            ["calendar", "Kalender"],
            ["cosmetics", "Cosmetics"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={view === key ? "active" : ""}
              type="button"
              onClick={() => setView(key as View)}
            >
              {label}
            </button>
          ))}
        </nav>

        {view === "tasks" ? (
          <>
            <section className="hero-panel" aria-label="Tagesfortschritt">
              <div>
                <p className="hero-kicker">Dein Tag in Bewegung</p>
                <h2>
                  {stats.open ? `${stats.open} offene Aufgaben` : "Alles erledigt"}
                </h2>
                <p className="hero-copy">
                  {stats.focus
                    ? `${stats.focus} Fokus-Aufgabe zuerst. Danach wird es leichter.`
                    : "Sauber. Du kannst neue Aufgaben sammeln oder kurz durchatmen."}
                </p>
              </div>
              <div
                className="progress-ring"
                style={{ "--progress": `${stats.progress}%` } as CSSProperties}
                aria-label={`${stats.progress} Prozent erledigt`}
              >
                <span>{stats.progress}</span>
                <small>%</small>
              </div>
            </section>

            <form className="composer" onSubmit={addTask}>
              <label className="sr-only" htmlFor="task-title">
                Neue Aufgabe
              </label>
              <input
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Was steht als Nächstes an?"
                maxLength={72}
              />

              <label className="sr-only" htmlFor="task-note">
                Notiz
              </label>
              <input
                id="task-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Notiz optional"
                maxLength={90}
              />

              <div className="composer-row">
                <select
                  aria-label="Kategorie auswählen"
                  value={taskCategoryId}
                  onChange={(event) => setTaskCategoryId(event.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  className="add-button"
                  type="submit"
                  aria-label="Aufgabe hinzufügen"
                >
                  +
                </button>
              </div>

              <div className="priority-group" aria-label="Priorität auswählen">
                {(["low", "medium", "high"] as Priority[]).map((level) => (
                  <button
                    key={level}
                    className={priority === level ? "selected" : ""}
                    type="button"
                    onClick={() => setPriority(level)}
                  >
                    {priorityCopy[level]}
                  </button>
                ))}
              </div>
            </form>

            <nav className="filters" aria-label="Aufgaben filtern">
              {[
                ["today", "Heute"],
                ["all", "Alle"],
                ["done", "Erledigt"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={filter === key ? "active" : ""}
                  type="button"
                  onClick={() => setFilter(key as Filter)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <section className="category-panel" aria-label="Kategorien">
              <div className="category-panel-head">
                <div>
                  <p className="hero-kicker">Kategorien</p>
                  <h2>Sortieren</h2>
                </div>
                <select
                  aria-label="Kategorie filtern"
                  className="category-filter-select"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="all">Alle Kategorien</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <nav className="category-grid" aria-label="Kategorien filtern">
                <button
                  className={categoryFilter === "all" ? "active" : ""}
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                >
                  Alle
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={categoryFilter === category.id ? "active" : ""}
                    type="button"
                    onClick={() => setCategoryFilter(category.id)}
                    style={
                      {
                        "--chip": category.color,
                        "--chip-contrast": getReadableTextColor(category.color),
                      } as CSSProperties
                    }
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </section>

            <section className="task-list" aria-label="Aufgabenliste">
              {visibleTasks.length ? (
                visibleTasks.map((task) => {
                  const category = findCategory(categories, task.categoryId);

                  return (
                    <article
                      className={`task-card ${task.done ? "done" : ""} priority-${task.priority}`}
                      key={task.id}
                      style={
                        {
                          "--category": category.color,
                          "--category-contrast": getReadableTextColor(category.color),
                        } as CSSProperties
                      }
                    >
                      <button
                        className="check-button"
                        type="button"
                        aria-label={
                          task.done ? "Aufgabe wieder öffnen" : "Aufgabe erledigen"
                        }
                        onClick={() => toggleTask(task.id)}
                      >
                        {task.done ? "✓" : ""}
                      </button>

                      <div className="task-content">
                        <div className="task-line">
                          <h3>{task.title}</h3>
                          <span>{priorityCopy[task.priority]}</span>
                        </div>
                        <div className="task-meta">
                          <b style={{ "--dot": category.color } as CSSProperties}>
                            {category.name}
                          </b>
                          {task.note ? <p>{task.note}</p> : null}
                        </div>
                      </div>

                      <button
                        className="delete-button"
                        type="button"
                        aria-label="Aufgabe löschen"
                        onClick={() => deleteTask(task.id)}
                      >
                        x
                      </button>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state">
                  <p>Hier ist gerade Luft.</p>
                  <span>Füge oben eine neue Aufgabe hinzu.</span>
                </div>
              )}
            </section>
          </>
        ) : view === "calendar" ? (
          <section className="calendar-panel" aria-label="Kalender">
            <section className="month-card" aria-label="Monatskalender">
              <div className="month-toolbar">
                <button
                  type="button"
                  aria-label="Vorheriger Monat"
                  onClick={() =>
                    setCalendarCursor((current) => addMonthsToDate(current, -1))
                  }
                >
                  ‹
                </button>
                <div>
                  <p className="hero-kicker">Monat</p>
                  <h2>{formatMonthLabel(calendarCursor)}</h2>
                </div>
                <button
                  type="button"
                  aria-label="Nächster Monat"
                  onClick={() =>
                    setCalendarCursor((current) => addMonthsToDate(current, 1))
                  }
                >
                  ›
                </button>
              </div>

              <div className="weekday-row" aria-hidden="true">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="month-grid">
                {calendarDays.map((day) => (
                  <button
                    className={`day-cell ${day.inMonth ? "" : "muted"} ${
                      day.value === getDateInputValue(0) ? "today" : ""
                    } ${day.value === selectedDate ? "selected" : ""}`}
                    key={day.value}
                    type="button"
                    onClick={() => {
                      setEventDate(day.value);
                      setSelectedDate(day.value);
                      setCalendarCursor(new Date(`${day.value}T12:00:00`));
                    }}
                  >
                    <strong>{day.date.getDate()}</strong>
                    {day.events.length ? (
                      <span>{day.events.length}</span>
                    ) : null}
                    {day.events[0] ? <small>{day.events[0].title}</small> : null}
                  </button>
                ))}
              </div>

              <button
                className="today-button"
                type="button"
                onClick={() =>
                  setCalendarCursor(new Date(`${getDateInputValue(0)}T12:00:00`))
                }
              >
                Diesen Monat zeigen
              </button>
            </section>

            <form className="event-form" onSubmit={addEvent}>
              <div className="settings-heading">
                <p className="hero-kicker">Termin</p>
                <h2>Eintragen</h2>
              </div>
              <input
                value={eventTitle}
                onChange={(event) => setEventTitle(event.target.value)}
                placeholder="Was steht an?"
                maxLength={72}
              />
              <div className="event-form-grid">
                <input
                  aria-label="Datum"
                  type="date"
                  value={eventDate}
                  onChange={(event) => {
                    setEventDate(event.target.value);
                    if (!event.target.value) {
                      return;
                    }
                    setSelectedDate(event.target.value);
                    setCalendarCursor(new Date(`${event.target.value}T12:00:00`));
                  }}
                />
                <input
                  aria-label="Uhrzeit"
                  type="time"
                  value={eventTime}
                  onChange={(event) => setEventTime(event.target.value)}
                />
              </div>
              <select
                aria-label="Kategorie auswählen"
                value={eventCategoryId}
                onChange={(event) => setEventCategoryId(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                value={eventNote}
                onChange={(event) => setEventNote(event.target.value)}
                placeholder="Notiz optional"
                maxLength={90}
              />
              <button className="wide-button" type="submit">
                Termin hinzufügen
              </button>
            </form>

            <section className="event-list" aria-label="Termine">
              {sortedEvents.length ? (
                sortedEvents.map((event) => {
                  const category = findCategory(categories, event.categoryId);

                  return (
                    <article
                      className="event-card"
                      key={event.id}
                      style={
                        {
                          "--category": category.color,
                          "--category-contrast": getReadableTextColor(category.color),
                        } as CSSProperties
                      }
                    >
                      <div className="event-date">
                        <strong>{formatDateLabel(event.date)}</strong>
                        <span>{event.time || "Ganztags"}</span>
                      </div>
                      <div className="task-content">
                        <div className="task-line">
                          <h3>{event.title}</h3>
                          <span>{category.name}</span>
                        </div>
                        {event.note ? <p>{event.note}</p> : null}
                      </div>
                      <button
                        className="delete-button"
                        type="button"
                        aria-label="Termin löschen"
                        onClick={() => deleteEvent(event.id)}
                      >
                        x
                      </button>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state">
                  <p>Noch keine Termine.</p>
                  <span>Trage oben deinen ersten Termin ein.</span>
                </div>
              )}
            </section>
          </section>
        ) : (
          <section className="cosmetics-panel" aria-label="Cosmetics Einstellungen">
            <div className="settings-card">
              <div className="settings-heading">
                <p className="hero-kicker">Identity</p>
                <h2>Name & Farben</h2>
              </div>
              <label>
                App Name
                <input
                  value={theme.appName}
                  onChange={(event) =>
                    setTheme((current) => ({
                      ...current,
                      appName: event.target.value,
                    }))
                  }
                  maxLength={24}
                />
              </label>

              <div className="palette-grid" aria-label="Farbvorlagen">
                {palettes.map(([name, accent, background, surface, ink]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() =>
                      setTheme((current) => ({
                        ...current,
                        accent,
                        background,
                        surface,
                        ink,
                      }))
                    }
                  >
                    <span style={{ background: accent }} />
                    {name}
                  </button>
                ))}
              </div>

              <div className="color-grid">
                {[
                  ["Accent", "accent"],
                  ["Background", "background"],
                  ["Cards", "surface"],
                  ["Text", "ink"],
                ].map(([label, key]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="color"
                      value={theme[key as keyof ThemeSettings] as string}
                      onChange={(event) =>
                        setTheme((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-heading">
                <p className="hero-kicker">Layout</p>
                <h2>Look & Feel</h2>
              </div>
              <div className="segmented-field">
                <span>Rundung</span>
                <div>
                  {(["sharp", "soft", "round"] as Radius[]).map((option) => (
                    <button
                      key={option}
                      className={theme.radius === option ? "selected" : ""}
                      type="button"
                      onClick={() =>
                        setTheme((current) => ({ ...current, radius: option }))
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="segmented-field">
                <span>Dichte</span>
                <div>
                  {(["cozy", "compact"] as Density[]).map((option) => (
                    <button
                      key={option}
                      className={theme.density === option ? "selected" : ""}
                      type="button"
                      onClick={() =>
                        setTheme((current) => ({ ...current, density: option }))
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-heading">
                <p className="hero-kicker">Kategorien</p>
                <h2>Eigene Bereiche</h2>
              </div>
              <form className="category-form" onSubmit={addCategory}>
                <input
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Neue Kategorie"
                  maxLength={20}
                />
                <input
                  aria-label="Kategoriefarbe"
                  type="color"
                  value={newCategoryColor}
                  onChange={(event) => setNewCategoryColor(event.target.value)}
                />
                <button type="submit">+</button>
              </form>

              <div className="category-editor">
                {categories.map((category) => (
                  <article key={category.id}>
                    <input
                      aria-label={`${category.name} Farbe`}
                      type="color"
                      value={category.color}
                      onChange={(event) =>
                        updateCategory(category.id, { color: event.target.value })
                      }
                    />
                    <input
                      aria-label={`${category.name} Name`}
                      value={category.name}
                      onChange={(event) =>
                        updateCategory(category.id, { name: event.target.value })
                      }
                      maxLength={20}
                    />
                    <button
                      type="button"
                      aria-label={`${category.name} löschen`}
                      onClick={() => deleteCategory(category.id)}
                    >
                      x
                    </button>
                  </article>
                ))}
              </div>
              <button className="reset-button" type="button" onClick={resetCosmetics}>
                Reset Cosmetics
              </button>
            </div>

            <div className="settings-card">
              <div className="settings-heading">
                <p className="hero-kicker">Backup</p>
                <h2>Daten sichern</h2>
              </div>
              <div className="backup-actions">
                <button className="reset-button" type="button" onClick={exportBackup}>
                  Backup speichern
                </button>
                <label className="import-button">
                  Backup laden
                  <input
                    aria-label="Backup laden"
                    type="file"
                    accept="application/json"
                    onChange={importBackup}
                  />
                </label>
              </div>
              <p className="backup-status">{backupStatus}</p>
            </div>
          </section>
        )}

      </section>
    </main>
  );
}
