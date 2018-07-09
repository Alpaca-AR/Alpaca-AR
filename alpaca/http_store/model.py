"""

"""

from uuid import uuid4
from collections import defaultdict
from asyncio import Queue


__all__ = [
	'Subscription', 'Store', 'Namespace', 'Entry',
]


class Subscription(object):
	def __init__(self):
		self._count = 0
		self._queue = Queue()
	
	async def __aenter__(self):
		self._count += 1
		return self
	
	async def __aexit__(self, ext_type, exc, tb):
		self._count -= 1
	
	def __aiter__(self):
		return self
	
	async def __anext__(self):
		return await self._queue.get()
	
	async def notify(self, value):
		if self._count > 0:
			await self._queue.put(value)


class Store(object):
	def __init__(self):
		self._namespaces = defaultdict(Namespace)
	
	def __getitem__(self, namespace):
		return self._namespaces[namespace]
	
	@property
	def namespaces(self):
		return list(self._namespaces.keys())


class Namespace(object):
	def __init__(self):
		self._entries = defaultdict(Entry.missing)
		self._subscriptions = defaultdict(Subscription)
		self['index.json'] = Entry.missing()
	
	def __setitem__(self, name, value):
		self._entries[name] = value
	
	def __getitem__(self, name):
		return self._entries[name]
	
	def subscribe(self, name):
		subscription = self._subscriptions[name]
		return subscription
	
	async def notify(self, name, value):
		subscription = self._subscriptions[name]
		await subscription.notify(value)

	@property
	def entries(self):
		return list(self._entries.keys())


class Entry(object):
	_cache = {}
	
	def __init__(self, status, content_type, body, etag):
		self.status = status
		self.content_type = content_type
		self.body = body
		self.etag = etag
		self.subscribers = []
	
	@classmethod
	def missing(cls):
		return cls(
			status=404,
			content_type='text/plain',
			body=b'Not found',
			etag='404',
		)
	
	@classmethod
	async def from_request(cls, request):
		content_type = request.headers['Content-Type']
		body = await request.read()
		key = (content_type, body)
		if key in Entry._cache:
			return Entry._cache[key]
		
		entry = cls(
			status=200,
			content_type=content_type,
			body=body,
			etag=str(uuid4()),
		)
		Entry._cache[key] = entry
		return entry
	
	def to_response(self, response_cls):
		return response_cls(
			body=self.body,
			status=self.status,
			content_type=self.content_type,
			headers={
				'ETag': self.etag,
				'Cache-Control': 'no-cache',
			},
		)

