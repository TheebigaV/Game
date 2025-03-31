(() => {
    // DOM Elements
    const DOM = {
        // Auth elements
        authContainer: document.getElementById('auth-container'),
        registerContainer: document.getElementById('register-container'),
        gameMenuContainer: document.getElementById('game-menu-container'),
        gameContainer: document.getElementById('game-container'),
        authMessage: document.getElementById('auth-message'),
        registerMessage: document.getElementById('register-message'),
        username: document.getElementById('username'),
        password: document.getElementById('password'),
        newUsername: document.getElementById('new-username'),
        newPassword: document.getElementById('new-password'),
        confirmPassword: document.getElementById('confirm-password'),
        loginBtn: document.getElementById('login-btn'),
        registerBtn: document.getElementById('register-btn'),
        showRegisterBtn: document.getElementById('show-register-btn'),
        showLoginBtn: document.getElementById('show-login-btn'),
        
        // Game menu elements
        menuCurrentUser: document.getElementById('menu-current-user'),
        highScore: document.getElementById('high-score'),
        bestStreak: document.getElementById('best-streak'),
        startGameBtn: document.getElementById('start-game-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        
        // Game elements
        gameLogoutBtn: document.getElementById('game-logout-btn'),
        currentUser: document.getElementById('current-user'),
        puzzleImage: document.getElementById('puzzle-image'),
        userAnswer: document.getElementById('user-answer'),
        submitBtn: document.getElementById('submit-btn'),
        newBtn: document.getElementById('new-btn'),
        hintBtn: document.getElementById('hint-btn'),
        resultDiv: document.getElementById('result'),
        loadingDiv: document.getElementById('loading'),
        errorDiv: document.getElementById('error'),
        timerSpan: document.getElementById('timer'),
        scoreSpan: document.getElementById('score'),
        streakSpan: document.getElementById('streak'),
        tryAgainDiv: document.getElementById('try-again'),
        tryAgainBtn: document.getElementById('try-again-btn'),
        backToMenuBtn: document.getElementById('back-to-menu-btn')
    };

    // Game State
    const state = {
        registeredUsers: JSON.parse(localStorage.getItem('bananaMathUsers')) || {},
        currentUser: null,
        score: 0,
        highScore: 0,
        streak: 0,
        bestStreak: 0,
        timer: null,
        timeLeft: 30,
        solution: null,
        sampleImages: [
            { url: 'https://www.sanfoh.com/uob/banana/data/t1539acf2dc756aae70594758e7n97.png', solution: 7 },
            { url: 'https://www.sanfoh.com/uob/banana/data/t1d0c782c2a6eb458e66bad332cn96.png', solution: 6 },
            { url: 'https://www.sanfoh.com/uob/banana/data/t1fd81573c8d3fe70235a566b72n3.png', solution: 8 },
            { url: 'https://www.sanfoh.com/uob/banana/data/t280481bed5d239d6be3f798dc5n57.png', solution: 5 },
            { url: 'https://www.sanfoh.com/uob/banana/data/td395b9299083da2761ad6bde27n117.png', solution: 7 },
            { url: 'https://www.sanfoh.com/uob/banana/data/tda960504e718609d6c2f28d7c2n54.png', solution: 4 }
        ],
        apiUrl: 'https://marcconrad.com/uob/banana/api.php',
        currentPuzzle: null,
        previousSolution: null
    };

    // Simple hash function for basic password security
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    // Initialize the application
    function init() {
        setupEventListeners();
        showAuthScreen();
        
        // Preload sample images
        state.sampleImages.forEach(img => {
            const image = new Image();
            image.src = img.url;
        });
    }

    // Setup all event listeners
    function setupEventListeners() {
        // Authentication events
        DOM.loginBtn.addEventListener('click', handleLogin);
        DOM.showRegisterBtn.addEventListener('click', showRegisterScreen);
        DOM.registerBtn.addEventListener('click', handleRegister);
        DOM.showLoginBtn.addEventListener('click', showAuthScreen);
        DOM.logoutBtn.addEventListener('click', handleLogout);
        DOM.gameLogoutBtn.addEventListener('click', handleLogout);
        
        // Game menu events
        DOM.startGameBtn.addEventListener('click', startGame);
        DOM.backToMenuBtn.addEventListener('click', showGameMenu);
        
        // Game events
        DOM.submitBtn.addEventListener('click', checkAnswer);
        DOM.newBtn.addEventListener('click', fetchNewPuzzle);
        DOM.hintBtn.addEventListener('click', showHint);
        DOM.tryAgainBtn.addEventListener('click', fetchNewPuzzle);
        DOM.userAnswer.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkAnswer();
        });
    }

    // Authentication Functions
    function showAuthScreen() {
        DOM.username.value = '';
        DOM.password.value = '';
        DOM.authMessage.textContent = '';
        DOM.authMessage.className = 'message';
        DOM.authContainer.classList.remove('hidden');
        DOM.registerContainer.classList.add('hidden');
        DOM.gameMenuContainer.classList.add('hidden');
        DOM.gameContainer.classList.add('hidden');
    }

    function showRegisterScreen() {
        DOM.newUsername.value = '';
        DOM.newPassword.value = '';
        DOM.confirmPassword.value = '';
        DOM.registerMessage.textContent = '';
        DOM.registerMessage.className = 'message';
        DOM.authContainer.classList.add('hidden');
        DOM.registerContainer.classList.remove('hidden');
        DOM.gameMenuContainer.classList.add('hidden');
        DOM.gameContainer.classList.add('hidden');
    }

    function showGameMenu() {
        DOM.authContainer.classList.add('hidden');
        DOM.registerContainer.classList.add('hidden');
        DOM.gameMenuContainer.classList.remove('hidden');
        DOM.gameContainer.classList.add('hidden');
        
        DOM.menuCurrentUser.textContent = state.currentUser;
        DOM.highScore.textContent = state.highScore;
        DOM.bestStreak.textContent = state.bestStreak;
    }

    function handleLogin() {
        const username = DOM.username.value.trim();
        const password = DOM.password.value.trim();

        if (!username || !password) {
            showMessage(DOM.authMessage, 'Please enter both username and password.', 'error');
            return;
        }

        if (state.registeredUsers[username] && state.registeredUsers[username] === simpleHash(password)) {
            state.currentUser = username;
            const userStats = JSON.parse(localStorage.getItem(`bananaMathStats_${username}`)) || {};
            state.highScore = userStats.highScore || 0;
            state.bestStreak = userStats.bestStreak || 0;
            
            showGameMenu();
        } else {
            showMessage(DOM.authMessage, 'Invalid username or password.', 'error');
        }
    }

    function handleRegister() {
        const username = DOM.newUsername.value.trim();
        const password = DOM.newPassword.value.trim();
        const confirmPassword = DOM.confirmPassword.value.trim();

        if (!username || !password || !confirmPassword) {
            showMessage(DOM.registerMessage, 'Please fill in all fields.', 'error');
            return;
        }

        if (username.length < 4) {
            showMessage(DOM.registerMessage, 'Username must be at least 4 characters.', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage(DOM.registerMessage, 'Password must be at least 6 characters.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage(DOM.registerMessage, 'Passwords do not match.', 'error');
            return;
        }

        if (state.registeredUsers[username]) {
            showMessage(DOM.registerMessage, 'Username already exists. Please choose another one.', 'error');
            return;
        }

        state.registeredUsers[username] = simpleHash(password);
        localStorage.setItem('bananaMathUsers', JSON.stringify(state.registeredUsers));
        
        const userStats = {
            highScore: 0,
            bestStreak: 0
        };
        localStorage.setItem(`bananaMathStats_${username}`, JSON.stringify(userStats));
        
        showMessage(DOM.registerMessage, 'Registration successful! Please log in.', 'success');
        
        setTimeout(() => {
            showAuthScreen();
            DOM.username.value = username;
            DOM.password.value = '';
        }, 1500);
    }

    function handleLogout() {
        clearInterval(state.timer);
        state.currentUser = null;
        showAuthScreen();
    }

    // Game Functions
    function startGame() {
        DOM.authContainer.classList.add('hidden');
        DOM.registerContainer.classList.add('hidden');
        DOM.gameMenuContainer.classList.add('hidden');
        DOM.gameContainer.classList.remove('hidden');
        
        DOM.currentUser.textContent = state.currentUser;
        resetGame();
        
        // Immediately show a puzzle without loading screen
        useSampleImage();
    }

    function resetGame() {
        state.score = 0;
        state.streak = 0;
        state.previousSolution = null;
        DOM.scoreSpan.textContent = state.score;
        DOM.streakSpan.textContent = state.streak;
        clearResult();
    }

    function fetchNewPuzzle() {
        DOM.loadingDiv.classList.remove('hidden');
        DOM.puzzleImage.style.display = 'none';
        DOM.userAnswer.value = '';
        clearResult();
        DOM.tryAgainDiv.classList.add('hidden');

        clearInterval(state.timer);
        state.timeLeft = 30;
        DOM.timerSpan.textContent = state.timeLeft;
        DOM.timerSpan.classList.remove('timer-warning');

        // Try to get a different puzzle than the previous one
        if (state.previousSolution) {
            if (Math.random() > 0.5) {
                fetchApiPuzzle(state.previousSolution);
            } else {
                useDifferentSampleImage(state.previousSolution);
            }
        } else {
            // First puzzle of the game
            Math.random() > 0.5 ? fetchApiPuzzle() : useSampleImage();
        }
    }

    function fetchApiPuzzle(avoidSolution) {
        fetch(state.apiUrl)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                // If we got the same solution as before, try again
                if (avoidSolution && data.solution === avoidSolution) {
                    fetchApiPuzzle(avoidSolution);
                } else {
                    state.currentPuzzle = { url: data.image, solution: data.solution };
                    displayPuzzleImage(data.image, data.solution);
                }
            })
            .catch(error => {
                console.error('Error fetching puzzle:', error);
                useDifferentSampleImage(avoidSolution);
            });
    }

    function useDifferentSampleImage(avoidSolution) {
        // Filter out the previous puzzle
        const availableImages = state.sampleImages.filter(
            img => !avoidSolution || img.solution !== avoidSolution
        );
        
        if (availableImages.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableImages.length);
            const selectedImage = availableImages[randomIndex];
            state.currentPuzzle = selectedImage;
            displayPuzzleImage(selectedImage.url, selectedImage.solution);
        } else {
            // Fallback if all sample images would be the same
            const randomIndex = Math.floor(Math.random() * state.sampleImages.length);
            const selectedImage = state.sampleImages[randomIndex];
            state.currentPuzzle = selectedImage;
            displayPuzzleImage(selectedImage.url, selectedImage.solution);
        }
    }

    function useSampleImage() {
        const randomIndex = Math.floor(Math.random() * state.sampleImages.length);
        const selectedImage = state.sampleImages[randomIndex];
        state.currentPuzzle = selectedImage;
        displayPuzzleImage(selectedImage.url, selectedImage.solution);
    }

    function displayPuzzleImage(src, solution) {
        state.solution = solution;
        state.previousSolution = solution;
        DOM.puzzleImage.src = src;
        
        // Check if image is already loaded
        const img = new Image();
        img.src = src;
        
        if (img.complete) {
            DOM.loadingDiv.classList.add('hidden');
            DOM.puzzleImage.style.display = 'block';
            startTimer();
            DOM.userAnswer.focus();
        } else {
            DOM.puzzleImage.onload = () => {
                DOM.loadingDiv.classList.add('hidden');
                DOM.puzzleImage.style.display = 'block';
                startTimer();
                DOM.userAnswer.focus();
            };
            DOM.puzzleImage.onerror = () => {
                useDifferentSampleImage(state.previousSolution);
            };
        }
    }

    function startTimer() {
        state.timer = setInterval(() => {
            state.timeLeft--;
            DOM.timerSpan.textContent = state.timeLeft;

            if (state.timeLeft <= 10) {
                DOM.timerSpan.classList.add('timer-warning');
            }

            if (state.timeLeft <= 0) {
                clearInterval(state.timer);
                showResult(`Time's up! The answer was ${state.solution}`, 'incorrect');
                DOM.tryAgainDiv.classList.remove('hidden');
            }
        }, 1000);
    }

    function checkAnswer() {
        const userAnswer = parseInt(DOM.userAnswer.value);
        
        if (isNaN(userAnswer)) {
            showResult('Please enter a valid number', 'incorrect');
            return;
        }

        clearInterval(state.timer);
        
        if (userAnswer === state.solution) {
            state.score += 10;
            state.streak++;
            
            if (state.score > state.highScore) {
                state.highScore = state.score;
            }
            if (state.streak > state.bestStreak) {
                state.bestStreak = state.streak;
            }
            
            showResult('Correct! +10 points', 'correct');
            DOM.scoreSpan.textContent = state.score;
            DOM.streakSpan.textContent = state.streak;
            
            // Automatically load a different puzzle after 1.5 seconds
            setTimeout(fetchNewPuzzle, 1500);
        } else {
            state.streak = 0;
            showResult(`Incorrect! The answer was ${state.solution}`, 'incorrect');
            DOM.streakSpan.textContent = state.streak;
            DOM.tryAgainDiv.classList.remove('hidden');
        }
        
        // Save user stats
        if (state.currentUser) {
            const userStats = {
                highScore: state.highScore,
                bestStreak: state.bestStreak
            };
            localStorage.setItem(`bananaMathStats_${state.currentUser}`, JSON.stringify(userStats));
        }
    }

    function showHint() {
        if (!state.solution) {
            alert('No puzzle loaded yet');
            return;
        }
        const min = Math.max(0, state.solution - 10);
        const max = state.solution + 10;
        alert(`Hint: The answer is between ${min} and ${max}`);
    }

    // UI Helper Functions
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = 'message ' + type;
    }

    function showResult(message, type) {
        DOM.resultDiv.textContent = message;
        DOM.resultDiv.className = 'message ' + type;
        DOM.resultDiv.classList.remove('hidden');
    }

    function clearResult() {
        DOM.resultDiv.textContent = '';
        DOM.resultDiv.className = 'message';
        DOM.resultDiv.classList.add('hidden');
    }

    // Initialize the application
    init();
})();