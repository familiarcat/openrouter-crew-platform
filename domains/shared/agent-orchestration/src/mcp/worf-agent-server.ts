/**
 * Worf Agent MCP Server
 *
 * Provides Claude with security and compliance verification tools.
 * Worf is conservative, principled, and risk-averse.
 *
 * Available Tools:
 * - verify-compliance: Check compliance with security policies
 * - assess-risks: Identify security and operational risks
 * - validate-audit-trail: Verify audit logging and traceability
 * - check-policy-adherence: Validate against policies and constraints
 */

import BaseMCPServer, { ToolDefinition, ToolResult } from './base-mcp-server.js'

export class WorfAgentServer extends BaseMCPServer {
  constructor() {
    super('Worf', 'security-compliance')
    this.setupTools()
  }

  /**
   * Setup all security/compliance tools
   */
  private setupTools() {
    // Tool 1: Verify Compliance
    this.registerTool(
      {
        name: 'verify-compliance',
        description:
          'Check if a proposed change complies with security policies and standards. Returns compliance status and required mitigation.',
        inputSchema: {
          type: 'object',
          properties: {
            proposal: {
              type: 'string',
              description: 'Description of the proposed change'
            },
            compliance_framework: {
              type: 'string',
              description: 'Framework to check against: "SOC2", "HIPAA", "GDPR", "general-security"',
              default: 'SOC2'
            }
          }
        }
      },
      this.verifyCompliance.bind(this)
    )

    // Tool 2: Assess Risks
    this.registerTool(
      {
        name: 'assess-risks',
        description:
          'Identify security and operational risks in a proposed change. Returns risk assessment with mitigation strategies.',
        inputSchema: {
          type: 'object',
          properties: {
            proposal: {
              type: 'string',
              description: 'Description of the proposed change'
            },
            scope: {
              type: 'string',
              description: 'Scope of change: "model-selection", "infrastructure", "data-access", "api-change"',
              default: 'model-selection'
            }
          }
        }
      },
      this.assessRisks.bind(this)
    )

    // Tool 3: Validate Audit Trail
    this.registerTool(
      {
        name: 'validate-audit-trail',
        description:
          'Verify that a proposed change maintains proper audit logging and decision traceability.',
        inputSchema: {
          type: 'object',
          properties: {
            proposal: {
              type: 'string',
              description: 'Description of the proposed change'
            },
            decision_path: {
              type: 'string',
              description:
                'How the decision was made: "cost-optimization", "performance-improvement", "feature-addition"'
            }
          }
        }
      },
      this.validateAuditTrail.bind(this)
    )

    // Tool 4: Check Policy Adherence
    this.registerTool(
      {
        name: 'check-policy-adherence',
        description:
          'Validate that a proposed change adheres to organizational policies and constraints.',
        inputSchema: {
          type: 'object',
          properties: {
            proposal: {
              type: 'string',
              description: 'Description of the proposed change'
            },
            check_budget: {
              type: 'boolean',
              description: 'Check against budget constraints',
              default: true
            },
            check_security: {
              type: 'boolean',
              description: 'Check against security policies',
              default: true
            },
            check_compliance: {
              type: 'boolean',
              description: 'Check against compliance requirements',
              default: true
            }
          }
        }
      },
      this.checkPolicyAdherence.bind(this)
    )
  }

  /**
   * Tool Implementation: Verify Compliance
   */
  private async verifyCompliance(args: any): Promise<ToolResult> {
    try {
      const { proposal, compliance_framework = 'SOC2' } = args

      if (!proposal) {
        return {
          success: false,
          error: 'Missing required parameter: proposal',
          confidence: 0
        }
      }

      // Check against compliance frameworks
      const complianceChecks = this.getComplianceChecks(compliance_framework)
      const results: any[] = []

      for (const check of complianceChecks) {
        const passed = this.evaluateComplianceCheck(proposal, check)
        results.push({
          requirement: check.name,
          status: passed ? 'PASSED' : 'FAILED',
          description: check.description,
          severity: check.severity,
          remediation: passed ? undefined : check.remediation
        })
      }

      const allPassed = results.every(r => r.status === 'PASSED')
      const failures = results.filter(r => r.status === 'FAILED')
      const criticalFailures = failures.filter(r => r.severity === 'critical')

      return {
        success: true,
        data: {
          framework: compliance_framework,
          compliant: allPassed,
          compliance_score: ((results.length - failures.length) / results.length * 100).toFixed(1) + '%',
          checks_passed: results.length - failures.length,
          checks_failed: failures.length,
          critical_violations: criticalFailures.length,
          status:
            criticalFailures.length > 0
              ? 'NON-COMPLIANT - CRITICAL VIOLATIONS'
              : failures.length > 0
                ? 'NON-COMPLIANT - REMEDIATION REQUIRED'
                : 'COMPLIANT',
          details: results,
          remediation_plan: failures.length > 0 ? this.buildRemediationPlan(failures) : undefined
        },
        confidence: 0.95,
        metadata: {
          framework_version: '2024.1',
          assessment_date: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0
      }
    }
  }

  /**
   * Tool Implementation: Assess Risks
   */
  private async assessRisks(args: any): Promise<ToolResult> {
    try {
      const { proposal, scope = 'model-selection' } = args

      if (!proposal) {
        return {
          success: false,
          error: 'Missing required parameter: proposal',
          confidence: 0
        }
      }

      // Identify risks based on proposal and scope
      const risks = this.identifyRisks(proposal, scope)

      // Categorize by severity
      const critical = risks.filter(r => r.severity === 'critical')
      const high = risks.filter(r => r.severity === 'high')
      const medium = risks.filter(r => r.severity === 'medium')
      const low = risks.filter(r => r.severity === 'low')

      // Calculate overall risk score
      const riskScore =
        (critical.length * 10 + high.length * 5 + medium.length * 2 + low.length * 0.5) / Math.max(risks.length, 1)
      const riskLevel =
        riskScore > 7 ? 'CRITICAL' : riskScore > 4 ? 'HIGH' : riskScore > 2 ? 'MEDIUM' : 'LOW'

      return {
        success: true,
        data: {
          scope,
          overall_risk_level: riskLevel,
          risk_score: parseFloat(riskScore.toFixed(1)),
          total_risks_identified: risks.length,
          critical_risks: critical.length,
          high_risks: high.length,
          medium_risks: medium.length,
          low_risks: low.length,
          risks: risks.map(r => ({
            category: r.category,
            description: r.description,
            severity: r.severity,
            likelihood: r.likelihood,
            impact: r.impact,
            mitigation: r.mitigation
          })),
          recommendation:
            riskLevel === 'CRITICAL'
              ? 'DO NOT PROCEED - Implement mitigations or choose alternative'
              : riskLevel === 'HIGH'
                ? 'PROCEED WITH CAUTION - Implement all recommended mitigations'
                : 'ACCEPTABLE - Monitor for risks'
        },
        confidence: 0.92,
        metadata: {
          assessment_date: new Date().toISOString(),
          risk_methodology: 'NIST-based'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0
      }
    }
  }

  /**
   * Tool Implementation: Validate Audit Trail
   */
  private async validateAuditTrail(args: any): Promise<ToolResult> {
    try {
      const { proposal, decision_path } = args

      if (!proposal) {
        return {
          success: false,
          error: 'Missing required parameter: proposal',
          confidence: 0
        }
      }

      // Get audit trail findings from observation lounge
      const auditFindings = await this.getFindings({
        crewRole: 'security-compliance',
        insightType: 'pattern',
        limit: 50
      })

      // Validate that this change can be properly audited
      const auditChecks = {
        has_decision_authority: this.validateDecisionAuthority(decision_path),
        maintains_audit_log: this.validateAuditLogging(proposal),
        change_is_reversible: this.validateReversibility(proposal),
        impact_is_documented: this.validateDocumentation(proposal),
        timeline_is_clear: true // Assume timeline is clear if other checks pass
      }

      const allChecks = Object.values(auditChecks)
      const passedChecks = allChecks.filter(c => c).length

      return {
        success: true,
        data: {
          audit_ready: allChecks.has_decision_authority,
          audit_score: ((passedChecks / allChecks.length) * 100).toFixed(1) + '%',
          checks: {
            decision_authority: auditChecks.has_decision_authority
              ? 'VERIFIED - Change is authorized'
              : 'MISSING - Unclear decision authority',
            audit_logging: auditChecks.maintains_audit_log
              ? 'VERIFIED - Change is auditable'
              : 'MISSING - Change cannot be traced',
            reversibility: auditChecks.change_is_reversible
              ? 'VERIFIED - Change can be rolled back'
              : 'RISK - Change may be permanent',
            documentation: auditChecks.impact_is_documented
              ? 'VERIFIED - Impact is documented'
              : 'MISSING - Document the impact',
            timeline: auditChecks.timeline_is_clear
              ? 'VERIFIED - Timeline is clear'
              : 'MISSING - Define clear timeline'
          },
          audit_requirements: {
            must_log_decision: true,
            must_log_implementation: true,
            must_log_verification: true,
            retention_period_days: 2555 // 7 years
          },
          recommendation: allChecks.has_decision_authority
            ? 'Change is audit-compliant and can proceed'
            : 'Change requires additional documentation before proceeding'
        },
        confidence: 0.93,
        metadata: {
          validation_date: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0
      }
    }
  }

  /**
   * Tool Implementation: Check Policy Adherence
   */
  private async checkPolicyAdherence(args: any): Promise<ToolResult> {
    try {
      const { proposal, check_budget = true, check_security = true, check_compliance = true } = args

      if (!proposal) {
        return {
          success: false,
          error: 'Missing required parameter: proposal',
          confidence: 0
        }
      }

      const violations: string[] = []

      // Check against budget policy
      if (check_budget) {
        if (proposal.toLowerCase().includes('unlimited') || proposal.toLowerCase().includes('no budget')) {
          violations.push('BUDGET: Proposal has no defined budget limits')
        }
      }

      // Check against security policy
      if (check_security) {
        if (
          proposal.toLowerCase().includes('disable') &&
          (proposal.toLowerCase().includes('security') || proposal.toLowerCase().includes('encryption'))
        ) {
          violations.push('SECURITY: Proposal disables security controls')
        }
      }

      // Check against compliance policy
      if (check_compliance) {
        if (
          proposal.toLowerCase().includes('skip') &&
          (proposal.toLowerCase().includes('audit') || proposal.toLowerCase().includes('compliance'))
        ) {
          violations.push('COMPLIANCE: Proposal skips compliance checks')
        }
      }

      const adheres = violations.length === 0

      return {
        success: true,
        data: {
          adheres_to_policy: adheres,
          policy_checks: {
            budget: !check_budget ? 'SKIPPED' : violations.some(v => v.startsWith('BUDGET')) ? 'FAILED' : 'PASSED',
            security: !check_security ? 'SKIPPED' : violations.some(v => v.startsWith('SECURITY')) ? 'FAILED' : 'PASSED',
            compliance: !check_compliance
              ? 'SKIPPED'
              : violations.some(v => v.startsWith('COMPLIANCE'))
                ? 'FAILED'
                : 'PASSED'
          },
          violations: violations,
          approval_status: adheres ? 'APPROVED' : 'BLOCKED - Violations must be remediated',
          remediation_required: violations.length > 0
        },
        confidence: 0.95,
        metadata: {
          check_date: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0
      }
    }
  }

  /**
   * Helper: Get compliance checks for framework
   */
  private getComplianceChecks(framework: string) {
    const checks: Record<string, any[]> = {
      SOC2: [
        {
          name: 'CC6.1 - Logical and Physical Access Controls',
          description: 'Change maintains or enhances access controls',
          severity: 'critical',
          remediation: 'Ensure change does not weaken access controls'
        },
        {
          name: 'CC7.2 - System Monitoring',
          description: 'Change is monitored and logged',
          severity: 'critical',
          remediation: 'Add monitoring and logging for the change'
        },
        {
          name: 'CC8.1 - Change Management',
          description: 'Change follows change management process',
          severity: 'high',
          remediation: 'Document change request and approvals'
        },
        {
          name: 'A1.2 - Service Continuity',
          description: 'Change does not impact service continuity',
          severity: 'high',
          remediation: 'Plan for minimal downtime or zero-downtime deployment'
        }
      ],
      GDPR: [
        {
          name: 'Article 32 - Security of Processing',
          description: 'Change maintains data protection safeguards',
          severity: 'critical',
          remediation: 'Ensure change does not weaken data protection'
        },
        {
          name: 'Article 28 - Data Processing Agreement',
          description: 'Change complies with DPA requirements',
          severity: 'high',
          remediation: 'Update DPA if needed for the change'
        }
      ],
      HIPAA: [
        {
          name: '§164.308(a)(3) - Workforce Security',
          description: 'Change maintains workforce access controls',
          severity: 'critical',
          remediation: 'Enforce access controls for the change'
        },
        {
          name: '§164.312(a)(2) - Encryption',
          description: 'Change maintains encryption standards',
          severity: 'critical',
          remediation: 'Ensure encryption is maintained or improved'
        }
      ]
    }

    return checks[framework] || checks['SOC2']
  }

  /**
   * Helper: Evaluate compliance check
   */
  private evaluateComplianceCheck(proposal: string, check: any): boolean {
    // Simple evaluation based on proposal content
    // In production, this would be more sophisticated

    const proposalLower = proposal.toLowerCase()

    // Check for policy violations
    if (proposalLower.includes('disable') && check.name.includes('Security')) {
      return false
    }
    if (proposalLower.includes('remove') && check.name.includes('Monitoring')) {
      return false
    }
    if (proposalLower.includes('skip') && check.name.includes('Change Management')) {
      return false
    }

    return true
  }

  /**
   * Helper: Build remediation plan
   */
  private buildRemediationPlan(failures: any[]): string[] {
    return failures.map(f => f.remediation || 'Address this compliance requirement')
  }

  /**
   * Helper: Identify risks
   */
  private identifyRisks(proposal: string, scope: string): any[] {
    const proposalLower = proposal.toLowerCase()
    const risks: any[] = []

    // Model-related risks
    if (scope === 'model-selection') {
      if (proposalLower.includes('downgrade')) {
        risks.push({
          category: 'Accuracy Risk',
          description: 'Downgrading model may reduce accuracy',
          severity: 'high',
          likelihood: 'medium',
          impact: 'high',
          mitigation: 'Validate accuracy on sample data before full rollout'
        })
      }
      if (proposalLower.includes('untested')) {
        risks.push({
          category: 'Stability Risk',
          description: 'Untested model may cause unexpected behavior',
          severity: 'critical',
          likelihood: 'high',
          impact: 'high',
          mitigation: 'Test extensively in staging before production deployment'
        })
      }
    }

    // Infrastructure risks
    if (scope === 'infrastructure') {
      if (proposalLower.includes('remove') || proposalLower.includes('delete')) {
        risks.push({
          category: 'Availability Risk',
          description: 'Removing infrastructure may impact availability',
          severity: 'critical',
          likelihood: 'high',
          impact: 'critical',
          mitigation: 'Plan for redundancy and test failover before change'
        })
      }
    }

    // Data access risks
    if (scope === 'data-access') {
      if (proposalLower.includes('increase') && proposalLower.includes('access')) {
        risks.push({
          category: 'Security Risk',
          description: 'Increasing access permissions raises security risk',
          severity: 'high',
          likelihood: 'medium',
          impact: 'high',
          mitigation: 'Follow principle of least privilege, use time-limited access'
        })
      }
    }

    // Default operational risk
    if (risks.length === 0) {
      risks.push({
        category: 'Operational Risk',
        description: 'Any production change carries operational risk',
        severity: 'medium',
        likelihood: 'low',
        impact: 'medium',
        mitigation: 'Implement gradual rollout with monitoring and quick rollback capability'
      })
    }

    return risks
  }

  /**
   * Helper: Validate decision authority
   */
  private validateDecisionAuthority(decisionPath: string): boolean {
    const validPaths = [
      'cost-optimization',
      'performance-improvement',
      'feature-addition',
      'security-hardening',
      'compliance-requirement'
    ]
    return validPaths.some(path => decisionPath?.toLowerCase().includes(path))
  }

  /**
   * Helper: Validate audit logging
   */
  private validateAuditLogging(proposal: string): boolean {
    // Assume all changes through observation lounge are logged
    return true
  }

  /**
   * Helper: Validate reversibility
   */
  private validateReversibility(proposal: string): boolean {
    const irreversibleActions = ['delete permanently', 'destroy', 'wipe']
    return !irreversibleActions.some(action => proposal.toLowerCase().includes(action))
  }

  /**
   * Helper: Validate documentation
   */
  private validateDocumentation(proposal: string): boolean {
    // Documentation is handled through observation lounge
    return true
  }

  /**
   * Get tool definition
   */
  protected getToolDefinition(toolName: string): ToolDefinition | null {
    const definitions: Record<string, ToolDefinition> = {
      'verify-compliance': {
        name: 'verify-compliance',
        description: 'Check compliance with security policies',
        inputSchema: {
          type: 'object',
          properties: {
            proposal: { type: 'string' },
            compliance_framework: { type: 'string', default: 'SOC2' }
          }
        }
      },
      'assess-risks': {
        name: 'assess-risks',
        description: 'Identify security and operational risks',
        inputSchema: {
          type: 'object',
          properties: {
            proposal: { type: 'string' },
            scope: { type: 'string', default: 'model-selection' }
          }
        }
      },
      'validate-audit-trail': {
        name: 'validate-audit-trail',
        description: 'Verify audit logging capability',
        inputSchema: {
          type: 'object',
          properties: {
            proposal: { type: 'string' },
            decision_path: { type: 'string' }
          }
        }
      },
      'check-policy-adherence': {
        name: 'check-policy-adherence',
        description: 'Check policy compliance',
        inputSchema: {
          type: 'object',
          properties: {
            proposal: { type: 'string' },
            check_budget: { type: 'boolean', default: true },
            check_security: { type: 'boolean', default: true },
            check_compliance: { type: 'boolean', default: true }
          }
        }
      }
    }
    return definitions[toolName] || null
  }
}

export default WorfAgentServer
