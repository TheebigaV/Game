(() => {
    const firebaseConfig = {
        apiKey: "AIzaSyBCFOfPu4_DWsY0s3OYZgQzSDk6da0eJZU",
        authDomain: "game-37d0b.firebaseapp.com",
        projectId: "game-37d0b",
        storageBucket: "game-37d0b.appspot.com",
        messagingSenderId: "533243023959",
        appId: "1:533243023959:web:350065c06f5544f02a4912"
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    const SESSION_TIMEOUT = 30 * 60 * 1000;
    let sessionTimer;
    let lastActivityTime;

    const DOM = {
        authContainer: document.getElementById('auth-container'),
        registerContainer: document.getElementById('register-container'),
        gameMenuContainer: document.getElementById('game-menu-container'),
        gameContainer: document.getElementById('game-container'),
        authMessage: document.getElementById('auth-message'),
        registerMessage: document.getElementById('register-message'),
        email: document.getElementById('email'),
        password: document.getElementById('password'),
        newEmail: document.getElementById('new-email'),
        newPassword: document.getElementById('new-password'),
        confirmPassword: document.getElementById('confirm-password'),
        loginBtn: document.getElementById('login-btn'),
        registerBtn: document.getElementById('register-btn'),
        showRegisterBtn: document.getElementById('show-register-btn'),
        showLoginBtn: document.getElementById('show-login-btn'),
        forgotPasswordLink: document.getElementById('forgot-password-link'),
        menuCurrentUser: document.getElementById('menu-current-user'),
        highScore: document.getElementById('high-score'),
        bestStreak: document.getElementById('best-streak'),
        startGameBtn: document.getElementById('start-game-btn'),
        currentUser: document.getElementById('current-user'),
        currentDifficulty: document.getElementById('current-difficulty'),
        mathProblem: document.getElementById('math-problem'),
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
        backToMenuBtn: document.getElementById('back-to-menu-btn'),
        difficultyBtns: document.querySelectorAll('.difficulty-btn'),
        toggleLoginPassword: document.getElementById('toggle-login-password'),
        toggleRegisterPassword: document.getElementById('toggle-register-password'),
        toggleConfirmPassword: document.getElementById('toggle-confirm-password'),
        userAvatar: document.getElementById('user-avatar'),
        gameUserAvatar: document.getElementById('game-user-avatar'),
        dropdownLogoutBtn: document.getElementById('dropdown-logout-btn'),
        gameDropdownLogoutBtn: document.getElementById('game-dropdown-logout-btn'),
        dropdownContent: document.querySelector('.dropdown-content'),
        gameDropdownContent: document.querySelector('#game-container .dropdown-content'),
        lastScore: document.getElementById('last-score'),
        bestStreakHistory: document.getElementById('best-streak-history'),
        gamesPlayed: document.getElementById('games-played'),
        leaderboardList: document.getElementById('leaderboard-list'),
        leaderboardTabs: document.querySelectorAll('.leaderboard-tab'),
        leaderboardUpdated: document.querySelector('.leaderboard-updated'),
        themeToggle: document.getElementById('theme-toggle'),
        gameThemeToggle: document.getElementById('game-theme-toggle'),
        authThemeToggle: document.getElementById('auth-theme-toggle'),
        registerThemeToggle: document.getElementById('register-theme-toggle')
    };

    const state = {
        currentUser: null,
        isRegistering: false,
        score: 0,
        highScore: 0,
        streak: 0,
        bestStreak: 0,
        timer: null,
        timeLeft: 30,
        solution: null,
        difficulty: 'easy',
        difficultySettings: {
            easy: { time: 45, points: 5, hintType: 'range' },
            medium: { time: 30, points: 10, hintType: 'oddEven' },
            hard: { time: 15, points: 15, hintType: 'none' }
        },
        userHistory: {
            lastScore: 0,
            bestStreak: 0,
            gamesPlayed: 0,
            allScores: []
        },
        leaderboardType: 'highScore',
        currentProblem: null,
        leaderboardListener: null,
        leaderboardRetries: 0,
        MAX_RETRIES: 3,
        darkMode: localStorage.getItem('darkMode') === 'true' || false,
        sessionActive: false
    };

    function startSession() {
        clearTimeout(sessionTimer);
        lastActivityTime = Date.now();
        state.sessionActive = true;
        localStorage.setItem('sessionActive', 'true');
        localStorage.setItem('sessionStart', Date.now().toString());
        setupActivityListeners();
        sessionTimer = setTimeout(() => handleSessionTimeout(), SESSION_TIMEOUT);
    }

    function handleSessionTimeout() {
        showMessage(DOM.authMessage, "Your session has expired due to inactivity. Please login again.", "error");
        handleLogout();
    }

    function resetSessionTimer() {
        if (state.sessionActive) {
            clearTimeout(sessionTimer);
            lastActivityTime = Date.now();
            sessionTimer = setTimeout(() => handleSessionTimeout(), SESSION_TIMEOUT);
        }
    }

    function setupActivityListeners() {
        document.addEventListener('mousemove', resetSessionTimer);
        document.addEventListener('keydown', resetSessionTimer);
        document.addEventListener('click', resetSessionTimer);
        document.addEventListener('scroll', resetSessionTimer);
    }

    function removeActivityListeners() {
        document.removeEventListener('mousemove', resetSessionTimer);
        document.removeEventListener('keydown', resetSessionTimer);
        document.removeEventListener('click', resetSessionTimer);
        document.removeEventListener('scroll', resetSessionTimer);
    }

    function endSession() {
        clearTimeout(sessionTimer);
        removeActivityListeners();
        state.sessionActive = false;
        localStorage.removeItem('sessionActive');
        localStorage.removeItem('sessionStart');
    }

    function checkExistingSession() {
        const sessionActive = localStorage.getItem('sessionActive') === 'true';
        const sessionStart = parseInt(localStorage.getItem('sessionStart'));
        if (sessionActive && sessionStart) {
            const sessionAge = Date.now() - sessionStart;
            if (sessionAge < SESSION_TIMEOUT) return true;
            else {
                endSession();
                return false;
            }
        }
        return false;
    }

    function toggleDarkMode() {
        state.darkMode = !state.darkMode;
        localStorage.setItem('darkMode', state.darkMode);
        applyDarkMode();
    }

    function applyDarkMode() {
        if (state.darkMode) {
            document.body.classList.add('dark-mode');
            if (DOM.themeToggle) DOM.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            if (DOM.gameThemeToggle) DOM.gameThemeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            if (DOM.authThemeToggle) DOM.authThemeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            if (DOM.registerThemeToggle) DOM.registerThemeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            if (DOM.themeToggle) DOM.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            if (DOM.gameThemeToggle) DOM.gameThemeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            if (DOM.authThemeToggle) DOM.authThemeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            if (DOM.registerThemeToggle) DOM.registerThemeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    function setupPasswordToggle() {
        function togglePasswordVisibility(input, icon) {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            const iconElement = icon.querySelector('i');
            iconElement.classList.remove('fa-eye', 'fa-eye-slash');
            iconElement.classList.add(isPassword ? 'fa-eye-slash' : 'fa-eye');
            icon.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            icon.classList.add('password-toggle-animate');
            setTimeout(() => icon.classList.remove('password-toggle-animate'), 300);
        }

        document.querySelectorAll('.toggle-password').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                const inputField = icon.closest('.password-field').querySelector('input');
                togglePasswordVisibility(inputField, icon);
            });
            icon.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const inputField = icon.closest('.password-field').querySelector('input');
                    togglePasswordVisibility(inputField, icon);
                }
            });
            icon.addEventListener('mousedown', (e) => e.preventDefault());
        });
    }

    async function handleLogin() {
        const email = DOM.email.value.trim();
        const password = DOM.password.value.trim();

        if (!email || !password) {
            showMessage(DOM.authMessage, "Please enter email and password.", "error");
            return;
        }

        DOM.loginBtn.disabled = true;
        DOM.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            state.currentUser = userCredential.user;
            startSession();
            await loadUserStats();
            await loadUserHistory();
            await updateLeaderboard();
            showMessage(DOM.authMessage, "Login successful!", "success");
            showGameMenu();
        } catch (error) {
            showMessage(DOM.authMessage, handleFirebaseError(error), "error");
        } finally {
            DOM.loginBtn.disabled = false;
            DOM.loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    }

    async function handleRegister() {
        const email = DOM.newEmail.value.trim();
        const password = DOM.newPassword.value.trim();
        const confirmPassword = DOM.confirmPassword.value.trim();

        if (!email || !password || !confirmPassword) {
            showMessage(DOM.registerMessage, "Please fill all fields.", "error");
            return;
        }

        if (password !== confirmPassword) {
            showMessage(DOM.registerMessage, "Passwords don't match.", "error");
            return;
        }

        if (!validatePassword(password)) {
            showMessage(DOM.registerMessage, "Password doesn't meet requirements.", "error");
            return;
        }

        state.isRegistering = true;
        DOM.registerContainer.classList.add("processing");
        DOM.registerBtn.disabled = true;
        DOM.registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const username = email.split('@')[0] || 'Player';
            const batch = db.batch();
            const userRef = db.collection("users").doc(userCredential.user.uid);
            batch.set(userRef, {
                email: email,
                highScore: 0,
                bestStreak: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            const leaderboardRef = db.collection("leaderboard").doc(userCredential.user.uid);
            batch.set(leaderboardRef, {
                name: username,
                email: email,
                highScore: 0,
                bestStreak: 0,
                gamesPlayed: 0,
                score: 0,
                streak: 0,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            const historyRef = db.collection("userHistory").doc(userCredential.user.uid);
            batch.set(historyRef, {
                lastScore: 0,
                bestStreak: 0,
                gamesPlayed: 0,
                allScores: [],
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            await batch.commit();
            await auth.signOut();
            showMessage(DOM.registerMessage, "Registration successful! Please login.", "success");
            showAuthScreen();
        } catch (error) {
            showMessage(DOM.registerMessage, handleFirebaseError(error), "error");
        } finally {
            state.isRegistering = false;
            DOM.registerBtn.disabled = false;
            DOM.registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
            DOM.registerContainer.classList.remove("processing");
        }
    }

    async function handleLogout() {
        try {
            await auth.signOut();
            state.currentUser = null;
            endSession();
            state.score = 0;
            state.streak = 0;
            state.timeLeft = 30;
            clearInterval(state.timer);
            DOM.scoreSpan.textContent = "0";
            DOM.streakSpan.textContent = "0";
            DOM.timerSpan.textContent = "30";
            showAuthScreen();
            showMessage(DOM.authMessage, "Logged out successfully", "success");
        } catch (error) {
            console.error("Logout error:", error);
            showMessage(DOM.authMessage, "Logout failed. Please try again.", "error");
        }
    }

    function handleFirebaseError(error) {
        const messages = {
            "auth/email-already-in-use": "Email already registered.",
            "auth/invalid-email": "Invalid email address.",
            "auth/weak-password": "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
            "auth/user-not-found": "Email not found.",
            "auth/wrong-password": "Incorrect password. Please try again or reset your password.",
            "auth/too-many-requests": "Too many attempts. Account temporarily locked. Try again later or reset your password."
        };
        return messages[error.code] || "Authentication failed. Please try again.";
    }

    function validatePassword(password) {
        const requirements = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?";:{}|<>]/.test(password)
        };
        document.getElementById('req-length').className = requirements.length ? 'valid' : 'invalid';
        document.getElementById('req-upper').className = requirements.upper ? 'valid' : 'invalid';
        document.getElementById('req-lower').className = requirements.lower ? 'valid' : 'invalid';
        document.getElementById('req-number').className = requirements.number ? 'valid' : 'invalid';
        document.getElementById('req-special').className = requirements.special ? 'valid' : 'invalid';
        return Object.values(requirements).every(Boolean);
    }

    async function fetchMathProblem() {
        try {
            DOM.loadingDiv.classList.remove("hidden");
            DOM.errorDiv.classList.add("hidden");
            DOM.mathProblem.style.display = "none";
            DOM.resultDiv.classList.add("hidden");
            DOM.tryAgainDiv.classList.add("hidden");
            DOM.userAnswer.value = "";
            const response = await fetch('https://marcconrad.com/uob/banana/api.php?out=json');
            const data = await response.json();
            if (!data.question || !data.solution) throw new Error("Invalid problem data");
            state.currentProblem = { question: data.question, solution: data.solution };
            DOM.mathProblem.innerHTML = `
                <div class="problem-image-container">
                    <img src="${state.currentProblem.question}" 
                         alt="Math problem" 
                         onload="this.style.opacity=1" 
                         style="opacity:0; transition: opacity 0.3s ease">
                </div>`;
            DOM.mathProblem.style.display = "block";
            DOM.loadingDiv.classList.add("hidden");
            setTimeout(() => DOM.userAnswer.focus(), 300);
        } catch (error) {
            console.error("Error generating puzzle:", error);
            DOM.loadingDiv.classList.add("hidden");
            DOM.errorDiv.classList.remove("hidden");
            DOM.errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${error.message || "Failed to load puzzle"}`;
        }
    }

    function checkAnswer() {
        const userAnswer = parseInt(DOM.userAnswer.value);
        if (isNaN(userAnswer)) {
            showMessage(DOM.resultDiv, "Please enter a valid number", "error");
            return;
        }
        clearInterval(state.timer);
        if (userAnswer === state.currentProblem.solution) {
            const points = state.difficultySettings[state.difficulty].points;
            state.score += points;
            state.streak++;
            if (state.streak > state.bestStreak) state.bestStreak = state.streak;
            DOM.scoreSpan.textContent = state.score;
            DOM.streakSpan.textContent = state.streak;
            DOM.resultDiv.innerHTML = `<i class="fas fa-check-circle"></i> Correct! +${points} points`;
            DOM.resultDiv.className = "message correct";
            DOM.resultDiv.classList.remove("hidden");
            if (state.score > state.highScore) {
                state.highScore = state.score;
                updateUserStats().then(() => updateLeaderboard());
            } else {
                updateUserStats();
            }
            setTimeout(fetchNewPuzzle, 1500);
            startTimer();
        } else {
            state.streak = 0;
            DOM.streakSpan.textContent = state.streak;
            DOM.resultDiv.innerHTML = `<i class="fas fa-times-circle"></i> Incorrect! The answer was ${state.currentProblem.solution}`;
            DOM.resultDiv.className = "message incorrect";
            DOM.resultDiv.classList.remove("hidden");
            DOM.tryAgainDiv.classList.remove("hidden");
            updateUserHistory(state.score);
        }
    }

    function showHint() {
        let hint = "";
        const hintType = state.difficultySettings[state.difficulty].hintType;
        if (hintType === 'range') {
            const range = Math.max(3, Math.floor(state.currentProblem.solution * 0.3));
            const lower = Math.max(0, state.currentProblem.solution - range);
            const upper = state.currentProblem.solution + range;
            hint = `The answer is between ${lower} and ${upper}`;
        } else if (hintType === 'oddEven') {
            hint = `The answer is ${state.currentProblem.solution % 2 === 0 ? 'even' : 'odd'}`;
        } else {
            hint = "No hints available for this difficulty";
        }
        showMessage(DOM.resultDiv, hint, "info");
    }

    function startTimer() {
        clearInterval(state.timer);
        state.timeLeft = state.difficultySettings[state.difficulty].time;
        DOM.timerSpan.textContent = state.timeLeft;
        state.timer = setInterval(() => {
            state.timeLeft--;
            DOM.timerSpan.textContent = state.timeLeft;
            if (state.timeLeft <= 0) {
                clearInterval(state.timer);
                endGame();
            }
        }, 1000);
    }

    function endGame() {
        DOM.resultDiv.innerHTML = `<i class="fas fa-clock"></i> Time's up! Final score: ${state.score}`;
        DOM.resultDiv.className = "message info";
        DOM.resultDiv.classList.remove("hidden");
        DOM.tryAgainDiv.classList.remove("hidden");
        if (state.score > state.highScore) state.highScore = state.score;
        if (state.streak > state.bestStreak) state.bestStreak = state.streak;
        Promise.all([
            updateUserStats(),
            updateUserHistory(state.score),
            updateLeaderboard()
        ]).catch(error => console.error("Error updating game results:", error));
    }

    async function loadUserStats() {
        if (!state.currentUser) return;
        try {
            const doc = await db.collection("users").doc(state.currentUser.uid).get();
            if (doc.exists) {
                const data = doc.data();
                state.highScore = data.highScore || 0;
                state.bestStreak = data.bestStreak || 0;
                DOM.highScore.textContent = state.highScore;
                DOM.bestStreak.textContent = state.bestStreak;
            }
        } catch (error) {
            console.error("Error loading user stats:", error);
        }
    }

    async function updateUserStats() {
        if (!state.currentUser) return;
        try {
            await db.collection("users").doc(state.currentUser.uid).update({
                highScore: Number(state.highScore) || 0,
                bestStreak: Number(state.bestStreak) || 0,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating user stats:", error);
            throw error;
        }
    }

    async function loadUserHistory() {
        if (!state.currentUser) return;
        try {
            const doc = await db.collection('userHistory').doc(state.currentUser.uid).get();
            if (doc.exists) {
                const data = doc.data();
                state.userHistory = {
                    lastScore: data.lastScore || 0,
                    bestStreak: data.bestStreak || 0,
                    gamesPlayed: data.gamesPlayed || 0,
                    allScores: data.allScores || []
                };
                updateHistoryUI();
            } else {
                await initializeUserHistory();
            }
        } catch (error) {
            console.error("Error loading user history:", error);
        }
    }

    async function initializeUserHistory() {
        try {
            await db.collection('userHistory').doc(state.currentUser.uid).set({
                lastScore: 0,
                bestStreak: 0,
                gamesPlayed: 0,
                allScores: [],
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            state.userHistory = { lastScore: 0, bestStreak: 0, gamesPlayed: 0, allScores: [] };
            updateHistoryUI();
        } catch (error) {
            console.error("Error initializing user history:", error);
        }
    }

    function updateHistoryUI() {
        if (DOM.lastScore) DOM.lastScore.textContent = state.userHistory.lastScore;
        if (DOM.bestStreakHistory) DOM.bestStreakHistory.textContent = state.userHistory.bestStreak;
        if (DOM.gamesPlayed) DOM.gamesPlayed.textContent = state.userHistory.gamesPlayed;
    }

    async function updateUserHistory(score) {
        if (!state.currentUser) return;
        state.userHistory.lastScore = score;
        state.userHistory.gamesPlayed = (state.userHistory.gamesPlayed || 0) + 1;
        state.userHistory.allScores.push(score);
        if (state.streak > (state.userHistory.bestStreak || 0)) {
            state.userHistory.bestStreak = state.streak;
        }
        updateHistoryUI();
        try {
            await db.collection('userHistory').doc(state.currentUser.uid).update({
                lastScore: state.userHistory.lastScore,
                bestStreak: state.userHistory.bestStreak,
                gamesPlayed: state.userHistory.gamesPlayed,
                allScores: firebase.firestore.FieldValue.arrayUnion(score),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating user history:", error);
            if (error.code === 'not-found') {
                await initializeUserHistory();
                await updateUserHistory(score);
            }
        }
    }

    // Leaderboard functions
    async function updateLeaderboard() {
        if (!state.currentUser) return;
        try {
            await db.collection("leaderboard").doc(state.currentUser.uid).update({
                name: state.currentUser.displayName || state.currentUser.email.split('@')[0] || 'Player',
                email: state.currentUser.email,
                highScore: Number(state.highScore) || 0,
                bestStreak: Number(state.bestStreak) || 0,
                gamesPlayed: Number(state.userHistory.gamesPlayed) || 0,
                score: Number(state.score) || 0,
                streak: Number(state.streak) || 0,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("Leaderboard update error:", error);
            setTimeout(() => updateLeaderboard(), 2000);
        }
    }

    function setupLeaderboardListener() {
        if (state.leaderboardListener) state.leaderboardListener();
        const query = db.collection('leaderboard')
            .orderBy(state.leaderboardType, 'desc')
            .limit(10);
        state.leaderboardListener = query.onSnapshot(
            (snapshot) => {
                if (!snapshot.empty) {
                    const validatedDocs = snapshot.docs.map(doc => {
                        const data = doc.data();
                        ['highScore', 'bestStreak', 'gamesPlayed', 'score', 'streak'].forEach(field => {
                            if (typeof data[field] !== 'number' || isNaN(data[field])) {
                                data[field] = 0;
                            }
                        });
                        return { id: doc.id, data: data };
                    });
                    displayLeaderboard({ 
                        forEach: callback => validatedDocs.forEach((doc, index) => callback(doc, index)),
                        empty: false
                    });
                } else {
                    DOM.leaderboardList.innerHTML = `
                        <div class="empty">
                            <i class="fas fa-info-circle"></i> No leaderboard data
                        </div>`;
                }
            },
            (error) => {
                console.error("Leaderboard error:", error);
                handleLeaderboardError(error);
            }
        );
    }

    function displayLeaderboard(snapshot) {
        let html = '';
        snapshot.forEach((doc, index) => {
            const player = doc.data;
            const isCurrentUser = state.currentUser && doc.id === state.currentUser.uid;
            const medal = index < 3 ? ['gold', 'silver', 'bronze'][index] : '';
            let displayName = player.name || 'Anonymous';
            if (!player.name && player.email) {
                displayName = player.email.split('@')[0] || 'Anonymous';
            }
            const avatarChar = displayName.charAt(0).toUpperCase();
            const scoreValue = player[state.leaderboardType];
            let displayScore;
            if (typeof scoreValue === 'number' && !isNaN(scoreValue)) {
                displayScore = scoreValue;
            } else if (typeof scoreValue === 'string') {
                const parsed = parseFloat(scoreValue);
                displayScore = isNaN(parsed) ? 0 : parsed;
            } else {
                displayScore = 0;
            }
            html += `
            <div class="leaderboard-item ${isCurrentUser ? 'you' : ''}">
                <span class="rank">${index + 1}.</span>
                <div class="player-info">
                    <div class="avatar ${medal}">${avatarChar}</div>
                    <span class="name">${displayName}</span>
                </div>
                <span class="score">${displayScore}</span>
            </div>`;
        });
        DOM.leaderboardList.innerHTML = html || `
            <div class="empty">
                <i class="fas fa-info-circle"></i> No leaderboard data
            </div>`;
        DOM.leaderboardUpdated.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    }

    function handleLeaderboardError(error) {
        state.leaderboardRetries++;
        if (state.leaderboardRetries <= state.MAX_RETRIES) {
            setTimeout(setupLeaderboardListener, 2000 * state.leaderboardRetries);
        } else {
            DOM.leaderboardList.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    Couldn't load leaderboard. Please try again later.
                </div>`;
            DOM.leaderboardUpdated.textContent = "Last update failed";
        }
    }

    function showMessage(element, message, type) {
        const icons = {
            error: 'fa-exclamation-circle',
            success: 'fa-check-circle',
            info: 'fa-info-circle'
        };
        element.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
        element.className = `message ${type}`;
        element.style.display = 'flex';
        setTimeout(() => {
            element.style.opacity = '0';
            setTimeout(() => {
                element.style.display = 'none';
                element.style.opacity = '1';
            }, 300);
        }, 3000);
    }

    function showAuthScreen() {
        DOM.authContainer.classList.remove("hidden");
        DOM.registerContainer.classList.add("hidden");
        DOM.gameMenuContainer.classList.add("hidden");
        DOM.gameContainer.classList.add("hidden");
        DOM.email.focus();
    }

    function showRegisterScreen() {
        DOM.authContainer.classList.add("hidden");
        DOM.registerContainer.classList.remove("hidden");
        DOM.gameMenuContainer.classList.add("hidden");
        DOM.gameContainer.classList.add("hidden");
        DOM.newEmail.focus();
    }

    function showGameMenu() {
        if (!state.currentUser) {
            showAuthScreen();
            return;
        }
        DOM.authContainer.classList.add("hidden");
        DOM.registerContainer.classList.add("hidden");
        DOM.gameMenuContainer.classList.remove("hidden");
        DOM.gameContainer.classList.add("hidden");
        DOM.menuCurrentUser.textContent = state.currentUser.email;
        DOM.highScore.textContent = state.highScore;
        DOM.bestStreak.textContent = state.bestStreak;
        setupLeaderboardListener();
    }

    function startGame() {
        if (!state.currentUser) {
            showAuthScreen();
            return;
        }
        DOM.gameMenuContainer.classList.add("hidden");
        DOM.gameContainer.classList.remove("hidden");
        DOM.currentUser.textContent = state.currentUser.email;
        DOM.currentDifficulty.textContent = 
            state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1);
        resetGame();
        fetchMathProblem();
    }

    function resetGame() {
        state.score = 0;
        state.streak = 0;
        state.timeLeft = state.difficultySettings[state.difficulty].time;
        DOM.scoreSpan.textContent = state.score;
        DOM.streakSpan.textContent = state.streak;
        DOM.timerSpan.textContent = state.timeLeft;
        clearInterval(state.timer);
        startTimer();
    }

    function fetchNewPuzzle() {
        fetchMathProblem();
    }


    function setupEventListeners() {
        DOM.loginBtn.addEventListener("click", handleLogin);
        DOM.registerBtn.addEventListener("click", handleRegister);
        DOM.showRegisterBtn.addEventListener("click", showRegisterScreen);
        DOM.showLoginBtn.addEventListener("click", showAuthScreen);
        DOM.forgotPasswordLink.addEventListener('click', (e) => e.preventDefault());

        DOM.startGameBtn.addEventListener("click", startGame);
        DOM.backToMenuBtn.addEventListener("click", showGameMenu);
        DOM.difficultyBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                DOM.difficultyBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                state.difficulty = btn.dataset.difficulty;
                document.querySelectorAll('.difficulty-details').forEach(detail => {
                    detail.classList.remove('active');
                });
                document.querySelector(`.difficulty-details[data-difficulty="${state.difficulty}"]`).classList.add('active');
            });
        });

        DOM.submitBtn.addEventListener("click", checkAnswer);
        DOM.newBtn.addEventListener("click", fetchNewPuzzle);
        DOM.hintBtn.addEventListener("click", showHint);
        DOM.tryAgainBtn.addEventListener("click", fetchNewPuzzle);
        DOM.userAnswer.addEventListener("keypress", (e) => {
            if (e.key === "Enter") checkAnswer();
        });

        [DOM.userAvatar, DOM.gameUserAvatar].forEach(avatar => {
            avatar.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = avatar === DOM.userAvatar 
                    ? DOM.dropdownContent 
                    : DOM.gameDropdownContent;
                dropdown.classList.toggle('hidden');
            });
        });

        [DOM.dropdownLogoutBtn, DOM.gameDropdownLogoutBtn].forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleLogout();
            });
        });

        document.addEventListener('click', () => {
            DOM.dropdownContent.classList.add('hidden');
            DOM.gameDropdownContent.classList.add('hidden');
        });

        DOM.newPassword.addEventListener('input', (e) => validatePassword(e.target.value));

        DOM.leaderboardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                DOM.leaderboardTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.leaderboardType = tab.dataset.type;
                setupLeaderboardListener();
            });
        });

        [DOM.themeToggle, DOM.gameThemeToggle, DOM.authThemeToggle, DOM.registerThemeToggle]
            .forEach(toggle => {
                if (toggle) toggle.addEventListener('click', toggleDarkMode);
            });

        setupPasswordToggle();
    }

    function init() {
        applyDarkMode();
        if (checkExistingSession()) {
            auth.onAuthStateChanged(user => {
                if (user) {
                    state.currentUser = user;
                    startSession();
                    if (!state.isRegistering) {
                        loadUserStats()
                            .then(loadUserHistory)
                            .then(updateLeaderboard)
                            .then(showGameMenu);
                    }
                } else {
                    endSession();
                    showAuthScreen();
                }
            });
        } else {
            auth.onAuthStateChanged(user => {
                if (user) {
                    state.currentUser = user;
                    if (!state.isRegistering) {
                        loadUserStats()
                            .then(loadUserHistory)
                            .then(updateLeaderboard)
                            .then(showGameMenu);
                    }
                } else {
                    showAuthScreen();
                }
            });
        }
        setupEventListeners();
    }

    init();
})();