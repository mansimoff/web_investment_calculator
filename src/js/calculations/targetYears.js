// targetYears.js
// Расчёт срока достижения финансовой цели

/**
 * Рассчитывает, сколько лет потребуется для достижения целевой суммы
 * 
 * Метод: помесячное моделирование до достижения цели
 * 
 * @param {Object} params
 * @param {number} params.targetAmount - Целевая сумма
 * @param {number} params.startCapital - Стартовый капитал
 * @param {number} params.annualRate - Годовая ставка в процентах
 * @param {number} params.contribution - Размер пополнения
 * @param {string} params.period - Период пополнений
 * @returns {Object} { years, months, finalBalance, totalContributions, totalInterest }
 */
function calculateTargetYears(params) {
    const {
        targetAmount,
        startCapital,
        annualRate,
        contribution,
        period
    } = params;

    // Если уже есть нужная сумма
    if (startCapital >= targetAmount) {
        return {
            years: 0,
            months: 0,
            totalMonths: 0,
            finalBalance: startCapital,
            totalContributions: 0,
            totalInterest: 0
        };
    }

    const monthlyRate = window.FinMath.annualToMonthlyRate(annualRate);
    const stepMonths = window.FinMath.periodToMonths(period);
    
    let balance = startCapital;
    let totalContributions = 0;
    let month = 0;
    const maxMonths = 1200; // 100 лет максимум
    
    while (balance < targetAmount && month < maxMonths) {
        month++;
        
        // Проценты
        balance += balance * monthlyRate;
        
        // Пополнение
        if (month % stepMonths === 0) {
            balance += contribution;
            totalContributions += contribution;
        }
        
        balance = window.FinMath.round(balance);
    }

    const years = Math.floor(month / 12);
    const remainingMonths = month % 12;
    const totalInterest = window.FinMath.round(balance - startCapital - totalContributions, 2);

    return {
        years,
        months: remainingMonths,
        totalMonths: month,
        finalBalance: window.FinMath.round(balance, 2),
        totalContributions: window.FinMath.round(totalContributions, 2),
        totalInterest
    };
}

window.TargetYears = { calculate: calculateTargetYears };