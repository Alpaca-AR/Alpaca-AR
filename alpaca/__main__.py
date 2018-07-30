"""

"""

from pathlib import Path
from . import alpaca
from aiohttp.web import Application, run_app, Response


def main(host, port):
	app = alpaca

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
