console.log("camera script starting");

let model, webcam, labelContainer, maxPredictions;
let looping;
let predictions = [];
const MAX_PREDICTIONS = 5;

async function startCamera() {
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices) {
        console.log("not supported");
        return;
    }

    const modelURL = "./model/model.json";
    const metadataURL = "./model/metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    // console.log(model);

    // dependencies: video tag, button tag start/stop
    const video = document.getElementById("camera");
    const camera = mediaDevices.getUserMedia({ video: true });
    // when the camera is obtained, do this
    camera.then( (stream) => {
        video.srcObject = stream;
        video.play();
        
        // turn off the start button
        const startButton = document.querySelector(".start-camera");
        startButton.disabled = true;
        
        const stopButton = document.querySelector(".stop-camera");
        stopButton.disabled = false;

        const status = document.querySelector(".camera-status");
        status.textContent = "🟢On"
        looping = true;
        loop();
    }).catch( (error) => {
        console.log("error");
    })
}

function stopCamera() {
    const video = document.getElementById("camera");
    const stream = video.srcObject;
    // tracks?
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => {
            console.log("stopping track");
            track.stop();
        });
    }
    
    video.srcObject = null;

    const startButton = document.querySelector(".start-camera");
    startButton.disabled = false;
    
    const stopButton = document.querySelector(".stop-camera");
    stopButton.disabled = true;

    const status = document.querySelector(".camera-status");
    status.textContent = "⚪Off"

    looping = false;
    console.log("stopped camera");
}

async function loop() {
    if (!looping) {
        return;
    }

    let [prediction, probability] = await classifyStream();
    console.log(prediction);
    if (prediction) {
        predictions.push(prediction);
        if (predictions.length > MAX_PREDICTIONS) {
            predictions.shift();
        }
        renderPrediction(mode(predictions), probability);
    }
    window.requestAnimationFrame(loop);
}

async function classifyStream() {
    if (!model) {
        console.log("no model found");
        return;
    }

    const video = document.getElementById("camera");
    const prediction = await model.predict(video);
    console.log(prediction);

    const openProbability = prediction[0].probability;
    const closeProbability = prediction[1].probability;

    if (openProbability > closeProbability) {
        return ["open", openProbability];
    }

    return ["close", closeProbability];
}

async function renderPrediction(prediction, probability) {
    // update: confidence, hand, door image
    let output, img;
    let confidence = toPercent(probability);
    if (prediction === "open") {
        output = "🖐️";
        img = "open-door.png";
    } else {
        output = "👊";
        img = "closed-door.png";
    }

    document.getElementById("hand").textContent = output;
    document.getElementById("confidence").textContent = "Confidence: " + confidence + "%";
    document.querySelector(".door-img").src = img;
}

function toPercent(number) {
    const percent = number * 100;
    return Math.floor(percent);
}

function mode(nums) {
    const counts = {};
    let maxCount = 0;
    let result = undefined;

    for (const num of nums) {
        counts[num] = (counts[num] ?? 0) + 1;
        if (counts[num] > maxCount) {
            maxCount = counts[num];
            result = num;
        }
    }

    return result;
}

