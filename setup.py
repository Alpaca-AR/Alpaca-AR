#!/usr/bin/env python3.6

from distutils.core import setup
from pathlib import Path

setup(
	name='alpaca',
	version='1.0',
	description='Alpaca',
	author='Tanner Hobson',
	author_email='thobson2@vols.utk.edu',
	packages=[
		'alpaca',
	],
	install_requires=[
		'aiohttp',
	],
	package_data={
		'alpaca': [
			'http_store/html/index.html',
		],
	},
	entry_points={
		'console_scripts': [
			'alpaca-http-store=alpaca.http_store.__main__:cli',
			'alpaca=alpaca.__main__:cli',
		],
	},
)
