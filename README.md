# Alpaca: AR Graphics Extensions for Web Application

Abstract:
> In this work, we propose a framework to simplify the creation of Augmented
> Reality (AR) extensions for web applications, without modifying the original
> web applications. AR extensions developed using Alpaca appear as a
> web-browser extension, and automatically bridge the Document Object Model
> (DOM) of the web with the SceneGraph model of AR. To transform the web
> application into a multi-device, mixed-space web application, we designed a
> restrictive and minimized interface for cross-device event handling. We
> demonstrate our approach to develop mixed-space applications using three
> examples. With our extension, the creation and control of augmented reality
> devices becomes transparent, as if they were natively part of the browser.

[Presentation Video](https://files.are.mediocreatbest.xyz/x31k4e8e.mp4)

[Presentation Slides](https://files.are.mediocreatbest.xyz/vt2auonw.pdf)

## Getting Started

Alpaca has 3 main components that exist in 3 distinct modes:
Alpaca Server (on-laptop), Alpaca Extension (in-browser), and Alpaca AR Runtime (on-smartphone).

To install the Alpaca Server, run the following commands to install dependencies
and start the server.

```console
~/$ git clone git@github.com:Alpaca-AR/Alpaca-AR.git ~/Alpaca-AR
~/$ cd ~/Alpaca-AR
~/Alpaca-AR/$ virtualenv -p python3.7 venv
~/Alpaca-AR/$ ./venv/bin/pip install -r requirements.txt
~/Alpaca-AR/$ ./venv/bin/pip install -e .
~/Alpaca-AR/$ ./venv/bin/alpaca --host 0.0.0.0 --port 8123
```

To install the Alpaca Extension into Google Chrome,
navigate to chrome://extensions/ , enable Developer Mode,
and select Load Unpacked and navigate to `~/Alpaca-AR/extension/`
select Okay.

To install the Alpaca AR Runtime,
follow the [Getting Started instructions from the WebARonARCore project](https://github.com/google-ar/WebARonARCore#getting-started).
Primarily, this involves installing Google's ARCore Developer Preview and then the WebARonARCore application
onto a Google Pixel 1 or 2 or a Samsung Galaxy S8.

Finally, navigate to an Alpaca-supported web page
by selecting one of them from the extension
(Note: currently only the National Parks Service's Species Mapper application is supported and released).
After accessing that page,
open the WebARonARCore app and navigate to `http://1.2.3.4:8123/m/mobile.html` where `1.2.3.4` is the IP address of your laptop.

## Troubleshooting: Alpaca AR Runtime not functioning properly

1. If the page doesn't load at all, the URL may not have been typed in correctly.
It must be `http://1.2.3.4:8123/m/mobile.html` where `1.2.3.4` is the IP address of your laptop.
0. Alternatively, port `8123` may be blocked by your firewall. On Ubuntu, you might use `sudo ufw allow 8123`.
0. The laptop may not be accessible from the AR device.
In this case, you would need to run the Alpaca Server on a different machine that is accessible to both devices.
You would also need to change the `./extension/nps.js` code to point to the correct machine
(after which, the extension must be refreshed in the chrome://extensions/ page).
0. If the AR scene graph isn't visible, you may need to refresh the page.
When the server is first started, you need to access an Alpaca-enabled web page before opening the AR device.
0. If the AR scene moves unexpectedly, you may need to allow the device to do registration.
This could be done by panning the phone around the area slowly, for example, panning across a desk.
It may be easier to try some of the examples from the WebAR project first to get a better feel for how registration works.
Registration must be performed every time the web page is refreshed.

## Troubleshooting: It still doesn't work

An issue can be filed at https://github.com/Alpaca-AR/Alpaca-AR/issues
and we can help you get it working.
We can suggest additional tests to run that can help new users with the project.
