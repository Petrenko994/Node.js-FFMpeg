const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Function to create an effect on the image
function createImageEffect(inputFolder, outputFolder) {
    /*
    inputFolder: images of input folder.
    outputFolder: images of output folder.
    */
    const ffprobe = spawn('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', inputFolder]);

    ffprobe.stdout.on('data', (data) => {
        const [width, height] = data.toString().trim().split(',').map(Number);

        let text1,
            text2,
            text1FontFile,
            text2FontFile,
            fontSize

        text1 = "20 MIN FULL ";
        text2 = "BODY WORKOUT";
        text1FontFile = "./fonts/IMPACT.TTF";
        text2FontFile = "./fonts/BAHNSCHRIFT.TTF";
        fontSize = Math.min(width * 0.06, height * 0.25);

        const ffmpegCommand = [
            '-i', inputFolder,
            '-vf', `
                drawtext=text='${text1}':fontfile=${text1FontFile}:fontsize=${fontSize}:fontcolor=white:x=(W-tw)/2 - (tw-60):y=(h - text_h) / 2,
                drawtext=text='${text2}':fontfile=${text2FontFile}:fontsize=${fontSize}:fontcolor=white:x=(W-tw)/2 + 160:y=(h - text_h) / 2`,
            '-y',
            outputFolder       // Path for the output image
        ];

        const ffmpeg = spawn('ffmpeg', ffmpegCommand);
        ffmpeg.stdout.on('data', (data) => console.log(`FFmpeg stdout: ${data}`));
        ffmpeg.stderr.on('data', (data) => console.error(`FFmpeg stderr: ${data}`));
        ffmpeg.on('close', (code) => {
            console.log(`FFmpeg process exited with code ${code}`);
        });
    });

    ffprobe.stderr.on('data', (data) => console.error(`FFprobe stderr: ${data}`));
    ffprobe.on('close', (code) => {
        if (code !== 0) {
            console.error(`FFprobe process exited with code ${code}`);
        }
    });
}

// Function to process all images in the directory
function processImagesInDirectory(directoryPath, outPutDirectory) {

     /*
    directoryPath: path of input folder.
    outPutDirectory: path of output folder.
    */
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error(`Unable to scan directory: ${err}`);
            return;
        }

        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                const inputFolder = path.join(directoryPath, file);
                const outputFolder = path.join(outPutDirectory, `output_${file}`);

                console.log(`Processing ${inputFolder}...`);
                createImageEffect(inputFolder, outputFolder);
            }
        });
    });
}

// Example usage
const imagesDirectoryPath = path.join(__dirname, '../input'); // /input: my test input directory.so you can change it.
const imageOutDirectoryPath = path.join(__dirname, '../output'); // /output: my test output directory.so you can change it.

processImagesInDirectory(imagesDirectoryPath, imageOutDirectoryPath);