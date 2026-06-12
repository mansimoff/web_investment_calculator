// interestRate.js
// Расчёт необходимой процентной ставки для достижения цели

/**
 * Находит необходимую годовую ставку методом бинарного поиска
 * 
 * Алгоритм: перебираем ставки от 0% до 100%, 
 * для каждой считаем конечную сумму, пока не достигнем цели
 * 
 * @param {Object} params
 * @param {number} params.targetAmount - Желаемая итоговая сумма
 * @param {number} params.startCapital - Стартовый капитал
 * @param {number} params.years - Срок в годах
 * @param {number} params.contribution - Размер пополнения
 * @param {string} params.period - Период пополнений
 * @returns {Object} { annualRate, finalBalance, exactMatch }
 */
function calculateRequiredRate(params) {
    const {
        targetAmount,
        startCapital,
        years,
        contribution,
        period
    } = params;

    // Проверка: можно ли достичь цели вообще без процентов
    const totalPossibleContributions = years * 12 / window.FinMath.periodToMonths(period) * contribution;
    const maxWithoutInterest = startCapital + totalPossibleContributions;
    
    if (targetAmount <= maxWithoutInterest) {
        return {
            annualRate: 0,
            finalBalance: maxWithoutInterest,
            exactMatch: targetAmount <= maxWithoutInterest
        };
    }

    // Бинарный поиск ставки
    let low = 0;
    let high = 100; // Максимум 100% годовых
    let bestRate = 0;
    let bestBalance = 0;
    
    for (let i = 0; i < 100; i++) {
        const mid = (low + high) / 2;
        
        const result = window.FutureValue.calculate({
            startCapital,
            years,
            annualRate: mid,
            contribution,
            period
        });
        
        if (Math.abs(result.finalBalance - targetAmount) < 0.01) {
            // Нашли точное совпадение
            return {
                annualRate: window.FinMath.round(mid, 2),
                finalBalance: result.finalBalance,
                exactMatch: true
            };
        }
        
        if (result.finalBalance < targetAmount) {
            low = mid;
        } else {
            high = mid;
            bestRate = mid;
            bestBalance = result.finalBalance;
        }
    }

    return {
        annualRate: window.FinMath.round(bestRate, 2),
        finalBalance: bestBalance,
        exactMatch: false
    };
}

window.InterestRate = { calculate: calculateRequiredRate };