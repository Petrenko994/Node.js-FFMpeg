const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Function to create a progress bar on a base image
function createProgressBarImage(baseImage, smallFilePath, outputFilePath, progressValue, tempFileImage1) {
    // Ensure progress value is between 0 and 100
    if (progressValue < 0 || progressValue > 100) {
        throw new Error('Progress value must be between 0 and 100');
    }

    const ffprobe = spawn('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', baseImage]);

    ffprobe.stdout.on('data', (data) => {
        const [width, height] = data.toString().trim().split(',').map(Number);

        const fontfile = "./fonts/ARIAL.TTF";
        const boxWidth = 300;
        const boxHeight = 400;
        const boxColor = "black";
        const fontsize1 = Math.min(boxWidth * 0.23, boxHeight * 0.15);
        const newSmallWidth = Math.floor(boxWidth * 0.95);
        const newSmallHeight = Math.floor(boxHeight * 0.7);
        const tempOutImageWidth = Math.floor(boxWidth * 0.95);
        const tempOutImageHeight = Math.floor(boxHeight * 0.9);
        const shadowColor = "black";
        const centerX = 6;
        const centerY = 100 ;
        const temp_x = 6;
        const temp_y = 30;

        const drawbox = `drawbox=x=0:y=40:w=${boxWidth}:h=${boxHeight}:t=fill`;

        tempOutImage = path.join(tempFileImage1.replace('.png', '_temp.png')); // Temporary output
        
        const ffmpegCommand = [
            '-f', 'lavfi',
            '-i', `color=c=${boxColor}@0.1:s=${boxWidth}x${boxHeight}:d=1`, // Use a black background
            '-i', smallFilePath,
            '-filter_complex', `[1:v]scale=${newSmallWidth}:${newSmallHeight}[small];
                drawtext=text='UP NEXT':fontcolor=white:fontfile=${fontfile}:fontsize=${fontsize1}:x=${boxWidth / 2}-tw/2:y=30:shadowcolor=${shadowColor}@0.1:shadowx=10:shadowy=10[padded],
                [padded][small]overlay=${centerX}:${centerY},`,
            '-frames:v', '1',
            '-update', '1',
            '-y',
            tempOutImage
        ];
    
        // Execute the FFmpeg command
        const ffmpeg = spawn('ffmpeg', ffmpegCommand);

        ffmpeg.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
    
        ffmpeg.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
    
        ffmpeg.on('close', (code) => {
            console.log(`FFmpeg process exited with code ${code}`);
            if (code === 0) {
                console.log(`Progress bar image created successfully: ${outputFilePath}`);
            } else {
                console.error('Error occurred while creating the progress bar image.');
            }

            const ffmpegCommand1 = [
                '-i', baseImage,
                '-i', tempOutImage,
                '-filter_complex', `[1:v]scale=${tempOutImageWidth}:${tempOutImageHeight}[small];
                    nullsrc=size=700x600:duration=5:rate=1[canvas];
                    [canvas]${drawbox}[canvasWithBox];
                    [canvasWithBox][small]overlay=x=${temp_x}:y=${temp_y}[overlayedImage];
                    [overlayedImage]perspective=x0=0:y0=0:x1=${width}:y1=-200:x2=0:y2=${boxHeight + 300}:x3=${width - 20}:y3=${boxHeight + 700}[perspectived]; 
                    [0:v][perspectived]overlay=0:0[final];
                `,
                '-map', '[final]',
                '-update', '1',
                '-frames:v', '1',
                '-y',
                outputFilePath
            ];
    
            const ffmpeg2 = spawn('ffmpeg', ffmpegCommand1);
            ffmpeg2.stdout.on('data', data => console.log(`FFmpeg stdout (Step 2): ${data.toString()}`));
            ffmpeg2.stderr.on('data', data => console.error(`FFmpeg stderr (Step 2): ${data.toString()}`));
    
            ffmpeg2.on('close', code => {
                console.log(`FFmpeg process exited with code ${code}`);
                if (code !== 0) {
                    console.error("An error occurred, check the FFmpeg output for details.");
                }
            });
        });
    });

    ffprobe.stderr.on('data', (data) => console.error(`FFprobe stderr: ${data}`));
    ffprobe.on('close', (code) => {
        if (code !== 0) {
            console.error(`FFprobe process exited with code ${code}`);
        }
    });
}

async function processImagesInDirectory(imagesDirectoryPath, smallDirectoryPath, imageOutDirectoryPath, progressValue, tempFileImage) {
    try {
        fs.readdir(imagesDirectoryPath, (err, files) => {
            if (err) {
                console.error(`Unable to scan directory: ${err}`);
                return;
            }
     
            files.forEach(file => {
                const ext = path.extname(file).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                    const baseImage = path.join(imagesDirectoryPath, file);

                    fs.readdir(smallDirectoryPath, (err, smallFiles) => {
                        
                        smallFiles.forEach(smallFile => {
                            const ext = path.extname(smallFile).toLowerCase();
                            if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                                const smallFilePath = path.join(smallDirectoryPath, smallFile);
                                const outputFilePath = path.join(imageOutDirectoryPath, `output_${path.basename(file, ext)}.png`);
                                const tempFileImage1 = path.join(tempFileImage, `output_${path.basename(file, ext)}.png`);
                                
                                createProgressBarImage(baseImage, smallFilePath, outputFilePath, progressValue, tempFileImage1);
                            }
                        });
                    })
                }
            });
        });
    } catch (err) {
        console.error(`Unable to scan directory: ${err.message}`);
    }
}

// Example usage
const imagesDirectoryPath = path.join(__dirname, '../input'); // /input: my test input directory.so you can change it.
const smallDirectoryPath = path.join(__dirname, '../small'); // /output: my test output directory.so you can change it.
const imageOutDirectoryPath = path.join(__dirname, '../output'); // /output: my test output directory.so you can change it.
const tempFileImage = path.join(__dirname, '../temp'); // /output: my test output directory.so you can change it.
const progressValue = 50 ; // Set your progress value here (0-100)

processImagesInDirectory(imagesDirectoryPath, smallDirectoryPath, imageOutDirectoryPath, progressValue, tempFileImage);