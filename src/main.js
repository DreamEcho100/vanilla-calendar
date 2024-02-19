import './style.css';
import {
  closeModal,
  saveEvent,
  deleteEvent,
  openModal,
  getCalendarModalElements,
  injectCalendarModal,
} from './modal/index.js';
import { isElementOrThrow } from './utils.js';
import { setupCalendar } from './de100-calender/index.js';

/**
 * @typedef {{
 * 	id: string;
 * 	title: string;
 * 	date: string;
 * }} CalendarEvent
 */

/**
 * @typedef {{
 *  set: (events: CalendarEvent[]) => void;
 *  get: () => CalendarEvent[];
 * }} CalendarEventsController
 *
 * @typedef {{
 *  set: (newDateClicked: Date | null) => void;
 *  get: () => Date | null;
 * }} DateClickedController
 *
 * @typedef {{
 *  events: CalendarEventsController;
 *  dateClicked: DateClickedController;
 * }} CalendarControllers
 */

injectCalendarModal();

const baseElement = isElementOrThrow(
  /** @type {HTMLDivElement} */ (document.querySelector('#app')),
  "App element doesn't exist",
);

const modalElements = getCalendarModalElements();

const eventsLS = localStorage.getItem('events');
let events = /** @type {CalendarEvent[]} */ (eventsLS ? JSON.parse(eventsLS) : []);
/** @type {CalendarEventsController} */
const eventsController = {
  get() {
    return events;
  },
  set(newEvents) {
    events = newEvents;
    localStorage.setItem('events', JSON.stringify(events));
  },
};

/** @type {Date | null} */
let dateClicked = null;
/** @type {DateClickedController} */
const dateClickedController = {
  get() {
    return dateClicked;
  },
  set(newDateClicked) {
    dateClicked = newDateClicked;
  },
};

/** @type {CalendarControllers} */
const calendarControllers = {
  dateClicked: dateClickedController,
  events: eventsController,
};

/** @type {import('./de100-calender/index.js').CalendarActions} */
const actions = {
  onDayClick(dayClicked, calendar) {
    calendarControllers.dateClicked.set(dayClicked);
    openModal(calendar, modalElements, calendarControllers);
  },
  onInit(calendar) {
    modalElements.saveButton.addEventListener('click', () => {
      const dateClicked = calendarControllers.dateClicked.get();
      if (!dateClicked) {
        return;
      }
      saveEvent(calendar, modalElements, calendarControllers);
    });
    modalElements.cancelButton.addEventListener('click', () => {
      closeModal(calendar, modalElements, calendarControllers);
    });
    modalElements.deleteButton.addEventListener('click', () => {
      const dateClicked = calendarControllers.dateClicked.get();
      if (!dateClicked) {
        return;
      }
      deleteEvent(calendar, modalElements, calendarControllers);
    });
    modalElements.closeButton.addEventListener('click', () => {
      closeModal(calendar, modalElements, calendarControllers);
    });
  },
  onDayInit(dayKey, dayElem, calendar) {
    // lol
    // needs to be refactored so that it can accept `events` mor generically
    const eventForDay = eventsController.get().find((e) => e.date === dayKey);

    if (eventForDay) {
      const eventDiv = document.createElement('div');
      eventDiv.classList.add('de100-calendar-event-day');
      eventDiv.innerText = eventForDay.title;
      dayElem.appendChild(eventDiv);
    }
  },
};

setupCalendar({ baseElement, actions });
