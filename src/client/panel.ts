import { TeachingCard } from '../core/telemetry';

export class TeachingPanel {
  private currentCard: TeachingCard | null = null;
  private currentBoss: any = null;
  private quizAnswered = false;
  private selectedAnswer: number | null = null;
  private fillAnswer: string = '';

  constructor() {
    this.initializeEventListeners();
    this.setupMessageListener();
  }

  private initializeEventListeners(): void {
    // Teaching card actions
    document.getElementById('applyBtn')?.addEventListener('click', () => this.handleApply());
    document.getElementById('skipBtn')?.addEventListener('click', () => this.handleSkip());
    document.getElementById('hintBtn')?.addEventListener('click', () => this.handleHint());
    document.getElementById('deepDiveBtn')?.addEventListener('click', () => this.handleDeepDive());

    // Quiz interactions
    document.getElementById('fillInput')?.addEventListener('input', (e) => {
      this.fillAnswer = (e.target as HTMLInputElement).value;
    });

    // Boss fight actions
    document.getElementById('testSolution')?.addEventListener('click', () => this.handleTestSolution());
    document.getElementById('getHint')?.addEventListener('click', () => this.handleGetHint());
    document.getElementById('skipBoss')?.addEventListener('click', () => this.handleSkipBoss());

    // Visualizer controls
    document.getElementById('toggleVisualizer')?.addEventListener('click', () => this.toggleVisualizer());
    document.getElementById('closeVisualizer')?.addEventListener('click', () => this.closeVisualizer());
    document.getElementById('exportLearnings')?.addEventListener('click', () => this.exportLearnings());
  }

  private setupMessageListener(): void {
    // Listen for messages from the extension
    window.addEventListener('message', (event) => {
      const message = event.data;
      
      switch (message.type) {
        case 'showTeachingCard':
          this.showTeachingCard(message.card);
          break;
        case 'showBossFight':
          this.showBossFight(message.boss);
          break;
        case 'showLoading':
          this.showLoading();
          break;
        case 'hideLoading':
          this.hideLoading();
          break;
        case 'updateVisualizer':
          this.updateVisualizer(message.concepts);
          break;
        case 'bossDefeated':
          this.showBossDefeated();
          break;
      }
    });
  }

  public showTeachingCard(card: TeachingCard): void {
    this.currentCard = card;
    this.quizAnswered = false;
    this.selectedAnswer = null;
    this.fillAnswer = '';

    // Hide other views
    this.hideAllViews();
    
    // Show teaching card
    const teachingCard = document.getElementById('teachingCard');
    if (teachingCard) {
      teachingCard.classList.remove('hidden');
    }

    this.renderTeachingCard(card);
  }

  public showBossFight(boss: any): void {
    this.currentBoss = boss;
    
    // Hide other views
    this.hideAllViews();
    
    // Show boss card
    const bossCard = document.getElementById('bossCard');
    if (bossCard) {
      bossCard.classList.remove('hidden');
    }

    this.renderBossFight(boss);
  }

  public showLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.remove('hidden');
    }
  }

  public hideLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }
  }

  private renderTeachingCard(card: TeachingCard): void {
    // Set title and risk badge
    const title = document.getElementById('cardTitle');
    if (title) {
      title.textContent = this.getCardTitle(card.mode);
    }

    const riskBadge = document.getElementById('riskBadge');
    if (riskBadge) {
      riskBadge.textContent = card.risk.toUpperCase();
      riskBadge.className = `risk-badge ${card.risk}`;
    }

    // Show risk warning if high risk
    const riskWarning = document.getElementById('riskWarning');
    if (riskWarning) {
      if (card.risk === 'high') {
        riskWarning.classList.remove('hidden');
        const warningText = document.getElementById('warningText');
        if (warningText) {
          warningText.textContent = 'High risk operation detected - please review carefully';
        }
      } else {
        riskWarning.classList.add('hidden');
      }
    }

    // Set summary
    const summaryWhy = document.getElementById('summaryWhy');
    if (summaryWhy) {
      summaryWhy.textContent = card.summary_why;
    }

    // Set code diff
    const codeDiff = document.getElementById('codeDiff');
    if (codeDiff) {
      codeDiff.textContent = card.diff.unified;
    }

    // Render callouts
    this.renderCallouts(card.callouts);

    // Render quiz
    this.renderQuiz(card.micro_check);

    // Render alternatives
    this.renderAlternatives(card.actions.suggest_alternatives);

    // Set next step
    const nextStep = document.getElementById('nextStep');
    if (nextStep) {
      nextStep.textContent = card.actions.next_step;
    }

    // Update action buttons
    this.updateActionButtons(card);
  }

  private renderCallouts(callouts: Array<{ anchor: string; note: string }>): void {
    const calloutsContainer = document.getElementById('callouts');
    if (!calloutsContainer) return;

    calloutsContainer.innerHTML = '';

    callouts.forEach(callout => {
      const calloutElement = document.createElement('div');
      calloutElement.className = 'callout';
      calloutElement.innerHTML = `
        <span class="anchor">${callout.anchor}:</span> ${callout.note}
      `;
      calloutsContainer.appendChild(calloutElement);
    });
  }

  private renderQuiz(microCheck: TeachingCard['micro_check']): void {
    const quizQuestion = document.getElementById('quizQuestion');
    const quizChoices = document.getElementById('quizChoices');
    const quizFill = document.getElementById('quizFill');
    const fillInput = document.getElementById('fillInput') as HTMLInputElement;

    if (!quizQuestion) return;

    quizQuestion.textContent = microCheck.question;

    if (microCheck.type === 'mcq' && microCheck.choices) {
      // Show multiple choice
      if (quizChoices) {
        quizChoices.classList.remove('hidden');
        quizChoices.innerHTML = '';

        microCheck.choices.forEach((choice, index) => {
          const choiceElement = document.createElement('div');
          choiceElement.className = 'quiz-choice';
          choiceElement.textContent = choice;
          choiceElement.addEventListener('click', () => this.selectAnswer(index));
          quizChoices.appendChild(choiceElement);
        });
      }

      if (quizFill) {
        quizFill.classList.add('hidden');
      }
    } else if (microCheck.type === 'fill') {
      // Show fill-in-the-blank
      if (quizChoices) {
        quizChoices.classList.add('hidden');
      }

      if (quizFill) {
        quizFill.classList.remove('hidden');
        if (fillInput) {
          fillInput.value = '';
          fillInput.placeholder = 'Your answer...';
        }
      }
    }
  }

  private renderAlternatives(alternatives: Array<{ label: string; diff: string; tradeoff: string }>): void {
    const alternativesContainer = document.getElementById('alternatives');
    if (!alternativesContainer) return;

    alternativesContainer.innerHTML = '';

    alternatives.forEach(alternative => {
      const alternativeElement = document.createElement('div');
      alternativeElement.className = 'alternative';
      alternativeElement.innerHTML = `
        <div class="alternative-header">
          <div class="alternative-label">${alternative.label}</div>
          <div class="alternative-tradeoff">${alternative.tradeoff}</div>
        </div>
        <div class="alternative-diff">${alternative.diff}</div>
      `;
      alternativesContainer.appendChild(alternativeElement);
    });
  }

  private renderBossFight(boss: any): void {
    const bossTitle = document.getElementById('bossTitle');
    const bossDescription = document.getElementById('bossDescription');
    const bossChallenge = document.getElementById('bossChallenge');
    const buggyCode = document.getElementById('buggyCode');
    const testOutput = document.getElementById('testOutput');
    const solutionInput = document.getElementById('bossSolution') as HTMLTextAreaElement;

    if (bossTitle) bossTitle.textContent = boss.title;
    if (bossDescription) bossDescription.textContent = boss.description;
    if (bossChallenge) bossChallenge.textContent = boss.challenge;
    if (buggyCode) buggyCode.textContent = boss.buggyCode;
    if (testOutput) testOutput.textContent = boss.testOutput;
    if (solutionInput) solutionInput.value = '';

    // Reset boss health
    const bossHealth = document.getElementById('bossHealth');
    const bossHealthText = document.getElementById('bossHealthText');
    if (bossHealth) bossHealth.style.width = '100%';
    if (bossHealthText) bossHealthText.textContent = '100%';
  }

  private selectAnswer(index: number): void {
    if (this.quizAnswered) return;

    this.selectedAnswer = index;
    
    // Update UI
    const choices = document.querySelectorAll('.quiz-choice');
    choices.forEach((choice, i) => {
      choice.classList.remove('selected');
      if (i === index) {
        choice.classList.add('selected');
      }
    });

    // Check answer after a short delay
    setTimeout(() => this.checkAnswer(), 500);
  }

  private checkAnswer(): void {
    if (!this.currentCard || this.quizAnswered) return;

    this.quizAnswered = true;
    const microCheck = this.currentCard.micro_check;
    let isCorrect = false;

    if (microCheck.type === 'mcq' && this.selectedAnswer !== null) {
      isCorrect = this.selectedAnswer === microCheck.answer_index;
    } else if (microCheck.type === 'fill') {
      isCorrect = this.fillAnswer.toLowerCase().trim() === (microCheck.answer_fill || '').toLowerCase().trim();
    }

    this.showQuizFeedback(isCorrect, microCheck.explain_on_wrong);
    this.sendQuizResult(isCorrect);
  }

  private showQuizFeedback(isCorrect: boolean, explanation: string): void {
    const feedback = document.getElementById('quizFeedback');
    if (!feedback) return;

    feedback.classList.remove('hidden');
    feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedback.textContent = isCorrect ? '✅ Correct!' : `❌ ${explanation}`;

    // Update choice styling for MCQ
    if (this.currentCard?.micro_check.type === 'mcq' && this.selectedAnswer !== null) {
      const choices = document.querySelectorAll('.quiz-choice');
      choices.forEach((choice, index) => {
        if (index === this.selectedAnswer) {
          choice.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
        if (index === this.currentCard?.micro_check.answer_index) {
          choice.classList.add('correct');
        }
      });
    }
  }

  private updateActionButtons(card: TeachingCard): void {
    const applyBtn = document.getElementById('applyBtn') as HTMLButtonElement;
    const skipBtn = document.getElementById('skipBtn') as HTMLButtonElement;
    const hintBtn = document.getElementById('hintBtn') as HTMLButtonElement;
    const deepDiveBtn = document.getElementById('deepDiveBtn') as HTMLButtonElement;

    if (applyBtn) {
      applyBtn.disabled = card.actions.apply_requires_confirm && !this.quizAnswered;
    }

    if (skipBtn) {
      skipBtn.disabled = false;
    }

    if (hintBtn) {
      hintBtn.disabled = false;
    }

    if (deepDiveBtn) {
      deepDiveBtn.disabled = false;
    }
  }

  private handleApply(): void {
    if (!this.currentCard) return;

    // Send apply message to extension
    this.sendMessage({
      type: 'apply',
      card: this.currentCard,
      quizCorrect: this.quizAnswered ? this.selectedAnswer === this.currentCard.micro_check.answer_index : null
    });

    // Hide the card
    this.hideAllViews();
    this.showEmptyState();
  }

  private handleSkip(): void {
    if (!this.currentCard) return;

    // Send skip message to extension
    this.sendMessage({
      type: 'skip',
      card: this.currentCard
    });

    // Hide the card
    this.hideAllViews();
    this.showEmptyState();
  }

  private handleHint(): void {
    if (!this.currentCard) return;

    // Show hint in a simple alert (in a real implementation, this could be more sophisticated)
    alert('Hint: ' + this.currentCard.micro_check.explain_on_wrong);
  }

  private handleDeepDive(): void {
    if (!this.currentCard) return;

    // Send deep dive message to extension
    this.sendMessage({
      type: 'deepDive',
      card: this.currentCard
    });
  }

  private handleTestSolution(): void {
    if (!this.currentBoss) return;

    const solutionInput = document.getElementById('bossSolution') as HTMLTextAreaElement;
    const userCode = solutionInput?.value || '';

    // Send test solution message to extension
    this.sendMessage({
      type: 'testBossSolution',
      boss: this.currentBoss,
      userCode: userCode
    });
  }

  private handleGetHint(): void {
    if (!this.currentBoss) return;

    const feedback = document.getElementById('bossFeedback');
    if (feedback) {
      feedback.classList.remove('hidden');
      feedback.className = 'boss-feedback';
      feedback.textContent = `💡 Hint: ${this.currentBoss.hint}`;
    }
  }

  private handleSkipBoss(): void {
    if (!this.currentBoss) return;

    // Send skip boss message to extension
    this.sendMessage({
      type: 'skipBoss',
      boss: this.currentBoss
    });

    // Hide boss card
    this.hideAllViews();
    this.showEmptyState();
  }

  private showBossDefeated(): void {
    const feedback = document.getElementById('bossFeedback');
    if (feedback) {
      feedback.classList.remove('hidden');
      feedback.className = 'boss-feedback success';
      feedback.textContent = '🎉 Boss defeated! Great job!';
    }

    // Hide boss after a delay
    setTimeout(() => {
      this.hideAllViews();
      this.showEmptyState();
    }, 3000);
  }

  private toggleVisualizer(): void {
    const visualizer = document.getElementById('visualizer');
    if (visualizer) {
      visualizer.classList.toggle('hidden');
    }
  }

  private closeVisualizer(): void {
    const visualizer = document.getElementById('visualizer');
    if (visualizer) {
      visualizer.classList.add('hidden');
    }
  }

  private updateVisualizer(concepts: string[]): void {
    // This will be implemented in visualizer.ts
    if (window.visualizer) {
      window.visualizer.update(concepts);
    }
  }

  private exportLearnings(): void {
    this.sendMessage({
      type: 'exportLearnings'
    });
  }

  private showEmptyState(): void {
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
      emptyState.classList.remove('hidden');
    }
  }

  private hideAllViews(): void {
    const views = ['teachingCard', 'bossCard', 'visualizer', 'emptyState'];
    views.forEach(viewId => {
      const view = document.getElementById(viewId);
      if (view) {
        view.classList.add('hidden');
      }
    });
  }

  private getCardTitle(mode: string): string {
    switch (mode) {
      case 'explain': return '📚 Learning Card';
      case 'capsule': return '💊 Quick Capsule';
      case 'bug': return '🐛 Bug Fix';
      case 'tradeoff': return '⚖️ Trade-off Analysis';
      default: return '🎓 Teaching Card';
    }
  }

  private sendQuizResult(isCorrect: boolean): void {
    this.sendMessage({
      type: 'quizResult',
      correct: isCorrect,
      card: this.currentCard
    });
  }

  private sendMessage(message: any): void {
    // Send message to the extension
    if (window.vscode) {
      window.vscode.postMessage(message);
    }
  }
}

// Initialize the panel when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TeachingPanel();
});

// Make visualizer globally available
declare global {
  interface Window {
    visualizer: any;
    vscode: any;
  }
}
