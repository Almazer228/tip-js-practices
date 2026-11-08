
export const STORAGE_VERSION = 1;

const ALLOWED_PRIORITIES = ["low", "medium", "high"];

function copyTasks(tasks) {
  return tasks.map((task) => ({ ...task }));
}

export function isValidTaskList(value) {
  if (!Array.isArray(value)) {
    return false;
  }

  const ids = new Set();

  for (const task of value) {
    if (task === null || typeof task !== "object" || Array.isArray(task)) {
      return false;
    }

    if (!Number.isSafeInteger(task.id) || task.id <= 0) {
      return false;
    }

    if (ids.has(task.id)) {
      return false;
    }

    ids.add(task.id);

    if (
      typeof task.title !== "string" ||
      task.title !== task.title.trim() ||
      task.title.length < 1 ||
      task.title.length > 100
    ) {
      return false;
    }

    if (typeof task.completed !== "boolean") {
      return false;
    }

    if (!ALLOWED_PRIORITIES.includes(task.priority)) {
      return false;
    }
  }

  return true;
}

export function loadTasks(storage, key, fallbackTasks) {
  const fallback = copyTasks(fallbackTasks);

  try {
    const savedValue = storage.getItem(key);

    if (savedValue === null) {
      return {
        ok: true,
        source: "initial",
        tasks: fallback,
      };
    }

    const parsed = JSON.parse(savedValue);

    if (
      parsed === null ||
      typeof parsed !== "object" ||
      parsed.version !== STORAGE_VERSION ||
      !isValidTaskList(parsed.tasks)
    ) {
      throw new Error("Сохранённые данные имеют неверный формат или версию.");
    }

    return {
      ok: true,
      source: "storage",
      tasks: copyTasks(parsed.tasks),
    };
  } catch (error) {
    return {
      ok: false,
      source: "fallback",
      tasks: fallback,
      error: `Не удалось загрузить данные: ${error.message}`,
    };
  }
}

export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) {
    return {
      ok: false,
      error: "Нельзя сохранить список с некорректными данными.",
    };
  }

  try {
    const value = {
      version: STORAGE_VERSION,
      tasks,
    };

    storage.setItem(key, JSON.stringify(value));

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: `Не удалось сохранить данные: ${error.message}`,
    };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: `Не удалось удалить данные: ${error.message}`,
    };
  }
}
