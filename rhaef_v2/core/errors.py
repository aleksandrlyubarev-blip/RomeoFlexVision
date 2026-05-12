from enum import Enum


class ErrorCode(str, Enum):
    EMPTY_MESSAGES = "EMPTY_MESSAGES"
    MODEL_ROUTING_FAILED = "MODEL_ROUTING_FAILED"
    RUN_NOT_FOUND = "RUN_NOT_FOUND"
