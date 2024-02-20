import './style.css';
import { isElementOrThrow } from '../utils.js';

/**
 * @typedef {{
 *  onDayClick: (dateClicked: Date, calendar: CalendarState) => void;
 *  onInit: (calendar: CalendarState) => void;
 *  onDayInit: (day: { key: string, elem: HTMLElement, containerElem: HTMLElement; date: Date }, calendar: CalendarState) => void;
 *  onCalendarViewBuildStart?: (calendar: CalendarState) => void;
 *  onCalendarViewBuildEnd?: (calendar: CalendarState) => void;
 * }} CalendarActions
 */

/**
 * @typedef {{
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
 *
 * @typedef {{
 *  startOfWeek: Date;
 *  endOfWeek: Date;
 *  days: {
 *   weekday: string;
 * 	 day: number;
 *   month: number;
 *   year: number;
 *   date: Date;
 *  }[]
 * }} WeekMetadata
 *
 * @typedef {{
 *  firstDay: Date;
 *  firstWeekday: string;
 *  firstWeekdayIndex: number;
 *  lastDay: Date;
 *  lastWeekday: string;
 *  lastWeekdayIndex: number;
 *  daysSize: number;
 *  isLeapYear: boolean;
 * }} YearMetadata
 */

/**
 * @typedef {{
 * 	dt: Date;
 * 	day: number;
 * 	month: number;
 * 	year: number;
 * 	currentWeekday: string;
 * 	currentWeekdayIndex: number;
 * 	get monthMetadata(): MonthMetadata
 *  get weekMetadata(): WeekMetadata
 *  get yearMetadata(): YearMetadata
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
  const currentWeekdayIndex = dt.getDay();

  // remember to get days in month, we go to the next month and then go back a day by using 0 as the day
  const daysInMonthSize = new Date(year, month + 1, 0).getDate();

  /** @type {YearMetadata | null} */
  let yearMetadataMemo = null;

  /** @type {MonthMetadata | null} */
  let monthMetadataMemo = null;

  /** @type {WeekMetadata | null} */
  let weekMetadataMemo = null;

  return {
    dt,
    day,
    month,
    year,
    currentWeekday,
    currentWeekdayIndex,
    get yearMetadata() {
      if (yearMetadataMemo) {
        return yearMetadataMemo;
      }

      const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0); // new Date(year,1,29).getMonth() === 1

      const firstDay = new Date(year, 0, 1);
      const firstWeekdayIndex = firstDay.getDay();
      const firstWeekday = weekdays[firstWeekdayIndex];

      const lastDay = new Date(year + 1, 0, 0); // new Date(year, 11, 31);
      const lastWeekdayIndex = lastDay.getDay();
      const lastWeekday = weekdays[lastWeekdayIndex];

      yearMetadataMemo = {
        firstDay,
        firstWeekday,
        firstWeekdayIndex,
        lastDay,
        lastWeekday,
        lastWeekdayIndex,
        daysSize: isLeapYear ? 366 : 365,
        isLeapYear,
      };

      return yearMetadataMemo;
    },
    get monthMetadata() {
      if (monthMetadataMemo) {
        return monthMetadataMemo;
      }

      const firstDay = new Date(year, month, 1);
      const firstWeekdayIndex = firstDay.getDay();
      const firstWeekday = weekdays[firstWeekdayIndex];
      // const daysSize = new Date(year, month + 1, 0).getDate();

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
        daysSize: daysInMonthSize,
        monthBeforeMetadata,
        paddingDaysBefore,
        monthAfterMetadata,
        paddingDaysAfter,
      };

      return monthMetadataMemo;
    },
    get weekMetadata() {
      if (weekMetadataMemo) {
        return weekMetadataMemo;
      }

      const startOfWeek = new Date(year, month, day - currentWeekdayIndex);
      const endOfWeek = new Date(year, month, day + (6 - currentWeekdayIndex));

      const startOfWeekDay = startOfWeek.getDate();

      /** @type {WeekMetadata['days']} */
      const days = Array.from({ length: 7 });

      let i = 0;
      for (; i < days.length; i++) {
        const date = new Date(year, month, startOfWeekDay + i);

        days[i] = {
          weekday: weekdays[i],
          day: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
          date,
        };
      }

      weekMetadataMemo = {
        startOfWeek,
        endOfWeek,
        days,
      };

      return weekMetadataMemo;
    },
  };
}

/**
 * @param {{
 * 	day: number,
 * 	isCurrentDay: boolean,
 * 	movedByFromCurrentDate: number,
 * 	calendar: CalendarState,
 * 	date: Date,
 *  actions: CalendarActions
 *  dayElemContainerClasses: string[]
 *  dayElemClasses: string[]
 * }} params
 */
function calendarDayElemBuilder(params) {
  const dayElemContainer = document.createElement('div');
  dayElemContainer.classList.add(...params.dayElemContainerClasses);

  const dayElem = document.createElement('div');
  dayElem.classList.add(...params.dayElemClasses);

  // dayElem.innerText = params.day.toString();

  const dayKey = params.calendar.formatDateToKey(params.date);
  dayElem.dataset.key = dayKey;

  dayElemContainer.appendChild(dayElem);

  if (params.isCurrentDay) {
    dayElem.classList.add('de100-calendar-current-day');
  }

  dayElem.addEventListener('click', () => {
    params.actions.onDayClick(params.date, params.calendar);
  });

  params.calendar.elements.calendarDaysContainer.appendChild(dayElemContainer);

  params.actions.onDayInit(
    { containerElem: dayElemContainer, elem: dayElem, key: dayKey, date: params.date },
    params.calendar,
  );
}

/**
 * @param {CalendarState} calendar
 * @param {{ moveMonthlyBy?: number, actions: CalendarActions }} options
 */
function buildCurrentCalendarView(calendar, options) {
  options.actions.onCalendarViewBuildStart?.(calendar);

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
    const day = info.monthMetadata.monthBeforeMetadata.lastDayDate.getDate() - info.monthMetadata.paddingDaysBefore + i;
    const dayDate = new Date(
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
      dayElemContainerClasses: ['de100-calendar-day-container', 'de100-calendar-padding-day-container'],
      dayElemClasses: ['de100-calendar-day', 'de100-calendar-padding-day'],
      date: dayDate,
      movedByFromCurrentDate: beforeMovedByFromCurrentDate,
      actions: options.actions,
    });
    /*******************************/
  }

  // days
  i = info.monthMetadata.paddingDaysBefore + 1;
  const currentMovedByFromCurrentDate = (info.year - currentYear) * 12 + (info.month - currentMonth);
  const daysLoopMax = info.monthMetadata.paddingDaysBefore + info.monthMetadata.daysSize;
  for (; i <= daysLoopMax; i++) {
    const day = i - info.monthMetadata.paddingDaysBefore;
    const dayDate = new Date(info.year, info.month, day);
    const isCurrentDay = currentDay === day && currentYear === info.year && currentMonth === info.month;

    /*******************************/
    calendarDayElemBuilder({
      calendar,
      isCurrentDay,
      day,
      dayElemContainerClasses: ['de100-calendar-day-container', 'de100-calendar-view-day-container'],
      dayElemClasses: ['de100-calendar-day', 'de100-calendar-view-day'],
      date: dayDate,
      movedByFromCurrentDate: currentMovedByFromCurrentDate,
      actions: options.actions,
    });
    /*******************************/
  }

  // padding days after
  i = 0;
  const afterMovedByFromCurrentDate =
    (info.monthMetadata.monthAfterMetadata.year - currentYear) * 12 +
    (info.monthMetadata.monthAfterMetadata.month - currentMonth) +
    1;
  const daysAfterLoopMax = info.monthMetadata.paddingDaysAfter + 1;
  for (; i < daysAfterLoopMax; i++) {
    const day = i + 1;
    const dayDate = new Date(
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
      dayElemContainerClasses: ['de100-calendar-day-container', 'de100-calendar-padding-day-container'],
      dayElemClasses: ['de100-calendar-day', 'de100-calendar-padding-day'],
      date: dayDate,
      movedByFromCurrentDate: afterMovedByFromCurrentDate,
      actions: options.actions,
    });
    /*******************************/
  }

  calendar.currentViewDate = dt;

  options.actions.onCalendarViewBuildEnd?.(calendar);
}

/** @type {CalendarState['formatDateToKey']} */
const defaultFormatDateToKey = (date) => date.toISOString();

/** @param {HTMLElement | null | undefined} baseElement  */
export function injectCalendar(baseElement) {
  if (!baseElement) {
    throw new Error('Base element is not found');
  }

  baseElement.innerHTML = `<div class="de100-calendar-container">
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
}

/**
 * @param {{
 *  baseElement: HTMLElement | null | undefined
 *  formatDateToKey?: (date: Date) => string
 *  initialViewDate?: Date
 *  actions: CalendarActions
 * }} params
 */
export function initCalendar(params) {
  if (!params.baseElement) {
    throw new Error('Base element is not found');
  }

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
