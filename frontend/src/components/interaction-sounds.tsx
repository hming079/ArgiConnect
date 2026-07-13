import { useEffect } from "react";

let audioContext: AudioContext | null = null;

function playTone(frequency: number, duration = 0.045, volume = 0.025) {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;
  audioContext ??= new AudioContextClass();
  if (audioContext.state === "suspended") void audioContext.resume();

  const start = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

export function InteractionSounds() {
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>("button, a, [role='button']")
        : null;
      if (!target || target.matches(":disabled") || target.getAttribute("aria-disabled") === "true") return;
      playTone(520);
    }

    function onChange(event: Event) {
      if (!(event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement)) return;
      if (event.target instanceof HTMLInputElement && !["checkbox", "radio", "range"].includes(event.target.type)) return;
      playTone(660, 0.055, 0.02);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("change", onChange);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("change", onChange);
    };
  }, []);

  return null;
}
