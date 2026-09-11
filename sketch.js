let video;
let handPose;
let hands = [];

let regularFont, italicFont, bottomFont, topFont;
let penguinLogo;

let introVisible = true;
let okButton = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
};

const staticLines = [
  { text: "Without human interaction", style: "top" },
  { text: "text loses its meaning,", style: "top" },
  { text: "its connection", style: "italic" },
];

const centerPhrase1 = "Let AI remain a tool";
const centerPhrase2 = "Read. Write. Create.";

let floatingLetters = [];

const CONFIG = {
  sideTextSize: 0.12,
  centerGap: 0.025,
  edgePadding: 2,

  floatingText: [128, 9, 99, 100],
  staticText: [128, 9, 99, 100],

  popupText: [224, 68, 90, 100],
  popupBox: [128, 9, 99, 88],
  popupButton: [224, 68, 90, 100],
  popupButtonText: [128, 9, 99, 100],

  staticPaddingX: 0.12,
  staticTextSize: 0.022,
  staticLineGap: 0.008,
  staticBlockY: 0.88,

  float: {
    minSpeed: 0.12,
    maxSpeed: 0.22,
    damping: 0.999,
    turnAmount: 0.01,
    bounce: 1.0,
  },

  scanGround: {
    radiusX: 180,
    attraction: 0.044,
    damping: 0.92,
    releaseDamping: 0.992,
    snapDistance: 0.8,
    holdFrames: 90,
  },
};

function preload() {
  regularFont = loadFont("HALTimezoneUnlicensed-Regular.otf");
  italicFont = loadFont("HALTimezoneUnlicensed-Italic.otf");
  bottomFont = loadFont("HALTimezoneUnlicensed-Regular.otf");
  topFont = loadFont("HALFourGroteskUnlicensed-Bold.otf");
  penguinLogo = loadImage("MonotypePenguin2.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(2);
  colorMode(HSB, 360, 100, 100, 100);
  textAlign(LEFT, BASELINE);

  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();

  handPose = ml5.handPose(
    {
      runtime: "mediapipe",
      modelType: "full",
      maxHands: 2,
      flipped: true,
    },
    () => {
      console.log("HandPose ready");
    },
  );

  handPose.detectStart(video, (results) => {
    hands = results || [];
  });

  buildFloatingLetters();
}

function draw() {
  background(255);

  drawVideoCover(video, 0, 0, width, height);
  drawLogo();
  drawStaticTextBlock();

  if (!introVisible) {
    updateFloatingLetters();
  }

  drawFloatingLetters();

  if (introVisible) {
    drawIntroPopup();
  }
}

function buildFloatingLetters() {
  floatingLetters = [];

  const maxWidth = width * 0.88;
  let sharedSize = height * CONFIG.sideTextSize;

  sharedSize = fitSize(centerPhrase1, bottomFont, NORMAL, sharedSize, maxWidth);
  sharedSize = fitSize(centerPhrase2, italicFont, ITALIC, sharedSize, maxWidth);

  const layouts = getFloatingLayout(sharedSize);

  for (const item of layouts) {
    floatingLetters.push(
      new FloatingLetter(
        item.ch,
        sharedSize,
        item.font,
        item.style,
        item.targetX,
        item.targetY,
      ),
    );
  }
}

function getFloatingLayout(size) {
  textFont(bottomFont);
  textStyle(NORMAL);
  textSize(size);
  const phrase1W = textWidth(centerPhrase1);

  textFont(italicFont);
  textStyle(ITALIC);
  textSize(size);
  const phrase2W = textWidth(centerPhrase2);

  const startX1 = width * 0.5 - phrase1W * 0.5;
  const startX2 = width * 0.5 - phrase2W * 0.5;

  const lineHeight = size * 1.0;
  const gap = height * CONFIG.centerGap;
  const totalH = lineHeight * 2 + gap;

  const firstBaseline = height * 0.5 - totalH * 0.5 + lineHeight;
  const secondBaseline = firstBaseline + lineHeight + gap;

  const result = [];

  textFont(bottomFont);
  textStyle(NORMAL);
  textSize(size);
  let cursorX = startX1;

  for (let i = 0; i < centerPhrase1.length; i++) {
    const ch = centerPhrase1[i];
    result.push({
      ch,
      font: bottomFont,
      style: NORMAL,
      targetX: cursorX,
      targetY: firstBaseline,
    });
    cursorX += textWidth(ch);
  }

  textFont(italicFont);
  textStyle(ITALIC);
  textSize(size);
  cursorX = startX2;

  for (let i = 0; i < centerPhrase2.length; i++) {
    const ch = centerPhrase2[i];
    result.push({
      ch,
      font: italicFont,
      style: ITALIC,
      targetX: cursorX,
      targetY: secondBaseline,
    });
    cursorX += textWidth(ch);
  }

  textStyle(NORMAL);
  return result;
}

function drawStaticTextBlock() {
  const maxWidth = width * (1 - CONFIG.staticPaddingX * 2);
  let baseSize = height * CONFIG.staticTextSize;
  baseSize = fitBlockSize(staticLines, baseSize, maxWidth);

  const lineGap = height * CONFIG.staticLineGap;
  const lineHeight = baseSize * 1.0;
  const totalH =
    lineHeight * staticLines.length + lineGap * (staticLines.length - 1);

  let startY = height * CONFIG.staticBlockY - totalH * 0.5;

  for (let i = 0; i < staticLines.length; i++) {
    const line = staticLines[i];
    const font = line.style === "italic" ? italicFont : topFont;
    const style = line.style === "italic" ? ITALIC : NORMAL;

    textFont(font);
    textStyle(style);
    textSize(baseSize);

    const w = textWidth(line.text);
    const x = width * 0.5 - w * 0.5;
    const y = startY + lineHeight;

    fill(...CONFIG.staticText);
    noStroke();
    text(line.text, x, y);

    startY += lineHeight + lineGap;
  }

  textStyle(NORMAL);
}

function drawLogo() {
  if (!penguinLogo) return;

  const logoHeight = height * 0.06;
  const logoWidth = logoHeight * (penguinLogo.width / penguinLogo.height);

  const x = width * 0.5 - logoWidth * 0.5;
  const y = height * 0.03;

  image(penguinLogo, x, y, logoWidth, logoHeight);
}
function drawIntroPopup() {
  push();

  noStroke();
  fill(0, 0, 0, 18);
  rect(0, 0, width, height);

  const boxW = min(width * 0.5, 560);
  const boxH = min(height * 0.19, 170);
  const boxX = width / 2 - boxW / 2;
  const boxY = height / 2 - boxH / 2;

  fill(...CONFIG.popupBox);
  rect(boxX, boxY, boxW, boxH, 22);

  // button
  okButton.w = 80;
  okButton.h = 34;
  const bottomMargin = 16;
  okButton.x = width / 2 - okButton.w / 2;
  okButton.y = boxY + boxH - okButton.h - bottomMargin;

  // message
  const line1 = "Interact with the letters";
  const line2 = "to form a connection";

  textFont(topFont);
  textStyle(NORMAL);
  textAlign(CENTER, CENTER);
  fill(...CONFIG.popupText);

  let msgSize = min(width, height) * 0.017;
  msgSize = constrain(msgSize, 14, 22);
  textSize(msgSize);

  const lineGap = msgSize * 1.15;
  const textCenterY = boxY + boxH * 0.26;

  text(line1, width / 2, textCenterY - lineGap * 0.5);
  text(line2, width / 2, textCenterY + lineGap * 0.5);

  const hovering =
    mouseX >= okButton.x &&
    mouseX <= okButton.x + okButton.w &&
    mouseY >= okButton.y &&
    mouseY <= okButton.y + okButton.h;

  fill(224, 68, hovering ? 95 : 88, 100);
  rect(okButton.x, okButton.y, okButton.w, okButton.h, 10);

  fill(0, 0, 100);
  textFont(topFont);
  textStyle(NORMAL);
  textAlign(CENTER, CENTER);
  textSize(14);
  text("OK", okButton.x + okButton.w / 2, okButton.y + okButton.h / 2);

  pop();
}

class FloatingLetter {
  constructor(ch, size, font, style, targetX, targetY) {
    this.ch = ch;
    this.size = size;
    this.font = font;
    this.style = style;
    this.target = createVector(targetX, targetY);

    textFont(font);
    textStyle(style);
    textSize(size);

    this.w = max(textWidth(ch || " "), size * 0.2);
    this.h = size * 0.8;

    const p = getRandomFloatingPosition(this.w, this.h);
    this.pos = createVector(p.x, p.y);

    const angle = random(TWO_PI);
    const speed = random(CONFIG.float.minSpeed, CONFIG.float.maxSpeed);
    this.vel = p5.Vector.fromAngle(angle).mult(speed);

    this.groundHold = 0;
  }

  setTarget(x, y) {
    this.target.set(x, y);
  }

  update() {
    this.floatMotion();
    this.applyHandGrounding();
    this.pos.add(this.vel);
    this.keepInCanvas();
  }

  floatMotion() {
    const delta = random(-CONFIG.float.turnAmount, CONFIG.float.turnAmount);
    this.vel.rotate(delta);
    this.vel.mult(CONFIG.float.damping);

    const speed = constrain(
      this.vel.mag(),
      CONFIG.float.minSpeed,
      CONFIG.float.maxSpeed,
    );
    this.vel.setMag(speed);
  }

  applyHandGrounding() {
    const palm = getPrimaryPalm();

    if (!palm || introVisible) {
      if (this.groundHold > 0) {
        this.groundHold--;
      } else {
        this.vel.mult(CONFIG.scanGround.releaseDamping);
      }
      return;
    }

    const scaledRadius = CONFIG.scanGround.radiusX * min(width / 1200, 1.4);
    const dx = abs(palm.x - this.target.x);
    const insideBand = dx <= scaledRadius;

    if (insideBand) {
      this.groundHold = CONFIG.scanGround.holdFrames;
    } else if (this.groundHold > 0) {
      this.groundHold--;
    } else {
      this.vel.mult(CONFIG.scanGround.releaseDamping);
      return;
    }

    const influence = constrain(1 - dx / scaledRadius, 0, 1);
    const eased = influence * influence * (3 - 2 * influence);

    const toTarget = p5.Vector.sub(this.target, this.pos);
    const d = toTarget.mag();

    if (d < CONFIG.scanGround.snapDistance) {
      this.pos.lerp(this.target, 0.18);
      this.vel.mult(0.6);
      return;
    }

    const pull = toTarget
      .copy()
      .mult(CONFIG.scanGround.attraction * max(eased, 0.2));

    this.vel.add(pull);
    this.vel.mult(lerp(1.0, CONFIG.scanGround.damping, max(eased, 0.35)));
  }

  keepInCanvas() {
    const left = CONFIG.edgePadding;
    const right = width - this.w - CONFIG.edgePadding;
    const top = this.h + CONFIG.edgePadding;
    const bottom = height - CONFIG.edgePadding;

    if (this.pos.x < left) {
      this.pos.x = left;
      this.vel.x = abs(this.vel.x) * CONFIG.float.bounce;
    }

    if (this.pos.x > right) {
      this.pos.x = right;
      this.vel.x = -abs(this.vel.x) * CONFIG.float.bounce;
    }

    if (this.pos.y < top) {
      this.pos.y = top;
      this.vel.y = abs(this.vel.y) * CONFIG.float.bounce;
    }

    if (this.pos.y > bottom) {
      this.pos.y = bottom;
      this.vel.y = -abs(this.vel.y) * CONFIG.float.bounce;
    }
  }

  display() {
    fill(...CONFIG.floatingText);
    noStroke();
    textFont(this.font);
    textStyle(this.style);
    textSize(this.size);
    text(this.ch, this.pos.x, this.pos.y);
    textStyle(NORMAL);
  }
}

function updateFloatingLetters() {
  for (const l of floatingLetters) {
    l.update();
  }
}

function drawFloatingLetters() {
  if (introVisible) return;

  for (const l of floatingLetters) {
    l.display();
  }
}

function getPrimaryPalm() {
  if (!hands.length || !video) return null;

  let bestPalm = null;
  let bestScore = -Infinity;

  for (const hand of hands) {
    const palm = getPalmPoint(hand);
    if (!palm) continue;

    const score = -abs(palm.x - width * 0.5);
    if (score > bestScore) {
      bestScore = score;
      bestPalm = palm;
    }
  }

  return bestPalm;
}

function getPalmPoint(hand) {
  if (!hand.keypoints || hand.keypoints.length < 18 || !video) return null;

  const wrist = findKeypoint(hand, "wrist") || hand.keypoints[0];
  const indexBase = findKeypoint(hand, "index_finger_mcp") || hand.keypoints[5];
  const pinkyBase =
    findKeypoint(hand, "pinky_finger_mcp") || hand.keypoints[17];

  if (!wrist || !indexBase || !pinkyBase) return null;

  return {
    x: ((wrist.x + indexBase.x + pinkyBase.x) / 3) * (width / video.width),
    y: ((wrist.y + indexBase.y + pinkyBase.y) / 3) * (height / video.height),
  };
}

function findKeypoint(hand, name) {
  return hand.keypoints.find((k) => k.name === name);
}

function getStaticBlockBounds() {
  const maxWidth = width * (1 - CONFIG.staticPaddingX * 2);
  let baseSize = height * CONFIG.staticTextSize;
  baseSize = fitBlockSize(staticLines, baseSize, maxWidth);

  const lineGap = height * CONFIG.staticLineGap;
  const lineHeight = baseSize * 1.0;
  const totalH =
    lineHeight * staticLines.length + lineGap * (staticLines.length - 1);

  const centerY = height * CONFIG.staticBlockY;
  const top = centerY - totalH * 0.5;
  const bottom = top + totalH;

  return { top, bottom };
}

function getRandomFloatingPosition(letterW, letterH) {
  const centerBandTop = height * 0.5 - height * 0.12;
  const centerBandBottom = height * 0.5 + height * 0.12;
  const staticBounds = getStaticBlockBounds();

  let x, y;
  let tries = 0;

  while (tries < 500) {
    x = random(CONFIG.edgePadding, width - letterW - CONFIG.edgePadding);
    y = random(letterH + CONFIG.edgePadding, height - CONFIG.edgePadding);

    const insideCenterBand = y > centerBandTop && y < centerBandBottom;
    const insideStaticBand =
      y > staticBounds.top - 20 && y < staticBounds.bottom + 20;

    if (!insideCenterBand && !insideStaticBand) {
      return { x, y };
    }
    tries++;
  }

  return {
    x: random(CONFIG.edgePadding, width - letterW - CONFIG.edgePadding),
    y: random(letterH + CONFIG.edgePadding, height - CONFIG.edgePadding),
  };
}

function fitSize(txt, font, style, size, maxWidth) {
  textFont(font);
  textStyle(style);
  textSize(size);

  while (size > 5 && textWidth(txt) > maxWidth) {
    size -= 1;
    textSize(size);
  }

  textStyle(NORMAL);
  return size;
}

function fitBlockSize(linesArr, size, maxWidth) {
  while (size > 5) {
    let fits = true;

    for (let i = 0; i < linesArr.length; i++) {
      const font = linesArr[i].style === "italic" ? italicFont : topFont;
      const style = linesArr[i].style === "italic" ? ITALIC : NORMAL;

      textFont(font);
      textStyle(style);
      textSize(size);

      if (textWidth(linesArr[i].text) > maxWidth) {
        fits = false;
        break;
      }
    }

    if (fits) break;
    size -= 1;
  }

  textStyle(NORMAL);
  return size;
}

function drawVideoCover(img, x, y, w, h) {
  if (!img || !img.width || !img.height) return;

  const imgAspect = img.width / img.height;
  const boxAspect = w / h;

  let sx, sy, sw, sh;

  if (imgAspect > boxAspect) {
    sh = img.height;
    sw = sh * boxAspect;
    sx = (img.width - sw) * 0.5;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / boxAspect;
    sx = 0;
    sy = (img.height - sh) * 0.5;
  }

  image(img, x, y, w, h, sx, sy, sw, sh);
}

function mousePressed() {
  if (!introVisible) return;

  const inside =
    mouseX >= okButton.x &&
    mouseX <= okButton.x + okButton.w &&
    mouseY >= okButton.y &&
    mouseY <= okButton.y + okButton.h;

  if (inside) {
    introVisible = false;
  }
}

function touchStarted() {
  mousePressed();
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  const maxWidth = width * 0.88;
  let sharedSize = height * CONFIG.sideTextSize;

  sharedSize = fitSize(centerPhrase1, bottomFont, NORMAL, sharedSize, maxWidth);
  sharedSize = fitSize(centerPhrase2, italicFont, ITALIC, sharedSize, maxWidth);

  const layouts = getFloatingLayout(sharedSize);

  if (layouts.length !== floatingLetters.length) {
    buildFloatingLetters();
    return;
  }

  for (let i = 0; i < floatingLetters.length; i++) {
    floatingLetters[i].size = sharedSize;
    floatingLetters[i].font = layouts[i].font;
    floatingLetters[i].style = layouts[i].style;
    floatingLetters[i].setTarget(layouts[i].targetX, layouts[i].targetY);
  }
}
