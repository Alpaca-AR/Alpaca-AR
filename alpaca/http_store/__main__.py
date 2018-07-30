"""

"""

from pathlib import Path
from . import http_store
from aiohttp.web import Application, run_app, Response


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
