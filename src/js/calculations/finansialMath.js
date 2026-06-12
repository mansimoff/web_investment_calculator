// financialMath.js
// Общие финансовые формулы и утилиты

const FINANCIAL_PRECISION = 12;

/**
 * Перевод годовой ставки в месячную через сложный процент
 * Формула: r_monthly = (1 + r_annual)^(1/12) - 1
 * 
 * Это гарантирует, что (1 + r_monthly)^12 - 1 = r_annual
 * 
 * @param {number} annualRatePercent - Годовая ставка в процентах (например, 12)
 * @returns {number} Месячная ставка в десятичном виде (например, 0.00948879...)
 */
function annualToMonthlyRate(annualRatePercent) {
    const annualDecimal = annualRatePercent / 100;
    const monthlyRate = Math.pow(1 + annualDecimal, 1 / 12) - 1;
    return round(monthlyRate);
}

/**
 * Перевод месячной ставки обратно в годовую для проверки
 * Формула: r_annual = (1 + r_monthly)^12 - 1
 * 
 * @param {number} monthlyRateDecimal - Месячная ставка в десятичном виде
 * @returns {number} Годовая ставка в процентах
 */
function monthlyToAnnualRate(monthlyRateDecimal) {
    const annualDecimal = Math.pow(1 + monthlyRateDecimal, 12) - 1;
    return round(annualDecimal * 100);
}

/**
 * Будущая стоимость аннуитета (регулярных платежей)
 * Формула: FV_annuity = PMT * ((1 + r)^n - 1) / r
 * 
 * @param {number} payment - Размер регулярного платежа
 * @param {number} rate - Месячная ставка в десятичном виде
 * @param {number} periods - Количество периодов (месяцев)
 * @returns {number} Будущая стоимость всех платежей
 */
function futureValueAnnuity(payment, rate, periods) {
    if (rate === 0) return payment * periods;
    return payment * (Math.pow(1 + rate, periods) - 1) / rate;
}

/**
 * Будущая стоимость текущей суммы
 * Формула: FV = PV * (1 + r)^n
 * 
 * @param {number} presentValue - Текущая сумма
 * @param {number} rate - Месячная ставка в десятичном виде
 * @param {number} periods - Количество периодов (месяцев)
 * @returns {number} Будущая стоимость
 */
function futureValueLump(presentValue, rate, periods) {
    return presentValue * Math.pow(1 + rate, periods);
}

/**
 * Приведённая стоимость будущей суммы
 * Формула: PV = FV / (1 + r)^n
 * 
 * @param {number} futureValue - Будущая сумма
 * @param {number} rate - Месячная ставка в десятичном виде
 * @param {number} periods - Количество периодов
 * @returns {number} Текущая стоимость
 */
function presentValue(futureValue, rate, periods) {
    return futureValue / Math.pow(1 + rate, periods);
}

/**
 * Округление до заданной точности
 * @param {number} value 
 * @param {number} decimals 
 * @returns {number}
 */
function round(value, decimals = FINANCIAL_PRECISION) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Форматирование валюты (рубли)
 * @param {number} amount 
 * @returns {string}
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Форматирование процентов
 * @param {number} value 
 * @param {number} decimals 
 * @returns {string}
 */
function formatPercent(value, decimals = 2) {
    return value.toFixed(decimals) + '%';
}

/**
 * Форматирование числа с разделителями
 * @param {number} value 
 * @param {number} decimals 
 * @returns {string}
 */
function formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Перевод периода пополнений в количество месяцев
 * @param {string} period - 'monthly', 'quarterly', 'annually'
 * @returns {number} Количество месяцев между пополнениями
 */
function periodToMonths(period) {
    switch (period) {
        case 'monthly':  return 1;
        case 'quarterly': return 3;
        case 'annually': return 12;
        default: return 1;
    }
}

// Глобальный объект для доступа из других модулей
window.FinMath = {
    annualToMonthlyRate,
    monthlyToAnnualRate,
    futureValueAnnuity,
    futureValueLump,
    presentValue,
    round,
    formatCurrency,
    formatPercent,
    formatNumber,
    periodToMonths
};