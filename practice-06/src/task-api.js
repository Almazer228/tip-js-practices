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

// Проверка структуры задачи.
export function isTask(value) {
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

// Проверка структуры категории.
export function isCategory(value) {
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

// Подготовка параметров запроса.
function requestOptions(options = {}) {
  if (options === undefined) {
    return undefined;
  }

  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("options должен быть объектом");
  }

  return options.signal === undefined
    ? undefined
    : { signal: options.signal };
}

// Проверка списка задач.
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
    throw invalidResponse("Некорректный ответ со списком задач.");
  }

  const ids = new Set();

  for (const task of payload.data) {
    if (!isTask(task)) {
      throw invalidResponse("Сервер вернул задачу с неправильной структурой.");
    }

    if (ids.has(task.id)) {
      throw invalidResponse("Обнаружены повторяющиеся ID задач.");
    }

    ids.add(task.id);
  }

  return {
    tasks: payload.data,
    meta: payload.meta,
  };
}

// Проверка списка категорий.
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
    throw invalidResponse("Некорректный ответ со списком категорий.");
  }

  const ids = new Set();

  for (const category of payload.data) {
    if (!isCategory(category)) {
      throw invalidResponse("Сервер вернул категорию с неправильной структурой.");
    }

    if (ids.has(category.id)) {
      throw invalidResponse("Обнаружены повторяющиеся ID категорий.");
    }

    ids.add(category.id);
  }

  return payload.data;
}

// Проверка одной задачи.
function validateTaskResponse(payload) {
  if (!payload || typeof payload !== "object" || !isTask(payload.data)) {
    throw invalidResponse("Сервер вернул некорректную задачу.");
  }

  return payload.data;
}

// Нормализация фильтров.
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
      throw new TypeError("completed должен быть логическим значением.");
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

// Проверка ID.
function validateId(id) {
  if (!isPositiveSafeInteger(id)) {
    throw new TypeError("ID должен быть положительным целым числом.");
  }
}

// Создание предметного API.
export function createTaskApi(client) {
  if (
    !client ||
    typeof client !== "object" ||
    typeof client.requestJson !== "function"
  ) {
    throw new TypeError("Необходим HTTP-клиент с методом requestJson.");
  }

  // Получить список задач.
  async function getTasks(filters = {}, options = {}) {
    const normalizedFilters = normalizeFilters(filters);

    const payload = await client.requestJson("/tasks", {
      query: normalizedFilters,
      ...requestOptions(options),
    });

    return validateTaskList(payload);
  }

  // Получить одну задачу.
  async function getTaskById(id, options = {}) {
    validateId(id);

    const payload = await client.requestJson(
      `/tasks/${id}`,
      requestOptions(options)
    );

    return validateTaskResponse(payload);
  }

  // Получить категории.
  async function getCategories(options = {}) {
    const payload = await client.requestJson(
      "/categories",
      requestOptions(options)
    );

    return validateCategoryList(payload);
  }

  // Загрузить задачи и категории параллельно.
  async function loadInitialData(filters = {}, options = {}) {
    const [taskResult, categories] = await Promise.all([
      getTasks(filters, options),
      getCategories(options),
    ]);

    return {
      tasks: taskResult.tasks,
      categories,
      meta: taskResult.meta,
    };
  }

  // Создать задачу.
  async function createTask(draft, options = {}) {
    const payload = await client.requestJson("/tasks", {
      method: "POST",
      body: draft,
      ...requestOptions(options),
    });

    return validateTaskResponse(payload);
  }

  // Отредактировать задачу.
  async function updateTask(id, changes, options = {}) {
    validateId(id);

    const payload = await client.requestJson(`/tasks/${id}`, {
      method: "PATCH",
      body: changes,
      ...requestOptions(options),
    });

    return validateTaskResponse(payload);
  }

  // Изменить статус выполнения задачи.
  async function setTaskCompleted(id, completed, options = {}) {
    validateId(id);

    if (typeof completed !== "boolean") {
      throw new TypeError("completed должен быть логическим значением.");
    }

    const payload = await client.requestJson(`/tasks/${id}`, {
      method: "PATCH",
      body: { completed },
      ...requestOptions(options),
    });

    return validateTaskResponse(payload);
  }

  // Удалить задачу.
  async function deleteTask(id, options = {}) {
    validateId(id);

    const result = await client.requestJson(`/tasks/${id}`, {
      method: "DELETE",
      ...requestOptions(options),
    });

    if (result !== null) {
      throw invalidResponse("При удалении задачи ожидался пустой ответ 204.");
    }

    return null;
  }

  // Восстановить исходный набор данных.
  async function resetDemoData(options = {}) {
    const payload = await client.requestJson("/debug/reset", {
      method: "POST",
      ...requestOptions(options),
    });

    if (
      !payload ||
      typeof payload !== "object" ||
      !payload.data ||
      typeof payload.data !== "object" ||
      payload.data.reset !== true ||
      !Number.isSafeInteger(payload.data.total) ||
      payload.data.total !== 12
    ) {
      throw invalidResponse("Сервер не подтвердил сброс данных.");
    }

    return payload.data;
  }

  return {
    getTasks,
    getTaskById,
    getCategories,
    loadInitialData,
    createTask,
    updateTask,
    setTaskCompleted,
    deleteTask,
    resetDemoData,
  };
}