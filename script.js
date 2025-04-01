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
        menuCurrentUser: document.getElementById('menu-current-user'),
        highScore: document.getElementById('high-score'),
        bestStreak: document.getElementById('best-streak'),
        startGameBtn: document.getElementById('start-game-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        gameLogoutBtn: document.getElementById('game-logout-btn'),
        currentUser: document.getElementById('current-user'),
        currentDifficulty: document.getElementById('current-difficulty'),
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
        backToMenuBtn: document.getElementById('back-to-menu-btn'),
        rememberMe: document.getElementById('remember-me'),
        sessionWarning: document.getElementById('session-warning'),
        countdown: document.getElementById('countdown'),
        difficultyBtns: document.querySelectorAll('.difficulty-btn')
    };

    const state = {
        currentUser: null,
        score: 0,
        highScore: 0,
        streak: 0,
        bestStreak: 0,
        timer: null,
        timeLeft: 30,
        solution: null,
        difficulty: 'easy',
        inactivityTimer: null,
        warningTimer: null,
        countdownInterval: null,
        difficultySettings: {
            easy: { time: 45, points: 5, hintType: 'range' },
            medium: { time: 30, points: 10, hintType: 'oddEven' },
            hard: { time: 15, points: 15, hintType: 'none' }
        },
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


    async function setAuthPersistence(remember) {
        try {
            const persistence = remember ? 
                firebase.auth.Auth.Persistence.LOCAL : 
                firebase.auth.Auth.Persistence.SESSION;
            
            await auth.setPersistence(persistence);
            return true;
        } catch (error) {
            console.error("Persistence error:", error);
            return false;
        }
    }

    function trackActivity() {
        clearTimeout(state.inactivityTimer);
        clearTimeout(state.warningTimer);
        clearInterval(state.countdownInterval);
        DOM.sessionWarning.classList.add("hidden");

        state.inactivityTimer = setTimeout(() => {
            handleLogout();
            alert("You were logged out due to inactivity.");
        }, 30 * 60 * 1000);

        state.warningTimer = setTimeout(() => {
            DOM.sessionWarning.classList.remove("hidden");
            startCountdown(5 * 60);
        }, 25 * 60 * 1000);
    }

    function startCountdown(seconds) {
        let remaining = seconds;
        updateCountdownDisplay(remaining);

        state.countdownInterval = setInterval(() => {
            remaining--;
            updateCountdownDisplay(remaining);
            if (remaining <= 0) clearInterval(state.countdownInterval);
        }, 1000);
    }

    function updateCountdownDisplay(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        DOM.countdown.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    async function logSession(action) {
        if (!state.currentUser) return;
        
        await db.collection("sessions").doc(state.currentUser.uid).set({
            email: state.currentUser.email,
            lastActive: firebase.firestore.FieldValue.serverTimestamp(),
            action: action,
            device: navigator.userAgent
        }, { merge: true });
    }

    function initActivityTracking() {
        ["mousemove", "keydown", "click", "scroll"].forEach(event => {
            window.addEventListener(event, trackActivity);
        });
    }


    async function handleLogin() {
        const email = DOM.email.value.trim();
        const password = DOM.password.value.trim();
        const rememberMe = DOM.rememberMe.checked;

        if (!email || !password) {
            showMessage(DOM.authMessage, "Please enter email and password.", "error");
            return;
        }

        DOM.loginBtn.disabled = true;
        DOM.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            const persistenceSet = await setAuthPersistence(rememberMe);
            if (!persistenceSet) {
                throw new Error("Failed to set authentication persistence");
            }

            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            state.currentUser = userCredential.user;
            
            await logSession("login");
            trackActivity();
            
            showMessage(DOM.authMessage, "Login successful!", "success");
            await loadUserStats();
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

        if (password.length < 6) {
            showMessage(DOM.registerMessage, "Password must be at least 6 characters.", "error");
            return;
        }

        DOM.registerBtn.disabled = true;
        DOM.registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await db.collection("users").doc(userCredential.user.uid).set({
                email: email,
                highScore: 0,
                bestStreak: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            DOM.newEmail.value = "";
            DOM.newPassword.value = "";
            DOM.confirmPassword.value = "";
            showAuthScreen();
            showMessage(DOM.authMessage, "Registration successful! Please login.", "success");
            
        } catch (error) {
            showMessage(DOM.registerMessage, handleFirebaseError(error), "error");
        } finally {
            DOM.registerBtn.disabled = false;
            DOM.registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
        }
    }

    async function handleLogout() {
        clearTimeout(state.inactivityTimer);
        clearTimeout(state.warningTimer);
        clearInterval(state.countdownInterval);

        try {
            await logSession("logout");
            await auth.signOut();
            state.currentUser = null;
            showAuthScreen();
        } catch (error) {
            console.error("Logout error:", error);
        }
    }

    function handleFirebaseError(error) {
        const messages = {
            "auth/email-already-in-use": "Email already registered.",
            "auth/invalid-email": "Invalid email address.",
            "auth/weak-password": "Password must be 6+ characters.",
            "auth/user-not-found": "Email not found.",
            "auth/wrong-password": "Incorrect password.",
            "auth/too-many-requests": "Too many attempts. Try again later."
        };
        return messages[error.code] || "Authentication failed. Please try again.";
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
                highScore: state.highScore,
                bestStreak: state.bestStreak
            });
        } catch (error) {
            console.error("Error updating user stats:", error);
        }
    }



    function showMessage(element, message, type) {
        const icon = type === 'error' ? 'fas fa-exclamation-circle' : 
                    type === 'success' ? 'fas fa-check-circle' : 'fas fa-info-circle';
        
        element.innerHTML = `<i class="${icon}"></i> ${message}`;
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
        DOM.email.value = "";
        DOM.password.value = "";
        DOM.authContainer.classList.remove("hidden");
        DOM.registerContainer.classList.add("hidden");
        DOM.gameMenuContainer.classList.add("hidden");
        DOM.gameContainer.classList.add("hidden");
        DOM.email.focus();
    }

    function showRegisterScreen() {
        DOM.newEmail.value = "";
        DOM.newPassword.value = "";
        DOM.confirmPassword.value = "";
        DOM.registerMessage.textContent = "";
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
        fetchNewPuzzle();
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

    function startTimer() {
        clearInterval(state.timer);
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
        
        if (state.score > state.highScore) {
            state.highScore = state.score;
            updateUserStats();
        }
    }

    async function fetchNewPuzzle() {
        DOM.loadingDiv.classList.remove("hidden");
        DOM.errorDiv.classList.add("hidden");
        DOM.puzzleImage.style.display = "none";
        DOM.resultDiv.classList.add("hidden");
        DOM.tryAgainDiv.classList.add("hidden");
        DOM.userAnswer.value = "";
        DOM.userAnswer.focus();
        
        try {
            state.timeLeft = state.difficultySettings[state.difficulty].time;
            DOM.timerSpan.textContent = state.timeLeft;
            
            const randomIndex = Math.floor(Math.random() * state.sampleImages.length);
            const puzzle = state.sampleImages[randomIndex];
            
            state.solution = puzzle.solution;
            state.currentPuzzle = puzzle;
            
            DOM.puzzleImage.src = puzzle.url;
            DOM.puzzleImage.onload = () => {
                DOM.loadingDiv.classList.add("hidden");
                DOM.puzzleImage.style.display = "block";
            };
        } catch (error) {
            console.error("Error fetching puzzle:", error);
            DOM.loadingDiv.classList.add("hidden");
            DOM.errorDiv.classList.remove("hidden");
        }
    }

    function checkAnswer() {
        const userAnswer = parseInt(DOM.userAnswer.value);
        
        if (isNaN(userAnswer)) {
            showMessage(DOM.resultDiv, "Please enter a valid number", "error");
            return;
        }
        
        clearInterval(state.timer);
        
        if (userAnswer === state.solution) {
            const points = state.difficultySettings[state.difficulty].points;
            state.score += points;
            state.streak++;
            
            if (state.streak > state.bestStreak) {
                state.bestStreak = state.streak;
                updateUserStats();
            }
            
            DOM.scoreSpan.textContent = state.score;
            DOM.streakSpan.textContent = state.streak;
            
            DOM.resultDiv.innerHTML = `<i class="fas fa-check-circle"></i> Correct! +${points} points`;
            DOM.resultDiv.className = "message correct";
            DOM.resultDiv.classList.remove("hidden");
            
            if (state.score > state.highScore) {
                state.highScore = state.score;
                updateUserStats();
            }
            
            setTimeout(fetchNewPuzzle, 1500);
            startTimer();
        } else {
            state.streak = 0;
            DOM.streakSpan.textContent = state.streak;
            
            DOM.resultDiv.innerHTML = `<i class="fas fa-times-circle"></i> Incorrect! The answer was ${state.solution}`;
            DOM.resultDiv.className = "message incorrect";
            DOM.resultDiv.classList.remove("hidden");
            DOM.tryAgainDiv.classList.remove("hidden");
        }
    }

    function showHint() {
        let hint = "";
        const hintType = state.difficultySettings[state.difficulty].hintType;
        
        if (hintType === 'range') {
            const range = 3;
            const lower = Math.max(0, state.solution - range);
            const upper = state.solution + range;
            hint = `The answer is between ${lower} and ${upper}`;
        } else if (hintType === 'oddEven') {
            hint = `The answer is ${state.solution % 2 === 0 ? 'even' : 'odd'}`;
        } else {
            hint = "No hints available for this difficulty";
        }
        
        showMessage(DOM.resultDiv, hint, "info");
    }


    function setupEventListeners() {
        DOM.loginBtn.addEventListener("click", handleLogin);
        DOM.registerBtn.addEventListener("click", handleRegister);
        DOM.showRegisterBtn.addEventListener("click", showRegisterScreen);
        DOM.showLoginBtn.addEventListener("click", showAuthScreen);
        DOM.logoutBtn.addEventListener("click", handleLogout);
        DOM.gameLogoutBtn.addEventListener("click", handleLogout);
        
        DOM.startGameBtn.addEventListener("click", startGame);
        DOM.backToMenuBtn.addEventListener("click", showGameMenu);
        DOM.difficultyBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                DOM.difficultyBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                state.difficulty = btn.dataset.difficulty;
            });
        });
        
        DOM.submitBtn.addEventListener("click", checkAnswer);
        DOM.newBtn.addEventListener("click", fetchNewPuzzle);
        DOM.hintBtn.addEventListener("click", showHint);
        DOM.tryAgainBtn.addEventListener("click", fetchNewPuzzle);
        DOM.userAnswer.addEventListener("keypress", (e) => {
            if (e.key === "Enter") checkAnswer();
        });
    }



    function init() {
        auth.onAuthStateChanged(user => {
            if (user) {
                state.currentUser = user;
                logSession("auto-login");
                trackActivity();
                loadUserStats();
                showGameMenu();
            } else {
                showAuthScreen();
            }
        });

        initActivityTracking();
        setupEventListeners();
        
        state.sampleImages.forEach(img => {
            new Image().src = img.url;
        });
    }

    init();
})();