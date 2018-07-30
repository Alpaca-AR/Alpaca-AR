"""

"""

from aiohttp.web import Response


__all__ = [
	'cors_factory',
]


ALLOWED_HEADERS = ','.join((
	'content-type',
	'accept',
	'origin',
	'authorization',
	'x-requested-with',
	'x-csrftoken',
))


ALLOWED_METHODS = ','.join((
	'GET',
	'POST',
	'PUT',
	'OPTIONS',
))


def set_cors_headers(request, response):
	response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
	response.headers['Access-Control-Allow-Methods'] = ALLOWED_METHODS
	response.headers['Access-Control-Allow-Headers'] = ALLOWED_HEADERS
	response.headers['Access-Control-Allow-Credentials'] = 'true'
	return response


async def cors_factory(app, handler):
	async def cors_handler(request):
		if request.method == 'OPTIONS':
			return set_cors_headers(request, Response())
		
		response = await handler(request)
		return set_cors_headers(request, response)
	
	return cors_handler
