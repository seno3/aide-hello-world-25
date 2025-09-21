import { Context, TeachingCard } from './telemetry';

export interface BossChallenge {
  id: string;
  title: string;
  description: string;
  buggyCode: string;
  correctCode: string;
  testOutput: string;
  hint: string;
  explanation: string;
  concept: string;
}

export interface BossTestResult {
  passed: boolean;
  output: string;
  error?: string;
  hint?: string;
}

export class BossFightManager {
  private static instance: BossFightManager;
  private acceptedChangesCount = 0;
  private bossModeEnabled = true;
  private currentBoss: BossChallenge | null = null;

  public static getInstance(): BossFightManager {
    if (!BossFightManager.instance) {
      BossFightManager.instance = new BossFightManager();
    }
    return BossFightManager.instance;
  }

  /**
   * Increment accepted changes counter and trigger boss fight if needed
   */
  public onChangeAccepted(ctx: Context): BossChallenge | null {
    this.acceptedChangesCount++;
    
    if (this.bossModeEnabled && this.acceptedChangesCount % 5 === 0) {
      return this.startBossFight(ctx);
    }
    
    return null;
  }

  /**
   * Start a new boss fight based on recent changes
   */
  public startBossFight(ctx: Context): BossChallenge {
    const challenges = this.generateChallengesFromContext(ctx);
    const selectedChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    
    this.currentBoss = selectedChallenge;
    return selectedChallenge;
  }

  /**
   * Test the user's solution against the boss challenge
   */
  public testBossSolution(userCode: string): BossTestResult {
    if (!this.currentBoss) {
      return {
        passed: false,
        output: 'No active boss challenge',
        error: 'No boss challenge is currently active'
      };
    }

    // Simulate test execution
    const isCorrect = this.isCodeCorrect(userCode, this.currentBoss.correctCode);
    
    if (isCorrect) {
      const bossOutput = this.currentBoss.testOutput;
      this.currentBoss = null; // Boss defeated
      return {
        passed: true,
        output: bossOutput,
        hint: '🎉 Boss defeated! Great job!'
      };
    } else {
      return {
        passed: false,
        output: this.fakeTests(),
        error: 'Test failed',
        hint: this.currentBoss.hint
      };
    }
  }

  /**
   * Get the current boss challenge
   */
  public getCurrentBoss(): BossChallenge | null {
    return this.currentBoss;
  }

  /**
   * Toggle boss fight mode on/off
   */
  public toggleBossMode(): boolean {
    this.bossModeEnabled = !this.bossModeEnabled;
    return this.bossModeEnabled;
  }

  /**
   * Check if boss mode is enabled
   */
  public isBossModeEnabled(): boolean {
    return this.bossModeEnabled;
  }

  /**
   * Reset the accepted changes counter
   */
  public resetCounter(): void {
    this.acceptedChangesCount = 0;
  }

  private generateChallengesFromContext(ctx: Context): BossChallenge[] {
    const challenges: BossChallenge[] = [];
    const text = ctx.after.toLowerCase();

    // Generate challenges based on detected patterns
    if (text.includes('async') && text.includes('await')) {
      challenges.push(...this.getAsyncAwaitChallenges());
    }
    
    if (text.includes('sql') || text.includes('query')) {
      challenges.push(...this.getSQLChallenges());
    }
    
    if (text.includes('react') || text.includes('useeffect')) {
      challenges.push(...this.getReactChallenges());
    }
    
    if (text.includes('debounce') || text.includes('throttle')) {
      challenges.push(...this.getPerformanceChallenges());
    }

    // Add generic challenges if no specific ones found
    if (challenges.length === 0) {
      challenges.push(...this.getGenericChallenges());
    }

    return challenges;
  }

  private getAsyncAwaitChallenges(): BossChallenge[] {
    return [
      {
        id: 'async-race-condition',
        title: '🐉 Race Condition Dragon',
        description: 'Fix the race condition in this async code!',
        buggyCode: `const fetchUserData = async (userId) => {
  const user = fetch(\`/api/users/\${userId}\`);
  const posts = fetch(\`/api/users/\${userId}/posts\`);
  return { user, posts };
};`,
        correctCode: `const fetchUserData = async (userId) => {
  const user = await fetch(\`/api/users/\${userId}\`);
  const posts = await fetch(\`/api/users/\${userId}/posts\`);
  return { user, posts };
};`,
        testOutput: '✅ User data loaded successfully\n✅ Posts loaded successfully\n✅ No race conditions detected',
        hint: 'Look for missing await keywords - they ensure promises resolve before continuing',
        explanation: 'Without await, fetch returns a Promise object instead of the actual data, causing race conditions.',
        concept: 'async-await'
      },
      {
        id: 'async-error-handling',
        title: '⚡ Error Handling Thunder',
        description: 'Add proper error handling to this async function!',
        buggyCode: `const processData = async (data) => {
  const result = await apiCall(data);
  return result.processed;
};`,
        correctCode: `const processData = async (data) => {
  try {
    const result = await apiCall(data);
    return result.processed;
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
};`,
        testOutput: '✅ Error handling implemented\n✅ Graceful failure handling\n✅ Proper error logging',
        hint: 'Async functions can throw errors - wrap them in try-catch blocks',
        explanation: 'Unhandled promise rejections can crash your application. Always handle errors in async code.',
        concept: 'error-handling'
      }
    ];
  }

  private getSQLChallenges(): BossChallenge[] {
    return [
      {
        id: 'sql-injection',
        title: '🗡️ SQL Injection Assassin',
        description: 'Fix the SQL injection vulnerability!',
        buggyCode: `const getUser = (name) => {
  const query = \`SELECT * FROM users WHERE name = '\${name}'\`;
  return db.query(query);
};`,
        correctCode: `const getUser = (name) => {
  const query = 'SELECT * FROM users WHERE name = ?';
  return db.query(query, [name]);
};`,
        testOutput: '✅ SQL injection vulnerability fixed\n✅ Parameterized query implemented\n✅ Security test passed',
        hint: 'Never concatenate user input directly into SQL queries - use parameterized queries instead',
        explanation: 'SQL injection allows attackers to execute arbitrary SQL commands. Parameterized queries prevent this.',
        concept: 'sql-security'
      }
    ];
  }

  private getReactChallenges(): BossChallenge[] {
    return [
      {
        id: 'useeffect-deps',
        title: '🔄 Dependency Array Demon',
        description: 'Fix the useEffect dependency array!',
        buggyCode: `useEffect(() => {
  fetchUserData(userId);
}, []); // Missing userId dependency`,
        correctCode: `useEffect(() => {
  fetchUserData(userId);
}, [userId]); // Include userId in dependencies`,
        testOutput: '✅ Effect re-runs when userId changes\n✅ No stale closure issues\n✅ Proper dependency tracking',
        hint: 'useEffect should include all variables it references in the dependency array',
        explanation: 'Missing dependencies can cause stale closures where the effect uses outdated values.',
        concept: 'react-hooks'
      }
    ];
  }

  private getPerformanceChallenges(): BossChallenge[] {
    return [
      {
        id: 'debounce-memory-leak',
        title: '💨 Memory Leak Phantom',
        description: 'Fix the memory leak in this debounced function!',
        buggyCode: `const SearchComponent = () => {
  const debouncedSearch = debounce(searchAPI, 300);
  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
};`,
        correctCode: `const SearchComponent = () => {
  const debouncedSearch = useMemo(
    () => debounce(searchAPI, 300),
    []
  );
  
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);
  
  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
};`,
        testOutput: '✅ Memory leak prevented\n✅ Debounce function properly cleaned up\n✅ Performance optimized',
        hint: 'Debounce functions need to be cleaned up to prevent memory leaks',
        explanation: 'Without cleanup, debounce functions can accumulate and cause memory leaks in React components.',
        concept: 'performance'
      }
    ];
  }

  private getGenericChallenges(): BossChallenge[] {
    return [
      {
        id: 'equality-bug',
        title: '⚖️ Equality Bug Goblin',
        description: 'Fix the equality comparison bug!',
        buggyCode: `if (user.role == 'admin') {
  grantAccess();
}`,
        correctCode: `if (user.role === 'admin') {
  grantAccess();
}`,
        testOutput: '✅ Strict equality comparison used\n✅ Type coercion prevented\n✅ Bug fixed',
        hint: 'Use === instead of == to avoid type coercion bugs',
        explanation: '== performs type coercion which can lead to unexpected results. === is more predictable.',
        concept: 'javascript-basics'
      },
      {
        id: 'null-check',
        title: '🛡️ Null Check Guardian',
        description: 'Add proper null checking!',
        buggyCode: `const processUser = (user) => {
  return user.profile.name.toUpperCase();
};`,
        correctCode: `const processUser = (user) => {
  return user?.profile?.name?.toUpperCase() || 'Unknown';
};`,
        testOutput: '✅ Null safety implemented\n✅ Optional chaining used\n✅ No runtime errors',
        hint: 'Use optional chaining (?.) to safely access nested properties',
        explanation: 'Accessing properties on null/undefined values throws errors. Optional chaining prevents this.',
        concept: 'null-safety'
      }
    ];
  }

  private isCodeCorrect(userCode: string, correctCode: string): boolean {
    // Simple comparison - in a real implementation, you might use AST comparison
    const normalize = (code: string) => code.replace(/\s+/g, ' ').trim();
    return normalize(userCode) === normalize(correctCode);
  }

  private fakeTests(): string {
    const testOutputs = [
      '❌ Test failed: Expected "admin" but got undefined',
      '❌ TypeError: Cannot read property "name" of undefined',
      '❌ AssertionError: Expected true but got false',
      '❌ Test failed: Function returned Promise instead of resolved value',
      '❌ SecurityError: SQL injection detected in query',
      '❌ MemoryError: Potential memory leak detected',
      '❌ Test failed: Effect did not re-run when dependency changed'
    ];
    
    return testOutputs[Math.floor(Math.random() * testOutputs.length)];
  }
}
