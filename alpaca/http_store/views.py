"""

"""

from aiohttp.web import View, json_response, WebSocketResponse, Response
from uuid import uuid4
from .model import Entry


__all__ = [
	'StoreView', 'NamespaceView', 'EntryView',
]


class StoreMixin(object):
	@property
	def store(self):
		return self.request['http_store']


class NamespaceMixin(object):
	@property
	def namespace_key(self):
		return self.request.match_info['namespace']

	@property
	def namespace(self):
		return self.store[self.namespace_key]


class EntryMixin(object):
	@property
	def entry_key(self):
		return self.request.match_info['entry']

	@property
	def entry(self):
		return self.namespace[self.entry_key]
	
	@entry.setter
	def entry(self, value):
		self.namespace[self.entry_key] = value
		return value


class StoreView(View, StoreMixin):
	async def get(self):
		namespaces = self.store.namespaces
		
		return json_response({
			'status': 'success',
			'data': {
				'namespaces': namespaces,
			},
		})


class NamespaceView(View, StoreMixin, NamespaceMixin):
	async def get(self):
		print('get namespace')
		entries = self.namespace.entries
		
		return json_response({
			'status': 'success',
			'data': {
				'entries': entries,
			},
		})

	async def post(self):
		extension = self.request.query.get('extension', None)
		entry = str(uuid4())
		if extension is not None:
			entry = f'{entry}.{extension}'
		
		self.namespace[entry] = await Entry.from_request(self.request)
		
		kwargs = {}
		kwargs['namespace'] = self.namespace_key
		kwargs['entry'] = entry
		
		url = self.request.app.router['store-entry'].url_for(**kwargs)
		
		return json_response({
			'status': 'success',
			'data': {
				'url': str(url),
			},
		})


class EntryView(View, StoreMixin, NamespaceMixin, EntryMixin):
	@property
	def etag(self):
		return self.request.headers.get('If-None-Match', None)
	
	async def get(self):
		ws = WebSocketResponse()
		if ws.can_prepare(self.request):
			await self.websocket(ws)
			return
		
		if self.entry.etag == self.etag:
			return Response(status=304)
		
		return self.entry.to_response(Response)

	async def websocket(self, ws):
		await ws.prepare(self.request)
		async with self.namespace.subscribe(self.entry_key) as subscription:
			async for entry in subscription:
				if ws.closed:
					break
				
				try:
					text = entry.body.decode('utf-8')
				except UnicodeError:
					await ws.send_bytes(entry.body)
				else:
					await ws.send_str(text)

	async def put(self):
		if self.entry is None:
			raise ValueError('Entry does not already exist')
		
		self.entry = await Entry.from_request(self.request)
		
		# need to retrieve entry again from store if it updated
		await self.namespace.notify(self.entry_key, self.entry)
		
		kwargs = {}
		kwargs['namespace'] = self.namespace_key
		kwargs['entry'] = self.entry_key
		
		url = self.request.app.router['store-entry'].url_for(**kwargs)
		
		return json_response({
			'status': 'success',
			'data': {
				'url': str(url),
			},
		})
