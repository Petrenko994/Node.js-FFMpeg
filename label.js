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

        let padding, subject_x, subject_y;

        if (width < 800 || height < 600) { // Small images
            padding = 5;
            subject_x = width * 0.10;
            subject_y = height * 0.15;
        } else if (width < 1600 || height < 1200) { // Medium images
            padding = 5;
            subject_x = width * 0.12;
            subject_y = height * 0.17;
        } else { // Large images
            padding = 10;
            subject_x = width * 0.15;
            subject_y = height * 0.20;
        }

        let fontSize, 
            text,
            textSubject,
            fontSizeSubject, 
            safeTextHight, 
            safeText,
            safeTextSubject, 
            boxpadding, 
            safeTextSubjectFont, 
            safeTextFont, 
            safeTextFontColor, 
            safeTextSubjectFontColor,
            boxColor;
  
        fontSize = Math.min(width / 12, height / 4.3);
        textSubject = "SUPERMAN";
        text = "YOU'RE HALF WAY THERE!";
        fontSizeSubject = Math.min(width * 0.05, height * 0.9)
        safeText = text.replace(/'/g, "\\'");
        safeTextSubject = textSubject.replace(/'/g, "\\'");
        safeTextSubjectFont = "./fonts/CALIBRIB.TTF"; // changeable for your demand
        safeTextFont = "./fonts/IMPACT.TTF"; // changeable for your demand
        safeTextFontColor = "#fcfefe";
        safeTextSubjectFontColor = "#282f31";
        boxpadding = 18;
        safeTextHight = height * 0.28; 
        boxColor = "#c4cfd1"

        const ffmpegCommand = [
            '-i', inputFolder,
            '-vf', `drawtext=text='${safeTextSubject}':fontfile=${safeTextSubjectFont}:fontcolor=${safeTextSubjectFontColor}:fontsize=${fontSizeSubject}:x=${subject_x}:y=${subject_y}:box=1:boxcolor=${boxColor}:boxborderw=${boxpadding},
                    drawtext=text='${safeText}':fontfile=${safeTextFont}:fontcolor=${safeTextFontColor}:fontsize=${fontSize}:x=(w-text_w)/2:y=${safeTextHight + padding}`,
            '-y',
            outputFolder
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