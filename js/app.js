const STORAGE_KEY = 'organizeUsData';

const defaultAppData = {
	profile: {
		name: '',
		country: '',
		immigrationProcess: ''
	},
	documents: [],
	trips: [],
	assistantChat: [],
	travelReviewed: false,
	onboardingCompleted: false,
	assistant: {
		isOpen: false,
		messages: []
	}
};

function createDefaultAppData() {
	return JSON.parse(JSON.stringify(defaultAppData));
}

function getAppData() {
	const savedData = localStorage.getItem(STORAGE_KEY);

	if (!savedData) {
		return createDefaultAppData();
	}

	try {
		const parsedData = JSON.parse(savedData);

		return {
			...createDefaultAppData(),
			...parsedData,
			profile: {
				...defaultAppData.profile,
				...parsedData.profile
			},
			assistant: {
				...defaultAppData.assistant,
				...parsedData.assistant
			}
			// assistantChat: Array.isArray(parsedData.assistantChat)
			// 	? parsedData.assistantChat.filter((message) => {
			// 		return message && typeof message.text === 'string' &&
			// 			typeof message.role === 'string';
			// 	})
			// 	: []
		};
	} catch (error) {
		console.error('Unable to read saved OrganizeUs data:', error);
		return createDefaultAppData();
	}
	
}

function saveAppData(data) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function resetAppData() {
	localStorage.removeItem(STORAGE_KEY);
}

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

function generateChecklist(process) {
	const checklists = {
		naturalization: [
			{
				id: crypto.randomUUID(),
				name: 'Permanent Resident Card (Green Card)',
				status: 'Missing',
				completed: false,
			},
			{
				id: crypto.randomUUID(),
				name: 'Travel History',
				status: 'Missing',
				completed: false,
			},
			{
				id: crypto.randomUUID(),
				name: 'Tax Records',
				status: 'Missing',
				completed: false,
			},
		],

		'permanent-residency': [
			{
				id: crypto.randomUUID(),
				name: 'Identity Document',
				status: 'Missing',
				completed: false,
			},
			{
				id: crypto.randomUUID(),
				name: 'ValidPassport',
				status: 'Missing',
				completed: false,
			},
			{
				id: crypto.randomUUID(),
				name: 'Birth Certificate',
				status: 'Missing',
				completed: false,
			},
			{
				id: crypto.randomUUID(),
				name: 'Proof of Residence',
				status: 'Missing',
				completed: false,
			},
			{
				id: crypto.randomUUID(),
				name: 'Financial Records',
				status: 'Missing',
				completed: false,
			},
		],

		'f1-visa': [
			{
				id: crypto.randomUUID(),
				name: 'I-20 Form',
				status: 'Missing',
				completed: false,	
			},
			{
				id: crypto.randomUUID(),
				name: 'Valid Passport',
				status: 'Missing',
				completed: false,
			},
			{
				id: crypto.randomUUID(),
				name: 'Financial Support Documents',
				status: 'Missing',
				completed: false,
			},	
			{
				id: crypto.randomUUID(),
				name: 'Visa application form (DS-160)',
				status: 'Missing',
				completed: false,
			},
		],
	}
	return checklists[process] || [];
}

function calculateCompletionScore(appData) {
	const documents = appData.documents || [];
	const trips = appData.trips || [];

	const completedDocuments = documents.filter(
		(documentItem) => documentItem.completed
	).length;

	const totalDocuments = documents.length;
	const totalTrips = trips.length;
	const travelComplete = totalTrips > 0;
	const documentsComplete = totalDocuments > 0 && completedDocuments === totalDocuments;

	if (completedDocuments === 0 && totalTrips === 0) {
		return 0;
	}

	const completedSections = [
		travelComplete,
		documentsComplete,
		Boolean(appData.onboardingCompleted) && (totalTrips > 0 || completedDocuments > 0)
	].filter(Boolean).length;

	return Math.round((completedSections / 3) * 100);
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
	const countriesVisited = document.querySelector(
		'[data-countries-visited]'
	);

	if (!rows) return;

	const calculateDuration = (departure, returnDate) => {
		const departureDate = new Date(`${departure}T00:00:00`);
		const returnDateValue = new Date(`${returnDate}T00:00:00`);

		return Math.max(
			1,
			Math.round(
				(returnDateValue - departureDate) / 86400000
			) + 1
		);
	};

	const renderTrips = () => {
		const appData = getAppData();
		const trips = appData.trips || [];

		rows.innerHTML = '';

		trips.forEach((trip) => {
			const row = document.createElement('tr');

			row.dataset.days = String(trip.duration);

			row.innerHTML = `
				<td>
					<div class="table-country">
						<strong>${trip.country}</strong>
						<span>International</span>
					</div>
				</td>
				<td>
					${formatDate(
						new Date(`${trip.departure}T00:00:00`)
					)}
				</td>
				<td>
					${formatDate(
						new Date(`${trip.returnDate}T00:00:00`)
					)}
				</td>
				<td>
					<span class="pill neutral">
						${trip.duration} days
					</span>
				</td>
				<td>
					<button
						type="button"
						class="delete-trip"
						data-delete-trip
						data-trip-id="${trip.id}"
					>
						Delete
					</button>
				</td>
			`;

			rows.appendChild(row);
		});

		const dayCount = trips.reduce(
			(total, trip) =>
				total + Number(trip.duration || 0),
			0
		);

		const uniqueCountries = new Set(
			trips.map((trip) =>
				trip.country.trim().toLowerCase()
			)
		).size;

		if (totalTrips) {
			totalTrips.textContent = String(trips.length);
		}

		if (totalDays) {
			totalDays.textContent = String(dayCount);
		}

		if (countriesVisited) {
			countriesVisited.textContent =
				String(uniqueCountries);
		}

		if (emptyState) {
			emptyState.hidden = trips.length > 0;
		}
	};

	if (form) {
		form.addEventListener('submit', (event) => {
			event.preventDefault();

			const country =
				form.elements.country.value.trim();

			const departure =
				form.elements.departure.value;

			const returnDate =
				form.elements.returnDate.value;

			if (!country || !departure || !returnDate) {
				return;
			}

			if (
				new Date(`${returnDate}T00:00:00`) <
				new Date(`${departure}T00:00:00`)
			) {
				alert(
					'Return date cannot be before departure date.'
				);

				return;
			}

			const appData = getAppData();

			appData.trips.push({
				id: crypto.randomUUID(),
				country,
				departure,
				returnDate,
				duration: calculateDuration(
					departure,
					returnDate
				)
			});

			appData.travelReviewed = true;

			saveAppData(appData);

			form.reset();
			renderTrips();

			const backdrop = document.querySelector(
				'[data-modal-backdrop]'
			);

			if (backdrop) {
				backdrop.classList.remove('open');
				backdrop.setAttribute(
					'aria-hidden',
					'true'
				);
			}
		});
	}

	rows.addEventListener('click', (event) => {
		const deleteButton = event.target.closest(
			'[data-delete-trip]'
		);

		if (!deleteButton) return;

		const tripId = deleteButton.dataset.tripId;
		const appData = getAppData();

		appData.trips = appData.trips.filter(
			(trip) => trip.id !== tripId
		);

		saveAppData(appData);
		renderTrips();
	});

	renderTrips();
}

function setupDocumentsPage() {
	const form = document.querySelector('[data-document-form]');
	const grid = document.querySelector('[data-document-grid]');
	const emptyState = document.querySelector('[data-document-empty]');
	const totalDocuments = document.querySelector(
		'[data-total-documents]'
	);
	const completedDocuments = document.querySelector(
		'[data-documents-complete]'
	);
	const missingDocuments = document.querySelector(
		'[data-documents-missing]'
	);

	if (!grid) return;

	const renderDocuments = () => {
		const appData = getAppData();
		const documents = appData.documents;

		grid.innerHTML = '';

		documents.forEach((documentItem) => {
			const card = document.createElement('article');

			card.className = 'document-card';
			card.dataset.documentCard = 'true';

			if (!documentItem.completed) {
				card.classList.add('danger');
			}

			card.innerHTML = `
				<div class="doc-icon">${svg('file')}</div>
				<h3>${documentItem.name}</h3>
				<p>
					${documentItem.completed
						? 'This document is marked as organized.'
						: 'This document still needs attention.'
					}
				</p>
				<button
					type="button"
					class="pill ${
						documentItem.completed
							? 'success'
							: 'danger'
					}"
					data-document-toggle
					data-document-id="${documentItem.id}"
				>
					${documentItem.completed
						? 'On file'
						: 'Missing'
					}
				</button>
			`;

			grid.appendChild(card);
		});

		const completeCount = documents.filter(
			(documentItem) => documentItem.completed
		).length;

		const missingCount =
			documents.length - completeCount;

		if (totalDocuments) {
			totalDocuments.textContent =
				String(documents.length);
		}

		if (completedDocuments) {
			completedDocuments.textContent =
				String(completeCount);
		}

		if (missingDocuments) {
			missingDocuments.textContent =
				String(missingCount);
		}

		if (emptyState) {
			emptyState.hidden = documents.length > 0;
		}
	};

	grid.addEventListener('click', (event) => {
		const toggleButton = event.target.closest(
			'[data-document-toggle]'
		);

		if (!toggleButton) return;

		const documentId =
			toggleButton.dataset.documentId;

		const appData = getAppData();

		const documentItem = appData.documents.find(
			(item) => item.id === documentId
		);

		if (!documentItem) return;

		documentItem.completed = !documentItem.completed;
		documentItem.status = documentItem.completed
			? 'On file'
			: 'Missing';

		saveAppData(appData);
		renderDocuments();
	});

	if (form) {
		form.addEventListener('submit', (event) => {
			event.preventDefault();

			const appData = getAppData();

			const name = form.elements.name.value.trim();
			const status = form.elements.status.value;
			const location =
				form.elements.location.value.trim();
			const expiry =
				form.elements.expiry.value.trim();

			if (!name) return;

			appData.documents.push({
				id: crypto.randomUUID(),
				name,
				status,
				completed: status === 'On file',
				location,
				expiry
			});

			saveAppData(appData);

			form.reset();
			renderDocuments();

			const backdrop = document.querySelector(
				'[data-modal-backdrop]'
			);

			if (backdrop) {
				backdrop.classList.remove('open');
				backdrop.setAttribute(
					'aria-hidden',
					'true'
				);
			}
		});
	}

	renderDocuments();
}

function setupTimelinePage() {
	const timelineList = document.querySelector(
		'[data-timeline-list]'
	);

	const scoreRing = document.querySelector(
		'[data-timeline-score]'
	);

	const scoreValue = document.querySelector(
		'[data-timeline-score-value]'
	);

	const summaryContainer = document.querySelector(
		'[data-timeline-summary]'
	);

	const missingContainer = document.querySelector(
		'[data-timeline-missing]'
	);

	const nextStepElement = document.querySelector(
		'[data-timeline-next-step]'
	);

	if (
		!timelineList &&
		!scoreRing &&
		!summaryContainer &&
		!missingContainer
	) {
		return;
	}

	const appData = getAppData();

	const processLabels = {
		'permanent-residency': 'Permanent Residency',
		naturalization: 'Naturalization',
		'f1-visa': 'F-1 Student Visa'
	};

	const documents = appData.documents || [];
	const trips = appData.trips || [];

	const completedDocuments = documents.filter(
		(documentItem) => documentItem.completed
	).length;

	const totalDocuments = documents.length;

	const completionScore =
		calculateCompletionScore(appData);

	if (scoreRing) {
		scoreRing.dataset.score = String(completionScore);
		scoreRing.style.setProperty(
			'--score',
			completionScore
		);
	}

	if (scoreValue) {
		scoreValue.textContent = `${completionScore}%`;
	}

	if (timelineList) {
		timelineList.innerHTML = '';

		const onboardingItem = document.createElement('li');
		onboardingItem.className = 'timeline-item';
		onboardingItem.innerHTML = `
			<div>
				<strong>Started</strong>
				<p>
					Created a ${
						processLabels[
							appData.profile.immigrationProcess
						] || 'personalized'
					} organization plan
				</p>
			</div>
		`;

		timelineList.appendChild(onboardingItem);

		trips.forEach((trip) => {
			const tripItem = document.createElement('li');
			tripItem.className = 'timeline-item';

			const departureDate = new Date(
				`${trip.departure}T00:00:00`
			);

			tripItem.innerHTML = `
				<div>
					<strong>${departureDate.getFullYear()}</strong>
					<p>
						Recorded a trip to ${trip.country}
						(${trip.duration} days)
					</p>
				</div>
			`;

			timelineList.appendChild(tripItem);
		});

		documents
			.filter((documentItem) => documentItem.completed)
			.forEach((documentItem) => {
				const documentItemElement =
					document.createElement('li');

				documentItemElement.className =
					'timeline-item';

				documentItemElement.innerHTML = `
					<div>
						<strong>Organized</strong>
						<p>
							Marked ${documentItem.name} as on file
						</p>
					</div>
				`;

				timelineList.appendChild(
					documentItemElement
				);
			});
	}

	if (summaryContainer) {
		summaryContainer.innerHTML = `
			<p>
				• Your selected plan is ${
					processLabels[
						appData.profile.immigrationProcess
					] || 'not selected'
				}.
			</p>

			<p>
				• You have recorded ${trips.length}
				${trips.length === 1 ? 'trip' : 'trips'}.
			</p>

			<p>
				• You have organized ${completedDocuments}
				of ${totalDocuments} tracked documents.
			</p>

			<p>
				• Your current organizational completion score
				is ${completionScore}%.
			</p>
		`;
	}

	if (missingContainer) {
		missingContainer.innerHTML = '';

		const missingDocuments = documents.filter(
			(documentItem) => !documentItem.completed
		);

		if (missingDocuments.length === 0) {
			missingContainer.innerHTML = `
				<div class="info-row">
					<span>Document checklist</span>
					<span class="pill success">
						Complete
					</span>
				</div>
			`;
		} else {
			missingDocuments.forEach((documentItem) => {
				const row = document.createElement('div');

				row.className = 'info-row';

				row.innerHTML = `
					<span>${documentItem.name}</span>
					<span class="pill warning">
						Missing
					</span>
				`;

				missingContainer.appendChild(row);
			});
		}
	}

	if (nextStepElement) {
		const firstMissingDocument = documents.find(
			(documentItem) => !documentItem.completed
		);

		if (firstMissingDocument) {
			nextStepElement.textContent =
				`Suggested next step: organize ${firstMissingDocument.name}.`;
		} else if (trips.length === 0) {
			nextStepElement.textContent =
				'Suggested next step: review your travel history and add any relevant trips.';
		} else {
			nextStepElement.textContent =
				'Your tracked documents are organized. Review your saved information for accuracy.';
		}
	}
}

function setupOnboarding() {
	const steps = Array.from(
		document.querySelectorAll('[data-onboarding-step]')
	);

	const progressBar = document.querySelector(
		'[data-onboarding-progress]'
	);

	const stepIndicator = document.querySelector(
		'[data-step-indicator]'
	);

	const backButton = document.querySelector(
		'[data-onboarding-back]'
	);

	const nextButton = document.querySelector(
		'[data-onboarding-next]'
	);

	const finishButton = document.querySelector(
		'[data-onboarding-finish]'
	);

	const loadingMessage = document.querySelector(
		'[data-ai-loading]'
	);

	if (!steps.length) return;

	let stepIndex = 0;

	const onboardingData = {
		name: '',
		country: '',
		immigrationProcess: ''
	};

	const processLabels = {
		'permanent-residency': 'Permanent Residency',
		naturalization: 'Naturalization',
		'f1-visa': 'F-1 Student Visa'
	};

	const requestAiMessage = async (step) => {
		const response = await fetch(
			'https://organize-us-api.onrender.com/chat',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ 
					step,
					profile: onboardingData
				})
			}
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				data.error || 'The AI assistant request failed.'
			);
		}

		if (!data.response) {
			throw new Error(
				'The AI assistant returned an empty response.'
			);
		}

		return data.response;
	};

	const render = () => {
		steps.forEach((step, index) => {
			step.hidden = index !== stepIndex;
		});

		if (progressBar) {
			progressBar.style.width =
				`${((stepIndex + 1) / steps.length) * 100}%`;
		}

		if (stepIndicator) {
			stepIndicator.textContent =
				`${stepIndex + 1} of ${steps.length}`;
		}

		if (backButton) {
			backButton.disabled = stepIndex === 0;
		}

		if (nextButton) {
			nextButton.hidden =
				stepIndex === steps.length - 1;
		}

		if (finishButton) {
			finishButton.hidden =
				stepIndex !== steps.length - 1;
		}
	};

	steps.forEach((step) => {
		step.querySelectorAll('[data-choice]').forEach((choice) => {
			choice.addEventListener('click', () => {
				const group = choice.closest(
					'[data-choice-group]'
				);

				if (!group) return;

				group.querySelectorAll('.choice').forEach(
					(button) => {
						button.classList.remove('active');
					}
				);

				choice.classList.add('active');

				const fieldName =
					choice.getAttribute('data-field');

				const field = step.querySelector(
					`[name="${fieldName}"]`
				);

				if (field) {
					field.value =
						choice.dataset.value ||
						choice.textContent.trim();
				}
			});
		});
	});

	if (backButton) {
		backButton.addEventListener('click', () => {
			if (stepIndex > 0) {
				stepIndex -= 1;
				render();
			}
		});
	}

	if (nextButton) {
		nextButton.addEventListener('click', async () => {
			const currentStep = steps[stepIndex];

			try {
				nextButton.disabled = true;

				if (loadingMessage) {
					loadingMessage.hidden = false;
				}

				if (stepIndex === 0) {
					const nameInput = currentStep.querySelector(
						'[name="profileName"]'
					);

					const name = nameInput?.value.trim();

					if (!name) {
						alert('Please enter a profile name.');
						return;
					}

					onboardingData.name = name;

					const aiMessage = await requestAiMessage(
						'name-completed'
					);

					const countryMessage =
						document.querySelector(
							'[data-ai-country-message]'
						);

					if (countryMessage) {
						countryMessage.textContent = aiMessage;
					}
				}

				if (stepIndex === 1) {
					const countryInput =
						currentStep.querySelector(
							'[name="country"]'
						);

					const country =
						countryInput?.value.trim();

					if (!country) {
						alert('Please enter a country.');
						return;
					}

					onboardingData.country = country;

					const aiMessage = await requestAiMessage(
						'country-completed'
					);

					const processMessage =
						document.querySelector(
							'[data-ai-process-message]'
						);

					if (processMessage) {
						processMessage.textContent = aiMessage;
					}
				}

				if (stepIndex === 2) {
					const processInput =
						currentStep.querySelector(
							'[name="immigrationProcess"]'
						);

					const processValue =
						processInput?.value;

					if (!processValue) {
						alert(
							'Please select an immigration process.'
						);
						return;
					}

					onboardingData.immigrationProcess =
						processValue;

					const selectedProcess =
						processLabels[processValue];

					const aiMessage = await requestAiMessage(
						'process-completed'
					);

					const confirmationMessage =
						document.querySelector(
							'[data-ai-confirmation-message]'
						);

					if (confirmationMessage) {
						confirmationMessage.textContent =
							aiMessage;
					}

					const reviewName =
						document.querySelector(
							'[data-review-name]'
						);

					const reviewCountry =
						document.querySelector(
							'[data-review-country]'
						);

					const reviewProcess =
						document.querySelector(
							'[data-review-process]'
						);

					if (reviewName) {
						reviewName.textContent =
							onboardingData.name;
					}

					if (reviewCountry) {
						reviewCountry.textContent =
							onboardingData.country;
					}

					if (reviewProcess) {
						reviewProcess.textContent =
							selectedProcess;
					}
				}

				if (stepIndex < steps.length - 1) {
					stepIndex += 1;
					render();
				}
			} catch (error) {
				console.error(error);

				alert(
					'The AI assistant is temporarily unavailable. ' +
					'Please try again.'
				);
			} finally {
				nextButton.disabled = false;

				if (loadingMessage) {
					loadingMessage.hidden = true;
				}
			}
		});
	}

	if (finishButton) {
		finishButton.addEventListener('click', () => {
			const appData = getAppData();

			appData.profile = {
				name: onboardingData.name,
				country: onboardingData.country,
				immigrationProcess: onboardingData.immigrationProcess
			};

			appData.onboardingCompleted = true;

			appData.documents = generateChecklist(onboardingData.immigrationProcess);

			saveAppData(appData);
			// console.log('Completed onboarding:', onboardingData);

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

function setupProfileHeader() {
	const appData = getAppData();
	const profileName = appData.profile.name.trim();
	const displayName = profileName || 'Profile';
	const profileInitial = profileName ? profileName.charAt(0).toUpperCase() : 'P';

	document.querySelectorAll('[data-profile-name]').forEach((element) => {
		element.textContent = displayName;
	});

	document.querySelectorAll('[data-profile-initial]').forEach((element) => {
		element.textContent = profileInitial;
	});
}

function setupDashboard() {
	const nameElements = document.querySelectorAll(
		'[data-dashboard-name]'
	);

	const processElement = document.querySelector(
		'[data-dashboard-process]'
	);

	const totalDocumentsElement = document.querySelector(
		'[data-dashboard-total-documents]'
	);

	const completedDocumentsElement = document.querySelector(
		'[data-dashboard-completed-documents]'
	);

	const remainingDocumentsElement = document.querySelector(
		'[data-dashboard-remaining-documents]'
	);

	const scoreValueElement = document.querySelector(
		'[data-dashboard-score-value]'
	);

	const statusTagElement = document.querySelector(
		'[data-dashboard-status-tag]'
	);

	const scoreBarElement = document.querySelector(
		'[data-dashboard-score-bar]'
	);

	const progressElement = document.querySelector(
		'[data-dashboard-progress]'
	);

	const totalTripsElement = document.querySelector(
		'[data-dashboard-total-trips]'
	);

	const totalDaysElement = document.querySelector(
		'[data-dashboard-total-days]'
	);

	const countriesVisitedElement = document.querySelector(
		'[data-dashboard-countries-visited]'
	);

	if (
		!nameElements.length &&
		!processElement &&
		!totalDocumentsElement &&
		!completedDocumentsElement &&
		!remainingDocumentsElement &&
		!scoreValueElement &&
		!statusTagElement
	) {
		return;
	}

	const appData = getAppData();

	const processLabels = {
		'permanent-residency': 'Permanent Residency',
		naturalization: 'Naturalization',
		'f1-visa': 'F-1 Student Visa'
	};

	const documents = appData.documents || [];

	const trips = appData.trips || [];

	const totalTrips = trips.length;

	const totalDays = trips.reduce(
		(total, trip) => total + Number(trip.duration || 0),
		0
	);

	const countriesVisited = new Set(trips.map((trip) => trip.country)).size;

	const totalDocuments = documents.length;

	const completedDocuments = documents.filter(
		(documentItem) => documentItem.completed
	).length;

	const remainingDocuments =
		totalDocuments - completedDocuments;

	const completionScore =
		calculateCompletionScore(appData);

	nameElements.forEach((element) => {
		element.textContent =
			appData.profile.name || 'there';
	});

	if (processElement) {
		processElement.textContent =
			processLabels[
				appData.profile.immigrationProcess
			] || 'Immigration Journey';
	}

	if (totalDocumentsElement) {
		totalDocumentsElement.textContent =
			String(totalDocuments);
	}

	if (completedDocumentsElement) {
		completedDocumentsElement.textContent =
			String(completedDocuments);
	}

	if (remainingDocumentsElement) {
		remainingDocumentsElement.textContent =
			String(remainingDocuments);
	}

	if (scoreValueElement) {
		scoreValueElement.textContent =
			`${completionScore}%`;
	}

	if (statusTagElement) {
		const onTrack = completedDocuments > 0;
		const inProgress = !onTrack && totalTrips > 0;
		statusTagElement.textContent = onTrack
			? 'On Track'
			: inProgress
				? 'In Progress'
				: 'Not Started';
		statusTagElement.classList.toggle('success', onTrack);
		statusTagElement.classList.toggle('warning', inProgress);
		statusTagElement.classList.toggle('neutral', !onTrack && !inProgress);
	}

	if (scoreBarElement) {
		scoreBarElement.style.width =
			`${completionScore}%`;
	}

	if (progressElement) {
		progressElement.textContent =
			`${completionScore}%`;
	}

	if (totalTripsElement) {
		totalTripsElement.textContent =
			String(totalTrips);
	}

	if (totalDaysElement) {
		totalDaysElement.textContent =
			String(totalDays);
	}

	if (countriesVisitedElement) {
		countriesVisitedElement.textContent =
			String(countriesVisited);
	}
}

function setupDemoReset() {
	const resetButton = document.querySelector(
		'[data-reset-demo]'
	);

	if (!resetButton) return;

	resetButton.addEventListener('click', () => {
		const confirmed = window.confirm(
			'Clear all fictional demo data and restart onboarding?'
		);

		if (!confirmed) return;

		resetAppData();

		window.location.href = 'onboarding.html';
	});
}

function setupAssistantWidget() {
	const appPages = [
		'dashboard',
		'travel',
		'documents',
		'timeline'
	];

	const currentPage = document.body.dataset.page;

	if (!appPages.includes(currentPage)) return;

	const widget = document.createElement('div');

	widget.className = 'assistant-widget';

	widget.innerHTML = `
		<button
			type="button"
			class="assistant-widget-toggle"
			data-assistant-toggle
			aria-expanded="false"
			aria-controls="assistant-panel"
		>
			<span aria-hidden="true">★</span>
			Ask AI
		</button>

		<section
			id="assistant-panel"
			class="assistant-widget-panel"
			data-assistant-panel
			hidden
		>
			<header class="assistant-widget-header">
				<div>
					<strong>OrganizeUS AI</strong>
					<span>Organization assistant</span>
				</div>

				<button
					type="button"
					class="close-button"
					data-assistant-close
					aria-label="Close assistant"
				>
					×
				</button>
			</header>

			<div
				class="assistant-widget-messages"
				data-assistant-messages
				aria-live="polite"
			></div>

			<div
				class="assistant-widget-loading"
				data-assistant-loading
				hidden
			>
				OrganizeUS AI is preparing a response…
			</div>

			<div class="assistant-widget-input">
				<input
					type="text"
					data-assistant-input
					placeholder="Ask a question..."
					aria-label="Ask OrganizeUS AI"
				>

				<button
					type="button"
					class="btn-secondary"
					data-assistant-send
				>
					Send
				</button>
			</div>
		</section>
	`;

	document.body.appendChild(widget);

	const toggleButton = widget.querySelector(
		'[data-assistant-toggle]'
	);

	const closeButton = widget.querySelector(
		'[data-assistant-close]'
	);

	const panel = widget.querySelector(
		'[data-assistant-panel]'
	);

	const messagesContainer = widget.querySelector(
		'[data-assistant-messages]'
	);

	const input = widget.querySelector(
		'[data-assistant-input]'
	);

	const sendButton = widget.querySelector(
		'[data-assistant-send]'
	);

	const loadingMessage = widget.querySelector(
		'[data-assistant-loading]'
	);

	const renderMessages = () => {
		const appData = getAppData();
		const messages = appData.assistant.messages || [];

		messagesContainer.innerHTML = '';

		if (messages.length === 0) {
			const welcomeRow = document.createElement('div');
			welcomeRow.className = 'chat-row assistant';

			const welcomeBubble = document.createElement('div');
			welcomeBubble.className = 'bubble';
			welcomeBubble.textContent =
				'How can I help you organize your immigration journey?';

			welcomeRow.appendChild(welcomeBubble);
			messagesContainer.appendChild(welcomeRow);

			return;
		}

		messages.forEach((message) => {
			const row = document.createElement('div');
			row.className = `chat-row ${message.role}`;

			const bubble = document.createElement('div');
			bubble.className = 'bubble';
			bubble.textContent = message.content;

			row.appendChild(bubble);
			messagesContainer.appendChild(row);
		});

		messagesContainer.scrollTop =
			messagesContainer.scrollHeight;
	};

	const setOpenState = (isOpen) => {
		panel.hidden = !isOpen;
		toggleButton.setAttribute(
			'aria-expanded',
			String(isOpen)
		);

		const appData = getAppData();
		appData.assistant.isOpen = isOpen;
		saveAppData(appData);

		if (isOpen) {
			renderMessages();
			input.focus();
		}
	};

	const sendMessage = async () => {
		const message = input.value.trim();

		if (!message) return;

		const appData = getAppData();

		appData.assistant.messages.push({
			role: 'user',
			content: message
		});

		saveAppData(appData);
		renderMessages();

		input.value = '';
		sendButton.disabled = true;
		loadingMessage.hidden = false;

		try {
			const response = await fetch(
				'https://organize-us-api.onrender.com/assistant',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						message,
						profile: appData.profile,
						documents: appData.documents
					})
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.error ||
					'The assistant request failed.'
				);
			}

			const latestData = getAppData();

			latestData.assistant.messages.push({
				role: 'assistant',
				content: data.response
			});

			saveAppData(latestData);
			renderMessages();
		} catch (error) {
			console.error(error);

			const latestData = getAppData();

			latestData.assistant.messages.push({
				role: 'assistant',
				content:
					'The assistant is temporarily unavailable. Please try again.'
			});

			saveAppData(latestData);
			renderMessages();
		} finally {
			sendButton.disabled = false;
			loadingMessage.hidden = true;
			input.focus();
		}
	};

	toggleButton.addEventListener('click', () => {
		setOpenState(panel.hidden);
	});

	closeButton.addEventListener('click', () => {
		setOpenState(false);
	});

	sendButton.addEventListener('click', sendMessage);

	input.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			sendMessage();
		}
	});

	const appData = getAppData();

	renderMessages();
	setOpenState(appData.assistant.isOpen);
}

document.addEventListener('DOMContentLoaded', () => {
	// // temporary datafor testing
	// const testData = getAppData();
	// console.log('Loaded OrganizeUs data:', testData);

	setActiveNav();
	setupLandingMenu();
	setupSidebar();
	setupModals();
	setupTravelPage();
	setupDocumentsPage();
	setupScoreRings();
	setupTimelinePage();
	setupOnboarding();
	setupDashboard();
	setupProfileHeader();
	setupDemoReset();
	setupAssistantWidget();
});