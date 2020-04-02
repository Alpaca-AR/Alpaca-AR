#!/usr/bin/env python3.7

from distutils.core import setup
from pathlib import Path

setup(
	name='alpaca',
	version='0.7.0',
	description=(
		'Alpaca is a framework to simplify the creation of Augmented '
		'Reality extensions for web applications, without modifying the '
		'original web applications'
	),
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
			'html/js/object-store.js'
		],
	},
	entry_points={
		'console_scripts': [
			'alpaca-http-store=alpaca.http_store.__main__:cli',
			'alpaca=alpaca.__main__:cli',
		],
	},
)
