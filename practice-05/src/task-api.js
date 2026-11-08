import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, {
    kind: "invalid-response",
  });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    isPositiveSafeInteger(value.id) &&
    typeof value.title === "string" &&
    value.title.trim().length >= 1 &&
    value.title.trim().length <= 100 &&
    typeof value.completed === "boolean" &&
    ALLOWED_PRIORITIES.has(value.priority) &&
    isPositiveSafeInteger(value.categoryId)
  );
}

function isCategory(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    isPositiveSafeInteger(value.id) &&
    typeof value.name === "string" &&
    value.name.trim().length >= 1 &&
    value.name.trim().length <= 100
  );
}

function validateTaskList(payload) {
  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray(payload.data) ||
    !payload.meta ||
    typeof payload.meta !== "object" ||
    !Number.isSafeInteger(payload.meta.total) ||
    payload.meta.total !== payload.data.length ||
    !payload.meta.filters ||
    typeof payload.meta.filters !== "object"
  ) {
    throw invalidResponse("Некорректный формат списка задач.");
  }

  const ids = new Set();

  for (const task of payload.data) {
    if (!isTask(task)) {
      throw invalidResponse("Получена задача с некорректными данными.");
    }

    if (ids.has(task.id)) {
      throw invalidResponse("В списке обнаружены повторяющиеся ID задач.");
    }

    ids.add(task.id);
  }

  return {
    tasks: payload.data,
    meta: payload.meta,
  };
}

function validateCategoryList(payload) {
  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray(payload.data) ||
    !payload.meta ||
    typeof payload.meta !== "object" ||
    !Number.isSafeInteger(payload.meta.total) ||
    payload.meta.total !== payload.data.length
  ) {
    throw invalidResponse("Некорректный формат списка категорий.");
  }

  const ids = new Set();

  for (const category of payload.data) {
    if (!isCategory(category)) {
      throw invalidResponse("Получена категория с некорректными данными.");
    }

    if (ids.has(category.id)) {
      throw invalidResponse("В списке обнаружены повторяющиеся ID категорий.");
    }

    ids.add(category.id);
  }

  return payload.data;
}

function normalizeFilters(filters = {}) {
  if (
    !filters ||
    typeof filters !== "object" ||
    Array.isArray(filters)
  ) {
    throw new TypeError("Фильтры должны быть объектом.");
  }

  for (const key of Object.keys(filters)) {
    if (!ALLOWED_FILTERS.has(key)) {
      throw new TypeError(`Неизвестный фильтр: ${key}`);
    }
  }

  const result = {};

  if (Object.hasOwn(filters, "completed")) {
    if (typeof filters.completed !== "boolean") {
      throw new TypeError("completed должен быть boolean.");
    }

    result.completed = filters.completed;
  }

  if (Object.hasOwn(filters, "priority")) {
    if (!ALLOWED_PRIORITIES.has(filters.priority)) {
      throw new TypeError("Недопустимый приоритет.");
    }

    result.priority = filters.priority;
  }

  if (Object.hasOwn(filters, "categoryId")) {
    if (!isPositiveSafeInteger(filters.categoryId)) {
      throw new TypeError("categoryId должен быть положительным целым числом.");
    }

    result.categoryId = filters.categoryId;
  }

  if (Object.hasOwn(filters, "q")) {
    if (
      typeof filters.q !== "string" ||
      filters.q.trim().length > 100
    ) {
      throw new TypeError("q должен быть строкой длиной до 100 символов.");
    }

    result.q = filters.q.trim();
  }

  return result;
}

// Создаёт предметный API для работы с задачами и категориями.
export function createTaskApi(client) {
  if (
    !client ||
    typeof client !== "object" ||
    typeof client.requestJson !== "function"
  ) {
    throw new TypeError("Необходим HTTP-клиент с методом requestJson.");
  }

  // Получение списка задач с фильтрами.
  async function getTasks(filters = {}) {
    const normalizedFilters = normalizeFilters(filters);

    const payload = await client.requestJson("/tasks", {
      query: normalizedFilters,
    });

    return validateTaskList(payload);
  }

  // Получение одной задачи по ID.
  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("ID задачи должен быть положительным целым числом.");
    }

    const payload = await client.requestJson(`/tasks/${id}`);

    if (
      !payload ||
      typeof payload !== "object" ||
      !isTask(payload.data)
    ) {
      throw invalidResponse("Получена задача с некорректными данными.");
    }

    return payload.data;
  }

  // Получение списка категорий.
  async function getCategories() {
    const payload = await client.requestJson("/categories");

    return validateCategoryList(payload);
  }

  // Параллельная загрузка задач и категорий.
  async function loadInitialData(filters = {}) {
    const tasksPromise = getTasks(filters);
    const categoriesPromise = getCategories();

    const [taskResult, categories] = await Promise.all([
      tasksPromise,
      categoriesPromise,
    ]);

    return {
      tasks: taskResult.tasks,
      categories,
      meta: taskResult.meta,
    };
  }

  return {
    getTasks,
    getTaskById,
    getCategories,
    loadInitialData,
  };
}