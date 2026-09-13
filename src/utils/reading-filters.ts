export function initReadingFilters() {
  const list = document.querySelector<HTMLElement>('[data-reading-list]');
  if (!list || list.dataset.initialized) return;
  const search = list.querySelector<HTMLInputElement>('[data-book-search]')!;
  const year = list.querySelector<HTMLSelectElement>('[data-book-year]')!;
  const status = list.querySelector<HTMLElement>('[data-reading-results]')!;
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-book-search-text]'));
  function filter() {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      const text = normalize(card.dataset.bookSearchText || '');
      const cardYear = card.closest<HTMLElement>('[data-reading-year]')?.dataset.readingYear;
      card.hidden = (year.value !== '' && year.value !== cardYear) || !terms.every(term => text.includes(term));
      if (!card.hidden) visible++;
    }
    list!.querySelectorAll<HTMLElement>('.month-group, .year-group').forEach(group => {
      group.hidden = !group.querySelector('[data-book-search-text]:not([hidden])');
    });
    status.textContent = visible === 0 ? 'No books match. Try another title, author, or year.' : `${visible} ${visible === 1 ? 'book' : 'books'} shown`;
  }
  search.addEventListener('input', filter);
  year.addEventListener('change', filter);
  list.querySelector('[data-clear-filters]')!.addEventListener('click', () => {
    search.value = '';
    year.value = '';
    filter();
    search.focus();
  });
  list.dataset.initialized = 'true';
  list.querySelector<HTMLElement>('.reading-filters')!.hidden = false;
  filter();
}
