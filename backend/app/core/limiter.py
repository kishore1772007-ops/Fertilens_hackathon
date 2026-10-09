from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

def get_ip_and_email_key(request: Request) -> str:
    """
    Key generator combining client IP and payload email if available.
    """
    ip = get_remote_address(request) or "127.0.0.1"
    return f"{ip}"

limiter = Limiter(key_func=get_ip_and_email_key)
