function validateId(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }

  return { ok: true };
}

function validateTitle(title) {
  if (typeof title !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }

  const normalizedTitle = title.trim();

  if (normalizedTitle.length < 1 || normalizedTitle.length > 100) {
    return { ok: false, error: "Название должно содержать от 1 до 100 символов" };
  }

  return { ok: true, title: normalizedTitle };
}

function validatePriority(priority) {
  if (!["low", "medium", "high"].includes(priority)) {
    return { ok: false, error: "Недопустимый приоритет" };
  }

  return { ok: true };
}

export function createTask(id, title, priority = "medium") {
  const idResult = validateId(id);
  if (!idResult.ok) return idResult;

  const titleResult = validateTitle(title);
  if (!titleResult.ok) return titleResult;

  const priorityResult = validatePriority(priority);
  if (!priorityResult.ok) return priorityResult;

  return {
    ok: true,
    task: {
      id,
      title: titleResult.title,
      completed: false,
      priority,
    },
  };
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed === true).length;
  const pending = total - completed;
  const progress = total === 0 ? 0 : (completed / total) * 100;

  return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  const result = createTask(id, title, priority);

  if (!result.ok) return result;

  if (tasks.some((task) => task.id === id)) {
    return { ok: false, error: "Задача с таким id уже существует" };
  }

  return {
    ok: true,
    tasks: [...tasks, result.task],
  };
}

export function setTaskCompleted(tasks, id, completed) {
  const idResult = validateId(id);
  if (!idResult.ok) return idResult;

  if (typeof completed !== "boolean") {
    return { ok: false, error: "completed должен быть boolean" };
  }

  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1) {
    return { ok: false, error: "Задача не найдена" };
  }

  const updatedTask = {
    ...tasks[index],
    completed,
  };

  return {
    ok: true,
    tasks: tasks.map((task, i) => (i === index ? updatedTask : task)),
  };
}

export function renameTask(tasks, id, title) {
  const idResult = validateId(id);
  if (!idResult.ok) return idResult;

  const titleResult = validateTitle(title);
  if (!titleResult.ok) return titleResult;

  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1) {
    return { ok: false, error: "Задача не найдена" };
  }

  const updatedTask = {
    ...tasks[index],
    title: titleResult.title,
  };

  return {
    ok: true,
    tasks: tasks.map((task, i) => (i === index ? updatedTask : task)),
  };
}

export function removeTask(tasks, id) {
  const idResult = validateId(id);
  if (!idResult.ok) return idResult;

  if (!tasks.some((task) => task.id === id)) {
    return { ok: false, error: "Задача не найдена" };
  }

  return {
    ok: true,
    tasks: tasks.filter((task) => task.id !== id),
  };
}