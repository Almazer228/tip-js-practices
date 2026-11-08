const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

export function createTaskElement(task, category) {
  // Создаём карточку задачи
  const item = document.createElement("li");
  item.className = "task-card";
  item.dataset.taskId = String(task.id);

  if (task.completed) {
    item.classList.add("is-completed");
  }

  // Название задачи
  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  // Блок с дополнительной информацией
  const meta = document.createElement("div");
  meta.className = "task-meta";

  // Категория
  const categoryLabel = document.createElement("span");
  categoryLabel.className = "task-category";
  categoryLabel.textContent = category?.name ?? "Без категории";

  // Приоритет
  const priorityLabel = document.createElement("span");
  priorityLabel.className = "task-priority";
  priorityLabel.textContent = `Приоритет: ${PRIORITY_LABELS[task.priority]}`;

  // Статус
  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";

  meta.append(categoryLabel, priorityLabel, status);

  // Кнопки управления
  const actions = document.createElement("div");
  actions.className = "task-actions";

  function createActionButton(action, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action;

    const span = document.createElement("span");
    span.className = "action-label";
    span.textContent = label;

    button.append(span);
    return button;
  }

  actions.append(
    createActionButton(
      "toggle",
      task.completed ? "Вернуть в работу" : "Выполнить",
    ),
    createActionButton("edit", "Изменить"),
    createActionButton("delete", "Удалить"),
  );

  item.append(title, meta, actions);

  return item;
}

export function renderTaskList(list, tasks, categories) {
  // Создаём новый список карточек
  const fragment = document.createDocumentFragment();

  for (const task of tasks) {
    const category = categories.find(
      (item) => item.id === task.categoryId,
    );

    const element = createTaskElement(task, category);
    fragment.append(element);
  }

  // Полностью заменяем старое содержимое списка
  list.replaceChildren(fragment);
}