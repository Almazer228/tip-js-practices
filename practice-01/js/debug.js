"use strict";

console.log("=== ЗАДАНИЕ 5: ОТЛАДКА И ИСПРАВЛЕНИЕ ===");

const plannedText = "8";
const completedText = "3";
const additionalText = "2";

// ИСПРАВЛЕНО: Явно приводим строки к числам перед сложением
const completedTotal = Number(completedText) + Number(additionalText);
const remainingTasks = Number(plannedText) - completedTotal;

console.log("Выполнено:", completedTotal);
console.log("Осталось:", remainingTasks);

let controlSum = 0;

// ИСПРАВЛЕНО: Поменяли знак < на <=, чтобы учесть 4-ю задачу включительно
for (let taskNumber = 1; taskNumber <= 4; taskNumber += 1) {
  controlSum += taskNumber;
}

console.log("Контрольная сумма:", controlSum);
