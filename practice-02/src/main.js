import { demoTasks, variantNumber, variantTasks } from "./data.js";

import {
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

function printStats(tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);

  console.log(
    `Всего: ${total}; выполнено: ${completed}; осталось: ${pending}`
  );

  if (total === 0) {
    console.log("Задач пока нет");
  } else {
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
  }
}

function applyResult(currentTasks, result) {
  if (result.ok) {
    return result.tasks;
  }

  console.log(`Ошибка: ${result.error}`);
  return currentTasks;
}

console.log("=== ОБЩИЙ СЦЕНАРИЙ ===");

let currentTasks = demoTasks;

console.log("Исходные задачи:");
console.table(currentTasks);

console.log("Названия:", getTaskTitles(currentTasks));
console.log("Невыполненные:", getPendingTasks(currentTasks));
printStats(currentTasks);

let result = addTask(
  currentTasks,
  20,
  "Добавить проверку",
  "high"
);
currentTasks = applyResult(currentTasks, result);

console.log("\nПосле добавления id 20:");
console.table(currentTasks);
printStats(currentTasks);

result = setTaskCompleted(currentTasks, 4, true);
currentTasks = applyResult(currentTasks, result);

console.log("\nПосле выполнения id 4:");
console.table(currentTasks);
printStats(currentTasks);

result = renameTask(
  currentTasks,
  10,
  "Подготовить инструкцию запуска"
);
currentTasks = applyResult(currentTasks, result);

console.log("\nПосле переименования id 10:");
console.table(currentTasks);
printStats(currentTasks);

result = removeTask(currentTasks, 7);
currentTasks = applyResult(currentTasks, result);

console.log("\nПосле удаления id 7:");
console.table(currentTasks);
printStats(currentTasks);

console.log("\nИтоговые id:", currentTasks.map((task) => task.id));

console.log("\nОшибка:");
result = addTask(currentTasks, 20, "Дубликат", "high");
currentTasks = applyResult(currentTasks, result);

console.log("\nИсходный demoTasks:");
console.table(demoTasks);

console.log("\n=== ИНДИВИДУАЛЬНЫЙ СЦЕНАРИЙ ===");

let variantCurrent = variantTasks;

console.log("Вариант:", variantNumber);
console.table(variantCurrent);
printStats(variantCurrent);

result = addTask(
  variantCurrent,
  80,
  "Новая индивидуальная задача",
  "high"
);
variantCurrent = applyResult(variantCurrent, result);

console.log("\nПосле добавления id 80:");
console.table(variantCurrent);
printStats(variantCurrent);

result = setTaskCompleted(variantCurrent, 11, true);
variantCurrent = applyResult(variantCurrent, result);

console.log("\nПосле выполнения id 11:");
console.table(variantCurrent);
printStats(variantCurrent);

result = renameTask(
  variantCurrent,
  23,
  "Обновлённое название задачи"
);
variantCurrent = applyResult(variantCurrent, result);

console.log("\nПосле переименования id 23:");
console.table(variantCurrent);
printStats(variantCurrent);

result = removeTask(variantCurrent, 37);
variantCurrent = applyResult(variantCurrent, result);

console.log("\nПосле удаления id 37:");
console.table(variantCurrent);
printStats(variantCurrent);

console.log("\nПовторное добавление id 80:");
result = addTask(
  variantCurrent,
  80,
  "Попытка повторного добавления",
  "high"
);
variantCurrent = applyResult(variantCurrent, result);

console.log("\nИсходный variantTasks:");
console.table(variantTasks);

console.log("\nПоиск id 80:", findTaskById(variantCurrent, 80));