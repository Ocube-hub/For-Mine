const pages = Array.from(document.querySelectorAll('.page'));
const answerInputs = Array.from(document.querySelectorAll('.answer-input'));
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const playMusicButton = document.getElementById('playMusic');
const finalMessage = document.getElementById('finalMessage');
const answerSummary = document.getElementById('answerSummary');
const yesButton = document.getElementById('yesButton');
let currentPage = 0;
let audioContext;
let masterGain;
let isPlaying = false;
let musicOscillators = [];
const storagePrefix = 'loveStoryAnswer';

function loadSavedAnswers() {
  answerInputs.forEach((input, index) => {
    const saved = localStorage.getItem(`${storagePrefix}${index + 1}`);
    if (saved !== null) {
      input.value = saved;
    }
    input.addEventListener('input', () => saveAnswer(index, input.value));
  });
}

function saveAnswer(index, value) {
  localStorage.setItem(`${storagePrefix}${index + 1}`, value);
}

function buildSummary() {
  if (!answerSummary) return;
  answerSummary.innerHTML = '';
  answerInputs.forEach((input, index) => {
    const question = pages[index].querySelector('h2')?.textContent || `Question ${index + 1}`;
    const value = input.value.trim() || 'No answer yet';
    const item = document.createElement('div');
    item.className = 'summary-item';
    item.innerHTML = `
      <strong>${escapeHtml(question)}</strong>
      <p>${escapeHtml(value)}</p>
    `;
    answerSummary.appendChild(item);
  });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showPage(index) {
  pages.forEach((page, i) => {
    page.classList.toggle('active', i === index);
  });
  currentPage = index;
  const pageNumber = index + 1;
  progressText.textContent = `Page ${pageNumber} of ${pages.length}`;
  progressFill.style.width = `${(pageNumber / pages.length) * 100}%`;
  if (finalMessage) {
    finalMessage.classList.add('hidden');
  }
}

function nextPage() {
  if (currentPage < pages.length - 1) {
    showPage(currentPage + 1);
  }
}

function prevPage() {
  if (currentPage > 0) {
    showPage(currentPage - 1);
  }
}

function createMusic() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.08;
  masterGain.connect(audioContext.destination);

  const chordFrequencies = [261.6, 329.6, 392.0];
  chordFrequencies.forEach(freq => {
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gain = audioContext.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    musicOscillators.push({ osc, gain });
  });

  const now = audioContext.currentTime;
  musicOscillators.forEach((item, index) => {
    item.gain.gain.setValueAtTime(0, now);
    item.gain.gain.linearRampToValueAtTime(0.08 - index * 0.02, now + 2);
  });
}

function playMusic() {
  if (!audioContext) createMusic();
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  if (!isPlaying) {
    isPlaying = true;
    playMusicButton.textContent = 'Pause the love song';
    const now = audioContext.currentTime;
    musicOscillators.forEach((item, index) => {
      const delay = index * 0.4;
      item.gain.gain.cancelScheduledValues(now);
      item.gain.gain.setValueAtTime(0, now + delay);
      item.gain.gain.linearRampToValueAtTime(0.08 - index * 0.02, now + delay + 2);
    });
  } else {
    isPlaying = false;
    playMusicButton.textContent = 'Play the love song';
    const now = audioContext.currentTime;
    musicOscillators.forEach(item => {
      item.gain.gain.cancelScheduledValues(now);
      item.gain.gain.setTargetAtTime(0, now, 0.5);
    });
  }
}

function confirmYes() {
  finalMessage.classList.remove('hidden');
  pages.forEach(page => page.classList.remove('active'));
  progressText.textContent = 'A beautiful new chapter';
  progressFill.style.width = '100%';
  buildSummary();
}

window.addEventListener('DOMContentLoaded', () => {
  loadSavedAnswers();
  showPage(0);

  document.querySelectorAll('.next-btn').forEach(button => {
    button.addEventListener('click', nextPage);
  });

  document.querySelectorAll('.prev-btn').forEach(button => {
    button.addEventListener('click', prevPage);
  });

  playMusicButton.addEventListener('click', playMusic);
  yesButton.addEventListener('click', confirmYes);
});
