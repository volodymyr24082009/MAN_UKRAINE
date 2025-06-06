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

// Energy calculator functions
function calculateSolar() {
  const monthlyConsumption = parseFloat(
    document.getElementById("monthlyConsumption").value
  );
  const roofArea = parseFloat(document.getElementById("roofArea").value);
  const sunHours = parseInt(document.getElementById("region").value);
  const panelPower = parseInt(document.getElementById("panelType").value);

  if (!monthlyConsumption || !roofArea || !sunHours || !panelPower) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const yearlyConsumption = monthlyConsumption * 12;
  const requiredPower = (yearlyConsumption * 1000) / sunHours; // Вт
  const panelsNeeded = Math.ceil(requiredPower / panelPower);
  const systemPower = (panelsNeeded * panelPower) / 1000; // кВт
  const panelArea = 2; // м² на панель
  const totalArea = panelsNeeded * panelArea;
  const yearlyGeneration = systemPower * sunHours;
  const estimatedCost = systemPower * 25000; // 25000 грн/кВт

  const resultDiv = document.getElementById("solarResult");
  resultDiv.innerHTML = `
                <h4>Розрахунок сонячної системи:</h4>
                <p><strong>Необхідна потужність:</strong> ${systemPower.toFixed(
                  1
                )} кВт</p>
                <p><strong>Кількість панелей:</strong> ${panelsNeeded} шт</p>
                <p><strong>Площа панелей:</strong> ${totalArea} м²</p>
                <p><strong>Річна генерація:</strong> ${Math.round(
                  yearlyGeneration
                )} кВт·год</p>
                <p><strong>Орієнтовна вартість:</strong> ${Math.round(
                  estimatedCost
                ).toLocaleString()} грн</p>
                ${
                  totalArea > roofArea
                    ? '<p style="color: var(--warning-color);">⚠️ Недостатньо площі даху!</p>'
                    : ""
                }
            `;
  resultDiv.style.display = "block";
}

function calculateConsumption() {
  const appliance = parseInt(document.getElementById("appliance").value);
  const customPower = parseFloat(document.getElementById("customPower").value);
  const hoursPerDay = parseFloat(document.getElementById("hoursPerDay").value);
  const daysPerMonth = parseInt(document.getElementById("daysPerMonth").value);
  const tariff = parseFloat(document.getElementById("tariff").value);

  const power = customPower || appliance;

  if (!power || !hoursPerDay || !daysPerMonth || !tariff) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const dailyConsumption = (power * hoursPerDay) / 1000; // кВт·год
  const monthlyConsumption = dailyConsumption * daysPerMonth;
  const yearlyConsumption = monthlyConsumption * 12;
  const monthlyCost = monthlyConsumption * tariff;
  const yearlyCost = yearlyConsumption * tariff;

  const resultDiv = document.getElementById("consumptionResult");
  resultDiv.innerHTML = `
                <h4>Споживання електроенергії:</h4>
                <p><strong>Потужність приладу:</strong> ${power} Вт</p>
                <p><strong>Добове споживання:</strong> ${dailyConsumption.toFixed(
                  2
                )} кВт·год</p>
                <p><strong>Місячне споживання:</strong> ${monthlyConsumption.toFixed(
                  2
                )} кВт·год</p>
                <p><strong>Річне споживання:</strong> ${yearlyConsumption.toFixed(
                  2
                )} кВт·год</p>
                <p><strong>Місячна вартість:</strong> ${monthlyCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Річна вартість:</strong> ${yearlyCost.toFixed(
                  2
                )} грн</p>
            `;
  resultDiv.style.display = "block";
}

function calculateWind() {
  const windSpeed = parseFloat(document.getElementById("windSpeed").value);
  const turbinePower = parseFloat(
    document.getElementById("turbinePower").value
  );
  const hubHeight = parseFloat(document.getElementById("hubHeight").value);
  const efficiency = parseFloat(document.getElementById("efficiency").value);

  if (!windSpeed || !turbinePower || !hubHeight || !efficiency) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  // Корекція швидкості вітру на висоту
  const correctedWindSpeed = windSpeed * Math.pow(hubHeight / 10, 0.14);

  // Потужність вітру (спрощена формула)
  const airDensity = 1.225; // кг/м³
  const rotorArea = Math.PI * Math.pow(turbinePower * 10, 2); // приблизна площа ротора
  const windPower =
    (0.5 * airDensity * rotorArea * Math.pow(correctedWindSpeed, 3)) / 1000; // кВт

  const actualPower = Math.min(windPower * (efficiency / 100), turbinePower);
  const capacityFactor = actualPower / turbinePower;
  const yearlyGeneration = actualPower * 8760; // год/рік
  const estimatedCost = turbinePower * 35000; // 35000 грн/кВт

  const resultDiv = document.getElementById("windResult");
  resultDiv.innerHTML = `
                <h4>Розрахунок вітрової енергії:</h4>
                <p><strong>Скоригована швидкість вітру:</strong> ${correctedWindSpeed.toFixed(
                  1
                )} м/с</p>
                <p><strong>Фактична потужність:</strong> ${actualPower.toFixed(
                  1
                )} кВт</p>
                <p><strong>Коефіцієнт використання:</strong> ${(
                  capacityFactor * 100
                ).toFixed(1)}%</p>
                <p><strong>Річна генерація:</strong> ${Math.round(
                  yearlyGeneration
                )} кВт·год</p>
                <p><strong>Орієнтовна вартість:</strong> ${Math.round(
                  estimatedCost
                ).toLocaleString()} грн</p>
                ${
                  windSpeed < 4
                    ? '<p style="color: var(--warning-color);">⚠️ Низька швидкість вітру для ефективної роботи</p>'
                    : ""
                }
            `;
  resultDiv.style.display = "block";
}

function calculateEfficiency() {
  const currentConsumption = parseFloat(
    document.getElementById("currentConsumption").value
  );
  const efficiencyPercent = parseFloat(
    document.getElementById("efficiencyMeasure").value
  );
  const investmentCost = parseFloat(
    document.getElementById("investmentCost").value
  );
  const energyPrice = parseFloat(document.getElementById("energyPrice").value);

  if (
    !currentConsumption ||
    !efficiencyPercent ||
    !investmentCost ||
    !energyPrice
  ) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const monthlySavings = currentConsumption * (efficiencyPercent / 100);
  const yearlySavings = monthlySavings * 12;
  const monthlyCostSavings = monthlySavings * energyPrice;
  const yearlyCostSavings = yearlySavings * energyPrice;
  const paybackPeriod = investmentCost / yearlyCostSavings;
  const co2Reduction = yearlySavings * 0.5; // кг CO₂/кВт·год

  const resultDiv = document.getElementById("efficiencyResult");
  resultDiv.innerHTML = `
                <h4>Аналіз енергоефективності:</h4>
                <p><strong>Економія енергії:</strong> ${monthlySavings.toFixed(
                  1
                )} кВт·год/місяць</p>
                <p><strong>Річна економія енергії:</strong> ${yearlySavings.toFixed(
                  1
                )} кВт·год</p>
                <p><strong>Місячна економія коштів:</strong> ${monthlyCostSavings.toFixed(
                  2
                )} грн</p>
                <p><strong>Річна економія коштів:</strong> ${yearlyCostSavings.toFixed(
                  2
                )} грн</p>
                <p><strong>Період окупності:</strong> ${paybackPeriod.toFixed(
                  1
                )} років</p>
                <p><strong>Зменшення викидів CO₂:</strong> ${co2Reduction.toFixed(
                  1
                )} кг/рік</p>
            `;
  resultDiv.style.display = "block";
}

function calculateBattery() {
  const dailyConsumption = parseFloat(
    document.getElementById("dailyConsumption").value
  );
  const autonomyDays = parseInt(document.getElementById("autonomyDays").value);
  const dod = parseFloat(document.getElementById("batteryType").value);
  const systemVoltage = parseFloat(
    document.getElementById("systemVoltage").value
  );

  if (!dailyConsumption || !autonomyDays || !dod || !systemVoltage) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const totalEnergyNeeded = dailyConsumption * autonomyDays; // кВт·год
  const batteryCapacityKwh = totalEnergyNeeded / dod;
  const batteryCapacityAh = (batteryCapacityKwh * 1000) / systemVoltage;
  const estimatedCost = batteryCapacityKwh * 15000; // 15000 грн/кВт·год

  const resultDiv = document.getElementById("batteryResult");
  resultDiv.innerHTML = `
                <h4>Розрахунок накопичувачів:</h4>
                <p><strong>Необхідна енергія:</strong> ${totalEnergyNeeded.toFixed(
                  1
                )} кВт·год</p>
                <p><strong>Ємність батарей:</strong> ${batteryCapacityKwh.toFixed(
                  1
                )} кВт·год</p>
                <p><strong>Ємність в А·год:</strong> ${batteryCapacityAh.toFixed(
                  0
                )} А·год при ${systemVoltage}В</p>
                <p><strong>Орієнтовна вартість:</strong> ${Math.round(
                  estimatedCost
                ).toLocaleString()} грн</p>
                <p><strong>Глибина розряду:</strong> ${(dod * 100).toFixed(
                  0
                )}%</p>
            `;
  resultDiv.style.display = "block";
}

function calculateCarbon() {
  const electricity =
    parseFloat(document.getElementById("electricityUsage").value) || 0;
  const gas = parseFloat(document.getElementById("gasUsage").value) || 0;
  const coal = parseFloat(document.getElementById("coalUsage").value) || 0;
  const fuel = parseFloat(document.getElementById("fuelUsage").value) || 0;
  const emissionFactor = parseFloat(
    document.getElementById("energySource").value
  );

  if (!emissionFactor) {
    alert("Будь ласка, оберіть джерело електроенергії");
    return;
  }

  // Коефіцієнти викидів CO₂
  const electricityEmissions = electricity * emissionFactor;
  const gasEmissions = gas * 2.0; // кг CO₂/м³
  const coalEmissions = coal * 2.4; // кг CO₂/кг
  const fuelEmissions = fuel * 2.3; // кг CO₂/л

  const totalEmissions =
    electricityEmissions + gasEmissions + coalEmissions + fuelEmissions;
  const treesNeeded = Math.ceil(totalEmissions / 22); // дерево поглинає ~22 кг CO₂/рік

  const resultDiv = document.getElementById("carbonResult");
  resultDiv.innerHTML = `
                <h4>Вуглецевий слід:</h4>
                <p><strong>Викиди від електроенергії:</strong> ${electricityEmissions.toFixed(
                  1
                )} кг CO₂/рік</p>
                <p><strong>Викиди від газу:</strong> ${gasEmissions.toFixed(
                  1
                )} кг CO₂/рік</p>
                <p><strong>Викиди від вугілля:</strong> ${coalEmissions.toFixed(
                  1
                )} кг CO₂/рік</p>
                <p><strong>Викиди від палива:</strong> ${fuelEmissions.toFixed(
                  1
                )} кг CO₂/рік</p>
                <p><strong>Загальні викиди:</strong> ${totalEmissions.toFixed(
                  1
                )} кг CO₂/рік</p>
                <p><strong>Еквівалент у тоннах:</strong> ${(
                  totalEmissions / 1000
                ).toFixed(2)} т CO₂/рік</p>
                <p><strong>Дерев для компенсації:</strong> ${treesNeeded} шт</p>
            `;
  resultDiv.style.display = "block";
}
