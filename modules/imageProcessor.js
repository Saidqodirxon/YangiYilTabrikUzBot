const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

/**
 * Rasm ustiga matn yozish
 * @param {Object} options - Konfiguratsiya
 * @param {string} options.imagePath - Asl rasm yo'li
 * @param {string} options.text - Yoziladigan matn
 * @param {Object} options.textConfig - Matn sozlamalari
 * @param {string} options.outputPath - Natija rasm yo'li
 */
async function generateCertificate(options) {
  const { imagePath, text, textConfig = {}, outputPath } = options;

  try {
    // Default config
    const config = {
      fontFamily: textConfig.fontFamily || "Arial",
      fontSize: textConfig.fontSize || 48,
      fontColor: textConfig.fontColor || "#000000",
      x: textConfig.x || 0,
      y: textConfig.y || 0,
      align: textConfig.align || "center",
      maxWidth: textConfig.maxWidth || 800,
    };

    // Asosiy rasmni o'qish
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    // Matn pozitsiyasini hisoblash
    let textX = config.x;
    let textY = config.y;

    // Center align uchun
    if (config.align === "center") {
      textX = Math.floor(metadata.width / 2);
    } else if (config.align === "right") {
      textX = metadata.width - config.x;
    }

    // SVG orqali matn yaratish
    const svgText = createSVGText(
      text,
      config,
      metadata.width,
      metadata.height
    );

    // Rasmga matn qo'shish
    const buffer = await image
      .composite([
        {
          input: Buffer.from(svgText),
          top: 0,
          left: 0,
        },
      ])
      .toBuffer();

    // Faylga saqlash
    await sharp(buffer).toFile(outputPath);

    return {
      success: true,
      path: outputPath,
    };
  } catch (error) {
    console.error("Certificate generation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * SVG matn yaratish
 */
function createSVGText(text, config, imageWidth, imageHeight) {
  const lines = wrapText(text, config.maxWidth, config.fontSize);
  const lineHeight = config.fontSize * 1.3;

  let textAnchor = "start";
  let xPos = config.x;

  if (config.align === "center") {
    textAnchor = "middle";
    xPos = imageWidth / 2;
  } else if (config.align === "right") {
    textAnchor = "end";
    xPos = imageWidth - config.x;
  }

  // Calculate starting Y position (add fontSize to make text visible)
  let startY = config.y + config.fontSize;

  let svgContent = "";
  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    svgContent += `
      <text
        x="${xPos}"
        y="${y}"
        font-family="${config.fontFamily}"
        font-size="${config.fontSize}"
        font-weight="bold"
        fill="${config.fontColor}"
        text-anchor="${textAnchor}"
        dominant-baseline="hanging"
      >${escapeXML(line)}</text>
    `;
  });

  return `
    <svg width="${imageWidth}" height="${imageHeight}">
      <style>
        text {
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
      </style>
      ${svgContent}
    </svg>
  `;
}

/**
 * Matnni qatorlarga bo'lish
 */
function wrapText(text, maxWidth, fontSize) {
  // Oddiy split - keyinchalik yaxshilash mumkin
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  const approxCharWidth = fontSize * 0.6; // Approximate
  const maxCharsPerLine = Math.floor(maxWidth / approxCharWidth);

  for (const word of words) {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
}

/**
 * XML escape
 */
function escapeXML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Rasmni resize qilish
 */
async function resizeImage(inputPath, outputPath, width, height) {
  try {
    await sharp(inputPath)
      .resize(width, height, {
        fit: "cover",
        position: "center",
      })
      .toFile(outputPath);

    return { success: true, path: outputPath };
  } catch (error) {
    console.error("Resize error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Rasm ma'lumotlarini olish
 */
async function getImageInfo(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      success: true,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  generateCertificate,
  resizeImage,
  getImageInfo,
};
