"""

"""

from pathlib import Path
from aiohttp.web import Application, RouteTableDef, Response
from .http_store import http_store


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

routes.static('/js', str(Path(__file__).with_name('html') / 'js'))

@routes.get('/m/')
async def mobile(request):
	path = Path(__file__).with_name('html') / 'mobile.html'
	
	return Response(
		content_type='text/html',
		text=path.read_text(),
	)


alpaca = Application()


alpaca.router.add_routes(routes)
alpaca.add_subapp('/store', http_store)
