"use strict";

// Utilities
const $ = (sel) => document.querySelector(sel);
const clampByte = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

// Canvas setup
const canvasOriginal = $("#canvasOriginal");
const canvasResult = $("#canvasResult");
const ctxOrig = canvasOriginal.getContext("2d");
const ctxRes = canvasResult.getContext("2d");

// State
let originalImageBitmap = null;
let originalImageData = null;
let currentImageData = null;
let historyStack = [];
let redoStack = [];
let keyImageBitmap = null;

// UI elements
const dropArea = $("#dropArea");
const fileInput = $("#fileInput");
const preserveAlphaCheckbox = $("#preserveAlpha");
const modeSelect = $("#modeSelect");
const opSelect = $("#opSelect");
const dynamicInputs = $("#dynamicInputs");
const btnApply = $("#btnApply");
const btnReset = $("#btnReset");
const btnUndo = $("#btnUndo");
const btnRedo = $("#btnRedo");
const btnDownload = $("#btnDownload");
const keyImageCard = $("#keyImageCard");
const dropAreaKey = $("#dropAreaKey");
const fileKeyInput = $("#fileKeyInput");
const keyImageFit = $("#keyImageFit");
const origInfo = $("#origInfo");
const resultInfo = $("#resultInfo");

function setCanvasSize(w, h) {
  canvasOriginal.width = w;
  canvasOriginal.height = h;
  canvasResult.width = w;
  canvasResult.height = h;
}

function updateInfo() {
  if (!originalImageData) {
    origInfo.textContent = "";
    resultInfo.textContent = "";
    return;
  }
  const w = originalImageData.width;
  const h = originalImageData.height;
  const px = w * h;
  origInfo.textContent = `${w}×${h} • ${px} px`;
  if (currentImageData) {
    const w2 = currentImageData.width;
    const h2 = currentImageData.height;
    resultInfo.textContent = `${w2}×${h2} • ${w2 * h2} px`;
  } else {
    resultInfo.textContent = "";
  }
}

async function loadImageFromFile(file) {
  const blobUrl = URL.createObjectURL(file);
  const imgBitmap = await createImageBitmap(await (await fetch(blobUrl)).blob());
  URL.revokeObjectURL(blobUrl);
  return imgBitmap;
}

function drawBitmapToCtx(ctx, bmp) {
  const { width, height } = bmp;
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.drawImage(bmp, 0, 0);
}

function snapshot(ctx) {
  return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function pushHistory(imageData) {
  // Keep up to 20 states
  historyStack.push(new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height));
  if (historyStack.length > 20) historyStack.shift();
  // Clear redo on new action
  redoStack = [];
}

function restoreImageData(imageData) {
  ctxRes.putImageData(imageData, 0, 0);
  currentImageData = snapshot(ctxRes);
  updateInfo();
}

function resetToOriginal() {
  if (!originalImageData) return;
  ctxRes.putImageData(originalImageData, 0, 0);
  currentImageData = snapshot(ctxRes);
  historyStack = [new ImageData(new Uint8ClampedArray(originalImageData.data), originalImageData.width, originalImageData.height)];
  redoStack = [];
  updateInfo();
}

// Drag & drop helpers
function bindDropArea(el, onFiles) {
  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.classList.add("dragover");
  });
  el.addEventListener("dragleave", () => el.classList.remove("dragover"));
  el.addEventListener("drop", (e) => {
    e.preventDefault();
    el.classList.remove("dragover");
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) onFiles(files);
  });
}

bindDropArea(dropArea, async (files) => {
  const file = files[0];
  if (!file) return;
  const bmp = await loadImageFromFile(file);
  originalImageBitmap = bmp;
  drawBitmapToCtx(ctxOrig, bmp);
  drawBitmapToCtx(ctxRes, bmp);
  originalImageData = snapshot(ctxOrig);
  currentImageData = snapshot(ctxRes);
  historyStack = [snapshot(ctxRes)];
  redoStack = [];
  updateInfo();
});

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const bmp = await loadImageFromFile(file);
  originalImageBitmap = bmp;
  drawBitmapToCtx(ctxOrig, bmp);
  drawBitmapToCtx(ctxRes, bmp);
  originalImageData = snapshot(ctxOrig);
  currentImageData = snapshot(ctxRes);
  historyStack = [snapshot(ctxRes)];
  redoStack = [];
  updateInfo();
});

dropArea.addEventListener("click", () => fileInput.click());

bindDropArea(dropAreaKey, async (files) => {
  const file = files[0];
  if (!file) return;
  keyImageBitmap = await loadImageFromFile(file);
  dropAreaKey.querySelector("div").innerHTML = `<strong>Key loaded:</strong> ${file.name}`;
});

fileKeyInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  keyImageBitmap = await loadImageFromFile(file);
  dropAreaKey.querySelector("div").innerHTML = `<strong>Key loaded:</strong> ${file.name}`;
});

dropAreaKey.addEventListener("click", () => fileKeyInput.click());

// Dynamic inputs for operations
function renderInputs() {
  dynamicInputs.innerHTML = "";
  const op = opSelect.value;
  keyImageCard.style.display = op === "xor_image" ? "block" : "none";
  if (op === "invert") {
    // nothing
  } else if (op === "add") {
    dynamicInputs.append(createNumberRow("value", "Value (0-255)", 64, 0, 255));
    dynamicInputs.append(createSelectRow("channel", "Channel", ["All","R","G","B"]));
  } else if (op === "xor_const") {
    dynamicInputs.append(createNumberRow("xorValue", "XOR Value (0-255)", 123, 0, 255));
  } else if (op === "xor_password") {
    dynamicInputs.append(createTextRow("password", "Password", ""));
    dynamicInputs.append(createNumberRow("salt", "Salt (0-2^31-1)", 1337, 0, 2147483647));
  } else if (op === "xor_image") {
    // alignment handled in card
  } else if (op === "shuffle") {
    dynamicInputs.append(createNumberRow("seed", "Seed (0-2^31-1)", 20240517, 0, 2147483647));
    dynamicInputs.append(createSelectRow("dimension", "Shuffle By", ["Pixels","Rows","Columns"]));
  }
}

function createRow(labelText, inputEl) {
  const row = document.createElement("div");
  row.className = "row";
  const label = document.createElement("label");
  label.className = "w-40";
  label.textContent = labelText;
  const wrap = document.createElement("div");
  wrap.className = "w-60";
  wrap.append(inputEl);
  row.append(label, wrap);
  return row;
}

function createNumberRow(id, label, value, min, max) {
  const input = document.createElement("input");
  input.type = "number";
  input.id = id;
  input.value = String(value);
  if (min !== undefined) input.min = String(min);
  if (max !== undefined) input.max = String(max);
  return createRow(label, input);
}

function createTextRow(id, label, value) {
  const input = document.createElement("input");
  input.type = id === "password" ? "password" : "text";
  input.id = id;
  input.placeholder = label;
  input.value = value || "";
  return createRow(label, input);
}

function createSelectRow(id, label, options) {
  const select = document.createElement("select");
  select.id = id;
  for (const opt of options) {
    const o = document.createElement("option");
    o.value = opt.toLowerCase();
    o.textContent = opt;
    select.append(o);
  }
  return createRow(label, select);
}

opSelect.addEventListener("change", renderInputs);
renderInputs();

// PRNG for deterministic operations
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str, salt) {
  let h = 2166136261 ^ (salt >>> 0);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Operations
function applyInvert(imageData) {
  const data = imageData.data;
  const preserveAlpha = preserveAlphaCheckbox.checked;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
    if (!preserveAlpha) data[i + 3] = 255 - data[i + 3];
  }
}

function applyAdd(imageData, value, channel) {
  const data = imageData.data;
  const preserveAlpha = preserveAlphaCheckbox.checked;
  const channels = channel.toLowerCase();
  for (let i = 0; i < data.length; i += 4) {
    if (channels === "all" || channels === "r") data[i] = clampByte(data[i] + value);
    if (channels === "all" || channels === "g") data[i + 1] = clampByte(data[i + 1] + value);
    if (channels === "all" || channels === "b") data[i + 2] = clampByte(data[i + 2] + value);
    if (!preserveAlpha) data[i + 3] = clampByte(data[i + 3] + value);
  }
}

function applyXorConst(imageData, value) {
  const data = imageData.data;
  const preserveAlpha = preserveAlphaCheckbox.checked;
  for (let i = 0; i < data.length; i += 4) {
    data[i] ^= value;
    data[i + 1] ^= value;
    data[i + 2] ^= value;
    if (!preserveAlpha) data[i + 3] ^= value;
  }
}

function applyXorPassword(imageData, password, salt) {
  const preserveAlpha = preserveAlphaCheckbox.checked;
  const seed = stringToSeed(password, salt >>> 0);
  const rng = mulberry32(seed);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = Math.floor(rng() * 256) & 255;
    const g = Math.floor(rng() * 256) & 255;
    const b = Math.floor(rng() * 256) & 255;
    const a = Math.floor(rng() * 256) & 255;
    data[i] ^= r;
    data[i + 1] ^= g;
    data[i + 2] ^= b;
    if (!preserveAlpha) data[i + 3] ^= a;
  }
}

function fitKeyImageToTarget(keyBmp, targetW, targetH, mode) {
  const off = document.createElement("canvas");
  off.width = targetW; off.height = targetH;
  const octx = off.getContext("2d");
  if (mode === "resize") {
    octx.drawImage(keyBmp, 0, 0, targetW, targetH);
  } else if (mode === "tile") {
    const pattern = octx.createPattern(keyBmp, "repeat");
    octx.fillStyle = pattern;
    octx.fillRect(0,0,targetW,targetH);
  } else if (mode === "crop") {
    // center-crop to target
    const sx = Math.max(0, (keyBmp.width - targetW) / 2);
    const sy = Math.max(0, (keyBmp.height - targetH) / 2);
    const sw = Math.min(keyBmp.width, targetW);
    const sh = Math.min(keyBmp.height, targetH);
    octx.drawImage(keyBmp, sx, sy, sw, sh, 0, 0, targetW, targetH);
  }
  return octx.getImageData(0, 0, targetW, targetH);
}

function applyXorImage(imageData, keyBmp, fitMode) {
  const { width, height } = imageData;
  const keyData = fitKeyImageToTarget(keyBmp, width, height, fitMode);
  const data = imageData.data;
  const k = keyData.data;
  const preserveAlpha = preserveAlphaCheckbox.checked;
  for (let i = 0; i < data.length; i += 4) {
    data[i] ^= k[i];
    data[i + 1] ^= k[i + 1];
    data[i + 2] ^= k[i + 2];
    if (!preserveAlpha) data[i + 3] ^= k[i + 3];
  }
}

function applyShuffle(imageData, seed, dimension, inverse = false) {
  const { width, height, data } = imageData;
  const rng = mulberry32(seed >>> 0);

  if (dimension === "pixels") {
    // Shuffle pixel indices as blocks of 4
    const numPixels = width * height;
    const indices = new Uint32Array(numPixels);
    for (let i = 0; i < numPixels; i++) indices[i] = i;
    // Fisher-Yates
    for (let i = numPixels - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
    }
    const copy = new Uint8ClampedArray(data);
    if (!inverse) {
      for (let i = 0; i < numPixels; i++) {
        const from = indices[i] * 4;
        const to = i * 4;
        data[to] = copy[from];
        data[to + 1] = copy[from + 1];
        data[to + 2] = copy[from + 2];
        data[to + 3] = copy[from + 3];
      }
    } else {
      for (let i = 0; i < numPixels; i++) {
        const from = i * 4;
        const to = indices[i] * 4;
        data[to] = copy[from];
        data[to + 1] = copy[from + 1];
        data[to + 2] = copy[from + 2];
        data[to + 3] = copy[from + 3];
      }
    }
  } else if (dimension === "rows") {
    const indices = new Uint32Array(height);
    for (let i = 0; i < height; i++) indices[i] = i;
    for (let i = height - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
    }
    const copy = new Uint8ClampedArray(data);
    const rowBytes = width * 4;
    if (!inverse) {
      for (let row = 0; row < height; row++) {
        const from = indices[row] * rowBytes;
        const to = row * rowBytes;
        data.set(copy.subarray(from, from + rowBytes), to);
      }
    } else {
      for (let row = 0; row < height; row++) {
        const from = row * rowBytes;
        const to = indices[row] * rowBytes;
        data.set(copy.subarray(from, from + rowBytes), to);
      }
    }
  } else if (dimension === "columns") {
    const indices = new Uint32Array(width);
    for (let i = 0; i < width; i++) indices[i] = i;
    for (let i = width - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
    }
    const copy = new Uint8ClampedArray(data);
    if (!inverse) {
      for (let x = 0; x < width; x++) {
        const fromCol = indices[x];
        for (let y = 0; y < height; y++) {
          const src = (y * width + fromCol) * 4;
          const dst = (y * width + x) * 4;
          data[dst] = copy[src];
          data[dst + 1] = copy[src + 1];
          data[dst + 2] = copy[src + 2];
          data[dst + 3] = copy[src + 3];
        }
      }
    } else {
      for (let x = 0; x < width; x++) {
        const toCol = indices[x];
        for (let y = 0; y < height; y++) {
          const src = (y * width + x) * 4;
          const dst = (y * width + toCol) * 4;
          data[dst] = copy[src];
          data[dst + 1] = copy[src + 1];
          data[dst + 2] = copy[src + 2];
          data[dst + 3] = copy[src + 3];
        }
      }
    }
  }
}

function getInputValue(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el.type === "number") return Number(el.value);
  return el.value;
}

function applyOperation() {
  if (!currentImageData) return;
  const mode = modeSelect.value; // encrypt/decrypt (affects add/subtract and shuffle direction)
  const op = opSelect.value;
  pushHistory(currentImageData);
  const next = new ImageData(new Uint8ClampedArray(currentImageData.data), currentImageData.width, currentImageData.height);

  if (op === "invert") {
    applyInvert(next);
  } else if (op === "add") {
    const val = getInputValue("value") | 0;
    const ch = getInputValue("channel");
    applyAdd(next, mode === "encrypt" ? val : -val, ch);
  } else if (op === "xor_const") {
    const val = getInputValue("xorValue") | 0;
    applyXorConst(next, val & 255);
  } else if (op === "xor_password") {
    const pwd = String(getInputValue("password"));
    const salt = getInputValue("salt") >>> 0;
    applyXorPassword(next, pwd, salt);
  } else if (op === "xor_image") {
    if (!keyImageBitmap) { alert("Please load a key image."); return; }
    applyXorImage(next, keyImageBitmap, keyImageFit.value);
  } else if (op === "shuffle") {
    const seed = getInputValue("seed") >>> 0;
    const dim = getInputValue("dimension");
    applyShuffle(next, seed, dim, mode === "decrypt");
  }

  ctxRes.putImageData(next, 0, 0);
  currentImageData = snapshot(ctxRes);
  updateInfo();
}

btnApply.addEventListener("click", applyOperation);

// Undo/Redo
btnUndo.addEventListener("click", () => {
  if (historyStack.length <= 1) return;
  const last = historyStack.pop();
  redoStack.push(last);
  const prev = historyStack[historyStack.length - 1];
  restoreImageData(prev);
});

btnRedo.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const img = redoStack.pop();
  historyStack.push(img);
  restoreImageData(img);
});

btnReset.addEventListener("click", resetToOriginal);

// Download
btnDownload.addEventListener("click", () => {
  if (!currentImageData) return;
  const link = document.createElement("a");
  link.download = "encrypted.png";
  link.href = canvasResult.toDataURL("image/png");
  link.click();
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    btnUndo.click();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
    e.preventDefault();
    btnRedo.click();
  } else if (e.key.toLowerCase() === "r") {
    e.preventDefault();
    btnReset.click();
  } else if (e.key.toLowerCase() === "d") {
    e.preventDefault();
    btnDownload.click();
  }
});

// Init preview for small canvas and helpful text
function init() {
  setCanvasSize(480, 320);
  const g = ctxOrig.createLinearGradient(0,0,0,320);
  g.addColorStop(0,"#1b2a5a");
  g.addColorStop(1,"#0d142e");
  ctxOrig.fillStyle = g; ctxOrig.fillRect(0,0,480,320);
  ctxRes.fillStyle = "#0d142e"; ctxRes.fillRect(0,0,480,320);
  updateInfo();
}

init();

