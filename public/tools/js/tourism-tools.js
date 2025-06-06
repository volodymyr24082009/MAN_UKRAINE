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

// Tourism calculator functions
function calculateTravelCost() {
  const travelType = document.getElementById("travelType").value;
  const days = parseInt(document.getElementById("travelDays").value);
  const travelers = parseInt(document.getElementById("travelers").value);
  const flightCost =
    parseFloat(document.getElementById("flightCost").value) || 0;
  const accommodationCost =
    parseFloat(document.getElementById("accommodationCost").value) || 0;
  const foodCost = parseFloat(document.getElementById("foodCost").value) || 0;
  const transportCost =
    parseFloat(document.getElementById("transportCost").value) || 0;
  const entertainmentCost =
    parseFloat(document.getElementById("entertainmentCost").value) || 0;
  const shoppingCost =
    parseFloat(document.getElementById("shoppingCost").value) || 0;
  const insuranceCost =
    parseFloat(document.getElementById("insuranceCost").value) || 0;
  const visaCost = parseFloat(document.getElementById("visaCost").value) || 0;

  if (!travelType || !days || !travelers) {
    alert("Будь ласка, заповніть основні поля");
    return;
  }

  const totalFlightCost = flightCost * travelers;
  const totalAccommodationCost = accommodationCost * days;
  const totalFoodCost = foodCost * days * travelers;
  const totalTransportCost = transportCost * days * travelers;
  const totalEntertainmentCost = entertainmentCost * days * travelers;
  const totalShoppingCost = shoppingCost * travelers;
  const totalInsuranceCost = insuranceCost * travelers;
  const totalVisaCost = visaCost * travelers;

  const totalCost =
    totalFlightCost +
    totalAccommodationCost +
    totalFoodCost +
    totalTransportCost +
    totalEntertainmentCost +
    totalShoppingCost +
    totalInsuranceCost +
    totalVisaCost;

  const costPerPerson = totalCost / travelers;
  const costPerDay = totalCost / days;

  const resultDiv = document.getElementById("travelCostResult");
  resultDiv.innerHTML = `
                <h4>Загальна вартість подорожі:</h4>
                <p><strong>Авіаквитки:</strong> ${totalFlightCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Проживання:</strong> ${totalAccommodationCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Харчування:</strong> ${totalFoodCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Транспорт:</strong> ${totalTransportCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Розваги:</strong> ${totalEntertainmentCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Покупки:</strong> ${totalShoppingCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Страхування:</strong> ${totalInsuranceCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Віза та документи:</strong> ${totalVisaCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Загальна вартість:</strong> ${totalCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Вартість на особу:</strong> ${costPerPerson.toFixed(
                  2
                )} грн</p>
                <p><strong>Вартість за день:</strong> ${costPerDay.toFixed(
                  2
                )} грн</p>
            `;
  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("travelCostChart").getContext("2d");

  // Destroy previous chart if exists
  if (window.travelCostChart) {
    window.travelCostChart.destroy();
  }

  const chartData = [
    totalFlightCost,
    totalAccommodationCost,
    totalFoodCost,
    totalTransportCost,
    totalEntertainmentCost,
    totalShoppingCost,
    totalInsuranceCost,
    totalVisaCost,
  ].filter((value) => value > 0);

  const chartLabels = [
    "Авіаквитки",
    "Проживання",
    "Харчування",
    "Транспорт",
    "Розваги",
    "Покупки",
    "Страхування",
    "Віза",
  ].filter(
    (label, index) =>
      [
        totalFlightCost,
        totalAccommodationCost,
        totalFoodCost,
        totalTransportCost,
        totalEntertainmentCost,
        totalShoppingCost,
        totalInsuranceCost,
        totalVisaCost,
      ][index] > 0
  );

  window.travelCostChart = new Chart(ctx, {
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
            "#14b8a6",
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

function convertTravelCurrency() {
  const amount = parseFloat(document.getElementById("travelAmount").value);
  const fromCurrency = document.getElementById("fromTravelCurrency").value;
  const toCurrency = document.getElementById("toTravelCurrency").value;

  if (!amount) {
    alert("Будь ласка, введіть суму для конвертації");
    return;
  }

  // Курси валют відносно гривні (UAH)
  const rates = {
    UAH: 1,
    USD: 0.025,
    EUR: 0.023,
    GBP: 0.02,
    PLN: 0.1,
    CZK: 0.55,
    HUF: 8.5,
    RON: 0.11,
    TRY: 0.75,
  };

  // Конвертація
  const amountInUAH =
    fromCurrency === "UAH" ? amount : amount / rates[fromCurrency];
  const convertedAmount =
    toCurrency === "UAH" ? amountInUAH : amountInUAH * rates[toCurrency];

  const exchangeRate =
    toCurrency === "UAH"
      ? 1 / rates[fromCurrency]
      : fromCurrency === "UAH"
      ? rates[toCurrency]
      : rates[toCurrency] / rates[fromCurrency];

  const resultDiv = document.getElementById("travelCurrencyResult");
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
            `;
  resultDiv.style.display = "block";
}

function calculateTravelBudget() {
  const dailyBudget = parseFloat(document.getElementById("dailyBudget").value);
  const days = parseInt(document.getElementById("budgetDays").value);
  const toCurrency = document.getElementById("toTravelCurrency").value;

  if (!dailyBudget || !days) {
    alert("Будь ласка, введіть щоденний бюджет та кількість днів");
    return;
  }

  const totalBudgetUAH = dailyBudget * days;

  // Конвертація в обрану валюту
  const rates = {
    UAH: 1,
    USD: 0.025,
    EUR: 0.023,
    GBP: 0.02,
    PLN: 0.1,
    CZK: 0.55,
    HUF: 8.5,
    RON: 0.11,
    TRY: 0.75,
  };

  const totalBudgetConverted = totalBudgetUAH * rates[toCurrency];
  const dailyBudgetConverted = dailyBudget * rates[toCurrency];

  const resultDiv = document.getElementById("travelBudgetResult");
  resultDiv.innerHTML = `
                <h4>Бюджет подорожі:</h4>
                <p><strong>Щоденний бюджет:</strong> ${dailyBudget.toFixed(
                  2
                )} UAH (${dailyBudgetConverted.toFixed(2)} ${toCurrency})</p>
                <p><strong>Загальний бюджет:</strong> ${totalBudgetUAH.toFixed(
                  2
                )} UAH (${totalBudgetConverted.toFixed(2)} ${toCurrency})</p>
                <p><strong>Кількість днів:</strong> ${days}</p>
            `;
  resultDiv.style.display = "block";
}

function calculateHotelBudget() {
  const nights = parseInt(document.getElementById("hotelNights").value);
  const guests = parseInt(document.getElementById("hotelGuests").value);
  const hostelPrice =
    parseFloat(document.getElementById("hostelPrice").value) || 0;
  const budgetHotelPrice =
    parseFloat(document.getElementById("budgetHotelPrice").value) || 0;
  const midRangeHotelPrice =
    parseFloat(document.getElementById("midRangeHotelPrice").value) || 0;
  const luxuryHotelPrice =
    parseFloat(document.getElementById("luxuryHotelPrice").value) || 0;
  const airbnbPrice =
    parseFloat(document.getElementById("airbnbPrice").value) || 0;
  const cityTax = parseFloat(document.getElementById("cityTax").value) || 0;
  const parkingFee =
    parseFloat(document.getElementById("parkingFee").value) || 0;
  const breakfastFee =
    parseFloat(document.getElementById("breakfastFee").value) || 0;

  if (!nights || !guests) {
    alert("Будь ласка, введіть кількість ночей та гостей");
    return;
  }

  const additionalCosts =
    (cityTax + parkingFee) * nights + breakfastFee * nights * guests;

  const accommodationOptions = [];

  if (hostelPrice > 0) {
    const total = hostelPrice * nights * guests + additionalCosts;
    accommodationOptions.push({
      name: "Хостел",
      price: hostelPrice,
      total: total,
    });
  }

  if (budgetHotelPrice > 0) {
    const total = budgetHotelPrice * nights + additionalCosts;
    accommodationOptions.push({
      name: "Бюджетний готель",
      price: budgetHotelPrice,
      total: total,
    });
  }

  if (midRangeHotelPrice > 0) {
    const total = midRangeHotelPrice * nights + additionalCosts;
    accommodationOptions.push({
      name: "Готель середнього класу",
      price: midRangeHotelPrice,
      total: total,
    });
  }

  if (luxuryHotelPrice > 0) {
    const total = luxuryHotelPrice * nights + additionalCosts;
    accommodationOptions.push({
      name: "Розкішний готель",
      price: luxuryHotelPrice,
      total: total,
    });
  }

  if (airbnbPrice > 0) {
    const total = airbnbPrice * nights + additionalCosts;
    accommodationOptions.push({
      name: "Airbnb",
      price: airbnbPrice,
      total: total,
    });
  }

  if (accommodationOptions.length === 0) {
    alert("Будь ласка, введіть ціни для хоча б одного типу проживання");
    return;
  }

  // Сортування за загальною вартістю
  accommodationOptions.sort((a, b) => a.total - b.total);

  let resultHTML = "<h4>Порівняння варіантів проживання:</h4>";
  accommodationOptions.forEach((option, index) => {
    const savings =
      index > 0 ? option.total - accommodationOptions[0].total : 0;
    resultHTML += `
                    <p><strong>${option.name}:</strong> ${option.total.toFixed(
      2
    )} грн 
                    ${
                      index === 0
                        ? "(найдешевший)"
                        : `(+${savings.toFixed(2)} грн)`
                    }</p>
                `;
  });

  resultHTML += `<p><strong>Додаткові витрати:</strong> ${additionalCosts.toFixed(
    2
  )} грн</p>`;

  const resultDiv = document.getElementById("hotelBudgetResult");
  resultDiv.innerHTML = resultHTML;
  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("hotelBudgetChart").getContext("2d");

  // Destroy previous chart if exists
  if (window.hotelBudgetChart) {
    window.hotelBudgetChart.destroy();
  }

  window.hotelBudgetChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: accommodationOptions.map((option) => option.name),
      datasets: [
        {
          label: "Загальна вартість (грн)",
          data: accommodationOptions.map((option) => option.total),
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

// Route planner
let routePoints = [];

function addRoutePoint() {
  const point = document.getElementById("routePoint").value;
  const transport = document.getElementById("transportMode").value;
  const duration = parseFloat(document.getElementById("stayDuration").value);

  if (!point || !duration) {
    alert("Будь ласка, введіть назву місця та тривалість перебування");
    return;
  }

  routePoints.push({
    name: point,
    transport: transport,
    duration: duration,
  });

  // Clear inputs
  document.getElementById("routePoint").value = "";
  document.getElementById("stayDuration").value = "";

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
    name.textContent = `${point.name} (${getTransportName(point.transport)}, ${
      point.duration
    } год)`;

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

function getTransportName(transport) {
  const names = {
    car: "Автомобіль",
    train: "Поїзд",
    bus: "Автобус",
    plane: "Літак",
    walking: "Пішки",
  };
  return names[transport] || transport;
}

function calculateRoute() {
  if (routePoints.length < 2) {
    alert("Додайте принаймні 2 точки маршруту");
    return;
  }

  const totalDuration = routePoints.reduce(
    (sum, point) => sum + point.duration,
    0
  );
  const totalDays = Math.ceil(totalDuration / 24);

  // Приблизний розрахунок відстані та часу в дорозі
  const estimatedTravelTime = (routePoints.length - 1) * 3; // 3 години між точками
  const totalTime = totalDuration + estimatedTravelTime;

  const resultDiv = document.getElementById("routeResult");
  resultDiv.innerHTML = `
                <h4>Аналіз маршруту:</h4>
                <p><strong>Кількість точок:</strong> ${routePoints.length}</p>
                <p><strong>Загальний час перебування:</strong> ${totalDuration} годин</p>
                <p><strong>Орієнтовний час в дорозі:</strong> ${estimatedTravelTime} годин</p>
                <p><strong>Загальний час подорожі:</strong> ${totalTime} годин</p>
                <p><strong>Рекомендована тривалість:</strong> ${totalDays} днів</p>
                <h4>Маршрут:</h4>
                <ol>
                    ${routePoints
                      .map(
                        (point) =>
                          `<li>${point.name} (${
                            point.duration
                          } год, ${getTransportName(point.transport)})</li>`
                      )
                      .join("")}
                </ol>
            `;
  resultDiv.style.display = "block";
}

function calculateTimeZone() {
  const homeCity = document.getElementById("homeCity").value;
  const destinationCity = document.getElementById("destinationCity").value;
  const meetingTime = document.getElementById("meetingTime").value;

  if (!homeCity || !destinationCity) {
    alert("Будь ласка, оберіть обидва міста");
    return;
  }

  // Часові пояси (UTC offset)
  const timezones = {
    Kiev: 2,
    Lviv: 2,
    Odesa: 2,
    Kharkiv: 2,
    London: 0,
    Paris: 1,
    Berlin: 1,
    Rome: 1,
    Madrid: 1,
    Warsaw: 1,
    Prague: 1,
    Vienna: 1,
    Budapest: 1,
    Istanbul: 3,
    Dubai: 4,
    Bangkok: 7,
    Tokyo: 9,
    Sydney: 10,
    New_York: -5,
    Los_Angeles: -8,
  };

  const homeOffset = timezones[homeCity];
  const destinationOffset = timezones[destinationCity];
  const timeDifference = destinationOffset - homeOffset;

  const now = new Date();
  const homeTime = new Date(now.getTime() + homeOffset * 60 * 60 * 1000);
  const destinationTime = new Date(
    now.getTime() + destinationOffset * 60 * 60 * 1000
  );

  const timezoneDisplay = document.getElementById("timezoneDisplay");
  timezoneDisplay.innerHTML = `
                <div class="timezone-card">
                    <div class="timezone-time">${homeTime.toLocaleTimeString(
                      "uk-UA",
                      { hour: "2-digit", minute: "2-digit" }
                    )}</div>
                    <div class="timezone-label">${homeCity}</div>
                </div>
                <div class="timezone-card">
                    <div class="timezone-time">${destinationTime.toLocaleTimeString(
                      "uk-UA",
                      { hour: "2-digit", minute: "2-digit" }
                    )}</div>
                    <div class="timezone-label">${destinationCity}</div>
                </div>
            `;

  let resultHTML = `
                <h4>Інформація про часові пояси:</h4>
                <p><strong>Різниця в часі:</strong> ${Math.abs(
                  timeDifference
                )} годин</p>
                <p><strong>${destinationCity}</strong> ${
    timeDifference > 0 ? "попереду" : "позаду"
  } на ${Math.abs(timeDifference)} годин</p>
            `;

  if (meetingTime) {
    const [hours, minutes] = meetingTime.split(":").map(Number);
    const meetingHours = (hours + timeDifference + 24) % 24;
    const meetingTimeDestination = `${meetingHours
      .toString()
      .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    resultHTML += `
                    <p><strong>Час зустрічі:</strong></p>
                    <p>${homeCity}: ${meetingTime}</p>
                    <p>${destinationCity}: ${meetingTimeDestination}</p>
                `;
  }

  const resultDiv = document.getElementById("timezoneResult");
  resultDiv.innerHTML = resultHTML;
  resultDiv.style.display = "block";
}

function generatePackingList() {
  const tripType = document.getElementById("tripType").value;
  const days = parseInt(document.getElementById("packingDays").value);
  const season = document.getElementById("season").value;
  const climate = document.getElementById("climate").value;
  const baggageType = document.getElementById("baggageType").value;
  const weightLimit = parseFloat(document.getElementById("weightLimit").value);

  if (!tripType || !days || !season || !climate) {
    alert("Будь ласка, заповніть усі основні поля");
    return;
  }

  const packingLists = {
    essentials: [
      "Паспорт",
      "Квитки",
      "Страховка",
      "Гроші/картки",
      "Телефон",
      "Зарядний пристрій",
    ],
    clothing: [],
    toiletries: ["Зубна щітка", "Зубна паста", "Шампунь", "Мило", "Дезодорант"],
    electronics: ["Телефон", "Зарядний пристрій", "Адаптер"],
    medical: ["Аптечка", "Ліки", "Сонцезахисний крем"],
    accessories: [],
  };

  // Одяг залежно від сезону та клімату
  if (season === "summer" || climate === "tropical") {
    packingLists.clothing.push(
      "Футболки",
      "Шорти",
      "Сукні",
      "Сандалі",
      "Сонячні окуляри",
      "Капелюх"
    );
  }

  if (season === "winter" || climate === "cold") {
    packingLists.clothing.push(
      "Куртка",
      "Светри",
      "Теплі штани",
      "Зимове взуття",
      "Рукавички",
      "Шапка"
    );
  }

  if (season === "spring" || season === "autumn") {
    packingLists.clothing.push(
      "Легка куртка",
      "Джинси",
      "Светр",
      "Кросівки",
      "Дощовик"
    );
  }

  // Додаткові речі залежно від типу подорожі
  switch (tripType) {
    case "business":
      packingLists.clothing.push(
        "Костюм",
        "Сорочки",
        "Краватка",
        "Класичне взуття"
      );
      packingLists.accessories.push("Ноутбук", "Документи", "Візитки");
      break;

    case "beach":
      packingLists.clothing.push("Купальник", "Пляжний рушник", "В'єтнамки");
      packingLists.accessories.push("Пляжна сумка", "Книга");
      break;

    case "adventure":
      packingLists.clothing.push(
        "Трекінгове взуття",
        "Спортивний одяг",
        "Дощовик"
      );
      packingLists.accessories.push("Рюкзак", "Ліхтарик", "Мультитул");
      break;

    case "winter":
      packingLists.clothing.push(
        "Лижний костюм",
        "Термобілизна",
        "Лижні рукавички"
      );
      packingLists.accessories.push("Лижні окуляри", "Крем від обмороження");
      break;
  }

  // Розрахунок кількості одягу
  const clothingMultiplier = Math.min(days, 7); // Максимум на тиждень

  let resultHTML = "<h4>Список речей для упаковки:</h4>";

  Object.keys(packingLists).forEach((category) => {
    if (packingLists[category].length > 0) {
      const categoryNames = {
        essentials: "Документи та необхідне",
        clothing: "Одяг",
        toiletries: "Туалетні приналежності",
        electronics: "Електроніка",
        medical: "Медичні засоби",
        accessories: "Аксесуари",
      };

      resultHTML += `<div class="packing-category">`;
      resultHTML += `<h5>${categoryNames[category]}:</h5>`;

      packingLists[category].forEach((item) => {
        const quantity = category === "clothing" ? clothingMultiplier : 1;
        resultHTML += `
                            <div class="packing-item">
                                <input type="checkbox" class="packing-checkbox">
                                <span>${item}${
          quantity > 1 ? ` (${quantity} шт)` : ""
        }</span>
                            </div>
                        `;
      });

      resultHTML += `</div>`;
    }
  });

  if (weightLimit) {
    resultHTML += `<p><strong>Ліміт ваги:</strong> ${weightLimit} кг</p>`;
    resultHTML += `<p><strong>Рекомендація:</strong> Зважте речі перед упаковкою</p>`;
  }

  const resultDiv = document.getElementById("packingResult");
  resultDiv.innerHTML = resultHTML;
  resultDiv.style.display = "block";
}
