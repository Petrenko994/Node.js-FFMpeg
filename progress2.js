const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Function to create a progress bar on a base image
function createProgressBarImage(baseImage, outputImage, progressValue) {
    // Ensure progress value is between 0 and 3
    if (progressValue < 0 || progressValue > 3) {
        throw new Error('Progress value must be between 0 and 3');
    }

    const ffprobe = spawn('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', baseImage]);

    ffprobe.stdout.on('data', (data) => {
        const [width, height] = data.toString().trim().split(',').map(Number);

        const progressBarWidth = width * 0.025; // Total width of the progress bar
        const progressBarHeight = height * 0.7;  // Height of the progress bar
        const filledHeight = Math.round((progressValue / 3) * progressBarHeight); // Calculating filled width
        const xPosition = 1000;
        const yPosition = Math.round((height - progressBarHeight) / 2 + 30);; // Position it near the bottom, with 10 pixels of padding
        const barColor='#0099d6'
        const backgroundColor = "#414141";
        const textColor = "#414141";
        const fontSize = Math.min(progressBarWidth * 1.3, progressBarHeight * 1.3);
        const text1FontFile = "./fonts/BAHNSCHRIFT.TTF";

        // Create the fill and background rectangles using drawbox
        const fillBox = `drawbox=x=${xPosition+1}:y=${yPosition + progressBarHeight - filledHeight}:w=${progressBarWidth-2}:h=${filledHeight}:color=${barColor}:t=fill`;

        // Background box
        const backgroundBox = `drawbox=x=${xPosition}:y=${yPosition}:w=${progressBarWidth}:h=${progressBarHeight}:color=${backgroundColor}:t=1.9`;
        
        // text
        const text = `drawtext=text='${progressValue}':fontfile=${text1FontFile}:x=${xPosition + 5}:y=${yPosition - 50}:fontsize=${fontSize}:fontcolor=${textColor}`;

        const overlayCommand = [
            '-i', baseImage,
            '-vf', `${backgroundBox},${fillBox}, ${text}`,
            '-y', // Overwrite output file
            outputImage
        ];
        
        const ffmpeg = spawn('ffmpeg', overlayCommand);

        ffmpeg.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
    
        ffmpeg.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
    
        ffmpeg.on('close', (code) => {
            console.log(`FFmpeg process exited with code ${code}`);
            if (code === 0) {
                console.log(`Progress bar image created successfully: ${outputImage}`);
            } else {
                console.error('Error occurred while creating the progress bar image.');
            }
        });
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
const progressValue = 3; // Set your progress value here (0-3)

processImagesInDirectory(imagesDirectoryPath, imageOutDirectoryPath, progressValue);