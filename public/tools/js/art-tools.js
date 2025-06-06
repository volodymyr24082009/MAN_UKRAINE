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

// Show/hide custom size fields
document.getElementById("canvasFormat").addEventListener("change", function () {
  const customFields = document.getElementById("customSizeFields");
  if (this.value === "custom") {
    customFields.style.display = "block";
  } else {
    customFields.style.display = "none";
  }
});

// Art calculator functions
let portfolioArtworks = [];

function calculateArtworkPrice() {
  const artworkType = document.getElementById("artworkType").value;
  const width = parseFloat(document.getElementById("artworkWidth").value);
  const height = parseFloat(document.getElementById("artworkHeight").value);
  const complexity = document.getElementById("complexityLevel").value;
  const hours = parseFloat(document.getElementById("workingHours").value);
  const hourlyRate = parseFloat(document.getElementById("hourlyRate").value);
  const canvasCost =
    parseFloat(document.getElementById("canvasCost").value) || 0;
  const paintCost = parseFloat(document.getElementById("paintCost").value) || 0;
  const brushesCost =
    parseFloat(document.getElementById("brushesCost").value) || 0;
  const otherMaterials =
    parseFloat(document.getElementById("otherMaterials").value) || 0;
  const experience = document.getElementById("artistExperience").value;
  const profitMargin =
    parseFloat(document.getElementById("profitMargin").value) || 30;

  if (
    !artworkType ||
    !width ||
    !height ||
    !complexity ||
    !hours ||
    !hourlyRate ||
    !experience
  ) {
    alert("Будь ласка, заповніть всі обов'язкові поля");
    return;
  }

  // Коефіцієнти для типів робіт
  const typeCoefficients = {
    painting: 1.2,
    drawing: 1.0,
    digital: 0.8,
    sculpture: 1.5,
    photography: 0.9,
    illustration: 1.1,
  };

  // Коефіцієнти складності
  const complexityCoefficients = {
    simple: 1.0,
    medium: 1.3,
    complex: 1.6,
    masterpiece: 2.0,
  };

  // Коефіцієнти досвіду
  const experienceCoefficients = {
    beginner: 0.7,
    intermediate: 1.0,
    advanced: 1.4,
    expert: 1.8,
  };

  // Розрахунок площі
  const area = (width * height) / 10000; // переведення в м²

  // Базова вартість роботи
  const laborCost = hours * hourlyRate;

  // Вартість матеріалів
  const totalMaterialsCost =
    canvasCost + paintCost + brushesCost + otherMaterials;

  // Застосування коефіцієнтів
  const adjustedLaborCost =
    laborCost *
    typeCoefficients[artworkType] *
    complexityCoefficients[complexity] *
    experienceCoefficients[experience];

  // Загальна собівартість
  const totalCost = adjustedLaborCost + totalMaterialsCost;

  // Фінальна ціна з прибутком
  const finalPrice = totalCost * (1 + profitMargin / 100);

  // Ціна за квадратний сантиметр
  const pricePerSqCm = finalPrice / (width * height);

  const artworkNames = {
    painting: "Живопис",
    drawing: "Графіка",
    digital: "Цифрове мистецтво",
    sculpture: "Скульптура",
    photography: "Фотографія",
    illustration: "Ілюстрація",
  };

  const complexityNames = {
    simple: "Простий",
    medium: "Середній",
    complex: "Складний",
    masterpiece: "Шедевр",
  };

  const experienceNames = {
    beginner: "Початківець",
    intermediate: "Середній",
    advanced: "Досвідчений",
    expert: "Експерт",
  };

  const resultDiv = document.getElementById("artworkPriceResult");
  resultDiv.innerHTML = `
                <h4>Розрахунок вартості художньої роботи:</h4>
                <p><strong>Тип роботи:</strong> ${artworkNames[artworkType]}</p>
                <p><strong>Розміри:</strong> ${width}×${height} см (${area.toFixed(
    2
  )} м²)</p>
                <p><strong>Складність:</strong> ${
                  complexityNames[complexity]
                }</p>
                <p><strong>Досвід художника:</strong> ${
                  experienceNames[experience]
                }</p>
                <p><strong>Години роботи:</strong> ${hours}</p>
                <p><strong>Погодинна ставка:</strong> ${hourlyRate} грн</p>
                <p><strong>Вартість роботи:</strong> ${adjustedLaborCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Вартість матеріалів:</strong> ${totalMaterialsCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Собівартість:</strong> ${totalCost.toFixed(
                  2
                )} грн</p>
                <p><strong>Прибуток (${profitMargin}%):</strong> ${(
    finalPrice - totalCost
  ).toFixed(2)} грн</p>
                <p><strong>Фінальна ціна:</strong> ${finalPrice.toFixed(
                  2
                )} грн</p>
                <p><strong>Ціна за см²:</strong> ${pricePerSqCm.toFixed(
                  2
                )} грн</p>
            `;
  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("artworkPriceChart").getContext("2d");

  if (window.artworkPriceChart) {
    window.artworkPriceChart.destroy();
  }

  window.artworkPriceChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Робота", "Матеріали", "Прибуток"],
      datasets: [
        {
          data: [adjustedLaborCost, totalMaterialsCost, finalPrice - totalCost],
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

function generateColorPalette() {
  const baseColor = document.getElementById("baseColor").value;
  const scheme = document.getElementById("colorScheme").value;

  const baseHsl = hexToHsl(baseColor);
  let colors = [];

  switch (scheme) {
    case "monochromatic":
      colors = generateMonochromatic(baseHsl);
      break;
    case "analogous":
      colors = generateAnalogous(baseHsl);
      break;
    case "complementary":
      colors = generateComplementary(baseHsl);
      break;
    case "triadic":
      colors = generateTriadic(baseHsl);
      break;
    case "tetradic":
      colors = generateTetradic(baseHsl);
      break;
    case "split":
      colors = generateSplitComplementary(baseHsl);
      break;
  }

  displayColorPalette(colors);
}

function hexToHsl(hex) {
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
}

function hslToHex(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generateMonochromatic(baseHsl) {
  const [h, s, l] = baseHsl;
  return [
    hslToHex(h, s, Math.max(10, l - 40)),
    hslToHex(h, s, Math.max(20, l - 20)),
    hslToHex(h, s, l),
    hslToHex(h, s, Math.min(80, l + 20)),
    hslToHex(h, s, Math.min(90, l + 40)),
  ];
}

function generateAnalogous(baseHsl) {
  const [h, s, l] = baseHsl;
  return [
    hslToHex((h - 60 + 360) % 360, s, l),
    hslToHex((h - 30 + 360) % 360, s, l),
    hslToHex(h, s, l),
    hslToHex((h + 30) % 360, s, l),
    hslToHex((h + 60) % 360, s, l),
  ];
}

function generateComplementary(baseHsl) {
  const [h, s, l] = baseHsl;
  const complementary = (h + 180) % 360;
  return [
    hslToHex(h, s, Math.max(20, l - 20)),
    hslToHex(h, s, l),
    hslToHex(h, s, Math.min(80, l + 20)),
    hslToHex(complementary, s, l),
    hslToHex(complementary, s, Math.min(80, l + 20)),
  ];
}

function generateTriadic(baseHsl) {
  const [h, s, l] = baseHsl;
  return [
    hslToHex(h, s, l),
    hslToHex((h + 120) % 360, s, l),
    hslToHex((h + 240) % 360, s, l),
    hslToHex(h, Math.max(20, s - 20), l),
    hslToHex((h + 120) % 360, Math.max(20, s - 20), l),
  ];
}

function generateTetradic(baseHsl) {
  const [h, s, l] = baseHsl;
  return [
    hslToHex(h, s, l),
    hslToHex((h + 90) % 360, s, l),
    hslToHex((h + 180) % 360, s, l),
    hslToHex((h + 270) % 360, s, l),
    hslToHex(h, Math.max(20, s - 30), Math.min(80, l + 20)),
  ];
}

function generateSplitComplementary(baseHsl) {
  const [h, s, l] = baseHsl;
  return [
    hslToHex(h, s, l),
    hslToHex((h + 150) % 360, s, l),
    hslToHex((h + 210) % 360, s, l),
    hslToHex(h, Math.max(20, s - 20), Math.max(20, l - 20)),
    hslToHex(h, Math.min(100, s + 20), Math.min(80, l + 20)),
  ];
}

function displayColorPalette(colors) {
  const paletteDiv = document.getElementById("colorPalette");
  const codesDiv = document.getElementById("colorCodes");

  paletteDiv.innerHTML = "";
  codesDiv.innerHTML = "";

  colors.forEach((color, index) => {
    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    swatch.style.backgroundColor = color;
    swatch.onclick = () => copyToClipboard(color);

    const info = document.createElement("div");
    info.className = "color-info";
    info.textContent = color;

    const container = document.createElement("div");
    container.appendChild(swatch);
    container.appendChild(info);

    paletteDiv.appendChild(container);
  });

  codesDiv.innerHTML = `
                <h4 style="color: var(--text-dark); margin: 1rem 0 0.5rem 0;">Коди кольорів:</h4>
                <p>${colors.join(", ")}</p>
            `;

  document.getElementById("colorPaletteResult").style.display = "block";
  document.getElementById("savePaletteBtn").style.display = "inline-block";
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert(`Колір ${text} скопійовано в буфер обміну!`);
  });
}

function saveColorPalette() {
  const colors = Array.from(document.querySelectorAll(".color-info")).map(
    (el) => el.textContent
  );
  const paletteData = {
    colors: colors,
    scheme: document.getElementById("colorScheme").value,
    baseColor: document.getElementById("baseColor").value,
    timestamp: new Date().toISOString(),
  };

  const dataStr = JSON.stringify(paletteData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = "color-palette.json";
  link.click();
}

function calculateCanvasSize() {
  const format = document.getElementById("canvasFormat").value;
  const orientation = document.getElementById("orientation").value;
  const dpi = parseInt(document.getElementById("dpi").value) || 300;
  const units = document.getElementById("units").value;

  if (!format) {
    alert("Будь ласка, оберіть формат полотна");
    return;
  }

  let width, height;

  // Стандартні розміри в см
  const formats = {
    A4: [21, 29.7],
    A3: [29.7, 42],
    A2: [42, 59.4],
    A1: [59.4, 84.1],
    A0: [84.1, 118.9],
    square: [30, 30],
    golden: [30, 48.54], // 30 * 1.618
  };

  if (format === "custom") {
    width = parseFloat(document.getElementById("customWidth").value);
    height = parseFloat(document.getElementById("customHeight").value);

    if (!width || !height) {
      alert("Будь ласка, введіть користувацькі розміри");
      return;
    }
  } else {
    [width, height] = formats[format];
  }

  // Застосування орієнтації
  if (orientation === "portrait" && width > height) {
    [width, height] = [height, width];
  } else if (orientation === "landscape" && height > width) {
    [width, height] = [height, width];
  }

  // Конвертація одиниць
  let displayWidth = width;
  let displayHeight = height;
  let pixelWidth = 0;
  let pixelHeight = 0;

  if (units === "inches") {
    displayWidth = width / 2.54;
    displayHeight = height / 2.54;
  } else if (units === "pixels") {
    pixelWidth = Math.round((width / 2.54) * dpi);
    pixelHeight = Math.round((height / 2.54) * dpi);
    displayWidth = pixelWidth;
    displayHeight = pixelHeight;
  }

  // Розрахунок пікселів для цифрових робіт
  if (units !== "pixels") {
    pixelWidth = Math.round((width / 2.54) * dpi);
    pixelHeight = Math.round((height / 2.54) * dpi);
  }

  // Розрахунок співвідношення сторін
  const aspectRatio = width / height;
  const isGoldenRatio =
    Math.abs(aspectRatio - 1.618) < 0.01 ||
    Math.abs(aspectRatio - 0.618) < 0.01;

  // Розрахунок площі
  const areaCm = width * height;
  const areaM = areaCm / 10000;

  const unitNames = {
    cm: "см",
    inches: "дюймів",
    pixels: "пікселів",
  };

  const resultDiv = document.getElementById("canvasSizeResult");
  resultDiv.innerHTML = `
                <h4>Розміри полотна:</h4>
                <p><strong>Формат:</strong> ${
                  format === "custom" ? "Користувацький" : format
                }</p>
                <p><strong>Орієнтація:</strong> ${
                  orientation === "landscape" ? "Альбомна" : "Книжкова"
                }</p>
                <p><strong>Розміри:</strong> ${displayWidth.toFixed(
                  1
                )} × ${displayHeight.toFixed(1)} ${unitNames[units]}</p>
                <p><strong>Розміри в см:</strong> ${width.toFixed(
                  1
                )} × ${height.toFixed(1)} см</p>
                <p><strong>Розміри в пікселях (${dpi} DPI):</strong> ${pixelWidth} × ${pixelHeight} px</p>
                <p><strong>Співвідношення сторін:</strong> ${aspectRatio.toFixed(
                  3
                )}:1 ${isGoldenRatio ? "(Золотий перетин!)" : ""}</p>
                <p><strong>Площа:</strong> ${areaCm.toFixed(
                  1
                )} см² (${areaM.toFixed(3)} м²)</p>
                <p><strong>Розмір файлу (RGB, 8-біт):</strong> ${(
                  (pixelWidth * pixelHeight * 3) /
                  (1024 * 1024)
                ).toFixed(1)} МБ</p>
            `;
  resultDiv.style.display = "block";

  // Оновлення попереднього перегляду
  updateCanvasPreview(width, height);
}

function updateCanvasPreview(width, height) {
  const preview = document.getElementById("canvasPreview");
  const maxWidth = 280;
  const maxHeight = 140;

  let previewWidth, previewHeight;

  if (width > height) {
    previewWidth = Math.min(maxWidth, width * (maxHeight / height));
    previewHeight = height * (previewWidth / width);
  } else {
    previewHeight = Math.min(maxHeight, height * (maxWidth / width));
    previewWidth = width * (previewHeight / height);
  }

  preview.style.width = `${previewWidth}px`;
  preview.style.height = `${previewHeight}px`;
  preview.innerHTML = `${width.toFixed(1)} × ${height.toFixed(1)} см`;
}

function addArtworkToPortfolio() {
  const name = document.getElementById("artworkName").value;
  const type = document.getElementById("portfolioArtworkType").value;
  const width = parseFloat(document.getElementById("portfolioWidth").value);
  const height = parseFloat(document.getElementById("portfolioHeight").value);
  const year = parseInt(document.getElementById("creationYear").value);
  const price = parseFloat(document.getElementById("estimatedPrice").value);
  const condition = document.getElementById("condition").value;

  if (!name || !type || !width || !height || !year || !price || !condition) {
    alert("Будь ласка, заповніть всі поля");
    return;
  }

  const artwork = {
    name,
    type,
    width,
    height,
    year,
    price,
    condition,
    id: Date.now(),
  };

  portfolioArtworks.push(artwork);
  updatePortfolioList();

  // Очистити поля
  document.getElementById("artworkName").value = "";
  document.getElementById("portfolioWidth").value = "";
  document.getElementById("portfolioHeight").value = "";
  document.getElementById("creationYear").value = "";
  document.getElementById("estimatedPrice").value = "";
}

function updatePortfolioList() {
  const listDiv = document.getElementById("portfolioList");
  listDiv.innerHTML = "";

  if (portfolioArtworks.length === 0) {
    listDiv.innerHTML =
      "<p>Портфоліо порожнє. Додайте роботи для розрахунку.</p>";
    return;
  }

  listDiv.innerHTML =
    '<h4 style="color: var(--text-dark); margin: 1rem 0 0.5rem 0;">Роботи в портфоліо:</h4>';

  portfolioArtworks.forEach((artwork) => {
    const item = document.createElement("div");
    item.className = "artwork-item";

    const typeNames = {
      painting: "Живопис",
      drawing: "Графіка",
      digital: "Цифрове",
      sculpture: "Скульптура",
      photography: "Фото",
      mixed: "Змішана техніка",
    };

    item.innerHTML = `
                    <span class="artwork-name">${artwork.name} (${
      typeNames[artwork.type]
    }, ${artwork.year})</span>
                    <span class="artwork-price">${artwork.price.toFixed(
                      2
                    )} грн</span>
                    <button onclick="removeArtworkFromPortfolio(${
                      artwork.id
                    })" style="background: none; border: none; color: var(--danger-color); cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                `;

    listDiv.appendChild(item);
  });
}

function removeArtworkFromPortfolio(id) {
  portfolioArtworks = portfolioArtworks.filter((artwork) => artwork.id !== id);
  updatePortfolioList();
}

function calculatePortfolioValue() {
  if (portfolioArtworks.length === 0) {
    alert("Додайте роботи до портфоліо для розрахунку");
    return;
  }

  // Коефіцієнти для стану робіт
  const conditionCoefficients = {
    excellent: 1.0,
    good: 0.9,
    fair: 0.7,
    poor: 0.5,
  };

  let totalValue = 0;
  let adjustedValue = 0;
  const typeBreakdown = {};
  const yearBreakdown = {};

  portfolioArtworks.forEach((artwork) => {
    const conditionAdjustedPrice =
      artwork.price * conditionCoefficients[artwork.condition];

    totalValue += artwork.price;
    adjustedValue += conditionAdjustedPrice;

    // Розбивка за типами
    if (!typeBreakdown[artwork.type]) {
      typeBreakdown[artwork.type] = 0;
    }
    typeBreakdown[artwork.type] += conditionAdjustedPrice;

    // Розбивка за роками
    const decade = Math.floor(artwork.year / 10) * 10;
    if (!yearBreakdown[decade]) {
      yearBreakdown[decade] = 0;
    }
    yearBreakdown[decade] += conditionAdjustedPrice;
  });

  const averageValue = adjustedValue / portfolioArtworks.length;
  const mostValuableArtwork = portfolioArtworks.reduce((max, artwork) =>
    artwork.price > max.price ? artwork : max
  );

  const conditionNames = {
    excellent: "Відмінний",
    good: "Добрий",
    fair: "Задовільний",
    poor: "Поганий",
  };

  const resultDiv = document.getElementById("portfolioValueResult");
  resultDiv.innerHTML = `
                <h4>Оцінка портфоліо:</h4>
                <p><strong>Кількість робіт:</strong> ${
                  portfolioArtworks.length
                }</p>
                <p><strong>Загальна оціночна вартість:</strong> ${totalValue.toFixed(
                  2
                )} грн</p>
                <p><strong>Скоригована вартість (з урахуванням стану):</strong> ${adjustedValue.toFixed(
                  2
                )} грн</p>
                <p><strong>Середня вартість роботи:</strong> ${averageValue.toFixed(
                  2
                )} грн</p>
                <p><strong>Найдорожча робота:</strong> ${
                  mostValuableArtwork.name
                } (${mostValuableArtwork.price.toFixed(2)} грн)</p>
                <p><strong>Різниця через стан:</strong> ${(
                  totalValue - adjustedValue
                ).toFixed(2)} грн</p>
            `;
  resultDiv.style.display = "block";

  // Create chart
  const ctx = document.getElementById("portfolioChart").getContext("2d");

  if (window.portfolioChart) {
    window.portfolioChart.destroy();
  }

  const typeNames = {
    painting: "Живопис",
    drawing: "Графіка",
    digital: "Цифрове",
    sculpture: "Скульптура",
    photography: "Фотографія",
    mixed: "Змішана техніка",
  };

  window.portfolioChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(typeBreakdown).map((type) => typeNames[type] || type),
      datasets: [
        {
          data: Object.values(typeBreakdown),
          backgroundColor: [
            "#3b82f6",
            "#ef4444",
            "#10b981",
            "#f59e0b",
            "#8b5cf6",
            "#06b6d4",
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

function calculateExhibition() {
  const name = document.getElementById("exhibitionName").value;
  const date = document.getElementById("exhibitionDate").value;
  const duration = parseInt(
    document.getElementById("exhibitionDuration").value
  );
  const venueRent = parseFloat(document.getElementById("venueRent").value) || 0;
  const insurance =
    parseFloat(document.getElementById("insuranceCost").value) || 0;
  const marketing =
    parseFloat(document.getElementById("marketingCost").value) || 0;
  const catalog = parseFloat(document.getElementById("catalogCost").value) || 0;
  const transport =
    parseFloat(document.getElementById("transportCost").value) || 0;
  const installation =
    parseFloat(document.getElementById("installationCost").value) || 0;
  const other = parseFloat(document.getElementById("otherCosts").value) || 0;
  const expectedSales =
    parseFloat(document.getElementById("expectedSales").value) || 0;
  const ticketSales =
    parseFloat(document.getElementById("ticketSales").value) || 0;
  const sponsorship =
    parseFloat(document.getElementById("sponsorship").value) || 0;

  if (!name || !date || !duration) {
    alert("Будь ласка, заповніть основні поля");
    return;
  }

  const totalExpenses =
    venueRent +
    insurance +
    marketing +
    catalog +
    transport +
    installation +
    other;
  const totalRevenue = expectedSales + ticketSales + sponsorship;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const resultDiv = document.getElementById("exhibitionResult");
  resultDiv.innerHTML = `
                <h4>Бюджет виставки "${name}":</h4>
                <p><strong>Дата проведення:</strong> ${new Date(
                  date
                ).toLocaleDateString("uk-UA")}</p>
                <p><strong>Тривалість:</strong> ${duration} днів</p>
                
                <h4>Витрати:</h4>
                <p><strong>Оренда приміщення:</strong> ${venueRent.toFixed(
                  2
                )} грн</p>
                <p><strong>Страхування:</strong> ${insurance.toFixed(2)} грн</p>
                <p><strong>Маркетинг:</strong> ${marketing.toFixed(2)} грн</p>
                <p><strong>Каталог:</strong> ${catalog.toFixed(2)} грн</p>
                <p><strong>Транспортування:</strong> ${transport.toFixed(
                  2
                )} грн</p>
                <p><strong>Монтаж:</strong> ${installation.toFixed(2)} грн</p>
                <p><strong>Інші витрати:</strong> ${other.toFixed(2)} грн</p>
                <p><strong>Загальні витрати:</strong> ${totalExpenses.toFixed(
                  2
                )} грн</p>
                
                <h4>Доходи:</h4>
                <p><strong>Очікувані продажі:</strong> ${expectedSales.toFixed(
                  2
                )} грн</p>
                <p><strong>Продаж квитків:</strong> ${ticketSales.toFixed(
                  2
                )} грн</p>
                <p><strong>Спонсорство:</strong> ${sponsorship.toFixed(
                  2
                )} грн</p>
                <p><strong>Загальні доходи:</strong> ${totalRevenue.toFixed(
                  2
                )} грн</p>
                
                <p><strong>Чистий прибуток:</strong> ${netProfit.toFixed(
                  2
                )} грн</p>
                <p><strong>Рентабельність:</strong> ${profitMargin.toFixed(
                  1
                )}%</p>
            `;
  resultDiv.style.display = "block";

  // Генерація таймлайну
  generateExhibitionTimeline(date, duration);
}

function generateExhibitionTimeline(exhibitionDate, duration) {
  const timeline = document.getElementById("exhibitionTimeline");
  const startDate = new Date(exhibitionDate);

  const tasks = [
    { name: "Початок планування", offset: -180, duration: 1 },
    { name: "Пошук приміщення", offset: -150, duration: 30 },
    { name: "Підготовка робіт", offset: -120, duration: 60 },
    { name: "Маркетингова кампанія", offset: -90, duration: 90 },
    { name: "Друк каталогу", offset: -60, duration: 30 },
    { name: "Транспортування робіт", offset: -7, duration: 3 },
    { name: "Монтаж виставки", offset: -3, duration: 3 },
    { name: "Відкриття виставки", offset: 0, duration: 1 },
    { name: "Проведення виставки", offset: 0, duration: duration },
    { name: "Демонтаж", offset: duration, duration: 2 },
  ];

  timeline.innerHTML =
    '<h4 style="color: var(--text-dark); margin: 1rem 0 0.5rem 0;">Таймлайн підготовки:</h4>';

  tasks.forEach((task) => {
    const taskDate = new Date(startDate);
    taskDate.setDate(taskDate.getDate() + task.offset);

    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `
                    <div class="timeline-date">${taskDate.toLocaleDateString(
                      "uk-UA"
                    )}</div>
                    <div class="timeline-task">${task.name} (${task.duration} ${
      task.duration === 1 ? "день" : "днів"
    })</div>
                `;

    timeline.appendChild(item);
  });

  timeline.style.display = "block";
}

function updateSkillValue(skill, value) {
  document.getElementById(skill + "Value").textContent = value;
}

function assessArtSkills() {
  const skills = {
    drawing: parseInt(document.getElementById("drawingSkill").value),
    painting: parseInt(document.getElementById("paintingSkill").value),
    composition: parseInt(document.getElementById("compositionSkill").value),
    color: parseInt(document.getElementById("colorSkill").value),
    light: parseInt(document.getElementById("lightSkill").value),
    perspective: parseInt(document.getElementById("perspectiveSkill").value),
    anatomy: parseInt(document.getElementById("anatomySkill").value),
  };

  const practiceHours = parseFloat(
    document.getElementById("practiceHours").value
  );
  const experience = parseFloat(document.getElementById("artExperience").value);

  if (!practiceHours || experience === "") {
    alert("Будь ласка, введіть години практики та роки досвіду");
    return;
  }

  // Розрахунок середнього рівня навичок
  const skillValues = Object.values(skills);
  const averageSkill =
    skillValues.reduce((sum, skill) => sum + skill, 0) / skillValues.length;

  // Визначення найсильніших та найслабших навичок
  const skillNames = {
    drawing: "Малювання",
    painting: "Живопис",
    composition: "Композиція",
    color: "Колір",
    light: "Світло і тінь",
    perspective: "Перспектива",
    anatomy: "Анатомія",
  };

  const sortedSkills = Object.entries(skills).sort((a, b) => b[1] - a[1]);
  const strongestSkills = sortedSkills.slice(0, 3);
  const weakestSkills = sortedSkills.slice(-3).reverse();

  // Оцінка загального рівня
  let skillLevel = "";
  if (averageSkill >= 8) {
    skillLevel = "Експерт";
  } else if (averageSkill >= 6) {
    skillLevel = "Досвідчений";
  } else if (averageSkill >= 4) {
    skillLevel = "Середній";
  } else {
    skillLevel = "Початківець";
  }

  // Рекомендації
  let recommendations = [];

  if (skills.drawing < 6) {
    recommendations.push(
      "Приділіть більше уваги основам малювання та лінійному мистецтву"
    );
  }

  if (skills.color < 6) {
    recommendations.push(
      "Вивчайте теорію кольору та практикуйте змішування кольорів"
    );
  }

  if (skills.composition < 6) {
    recommendations.push(
      "Досліджуйте правила композиції та аналізуйте роботи майстрів"
    );
  }

  if (skills.anatomy < 6) {
    recommendations.push("Вивчайте анатомію людини та тварин");
  }

  if (practiceHours < 10) {
    recommendations.push(
      "Збільшіть кількість годин практики до 10-15 на тиждень"
    );
  }

  if (experience < 2) {
    recommendations.push(
      "Продовжуйте практикуватися - досвід приходить з часом"
    );
  }

  // Розрахунок прогресу
  const expectedSkillForExperience = Math.min(10, 3 + experience * 0.5);
  const progressRate = averageSkill / expectedSkillForExperience;

  const resultDiv = document.getElementById("skillsAssessmentResult");
  resultDiv.innerHTML = `
                <h4>Оцінка мистецьких навичок:</h4>
                <p><strong>Загальний рівень:</strong> ${skillLevel} (${averageSkill.toFixed(
    1
  )}/10)</p>
                <p><strong>Роки досвіду:</strong> ${experience}</p>
                <p><strong>Години практики на тиждень:</strong> ${practiceHours}</p>
                <p><strong>Темп розвитку:</strong> ${
                  progressRate > 1.2
                    ? "Швидкий"
                    : progressRate > 0.8
                    ? "Нормальний"
                    : "Повільний"
                }</p>
                
                <h4>Найсильніші навички:</h4>
                <ul>
                    ${strongestSkills
                      .map(
                        ([skill, value]) =>
                          `<li>${skillNames[skill]}: ${value}/10</li>`
                      )
                      .join("")}
                </ul>
                
                <h4>Навички для покращення:</h4>
                <ul>
                    ${weakestSkills
                      .map(
                        ([skill, value]) =>
                          `<li>${skillNames[skill]}: ${value}/10</li>`
                      )
                      .join("")}
                </ul>
                
                <h4>Рекомендації:</h4>
                <ul>
                    ${recommendations.map((rec) => `<li>${rec}</li>`).join("")}
                </ul>
            `;
  resultDiv.style.display = "block";

  // Візуалізація навичок
  visualizeSkills(skills);
}

function visualizeSkills(skills) {
  const visualization = document.getElementById("skillsVisualization");
  visualization.innerHTML =
    '<h4 style="color: var(--text-dark); margin: 1rem 0 0.5rem 0;">Візуалізація навичок:</h4>';

  const skillNames = {
    drawing: "Малювання",
    painting: "Живопис",
    composition: "Композиція",
    color: "Колір",
    light: "Світло і тінь",
    perspective: "Перспектива",
    anatomy: "Анатомія",
  };

  Object.entries(skills).forEach(([skill, value]) => {
    const skillContainer = document.createElement("div");
    skillContainer.style.marginBottom = "1rem";

    const label = document.createElement("div");
    label.className = "skill-label";
    label.innerHTML = `<span>${skillNames[skill]}</span><span>${value}/10</span>`;

    const bar = document.createElement("div");
    bar.className = "skill-bar";

    const fill = document.createElement("div");
    fill.className = "skill-fill";
    fill.style.width = `${(value / 10) * 100}%`;

    bar.appendChild(fill);
    skillContainer.appendChild(label);
    skillContainer.appendChild(bar);
    visualization.appendChild(skillContainer);
  });
}
