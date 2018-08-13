"""

"""

from pathlib import Path
from time import time
from aiohttp.web import (
	Application, RouteTableDef, Response, json_response,
)
from .http_store import http_store
from .cors import cors_factory


__all__ = [
	'alpaca',
]



routes = RouteTableDef()


@routes.get('/')
async def index(request):
	path = Path(__file__).with_name('html') / 'index.html'
	
	return Response(
		content_type='text/html',
		text=path.read_text(),
	)


@routes.post('/timesync')
async def timesync(request):
	body = await request.json()
	id = body['id']
	now = time() * 1000.0
	return json_response({
		'jsonrpc': '2.0',
		'id': id,
		'result': now,
	})


routes.static('/js', str(Path(__file__).with_name('html') / 'js'))
routes.static('/img', str(Path(__file__).with_name('html') / 'img'))
routes.static('/d', str(Path(__file__).with_name('html') / 'd'))
routes.static('/m', str(Path(__file__).with_name('html') / 'm'))


alpaca = Application(
	middlewares=[cors_factory],
	client_max_size=10*1024*1024,
)


alpaca.router.add_routes(routes)
alpaca.add_subapp('/store', http_store)
