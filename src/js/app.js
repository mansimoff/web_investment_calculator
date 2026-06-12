// js/app.js
// Главный модуль приложения "Калькулятор инвестора"

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // Получаем ссылки на элементы DOM
    const form = document.getElementById('investment-form');
    const pdfButton = document.getElementById('export-pdf');
    const excelButton = document.getElementById('export-excel');

    /**
     * Обработчик отправки формы
     * На Этапе 1: просто собираем данные и выводим в консоль/alert.
     * Реальная логика будет добавлена на Этапе 2.
     */
    function handleFormSubmit(event) {
        event.preventDefault(); // Предотвращаем перезагрузку страницы

        // Собираем данные из формы
        const formData = {
            startCapital: parseFloat(document.getElementById('start-capital').value),
            years: parseInt(document.getElementById('years').value, 10),
            interestRate: parseFloat(document.getElementById('interest-rate').value),
            contribution: parseFloat(document.getElementById('contribution').value),
            contributionPeriod: document.getElementById('contribution-period').value
        };

        console.log('Данные формы для расчёта:', formData);

        // Временная обратная связь, пока нет реальных вычислений
        alert(`Этап 1: Интерфейс работает!\nДанные получены:\n- Стартовый капитал: ${formData.startCapital} ₽\n- Срок: ${formData.years} лет\n- Ставка: ${formData.interestRate}%\n- Взнос: ${formData.contribution} ₽ (${formData.contributionPeriod})`);

        // Разблокируем кнопки экспорта (пока чисто символически)
        pdfButton.disabled = false;
        excelButton.disabled = false;
    }

    // Временные заглушки для кнопок экспорта
    function handlePdfExport() {
        alert('📄 Экспорт в PDF будет реализован на Этапе 4.');
    }

    function handleExcelExport() {
        alert('📊 Экспорт в Excel будет реализован на Этапе 5.');
    }

    // Добавляем слушатели событий
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    if (pdfButton) {
        pdfButton.addEventListener('click', handlePdfExport);
    }

    if (excelButton) {
        excelButton.addEventListener('click', handleExcelExport);
    }

    console.log('Приложение "Калькулятор инвестора" (Этап 1) успешно загружено.');
});