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
        leaderboardUpdated: document.createElement('div')
    };

    DOM.leaderboardUpdated.className = 'leaderboard-updated';
    document.querySelector('.leaderboard-container').appendChild(DOM.leaderboardUpdated);

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
        leaderboard: [],
        leaderboardType: 'highScore',
        currentProblem: null,
        leaderboardListener: null,
        retryCount: 0,
        MAX_RETRIES: 3
    };

    async function fetchMathProblem() {
        try {
            DOM.loadingDiv.classList.remove("hidden");
            DOM.errorDiv.classList.add("hidden");
            DOM.mathProblem.style.display = "none";
            DOM.resultDiv.classList.add("hidden");
            DOM.tryAgainDiv.classList.add("hidden");
            DOM.userAnswer.value = "";
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('https://marcconrad.com/uob/banana/api.php?out=json', {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.question || !data.solution) {
                throw new Error("Invalid problem data from API");
            }
            
            state.currentProblem = {
                question: data.question,
                solution: data.solution
            };
            
            DOM.mathProblem.innerHTML = `
                <div class="problem-image-container">
                    <img src="${state.currentProblem.question}" 
                         alt="Math problem" 
                         onload="this.style.opacity=1" 
                         style="opacity:0; transition: opacity 0.3s ease"
                         onerror="this.onerror=null;this.src='fallback-image.png';">
                </div>
            `;
            DOM.mathProblem.style.display = "block";
            DOM.loadingDiv.classList.add("hidden");
            state.retryCount = 0;
            
            setTimeout(() => {
                DOM.userAnswer.focus();
            }, 300);
        } catch (error) {
            console.error("Error generating puzzle:", error);
            DOM.loadingDiv.classList.add("hidden");
            DOM.errorDiv.classList.remove("hidden");
            DOM.errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${error.message || "Failed to load puzzle. Please try again."}`;
            
            if (state.retryCount < state.MAX_RETRIES) {
                state.retryCount++;
                const delay = Math.pow(2, state.retryCount) * 1000;
                setTimeout(fetchNewPuzzle, delay);
                return;
            }
            state.retryCount = 0;
        }
    }

    function validatePassword(password) {
        const requirements = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        document.getElementById('req-length').className = requirements.length ? 'valid' : 'invalid';
        document.getElementById('req-upper').className = requirements.upper ? 'valid' : 'invalid';
        document.getElementById('req-lower').className = requirements.lower ? 'valid' : 'invalid';
        document.getElementById('req-number').className = requirements.number ? 'valid' : 'invalid';
        document.getElementById('req-special').className = requirements.special ? 'valid' : 'invalid';
        
        return Object.values(requirements).every(Boolean);
    }

    function setupPasswordToggle() {
        DOM.toggleLoginPassword.addEventListener('click', () => {
            togglePasswordVisibility(DOM.password, DOM.toggleLoginPassword);
        });

        DOM.toggleRegisterPassword.addEventListener('click', () => {
            togglePasswordVisibility(DOM.newPassword, DOM.toggleRegisterPassword);
        });

        DOM.toggleConfirmPassword.addEventListener('click', () => {
            togglePasswordVisibility(DOM.confirmPassword, DOM.toggleConfirmPassword);
        });

        [DOM.toggleLoginPassword, DOM.toggleRegisterPassword, DOM.toggleConfirmPassword].forEach(icon => {
            icon.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const inputField = icon.closest('.password-field').querySelector('input');
                    togglePasswordVisibility(inputField, icon);
                }
            });
        });
    }

    function togglePasswordVisibility(input, icon) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
        icon.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
    }

    async function handleLogin() {
        const email = DOM.email.value.trim();
        const password = DOM.password.value.trim();

        if (!email || !password) {
            showMessage(DOM.authMessage, "Please enter email and password.", "error");
            return;
        }

        if (password.length < 8) {
            showMessage(DOM.authMessage, "Invalid password format. Please reset your password.", "error");
            return;
        }
        
        DOM.loginBtn.disabled = true;
        DOM.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            state.currentUser = userCredential.user;
            
            showMessage(DOM.authMessage, "Login successful!", "success");
            await loadUserStats();
            await loadUserHistory();
            await updateLeaderboard();
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

            await auth.signOut();
            
            showMessage(DOM.registerMessage, "Registration successful! Please login.", "success");
            
            DOM.newEmail.value = "";
            DOM.newPassword.value = "";
            DOM.confirmPassword.value = "";
            
            showAuthScreen();
            
        } catch (error) {
            showMessage(DOM.registerMessage, handleFirebaseError(error), "error");
        } finally {
            DOM.registerBtn.disabled = false;
            DOM.registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
        }
    }

    async function handleLogout() {
        try {
            await auth.signOut();
            state.currentUser = null;
            
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

    async function handlePasswordReset() {
        const email = prompt("Please enter your email address to reset your password:");
        if (!email) return;
        
        try {
            await auth.sendPasswordResetEmail(email);
            showMessage(DOM.authMessage, `Password reset email sent to ${email}`, "success");
        } catch (error) {
            showMessage(DOM.authMessage, handleFirebaseError(error), "error");
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
                bestStreak: state.bestStreak,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating user stats:", error);
            throw error;
        }
    }

    async function updateUserHistory(score) {
        state.userHistory.lastScore = score;
        state.userHistory.gamesPlayed++;
        state.userHistory.allScores.push(score);
        
        if (state.streak > state.userHistory.bestStreak) {
            state.userHistory.bestStreak = state.streak;
        }

        DOM.lastScore.textContent = state.userHistory.lastScore;
        DOM.bestStreakHistory.textContent = state.userHistory.bestStreak;
        DOM.gamesPlayed.textContent = state.userHistory.gamesPlayed;

        if (state.currentUser) {
            try {
                await db.collection('userHistory').doc(state.currentUser.uid).set({
                    lastScore: state.userHistory.lastScore,
                    bestStreak: state.userHistory.bestStreak,
                    gamesPlayed: state.userHistory.gamesPlayed,
                    allScores: firebase.firestore.FieldValue.arrayUnion(score),
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error("Error updating user history:", error);
                throw error;
            }
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

                DOM.lastScore.textContent = state.userHistory.lastScore;
                DOM.bestStreakHistory.textContent = state.userHistory.bestStreak;
                DOM.gamesPlayed.textContent = state.userHistory.gamesPlayed;
            }
        } catch (error) {
            console.error("Error loading user history:", error);
        }
    }

    async function updateLeaderboard() {
        try {
            if (state.currentUser) {
                const batch = db.batch();
                
                const userRef = db.collection("users").doc(state.currentUser.uid);
                batch.update(userRef, {
                    highScore: state.highScore,
                    bestStreak: state.bestStreak,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                const leaderboardRef = db.collection('leaderboard').doc(state.currentUser.uid);
                batch.set(leaderboardRef, {
                    name: state.currentUser.email.split('@')[0],
                    highScore: state.highScore,
                    bestStreak: state.bestStreak,
                    gamesPlayed: state.userHistory.gamesPlayed,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                await batch.commit();
                await renderLeaderboard();
            }
        } catch (error) {
            console.error("Error updating leaderboard:", error);
            setTimeout(updateLeaderboard, 2000);
        }
    }

    async function renderLeaderboard() {
        try {
            DOM.leaderboardList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading leaderboard...</div>';
            
            let query;
            switch(state.leaderboardType) {
                case 'bestStreak':
                    query = db.collection('leaderboard')
                        .orderBy('bestStreak', 'desc')
                        .orderBy('highScore', 'desc')
                        .limit(10);
                    break;
                case 'gamesPlayed':
                    query = db.collection('leaderboard')
                        .orderBy('gamesPlayed', 'desc')
                        .orderBy('highScore', 'desc')
                        .limit(10);
                    break;
                default:
                    query = db.collection('leaderboard')
                        .orderBy('highScore', 'desc')
                        .limit(10);
            }

            const snapshot = await query.get();
            DOM.leaderboardList.innerHTML = '';
            
            if (snapshot.empty) {
                DOM.leaderboardList.innerHTML = '<div class="message info">No leaderboard data available yet</div>';
                return;
            }

            snapshot.forEach((doc, index) => {
                const player = { id: doc.id, ...doc.data() };
                const leaderboardItem = document.createElement('div');
                leaderboardItem.className = `leaderboard-item ${
                    state.currentUser && player.id === state.currentUser.uid ? 'you' : ''
                }`;
                
                const displayValue = state.leaderboardType === 'highScore' ? player.highScore.toLocaleString() :
                                    state.leaderboardType === 'bestStreak' ? player.bestStreak.toLocaleString() :
                                    player.gamesPlayed.toLocaleString();
                
                leaderboardItem.innerHTML = `
                    <span class="leaderboard-rank">${index + 1}</span>
                    <div class="player-info">
                        <div class="player-avatar">${player.name.charAt(0).toUpperCase()}</div>
                        <span class="player-name">${player.name}</span>
                    </div>
                    <span class="player-score">${displayValue}</span>
                `;
                
                DOM.leaderboardList.appendChild(leaderboardItem);
            });

            const now = new Date();
            DOM.leaderboardUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;

        } catch (error) {
            console.error("Error rendering leaderboard:", error);
            DOM.leaderboardList.innerHTML = '<div class="message error"><i class="fas fa-exclamation-triangle"></i> Failed to load leaderboard</div>';
        }
    }

    function setupLeaderboardListener() {
        if (state.leaderboardListener) {
            state.leaderboardListener();
        }
        
        let query;
        switch(state.leaderboardType) {
            case 'bestStreak':
                query = db.collection('leaderboard')
                    .orderBy('bestStreak', 'desc')
                    .orderBy('highScore', 'desc')
                    .limit(10);
                break;
            case 'gamesPlayed':
                query = db.collection('leaderboard')
                    .orderBy('gamesPlayed', 'desc')
                    .orderBy('highScore', 'desc')
                    .limit(10);
                break;
            default:
                query = db.collection('leaderboard')
                    .orderBy('highScore', 'desc')
                    .limit(10);
        }

        state.leaderboardListener = query.onSnapshot(snapshot => {
            renderLeaderboard();
        }, error => {
            console.error("Leaderboard listener error:", error);
        });
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
        }
        if (state.streak > state.bestStreak) {
            state.bestStreak = state.streak;
        }
        
        updateUserStats()
            .then(() => updateUserHistory(state.score))
            .then(() => updateLeaderboard())
            .catch(error => {
                console.error("Error updating game results:", error);
            });
    }

    function fetchNewPuzzle() {
        fetchMathProblem();
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
            
            if (state.streak > state.bestStreak) {
                state.bestStreak = state.streak;
            }
            
            DOM.scoreSpan.textContent = state.score;
            DOM.streakSpan.textContent = state.streak;
            
            DOM.resultDiv.innerHTML = `<i class="fas fa-check-circle"></i> Correct! +${points} points`;
            DOM.resultDiv.className = "message correct";
            DOM.resultDiv.classList.remove("hidden");
            
            setTimeout(fetchNewPuzzle, 1500);
            startTimer();
        } else {
            state.streak = 0;
            DOM.streakSpan.textContent = state.streak;
            
            DOM.resultDiv.innerHTML = `<i class="fas fa-times-circle"></i> Incorrect! The answer was ${state.currentProblem.solution}`;
            DOM.resultDiv.className = "message incorrect";
            DOM.resultDiv.classList.remove("hidden");
            DOM.tryAgainDiv.classList.remove("hidden");
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

    function setupEventListeners() {
        DOM.loginBtn.addEventListener("click", handleLogin);
        DOM.registerBtn.addEventListener("click", handleRegister);
        DOM.showRegisterBtn.addEventListener("click", showRegisterScreen);
        DOM.showLoginBtn.addEventListener("click", showAuthScreen);
        DOM.forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            handlePasswordReset();
        });
        
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

        DOM.userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            DOM.dropdownContent.classList.toggle('hidden');
        });

        DOM.gameUserAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            DOM.gameDropdownContent.classList.toggle('hidden');
        });

        DOM.dropdownLogoutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleLogout();
        });

        DOM.gameDropdownLogoutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleLogout();
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-profile')) {
                DOM.dropdownContent.classList.add('hidden');
                DOM.gameDropdownContent.classList.add('hidden');
            }
        });

        DOM.newPassword.addEventListener('input', (e) => {
            validatePassword(e.target.value);
        });

        DOM.leaderboardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                DOM.leaderboardTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.leaderboardType = tab.dataset.type;
                setupLeaderboardListener();
            });
        });

        setupPasswordToggle();
    }

    function init() {
        showAuthScreen();
        
        auth.onAuthStateChanged(user => {
            if (user) {
                state.currentUser = user;
                loadUserStats();
                loadUserHistory();
                updateLeaderboard();
                setupLeaderboardListener();
            }
        });

        setupEventListeners();
    }

    init();
})();