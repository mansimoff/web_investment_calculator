// contribution.js
// Расчёт необходимого размера регулярных пополнений

/**
 * Рассчитывает размер пополнения для достижения целевой суммы
 * 
 * Использует формулу аннуитета, решённую относительно PMT:
 * PMT = (FV - PV*(1+r)^n) * r / ((1+r)^n - 1)
 * 
 * Затем корректирует на период пополнений
 * 
 * @param {Object} params
 * @param {number} params.targetAmount - Целевая сумма
 * @param {number} params.startCapital - Стартовый капитал
 * @param {number} params.years - Срок в годах
 * @param {number} params.annualRate - Годовая ставка в процентах
 * @param {string} params.period - Период пополнений
 * @returns {Object} { contribution, finalBalance, totalContributions, totalInterest }
 */
function calculateContribution(params) {
    const {
        targetAmount,
        startCapital,
        years,
        annualRate,
        period
    } = params;

    const monthlyRate = window.FinMath.annualToMonthlyRate(annualRate);
    const totalMonths = years * 12;
    const stepMonths = window.FinMath.periodToMonths(period);
    
    // Будущая стоимость стартового капитала
    const fvStartCapital = window.FinMath.futureValueLump(startCapital, monthlyRate, totalMonths);
    
    // Если стартовый капитал уже превышает цель
    if (fvStartCapital >= targetAmount) {
        return {
            contribution: 0,
            period,
            finalBalance: window.FinMath.round(fvStartCapital, 2),
            totalContributions: 0,
            totalInterest: window.FinMath.round(fvStartCapital - startCapital, 2)
        };
    }
    
    // Недостающая сумма, которую нужно набрать пополнениями
    const neededFromContributions = targetAmount - fvStartCapital;
    
    // Будущая стоимость 1 рубля, вносимого каждые stepMonths месяцев
    // Сначала считаем для ежемесячного взноса в 1 рубль
    const fvOneRublesPerMonth = window.FinMath.futureValueAnnuity(1, monthlyRate, totalMonths);
    
    // Теперь считаем, сколько нужно вносить за один период пополнений
    // Если пополнения ежемесячные — ответ уже есть
    // Если раз в квартал — нужно в 3 раза больше, но реже
    let contribution;
    
    if (period === 'monthly') {
        contribution = neededFromContributions / fvOneRublesPerMonth;
    } else {
        // Для периода > 1 месяца нужно смоделировать
        // Создаём массив месяцев, когда будут пополнения
        let fvContributions = 0;
        
        for (let month = stepMonths; month <= totalMonths; month += stepMonths) {
            const monthsRemaining = totalMonths - month;
            fvContributions += Math.pow(1 + monthlyRate, monthsRemaining);
        }
        
        contribution = neededFromContributions / fvContributions;
    }
    
    contribution = window.FinMath.round(contribution, 2);
    
    // Проверка через полный расчёт
    const verifyResult = window.FutureValue.calculate({
        startCapital,
        years,
        annualRate,
        contribution,
        period
    });

    return {
        contribution,
        period,
        finalBalance: verifyResult.finalBalance,
        totalContributions: verifyResult.totalContributions,
        totalInterest: verifyResult.totalInterest
    };
}

window.Contribution = { calculate: calculateContribution };