"""

"""

from .model import Subscription, Store, Namespace, Entry
from .routes import routes
from .middlewares import with_global_memory_store
from aiohttp.web import Application


__all__ = [
	'with_global_memory_store', 'http_store',
]


http_store = Application(
	middlewares=[
		with_global_memory_store,
	],
)


http_store['http_store'] = Store()
http_store.router.add_routes(routes)
