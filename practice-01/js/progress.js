"use strict";

const totalTasks = 12;
const completedTasks = 5;

// Здесь разместите своё решение.

"use strict";

console.log("=== ДОП. ЗАДАНИЕ: ВАРИАНТ А (СТРОКИ) ===");

// Тестовая функция, чтобы быстро проверить все случаи из методички
function testProgressInput(inputTotal, inputCompleted) {
  console.log(`\nПроверка ввода: total = ${String(inputTotal)}, completed = ${String(inputCompleted)}`);

  // 1. Проверяем, что на вход пришли именно строки
  if (typeof inputTotal !== "string" || typeof inputCompleted !== "string") {
    console.log("Ошибка: Входные данные должны быть строго строками.");
    return;
  }

  // 2. Удаляем пробелы по краям
  const trimmedTotal = inputTotal.trim();
  const trimmedCompleted = inputCompleted.trim();

  // 3. Отклоняем пустой ввод и строки только из пробелов
  if (trimmedTotal === "" || trimmedCompleted === "") {
    console.log("Ошибка: Передана пустая строка или строка из пробелов.");
    return;
  }

  // 4. Преобразуем значения в числа
  const total = Number(trimmedTotal);
  const completed = Number(trimmedCompleted);

  // 5. Проверяем на валидность чисел (отсекаем NaN и Infinity)
  if (!Number.isFinite(total) || !Number.isFinite(completed)) {
    console.log("Ошибка: Строка содержит некорректное число, NaN или Infinity.");
    return;
  }

  // 6. Проверяем, что числа целые (отсекаем дробные вроде "2.5")
  if (!Number.isInteger(total) || !Number.isInteger(completed)) {
    console.log("Ошибка: Количество задач должно быть целым числом.");
    return;
  }

  // 7. Применяем стандартные ограничения из Задания 3
  if (total < 0 || total > 1000 || completed < 0) {
    console.log("Ошибка: Выход за границы диапазона (0...1000) или отрицательное значение.");
    return;
  }

  if (completed > total) {
    console.log("Ошибка: Выполненных задач больше, чем общего количества.");
    return;
  }

  // 8. Если все проверки пройдены, делаем расчет
  if (total === 0 && completed === 0) {
    console.log("Задач пока нет");
  } else {
    const remaining = total - completed;
    const percentage = (completed / total) * 100;
    console.log(`Успешно! Всего: ${total}, Выполнено: ${completed}, Осталось: ${remaining}, Прогресс: ${percentage.toFixed(1)}%`);
  }
}

// === ОБЯЗАТЕЛЬНЫЕ ПРОВЕРКИ ИЗ МЕТОДИЧКИ ===
testProgressInput("12", "5");          // Обычные строки
testProgressInput("  12  ", "  5  ");  // Строки с пробелами по краям
testProgressInput("", "5");            // Пустая строка
testProgressInput("   ", "5");         // Строка из пробелов
testProgressInput("abc", "5");         // Некорректный текст
testProgressInput("12", "2.5");        // Дробное число
testProgressInput("Infinity", "5");    // Бесконечность
testProgressInput(null, "5");          // null (не строка)
testProgressInput("12", undefined);    // undefined (не строка)
