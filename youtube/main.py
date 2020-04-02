# -*- coding: utf-8 -*-
#!/usr/bin/env python3.7
"""

"""

import os
import dbm.gnu
import json
from time import sleep
from functools import wraps
from threading import Lock

import flask
from flask_cors import CORS
import requests

import google.oauth2.credentials
import google.auth.exceptions
import google_auth_oauthlib.flow
import googleapiclient.discovery

# The CLIENT_SECRETS_FILE variable specifies the name of a file that contains
# the OAuth 2.0 information for this application, including its client_id and
# client_secret.
CLIENT_SECRETS_FILE = "client_secret.json"

# Wildly insecure lmao
DEVELOPER_KEY = 'AIzaSyCJttgu7eIACgLpGEGjxMH-QonE-GFAQLY'

# This OAuth 2.0 access scope allows for full read/write access to the
# authenticated user's account and requires requests to use an SSL connection.
SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
API_SERVICE_NAME = 'youtube'
API_VERSION = 'v3'

app = flask.Flask(__name__)
# Note: A secret key is included in the sample so that it works, but if you
# use this code in your application please replace this with a truly secret
# key. See http://flask.pocoo.org/docs/0.12/quickstart/#sessions.
app.secret_key = 'REPLACE ME - this value is here as a placeholder.'
CORS(app, supports_credentials=True)


related_db = dbm.gnu.open('data/related.dbm', 'cs')
related_lock = Lock()
details_db = dbm.gnu.open('data/details.dbm', 'cs')
details_lock = Lock()
thumbnail_db = dbm.gnu.open('data/thumbnail.dbm', 'cs')
thumbnail_lock = Lock()


def keep_alive(func):
	@wraps(func)
	def inner_func(*args, **kwargs):
		response = func(*args, **kwargs)
		response.headers['Connection'] = 'Keep-Alive'
		return response
	return inner_func


def cached(func):
	@wraps(func)
	def inner_func(*args, **kwargs):
		response = func(*args, **kwargs)
		response.headers['Cache-Control'] = 'public, max-age=31536000'
		return response
	return inner_func


def get_client(the_right_way=False):
    if the_right_way:
        if 'credentials' not in flask.session:
            return (False, flask.redirect('authorize'))

        credentials = google.oauth2.credentials.Credentials(
            **flask.session['credentials'])
      
        client = googleapiclient.discovery.build(
            API_SERVICE_NAME, API_VERSION, credentials=credentials)
    
        return (True, client)

    else:
        client = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, developerKey=DEVELOPER_KEY)
    
        return (True, client)
  


@app.route('/')
@keep_alive
def index():
  try:
    ok, client = get_client()
    if not ok:
      return client
    
    response = client.videos().list(
      id='Xda2BeH84-I',
      part='snippet',
    ).execute()
  
    return flask.jsonify(detail=response)
  except google.auth.exceptions.RefreshError:
    flask.session.clear()
    return flask.redirect(flask.url_for('index'))


@app.route('/related/<id>')
@keep_alive
@cached
def related(id):
  ok, client = get_client()
  if not ok:
    return client
  
  with related_lock:
    return search_list_related_videos(
      id=id,
      part='snippet',
      maxResults=50,
      type='video')


@app.route('/details/<id>')
@keep_alive
@cached
def details(id):
  ok, client = get_client()
  if not ok:
    return client
  
  with details_lock:
    return search_video_details(
      id=id,
      part='snippet')


@app.route('/thumbnail/<version>/<id>/<name>')
@keep_alive
@cached
def thumbnail(version, id, name):
  with thumbnail_lock:
    key = f'{version}/{id}/{name}'
    try:
      data = thumbnail_db[key]
    except KeyError:
      print(f'Cache miss {key!r}')
      with requests.get(f'https://i.ytimg.com/{version}/{id}/{name}') as r:
        data = r.content
        thumbnail_db[key] = data
    else:
      print(f'Cache hit {key!r}')
    
    response = flask.make_response(data)
    response.headers.set('Content-Type', 'image/jpeg')
    return response


@app.route('/authorize')
def authorize():
  # Create a flow instance to manage the OAuth 2.0 Authorization Grant Flow
  # steps.
  flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
      CLIENT_SECRETS_FILE, scopes=SCOPES)
  flow.redirect_uri = flask.url_for('oauth2callback', _external=True)
  authorization_url, state = flow.authorization_url(
      # This parameter enables offline access which gives your application
      # both an access and refresh token.
      access_type='offline',
      # This parameter enables incremental auth.
      include_granted_scopes='true')

  # Store the state in the session so that the callback can verify that
  # the authorization server response.
  flask.session['state'] = state

  return flask.redirect(authorization_url)


@app.route('/oauth2callback')
def oauth2callback():
  # Specify the state when creating the flow in the callback so that it can
  # verify the authorization server response.
  state = flask.session['state']
  flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
      CLIENT_SECRETS_FILE, scopes=SCOPES, state=state)
  flow.redirect_uri = flask.url_for('oauth2callback', _external=True)

  # Use the authorization server's response to fetch the OAuth 2.0 tokens.
  authorization_response = flask.request.url
  flow.fetch_token(authorization_response=authorization_response)

  # Store the credentials in the session.
  # ACTION ITEM for developers:
  #     Store user's access and refresh tokens in your data store if
  #     incorporating this code into your real app.
  credentials = flow.credentials
  flask.session['credentials'] = {
      'token': credentials.token,
      'refresh_token': credentials.refresh_token,
      'token_uri': credentials.token_uri,
      'client_id': credentials.client_id,
      'client_secret': credentials.client_secret,
      'scopes': credentials.scopes
  }

  return flask.redirect(flask.url_for('index'))


def search_list_related_videos(id, **kwargs):
  try:
    response = related_db[id]
  except KeyError:
    print(f'cache miss {id}')

    ok, client = get_client()
    if not ok:
      return client

    response = client.search().list(
      **kwargs,
      relatedToVideoId=id,
    ).execute()
    
    related_db[id] = json.dumps(response)
  else:
    print(f'cache hit {id}')
    response = json.loads(response)

  return flask.jsonify(**response)


def search_video_details(id, **kwargs):
  try:
    response = details_db[id]
  except KeyError:
    print(f'cache miss {id}')
    
    ok, client = get_client()
    if not ok:
      return client

    response = client.videos().list(
      **kwargs,
      id=id,
    ).execute()
    
    details_db[id] = json.dumps(response)
  else:
    print(f'cache hit {id}')
    response = json.loads(response)

  return flask.jsonify(**response)


if __name__ == '__main__':
  # When running locally, disable OAuthlib's HTTPs verification. When
  # running in production *do not* leave this option enabled.
  os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
  from werkzeug.serving import WSGIRequestHandler
  WSGIRequestHandler.protocol_version = 'HTTP/1.1'
  app.run('0.0.0.0', 8806, debug=True, use_reloader=False, threaded=True)
