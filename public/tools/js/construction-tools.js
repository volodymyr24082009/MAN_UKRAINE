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

// Show/hide material fields based on selection
document.getElementById("materialType").addEventListener("change", function () {
  const materialType = this.value;
  const allFields = [
    "brickFields",
    "concreteFields",
    "tilesFields",
    "paintFields",
    "flooringFields",
    "roofingFields",
  ];

  allFields.forEach((field) => {
    document.getElementById(field).style.display = "none";
  });

  if (materialType) {
    document.getElementById(materialType + "Fields").style.display = "block";
  }
});

// Show/hide shape fields based on selection
document.getElementById("shapeType").addEventListener("change", function () {
  const shapeType = this.value;
  const allFields = [
    "rectangleFields",
    "circleFields",
    "triangleFields",
    "trapezoidFields",
    "cubeFields",
    "cylinderFields",
    "sphereFields",
  ];

  allFields.forEach((field) => {
    document.getElementById(field).style.display = "none";
  });

  if (shapeType) {
    document.getElementById(shapeType + "Fields").style.display = "block";
  }
});

// Construction calculator functions
function calculateMortgage() {
  const propertyPrice = parseFloat(
    document.getElementById("propertyPrice").value
  );
  const downPayment = parseFloat(document.getElementById("downPayment").value);
  const term = parseInt(document.getElementById("mortgageTerm").value);
  const rate = parseFloat(document.getElementById("mortgageRate").value);
  const mortgageType = document.getElementById("mortgageType").value;

  if (!propertyPrice || !term || !rate || downPayment === "") {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const loanAmount = propertyPrice - downPayment;
  const monthlyRate = rate / 100 / 12;
  const months = term * 12;

  let monthlyPayment = 0;
  let totalPayment = 0;
  let totalInterest = 0;

  if (mortgageType === "annuity") {
    monthlyPayment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1);
    totalPayment = monthlyPayment * months;
    totalInterest = totalPayment - loanAmount;
  } else {
    // Диференційовані платежі
    const principal = loanAmount / months;
    let remainingBalance = loanAmount;
    let firstPayment = 0;
    let lastPayment = 0;

    for (let i = 1; i <= months; i++) {
      const interest = remainingBalance * monthlyRate;
      const payment = principal + interest;

      if (i === 1) firstPayment = payment;
      if (i === months) lastPayment = payment;

      totalPayment += payment;
      totalInterest += interest;
      remainingBalance -= principal;
    }

    monthlyPayment = firstPayment; // Для відображення
  }

  const downPaymentPercent = (downPayment / propertyPrice) * 100;

  const resultDiv = document.getElementById("mortgageResult");
  resultDiv.innerHTML = `
                <h4>Результати розрахунку іпотеки:</h4>
                <p><strong>Сума кредиту:</strong> ${loanAmount.toFixed(
                  2
                )} грн</p>
                <p><strong>Перший внесок:</strong> ${downPayment.toFixed(
                  2
                )} грн (${downPaymentPercent.toFixed(1)}%)</p>
                <p><strong>${
                  mortgageType === "annuity"
                    ? "Щомісячний платіж:"
                    : "Перший платіж:"
                }</strong> ${monthlyPayment.toFixed(2)} грн</p>
                <p><strong>Загальна сума виплат:</strong> ${totalPayment.toFixed(
                  2
                )} грн</p>
                <p><strong>Загальна сума відсотків:</strong> ${totalInterest.toFixed(
                  2
                )} грн</p>
                <p><strong>Переплата:</strong> ${(
                  (totalInterest / loanAmount) *
                  100
                ).toFixed(2)}%</p>
            `;
  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("mortgageChart").getContext("2d");

  if (window.mortgageChart) {
    window.mortgageChart.destroy();
  }

  window.mortgageChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Основна сума", "Відсотки", "Перший внесок"],
      datasets: [
        {
          data: [loanAmount, totalInterest, downPayment],
          backgroundColor: ["#3b82f6", "#ef4444", "#10b981"],
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

function calculateMaterials() {
  const materialType = document.getElementById("materialType").value;

  if (!materialType) {
    alert("Будь ласка, оберіть тип матеріалу");
    return;
  }

  let result = "";

  switch (materialType) {
    case "brick":
      result = calculateBrick();
      break;
    case "concrete":
      result = calculateConcrete();
      break;
    case "tiles":
      result = calculateTiles();
      break;
    case "paint":
      result = calculatePaint();
      break;
    case "flooring":
      result = calculateFlooring();
      break;
    case "roofing":
      result = calculateRoofing();
      break;
  }

  if (result) {
    const resultDiv = document.getElementById("materialsResult");
    resultDiv.innerHTML = result;
    resultDiv.style.display = "block";
  }
}

function calculateBrick() {
  const length = parseFloat(document.getElementById("wallLength").value);
  const height = parseFloat(document.getElementById("wallHeight").value);
  const thickness = parseFloat(document.getElementById("wallThickness").value);
  const price = parseFloat(document.getElementById("brickPrice").value);

  if (!length || !height || !thickness || !price) {
    alert("Будь ласка, заповніть всі поля для розрахунку цегли");
    return null;
  }

  const wallArea = length * height;
  const wallVolume = wallArea * (thickness / 100);

  // Стандартна цегла: 250×120×65 мм
  const brickVolume = 0.25 * 0.12 * 0.065; // м³
  const bricksNeeded = Math.ceil(wallVolume / brickVolume);
  const totalCost = (bricksNeeded / 1000) * price;

  return `
                <h4>Розрахунок цегли:</h4>
                <p><strong>Площа стіни:</strong> ${wallArea.toFixed(2)} м²</p>
                <p><strong>Об'єм стіни:</strong> ${wallVolume.toFixed(2)} м³</p>
                <p><strong>Кількість цегли:</strong> ${bricksNeeded} шт</p>
                <p><strong>Загальна вартість:</strong> ${totalCost.toFixed(
                  2
                )} грн</p>
            `;
}

function calculateConcrete() {
  const length = parseFloat(document.getElementById("concreteLength").value);
  const width = parseFloat(document.getElementById("concreteWidth").value);
  const height = parseFloat(document.getElementById("concreteHeight").value);
  const price = parseFloat(document.getElementById("concretePrice").value);

  if (!length || !width || !height || !price) {
    alert("Будь ласка, заповніть всі поля для розрахунку бетону");
    return null;
  }

  const volume = length * width * height;
  const totalCost = volume * price;

  return `
                <h4>Розрахунок бетону:</h4>
                <p><strong>Об'єм бетону:</strong> ${volume.toFixed(2)} м³</p>
                <p><strong>Загальна вартість:</strong> ${totalCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Ціна за м³:</strong> ${price.toFixed(2)} грн</p>
            `;
}

function calculateTiles() {
  const roomLength = parseFloat(document.getElementById("roomLength").value);
  const roomWidth = parseFloat(document.getElementById("roomWidth").value);
  const tileLength = parseFloat(document.getElementById("tileLength").value);
  const tileWidth = parseFloat(document.getElementById("tileWidth").value);
  const price = parseFloat(document.getElementById("tilePrice").value);
  const wastePercent = parseFloat(
    document.getElementById("wastePercent").value
  );

  if (
    !roomLength ||
    !roomWidth ||
    !tileLength ||
    !tileWidth ||
    !price ||
    !wastePercent
  ) {
    alert("Будь ласка, заповніть всі поля для розрахунку плитки");
    return null;
  }

  const roomArea = roomLength * roomWidth;
  const tileArea = (tileLength / 100) * (tileWidth / 100); // переведення в м²
  const tilesNeeded = Math.ceil(roomArea / tileArea);
  const tilesWithWaste = Math.ceil(tilesNeeded * (1 + wastePercent / 100));
  const totalCost = roomArea * price * (1 + wastePercent / 100);

  return `
                <h4>Розрахунок плитки:</h4>
                <p><strong>Площа кімнати:</strong> ${roomArea.toFixed(2)} м²</p>
                <p><strong>Площа однієї плитки:</strong> ${tileArea.toFixed(
                  4
                )} м²</p>
                <p><strong>Кількість плитки (без запасу):</strong> ${tilesNeeded} шт</p>
                <p><strong>Кількість плитки (з запасом ${wastePercent}%):</strong> ${tilesWithWaste} шт</p>
                <p><strong>Загальна вартість:</strong> ${totalCost.toFixed(
                  2
                )} грн</p>
            `;
}

function calculatePaint() {
  const area = parseFloat(document.getElementById("paintArea").value);
  const coverage = parseFloat(document.getElementById("paintCoverage").value);
  const layers = parseInt(document.getElementById("paintLayers").value);
  const price = parseFloat(document.getElementById("paintPrice").value);

  if (!area || !coverage || !layers || !price) {
    alert("Будь ласка, заповніть всі поля для розрахунку фарби");
    return null;
  }

  const paintNeeded = (area * layers) / coverage;
  const totalCost = paintNeeded * price;

  return `
                <h4>Розрахунок фарби:</h4>
                <p><strong>Площа для фарбування:</strong> ${area.toFixed(
                  2
                )} м²</p>
                <p><strong>Кількість шарів:</strong> ${layers}</p>
                <p><strong>Витрата фарби:</strong> ${coverage} м²/л</p>
                <p><strong>Необхідно фарби:</strong> ${paintNeeded.toFixed(
                  2
                )} л</p>
                <p><strong>Загальна вартість:</strong> ${totalCost.toFixed(
                  2
                )} грн</p>
            `;
}

function calculateFlooring() {
  const length = parseFloat(document.getElementById("floorLength").value);
  const width = parseFloat(document.getElementById("floorWidth").value);
  const flooringType = document.getElementById("flooringType").value;
  const price = parseFloat(document.getElementById("flooringPrice").value);

  if (!length || !width || !flooringType || !price) {
    alert("Будь ласка, заповніть всі поля для розрахунку підлогового покриття");
    return null;
  }

  const area = length * width;
  const areaWithWaste = area * 1.1; // 10% запас
  const totalCost = areaWithWaste * price;

  const flooringNames = {
    laminate: "Ламінат",
    parquet: "Паркет",
    linoleum: "Лінолеум",
    carpet: "Ковролін",
  };

  return `
                <h4>Розрахунок підлогового покриття:</h4>
                <p><strong>Тип покриття:</strong> ${
                  flooringNames[flooringType]
                }</p>
                <p><strong>Площа кімнати:</strong> ${area.toFixed(2)} м²</p>
                <p><strong>Площа з запасом (10%):</strong> ${areaWithWaste.toFixed(
                  2
                )} м²</p>
                <p><strong>Загальна вартість:</strong> ${totalCost.toFixed(
                  2
                )} грн</p>
            `;
}

function calculateRoofing() {
  const length = parseFloat(document.getElementById("roofLength").value);
  const width = parseFloat(document.getElementById("roofWidth").value);
  const angle = parseFloat(document.getElementById("roofAngle").value);
  const material = document.getElementById("roofingMaterial").value;
  const price = parseFloat(document.getElementById("roofingPrice").value);

  if (!length || !width || !angle || !material || !price) {
    alert("Будь ласка, заповніть всі поля для розрахунку покрівлі");
    return null;
  }

  const baseArea = length * width;
  const angleCoeff = 1 / Math.cos((angle * Math.PI) / 180);
  const roofArea = baseArea * angleCoeff;
  const roofAreaWithWaste = roofArea * 1.15; // 15% запас
  const totalCost = roofAreaWithWaste * price;

  const materialNames = {
    metal: "Металочерепиця",
    ceramic: "Керамічна черепиця",
    slate: "Шифер",
    soft: "М'яка покрівля",
  };

  return `
                <h4>Розрахунок покрівлі:</h4>
                <p><strong>Тип покрівлі:</strong> ${materialNames[material]}</p>
                <p><strong>Площа основи:</strong> ${baseArea.toFixed(2)} м²</p>
                <p><strong>Кут нахилу:</strong> ${angle}°</p>
                <p><strong>Площа покрівлі:</strong> ${roofArea.toFixed(
                  2
                )} м²</p>
                <p><strong>Площа з запасом (15%):</strong> ${roofAreaWithWaste.toFixed(
                  2
                )} м²</p>
                <p><strong>Загальна вартість:</strong> ${totalCost.toFixed(
                  2
                )} грн</p>
            `;
}

function calculateAreaVolume() {
  const shapeType = document.getElementById("shapeType").value;

  if (!shapeType) {
    alert("Будь ласка, оберіть фігуру");
    return;
  }

  let result = "";

  switch (shapeType) {
    case "rectangle":
      result = calculateRectangle();
      break;
    case "circle":
      result = calculateCircle();
      break;
    case "triangle":
      result = calculateTriangle();
      break;
    case "trapezoid":
      result = calculateTrapezoid();
      break;
    case "cube":
      result = calculateCube();
      break;
    case "cylinder":
      result = calculateCylinder();
      break;
    case "sphere":
      result = calculateSphere();
      break;
  }

  if (result) {
    const resultDiv = document.getElementById("areaVolumeResult");
    resultDiv.innerHTML = result;
    resultDiv.style.display = "block";
  }
}

function calculateRectangle() {
  const length = parseFloat(document.getElementById("rectLength").value);
  const width = parseFloat(document.getElementById("rectWidth").value);

  if (!length || !width) {
    alert("Будь ласка, введіть довжину та ширину");
    return null;
  }

  const area = length * width;
  const perimeter = 2 * (length + width);

  return `
                <h4>Прямокутник:</h4>
                <p><strong>Площа:</strong> ${area.toFixed(2)} м²</p>
                <p><strong>Периметр:</strong> ${perimeter.toFixed(2)} м</p>
            `;
}

function calculateCircle() {
  const radius = parseFloat(document.getElementById("circleRadius").value);

  if (!radius) {
    alert("Будь ласка, введіть радіус");
    return null;
  }

  const area = Math.PI * radius * radius;
  const circumference = 2 * Math.PI * radius;

  return `
                <h4>Коло:</h4>
                <p><strong>Площа:</strong> ${area.toFixed(2)} м²</p>
                <p><strong>Довжина кола:</strong> ${circumference.toFixed(
                  2
                )} м</p>
            `;
}

function calculateTriangle() {
  const base = parseFloat(document.getElementById("triangleBase").value);
  const height = parseFloat(document.getElementById("triangleHeight").value);

  if (!base || !height) {
    alert("Будь ласка, введіть основу та висоту");
    return null;
  }

  const area = 0.5 * base * height;

  return `
                <h4>Трикутник:</h4>
                <p><strong>Площа:</strong> ${area.toFixed(2)} м²</p>
            `;
}

function calculateTrapezoid() {
  const base1 = parseFloat(document.getElementById("trapezoidBase1").value);
  const base2 = parseFloat(document.getElementById("trapezoidBase2").value);
  const height = parseFloat(document.getElementById("trapezoidHeight").value);

  if (!base1 || !base2 || !height) {
    alert("Будь ласка, введіть обидві основи та висоту");
    return null;
  }

  const area = 0.5 * (base1 + base2) * height;

  return `
                <h4>Трапеція:</h4>
                <p><strong>Площа:</strong> ${area.toFixed(2)} м²</p>
            `;
}

function calculateCube() {
  const side = parseFloat(document.getElementById("cubeSide").value);

  if (!side) {
    alert("Будь ласка, введіть сторону куба");
    return null;
  }

  const volume = side * side * side;
  const surfaceArea = 6 * side * side;

  return `
                <h4>Куб:</h4>
                <p><strong>Об'єм:</strong> ${volume.toFixed(2)} м³</p>
                <p><strong>Площа поверхні:</strong> ${surfaceArea.toFixed(
                  2
                )} м²</p>
            `;
}

function calculateCylinder() {
  const radius = parseFloat(document.getElementById("cylinderRadius").value);
  const height = parseFloat(document.getElementById("cylinderHeight").value);

  if (!radius || !height) {
    alert("Будь ласка, введіть радіус та висоту");
    return null;
  }

  const volume = Math.PI * radius * radius * height;
  const surfaceArea = 2 * Math.PI * radius * (radius + height);

  return `
                <h4>Циліндр:</h4>
                <p><strong>Об'єм:</strong> ${volume.toFixed(2)} м³</p>
                <p><strong>Площа поверхні:</strong> ${surfaceArea.toFixed(
                  2
                )} м²</p>
            `;
}

function calculateSphere() {
  const radius = parseFloat(document.getElementById("sphereRadius").value);

  if (!radius) {
    alert("Будь ласка, введіть радіус");
    return null;
  }

  const volume = (4 / 3) * Math.PI * radius * radius * radius;
  const surfaceArea = 4 * Math.PI * radius * radius;

  return `
                <h4>Сфера:</h4>
                <p><strong>Об'єм:</strong> ${volume.toFixed(2)} м³</p>
                <p><strong>Площа поверхні:</strong> ${surfaceArea.toFixed(
                  2
                )} м²</p>
            `;
}

function calculateRenovationCost() {
  const area = parseFloat(document.getElementById("renovationArea").value);
  const renovationType = document.getElementById("renovationType").value;
  const region = document.getElementById("renovationRegion").value;

  if (!area || !renovationType || !region) {
    alert("Будь ласка, заповніть основні поля");
    return;
  }

  // Базові ціни за м² для різних типів ремонту
  const basePrices = {
    cosmetic: 3000,
    major: 8000,
    luxury: 20000,
    euro: 12000,
  };

  // Регіональні коефіцієнти
  const regionCoefficients = {
    kyiv: 1.3,
    lviv: 1.1,
    odesa: 1.15,
    kharkiv: 1.05,
    other: 1.0,
  };

  const basePrice = basePrices[renovationType];
  const regionCoeff = regionCoefficients[region];

  // Розрахунок вартості робіт
  const works = {
    walls: document.getElementById("wallsWork").checked,
    ceiling: document.getElementById("ceilingWork").checked,
    floor: document.getElementById("floorWork").checked,
    plumbing: document.getElementById("plumbingWork").checked,
    electrical: document.getElementById("electricalWork").checked,
    tiling: document.getElementById("tilingWork").checked,
  };

  const workCosts = {
    walls: basePrice * 0.3,
    ceiling: basePrice * 0.2,
    floor: basePrice * 0.25,
    plumbing: basePrice * 0.15,
    electrical: basePrice * 0.1,
    tiling: basePrice * 0.2,
  };

  let totalWorkCost = 0;
  let workDetails = [];

  Object.keys(works).forEach((work) => {
    if (works[work]) {
      const cost = workCosts[work] * area * regionCoeff;
      totalWorkCost += cost;

      const workNames = {
        walls: "Стіни",
        ceiling: "Стеля",
        floor: "Підлога",
        plumbing: "Сантехніка",
        electrical: "Електрика",
        tiling: "Плитка",
      };

      workDetails.push({
        name: workNames[work],
        cost: cost,
      });
    }
  });

  const materialsCost = totalWorkCost * 0.6; // 60% від вартості робіт
  const totalCost = totalWorkCost + materialsCost;
  const costPerSqm = totalCost / area;

  const renovationNames = {
    cosmetic: "Косметичний ремонт",
    major: "Капітальний ремонт",
    luxury: "Елітний ремонт",
    euro: "Євроремонт",
  };

  let resultHTML = `
                <h4>Розрахунок вартості ремонту:</h4>
                <p><strong>Тип ремонту:</strong> ${renovationNames[renovationType]}</p>
                <p><strong>Площа:</strong> ${area} м²</p>
                <p><strong>Регіон:</strong> ${region}</p>
                <h4>Вартість робіт:</h4>
            `;

  workDetails.forEach((work) => {
    resultHTML += `<p><strong>${work.name}:</strong> ${work.cost.toFixed(
      2
    )} грн</p>`;
  });

  resultHTML += `
                <p><strong>Загальна вартість робіт:</strong> ${totalWorkCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Вартість матеріалів:</strong> ${materialsCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Загальна вартість:</strong> ${totalCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Вартість за м²:</strong> ${costPerSqm.toFixed(
                  2
                )} грн</p>
            `;

  const resultDiv = document.getElementById("renovationResult");
  resultDiv.innerHTML = resultHTML;
  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("renovationChart").getContext("2d");

  if (window.renovationChart) {
    window.renovationChart.destroy();
  }

  const chartLabels = workDetails.map((work) => work.name);
  chartLabels.push("Матеріали");

  const chartData = workDetails.map((work) => work.cost);
  chartData.push(materialsCost);

  window.renovationChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: chartLabels,
      datasets: [
        {
          data: chartData,
          backgroundColor: [
            "#3b82f6",
            "#ef4444",
            "#10b981",
            "#f59e0b",
            "#8b5cf6",
            "#06b6d4",
            "#ec4899",
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

function calculatePropertyROI() {
  const investment = parseFloat(
    document.getElementById("investmentAmount").value
  );
  const monthlyRent = parseFloat(document.getElementById("monthlyRent").value);
  const appreciation = parseFloat(
    document.getElementById("propertyAppreciation").value
  );
  const propertyTax =
    parseFloat(document.getElementById("propertyTax").value) || 0;
  const maintenance =
    parseFloat(document.getElementById("maintenance").value) || 0;
  const insurance = parseFloat(document.getElementById("insurance").value) || 0;
  const management =
    parseFloat(document.getElementById("management").value) || 0;
  const vacancyRate =
    parseFloat(document.getElementById("vacancyRate").value) || 0;
  const years = parseInt(document.getElementById("analysisYears").value);

  if (!investment || !monthlyRent || !years) {
    alert("Будь ласка, заповніть основні поля");
    return;
  }

  const monthlyExpenses = propertyTax + maintenance + insurance + management;
  const effectiveMonthlyRent = monthlyRent * (1 - vacancyRate / 100);
  const netMonthlyIncome = effectiveMonthlyRent - monthlyExpenses;
  const annualNetIncome = netMonthlyIncome * 12;

  // Розрахунок майбутньої вартості нерухомості
  const futureValue = investment * Math.pow(1 + appreciation / 100, years);
  const capitalGain = futureValue - investment;

  // Загальний дохід за період
  const totalRentalIncome = annualNetIncome * years;
  const totalReturn = totalRentalIncome + capitalGain;
  const totalROI = (totalReturn / investment) * 100;
  const annualROI = totalROI / years;

  // Розрахунок cash-on-cash return
  const cashOnCashReturn = (annualNetIncome / investment) * 100;

  // Розрахунок cap rate
  const capRate = (annualNetIncome / investment) * 100;

  const resultDiv = document.getElementById("propertyROIResult");
  resultDiv.innerHTML = `
                <h4>Аналіз окупності нерухомості:</h4>
                <p><strong>Сума інвестицій:</strong> ${investment.toFixed(
                  2
                )} грн</p>
                <p><strong>Чистий місячний дохід:</strong> ${netMonthlyIncome.toFixed(
                  2
                )} грн</p>
                <p><strong>Річний чистий дохід:</strong> ${annualNetIncome.toFixed(
                  2
                )} грн</p>
                <p><strong>Майбутня вартість нерухомості:</strong> ${futureValue.toFixed(
                  2
                )} грн</p>
                <p><strong>Приріст капіталу:</strong> ${capitalGain.toFixed(
                  2
                )} грн</p>
                <p><strong>Загальний дохід за ${years} років:</strong> ${totalReturn.toFixed(
    2
  )} грн</p>
                <p><strong>Загальна рентабельність:</strong> ${totalROI.toFixed(
                  2
                )}%</p>
                <p><strong>Річна рентабельність:</strong> ${annualROI.toFixed(
                  2
                )}%</p>
                <p><strong>Cash-on-Cash Return:</strong> ${cashOnCashReturn.toFixed(
                  2
                )}%</p>
                <p><strong>Cap Rate:</strong> ${capRate.toFixed(2)}%</p>
            `;
  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("roiChart").getContext("2d");

  if (window.roiChart) {
    window.roiChart.destroy();
  }

  window.roiChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Орендний дохід", "Приріст капіталу"],
      datasets: [
        {
          data: [totalRentalIncome, capitalGain],
          backgroundColor: ["#10b981", "#3b82f6"],
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

function calculateEnergyEfficiency() {
  const area = parseFloat(document.getElementById("buildingArea").value);
  const height = parseFloat(document.getElementById("ceilingHeight").value);
  const wallMaterial = document.getElementById("wallMaterial").value;
  const insulation = document.getElementById("insulationType").value;
  const windows = document.getElementById("windowType").value;
  const heatingCost =
    parseFloat(document.getElementById("heatingCost").value) || 0;
  const coolingCost =
    parseFloat(document.getElementById("coolingCost").value) || 0;
  const insulationCost =
    parseFloat(document.getElementById("insulationCost").value) || 0;

  if (!area || !height || !wallMaterial || !insulation || !windows) {
    alert("Будь ласка, заповніть всі основні поля");
    return;
  }

  // Коефіцієнти енергоефективності
  const materialCoefficients = {
    brick: 0.6,
    concrete: 0.4,
    wood: 0.8,
    panel: 0.5,
  };

  const insulationCoefficients = {
    none: 0.2,
    basic: 0.6,
    advanced: 0.8,
    passive: 0.95,
  };

  const windowCoefficients = {
    single: 0.3,
    double: 0.6,
    triple: 0.8,
    energy: 0.9,
  };

  // Розрахунок загального коефіцієнта енергоефективності
  const materialScore = materialCoefficients[wallMaterial];
  const insulationScore = insulationCoefficients[insulation];
  const windowScore = windowCoefficients[windows];

  const efficiencyScore =
    (materialScore * 0.3 + insulationScore * 0.5 + windowScore * 0.2) * 100;

  // Розрахунок потенційної економії
  const currentEnergyCost = heatingCost + coolingCost;
  const potentialSavings = currentEnergyCost * (efficiencyScore / 100) * 0.8; // 80% від теоретичної економії
  const paybackPeriod =
    insulationCost > 0 ? insulationCost / potentialSavings : 0;

  // Рекомендації
  let recommendations = [];

  if (insulationScore < 0.6) {
    recommendations.push("Покращіть утеплення стін та даху");
  }

  if (windowScore < 0.7) {
    recommendations.push("Замініть вікна на енергозберігаючі");
  }

  if (efficiencyScore < 60) {
    recommendations.push("Встановіть програмований термостат");
    recommendations.push("Утепліть підлогу та підвал");
  }

  if (efficiencyScore >= 80) {
    recommendations.push("Розгляньте можливість встановлення сонячних панелей");
  }

  // Визначення рівня ефективності
  let efficiencyLevel = "";
  let efficiencyClass = "";

  if (efficiencyScore >= 90) {
    efficiencyLevel = "Відмінний";
    efficiencyClass = "efficiency-excellent";
  } else if (efficiencyScore >= 70) {
    efficiencyLevel = "Добрий";
    efficiencyClass = "efficiency-good";
  } else {
    efficiencyLevel = "Потребує покращення";
    efficiencyClass = "efficiency-poor";
  }

  const resultDiv = document.getElementById("energyEfficiencyResult");
  resultDiv.innerHTML = `
                <h4>Оцінка енергоефективності:</h4>
                <p><strong>Загальний бал:</strong> ${efficiencyScore.toFixed(
                  1
                )}/100</p>
                <p><strong>Рівень ефективності:</strong> ${efficiencyLevel}</p>
                <p><strong>Поточні витрати на енергію:</strong> ${currentEnergyCost.toFixed(
                  2
                )} грн/рік</p>
                <p><strong>Потенційна економія:</strong> ${potentialSavings.toFixed(
                  2
                )} грн/рік</p>
                ${
                  paybackPeriod > 0
                    ? `<p><strong>Період окупності утеплення:</strong> ${paybackPeriod.toFixed(
                        1
                      )} років</p>`
                    : ""
                }
                <h4>Рекомендації:</h4>
                <ul>
                    ${recommendations.map((rec) => `<li>${rec}</li>`).join("")}
                </ul>
            `;
  resultDiv.style.display = "block";

  // Update efficiency bar
  const efficiencyBar = document.getElementById("efficiencyBar");
  const efficiencyText = document.getElementById("efficiencyText");

  efficiencyBar.style.width = `${efficiencyScore}%`;
  efficiencyBar.className = `efficiency-fill ${efficiencyClass}`;
  efficiencyText.textContent = `Рівень енергоефективності: ${efficiencyScore.toFixed(
    1
  )}%`;
}
