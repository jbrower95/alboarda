var sounds = {};
var context = Pizzicato.context;
var analyser = null;
var albertas = [];
var frequencyData = null;
var amplitudeData = null;
var allSounds = new Pizzicato.Group();

var ALBERTA_RESOLUTION = 16;

function pressedChar(char) {
	char = char.toLowerCase();
	if (sounds[char] != null) {
		sounds[char].play();
	}
}

function releasedChar(char) {
	char = char.toLowerCase();
	if (sounds[char] != null) {
		sounds[char].stop();
	}
}

function startListening() {
	$(document).keypress(function (e) {
		pressedChar(String.fromCharCode(e.which));
		e.preventDefault();
	});

	$(document).keyup(function (e) {
		releasedChar(String.fromCharCode(e.which));
	});
}

/* TODO: This doesn't handle errors at all, and directly references file paths based on filenames without sanitization. */
function loadSounds(sounds, letters, resolve, reject) {
	// Add this only b.c webaudio thinks the sound _stops_ if nothing is playing.
	// There should really be no noise, not NOTHING at all.
	var refWave = new Pizzicato.Sound({ 
	    source: 'wave',
	    options: {
	        type: 'sawtooth'
	    }
	});
	refWave.volume = 0;
	refWave.play();
	allSounds.addSound(refWave);
	if (resolve == null) {
		// top level call
		promise = new Promise(function(real_resolve, real_reject) {
			loadSounds(sounds, letters, real_resolve, real_reject);
		});
		return promise;
	} else {
		// recursive call
		if (!letters) {
			// tail case
			console.log("[alboard] Loaded " + Object.keys(sounds).length + " sounds.");
			resolve();
		} else {
			// average case
			var current = letters.charAt(0);
			var path = "sound/alberta/" + current + ".mp3";
			sounds[current] = new Pizzicato.Sound({ 
						    source: 'file',
						    options: { path: path, loop: true }
						}, function() {
						    // Sound loaded -- continue onward.
							allSounds.addSound(sounds[current]);
						    loadSounds(sounds, letters.substring(1), resolve, reject);
						});
		}
	}

	return 
}

function createEQ() {
	// a frequency anaylzer
	analyser = context.createAnalyser();
	analyser.fftSize = 1024;

	frequencyData = new Uint8Array(analyser.frequencyBinCount);
	amplitudeData = new Uint8Array(analyser.frequencyBinCount);
	
	allSounds.connect(analyser);
}

function createAlbertas(container, resolution) {
	for (var i = 0; i < resolution; i++) {
		var alberta = document.createElement("img");
		alberta.style.position = "fixed";
		alberta.style.width = ($(document).width() / resolution) - 1;
		alberta.style.bottom = 0;
		alberta.style.left = parseInt(($(document).width() / resolution) * i);
		alberta.style.height = 'auto';
		alberta.style.display = "inline block";
		alberta.src = "img/alberta.png";
		container.append(alberta);
		albertas.push(alberta);
	}
}

function launchEQ() {
    // Schedule the next update
    requestAnimationFrame(launchEQ);

    drawEQ();
    drawAmplitude();
};

var WIDTH = $(window).width();
var HEIGHT = 400;
var canvasCtx = null;

function setupAmplitudeGraph() {
	canvasCtx = $("#canvas")[0].getContext('2d');
	canvasCtx.canvas.width  = WIDTH;
	canvasCtx.canvas.height = HEIGHT;
}

function drawAmplitude() {
	var bufferLength = analyser.frequencyBinCount;

	canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
	analyser.getByteTimeDomainData(amplitudeData);

	canvasCtx.lineWidth = 1;
	canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
	canvasCtx.beginPath();

	var sliceWidth = WIDTH * 1.0 / bufferLength;
	var x = 0;

	for(var i = 0; i < bufferLength; i++) {
        var v = amplitudeData[i] / 128.0;
        var y = v * HEIGHT/2;

        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();
}

function drawEQ() {
	// Get the new frequency data
    analyser.getByteFrequencyData(frequencyData);

    // Update the visualisation
    var numBins = analyser.frequencyBinCount;
    var perAlberta = parseInt(numBins / albertas.length);

    var hiPass = function(index) { return  (index + 0.01) * 2; };
    
    $(albertas).each(function (index, alberta) {
    	var sum = 0;
    	var start = index * perAlberta;
    	var end = start + perAlberta;
    	for (var i = start; i < end; i++) {
    		sum = sum + frequencyData[i];
    	}
    	sum = sum / perAlberta;
    	$(alberta).css("bottom", sum * 1.5);
    });
}

$(window).resize(function(resize) {
	/* Adjust albertas */
	$(albertas).each(function(i, a) {
		$(a).remove();
	});
	createAlbertas($("#albertas"), ALBERTA_RESOLUTION);

	/* Adjust canvas */
	WIDTH = $(window).width();
	canvasCtx.canvas.width = WIDTH;
});

$(document).ready(function() {
	createAlbertas($("#albertas"), ALBERTA_RESOLUTION);
	loadSounds(sounds, "abcdefghijklmnopqrstuvwxz").then(startListening);
	setupAmplitudeGraph();
	createEQ();
	launchEQ();
});

