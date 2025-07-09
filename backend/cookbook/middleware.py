import logging

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        logger.info(f"API REQUEST: {request.method} {request.path} - BODY: {getattr(request, 'body', b'').decode(errors='ignore')}")
        response = self.get_response(request)
        return response
