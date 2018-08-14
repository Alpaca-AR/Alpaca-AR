#!/usr/bin/env python3.7
"""

"""

from time import time
from datetime import datetime
from asyncio import (
	sleep, get_event_loop, create_subprocess_exec, Event,
	ensure_future,
)
from subprocess import PIPE
from aiohttp import ClientSession
from psutil import Process


class SynchronizedTime(object):
	def __init__(self, offset):
		self.offset = offset
	
	def now(self):
		"""Current time in milliseconds"""
		return time() * 1000.0 + self.offset
	
	@classmethod
	async def sync(cls, session, url):
		start = time() * 1000.0 # local system time
		json = {'jsonrpc': '2.0', 'id': '1337', 'method': 'timesync'}
		async with session.post(url, json=json) as resp:
			data = await resp.json()
			result = data['result']
			
			end = time() * 1000.0  # local system time
			roundtrip = end - start
			offset = result - end + roundtrip / 2.0
			
			return cls(offset)


class ProcessWatch(object):
	def __init__(self, name, psprocess):
		self.name = name
		self.psprocess = psprocess
	
	@classmethod
	def create(cls, name, pid):
		psprocess = Process(pid=pid)
		return cls(name, psprocess)
	
	def get_stats(self):
		process = self.psprocess
			
		stats = {}
		stats['from'] = self.name
		
		data = process.as_dict(attrs=['memory_info', 'io_counters', 'cpu_percent'])
		cpu_usage = data['cpu_percent']
		mem_usage = data['memory_info'].rss / 1024 / 1024 # B -> MB
		
		stats['cpu'] = cpu_usage
		stats['mem'] = mem_usage
		
		return stats


class DockerWatch(object):
	def __init__(self, name, event, process):
		self.name = name
		self._event = event
		self._process = process
		self._future = None
		self._stats = None
	
	@classmethod
	async def create(cls, name, container_id):
		process = await create_subprocess_exec(
			'stdbuf', '-o0', 'docker', 'stats', '--format', '{{.CPUPerc}};{{.MemUsage}};{{.NetIO}}', container_id,
			stdout=PIPE, limit=256,
		)
		event = Event()
		self = cls(name, event, process)
		future = ensure_future(self._run())
		self._future = future
		
		return self
	
	async def _run(self):
		def to_bytes(s):
			n = None
			suffix = None
			for i in range(len(s)):
				try:
					n = float(s[:i+1])
				except ValueError:
					if suffix is None:
						suffix = s[i:].rstrip()
					break
			
			lookup = {
				b'B': 1,
				b'kB': 1000,
				b'MB': 1000 * 1000,
				b'KiB': 1024 * 1024,
				b'MiB': 1024 * 1024,
			}
			return n * lookup[suffix] / 1024 / 1024  # B -> MB

		await self._process.stdout.readline()  # header
		CPU_PERC = 0
		MEM_PERC = 1
		NET_IO = 2
		last_read = None
		last_write = None
		while not self._event.is_set():
			line = await self._process.stdout.readline()
			try:
				line = line[7:]
				row = line.split(b';')
				cpu = float(row[CPU_PERC][:-1])
				mem = row[MEM_PERC][:-1].split(b' / ')
				res = to_bytes(mem[0])
				net_io = row[NET_IO].split(b' / ')
				read_bytes = to_bytes(net_io[0])
				write_bytes = to_bytes(net_io[1])
				
				if last_read is None:
					last_read = read_bytes
					last_write = write_bytes
					continue
			
				self._stats = {
					'from': self.name,
					'cpu': cpu,
					'mem': res,
					'net_read': read_bytes - last_read,
					'net_write': write_bytes - last_write,
				}
				
				last_read = read_bytes
				last_write = write_bytes
			except Exception as e:
				print(e)
	
	def get_stats(self):
		return self._stats


async def main(host, process, docker):
	watchers = []
	for name, pid in process:
		watchers.append(ProcessWatch.create(name, pid))
	for name, id in docker:
		watchers.append(await DockerWatch.create(name, id))

	async with ClientSession() as session:
		url = 'http://{host}/timesync'.format(host=host)
		synchronized = await SynchronizedTime.sync(session, url)
		
		while True:
			await sleep(1.0)
			now = synchronized.now()
			
			for watch in watchers:
				stats = watch.get_stats()
				if stats is None:
					continue
				
				stats['now'] = now
				
				print(repr(stats))
				
				async with session.post('http://{host}/store/log/'.format(host=host), headers={'Content-Type': 'application/json'}, json=stats) as resp:
					await resp.read()


def name_pid_pair(s):
	name, pid = s.split(':')
	pid = int(pid)
	return (name, pid)


def name_id_pair(s):
	name, id = s.split(':')
	return (name, id)


def cli():
	import argparse
	
	parser = argparse.ArgumentParser()
	parser.add_argument('--host', default='accona.eecs.utk.edu:8800')
	parser.add_argument('--docker', nargs='+', type=name_id_pair, default=[])
	parser.add_argument('--process', nargs='+', type=name_pid_pair, default=[])
	args = parser.parse_args()
	
	loop = get_event_loop()
	loop.run_until_complete(main(**vars(args)))
	loop.close()


if __name__ == '__main__':
	cli()
