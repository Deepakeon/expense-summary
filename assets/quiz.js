// Reusable Quiz Component for Interactive Teaching Lessons
function setupQuiz(containerId, correctAnswerIndex, explanations) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const options = container.querySelectorAll('.quiz-option');
  const feedback = container.querySelector('.quiz-feedback');

  options.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      // Clear previous states
      options.forEach(b => {
        b.classList.remove('correct', 'incorrect');
        b.disabled = true;
      });

      if (index === correctAnswerIndex) {
        btn.classList.add('correct');
        feedback.className = 'quiz-feedback show-correct';
        feedback.innerHTML = `<strong>Correct.</strong> ${explanations.correct}`;
      } else {
        btn.classList.add('incorrect');
        options[correctAnswerIndex].classList.add('correct');
        feedback.className = 'quiz-feedback show-incorrect';
        feedback.innerHTML = `<strong>Incorrect.</strong> ${explanations.incorrect}`;
      }
    });
  });
}
