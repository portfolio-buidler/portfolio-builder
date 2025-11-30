# structured logging configuration
import logging
import sys
from typing import Optional


def setup_logging(level: str = "INFO") -> None:
    """
    Configure application-wide logging with structured output.
    
    Sets up:
    - Root logger for general application logs
    - Security logger for file validation audit trail
    """
    log_level = getattr(logging, level.upper(), logging.INFO)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers to avoid duplicates
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Console handler with structured format
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # Configure security logger with dedicated formatting
    setup_security_logger()


def setup_security_logger(log_file: Optional[str] = None) -> logging.Logger:
    """
    Configure the security logger for file validation audit trail.
    
    This logger records:
    - All rejected file uploads with reasons
    - Accepted file uploads for audit purposes
    - Security-relevant events (double extension attacks, macro detection, etc.)
    
    Args:
        log_file: Optional file path for security logs. If None, logs to console only.
    
    Returns:
        Configured security logger instance.
    """
    security_logger = logging.getLogger("security.file_validation")
    security_logger.setLevel(logging.INFO)
    
    # Prevent propagation to avoid duplicate logs if root is also logging
    security_logger.propagate = False
    
    # Remove existing handlers to avoid duplicates on reconfiguration
    for handler in security_logger.handlers[:]:
        security_logger.removeHandler(handler)
    
    # Security-specific formatter with more detail
    security_formatter = logging.Formatter(
        "%(asctime)s - SECURITY - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    
    # Console handler for security logs
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(security_formatter)
    security_logger.addHandler(console_handler)
    
    # Optional file handler for persistent security audit trail
    if log_file:
        try:
            file_handler = logging.FileHandler(log_file, encoding="utf-8")
            file_handler.setLevel(logging.INFO)
            file_handler.setFormatter(security_formatter)
            security_logger.addHandler(file_handler)
        except (OSError, IOError) as e:
            security_logger.warning(f"Could not create security log file: {e}")
    
    return security_logger


def get_security_logger() -> logging.Logger:
    """
    Get the security logger instance.
    Creates and configures it if not already set up.
    """
    logger = logging.getLogger("security.file_validation")
    if not logger.handlers:
        setup_security_logger()
    return logger
