interface AttributeConfig {
  key: string | number;
  content: string | Partial<Content | Profile<Partial<Content>>>;
  highlight: boolean | string | Partial<Highlight | Profile<Partial<Highlight>>>;
  dot: boolean | string | Partial<Dot | Profile<Partial<Dot>>>;
  bar: boolean | string | Partial<Bar | Profile<Partial<Bar>>>;
  popover: PopoverConfig;
  dates: DateRangeSource[];
  customData: any;
  order: number;
}

interface Profile<T> {
  start: T;
  base: T;
  end: T;
  startEnd?: T;
}

interface Content {
  key: string | number;
  color: string;
  class: string | any[];
  style: Record<string, any>;
}

interface Highlight {
  key: string | number;
  color: string;
  class: string | any[];
  style: Record<string, any>;
  contentClass: string | any[];
  contentStyle: Record<string, any>;
  fillMode: "solid" | "light" | "outline";
}

interface Dot {
  key: string | number;
  color: string;
  class: string | any[];
  style: Record<string, any>;
}

interface Bar {
  key: string | number;
  color: string;
  class: string | any[];
  style: Record<string, any>;
}

type PopoverConfig = Partial<{
  label: string;
  customData: any;
  visibility: "click" | "hover" | "hover-focus" | "focus";
  placement: Placement;
  hideIndicator: boolean;
  isInteractive: boolean;
}>;

interface CalendarDay {
  id: string;
  dayIndex: number;
  day: number;
  dayFromEnd: number;
  weekday: number;
  weekdayOrdinal: number;
  weekdayOrdinalFromEnd: number;
  week: number;
  weekFromEnd: number;
  weeknumber: number;
  month: number;
  year: number;
  date: Date;
  position: number;
  label: string;
  ariaLabel: string;
  weekdayPosition: number;
  weekdayPositionFromEnd: number;
  weekPosition: number;
  isoWeeknumber: number;
  startDate: Date;
  noonDate: Date;
  endDate: Date;
  isToday: boolean;
  isFirstDay: boolean;
  isLastDay: boolean;
  isDisabled: boolean;
  isFocusable: boolean;
  inMonth: boolean;
  inPrevMonth: boolean;
  inNextMonth: boolean;
  onTop: boolean;
  onBottom: boolean;
  onLeft: boolean;
  onRight: boolean;
  classes: Array<string | Object>;
  locale: Locale;
}

interface CalendarWeek {
  id: string;
  week: number;
  weekPosition: number;
  weeknumber: number;
  isoWeeknumber: number;
  weeknumberDisplay?: number;
  days: CalendarDay[];
  title: string;
}

interface CalendarWeekday {
  weekday: number;
  label: string;
}

interface DarkModeClassConfig {
  selector: string;
  darkClass: string;
}

type DateRangeSource = DateRangeDate | [DateRangeDate, DateRangeDate] | Partial<DateRangeConfig>;

type DateRangeDate = Date | null;

interface DateRangeConfig {
  start: DateRangeDate;
  end: DateRangeDate;
  span: number;
  repeat: Partial<DateRepeatConfig>;
}

type DateSource = Date | string | number;

interface MoveOptions {
  position: number;
  view: CalendarView;
  transition: MoveTransition;
  force: boolean;
}

type MoveTransition = "none" | "fade" | "slide-v" | "slide-h";

type MoveTarget = DateSource | PageAddress;

interface PageAddress {
  day?: number;
  week?: number;
  month: number;
  year: number;
}

interface Page {
  id: string;
  day?: number;
  week?: number;
  month: number;
  year: number;
  view: PageView;
  trimWeeks: boolean;
  position: number;
  row: number;
  rowFromEnd: number;
  column: number;
  columnFromEnd: number;
  showWeeknumbers: boolean;
  showIsoWeeknumbers: boolean;
  weeknumberPosition: string;
  monthTitle: string;
  weekTitle?: string;
  dayTitle?: string;
  title: string;
  titlePosition: TitlePosition;
  shortMonthLabel: string;
  monthLabel: string;
  shortYearLabel: string;
  yearLabel: string;
  monthComps: MonthParts;
  prevMonthComps: MonthParts;
  nextMonthComps: MonthParts;
  days: CalendarDay[];
  weeks: CalendarWeek[];
  weekdays: CalendarWeekday[];
  viewDays: CalendarDay[];
  viewWeeks: CalendarWeek[];
}
