# NASA POT10 Compliance Configuration Documentation

## Configuration Field Descriptions

### Violation Weights
- **critical_weight** (5.0): Critical violations (security, crashes) have 5x impact on compliance score
- **high_weight** (3.0): High violations (god objects, major coupling) have 3x impact
- **medium_weight** (1.0): Medium violations (magic literals, minor coupling) have 1x impact
- **low_weight** (0.5): Low violations (style issues) have 0.5x impact

### Compliance Thresholds
- **excellent_threshold** (0.95): 95%+ compliance score for "Excellent" rating
- **good_threshold** (0.90): 90%+ compliance score for "Good" rating
- **acceptable_threshold** (0.80): 80%+ compliance score for "Acceptable" rating
- Below 80%: "Needs Improvement" rating

### Maximum Violation Limits
Hard limits that override score calculation:
- **max_critical_violations** (0): No critical violations allowed
- **max_high_violations** (3): Maximum of 3 high severity violations
- **max_total_violations** (20): Maximum of 20 total violations

### Bonus Points
Bonus points for good practices:
- **test_coverage_bonus** (0.05): Up to 5% bonus for >95% test coverage
- **documentation_bonus** (0.03): Up to 3% bonus for good documentation

## Scoring Algorithm

1. Violations are counted by severity level
2. Weighted score is calculated using the weight multipliers
3. Base score starts at 100% and decreases based on violation density
4. Hard limits can cap the score at 70% if exceeded
5. Bonus points are added for test coverage and documentation
6. Final score determines compliance level and gate pass/fail status