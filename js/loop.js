var currentTime = function() {
	return (+ new Date());
}

/* A simple class to pass events to the Loopers. */
class EventPipe {
	constructor() {
		this.listeners = [];
	}

	addListener(listener) {
		this.listeners.push(listener);
		return listener;
	}

	removeListener(listener) {
		this.listeners.remove(listener);
	}

	publish(e) {
		for (var i = 0; i < this.listeners.length; i++) {
			this.listeners[i](e);
		}
	}
}

/* Handles 'looping' functions at certain intervals. */
class Loop {
	constructor(eventPipe) {
		eventPipe.addListener((e) => this.processEvent(e));
		this.cancelled = false;
		this.recording = false;
		this.playing = false;
		this.playhead = -1;
	}

	isRecording() {
		return this.recording;
	}

	isPlaying() {
		return this.playing;
	}

	processEvent(e) {
		if (this.recording) {
			var offset = currentTime() - this.startTime;
			console.log("Recorded offset: " + offset + "ms");
			this.offsets.push(offset);
			this.events[offset] = e;
		}
	}

	record() {
		this.clear();
		this.startTime = currentTime();
		this.recording = true;
	}

	stopRecording() {
		this.recording = false;
	}

	play() {
		console.log("[loop.js] Playing " + this.offsets.length + " sounds in loop.");
		this.playing = true;
		this._play();
	}

	_play() {
		if (!this.playing) {
			// stop requested.
			return;
		}

		this.playhead++;
		this.playhead = this.playhead % this.offsets.length;
		if (this.playhead == 0) { this.elapsed = 0; }
		let current = this.playhead;
		var me = this;
		let wait_time = this.offsets[this.playhead] - this.elapsed;
		console.log("Wait time for " + this.playhead + ": " + wait_time + "ms");
		setTimeout(() => {
			console.log("Playing event: " + current);
			if (current <= me.offsets.length) {
				me.events[me.offsets[current]]();
				me.elapsed = me.elapsed + me.offsets[me.playhead];
				me._play();
			}
		}, wait_time);
	}

	stop() {
		console.log("[loop.js] Stopped.");
		this.playing = false;
		this.playhead = -1;
	}

	clear() {
		this.recording = false;
		this.playing = false;
		this.playhead = -1;
		this.offsets = [];
		this.events = {};
	}
}