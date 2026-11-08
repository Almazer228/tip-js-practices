import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) {
    return "Не удалось выполнить операцию.";
  }

  if (error.kind === "timeout") {
    return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  }

  if (error.kind === "network") {
    return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  }

  if (error.kind === "invalid-response") {
    return "Сервер вернул ответ неожиданного формата.";
  }

  if (error.kind === "http" && error.status === 404) {
    return "Запись уже отсутствует на сервере. Обновите список.";
  }

  if (error.kind === "http") {
    return error.message || `Сервер вернул ошибку ${error.status}.`;
  }

  return "Не удалось выполнить операцию.";
}

export function createAppController({
  api,
  view,
  validateDraft = validateTaskDraft,
} = {}) {
  // Проверяем переданные зависимости
  const apiMethods = [
    "loadInitialData",
    "getTasks",
    "createTask",
    "updateTask",
    "setTaskCompleted",
    "deleteTask",
    "resetDemoData",
  ];

  const viewMethods = [
    "setListState",
    "setTasks",
    "setCategories",
    "setTotal",
    "setFormTask",
    "showFormErrors",
    "setMutationPending",
    "notify",
  ];

  if (
    !api
    || apiMethods.some((method) => typeof api[method] !== "function")
    || !view
    || viewMethods.some((method) => typeof view[method] !== "function")
    || typeof validateDraft !== "function"
  ) {
    throw new TypeError("Переданы некорректные зависимости контроллера.");
  }

  // Текущее состояние приложения
  let tasks = [];
  let categories = [];
  let filters = {};
  let editingId = null;

  // Управление запросами
  let activeController = null;
  let requestNumber = 0;
  let destroyed = false;
  let mutationPending = false;

  // Проверяем, актуален ли запрос
  function isCurrentRequest(number) {
    return !destroyed && number === requestNumber;
  }

  // Загружаем задачи
  async function load() {
    if (destroyed) return;

    // Отменяем предыдущий запрос
    if (activeController) {
      activeController.abort();
    }

    const controller = new AbortController();
    activeController = controller;

    const currentRequest = ++requestNumber;

    view.setListState("loading");

    try {
      let result;

      // Если категории ещё не загружены,
      // выполняем начальную загрузку
      if (categories.length === 0) {
        result = await api.loadInitialData(
          filters,
          { signal: controller.signal },
        );

        if (!isCurrentRequest(currentRequest)) return;

        tasks = result.tasks;
        categories = result.categories;

        view.setCategories(categories);
      } else {
        // Если категории уже есть,
        // запрашиваем только задачи
        result = await api.getTasks(
          filters,
          { signal: controller.signal },
        );

        if (!isCurrentRequest(currentRequest)) return;

        tasks = result.tasks;
      }

      // Обновляем интерфейс
      view.setTasks(tasks, categories);
      view.setTotal(result.meta?.total ?? tasks.length);

      if (tasks.length === 0) {
        view.setListState("empty");
      } else {
        view.setListState("ready");
      }
    } catch (error) {
      // Не показываем ошибку отменённого запроса
      if (
        !isCurrentRequest(currentRequest)
        || controller.signal.aborted
        || error.kind === "aborted"
      ) {
        return;
      }

      view.setListState("error", messageForError(error));
    } finally {
      if (activeController === controller) {
        activeController = null;
      }
    }
  }

  // Начальная загрузка
  function start(initialFilters = {}) {
    filters = { ...initialFilters };
    return load();
  }

  // Применение фильтров
  function applyFilters(newFilters = {}) {
    filters = { ...newFilters };
    return load();
  }

  // Повторная загрузка списка
  function refresh() {
    return load();
  }

  // Начало редактирования
  function beginEdit(id) {
    if (destroyed || mutationPending) return;

    const task = tasks.find((item) => item.id === id);

    if (!task) return;

    editingId = id;

    view.showFormErrors({});
    view.setFormTask(task);
  }

  // Отмена редактирования
  function cancelEdit() {
    if (destroyed || mutationPending) return;

    editingId = null;

    view.showFormErrors({});
    view.setFormTask(null);
  }

  // Общая обработка изменений на сервере
  async function performMutation(action) {
    if (destroyed || mutationPending) return;

    mutationPending = true;
    view.setMutationPending(true);

    try {
      await action();

      // После изменения снова загружаем список
      await load();
    } catch (error) {
      view.notify(messageForError(error), "error");
    } finally {
      mutationPending = false;

      if (!destroyed) {
        view.setMutationPending(false);
      }
    }
  }

  // Создание или сохранение задачи
  async function submit(draft) {
    if (destroyed || mutationPending) return;

    const validation = validateDraft(draft, categories);

    view.showFormErrors(validation.errors);

    if (!validation.valid) {
      return;
    }

    await performMutation(async () => {
      if (editingId === null) {
        // Создаём новую задачу
        await api.createTask(validation.value);

        view.notify("Задача успешно добавлена.", "success");
      } else {
        // Сохраняем изменения существующей задачи
        await api.updateTask(editingId, validation.value);

        editingId = null;

        view.notify("Изменения успешно сохранены.", "success");
      }

      view.showFormErrors({});
      view.setFormTask(null);
    });
  }

  // Переключение статуса задачи
  async function toggleTask(id) {
    if (destroyed || mutationPending) return;

    const task = tasks.find((item) => item.id === id);

    if (!task) return;

    await performMutation(async () => {
      await api.setTaskCompleted(id, !task.completed);

      view.notify("Статус задачи изменён.", "success");
    });
  }

  // Удаление задачи
  async function deleteTask(id) {
    if (destroyed || mutationPending) return;

    const task = tasks.find((item) => item.id === id);

    if (!task) return;

    await performMutation(async () => {
      await api.deleteTask(id);

      if (editingId === id) {
        editingId = null;
        view.setFormTask(null);
        view.showFormErrors({});
      }

      view.notify("Задача удалена.", "success");
    });
  }

  // Восстановление исходных данных
  async function resetData() {
    if (destroyed || mutationPending) return;

    await performMutation(async () => {
      await api.resetDemoData();

      editingId = null;

      view.setFormTask(null);
      view.showFormErrors({});
      view.notify("Исходные данные восстановлены.", "success");
    });
  }

  // Завершение работы контроллера
  function destroy() {
    destroyed = true;
    requestNumber += 1;

    if (activeController) {
      activeController.abort();
      activeController = null;
    }
  }

  return {
    start,
    applyFilters,
    refresh,
    submit,
    beginEdit,
    cancelEdit,
    toggleTask,
    deleteTask,
    resetData,
    destroy,
  };
}