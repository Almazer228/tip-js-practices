"use strict";

console.log("=== ЗАДАНИЕ 2: ТИПЫ ДАННЫХ ===");

// 1. Сложение строки и числа (конкатенация)
const ex1 = "8" + 2;
console.log('1. "8" + 2 =', ex1, "| Тип:", typeof ex1);

// 2. Вычитание строки и числа (математическая операция с неявным преобразованием)
const ex2 = "8" - 2;
console.log('2. "8" - 2 =', ex2, "| Тип:", typeof ex2);

// 3. Явное преобразование строки в число и сложение
const ex3 = Number("8") + 2;
console.log('3. Number("8") + 2 =', ex3, "| Тип:", typeof ex3);

// 4. Посимвольное сравнение строк
const ex4 = "12" > "3";
console.log('4. "12" > "3" =', ex4, "| Тип:", typeof ex4);

// 5. Строгое равенство (без приведения типов)
const ex5 = 12 === "12";
console.log('5. 12 === "12" =', ex5, "| Тип:", typeof ex5);

// 6. Преобразование пустой строки в число
const ex6 = Number("");
console.log('6. Number("") =', ex6, "| Тип:", typeof ex6);

// 7. Преобразование текста в число (дает NaN)
const ex7 = Number("text");
console.log('7. Number("text") =', ex7, "| Тип:", typeof ex7);

// 8. Логическое приведение непустой строки
const ex8 = Boolean("false");
console.log('8. Boolean("false") =', ex8, "| Тип:", typeof ex8);

// 9. Особый случай typeof для null (историческая ошибка JS)
const ex9 = typeof null;
console.log('9. typeof null =', ex9, "| Тип результата:", typeof ex9);

// 10. Особый случай typeof для NaN
const ex10 = typeof NaN;
console.log('10. typeof NaN =', ex10, "| Тип результата:", typeof ex10);
