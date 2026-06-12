// futureValue.js
// Расчёт будущей стоимости (конечной суммы)

/**
 * Рассчитывает конечную сумму инвестиций
 * 
 * Метод: помесячная капитализация процентов
 * Пополнения добавляются согласно выбранному периоду
 * 
 * @param {Object} params
 * @param {number} params.startCapital - Стартовый капитал
 * @param {number} params.years - Срок в годах
 * @param {number} params.annualRate - Годовая ставка в процентах
 * @param {number} params.contribution - Размер пополнения
 * @param {string} params.period - Период пополнений ('monthly', 'quarterly', 'annually')
 * @returns {Object} Результаты расчёта
 */
function calculateFutureValue(params) {
    const {
        startCapital,
        years,
        annualRate,
        contribution,
        period
    } = params;

    // 1. Перевод годовой ставки в месячную
    const monthlyRate = window.FinMath.annualToMonthlyRate(annualRate);
    
    // 2. Общее количество месяцев
    const totalMonths = years * 12;
    
    // 3. Шаг пополнений в месяцах
    const stepMonths = window.FinMath.periodToMonths(period);
    
    // 4. Помесячное моделирование
    let balance = startCapital;
    let totalContributions = 0;
    
    // Данные для графика (сохраняем ключевые точки)
    const yearlyData = [];
    yearlyData.push({
        month: 0,
        year: 0,
        balance: balance,
        totalContributions: 0,
        totalInterest: 0
    });

    for (let month = 1; month <= totalMonths; month++) {
        // Начисляем проценты на текущий остаток
        const interest = balance * monthlyRate;
        balance += interest;
        
        // Добавляем пополнение, если месяц подходящий
        if (month % stepMonths === 0) {
            balance += contribution;
            totalContributions += contribution;
        }
        
        balance = window.FinMath.round(balance);
        
        // Сохраняем данные каждый год (12-й, 24-й месяц и т.д.)
        if (month % 12 === 0) {
            const year = month / 12;
            yearlyData.push({
                month,
                year,
                balance: window.FinMath.round(balance, 2),
                totalContributions: window.FinMath.round(totalContributions, 2),
                totalInterest: window.FinMath.round(balance - startCapital - totalContributions, 2)
            });
        }
    }

    // 5. Итоговые расчёты
    const finalBalance = window.FinMath.round(balance, 2);
    const totalInterest = window.FinMath.round(finalBalance - startCapital - totalContributions, 2);

    return {
        finalBalance,
        startCapital,
        totalContributions: window.FinMath.round(totalContributions, 2),
        totalInterest,
        monthlyRate,
        annualRate,
        years,
        totalMonths,
        period,
        contribution,
        yearlyData // для графика — данные по годам
    };
}

window.FutureValue = { calculate: calculateFutureValue };