const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises'); // Use Promises-based fs

// Function to create an effect on the image
async function createImageEffect(inputImage, outputImage) {
    const { width, height } = await getImageDimensions(inputImage);

    let boxWidth,
        boxHeight,
        text1,
        text2,
        text3,
        boxPadding,
        text1FontFilePath,
        text2FontFilePath,
        text3FontFilePath,
        text1FontColor,
        text2FontColor,
        text3FontColor,
        boxX,
        boxY,
        text1FontSize,
        text2FontSize,
        text3FontSize,
        tempOutImage,
        totalTextHeight,
        lineSpacing;
        

    boxWidth = width /2; // Add padding to each side
    boxHeight = height / 2; // Three lines of text with top and bottom padding
    
    text1 = "10 MIN";
    text2 = "BUBBLE BUTT";
    text3 = "BEGINNER WORKOUT";
    boxPadding = 40; // Padding around the text
    text1FontFilePath = "./fonts/ARIBLK.TTF"; // Ensure font path is correct
    text2FontFilePath = "./fonts/ARIALBD.TTF"; // Ensure font path is correct
    text3FontFilePath = "./fonts/ARIAL.TTF"; // Ensure font path is correct
    text1FontColor = "#2e3f51";
    text2FontColor = "#040000";
    text3FontColor = "#090704";
    boxX = Math.floor((width - boxWidth) / 2);
    boxY = Math.floor((height - boxHeight) / 2);
    text1FontSize = Math.min(boxX * 0.85, boxY * 0.75);
    text2FontSize = Math.min(boxX * 0.47, boxY * 0.39);
    text3FontSize = Math.min(boxX * 0.23, boxY * 0.23);
    totalTextHeight = boxHeight + boxPadding;
    lineSpacing = totalTextHeight / 3;

    tempOutImage = path.join(outputImage.replace('.png', '_temp.png')); // Temporary output

    // Define the FFmpeg command
    const ffmpegCommand = [
        '-i', inputImage,
        '-vf',
        `drawbox=x=${boxX}:y=${boxY}:w=${boxWidth}:h=${boxHeight}:color=white:t=fill,`,
        '-y', // Overwrite output if exists
        tempOutImage
    ];

    // Execute the FFmpeg command
    const ffmpegProcess = spawn('ffmpeg', ffmpegCommand);

    ffmpegProcess.stdout.on('data', (data) => console.log(`FFmpeg stdout: ${data}`));
    ffmpegProcess.stderr.on('data', (data) => console.error(`FFmpeg stderr: ${data}`));
    ffmpegProcess.on('close', (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
        if (code !== 0) {
            console.error("Error occurred during FFmpeg processing.");
        }
        const ffmpegCommand1 = [
            '-i', tempOutImage,
            '-vf',
            `drawtext=text='${text1}':fontfile=${text1FontFilePath}:fontcolor=${text1FontColor}:fontsize=${text1FontSize}:x='(w - text_w)/2':y=${boxY + boxPadding},` +
            `drawtext=text='${text2}':fontfile=${text2FontFilePath}:fontcolor=${text2FontColor}:fontsize=${text2FontSize}:x='(w - text_w)/2':y=${boxY + boxPadding + lineSpacing},` +
            `drawtext=text='${text3}':fontfile=${text3FontFilePath}:fontcolor=${text3FontColor}:fontsize=${text3FontSize}:x='(w - text_w)/2':y=${boxY + boxPadding + 1.6 * lineSpacing}`,
            '-y',
            outputImage
        ];

        const ffmpeg2 = spawn('ffmpeg', ffmpegCommand1);
        ffmpeg2.stdout.on('data', data => console.log(`FFmpeg stdout (Step 2): ${data.toString()}`));
        ffmpeg2.stderr.on('data', data => console.error(`FFmpeg stderr (Step 2): ${data.toString()}`));

        ffmpeg2.on('close', code => {
            console.log(`FFmpeg process exited with code ${code}`);
            if (code !== 0) {
                console.error("An error occurred, check the FFmpeg output for details.");
            }

            // Optionally delete the temporary output file
            fs.unlink(tempOutImage).catch(err => console.error(`Error deleting temp file: ${err.message}`));
        });
    });
}

// Helper function to get image dimensions using ffprobe
async function getImageDimensions(inputImage) {
    const ffprobe = spawn('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', inputImage]);
    const ffprobeOutput = await new Promise((resolve, reject) => {
        ffprobe.stdout.on('data', (data) => resolve(data.toString()));
        ffprobe.stderr.on('data', (data) => console.error(`FFprobe stderr: ${data.toString()}`));
        ffprobe.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`FFprobe exited with code ${code}`));
            }
        });
    });

    const [width, height] = ffprobeOutput.trim().split(',').map(Number);
    return { width, height };
}

// Function to process all images in the directory
async function processImagesInDirectory(imagesDirectoryPath, imageOutDirectoryPath) {
    try {
        await fs.mkdir(imageOutDirectoryPath, { recursive: true }); // Ensure output directory exists
        const files = await fs.readdir(imagesDirectoryPath);

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                const inputImage = path.join(imagesDirectoryPath, file);
                const outputImage = path.join(imageOutDirectoryPath, `output_${path.basename(file, ext)}.png`);
                await createImageEffect(inputImage, outputImage);
            }
        }
    } catch (err) {
        console.error(`Unable to scan directory: ${err.message}`);
    }
}

// Example usage
const imagesDirectoryPath = path.join(__dirname, '../input');
const imageOutDirectoryPath = path.join(__dirname, '../output');

processImagesInDirectory(imagesDirectoryPath, imageOutDirectoryPath);