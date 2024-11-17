const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Function to create a text image
function createTextImage(outputFile, timmerDirectory) {
    console.log(timmerDirectory)

    let restText, 
        restTextColor, 
        restTextFontSize, 
        rest_x, 
        rest_y, 
        text1, 
        text1_x, 
        text2, 
        text3, 
        text2_x, 
        text3_x, 
        text2_H, 
        text3_H,
        text1FontSize,
        text2FontSize,
        text3FontSize,
        text4FontSize,
        backgroundColor,
        padding,
        width,
        height,
        fontfile,
        fontfile1,
        restTextColor1,
        timerPositionX,
        timerPositionY,
        paddedHeight;

    width = 1070,
    height = 556,
    restText = "Rest";
    restTextColor = "white"
    restTextFontSize = Math.min(width * 0.05, height / 0.05);
    text1FontSize = Math.min(width * 0.04, height / 0.04);
    text2FontSize = Math.min(width * 0.04, height / 0.04);
    text3FontSize = Math.min(width * 0.025, height / 0.026);
    text4FontSize = Math.min(width * 0.1, height / 0.2);
    rest_x = width * 0.17;
    rest_y = height * 0.16;
    text1_x = width * 0.1;
    text2_x = width * 0.03;
    text2_H = height * 0.06;
    text3_H = height * 0.05;
    text3_x = width * 0.2;
    text1 = "Next";
    text2 = "Exercise";
    text3 = "DOUBLE ELBOW CRUNCE",
    backgroundColor = "#000000",
    padding = 50; // Define padding size
    fontfile = "./fonts/ARIALI.TTF"
    fontfile1 = "./fonts/CAMBRIAZ.TTF"
    restTextColor1 = "red";
    timerPositionX = 20;
    timerPositionY = 30;

    // Adjust the width and height to account for padding
    paddedHeight = height + padding * 2;

    const ffmpegCommand = [
        '-f', 'lavfi',
        '-i', `color=c=${backgroundColor}:s=${width}x${height}:d=1`, // Use a black background
        '-i', timmerDirectory,
        '-filter_complex', `
            [0:v][1:v]overlay=${timerPositionX}:${timerPositionY},
            drawtext=text=${restText}:fontfile=${fontfile1}:fontcolor=${restTextColor1}:fontsize=${restTextFontSize}:x=${rest_x}:y=${rest_y},
            drawtext=text=${text1}:fontfile=${fontfile}:fontcolor=${restTextColor}:fontsize=${text1FontSize}:x=${text1_x}:y=(H-text_h)/2,
            drawtext=text=${text2}:fontfile=${fontfile}:fontcolor=${restTextColor}:fontsize=${text2FontSize}:x=${text2_x}:y=(H-text_h)/2 + ${text2_H},
            drawtext=text=${text3}:fontfile=${fontfile}:fontcolor=${restTextColor}:fontsize=${text3FontSize}:x=${text3_x}:y=(H-text_h)/2 + ${text3_H},`,
        '-frames:v', '1', // Ensure that only one image is generated
        '-y', // Overwrite output file
        outputFile
    ];

    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', ffmpegCommand);

        ffmpeg.on('close', (code) => {
            if (code !== 0) {
                reject(`FFmpeg process exited with code ${code}`);
            } else {
                resolve();
            }
        });
        
        ffmpeg.stderr.on('data', (data) => {
            console.error(`FFmpeg stderr: ${data.toString()}`);
        });
    });
}

// Function to create an effect on the image
async function createImageEffect(inputFile,timmerDirectory, outputFile) {
    const ffprobe = spawn('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', inputFile]);

    ffprobe.stdout.on('data', async (data) => {
        const textOutputFile = outputFile.replace(/output_/, 'text_');
        const width = 1070;
        const height = 556;
        const imageWidth = Math.floor(width * 0.46); // 45% of total width
        const imageHeight = Math.floor(height * 0.50); // 30% of total height
        const imagePositionX = (width-width/2) / 2 + 305; // Centering the image in the right box
        const imagePositionY = (height - height/2) / 2 + 20; 
        
        try {
            // Create the text image first
            await createTextImage(textOutputFile, timmerDirectory);

            // Combine original image and text image
            const ffmpegCommand = [
                '-i', textOutputFile,
                '-i', inputFile,
                '-filter_complex', 
                `[1:v]scale=${imageWidth}:${imageHeight}[blurred_small]; ` +
                `[main_with_text][blurred_small]overlay=${imagePositionX}:${imagePositionY};`,
                '-y', // Overwrite output file
                outputFile
            ];

            const ffmpeg = spawn('ffmpeg', ffmpegCommand);
            ffmpeg.stderr.on('data', (data) => console.error(`FFmpeg stderr: ${data}`));
            ffmpeg.on('close', (code) => {
                console.log(`FFmpeg process exited with code ${code}`);
            });
        } catch (error) {
            console.error(`Error creating text image: ${error}`);
        }
    });

    ffprobe.stderr.on('data', (data) => console.error(`FFprobe stderr: ${data.toString()}`));
    ffprobe.on('close', (code) => {
        if (code !== 0) {
            console.error(`FFprobe process exited with code ${code}`);
        }
    });
}

// Function to process all images in the directory
async function processImagesInDirectory(directoryPath,timmerDirectoryPath, outPutDirectory) {
    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
            const inputFile = path.join(directoryPath, file);
            const outputFile = path.join(outPutDirectory, `output_${file}`);
            const timmerDirectory = timmerDirectoryPath;

            console.log(`Processing ${inputFile}...`);
            await createImageEffect(inputFile, timmerDirectory, outputFile);
        }
    }
}

// Example usage
const imagesDirectoryPath = path.join(__dirname, '../input');
const timmerDirectoryPath = path.join(__dirname, "../small/timer.png")
const imageOutDirectoryPath = path.join(__dirname, '../output');

processImagesInDirectory(imagesDirectoryPath,timmerDirectoryPath, imageOutDirectoryPath).catch(console.error);