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

// Calculator functions
function calculateProjectCost() {
  const projectType = document.getElementById("projectType").value;
  const pages = parseInt(document.getElementById("pages").value);
  const complexity = document.getElementById("complexity").value;

  if (!projectType || !pages || !complexity) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  let baseCost = 0;
  switch (projectType) {
    case "landing":
      baseCost = 500;
      break;
    case "website":
      baseCost = 1500;
      break;
    case "ecommerce":
      baseCost = 3000;
      break;
    case "mobile":
      baseCost = 5000;
      break;
    case "webapp":
      baseCost = 8000;
      break;
  }

  let complexityMultiplier = 1;
  switch (complexity) {
    case "simple":
      complexityMultiplier = 1;
      break;
    case "medium":
      complexityMultiplier = 1.5;
      break;
    case "complex":
      complexityMultiplier = 2.5;
      break;
  }

  const totalCost = baseCost * complexityMultiplier * (pages * 0.1 + 1);

  const resultDiv = document.getElementById("projectCostResult");
  resultDiv.innerHTML = `
                <h4>Приблизна вартість проекту:</h4>
                <p><strong>$${Math.round(totalCost)}</strong></p>
                <small>*Остаточна вартість може відрізнятися залежно від специфічних вимог</small>
            `;
  resultDiv.style.display = "block";
}

function calculateHosting() {
  const visitors = parseInt(document.getElementById("visitors").value);
  const pageSize = parseFloat(document.getElementById("pageSize").value);
  const hostingType = document.getElementById("hostingType").value;

  if (!visitors || !pageSize || !hostingType) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const dailyTraffic = visitors * pageSize;
  const monthlyTraffic = dailyTraffic * 30;

  let recommendedPlan = "";
  let estimatedCost = 0;

  switch (hostingType) {
    case "shared":
      recommendedPlan = monthlyTraffic < 10 ? "Базовий" : "Розширений";
      estimatedCost = monthlyTraffic < 10 ? 5 : 15;
      break;
    case "vps":
      recommendedPlan = monthlyTraffic < 50 ? "VPS Starter" : "VPS Pro";
      estimatedCost = monthlyTraffic < 50 ? 25 : 50;
      break;
    case "dedicated":
      recommendedPlan = "Виділений сервер";
      estimatedCost = 100;
      break;
    case "cloud":
      estimatedCost = monthlyTraffic * 0.1;
      recommendedPlan = "Хмарний хостинг";
      break;
  }

  const resultDiv = document.getElementById("hostingResult");
  resultDiv.innerHTML = `
                <h4>Рекомендації по хостингу:</h4>
                <p><strong>План:</strong> ${recommendedPlan}</p>
                <p><strong>Місячний трафік:</strong> ${monthlyTraffic.toFixed(
                  2
                )} GB</p>
                <p><strong>Приблизна вартість:</strong> $${estimatedCost}/місяць</p>
            `;
  resultDiv.style.display = "block";
}

function calculateDevTime() {
  const features = parseInt(document.getElementById("features").value);
  const teamSize = parseInt(document.getElementById("teamSize").value);
  const experience = document.getElementById("experience").value;

  if (!features || !teamSize || !experience) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  let baseHours = features * 8; // 8 годин на функцію

  let experienceMultiplier = 1;
  switch (experience) {
    case "junior":
      experienceMultiplier = 1.5;
      break;
    case "middle":
      experienceMultiplier = 1;
      break;
    case "senior":
      experienceMultiplier = 0.7;
      break;
  }

  const totalHours = baseHours * experienceMultiplier;
  const workingDays = Math.ceil(totalHours / (8 * teamSize));
  const weeks = Math.ceil(workingDays / 5);

  const resultDiv = document.getElementById("devTimeResult");
  resultDiv.innerHTML = `
                <h4>Оцінка часу розробки:</h4>
                <p><strong>Загальні години:</strong> ${Math.round(
                  totalHours
                )} год</p>
                <p><strong>Робочі дні:</strong> ${workingDays} днів</p>
                <p><strong>Тижні:</strong> ${weeks} тижнів</p>
            `;
  resultDiv.style.display = "block";
}

function calculateROI() {
  const investment = parseFloat(document.getElementById("investment").value);
  const monthlyRevenue = parseFloat(
    document.getElementById("monthlyRevenue").value
  );
  const monthlyCosts = parseFloat(
    document.getElementById("monthlyCosts").value
  );
  const period = parseInt(document.getElementById("period").value);

  if (!investment || !monthlyRevenue || monthlyCosts === "" || !period) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const monthlyProfit = monthlyRevenue - monthlyCosts;
  const totalProfit = monthlyProfit * period;
  const roi = ((totalProfit - investment) / investment) * 100;
  const paybackPeriod = Math.ceil(investment / monthlyProfit);

  const resultDiv = document.getElementById("roiResult");
  resultDiv.innerHTML = `
                <h4>Аналіз ROI:</h4>
                <p><strong>ROI:</strong> ${roi.toFixed(2)}%</p>
                <p><strong>Загальний прибуток:</strong> $${totalProfit.toFixed(
                  2
                )}</p>
                <p><strong>Період окупності:</strong> ${paybackPeriod} місяців</p>
            `;
  resultDiv.style.display = "block";
}

function generatePassword() {
  const length = parseInt(document.getElementById("passwordLength").value);
  const includeNumbers = document.getElementById("includeNumbers").checked;
  const includeSymbols = document.getElementById("includeSymbols").checked;
  const includeUppercase = document.getElementById("includeUppercase").checked;

  let charset = "abcdefghijklmnopqrstuvwxyz";
  if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeNumbers) charset += "0123456789";
  if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  const resultDiv = document.getElementById("passwordResult");
  resultDiv.innerHTML = `
                <h4>Згенерований пароль:</h4>
                <p style="font-family: monospace; font-size: 1.2rem; word-break: break-all;"><strong>${password}</strong></p>
                <button class="calc-button" onclick="copyToClipboard('${password}')">Копіювати</button>
            `;
  resultDiv.style.display = "block";
}

function generateColorPalette() {
  const baseColor = document.getElementById("baseColor").value;
  const scheme = document.getElementById("colorScheme").value;

  // Convert hex to HSL
  const hex2hsl = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  };

  // Convert HSL to hex
  const hsl2hex = (h, s, l) => {
    h /= 360;
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;
    let r = 0,
      g = 0,
      b = 0;

    if (0 <= h && h < 1 / 6) {
      r = c;
      g = x;
      b = 0;
    } else if (1 / 6 <= h && h < 2 / 6) {
      r = x;
      g = c;
      b = 0;
    } else if (2 / 6 <= h && h < 3 / 6) {
      r = 0;
      g = c;
      b = x;
    } else if (3 / 6 <= h && h < 4 / 6) {
      r = 0;
      g = x;
      b = c;
    } else if (4 / 6 <= h && h < 5 / 6) {
      r = x;
      g = 0;
      b = c;
    } else if (5 / 6 <= h && h < 1) {
      r = c;
      g = 0;
      b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const [h, s, l] = hex2hsl(baseColor);
  let colors = [baseColor];

  switch (scheme) {
    case "monochromatic":
      colors = [
        hsl2hex(h, s, Math.max(l - 30, 10)),
        hsl2hex(h, s, Math.max(l - 15, 10)),
        baseColor,
        hsl2hex(h, s, Math.min(l + 15, 90)),
        hsl2hex(h, s, Math.min(l + 30, 90)),
      ];
      break;
    case "analogous":
      colors = [
        hsl2hex((h - 30 + 360) % 360, s, l),
        hsl2hex((h - 15 + 360) % 360, s, l),
        baseColor,
        hsl2hex((h + 15) % 360, s, l),
        hsl2hex((h + 30) % 360, s, l),
      ];
      break;
    case "complementary":
      colors = [
        baseColor,
        hsl2hex((h + 180) % 360, s, l),
        hsl2hex(h, s, Math.max(l - 20, 10)),
        hsl2hex((h + 180) % 360, s, Math.max(l - 20, 10)),
        hsl2hex(h, Math.max(s - 20, 10), l),
      ];
      break;
    case "triadic":
      colors = [
        baseColor,
        hsl2hex((h + 120) % 360, s, l),
        hsl2hex((h + 240) % 360, s, l),
        hsl2hex(h, s, Math.max(l - 20, 10)),
        hsl2hex((h + 120) % 360, s, Math.max(l - 20, 10)),
      ];
      break;
  }

  const resultDiv = document.getElementById("colorPaletteResult");
  resultDiv.innerHTML = `
                <h4>Кольорова палітра (${scheme}):</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                    ${colors
                      .map(
                        (color) => `
                        <div style="text-align: center;">
                            <div style="width: 50px; height: 50px; background: ${color}; border-radius: 5px; margin-bottom: 5px; cursor: pointer;" onclick="copyToClipboard('${color}')"></div>
                            <small style="font-family: monospace;">${color}</small>
                        </div>
                    `
                      )
                      .join("")}
                </div>
                <small style="display: block; margin-top: 10px;">Клікніть на колір, щоб скопіювати код</small>
            `;
  resultDiv.style.display = "block";
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Скопійовано в буфер обміну: " + text);
  });
}
