# Image Encryption Studio

Client-side web app to encrypt/decrypt images using reversible pixel operations. All processing happens locally in your browser; no uploads.

## Features

- Invert colors
- Add/Subtract value (per-channel or all)
- XOR with constant value
- XOR with password-derived keystream (seeded PRNG)
- XOR with key image (resize/tile/crop alignment)
- Pixel shuffle by seed (pixels/rows/columns)
- Preserve alpha option
- Undo/Redo, Reset
- Drag & drop for main and key images
- Export PNG
- Keyboard shortcuts: R, D, Ctrl+Z, Ctrl+Y

## How to run

Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari). No server required.

## Notes

- The operations are invertible if you use the same parameters (seed, password, salt, key image alignment, etc.). Keep track of them to decrypt.
- Pixel shuffle uses a deterministic PRNG with the provided seed; applying the same shuffle again reverses it.
- Password keystream uses a fast PRNG for demonstration and is not cryptographically secure. Do not use this for high-security scenarios.

