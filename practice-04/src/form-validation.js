
const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};

  if (!draft || typeof draft !== "object") {
    draft = {};
  }

  let id;

  if (editingId !== null) {
    id = editingId;

    if (!Number.isSafeInteger(id) || id <= 0) {
      errors.id = "Некорректный идентификатор задачи";
    } else if (!tasks.some((task) => task.id === id)) {
      errors.id = "Задача для редактирования не найдена";
    }
  } else {
    if (
      draft.id === "" ||
      draft.id === null ||
      draft.id === undefined ||
      String(draft.id).trim() === "" ||
      (typeof draft.id !== "string" && typeof draft.id !== "number")
    ) {
      errors.id = "Введите корректный идентификатор задачи";
    } else {
      id = Number(draft.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        errors.id = "ID должен быть положительным целым числом";
      } else if (tasks.some((task) => task.id === id)) {
        errors.id = "Задача с таким ID уже существует";
      }
    }
  }

  let title;

  if (typeof draft.title !== "string") {
    errors.title = "Название должно быть строкой";
  } else {
    title = draft.title.trim();

    if (title.length < 1 || title.length > 100) {
      errors.title = "Название должно содержать от 1 до 100 символов";
    }
  }

  const priority = draft.priority;

  if (!ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = "Выберите допустимый приоритет";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: {
      id,
      title,
      priority,
    },
  };
}
