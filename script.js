// script.js — Орфоэпический тренажёр с подсветкой выбранной кнопки

let currentPlayer = '';
let currentRound = [];
let currentWordIndex = 0;
let scoreCorrect = 0;
let scoreWrong = 0;
let gameStartTime = 0;
let isGameFinished = false;
let mistakesLog = [];
let globalMistakesHistory = [];

let currentCorrectPosition = null;
let selectedPosition = null;

// ========== ВСТАВЬТЕ ВАШУ ССЫЛКУ ИЗ SHEET.BEST СЮДА ==========
const SHEETBEST_URL = 'https://sheet.best/api/sheets/ad514d3a-d3e2-4a32-af9f-a746294fab2e';
// =============================================================

const positiveMessages = ["Ты лучший! 🌟", "Ого! Молодец 🎉", "Неплохо! 👍", "Да ты все знаешь! 🧠"];
const negativeMessages = ["Подумай! 🤔", "Упс! Учить надо! 📚", "А если подумать? 💭"];

// DOM элементы
const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const mistakesScreen = document.getElementById('mistakes-screen');
const resultsScreen = document.getElementById('results-screen');

const playerNameInput = document.getElementById('player-name');
const nameError = document.getElementById('name-error');
const startGameBtn = document.getElementById('start-game-btn');

const currentPlayerElement = document.getElementById('current-player');
const currentWordElement = document.getElementById('current-word');
const correctCountElement = document.getElementById('correct-count');
const wrongCountElement = document.getElementById('wrong-count');
const progressFillElement = document.getElementById('progress-fill');

const variant1Btn = document.getElementById('variant1');
const variant2Btn = document.getElementById('variant2');
const feedbackMessageElement = document.getElementById('feedback-message');
const checkButton = document.getElementById('check-btn');
const skipButton = document.getElementById('skip-btn');

const finalCorrectElement = document.getElementById('final-correct');
const finalPercentageElement = document.getElementById('final-percentage');
const finalTimeElement = document.getElementById('final-time');
const finalMistakesElement = document.getElementById('final-mistakes');
const finalSkipsElement = document.getElementById('final-skips');
const personalLeaderboardElement = document.getElementById('personal-leaderboard');
const rankMessageElement = document.getElementById('rank-message');
const exitBtn = document.getElementById('exit-btn');

const mistakesCountElement = document.getElementById('mistakes-count');
const skipsCountElement = document.getElementById('skips-count');
const mistakesListElement = document.getElementById('mistakes-list');
const toLeaderboardBtn = document.getElementById('to-leaderboard-btn');
const newGameBtn = document.getElementById('new-game-btn');

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function generateRandomRound() {
    const roundWords = [];
    const wordsNeeded = 20;
    
    const mistakesCount = globalMistakesHistory.length;
    let mistakesToTake = 0;
    
    if (mistakesCount >= 10) mistakesToTake = 10;
    else mistakesToTake = mistakesCount;
    
    if (mistakesToTake > 0) {
        const shuffledMistakes = shuffleArray([...globalMistakesHistory]);
        for (let i = 0; i < mistakesToTake; i++) {
            roundWords.push(shuffledMistakes[i]);
        }
    }
    
    const remainingCount = wordsNeeded - roundWords.length;
    const availableWords = wordsDatabase.filter(word => 
        !roundWords.some(added => added.correct === word.correct)
    );
    
    const shuffledAvailable = shuffleArray([...availableWords]);
    for (let i = 0; i < remainingCount && i < shuffledAvailable.length; i++) {
        roundWords.push(shuffledAvailable[i]);
    }
    
    return shuffleArray(roundWords);
}

function clearVariantHighlight() {
    variant1Btn.style.background = "#f1f8e9";
    variant2Btn.style.background = "#f1f8e9";
    variant1Btn.style.border = "3px solid #81c784";
    variant2Btn.style.border = "3px solid #81c784";
}

function showCurrentWord() {
    if (isGameFinished) return;
    
    const wordObj = currentRound[currentWordIndex];
    
    currentCorrectPosition = Math.random() < 0.5 ? 'left' : 'right';
    
    if (currentCorrectPosition === 'left') {
        variant1Btn.innerHTML = `👉 ${wordObj.correct}`;
        variant2Btn.innerHTML = `👉 ${wordObj.wrong}`;
    } else {
        variant1Btn.innerHTML = `👉 ${wordObj.wrong}`;
        variant2Btn.innerHTML = `👉 ${wordObj.correct}`;
    }
    
    clearVariantHighlight();
    
    currentWordElement.textContent = `Слово: ${currentWordIndex + 1}/20`;
    
    const progress = ((currentWordIndex + 1) / 20) * 100;
    progressFillElement.style.width = `${progress}%`;
    
    checkButton.disabled = true;
    selectedPosition = null;
    feedbackMessageElement.textContent = '';
    feedbackMessageElement.className = 'feedback-message';
}

function updateScore() {
    correctCountElement.textContent = scoreCorrect;
    wrongCountElement.textContent = scoreWrong;
}

function showFeedback(message, type) {
    feedbackMessageElement.textContent = message;
    feedbackMessageElement.className = 'feedback-message show';
    
    if (type === 'positive') {
        feedbackMessageElement.style.color = '#27ae60';
        feedbackMessageElement.style.backgroundColor = 'rgba(39, 174, 96, 0.1)';
    } else {
        feedbackMessageElement.style.color = '#c62828';
        feedbackMessageElement.style.backgroundColor = 'rgba(198, 40, 40, 0.1)';
    }
}

function checkAnswer() {
    if (isGameFinished) return;
    if (selectedPosition === null) return;
    
    const wordObj = currentRound[currentWordIndex];
    const isCorrect = (selectedPosition === currentCorrectPosition);
    
    mistakesLog.push({
        word: wordObj,
        userAnswer: selectedPosition === 'left' ? 
            (currentCorrectPosition === 'left' ? wordObj.correct : wordObj.wrong) : 
            (currentCorrectPosition === 'right' ? wordObj.correct : wordObj.wrong),
        correctAnswer: wordObj.correct,
        type: isCorrect ? 'correct' : 'mistake',
        wordNumber: currentWordIndex + 1
    });
    
    if (isCorrect) {
        scoreCorrect++;
        showFeedback(positiveMessages[Math.floor(Math.random() * positiveMessages.length)], 'positive');
        if (currentCorrectPosition === 'left') {
            variant1Btn.style.background = "#a5d6a7";
        } else {
            variant2Btn.style.background = "#a5d6a7";
        }
    } else {
        scoreWrong++;
        showFeedback(negativeMessages[Math.floor(Math.random() * negativeMessages.length)], 'negative');
        if (currentCorrectPosition === 'left') {
            variant1Btn.style.background = "#a5d6a7";
            variant2Btn.style.background = "#ffcdd2";
        } else {
            variant1Btn.style.background = "#ffcdd2";
            variant2Btn.style.background = "#a5d6a7";
        }
    }
    
    updateScore();
    checkButton.disabled = true;
    
    setTimeout(() => {
        if (currentWordIndex + 1 < currentRound.length) {
            currentWordIndex++;
            showCurrentWord();
        } else {
            finishGame();
        }
    }, 1500);
}

function skipWord() {
    if (isGameFinished) return;
    
    const wordObj = currentRound[currentWordIndex];
    mistakesLog.push({
        word: wordObj,
        userAnswer: null,
        correctAnswer: wordObj.correct,
        type: 'skip',
        wordNumber: currentWordIndex + 1
    });
    
    scoreWrong++;
    updateScore();
    showFeedback("Пропущено ⏭️", 'negative');
    
    setTimeout(() => {
        if (currentWordIndex + 1 < currentRound.length) {
            currentWordIndex++;
            showCurrentWord();
        } else {
            finishGame();
        }
    }, 1000);
}

function finishGame() {
    isGameFinished = true;
    
    mistakesLog.forEach(item => {
        if (item.type === 'mistake' || item.type === 'skip') {
            const exists = globalMistakesHistory.some(w => w.correct === item.word.correct);
            if (!exists) {
                globalMistakesHistory.push(item.word);
            }
        }
    });
    
    if (globalMistakesHistory.length > 50) {
        globalMistakesHistory = globalMistakesHistory.slice(-50);
    }
    
    showMistakesScreen();
}

function showMistakesScreen() {
    let mistakeCount = 0;
    let skipCount = 0;
    
    mistakesLog.forEach(item => {
        if (item.type === 'mistake') mistakeCount++;
        if (item.type === 'skip') skipCount++;
    });
    
    if (mistakesCountElement) mistakesCountElement.textContent = mistakeCount;
    if (skipsCountElement) skipsCountElement.textContent = skipCount;
    
    if (mistakesListElement) {
        mistakesListElement.innerHTML = '';
        
        const errorsOnly = mistakesLog.filter(i => i.type !== 'correct');
        if (errorsOnly.length === 0) {
            mistakesListElement.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #2e7d32; font-size: 18px;">
                    🎉 Отлично! Нет ошибок и пропусков!
                </div>
            `;
        } else {
            errorsOnly.forEach((item, index) => {
                const mistakeItem = document.createElement('div');
                mistakeItem.className = `mistake-item ${item.type}`;
                
                mistakeItem.innerHTML = `
                    <div class="mistake-number">${item.wordNumber}</div>
                    <div class="mistake-word">${item.word.correct}</div>
                    <div class="mistake-answer">
                        ${item.type === 'mistake' ? 
                            `❌ Твой ответ: ${item.userAnswer} | ✅ Правильно: <span class="correct-answer">${item.correctAnswer}</span>` : 
                            `⏭️ Пропущено | ✅ Правильно: <span class="correct-answer">${item.correctAnswer}</span>`}
                    </div>
                `;
                
                mistakesListElement.appendChild(mistakeItem);
            });
        }
    }
    
    showScreen('mistakes-screen');
}

// ========== ОТПРАВКА В SHEET.BEST ==========
async function sendToSheetBest(name, score, total, percentage, timeSpent, mistakes) {
    if (!SHEETBEST_URL || SHEETBEST_URL.includes('ВАШ_УНИКАЛЬНЫЙ_ИД')) {
        console.log('⚠️ Sheet.best не настроен. Пропускаем отправку.');
        return;
    }
    
    try {
        await fetch(SHEETBEST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{
                name: name,
                score: score,
                total: total,
                percentage: percentage + '%',
                time: timeSpent + ' сек',
                mistakes: mistakes,
                date: new Date().toLocaleString('ru-RU')
            }])
        });
        console.log('✅ Результат отправлен в Sheet.best');
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
    }
}
// ==========================================

async function showPersonalLeaderboard() {
    const timeSpentSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(timeSpentSeconds / 60);
    const seconds = timeSpentSeconds % 60;
    const percentage = Math.round((scoreCorrect / 20) * 100);
    
    let mistakeCount = 0;
    let skipCount = 0;
    mistakesLog.forEach(item => {
        if (item.type === 'mistake') mistakeCount++;
        if (item.type === 'skip') skipCount++;
    });
    
    finalCorrectElement.textContent = `${scoreCorrect}/20`;
    finalPercentageElement.textContent = `${percentage}%`;
    finalTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    if (finalMistakesElement) finalMistakesElement.textContent = mistakeCount;
    if (finalSkipsElement) finalSkipsElement.textContent = skipCount;
    
    // Отправляем результат в Sheet.best
    await sendToSheetBest(currentPlayer, scoreCorrect, 20, percentage, timeSpentSeconds, mistakeCount);
    
    const today = new Date().toISOString().split('T')[0];
    
    let playerData;
    try {
        playerData = JSON.parse(localStorage.getItem('orfepiya5class_data'));
    } catch (e) {
        playerData = null;
    }
    
    if (!playerData) {
        playerData = { playerName: currentPlayer, allResults: [], dailyBestResults: {} };
    }
    
    if (!playerData.dailyBestResults) playerData.dailyBestResults = {};
    
    const result = {
        date: today,
        playerName: currentPlayer,
        score: scoreCorrect,
        total: 20,
        percentage: percentage,
        timeSpent: timeSpentSeconds,
        mistakes: mistakeCount,
        skips: skipCount,
        timestamp: Date.now()
    };
    
    playerData.allResults = playerData.allResults || [];
    playerData.allResults.push(result);
    
    const todayKey = `best_${today}`;
    const currentBest = playerData.dailyBestResults[todayKey];
    
    if (!currentBest || percentage > currentBest.percentage ||
        (percentage === currentBest.percentage && timeSpentSeconds < currentBest.timeSpent)) {
        playerData.dailyBestResults[todayKey] = result;
    }
    
    localStorage.setItem('orfepiya5class_data', JSON.stringify(playerData));
    
    const bestResults = Object.values(playerData.dailyBestResults);
    bestResults.sort((a, b) => {
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        return a.timeSpent - b.timeSpent;
    });
    
    const topResults = bestResults.slice(0, 5);
    
    personalLeaderboardElement.innerHTML = '';
    if (topResults.length === 0) {
        personalLeaderboardElement.innerHTML = '<div style="text-align: center;">Пока нет результатов</div>';
        rankMessageElement.textContent = "Это ваш первый результат!";
    } else {
        topResults.forEach((res, idx) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            const mins = Math.floor(res.timeSpent / 60);
            const secs = res.timeSpent % 60;
            row.innerHTML = `
                <div class="leaderboard-rank">${idx + 1}</div>
                <div class="leaderboard-name">${res.playerName}</div>
                <div class="leaderboard-score">${res.percentage}% (${mins}:${secs.toString().padStart(2, '0')})</div>
            `;
            personalLeaderboardElement.appendChild(row);
        });
        
        const currentIndex = bestResults.findIndex(r => r.timestamp === result.timestamp);
        if (currentIndex === 0) rankMessageElement.textContent = "🥇 Вы сегодня лучший!";
        else if (currentIndex === 1) rankMessageElement.textContent = "🥈 Вы на втором месте!";
        else if (currentIndex === 2) rankMessageElement.textContent = "🥉 Вы на третьем месте!";
        else rankMessageElement.textContent = `🎯 Вы на ${currentIndex + 1} месте из ${bestResults.length}!`;
    }
    
    showScreen('results-screen');
}

function startNewGame() {
    currentPlayer = playerNameInput.value.trim();
    
    if (!currentPlayer) {
        if (nameError) nameError.textContent = 'Пожалуйста, введите ваше имя';
        return;
    }
    
    localStorage.setItem('orfepiya5class_player', currentPlayer);
    currentPlayerElement.textContent = `Игрок: ${currentPlayer}`;
    
    currentWordIndex = 0;
    scoreCorrect = 0;
    scoreWrong = 0;
    isGameFinished = false;
    mistakesLog = [];
    selectedPosition = null;
    
    currentRound = generateRandomRound();
    gameStartTime = Date.now();
    
    updateScore();
    showCurrentWord();
    showScreen('game-screen');
}

function resetToWelcome() {
    showScreen('welcome-screen');
    playerNameInput.value = '';
    if (nameError) nameError.textContent = '';
}

// Обработчики событий с подсветкой выбранной кнопки
variant1Btn.addEventListener('click', () => {
    if (isGameFinished) return;
    selectedPosition = 'left';
    checkButton.disabled = false;
    clearVariantHighlight();
    variant1Btn.style.background = "#c8e6c9";
    variant1Btn.style.border = "3px solid #2e7d32";
});

variant2Btn.addEventListener('click', () => {
    if (isGameFinished) return;
    selectedPosition = 'right';
    checkButton.disabled = false;
    clearVariantHighlight();
    variant2Btn.style.background = "#c8e6c9";
    variant2Btn.style.border = "3px solid #2e7d32";
});

checkButton.addEventListener('click', checkAnswer);
skipButton.addEventListener('click', skipWord);
startGameBtn.addEventListener('click', startNewGame);

if (toLeaderboardBtn) {
    toLeaderboardBtn.addEventListener('click', showPersonalLeaderboard);
}

if (newGameBtn) {
    newGameBtn.addEventListener('click', () => {
        startNewGame();
    });
}

if (exitBtn) {
    exitBtn.addEventListener('click', resetToWelcome);
}

playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startNewGame();
});

playerNameInput.addEventListener('input', () => {
    if (nameError) nameError.textContent = '';
});

const savedName = localStorage.getItem('orfepiya5class_player');
if (savedName && playerNameInput) {
    playerNameInput.value = savedName;
}

console.log("Орфоэпический тренажёр загружен!");