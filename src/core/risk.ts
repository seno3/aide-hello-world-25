/**
 * Risk classification system for code patterns
 * Identifies potentially dangerous operations that require extra confirmation
 */

export type RiskLevel = 'low' | 'medium' | 'high';

export class RiskClassifier {
  private static instance: RiskClassifier;
  
  public static getInstance(): RiskClassifier {
    if (!RiskClassifier.instance) {
      RiskClassifier.instance = new RiskClassifier();
    }
    return RiskClassifier.instance;
  }

  /**
   * Classify the risk level of code changes
   */
  public classifyRisk(text: string): RiskLevel {
    const lowerText = text.toLowerCase();
    
    // High risk patterns - destructive or security-critical operations
    if (this.hasHighRiskPatterns(lowerText)) {
      return 'high';
    }
    
    // Medium risk patterns - potentially problematic but not destructive
    if (this.hasMediumRiskPatterns(lowerText)) {
      return 'medium';
    }
    
    // Default to low risk
    return 'low';
  }

  /**
   * Check if code requires explicit confirmation before applying
   */
  public requiresConfirm(risk: RiskLevel): boolean {
    return risk === 'high' || risk === 'medium';
  }

  /**
   * Get risk explanation for display
   */
  public getRiskExplanation(risk: RiskLevel): string {
    switch (risk) {
      case 'high':
        return '⚠️ HIGH RISK: This change involves destructive operations, security-sensitive code, or data migration. Please review carefully before applying.';
      case 'medium':
        return '⚠️ MEDIUM RISK: This change may have side effects or require special consideration. Review the changes before applying.';
      case 'low':
        return '✅ LOW RISK: This change appears safe to apply.';
      default:
        return 'Unknown risk level';
    }
  }

  /**
   * Get specific risk warnings for high-risk patterns
   */
  public getSpecificWarnings(text: string): string[] {
    const warnings: string[] = [];
    const lowerText = text.toLowerCase();

    // Security patterns
    if (this.hasSecurityPatterns(lowerText)) {
      warnings.push('🔐 Security-sensitive code detected (tokens, passwords, keys)');
    }

    // Database patterns
    if (this.hasDatabasePatterns(lowerText)) {
      warnings.push('🗄️ Database operations detected (schema changes, data migration)');
    }

    // File system patterns
    if (this.hasFileSystemPatterns(lowerText)) {
      warnings.push('📁 File system operations detected (deletion, modification)');
    }

    // Network patterns
    if (this.hasNetworkPatterns(lowerText)) {
      warnings.push('🌐 Network configuration detected (CORS, CSP, headers)');
    }

    return warnings;
  }

  private hasHighRiskPatterns(text: string): boolean {
    const highRiskPatterns = [
      // Security patterns
      /jwt|oauth|password|token|secret|key|credential/i,
      /aws_access_key_id|api_key|private_key/i,
      
      // Destructive database operations
      /drop\s+table|truncate\s+table|delete\s+from.*where\s+1=1/i,
      /alter\s+table.*drop|alter\s+table.*modify/i,
      
      // File system destruction
      /rm\s+-rf|del\s+\/s|format\s+c:/i,
      
      // Migration and schema changes
      /migrate|migration|schema.*change/i,
      
      // System-level operations
      /sudo|su\s+-|chmod\s+777|chown\s+root/i
    ];

    return highRiskPatterns.some(pattern => pattern.test(text));
  }

  private hasMediumRiskPatterns(text: string): boolean {
    const mediumRiskPatterns = [
      // Database operations
      /insert\s+into|update\s+set|delete\s+from/i,
      /create\s+table|create\s+index|create\s+view/i,
      
      // File operations
      /fs\.unlink|fs\.rmdir|fs\.writeFile/i,
      /unlink|rmdir|writeFile/i,
      
      // Network configuration
      /cors|csp|content-security-policy/i,
      /x-frame-options|x-xss-protection/i,
      
      // Environment and configuration
      /process\.env|config|environment/i,
      /\.env|config\.json|settings\.json/i,
      
      // Async operations without proper error handling
      /async.*(?!await|catch|try)/i,
      
      // Regular expressions
      /new\s+RegExp|\.test\(|\.match\(/i
    ];

    return mediumRiskPatterns.some(pattern => pattern.test(text));
  }

  private hasSecurityPatterns(text: string): boolean {
    const securityPatterns = [
      /jwt|oauth|password|token|secret|key|credential/i,
      /aws_access_key_id|api_key|private_key|auth/i,
      /bcrypt|hash|encrypt|decrypt/i,
      /session|cookie|csrf/i
    ];

    return securityPatterns.some(pattern => pattern.test(text));
  }

  private hasDatabasePatterns(text: string): boolean {
    const databasePatterns = [
      /select|insert|update|delete|create|drop|alter/i,
      /migrate|migration|schema|table|index|view/i,
      /database|db\.|connection|pool/i,
      /sql|query|transaction|commit|rollback/i
    ];

    return databasePatterns.some(pattern => pattern.test(text));
  }

  private hasFileSystemPatterns(text: string): boolean {
    const fileSystemPatterns = [
      /fs\.|file|directory|path/i,
      /readFile|writeFile|unlink|rmdir|mkdir/i,
      /rm\s+-rf|del|format|disk/i,
      /\.json|\.xml|\.csv|\.log/i
    ];

    return fileSystemPatterns.some(pattern => pattern.test(text));
  }

  private hasNetworkPatterns(text: string): boolean {
    const networkPatterns = [
      /cors|csp|content-security-policy/i,
      /x-frame-options|x-xss-protection/i,
      /http|https|fetch|axios|request/i,
      /header|header/i,
      /proxy|redirect|forward/i
    ];

    return networkPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Get risk score (0-100) for more granular risk assessment
   */
  public getRiskScore(text: string): number {
    let score = 0;
    const lowerText = text.toLowerCase();

    // High risk patterns add significant points
    if (this.hasSecurityPatterns(lowerText)) score += 40;
    if (this.hasDatabasePatterns(lowerText)) score += 30;
    if (this.hasFileSystemPatterns(lowerText)) score += 25;
    if (this.hasNetworkPatterns(lowerText)) score += 15;

    // Additional risk factors
    if (lowerText.includes('delete') || lowerText.includes('remove')) score += 10;
    if (lowerText.includes('admin') || lowerText.includes('root')) score += 10;
    if (lowerText.includes('production') || lowerText.includes('prod')) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Check if text contains any risk patterns at all
   */
  public hasAnyRisk(text: string): boolean {
    return this.classifyRisk(text) !== 'low';
  }
}
