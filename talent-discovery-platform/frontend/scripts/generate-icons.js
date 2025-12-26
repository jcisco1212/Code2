#!/usr/bin/env node

/**
 * Generate PWA icons for TalentVault
 * Run this script with: node scripts/generate-icons.js
 *
 * Prerequisites: npm install canvas
 */

const fs = require('fs');
const path = require('path');

// Try to use canvas if available, otherwise create placeholder SVGs
let createCanvas;
try {
  createCanvas = require('canvas').createCanvas;
} catch (e) {
  console.log('Canvas not installed. Creating SVG placeholders instead.');
  console.log('For proper PNG icons, run: npm install canvas');
  createCanvas = null;
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// TalentVault brand colors
const primaryColor = '#667eea';
const secondaryColor = '#764ba2';

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

if (createCanvas) {
  // Generate PNG icons using canvas
  sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);

    // Draw rounded rectangle background
    const radius = size * 0.15;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw "TV" text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TV', size / 2, size / 2);

    // Save PNG
    const buffer = canvas.toBuffer('image/png');
    const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
    fs.writeFileSync(filename, buffer);
    console.log(`Created: ${filename}`);
  });

  // Create logo192.png and logo512.png for CRA compatibility
  [192, 512].forEach(size => {
    const srcPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    const destPath = path.join(__dirname, '../public', `logo${size}.png`);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Created: ${destPath}`);
    }
  });
} else {
  // Create SVG placeholders
  sizes.forEach(size => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">TV</text>
</svg>`;

    const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
    fs.writeFileSync(filename, svg);
    console.log(`Created SVG placeholder: ${filename}`);
  });

  console.log('\nTo generate proper PNG icons:');
  console.log('1. npm install canvas');
  console.log('2. node scripts/generate-icons.js');
  console.log('\nOr use an online tool to convert the SVGs to PNGs.');
}

console.log('\nIcon generation complete!');
