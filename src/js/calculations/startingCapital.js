// startingCapital.js
// Расчёт необходимого стартового капитала

/**
 * Рассчитывает минимальный стартовый капитал для достижения цели
 * 
 * Формула: PV = (FV - PMT*((1+r)^n - 1)/r) / (1+r)^n
 * 
 * @param {Object} params
 * @param {number} params.targetAmount - Целевая сумма
 * @param {number} params.years - Срок в годах
 * @param {number} params.annualRate - Годовая ставка в процентах
 * @param {number} params.contribution - Размер пополнения
 * @param {string} params.period - Период пополнений
 * @returns {Object} { startCapital, finalBalance, totalContributions, totalInterest }
 */
function calculateStartingCapital(params) {
    const {
        targetAmount,
        years,
        annualRate,
        contribution,
        period
    } = params;

    const monthlyRate = window.FinMath.annualToMonthlyRate(annualRate);
    const totalMonths = years * 12;
    const stepMonths = window.FinMath.periodToMonths(period);
    
    // Будущая стоимость всех пополнений
    let fvContributions = 0;
    
    if (contribution > 0) {
        if (period === 'monthly') {
            fvContributions = window.FinMath.futureValueAnnuity(
                contribution, 
                monthlyRate, 
                totalMonths
            );
        } else {
            // Для непомесячных пополнений считаем каждое отдельно
            for (let month = stepMonths; month <= totalMonths; month += stepMonths) {
                const monthsRemaining = totalMonths - month;
                fvContributions += contribution * Math.pow(1 + monthlyRate, monthsRemaining);
            }
        }
    }
    
    // Если одних пополнений достаточно
    if (fvContributions >= targetAmount) {
        return {
            startCapital: 0,
            finalBalance: window.FinMath.round(fvContributions, 2),
            totalContributions: contribution * (totalMonths / stepMonths),
            totalInterest: window.FinMath.round(fvContributions - contribution * (totalMonths / stepMonths), 2)
        };
    }
    
    // Сколько нужно добавить стартовым капиталом
    const neededFromCapital = targetAmount - fvContributions;
    
    // Приведённая стоимость недостающей суммы
    const startCapital = window.FinMath.presentValue(neededFromCapital, monthlyRate, totalMonths);
    
    const roundedCapital = window.FinMath.round(startCapital, 2);
    
    // Проверка
    const verifyResult = window.FutureValue.calculate({
        startCapital: roundedCapital,
        years,
        annualRate,
        contribution,
        period
    });

    return {
        startCapital: roundedCapital,
        finalBalance: verifyResult.finalBalance,
        totalContributions: verifyResult.totalContributions,
        totalInterest: verifyResult.totalInterest
    };
}

window.StartingCapital = { calculate: calculateStartingCapital };