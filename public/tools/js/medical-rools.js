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

// Medical calculator functions
function calculateBMI() {
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  const gender = document.getElementById("gender").value;

  if (!weight || !height || !gender) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);

  let category = "";
  let recommendation = "";

  if (bmi < 18.5) {
    category = "Недостатня вага";
    recommendation =
      "Рекомендується збільшити калорійність раціону та проконсультуватися з дієтологом";
  } else if (bmi < 25) {
    category = "Нормальна вага";
    recommendation =
      "Підтримуйте здоровий спосіб життя та збалансоване харчування";
  } else if (bmi < 30) {
    category = "Надлишкова вага";
    recommendation =
      "Рекомендується зменшити калорійність раціону та збільшити фізичну активність";
  } else {
    category = "Ожиріння";
    recommendation =
      "Обов'язково проконсультуйтеся з лікарем для розробки плану зниження ваги";
  }

  const resultDiv = document.getElementById("bmiResult");
  resultDiv.innerHTML = `
                <h4>Результат розрахунку ІМТ:</h4>
                <p><strong>ІМТ:</strong> ${bmi.toFixed(1)} кг/м²</p>
                <p><strong>Категорія:</strong> ${category}</p>
                <p><strong>Рекомендації:</strong> ${recommendation}</p>
            `;
  resultDiv.style.display = "block";
}

function calculateDosage() {
  const weight = parseFloat(document.getElementById("patientWeight").value);
  const dosagePerKg = parseFloat(document.getElementById("dosagePerKg").value);
  const frequency = parseInt(document.getElementById("frequency").value);
  const days = parseInt(document.getElementById("treatmentDays").value);

  if (!weight || !dosagePerKg || !frequency || !days) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const singleDose = weight * dosagePerKg;
  const dailyDose = singleDose * frequency;
  const totalDose = dailyDose * days;

  const resultDiv = document.getElementById("dosageResult");
  resultDiv.innerHTML = `
                <h4>Розрахунок дозування:</h4>
                <p><strong>Разова доза:</strong> ${singleDose.toFixed(1)} мг</p>
                <p><strong>Добова доза:</strong> ${dailyDose.toFixed(1)} мг</p>
                <p><strong>Загальна доза на курс:</strong> ${totalDose.toFixed(
                  1
                )} мг</p>
                <p><strong>Режим прийому:</strong> ${singleDose.toFixed(
                  1
                )} мг ${frequency} раз(и) на день</p>
            `;
  resultDiv.style.display = "block";
}

function analyzeBP() {
  const systolic = parseInt(document.getElementById("systolic").value);
  const diastolic = parseInt(document.getElementById("diastolic").value);
  const age = parseInt(document.getElementById("patientAge").value);

  if (!systolic || !diastolic || !age) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  let category = "";
  let recommendation = "";
  let color = "var(--success-color)";

  if (systolic < 90 || diastolic < 60) {
    category = "Гіпотонія (низький тиск)";
    recommendation =
      "Рекомендується консультація лікаря. Можливі причини: зневоднення, серцеві проблеми";
    color = "var(--warning-color)";
  } else if (systolic < 120 && diastolic < 80) {
    category = "Нормальний тиск";
    recommendation = "Відмінно! Підтримуйте здоровий спосіб життя";
  } else if (systolic < 130 && diastolic < 80) {
    category = "Підвищений тиск";
    recommendation =
      "Слідкуйте за тиском, зменште споживання солі, збільште фізичну активність";
    color = "var(--warning-color)";
  } else if (systolic < 140 || diastolic < 90) {
    category = "Гіпертонія 1 ступеня";
    recommendation =
      "Рекомендується консультація лікаря та зміна способу життя";
    color = "var(--danger-color)";
  } else if (systolic < 180 || diastolic < 120) {
    category = "Гіпертонія 2 ступеня";
    recommendation =
      "Обов'язкова консультація лікаря та медикаментозне лікування";
    color = "var(--danger-color)";
  } else {
    category = "Гіпертонічний криз";
    recommendation =
      "НЕГАЙНО зверніться до лікаря або викличте швидку допомогу!";
    color = "var(--danger-color)";
  }

  const resultDiv = document.getElementById("bpResult");
  resultDiv.innerHTML = `
                <h4>Аналіз артеріального тиску:</h4>
                <p><strong>Тиск:</strong> ${systolic}/${diastolic} мм рт.ст.</p>
                <p><strong>Категорія:</strong> <span style="color: ${color}">${category}</span></p>
                <p><strong>Рекомендації:</strong> ${recommendation}</p>
            `;
  resultDiv.style.display = "block";
}

function calculateCalories() {
  const age = parseInt(document.getElementById("calAge").value);
  const gender = document.getElementById("calGender").value;
  const weight = parseFloat(document.getElementById("calWeight").value);
  const height = parseFloat(document.getElementById("calHeight").value);
  const activity = parseFloat(document.getElementById("activityLevel").value);

  if (!age || !gender || !weight || !height || !activity) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  // Формула Міффліна-Сан Жеора
  let bmr;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const tdee = bmr * activity;
  const protein = weight * 1.6; // г/кг
  const fat = (tdee * 0.25) / 9; // 25% від калорій
  const carbs = (tdee - protein * 4 - fat * 9) / 4;

  const resultDiv = document.getElementById("calorieResult");
  resultDiv.innerHTML = `
                <h4>Денна норма калорій:</h4>
                <p><strong>Базовий метаболізм:</strong> ${Math.round(
                  bmr
                )} ккал</p>
                <p><strong>Загальні витрати:</strong> ${Math.round(
                  tdee
                )} ккал</p>
                <h4>Макронутрієнти:</h4>
                <p><strong>Білки:</strong> ${Math.round(
                  protein
                )} г (${Math.round(protein * 4)} ккал)</p>
                <p><strong>Жири:</strong> ${Math.round(fat)} г (${Math.round(
    fat * 9
  )} ккал)</p>
                <p><strong>Вуглеводи:</strong> ${Math.round(
                  carbs
                )} г (${Math.round(carbs * 4)} ккал)</p>
            `;
  resultDiv.style.display = "block";
}

function calculateMedicalCost() {
  let totalCost = 0;
  const services = [
    "consultation",
    "bloodTest",
    "urine",
    "ecg",
    "ultrasound",
    "xray",
  ];
  const selectedServices = [];

  services.forEach((service) => {
    const checkbox = document.getElementById(service);
    if (checkbox.checked) {
      totalCost += parseInt(checkbox.value);
      selectedServices.push(checkbox.nextElementSibling.textContent);
    }
  });

  const additionalCost =
    parseFloat(document.getElementById("additionalCost").value) || 0;
  totalCost += additionalCost;

  const resultDiv = document.getElementById("medicalCostResult");
  resultDiv.innerHTML = `
                <h4>Розрахунок медичних витрат:</h4>
                <p><strong>Обрані послуги:</strong></p>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                    ${selectedServices
                      .map((service) => `<li>${service}</li>`)
                      .join("")}
                </ul>
                ${
                  additionalCost > 0
                    ? `<p><strong>Додаткові витрати:</strong> ${additionalCost} грн</p>`
                    : ""
                }
                <p><strong>Загальна вартість:</strong> ${totalCost} грн</p>
            `;
  resultDiv.style.display = "block";
}

function calculateHeartRateZones() {
  const age = parseInt(document.getElementById("hrAge").value);
  const restingHR = parseInt(document.getElementById("restingHR").value);

  if (!age || !restingHR) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const maxHR = 220 - age;
  const hrReserve = maxHR - restingHR;

  // Зони за методом Карвонена
  const zones = {
    "Відновлення (50-60%)": {
      min: Math.round(restingHR + hrReserve * 0.5),
      max: Math.round(restingHR + hrReserve * 0.6),
    },
    "Аеробна база (60-70%)": {
      min: Math.round(restingHR + hrReserve * 0.6),
      max: Math.round(restingHR + hrReserve * 0.7),
    },
    "Аеробна (70-80%)": {
      min: Math.round(restingHR + hrReserve * 0.7),
      max: Math.round(restingHR + hrReserve * 0.8),
    },
    "Анаеробна (80-90%)": {
      min: Math.round(restingHR + hrReserve * 0.8),
      max: Math.round(restingHR + hrReserve * 0.9),
    },
    "Максимальна (90-100%)": {
      min: Math.round(restingHR + hrReserve * 0.9),
      max: maxHR,
    },
  };

  const resultDiv = document.getElementById("heartRateResult");
  resultDiv.innerHTML = `
                <h4>Зони пульсу для тренувань:</h4>
                <p><strong>Максимальний пульс:</strong> ${maxHR} уд/хв</p>
                <p><strong>Пульсовий резерв:</strong> ${hrReserve} уд/хв</p>
                <div style="margin-top: 1rem;">
                    ${Object.entries(zones)
                      .map(
                        ([zone, range]) =>
                          `<p><strong>${zone}:</strong> ${range.min}-${range.max} уд/хв</p>`
                      )
                      .join("")}
                </div>
            `;
  resultDiv.style.display = "block";
}
