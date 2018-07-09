"""

"""

from aiohttp.web import middleware

@middleware
async def with_global_memory_store(request, handler):
	request['http_store'] = request.app['http_store']
	return await handler(request)
