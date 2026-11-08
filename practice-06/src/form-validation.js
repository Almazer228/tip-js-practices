const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

export function validateTaskDraft(draft, categories) {
  const errors = {};

  const data = draft && typeof draft === "object" && !Array.isArray(draft)
    ? draft
    : {};

  // Проверяем название задачи
  const title = typeof data.title === "string"
    ? data.title.trim()
    : "";

  if (title.length < 1) {
    errors.title = "Введите название задачи.";
  } else if (title.length > 100) {
    errors.title = "Название не должно превышать 100 символов.";
  }

  // Проверяем приоритет
  const priority = data.priority;

  if (!ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = "Выберите корректный приоритет.";
  }

  // Проверяем категорию
  const categoryId = Number(data.categoryId);

  const categoryExists = Array.isArray(categories)
    && categories.some((category) => category.id === categoryId);

  if (
    !Number.isSafeInteger(categoryId)
    || categoryId <= 0
    || !categoryExists
  ) {
    errors.categoryId = "Выберите существующую категорию.";
  }

  // Если есть ошибки, возвращаем их
  if (Object.keys(errors).length > 0) {
    return {
      valid: false,
      value: null,
      errors,
    };
  }

  // Если всё правильно, возвращаем нормализованные данные
  return {
    valid: true,
    value: {
      title,
      priority,
      categoryId,
    },
    errors: {},
  };
}