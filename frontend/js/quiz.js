
const quizSelect = document.getElementById("quiz-select");
const loadQuizBtn = document.getElementById("load-quiz-btn");
const statusMessage = document.getElementById("status-message");

const questionArea = document.getElementById("question-area");
const quizTitle = document.getElementById("quiz-title");
const questionProgress = document.getElementById("question-progress");
const questionText = document.getElementById("question-text");
const optionsArea = document.getElementById("options-area");
const answerForm = document.getElementById("answer-form");
const nextBtn = document.getElementById("next-btn");

const resultArea = document.getElementById("result-area");
const scoreText = document.getElementById("score-text");
const answersReview = document.getElementById("answers-review");
const retryBtn = document.getElementById("retry-btn");

let quizzes = [];
let currentQuiz = null;
let currentQuestionIndex = 0;
let selectedAnswers = [];
let isSubmitting = false;
let isLoading = false;

function showStatus(message) {
    statusMessage.textContent = message;
    statusMessage.hidden = false;
}

function hideStatus() {
    statusMessage.textContent = "";
    statusMessage.hidden = true;
}

async function loadQuizzes() {
    showStatus("Loading quizzes...");
    loadQuizBtn.disabled = true;

    try {
        const data = await api("/quizzes");

        quizzes = Array.isArray(data.quizzes) ? data.quizzes : [];
        quizSelect.replaceChildren();

        if (quizzes.length === 0) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No quizzes available";
            quizSelect.appendChild(option);
            showStatus("No quizzes found in the database.");
            return;
        }

        for (const quiz of quizzes) {
            const option = document.createElement("option");
            option.value = quiz.slug;
            option.textContent = quiz.title;
            quizSelect.appendChild(option);
        }

        hideStatus();
    } catch (error) {
        showStatus(error.message || "Unable to load quizzes.");
    } finally {
        loadQuizBtn.disabled = false;
    }
}

async function startQuiz() {
    const slug = quizSelect.value;

    if (!slug) {
        showStatus("Please select a quiz first.");
        return;
    }

    if (isSubmitting || isLoading) return;

    isLoading = true;
    loadQuizBtn.disabled = true;
    retryBtn.disabled = true;
    nextBtn.disabled = true;

    showStatus("Loading fresh questions...");

    try {
        const data = await api(
            `/quizzes/${encodeURIComponent(slug)}`
        );

        const quiz = data.quiz;

        if (!quiz || !Array.isArray(quiz.questions) ||
            quiz.questions.length === 0) {
            throw new Error(
                "No questions are currently available for this quiz."
            );
        }

        const validQuestions = quiz.questions.every(question =>
            typeof question.id === "string" &&
            /^[a-f0-9]{64}$/.test(question.id) &&
            typeof question.question === "string" &&
            Array.isArray(question.options) &&
            question.options.length > 0
        );

        if (!validQuestions) {
            throw new Error(
                "Invalid question data. Check the backend quiz route."
            );
        }

        currentQuiz = quiz;
        currentQuestionIndex = 0;
        selectedAnswers = new Array(quiz.questions.length).fill(null);

        quizTitle.textContent = quiz.title;
        resultArea.hidden = true;
        questionArea.hidden = false;

        renderQuestion();

        if (data.cycleRestarted) {
            showStatus(
                "All questions completed! Your next question cycle has started."
            );
        } else {
            hideStatus();
        }
    } catch (error) {
        questionArea.hidden = true;
        showStatus(error.message || "Unable to load questions.");
    } finally {
        isLoading = false;
        loadQuizBtn.disabled = false;
        retryBtn.disabled = false;
        nextBtn.disabled = false;
    }
}

function renderQuestion() {
    if (!currentQuiz ||
        currentQuestionIndex >= currentQuiz.questions.length) {
        return;
    }

    const question = currentQuiz.questions[currentQuestionIndex];

    questionProgress.textContent =
        `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;

    questionText.textContent = question.question;
    optionsArea.replaceChildren();

    question.options.forEach((optionText, index) => {
        const label = document.createElement("label");
        label.className = "question-option";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "quiz-answer";
        radio.value = String(index);
        radio.required = true;
        radio.checked = selectedAnswers[currentQuestionIndex] === index;

        const text = document.createElement("span");
        text.textContent = optionText;

        label.append(radio, text);
        optionsArea.appendChild(label);
    });

    nextBtn.textContent =
        currentQuestionIndex === currentQuiz.questions.length - 1
            ? "Submit Quiz"
            : "Next Question";

    nextBtn.disabled = false;
}

answerForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (isSubmitting || isLoading || !currentQuiz) return;

    const selected = answerForm.querySelector(
        'input[name="quiz-answer"]:checked'
    );

    if (!selected) {
        showStatus("Please select an answer before continuing.");
        return;
    }

    const answerIndex = Number(selected.value);

    if (!Number.isInteger(answerIndex) ||
        answerIndex < 0 ||
        answerIndex >= currentQuiz.questions[currentQuestionIndex].options.length) {
        showStatus("Please select a valid answer.");
        return;
    }

    selectedAnswers[currentQuestionIndex] = answerIndex;
    hideStatus();

    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
        return;
    }

    await submitQuiz();
});

async function submitQuiz() {
    if (!currentQuiz || isSubmitting || isLoading) return;

    const questionIds = currentQuiz.questions.map(question => question.id);

    if (
        selectedAnswers.length !== questionIds.length ||
        selectedAnswers.some(answer => !Number.isInteger(answer) || answer < 0) ||
        questionIds.some(id => typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id)) ||
        new Set(questionIds).size !== questionIds.length
    ) {
        showStatus(
            "Answers or question IDs are invalid. Please load the quiz again."
        );
        return;
    }

    isSubmitting = true;
    nextBtn.disabled = true;
    loadQuizBtn.disabled = true;
    retryBtn.disabled = true;

    showStatus("Checking your answers...");

    try {
        const data = await api(
            `/quizzes/${encodeURIComponent(currentQuiz.slug)}/submit`,
            {
                method: "POST",
                body: JSON.stringify({
                    answers: selectedAnswers,
                    questionIds
                })
            }
        );

        if (!Array.isArray(data.results) ||
            data.results.length !== currentQuiz.questions.length) {
            throw new Error("The server returned an unexpected quiz result.");
        }

        questionArea.hidden = true;
        resultArea.hidden = false;

        scoreText.textContent =
            `Your score: ${data.score}/${data.total} (${data.percentage}%)`;

        answersReview.replaceChildren();

        data.results.forEach((result, index) => {
            const question = currentQuiz.questions[index];

            const card = document.createElement("div");
            card.className = "question-option";

            const heading = document.createElement("h3");
            heading.textContent =
                `Question ${index + 1}: ${result.correct ? "Correct" : "Incorrect"}`;

            const answer = document.createElement("p");
            answer.textContent =
                `Correct answer: ${question.options[result.correctAnswer] ?? "Unavailable"}`;

            const explanation = document.createElement("p");
            explanation.textContent =
                `Explanation: ${result.explanation || "No explanation provided."}`;

            card.append(heading, answer, explanation);
            answersReview.appendChild(card);
        });

        hideStatus();
    } catch (error) {
        showStatus(error.message || "Unable to submit quiz. Please try again.");
    } finally {
        isSubmitting = false;
        nextBtn.disabled = false;
        loadQuizBtn.disabled = false;
        retryBtn.disabled = false;
    }
}

loadQuizBtn.addEventListener("click", startQuiz);

retryBtn.addEventListener("click", async () => {
    await startQuiz();
});

loadQuizzes();
