const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ultra minimalist icon generator:
// Single transparent background with a crisp, solid Electric Cyan geometric lightning emblem (#38bdf8).
// Zero box containers, zero borders, zero background shapes, zero text.
function createPureMinimalPNG(width, height) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  const ihdrLength = Buffer.from([0x00, 0x00, 0x00, 0x0D]);
  const ihdrType = Buffer.from('IHDR', 'ascii');
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const crc32 = (buf) => {
    let table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c;
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    return (crc ^ 0xFFFFFFFF) >>> 0;
  };

  const ihdrCrcBuf = Buffer.alloc(4);
  ihdrCrcBuf.writeUInt32BE(crc32(Buffer.concat([ihdrType, ihdrData])), 0);
  const ihdrChunk = Buffer.concat([ihdrLength, ihdrType, ihdrData, ihdrCrcBuf]);

  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;

    const ny = (y / height) * 2 - 1; // -1 to 1

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + (x * 4);
      const nx = (x / width) * 2 - 1; // -1 to 1

      // Precise pure lightning bolt geometry math
      const isTopSegment = (ny >= -0.75 && ny < 0.08 && (nx - ny * 0.55) > 0.02 && (nx - ny * 0.55) < 0.46);
      const isBottomSegment = (ny >= -0.08 && ny < 0.75 && (nx - ny * 0.55) > -0.28 && (nx - ny * 0.55) < 0.16);

      if (isTopSegment || isBottomSegment) {
        // Pure Electric Cyan (#38bdf8)
        rawData[pxOffset] = 56;     // R
        rawData[pxOffset + 1] = 189; // G
        rawData[pxOffset + 2] = 248; // B
        rawData[pxOffset + 3] = 255; // A (Opaque)
      } else {
        // Transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressedData.length, 0);
  const idatType = Buffer.from('IDAT', 'ascii');
  const idatCrcBuf = Buffer.alloc(4);
  idatCrcBuf.writeUInt32BE(crc32(Buffer.concat([idatType, compressedData])), 0);
  const idatChunk = Buffer.concat([idatLength, idatType, compressedData, idatCrcBuf]);

  const iendLength = Buffer.from([0x00, 0x00, 0x00, 0x00]);
  const iendType = Buffer.from('IEND', 'ascii');
  const iendCrcBuf = Buffer.alloc(4);
  iendCrcBuf.writeUInt32BE(crc32(iendType), 0);
  const iendChunk = Buffer.concat([iendLength, iendType, iendCrcBuf]);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

[16, 32, 48, 128].forEach(size => {
  const pngBuf = createPureMinimalPNG(size, size);
  fs.writeFileSync(path.join(__dirname, `icon-${size}.png`), pngBuf);
  console.log(`Pure minimal icon-${size}.png created.`);
});
