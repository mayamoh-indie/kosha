// Debt categories shared by the planner and home page. Icons are fixed markup, never user input.
const CATEGORIES = {
  credit_card: {label: 'Credit card', color: '#1a4f61', icon: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h4"/>'},
  line_of_credit: {label: 'Line of credit', color: '#397d70', icon: '<path d="M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18"/>'},
  student_loan: {label: 'Student loan', color: '#3d7fa3', icon: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>'},
  personal_loan: {label: 'Personal loan', color: '#69a8a9', icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 15-5 16 0"/>'},
  car_loan: {label: 'Car loan', color: '#5b7d9e', icon: '<path d="M3 16v-4l2-5h14l2 5v4z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>'},
  mortgage: {label: 'Mortgage', color: '#0f3440', icon: '<path d="M3 11l9-7 9 7M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'},
  other: {label: 'Other', color: '#8aa7ad', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 6v12M15 9.5c0-1.4-1.3-2-3-2s-3 .7-3 2 1.3 1.8 3 2.2 3 .9 3 2.3-1.3 2-3 2-3-.6-3-2"/>'},
};
const categoryOf = debt => CATEGORIES[debt.category] ? debt.category : 'other';
const iconSvg = key => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${CATEGORIES[key].icon}</svg>`;
