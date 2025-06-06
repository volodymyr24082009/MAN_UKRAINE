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

// Agriculture calculator functions
function calculateYield() {
  const cropType = document.getElementById("cropType").value;
  const area = parseFloat(document.getElementById("fieldArea").value);
  const price = parseFloat(document.getElementById("cropPrice").value);
  const soilQuality = parseFloat(document.getElementById("soilQuality").value);

  if (!cropType || !area || !price || !soilQuality) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const baseYields = {
    wheat: 45,
    corn: 80,
    sunflower: 25,
    soybean: 22,
    barley: 40,
    rapeseed: 30,
  };

  const baseYield = baseYields[cropType];
  const actualYield = baseYield * soilQuality;
  const totalYield = (actualYield * area) / 10; // тонн
  const revenue = totalYield * price;

  const resultDiv = document.getElementById("yieldResult");
  resultDiv.innerHTML = `
                <h4>Прогноз врожайності:</h4>
                <p><strong>Базова врожайність:</strong> ${baseYield} ц/га</p>
                <p><strong>Очікувана врожайність:</strong> ${actualYield.toFixed(
                  1
                )} ц/га</p>
                <p><strong>Загальний урожай:</strong> ${totalYield.toFixed(
                  1
                )} тонн</p>
                <p><strong>Очікуваний дохід:</strong> ${Math.round(
                  revenue
                ).toLocaleString()} грн</p>
                <p><strong>Дохід з гектара:</strong> ${Math.round(
                  revenue / area
                ).toLocaleString()} грн/га</p>
            `;
  resultDiv.style.display = "block";
}

function calculateFertilizer() {
  const crop = document.getElementById("fertilizerCrop").value;
  const area = parseFloat(document.getElementById("fertilizerArea").value);
  const soilN = parseFloat(document.getElementById("soilN").value);
  const soilP = parseFloat(document.getElementById("soilP").value);
  const soilK = parseFloat(document.getElementById("soilK").value);
  const targetYield = parseFloat(document.getElementById("targetYield").value);

  if (
    !crop ||
    !area ||
    soilN === "" ||
    soilP === "" ||
    soilK === "" ||
    !targetYield
  ) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  // Норми виносу NPK на 1 ц продукції (кг)
  const nutrientRemoval = {
    wheat: { N: 3.5, P: 1.2, K: 2.5 },
    corn: { N: 2.8, P: 1.0, K: 2.8 },
    sunflower: { N: 6.0, P: 2.6, K: 18.0 },
    soybean: { N: 6.5, P: 1.5, K: 2.0 },
    potato: { N: 0.5, P: 0.2, K: 0.8 },
  };

  const removal = nutrientRemoval[crop];
  const totalRemoval = {
    N: removal.N * targetYield,
    P: removal.P * targetYield,
    K: removal.K * targetYield,
  };

  // Коефіцієнти використання з ґрунту
  const soilCoeff = { N: 0.6, P: 0.15, K: 0.2 };

  const soilSupply = {
    N: soilN * soilCoeff.N * 0.001, // кг/га
    P: soilP * soilCoeff.P * 0.001,
    K: soilK * soilCoeff.K * 0.001,
  };

  const fertilizerNeed = {
    N: Math.max(0, totalRemoval.N - soilSupply.N),
    P: Math.max(0, totalRemoval.P - soilSupply.P),
    K: Math.max(0, totalRemoval.K - soilSupply.K),
  };

  const totalFertilizer = {
    N: fertilizerNeed.N * area,
    P: fertilizerNeed.P * area,
    K: fertilizerNeed.K * area,
  };

  const resultDiv = document.getElementById("fertilizerResult");
  resultDiv.innerHTML = `
                <h4>Потреба в добривах:</h4>
                <p><strong>Азот (N):</strong> ${Math.round(
                  totalFertilizer.N
                )} кг (${fertilizerNeed.N.toFixed(1)} кг/га)</p>
                <p><strong>Фосфор (P₂O₅):</strong> ${Math.round(
                  totalFertilizer.P
                )} кг (${fertilizerNeed.P.toFixed(1)} кг/га)</p>
                <p><strong>Калій (K₂O):</strong> ${Math.round(
                  totalFertilizer.K
                )} кг (${fertilizerNeed.K.toFixed(1)} кг/га)</p>
                <h4>Рекомендації:</h4>
                <p><strong>Аміачна селітра (34% N):</strong> ${Math.round(
                  totalFertilizer.N / 0.34
                )} кг</p>
                <p><strong>Суперфосфат (19% P₂O₅):</strong> ${Math.round(
                  totalFertilizer.P / 0.19
                )} кг</p>
                <p><strong>Хлорид калію (60% K₂O):</strong> ${Math.round(
                  totalFertilizer.K / 0.6
                )} кг</p>
            `;
  resultDiv.style.display = "block";
}

function calculateIrrigation() {
  const cropWaterNeed = parseInt(
    document.getElementById("irrigationCrop").value
  );
  const area = parseFloat(document.getElementById("irrigationArea").value);
  const rainfall = parseFloat(document.getElementById("rainfall").value);
  const efficiency = parseFloat(
    document.getElementById("irrigationSystem").value
  );
  const waterCost = parseFloat(document.getElementById("waterCost").value);

  if (!cropWaterNeed || !area || rainfall === "" || !efficiency || !waterCost) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const irrigationNeed = Math.max(0, cropWaterNeed - rainfall); // мм
  const waterVolume = (irrigationNeed / efficiency) * area * 10; // м³
  const totalCost = waterVolume * waterCost;

  const resultDiv = document.getElementById("irrigationResult");
  resultDiv.innerHTML = `
                <h4>Потреби в зрошенні:</h4>
                <p><strong>Потреба культури:</strong> ${cropWaterNeed} мм/сезон</p>
                <p><strong>Опади:</strong> ${rainfall} мм/сезон</p>
                <p><strong>Дефіцит вологи:</strong> ${irrigationNeed} мм</p>
                <p><strong>Об'єм води для зрошення:</strong> ${Math.round(
                  waterVolume
                )} м³</p>
                <p><strong>Норма поливу:</strong> ${Math.round(
                  waterVolume / area
                )} м³/га</p>
                <p><strong>Вартість зрошення:</strong> ${Math.round(
                  totalCost
                ).toLocaleString()} грн</p>
                <p><strong>Вартість на гектар:</strong> ${Math.round(
                  totalCost / area
                ).toLocaleString()} грн/га</p>
            `;
  resultDiv.style.display = "block";
}

function calculateFeed() {
  const animalType = document.getElementById("animalType").value;
  const count = parseInt(document.getElementById("animalCount").value);
  const period = parseInt(document.getElementById("feedPeriod").value);
  const hayPrice = parseFloat(document.getElementById("hayPrice").value);
  const grainPrice = parseFloat(document.getElementById("grainPrice").value);

  if (!animalType || !count || !period || !hayPrice || !grainPrice) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const dailyFeed = {
    dairy_cow: { total: 25, hay: 15, grain: 10 },
    beef_cattle: { total: 15, hay: 12, grain: 3 },
    pig: { total: 3, hay: 0, grain: 3 },
    sheep: { total: 2, hay: 1.5, grain: 0.5 },
    chicken: { total: 0.12, hay: 0, grain: 0.12 },
  };

  const feed = dailyFeed[animalType];
  const totalHay = feed.hay * count * period;
  const totalGrain = feed.grain * count * period;
  const hayCost = totalHay * hayPrice;
  const grainCost = totalGrain * grainPrice;
  const totalCost = hayCost + grainCost;

  const resultDiv = document.getElementById("feedResult");
  resultDiv.innerHTML = `
                <h4>Потреба в кормах:</h4>
                <p><strong>Сіно/грубі корми:</strong> ${Math.round(
                  totalHay
                )} кг</p>
                <p><strong>Зерно/концентрати:</strong> ${Math.round(
                  totalGrain
                )} кг</p>
                <p><strong>Загальна кількість:</strong> ${Math.round(
                  totalHay + totalGrain
                )} кг</p>
                <h4>Вартість кормів:</h4>
                <p><strong>Сіно:</strong> ${Math.round(
                  hayCost
                ).toLocaleString()} грн</p>
                <p><strong>Зерно:</strong> ${Math.round(
                  grainCost
                ).toLocaleString()} грн</p>
                <p><strong>Загальна вартість:</strong> ${Math.round(
                  totalCost
                ).toLocaleString()} грн</p>
                <p><strong>Вартість на голову:</strong> ${Math.round(
                  totalCost / count
                ).toLocaleString()} грн</p>
            `;
  resultDiv.style.display = "block";
}

function calculateProfit() {
  const revenue = parseFloat(document.getElementById("revenue").value) || 0;
  const seedCost = parseFloat(document.getElementById("seedCost").value) || 0;
  const fertilizerCost =
    parseFloat(document.getElementById("fertilizerCost").value) || 0;
  const fuelCost = parseFloat(document.getElementById("fuelCost").value) || 0;
  const laborCost = parseFloat(document.getElementById("laborCost").value) || 0;
  const equipmentCost =
    parseFloat(document.getElementById("equipmentCost").value) || 0;
  const otherCosts =
    parseFloat(document.getElementById("otherCosts").value) || 0;

  if (!revenue) {
    alert("Будь ласка, введіть валовий дохід");
    return;
  }

  const totalCosts =
    seedCost +
    fertilizerCost +
    fuelCost +
    laborCost +
    equipmentCost +
    otherCosts;
  const profit = revenue - totalCosts;
  const profitMargin = (profit / revenue) * 100;
  const roi = (profit / totalCosts) * 100;

  const resultDiv = document.getElementById("profitResult");
  resultDiv.innerHTML = `
                <h4>Аналіз прибутковості:</h4>
                <p><strong>Валовий дохід:</strong> ${Math.round(
                  revenue
                ).toLocaleString()} грн</p>
                <p><strong>Загальні витрати:</strong> ${Math.round(
                  totalCosts
                ).toLocaleString()} грн</p>
                <p><strong>Чистий прибуток:</strong> ${Math.round(
                  profit
                ).toLocaleString()} грн</p>
                <p><strong>Рентабельність:</strong> ${profitMargin.toFixed(
                  1
                )}%</p>
                <p><strong>ROI:</strong> ${roi.toFixed(1)}%</p>
                <h4>Структура витрат:</h4>
                <p><strong>Насіння:</strong> ${(
                  (seedCost / totalCosts) *
                  100
                ).toFixed(1)}%</p>
                <p><strong>Добрива:</strong> ${(
                  (fertilizerCost / totalCosts) *
                  100
                ).toFixed(1)}%</p>
                <p><strong>Паливо:</strong> ${(
                  (fuelCost / totalCosts) *
                  100
                ).toFixed(1)}%</p>
                <p><strong>Зарплата:</strong> ${(
                  (laborCost / totalCosts) *
                  100
                ).toFixed(1)}%</p>
            `;
  resultDiv.style.display = "block";
}

function generatePlantingCalendar() {
  const crop = document.getElementById("calendarCrop").value;
  const region = document.getElementById("region").value;
  const year = parseInt(document.getElementById("currentYear").value);

  if (!crop || !region || !year) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const plantingDates = {
    winter_wheat: {
      north: { plant: "Вересень 15-30", harvest: "Липень 15-31" },
      central: {
        plant: "Вересень 20 - Жовтень 5",
        harvest: "Липень 20 - Серпень 5",
      },
      south: { plant: "Жовтень 1-15", harvest: "Червень 25 - Липень 15" },
      west: { plant: "Вересень 10-25", harvest: "Липень 10-25" },
    },
    spring_wheat: {
      north: {
        plant: "Квітень 20 - Травень 5",
        harvest: "Серпень 15-31",
      },
      central: { plant: "Квітень 15-30", harvest: "Серпень 10-25" },
      south: { plant: "Квітень 1-15", harvest: "Серпень 1-15" },
      west: {
        plant: "Квітень 25 - Травень 10",
        harvest: "Серпень 20 - Вересень 5",
      },
    },
    corn: {
      north: {
        plant: "Травень 10-25",
        harvest: "Вересень 20 - Жовтень 10",
      },
      central: { plant: "Травень 1-15", harvest: "Вересень 15-30" },
      south: {
        plant: "Квітень 20 - Травень 5",
        harvest: "Вересень 1-20",
      },
      west: { plant: "Травень 15-30", harvest: "Жовтень 1-15" },
    },
    sunflower: {
      north: { plant: "Травень 15-30", harvest: "Вересень 15-30" },
      central: { plant: "Травень 5-20", harvest: "Вересень 10-25" },
      south: {
        plant: "Квітень 25 - Травень 10",
        harvest: "Вересень 1-15",
      },
      west: {
        plant: "Травень 20 - Червень 5",
        harvest: "Вересень 20 - Жовтень 5",
      },
    },
    soybean: {
      north: {
        plant: "Травень 20 - Червень 5",
        harvest: "Вересень 25 - Жовтень 10",
      },
      central: {
        plant: "Травень 15-30",
        harvest: "Вересень 20 - Жовтень 5",
      },
      south: { plant: "Травень 10-25", harvest: "Вересень 15-30" },
      west: { plant: "Травень 25 - Червень 10", harvest: "Жовтень 1-15" },
    },
    sugar_beet: {
      north: {
        plant: "Квітень 25 - Травень 10",
        harvest: "Жовтень 1-20",
      },
      central: {
        plant: "Квітень 20 - Травень 5",
        harvest: "Вересень 25 - Жовтень 15",
      },
      south: {
        plant: "Квітень 10-25",
        harvest: "Вересень 20 - Жовтень 10",
      },
      west: { plant: "Травень 1-15", harvest: "Жовтень 5-25" },
    },
  };

  const cropNames = {
    winter_wheat: "Озима пшениця",
    spring_wheat: "Яра пшениця",
    corn: "Кукурудза",
    sunflower: "Соняшник",
    soybean: "Соя",
    sugar_beet: "Цукровий буряк",
  };

  const regionNames = {
    north: "Північна Україна",
    central: "Центральна Україна",
    south: "Південна Україна",
    west: "Західна Україна",
  };

  const dates = plantingDates[crop][region];

  const resultDiv = document.getElementById("calendarResult");
  resultDiv.innerHTML = `
                <h4>Календар для ${cropNames[crop]}:</h4>
                <p><strong>Регіон:</strong> ${regionNames[region]}</p>
                <p><strong>Рік:</strong> ${year}</p>
                <p><strong>Посів:</strong> ${dates.plant}</p>
                <p><strong>Збирання:</strong> ${dates.harvest}</p>
                <h4>Рекомендації:</h4>
                <p>• Слідкуйте за прогнозом погоди</p>
                <p>• Перевірте готовність ґрунту</p>
                <p>• Підготуйте насіннєвий матеріал</p>
                <p>• Забезпечте наявність техніки</p>
            `;
  resultDiv.style.display = "block";
}
