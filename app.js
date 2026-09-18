"use strict";

/* Habit Grid — all state lives in localStorage under one key.
   Shape: { habits: [{ id, name }], done: { [habitId]: { "YYYY-MM-DD": true } } } */

const STORAGE_KEY = "habitGrid.v1";
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// weekOffset: 0 = current week, -1 = last week, +1 = next week
let weekOffset = 0;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { habits: [], done: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.habits)) return { habits: [], done: {} };
    return { habits: parsed.habits, done: parsed.done || {} };
  } catch {
    return { habits: [], done: {} };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function toISO(date) {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

function todayISO() {
  return toISO(new Date());
}

// Monday of the week at the given offset (offset 0 = the week containing today).
function weekDates(offset) {
  const today = new Date();
  const mondayShift = (today.getDay() + 6) % 7; // days since Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayShift + offset * 7);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function isDone(state, habitId, iso) {
  return Boolean(state.done[habitId] && state.done[habitId][iso]);
}

function setDone(state, habitId, iso, value) {
  if (!state.done[habitId]) state.done[habitId] = {};
  if (value) {
    state.done[habitId][iso] = true;
  } else {
    delete state.done[habitId][iso];
  }
}

// Consecutive-day streak counting back from today (today must be done, else 0).
function streak(state, habitId) {
  const done = state.done[habitId] || {};
  let count = 0;
  const d = new Date();
  while (done[toISO(d)]) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function monthDayLabel(d) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function render() {
  const state = loadState();
  const days = weekDates(weekOffset);
  const today = todayISO();

  // Week label, e.g. "Sep 14 – Sep 20, 2026".
  const label = document.getElementById("week-label");
  label.textContent = monthDayLabel(days[0]) + " – " + monthDayLabel(days[6]) + ", " + days[6].getFullYear();

  // "Today" button is disabled when already on the current week.
  document.getElementById("today-week").disabled = weekOffset === 0;

  const emptyHint = document.getElementById("empty-hint");
  const grid = document.getElementById("grid");

  if (state.habits.length === 0) {
    emptyHint.hidden = false;
    grid.hidden = true;
    return;
  }
  emptyHint.hidden = true;
  grid.hidden = false;

  // Header row.
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.scope = "col";
  corner.textContent = "Habit";
  headRow.appendChild(corner);
  days.forEach((d, i) => {
    const th = document.createElement("th");
    th.scope = "col";
    const iso = toISO(d);
    th.innerHTML = "";
    const name = document.createElement("span");
    name.textContent = DAY_NAMES[i];
    const num = document.createElement("span");
    num.className = "day-num";
    num.textContent = String(d.getDate());
    th.appendChild(name);
    th.appendChild(num);
    if (iso === today) th.classList.add("is-today");
    headRow.appendChild(th);
  });
  const statHead = document.createElement("th");
  statHead.scope = "col";
  statHead.textContent = "This week";
  headRow.appendChild(statHead);
  thead.appendChild(headRow);

  // Habit rows.
  const tbody = document.createElement("tbody");
  state.habits.forEach((habit) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.className = "habit-cell";
    const nameWrap = document.createElement("div");
    nameWrap.className = "habit-name";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = habit.name;
    name.title = habit.name;
    const s = streak(state, habit.id);
    const streakBadge = document.createElement("span");
    streakBadge.className = "streak" + (s >= 3 ? " hot" : "");
    streakBadge.textContent = s === 1 ? "1-day streak" : s + "-day streak";
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.textContent = "×";
    del.title = 'Delete "' + habit.name + '"';
    del.setAttribute("aria-label", 'Delete habit "' + habit.name + '"');
    del.addEventListener("click", () => {
      if (window.confirm('Delete habit "' + habit.name + '"? This removes its history.')) {
        const fresh = loadState();
        fresh.habits = fresh.habits.filter((h) => h.id !== habit.id);
        delete fresh.done[habit.id];
        saveState(fresh);
        render();
      }
    });
    nameWrap.appendChild(name);
    nameWrap.appendChild(streakBadge);
    nameWrap.appendChild(del);
    nameCell.appendChild(nameWrap);
    row.appendChild(nameCell);

    let doneCount = 0;
    days.forEach((d) => {
      const iso = toISO(d);
      const cell = document.createElement("td");
      cell.className = "daycell";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell";
      btn.setAttribute("aria-label", habit.name + " on " + iso);
      const completed = isDone(state, habit.id, iso);
      if (completed) {
        btn.classList.add("done");
        btn.textContent = "✓";
        doneCount++;
      }
      if (iso === today) btn.classList.add("today");
      // Future days are never toggleable.
      if (iso > today) {
        btn.disabled = true;
        btn.title = "Future day";
      }
      btn.addEventListener("click", () => {
        const fresh = loadState();
        setDone(fresh, habit.id, iso, !isDone(fresh, habit.id, iso));
        saveState(fresh);
        render();
      });
      cell.appendChild(btn);
      row.appendChild(cell);
    });

    const statCell = document.createElement("td");
    statCell.className = "stat-cell";
    const pct = Math.round((doneCount / 7) * 100);
    const strong = document.createElement("strong");
    strong.textContent = doneCount + "/7";
    statCell.appendChild(strong);
    statCell.appendChild(document.createTextNode(" · " + pct + "%"));
    row.appendChild(statCell);

    tbody.appendChild(row);
  });

  grid.innerHTML = "";
  grid.appendChild(thead);
  grid.appendChild(tbody);
}

function addHabit(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const state = loadState();
  state.habits.push({
    id: "h" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
    name: trimmed,
  });
  saveState(state);
  render();
}

function init() {
  const form = document.getElementById("add-form");
  const input = document.getElementById("habit-input");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addHabit(input.value);
    input.value = "";
    input.focus();
  });

  document.getElementById("prev-week").addEventListener("click", () => {
    weekOffset--;
    render();
  });
  document.getElementById("next-week").addEventListener("click", () => {
    weekOffset++;
    render();
  });
  document.getElementById("today-week").addEventListener("click", () => {
    weekOffset = 0;
    render();
  });

  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
