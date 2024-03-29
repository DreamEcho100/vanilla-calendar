import './style.css';
import { isElementOrThrow } from '../utils.js';

/**
 * @param {import('../de100-calender/index.js').CalendarState} calendar
 * @param {ModalElements} modalElements
 * @param {import('../main.js').CalendarControllers} calendarControllers
 */
export function openModal(calendar, modalElements, calendarControllers) {
  const dateClicked = calendarControllers.dateClicked.get();

  if (!dateClicked) {
    throw new Error('Date clicked is not set');
  }

  calendarControllers.dateClicked.set(dateClicked);
  const dateKey = calendar.formatDateToKey(dateClicked);

  const eventForDay = calendarControllers.events.get().find((e) => e.date === dateKey);

  if (eventForDay) {
    modalElements.eventText.innerText = eventForDay.title;
    modalElements.deleteEventModal.style.display = 'block';
  } else {
    modalElements.newEventModal.style.display = 'block';
  }

  modalElements.backDrop.style.display = 'block';
}

/**
 * @param {ModalElements} modalElements
 * @param {import('../main.js').CalendarControllers} calendarControllers
 * @param {import('../de100-calender/index.js').CalendarState} calendar
 */
export function closeModal(modalElements, calendarControllers, calendar) {
  modalElements.eventTitleInput.classList.remove('error');
  modalElements.newEventModal.style.display = 'none';
  modalElements.deleteEventModal.style.display = 'none';
  modalElements.backDrop.style.display = 'none';
  modalElements.eventTitleInput.value = '';
  calendarControllers.dateClicked.set(null);
  // buildCurrentCalendarView(calendar, { events });
}
/**
 * @param {{
 *  calendar: import('../de100-calender/index.js').CalendarState;
 *  modalElements: ModalElements;
 *  containerElement: HTMLElement;
 *  calendarControllers: import('../main.js').CalendarControllers;
 * }} params
 */
export function saveEvent(params) {
  if (params.modalElements.eventTitleInput.value) {
    params.modalElements.eventTitleInput.classList.remove('error');

    const dateClicked = params.calendarControllers.dateClicked.get();
    if (!dateClicked) {
      throw new Error('Date clicked is not set');
    }

    const dayElem = isElementOrThrow(
      /** @type {HTMLElement} */
      (params.containerElement.querySelector(`[data-key="${params.calendar.formatDateToKey(dateClicked)}"]`)),
      "Selected element doesn't exist",
    );
    const eventDiv = document.createElement('div');
    eventDiv.classList.add('de100-calendar-event-day-item');
    eventDiv.innerText = params.modalElements.eventTitleInput.value;
    dayElem.appendChild(eventDiv);

    const _events = params.calendarControllers.events.get();
    // lol
    // It's mutable since it's a reference but it's not a big deal since I set right after so that it's saved to local storage
    _events.push({
      id: crypto.randomUUID(),
      date: params.calendar.formatDateToKey(dateClicked),
      title: params.modalElements.eventTitleInput.value,
    });
    params.calendarControllers.events.set(_events);

    closeModal(params.modalElements, params.calendarControllers, params.calendar);
  } else {
    params.modalElements.eventTitleInput.classList.add('error');
  }
}

/**
 * @param {{
 *  calendar: import('../de100-calender/index.js').CalendarState;
 *  modalElements: ModalElements;
 *  containerElement: HTMLElement;
 *  calendarControllers: import('../main.js').CalendarControllers;
 * }} params
 */
export function deleteEvent(params) {
  const dateClicked = params.calendarControllers.dateClicked.get();
  if (!dateClicked) {
    throw new Error('Date clicked is not set');
  }

  const dayElem = isElementOrThrow(
    params.containerElement.querySelector(`[data-key="${params.calendar.formatDateToKey(dateClicked)}"]`),
    "Selected element doesn't exist",
  );

  const dayEventItemElem = isElementOrThrow(
    dayElem.querySelector('.de100-calendar-event-day-item'),
    "Event day element doesn't exist",
  );
  dayElem.removeChild(dayEventItemElem);

  let _events = params.calendarControllers.events.get();
  const dateKey = params.calendar.formatDateToKey(dateClicked);
  params.calendarControllers.events.set(_events.filter((e) => e.date !== dateKey));

  closeModal(params.modalElements, params.calendarControllers, params.calendar);
}

/**
 * @typedef {{
 *  saveButton: HTMLButtonElement,
 *  cancelButton: HTMLButtonElement,
 *  deleteButton: HTMLButtonElement,
 *  closeButton: HTMLButtonElement,
 *  newEventModal: HTMLElement,
 *  deleteEventModal: HTMLElement,
 *  backDrop: HTMLElement,
 *  eventTitleInput: HTMLInputElement,
 *  eventText: HTMLElement,
 * }} ModalElements
 */

/** @returns {ModalElements} */
export function getCalendarModalElements() {
  const newEventModal = isElementOrThrow(
    /** @type {HTMLElement} */ (document.body.querySelector('.de100-temp-cm-new-event-modal')),
    'New event modal element is not found',
  );
  const backDrop = isElementOrThrow(
    /** @type {HTMLElement} */ (document.body.querySelector('.de100-temp-cm-back-drop')),
    'Back drop element is not found',
  );
  const eventTitleInput = isElementOrThrow(
    /** @type {HTMLInputElement} */ (document.body.querySelector('.de100-temp-cm-event-title-input')),
    'Event title input element is not found',
  );
  const eventText = isElementOrThrow(
    /** @type {HTMLElement} */ (document.body.querySelector('.de100-temp-cm-event-text')),
    'Event text element is not found',
  );
  const deleteEventModal = isElementOrThrow(
    /** @type {HTMLElement} */ (document.body.querySelector('.de100-temp-cm-delete-event-modal')),
    'Delete event modal element is not found',
  );
  const saveButton = isElementOrThrow(
    /** @type {HTMLButtonElement} */ (document.body.querySelector('.de100-temp-cm-save-button')),
    'Save button element is not found',
  );
  const cancelButton = isElementOrThrow(
    /** @type {HTMLButtonElement} */ (document.body.querySelector('.de100-temp-cm-cancel-button')),
    'Cancel button element is not found',
  );
  const deleteButton = isElementOrThrow(
    /** @type {HTMLButtonElement} */ (document.body.querySelector('.de100-temp-cm-delete-button')),
    'Delete button element is not found',
  );
  const closeButton = isElementOrThrow(
    /** @type {HTMLButtonElement} */ (document.body.querySelector('.de100-temp-cm-close-button')),
    'Close button element is not found',
  );

  return {
    newEventModal,
    eventTitleInput,
    deleteEventModal,
    eventText,
    backDrop,
    //
    saveButton,
    cancelButton,
    deleteButton,
    closeButton,
  };
}

export function injectCalendarModal() {
  const newEventModal = document.createElement('div');
  newEventModal.className = 'de100-temp-cm de100-temp-cm-new-event-modal';
  newEventModal.innerHTML = `
		<h2>New Event</h2>

		<input class="de100-temp-cm-event-title-input" placeholder="Event Title" />

		<button class="de100-temp-cm-save-button">Save</button>
		<button class="de100-temp-cm-cancel-button">Cancel</button>
	`;
  document.body.append(newEventModal);

  const deleteEventModal = document.createElement('div');
  deleteEventModal.className = 'de100-temp-cm de100-temp-cm-delete-event-modal';
  deleteEventModal.innerHTML = `
		<h2>Event</h2>

		<p class="de100-temp-cm-event-text"></p>

		<button class="de100-temp-cm-delete-button">Delete</button>
		<button class="de100-temp-cm-close-button">Close</button>
	`;
  document.body.append(deleteEventModal);

  const backDrop = document.createElement('div');
  backDrop.className = 'de100-temp-cm-back-drop';
  document.body.append(backDrop);
}
