"use strict";

// Входные данные (поменяй цифры на свой вариант, если нужно)
const totalTasks = 12;
const completedTasks = 5;
const dailyLimit = 3;

console.log("=== ЗАДАНИЕ 4: ПЛАН ПО ДНЯМ ===");

// 1. Полная валидация всех входных данных
if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks) || !Number.isInteger(dailyLimit)) {
  console.log("Ошибка: Все параметры должны быть целыми числами.");
} 
else if (totalTasks < 0 || totalTasks > 1000 || completedTasks < 0 || dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: Выход за допустимые границы параметров.");
} 
else if (completedTasks > totalTasks) {
  console.log("Ошибка: Некорректное число выполненных задач.");
} 
// 2. Если все задачи уже выполнены
else if (totalTasks === completedTasks) {
  console.log("Все задачи уже выполнены!");
  console.log("Потребуется дней: 0");
} 
// 3. Расчет пошагового плана через цикл while
else {
  let remaining = totalTasks - completedTasks;
  let day = 0;

  console.log(`Осталось задач: ${remaining}`);

  while (remaining > 0) {
    day += 1;
    // Берем либо дневной лимит, либо остаток задач (если их меньше лимита)
    const tasksDoneToday = Math.min(dailyLimit, remaining); 
    remaining -= tasksDoneToday;

    console.log(`День ${day}: выполнено ${tasksDoneToday}, осталось ${remaining}`);
  }

  console.log(`Потребуется дней: ${day}`);
}
