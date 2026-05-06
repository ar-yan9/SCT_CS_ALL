const passwordInput = document.getElementById('password');
const strengthBar = document.getElementById('strength-bar');
const strengthFeedback = document.getElementById('strength-feedback');
const emojiFeedback = document.getElementById('emoji-feedback');

function assessStrength(password) {
    let score = 0;
    let feedback = '';
    let emoji = '🤔';

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
        case 0:
        case 1:
            feedback = "Way too weak! Try harder!";
            emoji = "😬";
            break;
        case 2:
            feedback = "Still weak. Add more variety!";
            emoji = "😕";
            break;
        case 3:
            feedback = "Getting there! Mix it up more!";
            emoji = "🙂";
            break;
        case 4:
            feedback = "Almost strong! One more step!";
            emoji = "😎";
            break;
        case 5:
            feedback = "Super strong! You're a password pro!";
            emoji = "🎉";
            break;
    }
    return { score, feedback, emoji };
}

passwordInput.addEventListener('input', function() {
    const password = passwordInput.value;
    const { score, feedback, emoji } = assessStrength(password);
    const percent = (score / 5) * 100;
    strengthBar.style.width = percent + '%';
    strengthBar.style.background =
        score <= 2 ? '#ff7675' :
        score === 3 ? '#ffe066' :
        score === 4 ? '#6cdb8f' :
        '#00b894';
    strengthFeedback.textContent = feedback;
    emojiFeedback.textContent = emoji;
}); 