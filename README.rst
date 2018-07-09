========
Alpaca 2
========

This project contains the entirety of the code/executable side of the second attempt at the Alpaca project. Currently it is made of two parts: the Alpaca server and the Alpaca extension.


Running
-------

To run the project, use the included Makefile::

  $ make run

This will build a Docker container and then run the application inside of it. To run on a different port or with a different tag, run::

  $ make run PORT=8888
  $ make run TAG=alpaca_foo
  $ make run PORT=8888 TAG=alpaca_foo


Usage
-----

To use Alpaca 