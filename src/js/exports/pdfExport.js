// pdfExport.js
// Экспорт отчёта в PDF через jsPDF
// Зависимости (CDN, подключать в index.html ДО этого файла):
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" defer></script>

(function () {
    'use strict';

    // Человекочитаемые названия режимов и полей
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

    const fmt    = n  => window.FinMath.formatCurrency(n);
    const fmtPct = n  => window.FinMath.formatPercent(n, 2);
    const fmtNum = n  => window.FinMath.formatNumber(n, 0);

    // =========================================================
    // Построение объекта отчёта из lastResult
    // =========================================================
    function buildReport(lastResult) {
        const { data, result } = lastResult;
        const mode = result.type;

        // --- ВХОДНЫЕ ДАННЫЕ ---
        const inputs = [];

        if (mode !== 'starting-capital') {
            inputs.push(['Стартовый капитал', fmt(data.startCapital)]);
        }
        if (mode !== 'target-years') {
            inputs.push(['Срок инвестиций', `${data.years} лет`]);
        }
        if (mode !== 'interest-rate') {
            inputs.push(['Годовая ставка', fmtPct(data.annualRate)]);
        }
        if (mode !== 'contribution') {
            inputs.push(['Размер пополнения', fmt(data.contribution)]);
        }
        inputs.push(['Периодичность пополнений', PERIOD_LABELS[data.period] || data.period]);
        if (mode !== 'future-value') {
            inputs.push(['Целевая сумма', fmt(data.targetAmount)]);
        }

        // --- РЕЗУЛЬТАТЫ ---
        const outputs = [];

        if (mode === 'future-value') {
            outputs.push(['★ Итоговая сумма', fmt(result.finalBalance)]);
        }
        if (mode === 'interest-rate') {
            outputs.push(['★ Необходимая ставка', fmtPct(result.annualRate)]);
        }
        if (mode === 'target-years') {
            const label = result.years > 0
                ? `${result.years} л. ${result.months} мес.`
                : `${result.months} мес.`;
            outputs.push(['★ Срок достижения цели', label]);
            outputs.push(['Итоговая сумма', fmt(result.finalBalance)]);
        }
        if (mode === 'contribution') {
            outputs.push(['★ Размер пополнения', fmt(result.contribution)]);
            outputs.push(['Итоговая сумма', fmt(result.finalBalance)]);
        }
        if (mode === 'starting-capital') {
            outputs.push(['★ Стартовый капитал', fmt(result.startCapital)]);
            outputs.push(['Итоговая сумма', fmt(result.finalBalance)]);
        }

        outputs.push(['Вложено (стартовый + взносы)', fmt((result.startCapital || data.startCapital || 0) + (result.totalContributions || 0))]);
        outputs.push(['Всего взносов',                fmt(result.totalContributions || 0)]);
        outputs.push(['Доход от процентов',           fmt(result.totalInterest || 0)]);

        if (result.totalInterest > 0 && (result.finalBalance || result.targetAmount)) {
            const total  = result.finalBalance || result.targetAmount;
            const invest = (result.startCapital || data.startCapital || 0) + (result.totalContributions || 0);
            const pct    = invest > 0 ? ((result.totalInterest / invest) * 100).toFixed(1) + '%' : '—';
            outputs.push(['Доходность на вложения', pct]);
        }

        return {
            title   : MODE_LABELS[mode] || 'Инвестиционный расчёт',
            inputs,
            outputs,
            yearlyData: result.yearlyData || null,
        };
    }

    // =========================================================
    // Генерация PDF
    // =========================================================
    async function exportPDF(lastResult) {
        if (!window.jspdf) {
            alert('Библиотека jsPDF не загружена. Проверьте подключение скриптов в index.html.');
            return;
        }

        const report = buildReport(lastResult);
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

        const PAGE_W  = 210;
        const PAGE_H  = 297;
        const MARGIN  = 18;
        const CONTENT_W = PAGE_W - MARGIN * 2;
        let y = MARGIN;

        // ---- Шрифт ----
        // jsPDF имеет встроенный helvetica; для кириллицы загружаем Roboto через CDN
        // (инструкция по добавлению в index.html — в комментарии вверху файла)

        const COL_GRAY   = [120, 120, 120];
        const COL_BLACK  = [30, 30, 30];
        const COL_ACCENT = [79, 70, 229];   // --primary-color
        const COL_BG_ROW = [248, 250, 252];

        // ---- Хелперы ----
        function addPageIfNeeded(needed = 10) {
            if (y + needed > PAGE_H - MARGIN) {
                doc.addPage();
                y = MARGIN;
            }
        }

        function hLine(color = [220, 220, 220]) {
            doc.setDrawColor(...color);
            doc.setLineWidth(0.3);
            doc.line(MARGIN, y, PAGE_W - MARGIN, y);
            y += 4;
        }

        function sectionHeader(text) {
            addPageIfNeeded(12);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(...COL_ACCENT);
            doc.text(text, MARGIN, y);
            y += 1;
            doc.setDrawColor(...COL_ACCENT);
            doc.setLineWidth(0.5);
            doc.line(MARGIN, y, MARGIN + 60, y);
            y += 5;
        }

        function twoColRow(label, value, shade = false) {
            addPageIfNeeded(8);
            if (shade) {
                doc.setFillColor(...COL_BG_ROW);
                doc.rect(MARGIN, y - 4.5, CONTENT_W, 7, 'F');
            }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...COL_GRAY);
            doc.text(label, MARGIN + 1, y);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COL_BLACK);
            doc.text(value, PAGE_W - MARGIN - 1, y, { align: 'right' });
            y += 7;
        }

        // =========================================================
        // ШАПКА
        // =========================================================
        // Цветная полоса
        doc.setFillColor(...COL_ACCENT);
        doc.rect(0, 0, PAGE_W, 28, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text('Инвестиционный Калькулятор', MARGIN, 13);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(report.title, MARGIN, 21);

        // Дата
        const dateStr = new Date().toLocaleDateString('ru-RU', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        doc.text(dateStr, PAGE_W - MARGIN, 21, { align: 'right' });

        y = 38;

        // =========================================================
        // ВХОДНЫЕ ДАННЫЕ
        // =========================================================
        sectionHeader('Входные параметры');
        report.inputs.forEach(([label, value], i) => twoColRow(label, value, i % 2 === 0));
        y += 3;

        // =========================================================
        // РЕЗУЛЬТАТЫ
        // =========================================================
        sectionHeader('Результаты расчёта');
        report.outputs.forEach(([label, value], i) => {
            const isMain = label.startsWith('★');
            const cleanLabel = label.replace('★ ', '');

            addPageIfNeeded(10);
            if (isMain) {
                // Выделенная строка для главного результата
                doc.setFillColor(...COL_ACCENT);
                doc.rect(MARGIN, y - 5, CONTENT_W, 8, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(255, 255, 255);
                doc.text(cleanLabel, MARGIN + 2, y);
                doc.text(value, PAGE_W - MARGIN - 2, y, { align: 'right' });
                y += 9;
            } else {
                twoColRow(cleanLabel, value, i % 2 === 0);
            }
        });

        y += 5;

        // =========================================================
        // ГРАФИК (если есть yearlyData)
        // =========================================================
        const canvas = document.getElementById('growth-chart');
        if (canvas && report.yearlyData && report.yearlyData.length > 1) {
            addPageIfNeeded(100);
            sectionHeader('График роста капитала');

            try {
                const imgData = canvas.toDataURL('image/png', 1.0);
                const imgW    = CONTENT_W;
                const imgH    = Math.round(imgW * (canvas.height / canvas.width));
                addPageIfNeeded(imgH + 10);
                doc.addImage(imgData, 'PNG', MARGIN, y, imgW, imgH);
                y += imgH + 8;
            } catch (e) {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(9);
                doc.setTextColor(...COL_GRAY);
                doc.text('[График недоступен: ' + e.message + ']', MARGIN, y);
                y += 8;
            }
        }

        // =========================================================
        // ТАБЛИЦА РОСТА ПО ГОДАМ (если есть yearlyData)
        // =========================================================
        if (report.yearlyData && report.yearlyData.length > 1) {
            addPageIfNeeded(20);
            sectionHeader('Динамика роста по годам');

            // Заголовок таблицы
            const cols = [
                { label: 'Год',              x: MARGIN + 1,       align: 'left'  },
                { label: 'Баланс',           x: MARGIN + 38,      align: 'right' },
                { label: 'Взносы',           x: MARGIN + 82,      align: 'right' },
                { label: 'Проценты',         x: MARGIN + 126,     align: 'right' },
                { label: 'Доля %',           x: PAGE_W - MARGIN - 1, align: 'right' },
            ];

            addPageIfNeeded(10);
            doc.setFillColor(240, 242, 255);
            doc.rect(MARGIN, y - 5, CONTENT_W, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...COL_ACCENT);
            cols.forEach(c => doc.text(c.label, c.x, y, { align: c.align }));
            y += 5;
            hLine([200, 200, 230]);

            // Строки
            report.yearlyData.forEach((row, idx) => {
                addPageIfNeeded(7);
                if (idx % 2 === 0) {
                    doc.setFillColor(...COL_BG_ROW);
                    doc.rect(MARGIN, y - 4.5, CONTENT_W, 6.5, 'F');
                }

                const yearLabel = row.year === 0 ? 'Старт' : `${row.year}`;
                const interestShare = row.balance > 0
                    ? ((row.totalInterest / row.balance) * 100).toFixed(1) + '%'
                    : '—';

                const rowCols = [
                    { val: yearLabel,                         x: cols[0].x, align: 'left'  },
                    { val: fmtNum(row.balance),               x: cols[1].x, align: 'right' },
                    { val: fmtNum(row.balance - row.totalInterest), x: cols[2].x, align: 'right' },
                    { val: fmtNum(row.totalInterest),         x: cols[3].x, align: 'right' },
                    { val: interestShare,                     x: cols[4].x, align: 'right' },
                ];

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(...COL_BLACK);
                rowCols.forEach(c => doc.text(c.val, c.x, y, { align: c.align }));
                y += 6.5;
            });

            y += 4;
        }

        // =========================================================
        // ДИСКЛЕЙМЕР
        // =========================================================
        addPageIfNeeded(20);
        doc.setFillColor(254, 226, 226);
        doc.rect(MARGIN, y, CONTENT_W, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(185, 28, 28);
        doc.text(
            'Учитывайте налоги (НДФЛ 13%), инфляцию и комиссии брокера при реальном инвестировании.',
            MARGIN + 3, y + 5
        );
        doc.text(
            'Расчёт является модельным и не гарантирует точной доходности.',
            MARGIN + 3, y + 10
        );
        y += 18;

        // =========================================================
        // Нижний колонтитул на каждой странице
        // =========================================================
        const totalPages = doc.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...COL_GRAY);
            doc.text(
                `Страница ${p} из ${totalPages}  •  Инвестиционный Калькулятор`,
                PAGE_W / 2, PAGE_H - 8, { align: 'center' }
            );
        }

        // =========================================================
        // Сохранение
        // =========================================================
        const filename = `investment_report_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
    }

    window.ExportPDF = { exportPDF };
})();
