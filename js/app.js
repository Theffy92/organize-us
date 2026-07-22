function svg(name) {
	const icons = {
		menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>',
		file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7Z"></path><path d="M14 3v5h5"></path></svg>'
	};
	return icons[name] || '';
}

function formatDate(date) {
	return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function setActiveNav() {
	const page = document.body.dataset.page;
	if (!page) return;
	document.querySelectorAll('[data-nav]').forEach((link) => {
		const active = link.dataset.nav === page;
		link.classList.toggle('active', active);
		if (active) link.setAttribute('aria-current', 'page');
		else link.removeAttribute('aria-current');
	});
}

function setupLandingMenu() {
	const toggle = document.querySelector('[data-mobile-menu-toggle]');
	const nav = document.querySelector('[data-mobile-menu]');
	const actions = document.querySelector('[data-mobile-actions]');
	if (!toggle || !nav || !actions) return;
	toggle.innerHTML = svg('menu');
	toggle.addEventListener('click', () => {
		const open = nav.classList.toggle('open');
		actions.classList.toggle('open', open);
		toggle.setAttribute('aria-expanded', String(open));
	});
}

function setupSidebar() {
	const sidebar = document.querySelector('[data-sidebar]');
	const toggle = document.querySelector('[data-sidebar-toggle]');
	if (!sidebar || !toggle) return;
	const media = window.matchMedia('(max-width: 800px)');

	const sync = () => {
		sidebar.hidden = media.matches;
		toggle.hidden = !media.matches;
		toggle.setAttribute('aria-expanded', String(!sidebar.hidden));
	};

	sync();
	media.addEventListener('change', sync);
	toggle.addEventListener('click', () => {
		sidebar.hidden = !sidebar.hidden;
		toggle.setAttribute('aria-expanded', String(!sidebar.hidden));
	});
}

function setupModals() {
	const backdrop = document.querySelector('[data-modal-backdrop]');
	if (!backdrop) return;
	const openers = document.querySelectorAll('[data-open-modal]');
	const closers = document.querySelectorAll('[data-close-modal]');

	const openModal = () => {
		backdrop.classList.add('open');
		backdrop.setAttribute('aria-hidden', 'false');
		const focusTarget = backdrop.querySelector('input, select, textarea, button');
		if (focusTarget) focusTarget.focus();
	};

	const closeModal = () => {
		backdrop.classList.remove('open');
		backdrop.setAttribute('aria-hidden', 'true');
	};

	openers.forEach((button) => button.addEventListener('click', openModal));
	closers.forEach((button) => button.addEventListener('click', closeModal));
	backdrop.addEventListener('click', (event) => {
		if (event.target === backdrop) closeModal();
	});
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && backdrop.classList.contains('open')) closeModal();
	});
}

function setupTravelPage() {
	const form = document.querySelector('[data-travel-form]');
	const rows = document.querySelector('[data-travel-list]');
	const emptyState = document.querySelector('[data-travel-empty]');
	const totalTrips = document.querySelector('[data-total-trips]');
	const totalDays = document.querySelector('[data-total-days]');
	if (!form || !rows) return;

	const updateStats = () => {
		const items = rows.querySelectorAll('tr');
		if (totalTrips) totalTrips.textContent = String(items.length);
		let dayCount = 0;
		items.forEach((row) => {
			dayCount += Number(row.dataset.days || 0);
		});
		if (totalDays) totalDays.textContent = String(dayCount);
		if (emptyState) emptyState.hidden = items.length > 0;
	};

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const country = form.elements.country.value.trim();
		const departure = form.elements.departure.value;
		const returnDate = form.elements.returnDate.value;
		if (!country || !departure || !returnDate) return;

		const departureDate = new Date(departure);
		const returnDateValue = new Date(returnDate);
		const duration = Math.max(1, Math.round((returnDateValue - departureDate) / 86400000) + 1);

		const row = document.createElement('tr');
		row.dataset.days = String(duration);
		row.innerHTML = `
			<td><div class="table-country"><strong>${country}</strong><span>International</span></div></td>
			<td>${formatDate(departureDate)}</td>
			<td>${formatDate(returnDateValue)}</td>
			<td><span class="pill neutral">${duration} days</span></td>
		`;

		rows.prepend(row);
		form.reset();
		updateStats();
		backdropClose();
	});

	function backdropClose() {
		const backdrop = document.querySelector('[data-modal-backdrop]');
		if (backdrop) {
			backdrop.classList.remove('open');
			backdrop.setAttribute('aria-hidden', 'true');
		}
	}

	updateStats();
}

function setupDocumentsPage() {
	const form = document.querySelector('[data-document-form]');
	const grid = document.querySelector('[data-document-grid]');
	const emptyState = document.querySelector('[data-document-empty]');
	const totalDocuments = document.querySelector('[data-total-documents]');
	if (!form || !grid) return;

	const updateStats = () => {
		const cards = grid.querySelectorAll('[data-document-card]');
		if (totalDocuments) totalDocuments.textContent = String(cards.length);
		if (emptyState) emptyState.hidden = cards.length > 0;
	};

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const name = form.elements.name.value.trim();
		const status = form.elements.status.value;
		const location = form.elements.location.value.trim();
		const expiry = form.elements.expiry.value.trim();
		if (!name) return;

		const card = document.createElement('article');
		card.className = 'document-card';
		card.dataset.documentCard = 'true';
		if (status === 'Missing') card.classList.add('danger');
		card.innerHTML = `
			<div class="doc-icon">${svg('file')}</div>
			<h3>${name}</h3>
			${expiry ? `<p>Expires: ${expiry}</p>` : '<p>Expires: Not specified</p>'}
			${location ? `<p>Stored: ${location}</p>` : '<p>Stored: Not specified</p>'}
			<span class="pill ${status === 'Missing' ? 'danger' : status === 'Expiring soon' ? 'warning' : 'success'}">${status}</span>
		`;

		grid.prepend(card);
		form.reset();
		updateStats();
		const backdrop = document.querySelector('[data-modal-backdrop]');
		if (backdrop) {
			backdrop.classList.remove('open');
			backdrop.setAttribute('aria-hidden', 'true');
		}
	});

	updateStats();
}

function setupOnboarding() {
	const steps = Array.from(document.querySelectorAll('[data-onboarding-step]'));
	const progressBar = document.querySelector('[data-onboarding-progress]');
	const stepIndicator = document.querySelector('[data-step-indicator]');
	const backButton = document.querySelector('[data-onboarding-back]');
	const nextButton = document.querySelector('[data-onboarding-next]');
	const finishButton = document.querySelector('[data-onboarding-finish]');
	if (!steps.length) return;

	let stepIndex = 0;

	const render = () => {
		steps.forEach((step, index) => {
			step.hidden = index !== stepIndex;
		});
		if (progressBar) progressBar.style.width = `${((stepIndex + 1) / steps.length) * 100}%`;
		if (stepIndicator) stepIndicator.textContent = `${stepIndex + 1} of ${steps.length}`;
		if (backButton) backButton.disabled = stepIndex === 0;
		if (nextButton) nextButton.hidden = stepIndex === steps.length - 1;
		if (finishButton) finishButton.hidden = stepIndex !== steps.length - 1;
	};

	steps.forEach((step) => {
		step.querySelectorAll('[data-choice]').forEach((choice) => {
			choice.addEventListener('click', () => {
				const group = choice.closest('[data-choice-group]');
				if (!group) return;
				group.querySelectorAll('.choice').forEach((button) => button.classList.remove('active'));
				choice.classList.add('active');
				const fieldName = choice.getAttribute('data-field');
				const field = step.querySelector(`[name="${fieldName}"]`);
				if (field) field.value = choice.textContent.trim();
			});
		});
	});

	if (backButton) {
		backButton.addEventListener('click', () => {
			if (stepIndex > 0) stepIndex -= 1;
			render();
		});
	}

	if (nextButton) {
		nextButton.addEventListener('click', () => {
			if (stepIndex < steps.length - 1) stepIndex += 1;
			render();
		});
	}

	if (finishButton) {
		finishButton.addEventListener('click', () => {
			window.location.href = 'dashboard.html';
		});
	}

	render();
}

function setupScoreRings() {
	document.querySelectorAll('[data-score]').forEach((ring) => {
		const score = Number(ring.dataset.score || 0);
		ring.style.setProperty('--score', score);
		const value = ring.querySelector('[data-score-value]');
		if (value) value.textContent = `${score}%`;
	});
}

document.addEventListener('DOMContentLoaded', () => {
	setActiveNav();
	setupLandingMenu();
	setupSidebar();
	setupModals();
	setupTravelPage();
	setupDocumentsPage();
	setupOnboarding();
	setupScoreRings();
});
