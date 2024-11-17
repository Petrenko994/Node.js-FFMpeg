const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { clearInterval } = require('timers');

// Function to create a progress bar on a base image
function createProgressBarImage(baseImage, outputImage, progressValue) {
    // Ensure progress value is between 0 and 100
    if (progressValue < 0 || progressValue > 100) {
        throw new Error('Progress value must be between 0 and 100');
    }

    const ffprobe = spawn('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', baseImage]);

    ffprobe.stdout.on('data', (data) => {
        const [width, height] = data.toString().trim().split(',').map(Number);

        let secondesTime,
            progressBarWidth,
            progressBarHeight,
            filledWidth,
            xPosition,
            yPosition,
            barColor,
            backgroundColor,
            timeFont,
            fontSize,
            shadowColor;

        progressBarWidth = width * 0.95; // Total width of the progress bar
        progressBarHeight = height * 0.03;  // Height of the progress bar
        filledWidth = Math.round((progressValue / 100) * progressBarWidth); // Calculating filled width
        xPosition = Math.round((width - progressBarWidth) / 2);
        yPosition = 15; // Position it near the bottom, with 10 pixels of padding
        barColor='white'
        backgroundColor = "black";
        timeFont = "./fonts/CALIBRIB.TTF";
        fontSize = Math.min(width * 0.25, height * 0.25);
        shadowColor = "black"

        // Create the fill and background rectangles using drawbox
        const fillBox = `drawbox=x=${xPosition}:y=${yPosition}:w=${filledWidth}:h=${progressBarHeight}:color=${barColor}:t=fill`;

        // Background box
        const backgroundBox = `drawbox=x=${xPosition}:y=${yPosition}:w=${progressBarWidth}:h=${progressBarHeight}:color=${backgroundColor}@0.4:t=fill`;
        
        let elapsedTime = 0; // Elapsed time in seconds
        const timerInterval = setInterval(() => {
            elapsedTime ++;

            if (elapsedTime > 60) {
                clearInterval(timerInterval);
            }
            
            const timer = `drawtext=text='%{eif\\:${elapsedTime}\\:d}':x=100:y=60:fontfile=${timeFont}:fontcolor=white:fontsize=${fontSize}:shadowcolor=${shadowColor}@0.1:shadowx=4:shadowy=4`; // Uses seconds from the start
    
            const overlayCommand = [
                '-i', baseImage,
                '-vf', `${backgroundBox},${fillBox}, ${timer}`,
                '-y', // Overwrite output file
                outputImage
            ];
    
            const ffmpeg = spawn('ffmpeg', overlayCommand);
    
            ffmpeg.stdout.on('data', (data) => {
                clearInterval(timerInterval)
                console.log(`stdout: ${data}`);
            });
        
            ffmpeg.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });
        
        }, 1000);
    });

    ffprobe.stderr.on('data', (data) => console.error(`FFprobe stderr: ${data}`));
    ffprobe.on('close', (code) => {
        if (code !== 0) {
            console.error(`FFprobe process exited with code ${code}`);
        }
    });

    
}

function processImagesInDirectory(imagesDirectoryPath, imageOutDirectoryPath, progressValue) {

    /*
   imagesDirectoryPath: path of input folder.
   imageOutDirectoryPath: path of output folder.
   */
   fs.readdir(imagesDirectoryPath, (err, files) => {
       if (err) {
           console.error(`Unable to scan directory: ${err}`);
           return;
       }

       files.forEach(file => {
           const ext = path.extname(file).toLowerCase();
           if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
               const baseImage = path.join(imagesDirectoryPath, file);
               const outputImage = path.join(imageOutDirectoryPath, `output_${file}`);

               console.log(`Processing ${imagesDirectoryPath}...`);
                createProgressBarImage(baseImage, outputImage, progressValue);
        }
       });
   });
}

// Example usage
const imagesDirectoryPath = path.join(__dirname, '../input'); // /input: my test input directory.so you can change it.
const imageOutDirectoryPath = path.join(__dirname, '../output'); // /output: my test output directory.so you can change it.
const progressValue = 30; // Set your progress value here (0-100)

processImagesInDirectory(imagesDirectoryPath, imageOutDirectoryPath, progressValue);