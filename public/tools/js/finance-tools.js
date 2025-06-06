// Theme toggle functionality
const themeToggle = document.getElementById("themeToggle");
const htmlElement = document.documentElement;

if (localStorage.getItem("theme") === "light") {
  htmlElement.classList.remove("dark");
  htmlElement.classList.add("light");
  themeToggle.checked = true;
}

themeToggle.addEventListener("change", function () {
  if (this.checked) {
    htmlElement.classList.remove("dark");
    htmlElement.classList.add("light");
    localStorage.setItem("theme", "light");
  } else {
    htmlElement.classList.remove("light");
    htmlElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
});

// Mobile menu functionality
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const navMenu = document.getElementById("navMenu");

mobileMenuBtn.addEventListener("click", function () {
  navMenu.classList.toggle("active");
  const icon = this.querySelector("i");
  if (navMenu.classList.contains("active")) {
    icon.classList.remove("fa-bars");
    icon.classList.add("fa-times");
  } else {
    icon.classList.remove("fa-times");
    icon.classList.add("fa-bars");
  }
});

// Finance calculator functions
function calculateLoan() {
  const amount = parseFloat(document.getElementById("loanAmount").value);
  const term = parseInt(document.getElementById("loanTerm").value);
  const rate = parseFloat(document.getElementById("interestRate").value);
  const paymentType = document.getElementById("paymentType").value;

  if (!amount || !term || !rate) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const monthlyRate = rate / 100 / 12;
  let totalPayment = 0;
  let totalInterest = 0;
  let payments = [];

  if (paymentType === "annuity") {
    // Ануїтетні платежі
    const monthlyPayment =
      (amount * (monthlyRate * Math.pow(1 + monthlyRate, term))) /
      (Math.pow(1 + monthlyRate, term) - 1);
    totalPayment = monthlyPayment * term;
    totalInterest = totalPayment - amount;

    for (let i = 1; i <= term; i++) {
      payments.push(monthlyPayment);
    }

    const resultDiv = document.getElementById("loanResult");
    resultDiv.innerHTML = `
                    <h4>Результати розрахунку кредиту:</h4>
                    <p><strong>Щомісячний платіж:</strong> ${monthlyPayment.toFixed(
                      2
                    )} грн</p>
                    <p><strong>Загальна сума виплат:</strong> ${totalPayment.toFixed(
                      2
                    )} грн</p>
                    <p><strong>Загальна сума відсотків:</strong> ${totalInterest.toFixed(
                      2
                    )} грн</p>
                    <p><strong>Переплата:</strong> ${(
                      (totalInterest / amount) *
                      100
                    ).toFixed(2)}%</p>
                `;
    resultDiv.style.display = "block";
  } else {
    // Диференційовані платежі
    const principal = amount / term;
    let remainingBalance = amount;
    let firstPayment = 0;
    let lastPayment = 0;

    for (let i = 1; i <= term; i++) {
      const interest = remainingBalance * monthlyRate;
      const payment = principal + interest;

      if (i === 1) firstPayment = payment;
      if (i === term) lastPayment = payment;

      totalPayment += payment;
      totalInterest += interest;
      remainingBalance -= principal;

      payments.push(payment);
    }

    const resultDiv = document.getElementById("loanResult");
    resultDiv.innerHTML = `
                    <h4>Результати розрахунку кредиту:</h4>
                    <p><strong>Перший платіж:</strong> ${firstPayment.toFixed(
                      2
                    )} грн</p>
                    <p><strong>Останній платіж:</strong> ${lastPayment.toFixed(
                      2
                    )} грн</p>
                    <p><strong>Загальна сума виплат:</strong> ${totalPayment.toFixed(
                      2
                    )} грн</p>
                    <p><strong>Загальна сума відсотків:</strong> ${totalInterest.toFixed(
                      2
                    )} грн</p>
                    <p><strong>Переплата:</strong> ${(
                      (totalInterest / amount) *
                      100
                    ).toFixed(2)}%</p>
                `;
    resultDiv.style.display = "block";
  }

  // Create chart
  const ctx = document.getElementById("loanChart").getContext("2d");

  // Destroy previous chart if exists
  if (window.loanChart) {
    window.loanChart.destroy();
  }

  window.loanChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Основна сума", "Відсотки"],
      datasets: [
        {
          data: [amount, totalInterest],
          backgroundColor: ["#3b82f6", "#ef4444"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function calculateInvestment() {
  const initialInvestment =
    parseFloat(document.getElementById("initialInvestment").value) || 0;
  const monthlyContribution =
    parseFloat(document.getElementById("monthlyContribution").value) || 0;
  const annualReturn = parseFloat(
    document.getElementById("annualReturn").value
  );
  const years = parseInt(document.getElementById("investmentYears").value);
  const compoundingFrequency = parseInt(
    document.getElementById("compoundingFrequency").value
  );

  if (!annualReturn || !years || !compoundingFrequency) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const periodicRate = annualReturn / 100 / compoundingFrequency;
  const totalPeriods = years * compoundingFrequency;

  // Розрахунок для початкової інвестиції
  const futureValueInitial =
    initialInvestment * Math.pow(1 + periodicRate, totalPeriods);

  // Розрахунок для регулярних внесків
  const periodsPerMonth = compoundingFrequency / 12;
  const futureValueContributions =
    monthlyContribution *
    ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate) *
    periodsPerMonth;

  const futureValue = futureValueInitial + futureValueContributions;
  const totalContributions =
    initialInvestment + monthlyContribution * years * 12;
  const totalInterest = futureValue - totalContributions;

  // Створення даних для графіка
  const yearlyData = [];
  let runningTotal = initialInvestment;
  let runningContributions = initialInvestment;

  for (let i = 0; i <= years; i++) {
    if (i === 0) {
      yearlyData.push({
        year: i,
        value: initialInvestment,
        contributions: initialInvestment,
        interest: 0,
      });
    } else {
      const prevValue = runningTotal;
      runningContributions += monthlyContribution * 12;

      // Розрахунок для поточного року
      const yearlyInitial =
        initialInvestment *
        Math.pow(1 + periodicRate, i * compoundingFrequency);
      const yearlyContributions =
        monthlyContribution *
        ((Math.pow(1 + periodicRate, i * compoundingFrequency) - 1) /
          periodicRate) *
        periodsPerMonth;
      runningTotal = yearlyInitial + yearlyContributions;

      yearlyData.push({
        year: i,
        value: runningTotal,
        contributions: runningContributions,
        interest: runningTotal - runningContributions,
      });
    }
  }

  const resultDiv = document.getElementById("investmentResult");
  resultDiv.innerHTML = `
                <h4>Результати інвестування:</h4>
                <p><strong>Майбутня вартість:</strong> ${futureValue.toFixed(
                  2
                )} грн</p>
                <p><strong>Загальні внески:</strong> ${totalContributions.toFixed(
                  2
                )} грн</p>
                <p><strong>Загальний прибуток:</strong> ${totalInterest.toFixed(
                  2
                )} грн</p>
                <p><strong>Дохідність інвестицій:</strong> ${(
                  (totalInterest / totalContributions) *
                  100
                ).toFixed(2)}%</p>
            `;
  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("investmentChart").getContext("2d");

  // Destroy previous chart if exists
  if (window.investmentChart) {
    window.investmentChart.destroy();
  }

  const years_labels = yearlyData.map((data) => `Рік ${data.year}`);
  const contributions_data = yearlyData.map((data) => data.contributions);
  const interest_data = yearlyData.map((data) => data.interest);

  window.investmentChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: years_labels,
      datasets: [
        {
          label: "Внески",
          data: contributions_data,
          backgroundColor: "#3b82f6",
          stack: "Stack 0",
        },
        {
          label: "Прибуток",
          data: interest_data,
          backgroundColor: "#10b981",
          stack: "Stack 0",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
        },
      },
    },
  });
}

function calculateRetirement() {
  const currentAge = parseInt(document.getElementById("currentAge").value);
  const retirementAge = parseInt(
    document.getElementById("retirementAge").value
  );
  const lifeExpectancy = parseInt(
    document.getElementById("lifeExpectancy").value
  );
  const currentSavings =
    parseFloat(document.getElementById("currentSavings").value) || 0;
  const desiredIncome = parseFloat(
    document.getElementById("desiredIncome").value
  );
  const inflationRate = parseFloat(
    document.getElementById("inflationRate").value
  );
  const returnRate = parseFloat(document.getElementById("returnRate").value);

  if (
    !currentAge ||
    !retirementAge ||
    !lifeExpectancy ||
    !desiredIncome ||
    inflationRate === "" ||
    !returnRate
  ) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  if (currentAge >= retirementAge) {
    alert("Поточний вік повинен бути менше віку виходу на пенсію");
    return;
  }

  if (retirementAge >= lifeExpectancy) {
    alert(
      "Вік виходу на пенсію повинен бути менше очікуваної тривалості життя"
    );
    return;
  }

  // Розрахунок кількості років до пенсії та на пенсії
  const yearsToRetirement = retirementAge - currentAge;
  const yearsInRetirement = lifeExpectancy - retirementAge;

  // Розрахунок майбутньої вартості бажаного доходу з урахуванням інфляції
  const futureMonthlyIncome =
    desiredIncome * Math.pow(1 + inflationRate / 100, yearsToRetirement);
  const futureAnnualIncome = futureMonthlyIncome * 12;

  // Розрахунок необхідного капіталу для забезпечення пенсії
  // Використовуємо формулу для розрахунку капіталу, який буде витрачатися протягом певного періоду
  const realReturnRate = (1 + returnRate / 100) / (1 + inflationRate / 100) - 1;
  const requiredCapital =
    (futureAnnualIncome *
      (1 - Math.pow(1 + realReturnRate, -yearsInRetirement))) /
    realReturnRate;

  // Розрахунок майбутньої вартості поточних накопичень
  const futureSavings =
    currentSavings * Math.pow(1 + returnRate / 100, yearsToRetirement);

  // Розрахунок додаткових необхідних накопичень
  const additionalCapitalNeeded = Math.max(0, requiredCapital - futureSavings);

  // Розрахунок необхідних щомісячних внесків
  const monthlyRate = returnRate / 100 / 12;
  const months = yearsToRetirement * 12;
  const requiredMonthlyContribution =
    additionalCapitalNeeded /
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  const resultDiv = document.getElementById("retirementResult");
  resultDiv.innerHTML = `
                <h4>Результати розрахунку пенсії:</h4>
                <p><strong>Років до пенсії:</strong> ${yearsToRetirement}</p>
                <p><strong>Очікуваних років на пенсії:</strong> ${yearsInRetirement}</p>
                <p><strong>Майбутній місячний дохід:</strong> ${futureMonthlyIncome.toFixed(
                  2
                )} грн</p>
                <p><strong>Необхідний капітал:</strong> ${requiredCapital.toFixed(
                  2
                )} грн</p>
                <p><strong>Майбутня вартість поточних накопичень:</strong> ${futureSavings.toFixed(
                  2
                )} грн</p>
                <p><strong>Додатково необхідно накопичити:</strong> ${additionalCapitalNeeded.toFixed(
                  2
                )} грн</p>
                <p><strong>Необхідний щомісячний внесок:</strong> ${requiredMonthlyContribution.toFixed(
                  2
                )} грн</p>
            `;
  resultDiv.style.display = "block";
}

function convertCurrency() {
  const amount = parseFloat(document.getElementById("currencyAmount").value);
  const fromCurrency = document.getElementById("fromCurrency").value;
  const toCurrency = document.getElementById("toCurrency").value;

  if (!amount) {
    alert("Будь ласка, введіть суму для конвертації");
    return;
  }

  // Курси валют відносно гривні (UAH) на 06.06.2025
  const rates = {
    UAH: 1,
    USD: 0.025, // 1 UAH = 0.025 USD (або 1 USD = 40 UAH)
    EUR: 0.023, // 1 UAH = 0.023 EUR (або 1 EUR = 43.5 UAH)
    GBP: 0.02, // 1 UAH = 0.02 GBP (або 1 GBP = 50 UAH)
    PLN: 0.1, // 1 UAH = 0.1 PLN (або 1 PLN = 10 UAH)
  };

  // Конвертація до UAH, а потім до цільової валюти
  const amountInUAH =
    fromCurrency === "UAH" ? amount : amount / rates[fromCurrency];
  const convertedAmount =
    toCurrency === "UAH" ? amountInUAH : amountInUAH * rates[toCurrency];

  // Отримання курсу обміну
  const exchangeRate =
    toCurrency === "UAH"
      ? 1 / rates[fromCurrency]
      : fromCurrency === "UAH"
      ? rates[toCurrency]
      : rates[toCurrency] / rates[fromCurrency];

  const resultDiv = document.getElementById("currencyResult");
  resultDiv.innerHTML = `
                <h4>Результат конвертації:</h4>
                <p><strong>${amount.toFixed(
                  2
                )} ${fromCurrency} = ${convertedAmount.toFixed(
    2
  )} ${toCurrency}</strong></p>
                <p><strong>Курс обміну:</strong> 1 ${fromCurrency} = ${exchangeRate.toFixed(
    4
  )} ${toCurrency}</p>
                <p><small>Курси валют станом на 06.06.2025</small></p>
            `;
  resultDiv.style.display = "block";
}

function calculateTax() {
  const taxType = document.getElementById("taxType").value;
  const income = parseFloat(document.getElementById("income").value);

  if (!taxType || !income) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  let taxAmount = 0;
  let esv = 0;
  let militaryTax = 0;
  let netIncome = 0;
  let taxRate = 0;
  let taxDetails = "";

  switch (taxType) {
    case "employee":
      // Найманий працівник: 18% ПДФО + 1.5% військовий збір
      const deductions =
        parseFloat(document.getElementById("deductions").value) || 0;
      const taxableIncome = Math.max(0, income - deductions);

      taxRate = 18;
      taxAmount = taxableIncome * 0.18;
      militaryTax = income * 0.015;
      netIncome = income - taxAmount - militaryTax;

      taxDetails = `
                        <p><strong>Оподатковуваний дохід:</strong> ${taxableIncome.toFixed(
                          2
                        )} грн</p>
                        <p><strong>ПДФО (18%):</strong> ${taxAmount.toFixed(
                          2
                        )} грн</p>
                        <p><strong>Військовий збір (1.5%):</strong> ${militaryTax.toFixed(
                          2
                        )} грн</p>
                    `;
      break;

    case "fop1":
      // ФОП 1 група: фіксований податок + ЄСВ
      const fixedTax1 = 248.1; // 10% від прожиткового мінімуму
      esv = 1474; // Мінімальний ЄСВ
      taxAmount = fixedTax1;
      netIncome = income - taxAmount - esv;

      taxDetails = `
                        <p><strong>Єдиний податок:</strong> ${fixedTax1.toFixed(
                          2
                        )} грн</p>
                        <p><strong>ЄСВ:</strong> ${esv.toFixed(2)} грн</p>
                    `;
      break;

    case "fop2":
      // ФОП 2 група: фіксований податок + ЄСВ
      const fixedTax2 = 1240.5; // 20% від мінімальної зарплати
      esv = 1474; // Мінімальний ЄСВ
      taxAmount = fixedTax2;
      netIncome = income - taxAmount - esv;

      taxDetails = `
                        <p><strong>Єдиний податок:</strong> ${fixedTax2.toFixed(
                          2
                        )} грн</p>
                        <p><strong>ЄСВ:</strong> ${esv.toFixed(2)} грн</p>
                    `;
      break;

    case "fop3":
      // ФОП 3 група: 5% від доходу + ЄСВ
      const expenses =
        parseFloat(document.getElementById("expenses").value) || 0;
      taxRate = 5;
      taxAmount = income * 0.05;
      esv = 1474; // Мінімальний ЄСВ
      netIncome = income - taxAmount - esv - expenses;

      taxDetails = `
                        <p><strong>Дохід:</strong> ${income.toFixed(2)} грн</p>
                        <p><strong>Витрати:</strong> ${expenses.toFixed(
                          2
                        )} грн</p>
                        <p><strong>Єдиний податок (5%):</strong> ${taxAmount.toFixed(
                          2
                        )} грн</p>
                        <p><strong>ЄСВ:</strong> ${esv.toFixed(2)} грн</p>
                    `;
      break;
  }

  const totalTax = taxAmount + esv + militaryTax;
  const effectiveTaxRate = (totalTax / income) * 100;

  const resultDiv = document.getElementById("taxResult");
  resultDiv.innerHTML = `
                <h4>Результати розрахунку податків:</h4>
                ${taxDetails}
                <p><strong>Загальна сума податків:</strong> ${totalTax.toFixed(
                  2
                )} грн</p>
                <p><strong>Чистий дохід:</strong> ${netIncome.toFixed(
                  2
                )} грн</p>
                <p><strong>Ефективна ставка податку:</strong> ${effectiveTaxRate.toFixed(
                  2
                )}%</p>
            `;
  resultDiv.style.display = "block";
}

// Show/hide tax fields based on selection
document.getElementById("taxType").addEventListener("change", function () {
  const taxType = this.value;
  const employeeFields = document.getElementById("employeeFields");
  const fopFields = document.getElementById("fopFields");

  employeeFields.style.display = taxType === "employee" ? "block" : "none";
  fopFields.style.display = taxType === "fop3" ? "block" : "none";
});

// Budget calculator
let expenses = [];

function addExpense() {
  const name = document.getElementById("expenseName").value;
  const amount = parseFloat(document.getElementById("expenseAmount").value);

  if (!name || !amount) {
    alert("Будь ласка, введіть назву та суму витрати");
    return;
  }

  expenses.push({ name, amount });

  // Clear inputs
  document.getElementById("expenseName").value = "";
  document.getElementById("expenseAmount").value = "";

  // Update expenses list
  updateExpensesList();
}

function updateExpensesList() {
  const expensesList = document.getElementById("expensesList");
  expensesList.innerHTML = "";

  expenses.forEach((expense, index) => {
    const item = document.createElement("div");
    item.className = "budget-item";
    item.innerHTML = `
                    <span class="budget-item-name">${expense.name}</span>
                    <span class="budget-item-amount">${expense.amount.toFixed(
                      2
                    )} грн</span>
                    <button class="budget-item-delete" onclick="removeExpense(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
    expensesList.appendChild(item);
  });
}

function removeExpense(index) {
  expenses.splice(index, 1);
  updateExpensesList();
}

function calculateBudget() {
  const totalIncome = parseFloat(document.getElementById("totalIncome").value);

  if (!totalIncome) {
    alert("Будь ласка, введіть загальний дохід");
    return;
  }

  if (expenses.length === 0) {
    alert("Будь ласка, додайте хоча б одну витрату");
    return;
  }

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const balance = totalIncome - totalExpenses;
  const savingsRate = (balance / totalIncome) * 100;

  // Group expenses by category for chart
  const categories = {};
  expenses.forEach((expense) => {
    if (!categories[expense.name]) {
      categories[expense.name] = 0;
    }
    categories[expense.name] += expense.amount;
  });

  const resultDiv = document.getElementById("budgetResult");
  resultDiv.innerHTML = `
                <h4>Аналіз бюджету:</h4>
                <p><strong>Загальний дохід:</strong> ${totalIncome.toFixed(
                  2
                )} грн</p>
                <p><strong>Загальні витрати:</strong> ${totalExpenses.toFixed(
                  2
                )} грн</p>
                <p><strong>Баланс:</strong> ${balance.toFixed(2)} грн</p>
                <p><strong>Норма заощаджень:</strong> ${savingsRate.toFixed(
                  2
                )}%</p>
                ${
                  balance < 0
                    ? '<p style="color: var(--danger-color);">⚠️ Витрати перевищують доходи!</p>'
                    : ""
                }
                ${
                  savingsRate < 10 && balance >= 0
                    ? '<p style="color: var(--warning-color);">⚠️ Рекомендується збільшити норму заощаджень до 10-20%</p>'
                    : ""
                }
                ${
                  savingsRate >= 20
                    ? '<p style="color: var(--success-color);">✅ Відмінна норма заощаджень!</p>'
                    : ""
                }
            `;
  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("budgetChart").getContext("2d");

  // Destroy previous chart if exists
  if (window.budgetChart) {
    window.budgetChart.destroy();
  }

  const categoryNames = Object.keys(categories);
  const categoryValues = Object.values(categories);

  window.budgetChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categoryNames,
      datasets: [
        {
          data: categoryValues,
          backgroundColor: [
            "#3b82f6",
            "#ef4444",
            "#10b981",
            "#f59e0b",
            "#8b5cf6",
            "#06b6d4",
            "#ec4899",
            "#14b8a6",
            "#f97316",
            "#6366f1",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}
