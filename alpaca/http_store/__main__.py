"""

"""

from pathlib import Path
from . import http_store
from aiohttp.web import Application, run_app, Response

try:
	from aiohttp_cors import setup, ResourceOptions
except ImportError:
	HAS_CORS = False
else:
	HAS_CORS = True


index_path = Path(__file__).with_name('html') / 'index.html'


async def index(request):
	with open(index_path, 'r') as f:
		text = f.read()
	
	return Response(
		content_type='text/html',
		text=text,
	)


def main(host, port):
	app = Application(debug=True)
	app.add_subapp('/store', http_store)
	app.router.add_get('/', index)
	
	if HAS_CORS:
		cors = setup(app, defaults={
			"*": ResourceOptions(
				allow_credentials=False,
				expose_headers="*",
				allow_headers=('Content-Type',),
			),
		})
		
		for route in list(app.router.routes()):
			cors.add(route)

	run_app(app, host=host, port=port)


def cli():
	import argparse
	
	parser = argparse.ArgumentParser()
	parser.add_argument('--host', default='0.0.0.0')
	parser.add_argument('--port', default=80, type=int)
	args = parser.parse_args()
	
	main(**vars(args))


if __name__ == '__main__':
	cli()
