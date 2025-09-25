#!/usr/bin/env python3
"""
Defense Industry API Implementation
==================================

This module provides API endpoint implementations for defense industry compliance.
"""

import os
import sys

from flask import Flask, request, jsonify

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.security.dfars_compliance_engine import DFARSComplianceEngine
from src.security.dfars_access_control import DFARSAccessControl
from src.security.audit_trail_manager import AuditTrailManager
from analyzer.enterprise.nasa_pot10_analyzer import NASAPOT10Analyzer

app = Flask(__name__)

# Initialize security components
dfars_engine = DFARSComplianceEngine()
access_control = DFARSAccessControl()
audit_manager = AuditTrailManager()
nasa_analyzer = NASAPOT10Analyzer()

@app.route('/api/dfars/compliance', methods=['GET', 'POST'])
def dfars_compliance():
    """DFARS compliance validation endpoint."""
    if request.method == 'GET':
        # Get compliance status
        status = dfars_engine.get_compliance_status()
        return jsonify(status)
    elif request.method == 'POST':
        # Run compliance validation
        results = dfars_engine.validate_compliance()
        return jsonify(results)

@app.route('/api/security/access', methods=['GET', 'POST', 'PUT', 'DELETE'])
def security_access():
    """Access control management endpoint."""
    if request.method == 'GET':
        # Get access control status
        status = access_control.get_access_status()
        return jsonify(status)
    elif request.method == 'POST':
        # Create access control rule
        rule_data = request.json
        result = access_control.create_rule(rule_data)
        return jsonify(result)
    elif request.method == 'PUT':
        # Update access control rule
        rule_data = request.json
        result = access_control.update_rule(rule_data)
        return jsonify(result)
    elif request.method == 'DELETE':
        # Delete access control rule
        rule_id = request.args.get('rule_id')
        result = access_control.delete_rule(rule_id)
        return jsonify(result)

@app.route('/api/audit/trail', methods=['GET', 'POST'])
def audit_trail():
    """Audit trail management endpoint."""
    if request.method == 'GET':
        # Get audit trail
        trail = audit_manager.get_audit_trail()
        return jsonify(trail)
    elif request.method == 'POST':
        # Add audit entry
        entry_data = request.json
        result = audit_manager.add_entry(entry_data)
        return jsonify(result)

@app.route('/api/nasa/pot10/analyze', methods=['POST'])
def nasa_pot10_analyze():
    """NASA POT10 quality analysis endpoint."""
    analysis_request = request.json
    results = nasa_analyzer.analyze(analysis_request)
    return jsonify(results)

@app.route('/api/defense/certification', methods=['GET'])
def defense_certification():
    """Defense certification status endpoint."""
    from analyzer.enterprise.defense_certification_tool import DefenseCertificationTool

    cert_tool = DefenseCertificationTool()
    status = cert_tool.get_certification_status()
    return jsonify(status)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'defense_ready': True
    })

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=8000)
