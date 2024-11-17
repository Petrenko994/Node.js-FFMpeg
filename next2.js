const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises'); // Use Promises-based fs

// Function to create an effect on the image
async function createImageEffect(inputImage, smallImage, outputImage) {
    try {
        const [width, height] = await getImageDimensions(inputImage);
        
        const newSmallWidth = Math.floor(width * 0.366);
        const newSmallHeight = Math.floor(height * 0.53);
        const overlayX = (width - newSmallWidth) - 23; // 23px from the right
        const overlayY = 28; // Vertically centered
        const boxpaddingTop = newSmallHeight;
        const boxpaddingRight = newSmallWidth + 2;

        const ffmpegCommand = [
            '-i', inputImage,
            '-i', smallImage,
            '-filter_complex',
            // Add text to the main image first
            `[1:v]scale=${newSmallWidth}:${newSmallHeight}[blurred_small]; ` +
            `[main_with_text][blurred_small]overlay=${overlayX}:${overlayY}`, // Overlay small image on top of text
            '-y', // Overwrite if necessary
            outputImage
        ];

        // Spawn the ffmpeg process
        const ffmpeg = spawn('ffmpeg', ffmpegCommand);
        ffmpeg.stdout.on('data', data => console.log(`FFmpeg stdout: ${data.toString()}`));
        ffmpeg.stderr.on('data', data => console.error(`FFmpeg stderr: ${data.toString()}`));
        ffmpeg.on('close', code => {
            console.log(`FFmpeg process exited with code ${code}`);
            if (code !== 0) {
                console.error("An error occurred, check the FFmpeg output for details.");
            }
        });
    } catch (error) {
        console.error(`Error creating effect: ${error.message}`);
    }
}

// Helper function to get image dimensions using ffprobe
async function getImageDimensions(imagePath) {
    const ffprobe = spawn('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', imagePath]);
    const ffprobeOutput = await new Promise((resolve, reject) => {
        ffprobe.stdout.on('data', (data) => resolve(data.toString()));
        ffprobe.stderr.on('data', (data) => console.error(`FFprobe stderr: ${data.toString()}`));
        ffprobe.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`FFprobe exited with code ${code}`));
            }
        });
    });

    return ffprobeOutput.trim().split(',').map(Number);
}

// Function to process all images in the directory
async function processImagesInDirectory(directoryPath, smallDirectoryPath, outPutDirectory) {
    try {
        const files = await fs.readdir(directoryPath);
        const smallFiles = await fs.readdir(smallDirectoryPath);

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                const inputFilePath = path.join(directoryPath, file);
                
                for (const smallFile of smallFiles) {
                    const smallExt = path.extname(smallFile).toLowerCase();
                    if (['.jpg', '.jpeg', '.png', '.gif'].includes(smallExt)) {
                        const smallFilePath = path.join(smallDirectoryPath, smallFile);
                        const outputFilePath = path.join(outPutDirectory, `output_${path.basename(file, ext)}.png`);
                        
                        // Create effect
                        await createImageEffect(inputFilePath, smallFilePath, outputFilePath);
                    }
                }
            }
        }
    } catch (err) {
        console.error(`Unable to scan directory: ${err.message}`);
    }
}

// Example usage
const imagesDirectoryPath = path.join(__dirname, '../input');
const smallDirectoryPath = path.join(__dirname, "../small");
const imageOutDirectoryPath = path.join(__dirname, '../output');

processImagesInDirectory(imagesDirectoryPath, smallDirectoryPath, imageOutDirectoryPath);