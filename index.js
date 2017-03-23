var audioCtx = new (window.AudioContext || window.webkitAudioContext)(); // define audio context

const
  analyser = audioCtx.createAnalyser(), // provide global context for draw.js
  squarePlay = document.getElementById("square"),
  sinPlay = document.getElementById("sin");

const
  CHANNELS = 1,
  FRAMES = audioCtx.sampleRate * 2.0,
  AUDIO_BUFFER = audioCtx.createBuffer(CHANNELS, FRAMES, audioCtx.sampleRate);

const NODES = [
  analyser,
  //audioCtx.createWaveShaper(),
  //audioCtx.createGain(),
  //audioCtx.createBiquadFilter()
];

function buildPipe(source) {
  const
    count = NODES.length;

  if(count < 1)
    return;

  const
    head = NODES[0],
    tail = NODES[count - 1];

  source.connect(head);
  tail.connect(audioCtx.destination);

  for(let idx = 0; idx < count - 1; idx++)
    NODES[idx].connect(NODES[idx + 1]);
}

sinPlay.onclick = () => {
  const SinWave = makeSinWave();

  buildPipe(SinWave);
  visualize(SinWave);
  SinWave.start();
};

squarePlay.onclick = () => {
  const SquareWave = makeSquareWave();

  buildPipe(SquareWave);
  visualize(SquareWave);
  SquareWave.start();
};

// Microphone
/*navigator.getUserMedia ({ audio: true },
  (stream) => {
    buildPipe(stream);
    visualize(stream);
  },
  (err) => {
    console.log(">>>ERROR FETCHING USER MIC");
    console.log(err);
  }
);*/

function makeDistortionCurve(amount) { // function to make curve shape for distortion/wave shaper node to use
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    const value = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
    curve[i] = value;
  }
  return curve;
};

function makeSquareWave() {
  const SQUARE_SIZE = audioCtx.sampleRate / 90;
  let
    flag = false,
    lastToggle = 0;

  for(let channel = 0; channel < CHANNELS; channel++) {
    const curBuf = AUDIO_BUFFER.getChannelData(channel);
    for(let idx = 0; idx < FRAMES; idx++) {
      if(idx - SQUARE_SIZE > lastToggle) {
        flag = !flag;
        lastToggle = idx;
      }

      curBuf[idx] = flag ? 1 : 0;
    }
  }

  const BUF_SRC= audioCtx.createBufferSource();
  BUF_SRC.buffer = AUDIO_BUFFER;
  return BUF_SRC;
}

function makeSinWave() {
  const
    amplitude = 1.0,
    frequency = 50;

  for(let channel = 0; channel < CHANNELS; channel++) {
    const curBuf = AUDIO_BUFFER.getChannelData(channel);
    for(let idx = 0; idx < FRAMES; idx++) {
      curBuf[idx] = amplitude * Math.sin( (2.0 * Math.PI * frequency) * (idx / audioCtx.sampleRate) );
    }
  }

  const BUF_SRC = audioCtx.createBufferSource();
  BUF_SRC.buffer = AUDIO_BUFFER;
  return BUF_SRC;
}
