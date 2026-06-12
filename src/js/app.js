// app.js
// Главный файл — связь интерфейса и расчётов

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // === DOM-элементы ===
    const form = document.getElementById('investment-form');
    const resultsDiv = document.getElementById('results-output');
    const pdfBtn = document.getElementById('export-pdf');
    const excelBtn = document.getElementById('export-excel');
    
    // Режим расчёта
    const calcModeSelect = document.getElementById('calc-mode');
    
    // Поля ввода
    const startCapitalGroup = document.getElementById('group-start-capital');
    const yearsGroup = document.getElementById('group-years');
    const rateGroup = document.getElementById('group-rate');
    const contributionGroup = document.getElementById('group-contribution');
    const targetGroup = document.getElementById('group-target');
    
    const startCapitalInput = document.getElementById('start-capital');
    const yearsInput = document.getElementById('years');
    const rateInput = document.getElementById('interest-rate');
    const contributionInput = document.getElementById('contribution');
    const periodSelect = document.getElementById('contribution-period');
    const targetInput = document.getElementById('target-amount');

    // Сохраняем результаты для экспорта
    let lastResult = null;

    /**
     * Скрывает/показывает поля в зависимости от режима расчёта
     */
    function updateFieldsVisibility() {
        const mode = calcModeSelect.value;
        
        // Скрываем все необязательные группы
        const allGroups = [startCapitalGroup, yearsGroup, rateGroup, contributionGroup, targetGroup];
        allGroups.forEach(g => { if (g) g.style.display = 'block'; });
        
        // Показываем/скрываем в зависимости от режима
        switch (mode) {
            case 'future-value':
                // Ищем конечную сумму — всё известно, цель не нужна
                if (targetGroup) targetGroup.style.display = 'none';
                break;
                
            case 'interest-rate':
                // Ищем ставку — всё кроме ставки + цель
                if (rateGroup) rateGroup.style.display = 'none';
                break;
                
            case 'target-years':
                // Ищем срок — всё кроме срока + цель
                if (yearsGroup) yearsGroup.style.display = 'none';
                break;
                
            case 'contribution':
                // Ищем пополнение — всё кроме пополнения + цель
                if (contributionGroup) contributionGroup.style.display = 'none';
                break;
                
            case 'starting-capital':
                // Ищем стартовый капитал — всё кроме капитала + цель
                if (startCapitalGroup) startCapitalGroup.style.display = 'none';
                break;
        }
    }

    /**
     * Сбор данных из формы
     */
    function getFormData() {
        return {
            mode: calcModeSelect.value,
            startCapital: parseFloat(startCapitalInput.value) || 0,
            years: parseInt(yearsInput.value) || 0,
            annualRate: parseFloat(rateInput.value) || 0,
            contribution: parseFloat(contributionInput.value) || 0,
            period: periodSelect.value,
            targetAmount: parseFloat(targetInput?.value) || 0
        };
    }

    /**
     * Выполняет расчёт в зависимости от выбранного режима
     */
    function calculate(data) {
        switch (data.mode) {
            case 'future-value':
                return {
                    type: 'future-value',
                    ...window.FutureValue.calculate({
                        startCapital: data.startCapital,
                        years: data.years,
                        annualRate: data.annualRate,
                        contribution: data.contribution,
                        period: data.period
                    })
                };
                
            case 'interest-rate':
                return {
                    type: 'interest-rate',
                    ...window.InterestRate.calculate({
                        targetAmount: data.targetAmount,
                        startCapital: data.startCapital,
                        years: data.years,
                        contribution: data.contribution,
                        period: data.period
                    })
                };
                
            case 'target-years':
                return {
                    type: 'target-years',
                    ...window.TargetYears.calculate({
                        targetAmount: data.targetAmount,
                        startCapital: data.startCapital,
                        annualRate: data.annualRate,
                        contribution: data.contribution,
                        period: data.period
                    })
                };
                
            case 'contribution':
                return {
                    type: 'contribution',
                    ...window.Contribution.calculate({
                        targetAmount: data.targetAmount,
                        startCapital: data.startCapital,
                        years: data.years,
                        annualRate: data.annualRate,
                        period: data.period
                    })
                };
                
            case 'starting-capital':
                return {
                    type: 'starting-capital',
                    ...window.StartingCapital.calculate({
                        targetAmount: data.targetAmount,
                        years: data.years,
                        annualRate: data.annualRate,
                        contribution: data.contribution,
                        period: data.period
                    })
                };
                
            default:
                return null;
        }
    }

    /**
     * Отображение результатов
     */
    function displayResults(result) {
        let html = '<h2>📊 Результаты расчёта</h2><div class="results-grid">';
        
        if (result.type === 'future-value' || result.type === 'contribution' || result.type === 'starting-capital') {
            html += `
                <div class="stat-item highlight">
                    <span class="stat-label">Итоговая сумма</span>
                    <span class="stat-value">${window.FinMath.formatCurrency(result.finalBalance)}</span>
                </div>
            `;
        }
        
        if (result.type === 'interest-rate') {
            html += `
                <div class="stat-item highlight">
                    <span class="stat-label">Необходимая ставка</span>
                    <span class="stat-value">${window.FinMath.formatPercent(result.annualRate)}</span>
                </div>
            `;
        }
        
        if (result.type === 'target-years') {
            html += `
                <div class="stat-item highlight">
                    <span class="stat-label">Срок достижения</span>
                    <span class="stat-value">${result.years} л. ${result.months} мес.</span>
                </div>
            `;
        }
        
        html += `
            <div class="stat-item">
                <span class="stat-label">Стартовый капитал</span>
                <span class="stat-value">${window.FinMath.formatCurrency(result.startCapital || 0)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Всего пополнений</span>
                <span class="stat-value">${window.FinMath.formatCurrency(result.totalContributions || 0)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Прибыль (проценты)</span>
                <span class="stat-value positive">${window.FinMath.formatCurrency(result.totalInterest || 0)}</span>
            </div>
        `;
        
        if (result.type === 'future-value') {
            html += `
                <div class="stat-item">
                    <span class="stat-label">Эффективная ставка</span>
                    <span class="stat-value">${window.FinMath.formatPercent(result.annualRate, 2)}</span>
                </div>
            `;
        }
        
        if (result.type === 'contribution') {
            html += `
                <div class="stat-item highlight">
                    <span class="stat-label">Размер пополнения</span>
                    <span class="stat-value">${window.FinMath.formatCurrency(result.contribution)}</span>
                </div>
            `;
        }
        
        if (result.type === 'starting-capital') {
            html += `
                <div class="stat-item highlight">
                    <span class="stat-label">Требуемый капитал</span>
                    <span class="stat-value">${window.FinMath.formatCurrency(result.startCapital)}</span>
                </div>
            `;
        }
        
        html += '</div>';
        
        // График (только для future-value)
        if (result.type === 'future-value' && result.yearlyData) {
            html += '<div class="chart-card"><h3>📈 Рост капитала по годам</h3><div class="chart-container"><canvas id="growth-chart"></canvas></div></div>';
        }
        
        resultsDiv.innerHTML = html;
        
        // Рисуем график, если есть данные
        if (result.type === 'future-value' && result.yearlyData && window.Charts) {
            setTimeout(() => {
                window.Charts.drawGrowthChart(result.yearlyData);
            }, 100);
        }
    }

    /**
     * Обработчик отправки формы
     */
    function handleSubmit(event) {
        event.preventDefault();
        
        const data = getFormData();
        
        // Простая валидация
        if (data.mode !== 'future-value' && data.targetAmount <= 0) {
            alert('Укажите целевую сумму');
            return;
        }
        
        const result = calculate(data);
        
        if (result) {
            lastResult = { data, result };
            displayResults(result);
            
            // Разблокируем экспорт
            pdfBtn.disabled = false;
            excelBtn.disabled = false;
        }
    }

    // Слушатели событий
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    if (calcModeSelect) {
        calcModeSelect.addEventListener('change', updateFieldsVisibility);
    }

    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            alert('Экспорт в PDF будет на Этапе 4');
        });
    }
    
    if (excelBtn) {
        excelBtn.addEventListener('click', () => {
            alert('Экспорт в Excel будет на Этапе 5');
        });
    }

    // Инициализация
    updateFieldsVisibility();
    
    console.log('✅ Калькулятор инвестора (v2.0) готов');
    console.log('📐 5 режимов расчёта активны');
});