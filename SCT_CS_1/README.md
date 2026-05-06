# Caesar Cipher Web App

Simple, responsive Caesar Cipher tool.

## Features
- Encrypt and Decrypt (shift: -25..25)
- Clear input/output
- Copy output to clipboard
- Light/Dark mode toggle (persisted)
- Shortcuts: Ctrl+E (Encrypt), Ctrl+D (Decrypt), Ctrl+L (Clear)

## Usage
Open `index.html` in a modern browser. No build step required.

## Notes
- Decrypt = Encrypt with negative shift
- Shift is taken modulo 26