"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type Filter = "today" | "all" | "done";
type Priority = "low" | "medium" | "high";

type Task = {
  id: string;
  title: string;
  note: string;
  priority: Priority;
  done: boolean;
  createdAt: string;
  due: string;
};

const storageKey = "pulse-todo-tasks";

const starterTasks: Task[] = [
  {
    id: "starter-1",
    title: "Morgenroutine planen",
    note: "10 Minuten, Kaffee, Überblick.",
    priority: "high",
    done: false,
    createdAt: new Date().toISOString(),
    due: "today",
  },
  {
    id: "starter-2",
    title: "Eine Sache wirklich fertig machen",
    note: "Kein Multitasking.",
    priority: "medium",
    done: false,
    createdAt: new Date().toISOString(),
    due: "today",
  },
  {
    id: "starter-3",
    title: "Inbox aufräumen",
    note: "Nur die wichtigsten Nachrichten.",
    priority: "low",
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

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(starterTasks);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<Filter>("today");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        try {
          setTasks(JSON.parse(saved));
        } catch {
          setTasks(starterTasks);
        }
      }
      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isReady) {
      window.localStorage.setItem(storageKey, JSON.stringify(tasks));
    }
  }, [isReady, tasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.done).length;
    const open = total - done;
    const focus = tasks.filter((task) => !task.done && task.priority === "high").length;
    const progress = total ? Math.round((done / total) * 100) : 0;

    return { total, done, open, focus, progress };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    if (filter === "done") {
      return tasks.filter((task) => task.done);
    }

    if (filter === "today") {
      return tasks.filter((task) => task.due === "today" && !task.done);
    }

    return tasks;
  }, [filter, tasks]);

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
      done: false,
      createdAt: new Date().toISOString(),
      due: "today",
    };

    setTasks((current) => [newTask, ...current]);
    setTitle("");
    setNote("");
    setPriority("medium");
    setFilter("today");
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

  return (
    <main className="min-h-screen bg-[#f5f4ee] text-[#171a1f]">
      <section className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-4 pb-5 pt-4">
        <header className="app-topbar">
          <div>
            <p className="eyebrow">Heute</p>
            <h1>Pulse Tasks</h1>
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

        <section className="hero-panel" aria-label="Tagesfortschritt">
          <div>
            <p className="hero-kicker">Dein Tag in Bewegung</p>
            <h2>{stats.open ? `${stats.open} offene Aufgaben` : "Alles erledigt"}</h2>
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
            placeholder="Was steht als Naechstes an?"
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

          <div className="composer-actions">
            <div className="priority-group" aria-label="Prioritaet auswaehlen">
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
            <button className="add-button" type="submit" aria-label="Aufgabe hinzufuegen">
              +
            </button>
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

        <section className="task-list" aria-label="Aufgabenliste">
          {visibleTasks.length ? (
            visibleTasks.map((task) => (
              <article
                className={`task-card ${task.done ? "done" : ""} priority-${task.priority}`}
                key={task.id}
              >
                <button
                  className="check-button"
                  type="button"
                  aria-label={task.done ? "Aufgabe wieder oeffnen" : "Aufgabe erledigen"}
                  onClick={() => toggleTask(task.id)}
                >
                  {task.done ? "✓" : ""}
                </button>

                <div className="task-content">
                  <div className="task-line">
                    <h3>{task.title}</h3>
                    <span>{priorityCopy[task.priority]}</span>
                  </div>
                  {task.note ? <p>{task.note}</p> : null}
                </div>

                <button
                  className="delete-button"
                  type="button"
                  aria-label="Aufgabe loeschen"
                  onClick={() => deleteTask(task.id)}
                >
                  x
                </button>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <p>Hier ist gerade Luft.</p>
              <span>Fuege oben eine neue Aufgabe hinzu.</span>
            </div>
          )}
        </section>

        <footer className="dock" aria-label="Kurzuebersicht">
          <div>
            <strong>{stats.done}</strong>
            <span>fertig</span>
          </div>
          <div>
            <strong>{stats.open}</strong>
            <span>offen</span>
          </div>
          <div>
            <strong>{stats.total}</strong>
            <span>gesamt</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
