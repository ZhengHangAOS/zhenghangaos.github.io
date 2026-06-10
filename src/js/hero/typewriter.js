const phrases = [
  "Tracing the invisible ocean of fluid skies.",
  "不敢高聲語，恐驚天上人",
  "Drifting in the silent stratosphere.",
  "坐看雲起時",
  "Where cosmic winds whisper the eternity.",
  "河漢清且淺，相去復幾許",
  "Stars dissolve into dawn and night fades.",
  "長河漸落曉星沉",
];

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

export function initTypewriter() {
  const textOutput = document.getElementById("text-output");
  if (!textOutput) return;

  function type() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      textOutput.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      textOutput.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }

    let typeSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === currentPhrase.length) {
      typeSpeed = 3000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeSpeed = 500;
    }
    setTimeout(type, typeSpeed);
  }
  setTimeout(type, 1000);
}
