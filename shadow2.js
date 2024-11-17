const sharp = require('sharp');
const path = require("path");
const fs = require("fs");

async function createCircularShadow(baseImage, outputImage) {
    const shadowColor = '#9fadc4'; // Light black color with some transparency
    const shadowBlur = 100; // Set the amount of blur

    // Get the dimensions of the original image
    const { width, height } = await sharp(baseImage).metadata();

    // Create a circular shadow image
    const shadowPath = `${outputImage}_shadow.png`;

    await sharp({
        create: {
            width: width,
            height: height,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        }
    })
    .composite([{
        input: Buffer.from(
            `<svg width="${width}" height="${height}">
                <defs>
                    <filter id="blur">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="${shadowBlur}" />
                        <feColorMatrix result="blur" in="blur" type="matrix" values="0 0 0 0 0
                                                                                      0 0 0 0 0
                                                                                      0 0 0 0 0
                                                                                      0 0 0 1 0"
                        />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="blur" />
                        </feMerge>
                    </filter>
                </defs>
                <circle cx="${width / 2 }" cy="${height / 2}" r="${width / 2 * 1.1}" fill="${shadowColor}" filter="url(#blur)" />
            </svg>`
        ),
        blend: 'over', // Overlay the shadow
        top: 0,
        left: 0
    }])
    .toFile(shadowPath);

    // Composite the shadow and the original image
    await sharp(shadowPath)
        .composite([{
            input: baseImage,
            top: 0,
            left: 0
        }])
        .toFile(outputImage);

    console.log('Shadow added successfully to the circular image!');
}

async function processImagesInDirectory(inputImagePath, outputImagePath) {
    fs.readdir(inputImagePath, (err, files) => {
        if (err) {
            console.error(`Unable to scan directory: ${err}`);
            return;
        }
 
        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                const baseImage = path.join(inputImagePath, file);
                const outputImage = path.join(outputImagePath, `output_${file}`);
 
                console.log(`Processing ${inputImagePath}...`);
                createCircularShadow(baseImage, outputImage);
            }
        });
    });
}

// Example usage
const inputImagePath = path.join(__dirname, '../input');
const outputImagePath = path.join(__dirname, '../output');

processImagesInDirectory(inputImagePath, outputImagePath);