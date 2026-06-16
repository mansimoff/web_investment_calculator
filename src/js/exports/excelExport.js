// excelExport.js
// Экспорт отчёта в Excel через SheetJS (xlsx)
// Зависимость (CDN, подключать в index.html ДО этого файла):
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" defer></script>

(function () {
    'use strict';

    const MODE_LABELS = {
        'future-value'    : 'Расчёт конечной суммы',
        'interest-rate'   : 'Расчёт необходимого процента',
        'target-years'    : 'Расчёт срока достижения цели',
        'contribution'    : 'Расчёт размера пополнений',
        'starting-capital': 'Расчёт стартового капитала',
    };

    const PERIOD_LABELS = {
        monthly  : 'раз в месяц',
        quarterly: 'раз в квартал',
        annually : 'раз в год',
    };

    // =========================================================
    // Хелперы для стилей ячеек
    // Стили работают только с xlsx-pro (коммерческая версия),
    // но структура данных корректна для открытой версии.
    // =========================================================

    function numFmt(n) {
        return typeof n === 'number' ? n : (parseFloat(n) || 0);
    }

    // =========================================================
    // Построение листа «Отчёт»
    // =========================================================
    function buildSummarySheet(lastResult) {
        const { data, result } = lastResult;
        const mode = result.type;
        const rows = [];

        const DATE_STR = new Date().toLocaleDateString('ru-RU', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

        // ---- Шапка ----
        rows.push(['Инвестиционный Калькулятор', '', '', '']);
        rows.push([MODE_LABELS[mode] || 'Расчёт', '', '', '']);
        rows.push([DATE_STR, '', '', '']);
        rows.push(['']); // пустая строка

        // ---- Входные данные ----
        rows.push(['ВХОДНЫЕ ПАРАМЕТРЫ', '', '', '']);
        rows.push(['Параметр', 'Значение', '', '']);

        if (mode !== 'starting-capital') {
            rows.push(['Стартовый капитал, руб.', numFmt(data.startCapital)]);
        }
        if (mode !== 'target-years') {
            rows.push(['Срок инвестиций, лет', numFmt(data.years)]);
        }
        if (mode !== 'interest-rate') {
            rows.push(['Годовая ставка, %', numFmt(data.annualRate)]);
        }
        if (mode !== 'contribution') {
            rows.push(['Размер пополнения, руб.', numFmt(data.contribution)]);
        }
        rows.push(['Периодичность пополнений', PERIOD_LABELS[data.period] || data.period]);
        if (mode !== 'future-value') {
            rows.push(['Целевая сумма, руб.', numFmt(data.targetAmount)]);
        }

        rows.push(['']); // разделитель

        // ---- Результаты ----
        rows.push(['РЕЗУЛЬТАТЫ', '', '', '']);
        rows.push(['Показатель', 'Значение', '', '']);

        if (mode === 'future-value') {
            rows.push(['Итоговая сумма, руб.', numFmt(result.finalBalance)]);
        }
        if (mode === 'interest-rate') {
            rows.push(['Необходимая ставка, %', numFmt(result.annualRate)]);
        }
        if (mode === 'target-years') {
            rows.push(['Срок: лет', numFmt(result.years)]);
            rows.push(['Срок: месяцев (остаток)', numFmt(result.months)]);
            rows.push(['Итоговая сумма, руб.', numFmt(result.finalBalance)]);
        }
        if (mode === 'contribution') {
            rows.push(['Размер пополнения, руб.', numFmt(result.contribution)]);
            rows.push(['Итоговая сумма, руб.', numFmt(result.finalBalance)]);
        }
        if (mode === 'starting-capital') {
            rows.push(['Стартовый капитал, руб.', numFmt(result.startCapital)]);
            rows.push(['Итоговая сумма, руб.', numFmt(result.finalBalance)]);
        }

        const invested = (result.startCapital || data.startCapital || 0) + (result.totalContributions || 0);
        rows.push(['Вложено всего, руб.', numFmt(invested)]);
        rows.push(['Сумма взносов, руб.', numFmt(result.totalContributions || 0)]);
        rows.push(['Доход от процентов, руб.', numFmt(result.totalInterest || 0)]);

        const finalBal = result.finalBalance || result.targetAmount || 0;
        if (invested > 0 && finalBal > 0) {
            const roi = ((result.totalInterest || 0) / invested * 100);
            rows.push(['Доходность на вложения, %', numFmt(roi.toFixed(2))]);
        }

        rows.push(['']);
        rows.push(['ВАЖНО: учитывайте налоги (НДФЛ 13%), инфляцию и комиссии.', '', '', '']);
        rows.push(['Данный расчёт является модельным.', '', '', '']);

        return XLSX.utils.aoa_to_sheet(rows);
    }

    // =========================================================
    // Построение листа «По годам»
    // =========================================================
    function buildYearlySheet(yearlyData, startCapital) {
        const header = [
            'Год',
            'Баланс, руб.',
            'Вложено (стартовый + взносы), руб.',
            'Доход от процентов, руб.',
            'Доля процентов в балансе, %',
            'Прирост за год, руб.',
        ];

        const rows = [header];
        let prevBalance = 0;

        yearlyData.forEach((row, idx) => {
            const yearLabel = row.year === 0 ? 0 : row.year;
            const invested  = numFmt(row.balance) - numFmt(row.totalInterest);
            const sharePct  = row.balance > 0
                ? numFmt((row.totalInterest / row.balance * 100).toFixed(2))
                : 0;
            const growth    = idx === 0 ? 0 : numFmt(row.balance - prevBalance);
            prevBalance = row.balance;

            rows.push([
                yearLabel,
                numFmt(row.balance),
                numFmt(invested),
                numFmt(row.totalInterest),
                sharePct,
                growth,
            ]);
        });

        return XLSX.utils.aoa_to_sheet(rows);
    }

    // =========================================================
    // Установка ширины колонок (работает в xlsx-community)
    // =========================================================
    function setColWidths(sheet, widths) {
        sheet['!cols'] = widths.map(w => ({ wch: w }));
    }

    // =========================================================
    // Основная функция экспорта
    // =========================================================
    function exportExcel(lastResult) {
        if (typeof XLSX === 'undefined') {
            alert('Библиотека SheetJS (xlsx) не загружена. Проверьте подключение скриптов в index.html.');
            return;
        }

        const wb = XLSX.utils.book_new();

        // Лист 1 — сводный отчёт
        const summarySheet = buildSummarySheet(lastResult);
        setColWidths(summarySheet, [40, 22, 10, 10]);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Отчёт');

        // Лист 2 — динамика по годам (только если есть yearlyData)
        if (lastResult.result.yearlyData && lastResult.result.yearlyData.length > 1) {
            const yearlySheet = buildYearlySheet(
                lastResult.result.yearlyData,
                lastResult.result.startCapital || lastResult.data.startCapital || 0
            );
            setColWidths(yearlySheet, [8, 22, 28, 24, 24, 20]);
            XLSX.utils.book_append_sheet(wb, yearlySheet, 'По годам');
        }

        // Сохраняем
        const filename = `investment_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, filename);
    }

    window.ExportExcel = { exportExcel };
})();
