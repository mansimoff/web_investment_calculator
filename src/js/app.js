// app.js — главный файл, связывает интерфейс и расчёты
// v3.0: валидация, правильная видимость полей, рабочий график

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // =========================================================
    // DOM-элементы
    // =========================================================
    const form           = document.getElementById('investment-form');
    const errorBanner    = document.getElementById('form-error-banner');
    const calcModeSelect = document.getElementById('calc-mode');
    const resultsDiv     = document.getElementById('results-output');
    const chartCard      = document.getElementById('chart-card');
    const pdfBtn         = document.getElementById('export-pdf');
    const excelBtn       = document.getElementById('export-excel');

    // Группы полей
    const groups = {
        startCapital : document.getElementById('group-start-capital'),
        years        : document.getElementById('group-years'),
        rate         : document.getElementById('group-rate'),
        contribution : document.getElementById('group-contribution'),
        period       : document.getElementById('group-period'),
        target       : document.getElementById('group-target'),
    };

    // Инпуты
    const inputs = {
        startCapital : document.getElementById('start-capital'),
        years        : document.getElementById('years'),
        rate         : document.getElementById('interest-rate'),
        contribution : document.getElementById('contribution'),
        period       : document.getElementById('contribution-period'),
        target       : document.getElementById('target-amount'),
    };

    let lastResult = null;

    // =========================================================
    // Видимость полей по режиму расчёта
    //
    // Логика:
    //   future-value    — скрыть: target
    //                     период нужен (вводим размер взноса и его периодичность)
    //
    //   interest-rate   — скрыть: rate, target (target — выходной параметр? нет,
    //                     тут target — входная цель). Скрываем rate.
    //                     Период нужен.
    //
    //   target-years    — скрыть: years. Период нужен.
    //
    //   contribution    — скрыть: contribution.
    //                     Период — это ВХОДНАЯ периодичность, которую пользователь
    //                     задаёт, чтобы узнать размер одного взноса. Показываем.
    //
    //   starting-capital— скрыть: startCapital. Период нужен.
    // =========================================================
    const FIELD_CONFIG = {
        'future-value'    : { hide: ['target'] },
        'interest-rate'   : { hide: ['rate'] },
        'target-years'    : { hide: ['years'] },
        'contribution'    : { hide: ['contribution'] },
        'starting-capital': { hide: ['startCapital'] },
    };

    function updateFieldsVisibility() {
        const mode = calcModeSelect.value;
        const config = FIELD_CONFIG[mode] || { hide: [] };

        Object.keys(groups).forEach(key => {
            const el = groups[key];
            if (!el) return;
            el.style.display = config.hide.includes(key) ? 'none' : 'block';
        });

        clearValidation();
    }

    // =========================================================
    // Валидация
    // =========================================================

    function showError(message) {
        errorBanner.textContent = message;
        errorBanner.classList.add('visible');
    }

    function clearValidation() {
        errorBanner.classList.remove('visible');
        Object.values(inputs).forEach(el => {
            if (el) el.classList.remove('field-error');
        });
    }

    /**
     * Возвращает { valid: bool, errors: string[] }
     * Проверяет только видимые поля (скрытые пропускаем).
     */
    function validate(data) {
        const errors = [];
        const mode = data.mode;

        const isVisible = key => groups[key] && groups[key].style.display !== 'none';

        // Стартовый капитал — не отрицательный
        if (isVisible('startCapital') && data.startCapital < 0) {
            inputs.startCapital.classList.add('field-error');
            errors.push('Стартовый капитал не может быть отрицательным.');
        }

        // Срок — обязателен и > 0
        if (isVisible('years')) {
            if (!inputs.years.value.trim()) {
                inputs.years.classList.add('field-error');
                errors.push('Укажите срок инвестиций.');
            } else if (data.years <= 0 || data.years > 100) {
                inputs.years.classList.add('field-error');
                errors.push('Срок должен быть от 1 до 100 лет.');
            }
        }

        // Ставка — обязательна и > 0
        if (isVisible('rate')) {
            if (!inputs.rate.value.trim()) {
                inputs.rate.classList.add('field-error');
                errors.push('Укажите процентную ставку.');
            } else if (data.annualRate <= 0) {
                inputs.rate.classList.add('field-error');
                errors.push('Процентная ставка должна быть больше 0%.');
            } else if (data.annualRate > 500) {
                inputs.rate.classList.add('field-error');
                errors.push('Ставка свыше 500% — проверьте данные.');
            }
        }

        // Пополнение — не отрицательное
        if (isVisible('contribution') && data.contribution < 0) {
            inputs.contribution.classList.add('field-error');
            errors.push('Размер пополнения не может быть отрицательным.');
        }

        // Целевая сумма — обязательна для всех режимов кроме future-value
        if (isVisible('target')) {
            if (!inputs.target.value.trim()) {
                inputs.target.classList.add('field-error');
                errors.push('Укажите целевую сумму.');
            } else if (data.targetAmount <= 0) {
                inputs.target.classList.add('field-error');
                errors.push('Целевая сумма должна быть больше 0.');
            }
        }

        // Специфичные проверки
        if (mode === 'future-value') {
            if (data.startCapital === 0 && data.contribution === 0) {
                inputs.startCapital.classList.add('field-error');
                inputs.contribution.classList.add('field-error');
                errors.push('Укажите стартовый капитал и/или размер пополнений.');
            }
        }

        if (mode === 'starting-capital' && isVisible('target')) {
            if (data.targetAmount > 0 && data.contribution === 0 && data.annualRate === 0) {
                errors.push('При нулевой ставке и нулевых пополнениях стартовый капитал равен целевой сумме — проверьте параметры.');
            }
        }

        return { valid: errors.length === 0, errors };
    }

    // =========================================================
    // Сбор данных из формы
    // =========================================================
    function getFormData() {
        return {
            mode        : calcModeSelect.value,
            startCapital: parseFloat(inputs.startCapital.value) || 0,
            years       : parseInt(inputs.years.value)          || 0,
            annualRate  : parseFloat(inputs.rate.value)         || 0,
            contribution: parseFloat(inputs.contribution.value) || 0,
            period      : inputs.period.value,
            targetAmount: parseFloat(inputs.target.value)       || 0,
        };
    }

    // =========================================================
    // Расчёт
    // =========================================================
    function calculate(data) {
        switch (data.mode) {
            case 'future-value':
                return { type: 'future-value', ...window.FutureValue.calculate({
                    startCapital: data.startCapital,
                    years       : data.years,
                    annualRate  : data.annualRate,
                    contribution: data.contribution,
                    period      : data.period,
                })};

            case 'interest-rate':
                return { type: 'interest-rate', ...window.InterestRate.calculate({
                    targetAmount: data.targetAmount,
                    startCapital: data.startCapital,
                    years       : data.years,
                    contribution: data.contribution,
                    period      : data.period,
                })};

            case 'target-years':
                return { type: 'target-years', ...window.TargetYears.calculate({
                    targetAmount: data.targetAmount,
                    startCapital: data.startCapital,
                    annualRate  : data.annualRate,
                    contribution: data.contribution,
                    period      : data.period,
                })};

            case 'contribution':
                return { type: 'contribution', ...window.Contribution.calculate({
                    targetAmount: data.targetAmount,
                    startCapital: data.startCapital,
                    years       : data.years,
                    annualRate  : data.annualRate,
                    period      : data.period,
                })};

            case 'starting-capital':
                return { type: 'starting-capital', ...window.StartingCapital.calculate({
                    targetAmount: data.targetAmount,
                    years       : data.years,
                    annualRate  : data.annualRate,
                    contribution: data.contribution,
                    period      : data.period,
                })};

            default:
                return null;
        }
    }

    // =========================================================
    // Отображение результатов
    // =========================================================
    const fmt = n => window.FinMath.formatCurrency(n);
    const fmtPct = n => window.FinMath.formatPercent(n, 2);

    function statItem(label, value, cls = '') {
        return `<div class="stat-item ${cls}">
            <span class="stat-label">${label}</span>
            <span class="stat-value">${value}</span>
        </div>`;
    }

    function displayResults(result) {
        let warning = '';
        let html = '<h2>📊 Результаты расчёта</h2>';

        // Предупреждение о недостижимости
        if (result.type === 'interest-rate' && result.annualRate >= 100) {
            warning = `<div class="warning-banner">⚠️ Для достижения цели требуется ставка ${fmtPct(result.annualRate)} — это экстремально высокий показатель. Проверьте параметры или увеличьте срок/взносы.</div>`;
        }
        if (result.type === 'target-years' && result.totalMonths >= 1200) {
            warning = `<div class="warning-banner">⚠️ Срок достижения цели превышает 100 лет. Рассмотрите увеличение ставки, взносов или стартового капитала.</div>`;
        }

        html += warning;
        html += '<div class="results-grid">';

        // Главный результат — всегда первым (highlight)
        if (result.type === 'future-value') {
            html += statItem('Итоговая сумма', fmt(result.finalBalance), 'highlight');
        }
        if (result.type === 'interest-rate') {
            html += statItem('Необходимая ставка', fmtPct(result.annualRate), 'highlight');
        }
        if (result.type === 'target-years') {
            const label = result.years > 0
                ? `${result.years} л. ${result.months} мес.`
                : `${result.months} мес.`;
            html += statItem('Срок достижения цели', label, 'highlight');
        }
        if (result.type === 'contribution') {
            html += statItem('Размер пополнения', fmt(result.contribution), 'highlight');
        }
        if (result.type === 'starting-capital') {
            html += statItem('Стартовый капитал', fmt(result.startCapital), 'highlight');
        }

        // Общие итоги
        if (result.type !== 'interest-rate') {
            html += statItem('Итоговая сумма', fmt(result.finalBalance || result.targetAmount || 0));
        }
        html += statItem('Вложено всего', fmt((result.startCapital || 0) + (result.totalContributions || 0)));
        html += statItem('Доход от процентов', `<span class="positive">${fmt(result.totalInterest || 0)}</span>`);

        if (result.type === 'future-value') {
            html += statItem('Годовая ставка', fmtPct(result.annualRate));
        }

        html += '</div>';

        resultsDiv.innerHTML = html;

        // График — только для future-value (есть yearlyData)
        if (result.type === 'future-value' && result.yearlyData && result.yearlyData.length > 1) {
            chartCard.style.display = 'block';
            // canvas гарантированно в DOM, рисуем сразу
            window.Charts.drawGrowthChart(result.yearlyData);
        } else {
            chartCard.style.display = 'none';
            if (window.Charts) window.Charts.destroyChart();
        }
    }

    // =========================================================
    // Обработчик формы
    // =========================================================
    function handleSubmit(event) {
        event.preventDefault();
        clearValidation();

        const data = getFormData();
        const { valid, errors } = validate(data);

        if (!valid) {
            showError(errors[0]); // показываем первую ошибку
            return;
        }

        const result = calculate(data);
        if (!result) return;

        lastResult = { data, result };
        displayResults(result);

        pdfBtn.disabled   = false;
        excelBtn.disabled = false;
    }

    // =========================================================
    // Слушатели
    // =========================================================
    form.addEventListener('submit', handleSubmit);
    calcModeSelect.addEventListener('change', updateFieldsVisibility);

    pdfBtn.addEventListener('click', () => {
        if (!lastResult) return;
        pdfBtn.disabled = true;
        pdfBtn.textContent = '⏳ Генерация PDF...';
        // defer чтобы браузер успел обновить кнопку до синхронной работы jsPDF
        setTimeout(() => {
            try {
                window.ExportPDF.exportPDF(lastResult);
            } catch (e) {
                alert('Ошибка при генерации PDF: ' + e.message);
                console.error(e);
            } finally {
                pdfBtn.disabled = false;
                pdfBtn.innerHTML = '📄 Скачать PDF';
            }
        }, 50);
    });

    excelBtn.addEventListener('click', () => {
        if (!lastResult) return;
        try {
            window.ExportExcel.exportExcel(lastResult);
        } catch (e) {
            alert('Ошибка при генерации Excel: ' + e.message);
            console.error(e);
        }
    });

    // Инициализация
    updateFieldsVisibility();
    console.log('✅ Калькулятор инвестора v3.0 готов');
});
