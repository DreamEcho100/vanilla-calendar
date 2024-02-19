import './style.css';
import { isElementOrThrow } from '../utils.js';

/**
 * @typedef {{
 *  onDayClick: (dateClicked: Date, calendar: CalendarState) => void;
 *  onInit: (calendar: CalendarState) => void;
 *  onDayInit: (dayKey: string, dayElem: HTMLElement, calendar: CalendarState) => void;
 * }} CalendarActions
 */

/**
 * @typedef {{
 *  parentElement: HTMLElement,
 *  calendarDaysContainer: HTMLElement,
 *  monthlyDisplay: HTMLElement,
 *  monthMovementBackButton: HTMLButtonElement,
 *  monthMovementResetButton: HTMLButtonElement,
 *  monthMovementNextButton: HTMLButtonElement,
 * }} CalendarElements
 */

/**
 * @typedef {{
 * 	elements: CalendarElements;
 *  formatDateToKey: (date: Date) => string;
 *  currentViewDate: Date;
 *  initialViewDate: Date;
 * }} CalendarState
 */

/**
 * @typedef {{
 * 	firstDay: Date;
 * 	firstWeekday: string;
 * 	firstWeekdayIndex: number;
 * 	daysSize: number;
 *  monthBeforeMetadata: {
 * 		lastDayDate: Date;
 * 		lastDay: number;
 * 		lastWeekday: string;
 * 		lastWeekdayIndex: number;
 * 		month: number;
 * 		year: number;
 * 	};
 * 	paddingDaysBefore: number;
 *  monthAfterMetadata: {
 * 		firstDayDate: Date;
 * 		firstDay: number;
 * 		firstWeekday: string;
 * 		firstWeekdayIndex: number;
 * 		month: number;
 * 		year: number;
 * 	};
 *  paddingDaysAfter: number;
 * }} MonthMetadata
 */

/**
 * @typedef {{
 * 	dt: Date;
 * 	day: number;
 * 	month: number;
 * 	year: number;
 * 	currentWeekday: string;
 * 	CurrentWeekdayIndex: number;
 * 	get monthMetadata(): MonthMetadata
 * }} DateInfo
 */

/**
 * @param {HTMLElement | null | undefined} baseElement
 * @returns {CalendarElements}
 */
function getCalendarElements(baseElement) {
  if (!baseElement) {
    throw new Error('Base element is not found');
  }

  const calendarDaysContainer = isElementOrThrow(
    /** @type {HTMLElement} */ (baseElement.querySelector('.de100-calendar-days-container')),
    'Calendar element is not found',
  );
  const monthlyDisplay = isElementOrThrow(
    /** @type {HTMLElement} */ (baseElement.querySelector('.de100-calendar-month-display')),
    'Monthly display element is not found',
  );
  const monthMovementBackButton = isElementOrThrow(
    /** @type {HTMLButtonElement} */ (baseElement.querySelector('.de100-calendar-month-movement-back-button')),
    'Month movement back button element is not found',
  );
  const monthMovementResetButton = isElementOrThrow(
    /** @type {HTMLButtonElement} */ (baseElement.querySelector('.de100-calendar-month-movement-reset-button')),
    'Month movement reset button element is not found',
  );
  const monthMovementNextButton = isElementOrThrow(
    /** @type {HTMLButtonElement} */ (baseElement.querySelector('.de100-calendar-month-movement-next-button')),
    'Month movement next button element is not found',
  );

  return {
    parentElement: baseElement,
    calendarDaysContainer,
    monthlyDisplay,
    monthMovementBackButton,
    monthMovementResetButton,
    monthMovementNextButton,
  };
}

/** @type {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']} */
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * @param {Date} dt
 * @returns {DateInfo}
 */
function getDateInfo(dt) {
  const day = dt.getDate();
  // remember that month is 0-indexed
  const month = dt.getMonth();
  const year = dt.getFullYear();

  const currentWeekday = new Intl.DateTimeFormat('en-us', {
    weekday: 'long',
  }).format(dt);
  const CurrentWeekdayIndex = dt.getDay();

  /** @type {MonthMetadata | null} */
  let monthMetadataMemo = null;

  return {
    dt,
    day,
    month,
    year,
    currentWeekday,
    CurrentWeekdayIndex,
    get monthMetadata() {
      if (monthMetadataMemo) {
        return monthMetadataMemo;
      }

      const firstDay = new Date(year, month, 1);
      const firstWeekdayIndex = firstDay.getDay();
      const firstWeekday = weekdays[firstWeekdayIndex];
      // remember to get days in month, we go to the next month and then go back a day by using 0 as the day
      const daysSize = new Date(year, month + 1, 0).getDate();

      const monthBeforeLastDayDate = new Date(year, month, 0);
      const monthBeforeLastWeekdayIndex = monthBeforeLastDayDate.getDay();
      /** @type {MonthMetadata['monthBeforeMetadata']} */
      const monthBeforeMetadata = {
        lastDayDate: monthBeforeLastDayDate,
        lastDay: monthBeforeLastDayDate.getDate(),
        lastWeekdayIndex: monthBeforeLastWeekdayIndex,
        lastWeekday: weekdays[monthBeforeLastWeekdayIndex],
        month: monthBeforeLastDayDate.getMonth(),
        year: monthBeforeLastDayDate.getFullYear(),
      };
      const paddingDaysBefore = monthBeforeMetadata.lastWeekdayIndex;

      const monthAfterFirstDayDate = new Date(year, month + 1);
      const monthAfterFirstWeekdayIndex = monthAfterFirstDayDate.getDay();
      /** @type {MonthMetadata['monthAfterMetadata']} */
      const monthAfterMetadata = {
        firstDayDate: monthAfterFirstDayDate,
        firstDay: monthAfterFirstDayDate.getDate(),
        firstWeekdayIndex: monthAfterFirstWeekdayIndex,
        firstWeekday: weekdays[firstWeekdayIndex],
        month: monthAfterFirstDayDate.getMonth(),
        year: monthAfterFirstDayDate.getFullYear(),
      };
      const paddingDaysAfter = weekdays.length - 1 - monthAfterMetadata.firstWeekdayIndex;

      monthMetadataMemo = {
        firstDay,
        firstWeekday,
        firstWeekdayIndex,
        daysSize,
        monthBeforeMetadata,
        paddingDaysBefore,
        monthAfterMetadata,
        paddingDaysAfter,
      };

      return monthMetadataMemo;
    },
  };
}

/**
 * @param {{
 * 	day: number,
 * 	isCurrentDay: boolean,
 * 	movedByFromCurrentDate: number,
 * 	dayElem: HTMLElement,
 * 	calendar: CalendarState,
 * 	daySquareDate: Date,
 *  actions: CalendarActions
 * }} params
 */
function calendarDayElemBuilder(params) {
  if (params.isCurrentDay) {
    params.dayElem.classList.add('de100-calendar-current-day');
  }
  const dayKey = params.calendar.formatDateToKey(params.daySquareDate);
  params.dayElem.dataset.key = dayKey;

  params.dayElem.addEventListener('click', () => {
    params.actions.onDayClick(params.daySquareDate, params.calendar);
  });

  params.actions.onDayInit(dayKey, params.dayElem, params.calendar);
}

/**
 * @param {CalendarState} calendar
 * @param {{ moveMonthlyBy?: number, actions: CalendarActions }} options
 */
function buildCurrentCalendarView(calendar, options) {
  // onCalendarViewBuild
  // calendar.setDateClicked(null);
  calendar.elements.calendarDaysContainer.innerHTML = '';
  const dt = new Date(calendar.currentViewDate);
  if (typeof options.moveMonthlyBy === 'number' && options.moveMonthlyBy !== 0) {
    dt.setMonth(dt.getMonth() + options.moveMonthlyBy);
  }

  const info = getDateInfo(dt);

  calendar.elements.monthlyDisplay.textContent = Intl.DateTimeFormat('en-us', {
    year: 'numeric',
    month: 'long',
  }).format(dt);

  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  let i = 0;

  // padding days before
  i = 0;
  const beforeMovedByFromCurrentDate =
    (info.monthMetadata.monthBeforeMetadata.year - currentYear) * 12 +
    (info.monthMetadata.monthBeforeMetadata.month - currentMonth) -
    1;
  const daysBeforeLoopMax = info.monthMetadata.paddingDaysBefore + 1;
  for (; i < daysBeforeLoopMax; i++) {
    const dayElem = document.createElement('div');
    dayElem.classList.add('de100-calendar-day', 'de100-calendar-padding-day');

    const day = info.monthMetadata.monthBeforeMetadata.lastDayDate.getDate() - info.monthMetadata.paddingDaysBefore + i;
    dayElem.innerText = day.toString();

    const daySquareDate = new Date(
      info.monthMetadata.monthBeforeMetadata.year,
      info.monthMetadata.monthBeforeMetadata.month,
      day,
    );
    const isCurrentDay =
      currentDay === day &&
      currentYear === info.monthMetadata.monthBeforeMetadata.year &&
      currentMonth === info.monthMetadata.monthBeforeMetadata.month;

    /*******************************/
    calendarDayElemBuilder({
      calendar,
      isCurrentDay,
      day,
      dayElem,
      daySquareDate,
      movedByFromCurrentDate: beforeMovedByFromCurrentDate,
      actions: options.actions,
    });
    /*******************************/

    calendar.elements.calendarDaysContainer.appendChild(dayElem);
  }

  // days
  i = info.monthMetadata.paddingDaysBefore + 1;
  const currentMovedByFromCurrentDate = (info.year - currentYear) * 12 + (info.month - currentMonth);
  const daysLoopMax = info.monthMetadata.paddingDaysBefore + info.monthMetadata.daysSize;
  for (; i <= daysLoopMax; i++) {
    const daySquare = document.createElement('div');
    daySquare.classList.add('de100-calendar-day', 'de100-calendar-main-day');

    const day = i - info.monthMetadata.paddingDaysBefore;
    daySquare.innerText = day.toString();

    const daySquareDate = new Date(info.year, info.month, day);
    const isCurrentDay = currentDay === day && currentYear === info.year && currentMonth === info.month;

    /*******************************/
    calendarDayElemBuilder({
      calendar,
      isCurrentDay,
      day,
      dayElem: daySquare,
      daySquareDate,
      movedByFromCurrentDate: currentMovedByFromCurrentDate,
      actions: options.actions,
    });
    /*******************************/

    calendar.elements.calendarDaysContainer.appendChild(daySquare);
  }

  // padding days after
  i = 0;
  const afterMovedByFromCurrentDate =
    (info.monthMetadata.monthAfterMetadata.year - currentYear) * 12 +
    (info.monthMetadata.monthAfterMetadata.month - currentMonth) +
    1;
  const daysAfterLoopMax = info.monthMetadata.paddingDaysAfter + 1;
  for (; i < daysAfterLoopMax; i++) {
    const daySquare = document.createElement('div');
    daySquare.classList.add('de100-calendar-day', 'de100-calendar-padding-day');

    const day = i + 1;
    daySquare.innerText = day.toString();

    const daySquareDate = new Date(
      info.monthMetadata.monthAfterMetadata.year,
      info.monthMetadata.monthAfterMetadata.month,
      day,
    );
    const isCurrentDay =
      currentDay === day &&
      currentYear === info.monthMetadata.monthAfterMetadata.year &&
      currentMonth === info.monthMetadata.monthAfterMetadata.month;

    /*******************************/
    calendarDayElemBuilder({
      calendar,
      isCurrentDay,
      day,
      dayElem: daySquare,
      daySquareDate,
      movedByFromCurrentDate: afterMovedByFromCurrentDate,
      actions: options.actions,
    });
    /*******************************/

    calendar.elements.calendarDaysContainer.appendChild(daySquare);
  }

  calendar.currentViewDate = dt;
}

/** @type {CalendarState['formatDateToKey']} */
const defaultFormatDateToKey = (date) => date.toISOString();

/**
 * @param {{
 *  baseElement: HTMLElement | null | undefined
 *  formatDateToKey?: (date: Date) => string
 *  initialViewDate?: Date
 *  actions: CalendarActions
 * }} params
 */
export function setupCalendar(params) {
  if (!params.baseElement) {
    throw new Error('Base element is not found');
  }

  params.baseElement.innerHTML = `<div class="de100-calendar-container">
	<div class="de100-calendar-header">
		<div class="de100-calendar-month-display"></div>
		<div>
			<button
				class="de100-calendar-month-movement-button de100-calendar-month-movement-back-button"
			>
				Back
			</button>
			<button
				class="de100-calendar-month-movement-button de100-calendar-month-movement-reset-button"
			>
				Reset
			</button>
			<button
				class="de100-calendar-month-movement-button de100-calendar-month-movement-next-button"
			>
				Next
			</button>
		</div>
	</div>

	<div class="de100-calendar-weekdays">
		<div>Sunday</div>
		<div>Monday</div>
		<div>Tuesday</div>
		<div>Wednesday</div>
		<div>Thursday</div>
		<div>Friday</div>
		<div>Saturday</div>
	</div>

	<div class="de100-calendar-days-container"></div>
</div>
`;

  const currentDate = new Date();

  const initialViewDate =
    params.initialViewDate ?? new Date(currentDate.getFullYear(), currentDate.getMonth() + 0, currentDate.getDate());
  const formatDateToKey = params.formatDateToKey ?? defaultFormatDateToKey;
  const elements = getCalendarElements(params.baseElement);

  /** @type {CalendarState} */
  const calendar = {
    elements,
    formatDateToKey,
    currentViewDate: initialViewDate,
    initialViewDate,
  };

  // init(calendar, initialDate);

  calendar.elements.calendarDaysContainer.innerHTML = '';

  let monthMovement = 0;
  // let currentDate = new Date(initialDate);

  buildCurrentCalendarView(calendar, {
    actions: params.actions,
  });

  calendar.elements.monthMovementBackButton.addEventListener('click', () => {
    monthMovement--;
    buildCurrentCalendarView(calendar, { moveMonthlyBy: -1, actions: params.actions });
  });

  calendar.elements.monthMovementResetButton.addEventListener('click', () => {
    monthMovement = 0;
    // calendar.currentViewDate = new Date(initialDate);
    calendar.currentViewDate = calendar.initialViewDate;
    buildCurrentCalendarView(calendar, { actions: params.actions });
  });

  calendar.elements.monthMovementNextButton.addEventListener('click', () => {
    monthMovement++;
    buildCurrentCalendarView(calendar, { moveMonthlyBy: 1, actions: params.actions });
  });

  params.actions.onInit(calendar);
}