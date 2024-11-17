const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function createImageGridWithTitles(imagePaths, outputImagePath) {

    // Validate the number of images and titles
    if (imagePaths.length !== 9) {
        throw new Error("You must provide exactly 9 images");
    }

    const gridWidth = 3800;
    const gridHeight = 2000;
    const fontFile = "./fonts/COMICBD.TTF";
    const text1 = "jumping jacks";
    const text2 = "High Plank";
    const text3 = "Flutter Kicks";
    const text4 = "Push ups";
    const text5 = "jumping jacks";
    const text7 = "Burpees";
    const text8 = "Squats";
    const text9 = "Bicvcle Crunches";
    const text10 = "8 Handpicked Exercises";
    const text11 = "Full Body Workout";
    const text10Color = "#f75e45";
    const text11Color = "white";
    const boxColor = "#eaedec";
    const boxpadding = 90

    const drawtext = `drawtext=text=${text10}:fontfile=${fontFile}:fontcolor=${text10Color}:fontsize=200:x=(w-text_w)/2:y=(h-text_h)/2 - 210:box=1:boxcolor=white:boxborderw=${boxpadding}`;

    const drawtext1 = `drawtext=text=${text11}:fontfile=${fontFile}:fontcolor=${text11Color}:fontsize=310:x=(w-text_w)/2:y=(h-text_h)/2 + 210:box=1:boxcolor=${text10Color}:boxborderw=${boxpadding}`;

    const drawbox = `drawbox=w=3800:h=1980:color=${boxColor}:t=fill, ${drawtext}, ${drawtext1}`;

    // FFmpeg arguments
    const ffmpegArgs = [
        ...imagePaths.flatMap(img => ['-i', img]),
        '-filter_complex', `[0]scale=${gridWidth}:${gridHeight},drawtext=text=${text1}:fontfile=${fontFile}:fontcolor=white:fontsize=350:x=(w-text_w)/2:y=(h-text_h)/2[v0];
            [1]scale=${gridWidth}:${gridHeight},drawtext=text=${text2}:fontfile=${fontFile}:fontcolor=white:fontsize=350:x=(w-text_w)/2:y=(h-text_h)/2[v1];
            [2]scale=${gridWidth}:${gridHeight},drawtext=text=${text3}:fontfile=${fontFile}:fontcolor=white:fontsize=350:x=(w-text_w)/2:y=(h-text_h)/2[v2];
            [3]scale=${gridWidth}:${gridHeight},drawtext=text=${text4}:fontfile=${fontFile}:fontcolor=white:fontsize=350:x=(w-text_w)/2:y=(h-text_h)/2[v3];
            [4]scale=${gridWidth}:${gridHeight},${drawbox}[v4];
            [5]scale=${gridWidth}:${gridHeight},drawtext=text=${text5}:fontfile=${fontFile}:fontcolor=white:fontsize=350:x=(w-text_w)/2:y=(h-text_h)/2[v5];
            [6]scale=${gridWidth}:${gridHeight},drawtext=text=${text7}:fontfile=${fontFile}:fontcolor=white:fontsize=350:x=(w-text_w)/2:y=(h-text_h)/2[v6];
            [7]scale=${gridWidth}:${gridHeight},drawtext=text=${text8}:fontfile=${fontFile}:fontcolor=white:fontsize=350:x=(w-text_w)/2:y=(h-text_h)/2[v7];
            [8]scale=${gridWidth}:${gridHeight},drawtext=text=${text9}:fontfile=${fontFile}:fontcolor=white:fontsize=350:x=(w-text_w)/2:y=(h-text_h)/2[v8];
            [v0][v1][v2][v3][v4][v5][v6][v7][v8]xstack=inputs=9:layout=0_0|0_h0|0_h0+h1|w0_0|w0_h0|w0_h0+h1|w0+w3_0|w0+w3_h0|w0+w3_h0+h1;`,
        '-y',
        outputImagePath
    ];

    console.log('FFmpeg Arguments:', ffmpegArgs.join(' '));

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    ffmpeg.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    ffmpeg.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    ffmpeg.on('error', (err) => {
        console.error('Failed to start subprocess:', err);
    });

    ffmpeg.on('close', (code) => {
        if (code === 0) {
            console.log(`Image grid created successfully: ${outputImagePath}`);
        } else {
            console.error(`FFmpeg process exited with code: ${code}`);
        }
    });
}

// Process images in a directory
async function processImagesInDirectory(inputImagePath, outputImageFilePath) {
    fs.readdir(inputImagePath, (err, files) => {
        if (err) {
            console.error(`Unable to scan directory: ${err}`);
            return;
        }

        const imagePaths = [];
        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                imagePaths.push(path.join(inputImagePath, file));
            }
        });

        // Only call createImageGridWithTitles if we have exactly 9 images
        if (imagePaths.length === 9) { // Changed to match 9 images
            const outputFileName = 'output_image.png'; // Customize output filename as needed
            const outputImagePath = path.join(outputImageFilePath, outputFileName);
            createImageGridWithTitles(imagePaths, outputImagePath);
        } else {
            console.error('You must provide exactly 9 images to create the grid, found: ' + imagePaths.length);
        }
    });
}

const inputImagePath = path.join(__dirname, '../input');
const outputImageFilePath = path.join(__dirname, '../output');

processImagesInDirectory(inputImagePath, outputImageFilePath);