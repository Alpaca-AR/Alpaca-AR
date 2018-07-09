"""

"""

from pathlib import Path
from . import alpaca
from aiohttp.web import Application, run_app, Response

try:
	from aiohttp_cors import setup, ResourceOptions
except ImportError:
	HAS_CORS = False
else:
	HAS_CORS = True


def main(host, port):
	app = alpaca
	
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
