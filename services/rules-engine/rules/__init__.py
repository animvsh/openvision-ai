"""
Rules module - exports all rule sets.
"""

from rules.classroom_rules import CLASSROOM_RULES
from rules.exam_rules import EXAM_RULES
from rules.security_rules import SECURITY_RULES

__all__ = ['CLASSROOM_RULES', 'EXAM_RULES', 'SECURITY_RULES']