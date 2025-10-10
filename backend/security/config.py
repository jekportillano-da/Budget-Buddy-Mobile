"""
Security Configuration for Budget Buddy
Centralized security settings and monitoring
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class SecurityConfig:
    """Security configuration and monitoring"""
    
    # Rate limiting settings
    RATE_LIMITS = {
        'ai_chat': {
            'requests_per_minute': 10,
            'requests_per_hour': 100,
            'requests_per_day': 500
        },
        'ai_insights': {
            'requests_per_hour': 20,
            'requests_per_day': 100
        }
    }
    
    # Security monitoring
    SECURITY_ALERTS = {
        'prompt_injection_attempts': 5,  # Alert after 5 attempts
        'rate_limit_violations': 10,     # Alert after 10 violations
        'suspicious_patterns': 3         # Alert after 3 suspicious patterns
    }
    
    # Allowed financial topics (whitelist approach)
    FINANCIAL_TOPICS = [
        'budget', 'budgeting', 'savings', 'expenses', 'income',
        'bills', 'debt', 'loan', 'investment', 'insurance',
        'retirement', 'emergency fund', 'financial planning',
        'money management', 'cost cutting', 'inflation',
        'philippine economy', 'peso', 'ofw', 'remittance'
    ]

class SecurityMonitor:
    """Monitor and track security events"""
    
    @staticmethod
    def log_security_event(
        event_type: str,
        user_id: int,
        details: Dict,
        db: Session
    ):
        """Log security events for monitoring"""
        
        # Log to application logs
        logger.warning(f"Security Event: {event_type}", {
            'user_id': user_id,
            'event_type': event_type,
            'details': details,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Store in database for analysis
        from database import SecurityEvent
        
        try:
            security_event = SecurityEvent(
                user_id=user_id,
                event_type=event_type,
                details=details,
                timestamp=datetime.utcnow()
            )
            db.add(security_event)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to store security event: {e}")
    
    @staticmethod
    def check_user_security_status(user_id: int, db: Session) -> Dict:
        """Check user's recent security events"""
        
        # Check for recent injection attempts
        recent_time = datetime.utcnow() - timedelta(hours=24)
        
        from database import SecurityEvent
        
        recent_events = db.query(SecurityEvent).filter(
            SecurityEvent.user_id == user_id,
            SecurityEvent.timestamp >= recent_time
        ).all()
        
        injection_attempts = sum(1 for event in recent_events 
                               if event.event_type == 'prompt_injection_attempt')
        
        return {
            'total_events': len(recent_events),
            'injection_attempts': injection_attempts,
            'is_suspicious': injection_attempts >= 3,
            'last_event': recent_events[-1].timestamp if recent_events else None
        }

class InputValidator:
    """Validate user inputs for security"""
    
    @staticmethod
    def is_financial_related(text: str) -> bool:
        """Check if text is related to financial topics"""
        text_lower = text.lower()
        
        return any(topic in text_lower for topic in SecurityConfig.FINANCIAL_TOPICS)
    
    @staticmethod
    def validate_message_content(message: str) -> Dict:
        """Comprehensive message validation"""
        
        issues = []
        is_valid = True
        
        # Check length
        if len(message) > 500:
            issues.append("Message too long")
            is_valid = False
        
        # Check for financial relevance
        if not InputValidator.is_financial_related(message):
            issues.append("Message not financial-related")
            # Don't mark invalid, just warn
        
        # Check character encoding
        try:
            message.encode('utf-8')
        except UnicodeEncodeError:
            issues.append("Invalid character encoding")
            is_valid = False
        
        return {
            'is_valid': is_valid,
            'issues': issues,
            'is_financial': InputValidator.is_financial_related(message)
        }