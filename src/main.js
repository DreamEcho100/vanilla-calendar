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
import { injectCalendar, initCalendar } from './de100-calender/index.js';

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

const baseElement = isElementOrThrow(
  /** @type {HTMLDivElement} */ (document.querySelector('#app')),
  "App element doesn't exist",
);

injectCalendarModal();
injectCalendar(baseElement);

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

      saveEvent({ calendar, containerElement: baseElement, modalElements, calendarControllers });
    });
    modalElements.cancelButton.addEventListener('click', () => {
      closeModal(modalElements, calendarControllers, calendar);
    });
    modalElements.deleteButton.addEventListener('click', () => {
      const dateClicked = calendarControllers.dateClicked.get();
      if (!dateClicked) {
        return;
      }

      deleteEvent({ calendar, containerElement: baseElement, modalElements, calendarControllers });
    });
    modalElements.closeButton.addEventListener('click', () => {
      closeModal(modalElements, calendarControllers, calendar);
    });
  },
  onDayInit(day, calendar) {
    day.elem.innerText = day.date.getDate().toString();

    // lol
    // needs to be refactored so that it can accept `events` mor generically
    const eventForDay = eventsController.get().find((e) => e.date === day.key);

    if (eventForDay) {
      const eventDiv = document.createElement('div');
      eventDiv.classList.add('de100-calendar-event-day-item');
      eventDiv.innerText = eventForDay.title;
      day.elem.appendChild(eventDiv);
    }
  },
  onCalendarViewBuildStart(calendar) {
    const dateClicked = calendarControllers.dateClicked.get();
    if (dateClicked) {
      closeModal(modalElements, calendarControllers, calendar);
    }
  },
};

initCalendar({ baseElement, actions });
