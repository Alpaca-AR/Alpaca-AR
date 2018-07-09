Array.from(document.querySelectorAll('a')).forEach((a) => {
	a.addEventListener('click', () => {
		chrome.tabs.create({ url: a.href });
	});
});
