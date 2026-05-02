import { fontDBBase64, fontEBBase64 } from './fonts';

let cachedFontDB = null;
let cachedFontEB = null;

export function getDecodedFonts() {
    if (!cachedFontDB) {
        try {
            cachedFontDB = Uint8Array.from(atob(fontDBBase64), c => c.charCodeAt(0)).buffer;
            cachedFontEB = Uint8Array.from(atob(fontEBBase64), c => c.charCodeAt(0)).buffer;
        } catch (e) {
            console.error('Failed to decode fonts:', e);
        }
    }

    const fonts = [];
    if (cachedFontDB) fonts.push({ name: 'Rodin', data: cachedFontDB, weight: 400, style: 'normal' });
    if (cachedFontEB) fonts.push({ name: 'Rodin', data: cachedFontEB, weight: 700, style: 'normal' });
    return fonts;
}

export function getDecodedFontDB() {
    if (!cachedFontDB) getDecodedFonts();
    const fonts = [];
    if (cachedFontDB) fonts.push({ name: 'Rodin', data: cachedFontDB, weight: 400, style: 'normal' });
    return fonts;
}
