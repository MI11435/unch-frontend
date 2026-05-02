import React, { useEffect, useRef } from 'react';

// Singleton Web Audio nodes attached to the audio element itself so they
// survive across component mounts/unmounts (page navigations).
function getAudioNodes(audio) {
  if (audio._wfCtx && audio._wfCtx.state !== 'closed') {
    return { ctx: audio._wfCtx, analyser: audio._wfAnalyser };
  }

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    audio._wfCtx = ctx;
    audio._wfAnalyser = analyser;
    return { ctx, analyser };
  } catch (e) {
    console.warn('Web Audio API unavailable:', e);
    return null;
  }
}

export default function WaveformPlayer({ audioRef, isPlaying }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const lastHeightsRef = useRef([]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !canvasRef.current) return;

    // Resume AudioContext on first play interaction
    const handlePlay = async () => {
      const nodes = getAudioNodes(audio);
      if (nodes?.ctx?.state === 'suspended') {
        await nodes.ctx.resume().catch(() => {});
      }
    };
    audio.addEventListener('play', handlePlay);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx2d = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);

      const nodes = audio._wfCtx && audio._wfCtx.state !== 'closed' ? { analyser: audio._wfAnalyser } : null;
      const bufferLength = nodes?.analyser?.frequencyBinCount || 128;
      const barWidth = (w / bufferLength) * 2.5;

      let dataArray;
      if (nodes?.analyser) {
        dataArray = new Uint8Array(bufferLength);
        nodes.analyser.getByteFrequencyData(dataArray);
      }

      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        let barH = 0;

        if (dataArray && !audio.paused) {
          barH = (dataArray[i] / 255) * h;
          lastHeightsRef.current[i] = barH;
        } else if (lastHeightsRef.current[i] > 0) {
          lastHeightsRef.current[i] *= 0.88;
          if (lastHeightsRef.current[i] < 0.5) lastHeightsRef.current[i] = 0;
          barH = lastHeightsRef.current[i];
        }

        if (barH > 0) {
          const grad = ctx2d.createLinearGradient(0, h, 0, h - barH);
          grad.addColorStop(0, 'rgba(56,189,248,0.9)');
          grad.addColorStop(0.5, 'rgba(14,165,233,0.7)');
          grad.addColorStop(1, 'rgba(99,102,241,0.5)');
          ctx2d.fillStyle = grad;
          ctx2d.fillRect(x, h - barH, barWidth, barH);
        }

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      // Only cancel the animation frame - never close the AudioContext or
      // remove the source node, so audio keeps playing across navigations.
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audio.removeEventListener('play', handlePlay);
    };
  }, [audioRef]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={80}
        style={{ width: '100%', height: '100%', borderRadius: '0' }}
      />
    </div>
  );
}
