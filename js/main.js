(() => {
	const body = document.body;

	function initProductsDropdown() {
		const dropdown = document.querySelector('[data-dropdown]');
		if (!dropdown) {
			return;
		}

		const button = dropdown.querySelector('.nav-link-button');
		const menu = dropdown.querySelector('.products-dropdown');
		const menuItems = menu ? Array.from(menu.querySelectorAll('a')) : [];

		if (!button || !menu) {
			return;
		}

		let closeTimer;

		function setOpenState(isOpen) {
			dropdown.classList.toggle('is-open', isOpen);
			button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
		}

		function openMenu() {
			window.clearTimeout(closeTimer);
			setOpenState(true);
		}

		function closeMenu() {
			setOpenState(false);
		}

		function delayedClose() {
			window.clearTimeout(closeTimer);
			closeTimer = window.setTimeout(() => {
				if (!dropdown.contains(document.activeElement)) {
					closeMenu();
				}
			}, 100);
		}

		dropdown.addEventListener('mouseenter', openMenu);
		dropdown.addEventListener('mouseleave', delayedClose);
		dropdown.addEventListener('focusin', openMenu);
		dropdown.addEventListener('focusout', delayedClose);

		button.addEventListener('click', () => {
			setOpenState(button.getAttribute('aria-expanded') !== 'true');
		});

		button.addEventListener('keydown', (event) => {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				openMenu();
				if (menuItems[0]) {
					menuItems[0].focus();
				}
			}

			if (event.key === 'Escape') {
				closeMenu();
			}
		});

		menu.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				closeMenu();
				button.focus();
			}
		});

		document.addEventListener('click', (event) => {
			if (!dropdown.contains(event.target)) {
				closeMenu();
			}
		});
	}

	function initMobileMenu() {
		const menuButton = document.querySelector('.mobile-menu-button');
		const mobileNavigation = document.querySelector('#mobile-navigation');
		const closeButton = document.querySelector('.mobile-menu-close');

		if (!menuButton || !mobileNavigation) {
			return;
		}

		const mobileLinks = Array.from(mobileNavigation.querySelectorAll('a'));

		function openMenu() {
			mobileNavigation.hidden = false;
			menuButton.setAttribute('aria-expanded', 'true');
			body.classList.add('menu-open');
		}

		function closeMenu() {
			mobileNavigation.hidden = true;
			menuButton.setAttribute('aria-expanded', 'false');
			body.classList.remove('menu-open');
		}

		menuButton.addEventListener('click', () => {
			if (mobileNavigation.hidden) {
				openMenu();
			} else {
				closeMenu();
			}
		});

		if (closeButton) {
			closeButton.addEventListener('click', closeMenu);
		}

		mobileLinks.forEach((link) => {
			link.addEventListener('click', () => {
				closeMenu();
			});
		});

		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				closeMenu();
			}
		});

		window.addEventListener('resize', () => {
			if (window.innerWidth > 1050) {
				closeMenu();
			}
		});
	}

	initProductsDropdown();
	initMobileMenu();
})();
