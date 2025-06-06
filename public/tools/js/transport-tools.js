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

// Transport calculator functions
function calculateFuelConsumption() {
  const distance = parseFloat(document.getElementById("distance").value);
  const consumption = parseFloat(
    document.getElementById("fuelConsumption").value
  );
  const fuelPrice = parseFloat(document.getElementById("fuelPrice").value);
  const fuelType = document.getElementById("fuelType").value;
  const additionalExpenses =
    parseFloat(document.getElementById("additionalExpenses").value) || 0;

  if (!distance || !consumption || !fuelPrice) {
    alert("Будь ласка, заповніть всі обов'язкові поля");
    return;
  }

  const fuelNeeded = (distance * consumption) / 100;
  const fuelCost = fuelNeeded * fuelPrice;
  const totalCost = fuelCost + additionalExpenses;
  const costPerKm = totalCost / distance;

  // Розрахунок викидів CO2 (приблизно)
  let co2Emissions = 0;
  switch (fuelType) {
    case "petrol":
      co2Emissions = fuelNeeded * 2.3; // кг CO2 на літр бензину
      break;
    case "diesel":
      co2Emissions = fuelNeeded * 2.7; // кг CO2 на літр дизеля
      break;
    case "gas":
      co2Emissions = fuelNeeded * 1.7; // кг CO2 на літр газу
      break;
    case "electric":
      co2Emissions = distance * 0.1; // кг CO2 на км (залежить від джерела електроенергії)
      break;
  }

  const fuelNames = {
    petrol: "Бензин",
    diesel: "Дизель",
    gas: "Газ",
    electric: "Електроенергія",
  };

  const resultDiv = document.getElementById("fuelResult");
  resultDiv.innerHTML = `
                <h4>Результати розрахунку:</h4>
                <p><strong>Тип палива:</strong> ${fuelNames[fuelType]}</p>
                <p><strong>Відстань:</strong> ${distance} км</p>
                <p><strong>Необхідно палива:</strong> ${fuelNeeded.toFixed(
                  2
                )} л</p>
                <p><strong>Вартість палива:</strong> ${fuelCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Додаткові витрати:</strong> ${additionalExpenses.toFixed(
                  2
                )} грн</p>
                <p><strong>Загальна вартість поїздки:</strong> ${totalCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Вартість на кілометр:</strong> ${costPerKm.toFixed(
                  2
                )} грн/км</p>
                <p><strong>Викиди CO2:</strong> ${co2Emissions.toFixed(
                  2
                )} кг</p>
            `;
  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("fuelChart").getContext("2d");

  if (window.fuelChart) {
    window.fuelChart.destroy();
  }

  window.fuelChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Вартість палива", "Додаткові витрати"],
      datasets: [
        {
          data: [fuelCost, additionalExpenses],
          backgroundColor: ["#3b82f6", "#f59e0b"],
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

function calculateCargoTransportation() {
  const weight = parseFloat(document.getElementById("cargoWeight").value);
  const volume = parseFloat(document.getElementById("cargoVolume").value);
  const distance = parseFloat(document.getElementById("cargoDistance").value);
  const transportType = document.getElementById("transportType").value;
  const cargoType = document.getElementById("cargoType").value;
  const loadingType = document.getElementById("loadingType").value;
  const urgency = document.getElementById("urgency").value;

  if (
    !weight ||
    !volume ||
    !distance ||
    !transportType ||
    !cargoType ||
    !loadingType
  ) {
    alert("Будь ласка, заповніть всі обов'язкові поля");
    return;
  }

  // Базові тарифи за км для різних видів транспорту (грн/км/т)
  const baseTariffs = {
    truck: 15,
    train: 8,
    ship: 5,
    air: 50,
  };

  // Коефіцієнти для різних типів вантажу
  const cargoCoefficients = {
    general: 1.0,
    fragile: 1.5,
    dangerous: 2.0,
    perishable: 1.8,
    oversized: 2.5,
  };

  // Коефіцієнти для типів завантаження
  const loadingCoefficients = {
    manual: 1.2,
    forklift: 1.0,
    crane: 1.5,
  };

  // Коефіцієнти для терміновості
  const urgencyCoefficients = {
    normal: 1.0,
    express: 1.5,
    urgent: 2.0,
  };

  // Розрахунок вартості
  const baseCost = baseTariffs[transportType] * distance * (weight / 1000); // переведення в тонни
  const volumeCost = volume * 100; // додаткова плата за об'єм

  const cargoCoeff = cargoCoefficients[cargoType];
  const loadingCoeff = loadingCoefficients[loadingType];
  const urgencyCoeff = urgencyCoefficients[urgency];

  const totalCost =
    (baseCost + volumeCost) * cargoCoeff * loadingCoeff * urgencyCoeff;
  const costPerKm = totalCost / distance;
  const costPerTon = totalCost / (weight / 1000);

  // Розрахунок часу доставки (приблизно)
  const speedByTransport = {
    truck: 60, // км/год
    train: 80,
    ship: 30,
    air: 800,
  };

  const baseTime = distance / speedByTransport[transportType]; // години
  const totalTime =
    baseTime * (urgency === "normal" ? 1.5 : urgency === "express" ? 1.2 : 1.0);

  const transportNames = {
    truck: "Вантажівка",
    train: "Залізниця",
    ship: "Морський транспорт",
    air: "Авіаперевезення",
  };

  const cargoNames = {
    general: "Загальний вантаж",
    fragile: "Крихкий вантаж",
    dangerous: "Небезпечний вантаж",
    perishable: "Швидкопсувний вантаж",
    oversized: "Негабаритний вантаж",
  };

  const loadingNames = {
    manual: "Ручне завантаження",
    forklift: "Навантажувач",
    crane: "Кран",
  };

  const urgencyNames = {
    normal: "Звичайна доставка",
    express: "Експрес-доставка",
    urgent: "Термінова доставка",
  };

  const resultDiv = document.getElementById("cargoResult");
  resultDiv.innerHTML = `
                <h4>Результати розрахунку вартості перевезення:</h4>
                <p><strong>Тип транспорту:</strong> ${
                  transportNames[transportType]
                }</p>
                <p><strong>Тип вантажу:</strong> ${cargoNames[cargoType]}</p>
                <p><strong>Вага:</strong> ${weight} кг (${(
    weight / 1000
  ).toFixed(2)} т)</p>
                <p><strong>Об'єм:</strong> ${volume} м³</p>
                <p><strong>Відстань:</strong> ${distance} км</p>
                <p><strong>Тип завантаження:</strong> ${
                  loadingNames[loadingType]
                }</p>
                <p><strong>Терміновість:</strong> ${urgencyNames[urgency]}</p>
                <p><strong>Базова вартість:</strong> ${baseCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Додаткова плата за об'єм:</strong> ${volumeCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Загальна вартість:</strong> ${totalCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Вартість за км:</strong> ${costPerKm.toFixed(
                  2
                )} грн/км</p>
                <p><strong>Вартість за тонну:</strong> ${costPerTon.toFixed(
                  2
                )} грн/т</p>
                <p><strong>Орієнтовний час доставки:</strong> ${totalTime.toFixed(
                  1
                )} год</p>
            `;
  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("cargoChart").getContext("2d");

  if (window.cargoChart) {
    window.cargoChart.destroy();
  }

  // Порівняння вартості для різних видів транспорту
  const transportTypes = ["truck", "train", "ship", "air"];
  const transportCosts = transportTypes.map((type) => {
    const cost =
      baseTariffs[type] *
      distance *
      (weight / 1000) *
      cargoCoefficients[cargoType] *
      loadingCoefficients[loadingType] *
      urgencyCoefficients[urgency];
    return cost;
  });

  window.cargoChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: transportTypes.map((type) => transportNames[type]),
      datasets: [
        {
          label: "Вартість перевезення (грн)",
          data: transportCosts,
          backgroundColor: "#3b82f6",
          borderColor: "#1d4ed8",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function calculateDepreciation() {
  const initialPrice = parseFloat(
    document.getElementById("vehiclePrice").value
  );
  const age = parseInt(document.getElementById("vehicleAge").value);
  const vehicleType = document.getElementById("vehicleType").value;
  const mileage = parseFloat(document.getElementById("mileage").value);
  const fuelType = document.getElementById("fuelType2").value;
  const condition = document.getElementById("condition").value;
  const years = parseInt(document.getElementById("depreciationYears").value);

  if (!initialPrice || age === "" || !vehicleType || !mileage || !condition) {
    alert("Будь ласка, заповніть всі обов'язкові поля");
    return;
  }

  // Річні коефіцієнти амортизації для різних типів транспорту
  const yearlyDepreciationRates = {
    car: [0.2, 0.15, 0.1, 0.1, 0.1, 0.05, 0.05, 0.05, 0.05, 0.05],
    truck: [0.15, 0.12, 0.1, 0.08, 0.08, 0.07, 0.07, 0.07, 0.07, 0.07],
    bus: [0.18, 0.14, 0.12, 0.1, 0.1, 0.08, 0.08, 0.08, 0.08, 0.08],
    motorcycle: [0.25, 0.2, 0.15, 0.1, 0.1, 0.05, 0.05, 0.05, 0.05, 0.05],
    special: [0.12, 0.1, 0.08, 0.08, 0.08, 0.07, 0.07, 0.07, 0.07, 0.07],
  };

  // Коефіцієнти для пробігу (на 10000 км)
  const mileageCoefficients = {
    car: 0.005,
    truck: 0.003,
    bus: 0.004,
    motorcycle: 0.008,
    special: 0.002,
  };

  // Коефіцієнти для типу палива
  const fuelCoefficients = {
    petrol: 1.0,
    diesel: 0.9,
    gas: 1.1,
    hybrid: 0.8,
    electric: 0.7,
  };

  // Коефіцієнти для стану
  const conditionCoefficients = {
    excellent: 0.8,
    good: 1.0,
    average: 1.2,
    poor: 1.5,
  };

  // Розрахунок поточної вартості з урахуванням віку
  let currentValue = initialPrice;
  for (let i = 0; i < Math.min(age, 10); i++) {
    currentValue -= initialPrice * yearlyDepreciationRates[vehicleType][i];
  }

  // Додаткова амортизація за пробіг
  const mileageDepreciation =
    initialPrice * (mileage / 10000) * mileageCoefficients[vehicleType];
  currentValue -= mileageDepreciation;

  // Коригування за типом палива та станом
  currentValue *= fuelCoefficients[fuelType];
  currentValue /= conditionCoefficients[condition];

  // Обмеження мінімальної вартості
  currentValue = Math.max(currentValue, initialPrice * 0.1);

  // Прогноз амортизації на наступні роки
  const futurePrices = [currentValue];
  let futureValue = currentValue;

  for (let i = 0; i < years; i++) {
    const yearRate =
      age + i < 10 ? yearlyDepreciationRates[vehicleType][age + i] : 0.05;
    const yearDepreciation = initialPrice * yearRate;
    futureValue -= yearDepreciation;

    // Додаткова річна амортизація за пробіг (припускаємо середній річний пробіг)
    const yearlyMileage = 15000; // середній річний пробіг
    const yearlyMileageDepreciation =
      initialPrice * (yearlyMileage / 10000) * mileageCoefficients[vehicleType];
    futureValue -= yearlyMileageDepreciation;

    // Обмеження мінімальної вартості
    futureValue = Math.max(futureValue, initialPrice * 0.1);

    futurePrices.push(futureValue);
  }

  const totalDepreciation = initialPrice - currentValue;
  const depreciationPercent = (totalDepreciation / initialPrice) * 100;
  const yearlyDepreciation = totalDepreciation / (age || 1);

  const vehicleNames = {
    car: "Легковий автомобіль",
    truck: "Вантажівка",
    bus: "Автобус",
    motorcycle: "Мотоцикл",
    special: "Спецтехніка",
  };

  const fuelNames = {
    petrol: "Бензин",
    diesel: "Дизель",
    gas: "Газ",
    hybrid: "Гібрид",
    electric: "Електромобіль",
  };

  const conditionNames = {
    excellent: "Відмінний",
    good: "Добрий",
    average: "Середній",
    poor: "Поганий",
  };

  const resultDiv = document.getElementById("depreciationResult");
  resultDiv.innerHTML = `
                <h4>Результати розрахунку амортизації:</h4>
                <p><strong>Тип транспорту:</strong> ${
                  vehicleNames[vehicleType]
                }</p>
                <p><strong>Початкова вартість:</strong> ${initialPrice.toFixed(
                  2
                )} грн</p>
                <p><strong>Вік:</strong> ${age} років</p>
                <p><strong>Пробіг:</strong> ${mileage} км</p>
                <p><strong>Тип палива:</strong> ${fuelNames[fuelType]}</p>
                <p><strong>Стан:</strong> ${conditionNames[condition]}</p>
                <p><strong>Поточна вартість:</strong> ${currentValue.toFixed(
                  2
                )} грн</p>
                <p><strong>Загальна амортизація:</strong> ${totalDepreciation.toFixed(
                  2
                )} грн (${depreciationPercent.toFixed(1)}%)</p>
                <p><strong>Середньорічна амортизація:</strong> ${yearlyDepreciation.toFixed(
                  2
                )} грн/рік</p>
                <p><strong>Прогнозована вартість через ${years} років:</strong> ${futurePrices[
    years
  ].toFixed(2)} грн</p>
            `;
  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("depreciationChart").getContext("2d");

  if (window.depreciationChart) {
    window.depreciationChart.destroy();
  }

  const labels = Array.from({ length: years + 1 }, (_, i) => `Рік ${i}`);

  window.depreciationChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Вартість (грн)",
          data: futurePrices,
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          borderColor: "#3b82f6",
          borderWidth: 2,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
        },
      },
    },
  });
}

// Route optimization
let routePoints = [];

function addRoutePoint() {
  const point = document.getElementById("routePoint").value;
  const distance = parseFloat(document.getElementById("pointDistance").value);
  const stopTime = parseFloat(document.getElementById("stopTime").value);
  const roadType = document.getElementById("roadType").value;

  if (!point || distance === "" || stopTime === "") {
    alert("Будь ласка, заповніть всі поля для точки маршруту");
    return;
  }

  routePoints.push({
    name: point,
    distance: distance,
    stopTime: stopTime,
    roadType: roadType,
  });

  // Clear inputs
  document.getElementById("routePoint").value = "";
  document.getElementById("pointDistance").value = "";
  document.getElementById("stopTime").value = "";

  updateRouteList();
}

function updateRouteList() {
  const routeList = document.getElementById("routeList");
  routeList.innerHTML = "";

  routePoints.forEach((point, index) => {
    const item = document.createElement("div");
    item.className = "route-item";

    const number = document.createElement("div");
    number.className = "route-number";
    number.textContent = index + 1;

    const name = document.createElement("span");
    name.className = "route-name";
    name.textContent = `${point.name} (${point.distance} км, ${
      point.stopTime
    } хв, ${getRoadTypeName(point.roadType)})`;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "route-delete";
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = () => removeRoutePoint(index);

    item.appendChild(number);
    item.appendChild(name);
    item.appendChild(deleteBtn);

    routeList.appendChild(item);
  });
}

function removeRoutePoint(index) {
  routePoints.splice(index, 1);
  updateRouteList();
}

function getRoadTypeName(roadType) {
  const names = {
    highway: "Автомагістраль",
    city: "Місто",
    country: "Сільська місцевість",
    mountain: "Гірська дорога",
  };
  return names[roadType] || roadType;
}

function calculateRoute() {
  if (routePoints.length < 2) {
    alert("Додайте принаймні 2 точки маршруту");
    return;
  }

  const avgSpeed = parseFloat(document.getElementById("avgSpeed").value);
  const fuelConsumption = parseFloat(
    document.getElementById("fuelConsumptionRoute").value
  );
  const fuelPrice = parseFloat(document.getElementById("fuelPriceRoute").value);

  if (!avgSpeed || !fuelConsumption || !fuelPrice) {
    alert("Будь ласка, заповніть всі поля для розрахунку маршруту");
    return;
  }

  // Розрахунок загальної відстані
  const totalDistance = routePoints.reduce(
    (sum, point) => sum + point.distance,
    0
  );

  // Розрахунок часу в дорозі
  let totalDrivingTime = 0;
  let totalStopTime = 0;

  routePoints.forEach((point) => {
    // Коригування швидкості залежно від типу дороги
    let speedCoefficient = 1.0;
    switch (point.roadType) {
      case "highway":
        speedCoefficient = 1.2;
        break;
      case "city":
        speedCoefficient = 0.6;
        break;
      case "country":
        speedCoefficient = 0.8;
        break;
      case "mountain":
        speedCoefficient = 0.7;
        break;
    }

    const adjustedSpeed = avgSpeed * speedCoefficient;
    const drivingTime = point.distance / adjustedSpeed; // години

    totalDrivingTime += drivingTime;
    totalStopTime += point.stopTime / 60; // переведення хвилин в години
  });

  const totalTime = totalDrivingTime + totalStopTime;

  // Розрахунок витрат палива
  const fuelNeeded = (totalDistance * fuelConsumption) / 100;
  const fuelCost = fuelNeeded * fuelPrice;

  // Оптимізація маршруту (проста версія - сортування за відстанню)
  const optimizedPoints = [...routePoints].sort(
    (a, b) => a.distance - b.distance
  );

  // Розрахунок економії
  const originalDistance = totalDistance;
  const optimizedDistance = optimizedPoints.reduce(
    (sum, point) => sum + point.distance,
    0
  );
  const distanceSavings = originalDistance - optimizedDistance;
  const fuelSavings = ((distanceSavings * fuelConsumption) / 100) * fuelPrice;

  const resultDiv = document.getElementById("routeResult");
  resultDiv.innerHTML = `
                <h4>Аналіз маршруту:</h4>
                <p><strong>Кількість точок:</strong> ${routePoints.length}</p>
                <p><strong>Загальна відстань:</strong> ${totalDistance.toFixed(
                  1
                )} км</p>
                <p><strong>Час у дорозі:</strong> ${(
                  totalDrivingTime * 60
                ).toFixed(0)} хв</p>
                <p><strong>Час зупинок:</strong> ${(totalStopTime * 60).toFixed(
                  0
                )} хв</p>
                <p><strong>Загальний час:</strong> ${(totalTime * 60).toFixed(
                  0
                )} хв</p>
                <p><strong>Витрати палива:</strong> ${fuelNeeded.toFixed(
                  2
                )} л</p>
                <p><strong>Вартість палива:</strong> ${fuelCost.toFixed(
                  2
                )} грн</p>
                
                <h4>Рекомендації з оптимізації:</h4>
                <p>Оптимальний порядок відвідування точок:</p>
                <ol>
                    ${optimizedPoints
                      .map(
                        (point) =>
                          `<li>${point.name} (${point.distance} км)</li>`
                      )
                      .join("")}
                </ol>
                <p><strong>Потенційна економія палива:</strong> ${fuelSavings.toFixed(
                  2
                )} грн</p>
            `;
  resultDiv.style.display = "block";
}

function calculateMaintenance() {
  const vehicleType = document.getElementById("vehicleTypeTO").value;
  const currentMileage = parseFloat(
    document.getElementById("currentMileage").value
  );
  const yearlyMileage = parseFloat(
    document.getElementById("yearlyMileage").value
  );
  const age = parseInt(document.getElementById("vehicleAge2").value);
  const fuelType = document.getElementById("fuelType3").value;
  const maintenanceLevel = document.getElementById("maintenanceLevel").value;

  if (
    !vehicleType ||
    !currentMileage ||
    !yearlyMileage ||
    age === "" ||
    !fuelType ||
    !maintenanceLevel
  ) {
    alert("Будь ласка, заповніть всі обов'язкові поля");
    return;
  }

  // Інтервали ТО для різних типів транспорту (км)
  const maintenanceIntervals = {
    car: {
      petrol: 10000,
      diesel: 15000,
      gas: 10000,
      hybrid: 15000,
      electric: 20000,
    },
    truck: {
      petrol: 15000,
      diesel: 20000,
      gas: 15000,
      hybrid: 20000,
      electric: 25000,
    },
    bus: {
      petrol: 10000,
      diesel: 15000,
      gas: 10000,
      hybrid: 15000,
      electric: 20000,
    },
    motorcycle: {
      petrol: 5000,
      diesel: 0,
      gas: 5000,
      hybrid: 7000,
      electric: 10000,
    },
    special: {
      petrol: 10000,
      diesel: 15000,
      gas: 10000,
      hybrid: 15000,
      electric: 20000,
    },
  };

  // Базові вартості ТО для різних типів транспорту (грн)
  const maintenanceBaseCosts = {
    car: 2000,
    truck: 5000,
    bus: 4000,
    motorcycle: 1000,
    special: 6000,
  };

  // Коефіцієнти для різних рівнів обслуговування
  const levelCoefficients = {
    basic: 0.8,
    standard: 1.0,
    extended: 1.3,
    premium: 1.8,
  };

  // Коефіцієнти для віку транспорту
  const ageCoefficient = 1 + age * 0.05;

  // Розрахунок інтервалу ТО
  const interval = maintenanceIntervals[vehicleType][fuelType];

  // Розрахунок наступного ТО
  const nextMaintenance = Math.ceil(currentMileage / interval) * interval;
  const kmToNextMaintenance = nextMaintenance - currentMileage;
  const timeToNextMaintenance = (kmToNextMaintenance / yearlyMileage) * 12; // місяців

  // Розрахунок вартості наступного ТО
  const baseCost = maintenanceBaseCosts[vehicleType];
  const maintenanceCost =
    baseCost * levelCoefficients[maintenanceLevel] * ageCoefficient;

  // Розрахунок річних витрат на ТО
  const maintenancesPerYear = yearlyMileage / interval;
  const yearlyMaintenanceCost = maintenanceCost * maintenancesPerYear;

  // Генерація графіку ТО на рік
  const maintenanceSchedule = [];
  let scheduleMileage = nextMaintenance;
  let scheduleDate = new Date();
  scheduleDate.setMonth(scheduleDate.getMonth() + timeToNextMaintenance);

  for (let i = 0; i < 5; i++) {
    maintenanceSchedule.push({
      number: i + 1,
      mileage: scheduleMileage,
      date: new Date(scheduleDate),
      cost: maintenanceCost * (1 + i * 0.05), // невелике збільшення вартості з часом
    });

    scheduleMileage += interval;
    scheduleDate.setMonth(
      scheduleDate.getMonth() + (interval / yearlyMileage) * 12
    );
  }

  // Розрахунок прогресу до наступного ТО
  const progressPercent = ((interval - kmToNextMaintenance) / interval) * 100;

  const vehicleNames = {
    car: "Легковий автомобіль",
    truck: "Вантажівка",
    bus: "Автобус",
    motorcycle: "Мотоцикл",
    special: "Спецтехніка",
  };

  const fuelNames = {
    petrol: "Бензин",
    diesel: "Дизель",
    gas: "Газ",
    hybrid: "Гібрид",
    electric: "Електромобіль",
  };

  const levelNames = {
    basic: "Базовий",
    standard: "Стандартний",
    extended: "Розширений",
    premium: "Преміум",
  };

  const resultDiv = document.getElementById("maintenanceResult");
  resultDiv.innerHTML = `
                <h4>Результати розрахунку технічного обслуговування:</h4>
                <p><strong>Тип транспорту:</strong> ${
                  vehicleNames[vehicleType]
                }</p>
                <p><strong>Тип палива:</strong> ${fuelNames[fuelType]}</p>
                <p><strong>Рівень обслуговування:</strong> ${
                  levelNames[maintenanceLevel]
                }</p>
                <p><strong>Інтервал ТО:</strong> ${interval} км</p>
                <p><strong>Поточний пробіг:</strong> ${currentMileage} км</p>
                <p><strong>Наступне ТО:</strong> ${nextMaintenance} км</p>
                <p><strong>Залишилось до ТО:</strong> ${kmToNextMaintenance} км (приблизно ${timeToNextMaintenance.toFixed(
    1
  )} місяців)</p>
                <p><strong>Орієнтовна вартість наступного ТО:</strong> ${maintenanceCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Річні витрати на ТО:</strong> ${yearlyMaintenanceCost.toFixed(
                  2
                )} грн</p>
                
                <h4>Графік ТО на наступний рік:</h4>
            `;

  maintenanceSchedule.forEach((item) => {
    const dateString = item.date.toLocaleDateString("uk-UA");
    resultDiv.innerHTML += `
                    <div class="maintenance-item">
                        <span class="maintenance-name">ТО #${item.number} (${
      item.mileage
    } км)</span>
                        <span class="maintenance-date">${dateString}</span>
                        <span class="maintenance-cost">${item.cost.toFixed(
                          2
                        )} грн</span>
                    </div>
                `;
  });

  resultDiv.style.display = "block";

  // Update progress bar
  const progressBar = document.getElementById("maintenanceProgress");
  const progressText = document.getElementById("progressText");

  progressBar.style.width = `${progressPercent}%`;
  progressText.textContent = `Прогрес до наступного ТО: ${progressPercent.toFixed(
    0
  )}%`;
}

function calculateInsurance() {
  const insuranceType = document.getElementById("insuranceType").value;
  const vehicleType = document.getElementById("vehicleTypeInsurance").value;
  const vehicleValue = parseFloat(
    document.getElementById("vehicleValue").value
  );
  const age = parseInt(document.getElementById("vehicleAge3").value);
  const enginePower = parseFloat(document.getElementById("enginePower").value);
  const driverExperience = document.getElementById("driverExperience").value;
  const accidentHistory = document.getElementById("accidentHistory").value;
  const region = document.getElementById("region").value;

  if (
    !insuranceType ||
    !vehicleType ||
    !vehicleValue ||
    age === "" ||
    !enginePower ||
    !driverExperience ||
    !region
  ) {
    alert("Будь ласка, заповніть всі обов'язкові поля");
    return;
  }

  // Базові тарифи для різних типів страхування (% від вартості авто)
  const baseTariffs = {
    osago: 0.05, // 5% для ОСЦПВ (від базової суми)
    kasko: 0.05, // 5% для КАСКО
    green: 0.03, // 3% для Зеленої карти
    cargo: 0.02, // 2% для страхування вантажу
  };

  // Базові суми для ОСЦПВ
  const osagoBaseSums = {
    car: 130000,
    truck: 260000,
    bus: 260000,
    motorcycle: 130000,
    special: 260000,
  };

  // Коефіцієнти для типів транспорту
  const vehicleCoefficients = {
    car: 1.0,
    truck: 1.5,
    bus: 1.8,
    motorcycle: 1.2,
    special: 1.3,
  };

  // Коефіцієнти для віку транспорту
  const ageCoefficients = {
    0: 1.0, // новий
    1: 1.1, // 1-3 роки
    3: 1.2, // 3-5 років
    5: 1.3, // 5-10 років
    10: 1.5, // більше 10 років
  };

  // Коефіцієнти для потужності двигуна
  let powerCoefficient = 1.0;
  if (enginePower <= 70) {
    powerCoefficient = 0.9;
  } else if (enginePower <= 100) {
    powerCoefficient = 1.0;
  } else if (enginePower <= 150) {
    powerCoefficient = 1.2;
  } else if (enginePower <= 200) {
    powerCoefficient = 1.4;
  } else {
    powerCoefficient = 1.6;
  }

  // Коефіцієнти для стажу водія
  const experienceCoefficients = {
    0: 1.8, // менше 1 року
    1: 1.5, // 1-3 роки
    3: 1.2, // 3-5 років
    5: 1.0, // 5-10 років
    10: 0.8, // більше 10 років
  };

  // Коефіцієнти для історії аварій
  const accidentCoefficients = {
    0: 1.0, // без аварій
    1: 1.5, // 1 аварія
    2: 2.0, // 2 аварії
    3: 2.5, // 3+ аварії
  };

  // Коефіцієнти для регіону
  const regionCoefficients = {
    kyiv: 1.5, // Київ
    oblast: 1.3, // Обласний центр
    town: 1.1, // Місто
    village: 1.0, // Село
  };

  // Розрахунок вартості страхування
  let insuranceCost = 0;

  if (insuranceType === "osago") {
    // ОСЦПВ розраховується від базової суми
    const baseSum = osagoBaseSums[vehicleType];
    insuranceCost =
      baseSum *
      baseTariffs[insuranceType] *
      vehicleCoefficients[vehicleType] *
      experienceCoefficients[driverExperience] *
      accidentCoefficients[accidentHistory] *
      regionCoefficients[region];
  } else {
    // Інші типи страхування розраховуються від вартості авто
    insuranceCost =
      vehicleValue *
      baseTariffs[insuranceType] *
      vehicleCoefficients[vehicleType] *
      ageCoefficients[getAgeGroup(age)] *
      powerCoefficient *
      experienceCoefficients[driverExperience] *
      accidentCoefficients[accidentHistory] *
      regionCoefficients[region];
  }

  // Розрахунок франшизи для КАСКО (5% від вартості авто)
  const franchise = insuranceType === "kasko" ? vehicleValue * 0.05 : 0;

  // Розрахунок знижки за безаварійну їзду
  const noAccidentDiscount = accidentHistory === "0" ? insuranceCost * 0.1 : 0;

  // Фінальна вартість страхування
  const finalCost = insuranceCost - noAccidentDiscount;

  // Порівняння з іншими страховими компаніями (приблизно)
  const otherCompanies = [
    { name: "Компанія A", cost: finalCost * (0.9 + Math.random() * 0.2) },
    { name: "Компанія B", cost: finalCost * (0.9 + Math.random() * 0.2) },
    { name: "Компанія C", cost: finalCost * (0.9 + Math.random() * 0.2) },
  ];

  const insuranceNames = {
    osago: "ОСЦПВ (обов'язкове)",
    kasko: "КАСКО (добровільне)",
    green: "Зелена карта",
    cargo: "Страхування вантажу",
  };

  const vehicleNames = {
    car: "Легковий автомобіль",
    truck: "Вантажівка",
    bus: "Автобус",
    motorcycle: "Мотоцикл",
    special: "Спецтехніка",
  };

  const regionNames = {
    kyiv: "Київ",
    oblast: "Обласний центр",
    town: "Місто",
    village: "Село",
  };

  const resultDiv = document.getElementById("insuranceResult");
  resultDiv.innerHTML = `
                <h4>Результати розрахунку страхування:</h4>
                <p><strong>Тип страхування:</strong> ${
                  insuranceNames[insuranceType]
                }</p>
                <p><strong>Тип транспорту:</strong> ${
                  vehicleNames[vehicleType]
                }</p>
                <p><strong>Вартість транспорту:</strong> ${vehicleValue.toFixed(
                  2
                )} грн</p>
                <p><strong>Вік транспорту:</strong> ${age} років</p>
                <p><strong>Потужність двигуна:</strong> ${enginePower} к.с.</p>
                <p><strong>Стаж водія:</strong> ${getExperienceName(
                  driverExperience
                )}</p>
                <p><strong>Історія аварій:</strong> ${accidentHistory} аварій</p>
                <p><strong>Регіон:</strong> ${regionNames[region]}</p>
                <p><strong>Базова вартість страхування:</strong> ${insuranceCost.toFixed(
                  2
                )} грн</p>
                ${
                  noAccidentDiscount > 0
                    ? `<p><strong>Знижка за безаварійну їзду:</strong> ${noAccidentDiscount.toFixed(
                        2
                      )} грн</p>`
                    : ""
                }
                ${
                  franchise > 0
                    ? `<p><strong>Франшиза:</strong> ${franchise.toFixed(
                        2
                      )} грн</p>`
                    : ""
                }
                <p><strong>Фінальна вартість страхування:</strong> ${finalCost.toFixed(
                  2
                )} грн</p>
                
                <h4>Порівняння з іншими компаніями:</h4>
            `;

  otherCompanies.forEach((company) => {
    resultDiv.innerHTML += `
                    <p><strong>${company.name}:</strong> ${company.cost.toFixed(
      2
    )} грн</p>
                `;
  });

  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("insuranceChart").getContext("2d");

  if (window.insuranceChart) {
    window.insuranceChart.destroy();
  }

  const companies = ["Наша компанія", ...otherCompanies.map((c) => c.name)];
  const costs = [finalCost, ...otherCompanies.map((c) => c.cost)];

  window.insuranceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: companies,
      datasets: [
        {
          label: "Вартість страхування (грн)",
          data: costs,
          backgroundColor: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Допоміжні функції
function getAgeGroup(age) {
  if (age === 0) return 0;
  if (age <= 3) return 1;
  if (age <= 5) return 3;
  if (age <= 10) return 5;
  return 10;
}

function getExperienceName(experience) {
  switch (experience) {
    case "0":
      return "Менше 1 року";
    case "1":
      return "1-3 роки";
    case "3":
      return "3-5 років";
    case "5":
      return "5-10 років";
    case "10":
      return "Більше 10 років";
    default:
      return "";
  }
}
