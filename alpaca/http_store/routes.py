"""

"""

from uuid import uuid4
from aiohttp.web import view
from .views import (
	StoreView, NamespaceView, EntryView,
)


__all__ = [
	'routes',
]


routes = [
	view('/', StoreView, name='store-store'),
	view('/{namespace}/', NamespaceView, name='store-namespace'),
	view('/{namespace}/{entry}', EntryView, name='store-entry'),
]
