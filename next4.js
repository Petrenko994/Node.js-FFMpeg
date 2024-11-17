const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises'); // Use Promises-based fs

// Function to create an effect on the image
async function createImageEffect(inputImage, smallImage, outputImage) {
    try {
        const [width, height] = await getImageDimensions(inputImage);

        let newSmallWidth,
            newSmallHeight,
            overlayX,
            overlayY,
            text,
            safeTextSubjectFont,
            safeTextSubjectFontColor,
            fontSizeSubject,
            boxColor,
            boxpadding,
            subject_x,
            subject_y,
            padding,
            opacity,
            tempOutputImage


        newSmallWidth = Math.floor(width * 0.31);
        newSmallHeight = Math.floor(height * 0.32);
        overlayX = 72; // 20px padding from the left
        overlayY = 115; // Adjust vertically based on padding
        text = "NEXT SHOULDER TAPS";
        safeTextSubjectFont = "./fonts/IMPACT.TTF";
        safeTextSubjectFontColor = "#323538";
        fontSizeSubject = Math.min(width * 0.02, height * 0.23);
        boxColor = "#c2cfd3";
        boxpadding = 15;
        subject_x = 85;
        subject_y = 60;
        padding = 10;
        opacity = 0.7;

        tempOutputImage = path.join(outputImage.replace('.png', '_temp.png')); // Temporary output

        // Step 1: Set opacity for the input image
        const ffmpegCommandStep1 = [
            '-i', inputImage,
            '-vf', `format=rgba,colorchannelmixer=1:0:0:0:0:1:0:0:0:0:1:0:0:0:0:${opacity}:0`, // Adjust alpha channel
            '-y', // Overwrite if necessary
            tempOutputImage
        ];

        // Spawn the ffmpeg process for the first step
        const ffmpeg1 = spawn('ffmpeg', ffmpegCommandStep1);
        ffmpeg1.stdout.on('data', data => console.log(`FFmpeg stdout (Step 1): ${data.toString()}`));
        ffmpeg1.stderr.on('data', data => console.error(`FFmpeg stderr (Step 1): ${data.toString()}`));
        
        ffmpeg1.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Error in Step 1 FFmpeg process exited with code ${code}`);
                return;
            }

            // Step 2: Use the modified image to overlay and add text
            const ffmpegCommandStep2 = [
                '-i', tempOutputImage, // Use the temp image with adjusted opacity
                '-i', smallImage,
                '-filter_complex',
                `drawtext=text='${text}':fontfile=${safeTextSubjectFont}:fontcolor=${safeTextSubjectFontColor}:fontsize=${fontSizeSubject}:x=${subject_x}:y=${subject_y + padding}:box=1:boxcolor=${boxColor}:boxborderw=${boxpadding}[main_with_text];` +
                `[1:v]scale=${newSmallWidth}:${newSmallHeight}[blurred_small];` +
                `[main_with_text][blurred_small]overlay=${overlayX}:${overlayY}`, // Overlay the small image on top of text
                '-y', // Overwrite
                outputImage
            ];

            // Spawn the ffmpeg process for the second step
            const ffmpeg2 = spawn('ffmpeg', ffmpegCommandStep2);
            ffmpeg2.stdout.on('data', data => console.log(`FFmpeg stdout (Step 2): ${data.toString()}`));
            ffmpeg2.stderr.on('data', data => console.error(`FFmpeg stderr (Step 2): ${data.toString()}`));

            ffmpeg2.on('close', code => {
                console.log(`FFmpeg process exited with code ${code}`);
                if (code !== 0) {
                    console.error("An error occurred, check the FFmpeg output for details.");
                }

                // Optionally delete the temporary output file
                fs.unlink(tempOutputImage).catch(err => console.error(`Error deleting temp file: ${err.message}`));
            });
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
async function processImagesInDirectory(imagesDirectoryPath, smallDirectoryPath, imageOutDirectoryPath) {
    try {
        const files = await fs.readdir(imagesDirectoryPath);
        const smallFiles = await fs.readdir(smallDirectoryPath);

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                const inputImage = path.join(imagesDirectoryPath, file);
                
                for (const smallFile of smallFiles) {
                    const smallExt = path.extname(smallFile).toLowerCase();
                    if (['.jpg', '.jpeg', '.png', '.gif'].includes(smallExt)) {
                        const smallImage = path.join(smallDirectoryPath, smallFile);
                        const outputImage = path.join(imageOutDirectoryPath, `output_${path.basename(file, ext)}.png`);
                        
                        // Create effect
                        await createImageEffect(inputImage, smallImage, outputImage);
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