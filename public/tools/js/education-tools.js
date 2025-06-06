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

// Education calculator functions
function calculateTuition() {
  const tuitionFee =
    parseFloat(document.getElementById("tuitionFee").value) || 0;
  const studyYears = parseInt(document.getElementById("studyYears").value) || 0;
  const accommodationCost =
    parseFloat(document.getElementById("accommodationCost").value) || 0;
  const booksCost = parseFloat(document.getElementById("booksCost").value) || 0;
  const livingExpenses =
    parseFloat(document.getElementById("livingExpenses").value) || 0;

  if (!studyYears) {
    alert("Будь ласка, вкажіть тривалість навчання");
    return;
  }

  const monthsPerYear = 10; // Навчальний рік

  const totalTuition = tuitionFee * studyYears;
  const totalAccommodation = accommodationCost * monthsPerYear * studyYears;
  const totalBooks = booksCost * studyYears;
  const totalLiving = livingExpenses * monthsPerYear * studyYears;

  const totalCost =
    totalTuition + totalAccommodation + totalBooks + totalLiving;
  const yearlyAverage = totalCost / studyYears;
  const monthlyAverage = yearlyAverage / monthsPerYear;

  const resultDiv = document.getElementById("tuitionResult");
  resultDiv.innerHTML = `
                <h4>Загальна вартість навчання:</h4>
                <p><strong>Плата за навчання:</strong> ${totalTuition.toFixed(
                  2
                )} грн</p>
                <p><strong>Проживання:</strong> ${totalAccommodation.toFixed(
                  2
                )} грн</p>
                <p><strong>Книги та матеріали:</strong> ${totalBooks.toFixed(
                  2
                )} грн</p>
                <p><strong>Інші витрати:</strong> ${totalLiving.toFixed(
                  2
                )} грн</p>
                <p><strong>Загальна вартість:</strong> ${totalCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Середньорічні витрати:</strong> ${yearlyAverage.toFixed(
                  2
                )} грн</p>
                <p><strong>Середньомісячні витрати:</strong> ${monthlyAverage.toFixed(
                  2
                )} грн</p>
            `;
  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("tuitionChart").getContext("2d");

  // Destroy previous chart if exists
  if (window.tuitionChart) {
    window.tuitionChart.destroy();
  }

  window.tuitionChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: [
        "Плата за навчання",
        "Проживання",
        "Книги та матеріали",
        "Інші витрати",
      ],
      datasets: [
        {
          data: [totalTuition, totalAccommodation, totalBooks, totalLiving],
          backgroundColor: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"],
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

function calculateScholarship() {
  const scholarshipType = document.getElementById("scholarshipType").value;
  const averageGrade = parseFloat(
    document.getElementById("averageGrade").value
  );
  const socialCategory = document.getElementById("socialCategory").value;
  const achievementLevel = document.getElementById("achievementLevel").value;

  if (!scholarshipType || !averageGrade) {
    alert("Будь ласка, оберіть тип стипендії та введіть середній бал");
    return;
  }

  let baseAmount = 0;
  let socialBonus = 0;
  let achievementBonus = 0;
  let totalAmount = 0;
  let eligibility = true;
  let message = "";

  // Базова стипендія
  switch (scholarshipType) {
    case "academic":
      if (averageGrade >= 90) {
        baseAmount = 2500; // Підвищена академічна
        message = "Ви маєте право на підвищену академічну стипендію";
      } else if (averageGrade >= 80) {
        baseAmount = 2000; // Звичайна академічна
        message = "Ви маєте право на академічну стипендію";
      } else {
        eligibility = false;
        message =
          "Для отримання академічної стипендії потрібен середній бал не менше 80";
      }
      break;

    case "social":
      if (socialCategory === "none") {
        eligibility = false;
        message =
          "Для отримання соціальної стипендії потрібно належати до пільгової категорії";
      } else {
        baseAmount = 2500;
        message = "Ви маєте право на соціальну стипендію";
      }
      break;

    case "president":
      if (averageGrade >= 95 && achievementLevel !== "none") {
        baseAmount = 4500;
        message = "Ви маєте право на президентську стипендію";
      } else {
        eligibility = false;
        message =
          "Для отримання президентської стипендії потрібен середній бал не менше 95 та особливі досягнення";
      }
      break;

    case "international":
      if (averageGrade >= 90 && achievementLevel !== "none") {
        baseAmount = 6000;
        message = "Ви можете претендувати на міжнародну стипендію";
      } else {
        eligibility = false;
        message =
          "Для отримання міжнародної стипендії потрібен середній бал не менше 90 та особливі досягнення";
      }
      break;
  }

  // Соціальні бонуси
  if (eligibility && scholarshipType !== "social") {
    switch (socialCategory) {
      case "orphan":
        socialBonus = 1000;
        break;
      case "disability":
        socialBonus = 800;
        break;
      case "low_income":
        socialBonus = 600;
        break;
      case "chornobyl":
        socialBonus = 500;
        break;
    }
  }

  // Бонуси за досягнення
  if (eligibility && scholarshipType !== "president") {
    switch (achievementLevel) {
      case "olympiad":
        achievementBonus = 1000;
        break;
      case "research":
        achievementBonus = 800;
        break;
      case "sport":
        achievementBonus = 700;
        break;
      case "volunteer":
        achievementBonus = 500;
        break;
    }
  }

  totalAmount = baseAmount + socialBonus + achievementBonus;

  const resultDiv = document.getElementById("scholarshipResult");

  if (eligibility) {
    resultDiv.innerHTML = `
                    <h4>Результати розрахунку стипендії:</h4>
                    <p><strong>Базова стипендія:</strong> ${baseAmount.toFixed(
                      2
                    )} грн</p>
                    ${
                      socialBonus > 0
                        ? `<p><strong>Соціальна надбавка:</strong> ${socialBonus.toFixed(
                            2
                          )} грн</p>`
                        : ""
                    }
                    ${
                      achievementBonus > 0
                        ? `<p><strong>Надбавка за досягнення:</strong> ${achievementBonus.toFixed(
                            2
                          )} грн</p>`
                        : ""
                    }
                    <p><strong>Загальна сума стипендії:</strong> ${totalAmount.toFixed(
                      2
                    )} грн</p>
                    <p>${message}</p>
                `;
  } else {
    resultDiv.innerHTML = `
                    <h4>Результати розрахунку стипендії:</h4>
                    <p>${message}</p>
                `;
  }

  resultDiv.style.display = "block";
}

function calculateZNO() {
  const ukrainianScore = parseFloat(
    document.getElementById("ukrainianScore").value
  );
  const mathScore = parseFloat(document.getElementById("mathScore").value);
  const thirdSubjectScore = parseFloat(
    document.getElementById("thirdSubjectScore").value
  );
  const thirdSubject = document.getElementById("thirdSubject").value;
  const schoolGPA = parseFloat(document.getElementById("schoolGPA").value);
  const additionalPoints = parseFloat(
    document.getElementById("additionalPoints").value
  );
  const regionCoefficient = parseFloat(
    document.getElementById("regionCoefficient").value
  );

  if (
    !ukrainianScore ||
    !mathScore ||
    !thirdSubjectScore ||
    !thirdSubject ||
    !schoolGPA
  ) {
    alert("Будь ласка, заповніть усі обов'язкові поля");
    return;
  }

  // Коефіцієнти предметів (приклад)
  const subjectCoefficients = {
    ukrainian: 0.3,
    math: 0.3,
    history: 0.3,
    physics: 0.3,
    chemistry: 0.3,
    biology: 0.3,
    geography: 0.3,
    english: 0.3,
  };

  // Конвертація шкільного балу з 12-бальної у 200-бальну
  const schoolGPA200 = (schoolGPA * 200) / 12;

  // Розрахунок конкурсного балу
  const ukrainianWeighted = ukrainianScore * subjectCoefficients.ukrainian;
  const mathWeighted = mathScore * subjectCoefficients.math;
  const thirdSubjectWeighted =
    thirdSubjectScore * subjectCoefficients[thirdSubject];
  const schoolGPAWeighted = schoolGPA200 * 0.1; // Коефіцієнт атестата

  let competitiveScore =
    ukrainianWeighted +
    mathWeighted +
    thirdSubjectWeighted +
    schoolGPAWeighted +
    parseFloat(additionalPoints);

  // Застосування регіонального коефіцієнта
  competitiveScore *= regionCoefficient;

  // Максимальний конкурсний бал
  const maxScore = 200;
  competitiveScore = Math.min(competitiveScore, maxScore);

  const resultDiv = document.getElementById("znoResult");
  resultDiv.innerHTML = `
                <h4>Конкурсний бал:</h4>
                <p><strong>Українська мова:</strong> ${ukrainianScore} × ${
    subjectCoefficients.ukrainian
  } = ${ukrainianWeighted.toFixed(2)}</p>
                <p><strong>Математика:</strong> ${mathScore} × ${
    subjectCoefficients.math
  } = ${mathWeighted.toFixed(2)}</p>
                <p><strong>${
                  thirdSubject.charAt(0).toUpperCase() + thirdSubject.slice(1)
                }:</strong> ${thirdSubjectScore} × ${
    subjectCoefficients[thirdSubject]
  } = ${thirdSubjectWeighted.toFixed(2)}</p>
                <p><strong>Середній бал атестата:</strong> ${schoolGPA} (${schoolGPA200.toFixed(
    2
  )}) × 0.1 = ${schoolGPAWeighted.toFixed(2)}</p>
                <p><strong>Додаткові бали:</strong> ${additionalPoints}</p>
                <p><strong>Регіональний коефіцієнт:</strong> ${regionCoefficient}</p>
                <p><strong>Загальний конкурсний бал:</strong> ${competitiveScore.toFixed(
                  2
                )}</p>
            `;
  resultDiv.style.display = "block";
}

// Study planner
let tasks = [];

function addTask() {
  const name = document.getElementById("taskName").value;
  const priority = document.getElementById("taskPriority").value;
  const deadline = document.getElementById("taskDeadline").value;
  const hours = parseFloat(document.getElementById("taskHours").value);

  if (!name || !deadline || !hours) {
    alert("Будь ласка, заповніть усі поля завдання");
    return;
  }

  tasks.push({
    name,
    priority,
    deadline,
    hours,
    completed: false,
  });

  // Clear inputs
  document.getElementById("taskName").value = "";
  document.getElementById("taskDeadline").value = "";
  document.getElementById("taskHours").value = "";

  // Update tasks list
  updateTasksList();
}

function updateTasksList() {
  const tasksList = document.getElementById("tasksList");
  tasksList.innerHTML = "";

  // Sort tasks by deadline and priority
  tasks.sort((a, b) => {
    if (a.deadline !== b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline);
    }

    const priorityValues = { high: 3, medium: 2, low: 1 };
    return priorityValues[b.priority] - priorityValues[a.priority];
  });

  tasks.forEach((task, index) => {
    const item = document.createElement("div");
    item.className = "task-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => {
      tasks[index].completed = checkbox.checked;
      updateProgress();
    });

    const nameSpan = document.createElement("span");
    nameSpan.className = "task-name";
    nameSpan.textContent = `${task.name} (${task.hours} год) - ${formatDate(
      task.deadline
    )}`;

    const prioritySpan = document.createElement("span");
    prioritySpan.className = `task-priority priority-${task.priority}`;
    prioritySpan.textContent = getPriorityText(task.priority);

    item.appendChild(checkbox);
    item.appendChild(nameSpan);
    item.appendChild(prioritySpan);

    tasksList.appendChild(item);
  });

  updateProgress();
}

function updateProgress() {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const progressPercent =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  document.getElementById("studyProgress").style.width = `${progressPercent}%`;
  document.getElementById(
    "progressText"
  ).textContent = `Прогрес: ${progressPercent.toFixed(0)}%`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("uk-UA");
}

function getPriorityText(priority) {
  switch (priority) {
    case "high":
      return "Високий";
    case "medium":
      return "Середній";
    case "low":
      return "Низький";
    default:
      return "";
  }
}

function calculateStudentLoan() {
  const loanAmount = parseFloat(document.getElementById("loanAmount").value);
  const loanTerm = parseInt(document.getElementById("loanTerm").value);
  const interestRate = parseFloat(
    document.getElementById("interestRate").value
  );
  const repaymentType = document.getElementById("repaymentType").value;
  const graceYears = parseInt(document.getElementById("graceYears").value) || 0;

  if (!loanAmount || !loanTerm || !interestRate) {
    alert("Будь ласка, заповніть усі обов'язкові поля");
    return;
  }

  const monthlyRate = interestRate / 100 / 12;
  let totalPayment = 0;
  let totalInterest = 0;
  let monthlyPayment = 0;
  let effectiveTermMonths = 0;

  switch (repaymentType) {
    case "after_graduation":
      // Виплати починаються після закінчення навчання
      effectiveTermMonths = (loanTerm - graceYears) * 12;

      // Нараховані відсотки за пільговий період
      const accruedInterest =
        loanAmount * Math.pow(1 + monthlyRate, graceYears * 12) - loanAmount;
      const totalPrincipal = loanAmount + accruedInterest;

      monthlyPayment =
        (totalPrincipal *
          (monthlyRate * Math.pow(1 + monthlyRate, effectiveTermMonths))) /
        (Math.pow(1 + monthlyRate, effectiveTermMonths) - 1);
      totalPayment = monthlyPayment * effectiveTermMonths;
      totalInterest = totalPayment - loanAmount;
      break;

    case "during_studies":
      // Виплати починаються одразу
      effectiveTermMonths = loanTerm * 12;
      monthlyPayment =
        (loanAmount *
          (monthlyRate * Math.pow(1 + monthlyRate, effectiveTermMonths))) /
        (Math.pow(1 + monthlyRate, effectiveTermMonths) - 1);
      totalPayment = monthlyPayment * effectiveTermMonths;
      totalInterest = totalPayment - loanAmount;
      break;

    case "interest_only":
      // Тільки відсотки під час навчання, потім повна виплата
      const interestOnlyMonths = graceYears * 12;
      effectiveTermMonths = (loanTerm - graceYears) * 12;

      const interestOnlyPayment = loanAmount * monthlyRate;
      const interestOnlyTotal = interestOnlyPayment * interestOnlyMonths;

      const principalPayment =
        (loanAmount *
          (monthlyRate * Math.pow(1 + monthlyRate, effectiveTermMonths))) /
        (Math.pow(1 + monthlyRate, effectiveTermMonths) - 1);
      const principalTotal = principalPayment * effectiveTermMonths;

      monthlyPayment = principalPayment; // Після пільгового періоду
      totalPayment = interestOnlyTotal + principalTotal;
      totalInterest = totalPayment - loanAmount;
      break;
  }

  const resultDiv = document.getElementById("studentLoanResult");
  resultDiv.innerHTML = `
                <h4>Результати розрахунку студентського кредиту:</h4>
                <p><strong>Сума кредиту:</strong> ${loanAmount.toFixed(
                  2
                )} грн</p>
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
                  (totalInterest / loanAmount) *
                  100
                ).toFixed(2)}%</p>
            `;
  resultDiv.style.display = "block";

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
          data: [loanAmount, totalInterest],
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

function calculateLearningEfficiency() {
  const studyHours = parseFloat(document.getElementById("studyHours").value);
  const sleepHours = parseFloat(document.getElementById("sleepHours").value);
  const learningStyle = document.getElementById("learningStyle").value;
  const concentration = document.getElementById("concentration").value;
  const environment = document.getElementById("environment").value;
  const stressLevel = document.getElementById("stressLevel").value;
  const motivation = document.getElementById("motivation").value;

  if (
    !studyHours ||
    !sleepHours ||
    !learningStyle ||
    !concentration ||
    !environment ||
    !stressLevel ||
    !motivation
  ) {
    alert("Будь ласка, заповніть усі поля");
    return;
  }

  // Оцінка ефективності за різними параметрами (від 0 до 10)
  let timeScore = 0;
  let sleepScore = 0;
  let styleScore = 0;
  let concentrationScore = 0;
  let environmentScore = 0;
  let stressScore = 0;
  let motivationScore = 0;

  // Оцінка часу навчання
  if (studyHours < 10) {
    timeScore = 4;
  } else if (studyHours < 20) {
    timeScore = 7;
  } else if (studyHours < 40) {
    timeScore = 10;
  } else {
    timeScore = 8; // Занадто багато часу може бути неефективним
  }

  // Оцінка сну
  if (sleepHours < 6) {
    sleepScore = 3;
  } else if (sleepHours < 7) {
    sleepScore = 6;
  } else if (sleepHours < 9) {
    sleepScore = 10;
  } else {
    sleepScore = 8;
  }

  // Оцінка стилю навчання
  styleScore = 8; // Усвідомлення свого стилю навчання вже є позитивним

  // Оцінка концентрації
  switch (concentration) {
    case "high":
      concentrationScore = 10;
      break;
    case "medium":
      concentrationScore = 7;
      break;
    case "low":
      concentrationScore = 3;
      break;
  }

  // Оцінка середовища
  switch (environment) {
    case "excellent":
      environmentScore = 10;
      break;
    case "good":
      environmentScore = 8;
      break;
    case "average":
      environmentScore = 6;
      break;
    case "poor":
      environmentScore = 3;
      break;
  }

  // Оцінка стресу
  switch (stressLevel) {
    case "low":
      stressScore = 10;
      break;
    case "medium":
      stressScore = 6;
      break;
    case "high":
      stressScore = 2;
      break;
  }

  // Оцінка мотивації
  switch (motivation) {
    case "high":
      motivationScore = 10;
      break;
    case "medium":
      motivationScore = 6;
      break;
    case "low":
      motivationScore = 2;
      break;
  }

  // Загальна оцінка ефективності (зважена сума)
  const weights = {
    time: 0.15,
    sleep: 0.15,
    style: 0.1,
    concentration: 0.2,
    environment: 0.1,
    stress: 0.1,
    motivation: 0.2,
  };

  const totalScore =
    (timeScore * weights.time +
      sleepScore * weights.sleep +
      styleScore * weights.style +
      concentrationScore * weights.concentration +
      environmentScore * weights.environment +
      stressScore * weights.stress +
      motivationScore * weights.motivation) *
    10; // Переведення в 100-бальну шкалу

  // Рекомендації
  let recommendations = [];

  if (timeScore < 7) {
    recommendations.push(
      "Оптимізуйте час навчання. Рекомендовано 20-30 годин на тиждень з регулярними перервами."
    );
  }

  if (sleepScore < 7) {
    recommendations.push(
      "Покращіть режим сну. Оптимальна тривалість сну - 7-8 годин на добу."
    );
  }

  if (concentrationScore < 7) {
    recommendations.push(
      "Працюйте над концентрацією. Використовуйте техніку Помодоро та уникайте багатозадачності."
    );
  }

  if (environmentScore < 7) {
    recommendations.push(
      "Покращіть навчальне середовище. Забезпечте тишу, хороше освітлення та зручне робоче місце."
    );
  }

  if (stressScore < 7) {
    recommendations.push(
      "Зменшіть рівень стресу. Практикуйте медитацію, фізичні вправи та регулярний відпочинок."
    );
  }

  if (motivationScore < 7) {
    recommendations.push(
      "Підвищіть мотивацію. Встановлюйте чіткі цілі, відзначайте досягнення та знаходьте особистий інтерес у матеріалі."
    );
  }

  // Рекомендації щодо стилю навчання
  switch (learningStyle) {
    case "visual":
      recommendations.push(
        "Для візуального стилю навчання використовуйте діаграми, графіки, відео та кольорове кодування інформації."
      );
      break;
    case "auditory":
      recommendations.push(
        "Для аудіального стилю навчання використовуйте аудіозаписи, обговорення, читання вголос та пояснення матеріалу іншим."
      );
      break;
    case "reading":
      recommendations.push(
        "Для стилю навчання через читання/письмо використовуйте конспекти, списки, текстові матеріали та письмові вправи."
      );
      break;
    case "kinesthetic":
      recommendations.push(
        "Для кінестетичного стилю навчання використовуйте практичні вправи, експерименти, рольові ігри та фізичну активність під час навчання."
      );
      break;
  }

  // Оцінка ефективності
  let efficiencyLevel = "";
  if (totalScore >= 90) {
    efficiencyLevel = "Відмінна";
  } else if (totalScore >= 75) {
    efficiencyLevel = "Дуже добра";
  } else if (totalScore >= 60) {
    efficiencyLevel = "Добра";
  } else if (totalScore >= 45) {
    efficiencyLevel = "Задовільна";
  } else {
    efficiencyLevel = "Потребує покращення";
  }

  const resultDiv = document.getElementById("learningEfficiencyResult");
  resultDiv.innerHTML = `
                <h4>Оцінка ефективності навчання:</h4>
                <p><strong>Загальний бал:</strong> ${totalScore.toFixed(
                  1
                )}/100</p>
                <p><strong>Рівень ефективності:</strong> ${efficiencyLevel}</p>
                <h4>Рекомендації для покращення:</h4>
                <ul>
                    ${recommendations.map((rec) => `<li>${rec}</li>`).join("")}
                </ul>
            `;
  resultDiv.style.display = "block";
}
