/**
 * Extract dominant color from an image URL using canvas
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<{r: number, g: number, b: number}>} - RGB values
 */
export async function extractDominantColor(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Sample a small area for performance
            const sampleSize = 50;
            canvas.width = sampleSize;
            canvas.height = sampleSize;

            ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

            try {
                const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
                const data = imageData.data;

                let r = 0, g = 0, b = 0, count = 0;

                // Sample every 4th pixel for performance
                for (let i = 0; i < data.length; i += 16) {
                    // Skip very dark or very light pixels
                    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    if (brightness > 30 && brightness < 225) {
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                }

                if (count > 0) {
                    resolve({
                        r: Math.round(r / count),
                        g: Math.round(g / count),
                        b: Math.round(b / count)
                    });
                } else {
                    // Fallback to a default color
                    resolve({ r: 99, g: 102, b: 241 });
                }
            } catch (e) {
                // CORS or other error, return default
                resolve({ r: 99, g: 102, b: 241 });
            }
        };

        img.onerror = () => {
            resolve({ r: 99, g: 102, b: 241 });
        };

        img.src = imageUrl;
    });
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

/**
 * Generate aura gradient colors from dominant color
 */
export function generateAuraColors(rgb) {
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Create vibrant variations
    const primary = `hsla(${hsl.h}, ${Math.min(hsl.s + 20, 100)}%, ${Math.min(hsl.l + 10, 60)}%, 0.6)`;
    const secondary = `hsla(${(hsl.h + 30) % 360}, ${Math.min(hsl.s + 10, 90)}%, ${Math.min(hsl.l + 5, 55)}%, 0.4)`;
    const tertiary = `hsla(${(hsl.h - 30 + 360) % 360}, ${Math.min(hsl.s, 80)}%, ${Math.min(hsl.l + 15, 65)}%, 0.3)`;

    return { primary, secondary, tertiary };
}
