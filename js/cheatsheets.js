/*
  CHEAT SHEETS DATA
  =================
  This is the only file you need to edit to add a cheat sheet.

  To add a new one:
    1. Make a folder:  images/cheatsheets/<folder>/
    2. Put the slides in it named 1.png, 2.png, 3.png ... (slide 1 is the card cover)
    3. Add one entry to CHEATSHEETS below.

  Fields:
    id        unique, lowercase-with-dashes. Used in the link: cheat-sheets.html#<id>
              and in the PDF name: <id>-cheat-sheet.pdf. Don't change it after
              publishing, or old shared links stop working.
    title     the name shown under the card (search looks at this)
    category  one of the ids in CHEATSHEET_CATEGORIES: colors, fonts, composition, mistakes
    slides    how many slides are in the folder
    folder    the folder name inside images/cheatsheets/
    pdf       (optional) a ready PDF file inside the same folder, e.g. 'color-match.pdf',
              or a path from the site root if it lives elsewhere, e.g. 'files/carousels/fonts.pdf'.
              If there's none, the PDF is made from the slides in the browser.
    cover     (optional) a separate image for the card cover, e.g. 'images/carousels/fonts-cover.webp'.
              If there's none, slide 1.png is the cover.
    isNew     (optional) true shows the "NEW" label on the card

  Cards appear in the same order as in this list.
*/

window.CHEATSHEET_CATEGORIES = [
  { id: 'colors',      title: 'Colors' },
  { id: 'fonts',       title: 'Fonts' },
  { id: 'composition', title: 'Composition' },
  { id: 'mistakes',    title: 'Common Mistakes' }
];

window.CHEATSHEETS = [
  {
    id: 'color-match',
    title: 'Color match',
    category: 'colors',
    slides: 7,
    folder: 'color-match',
    isNew: true
  },
  {
    id: 'brand-colors',
    title: 'Brand colors',
    category: 'colors',
    slides: 6,
    folder: 'brand-colors'
  },
  {
    id: 'contrasts',
    title: 'Contrasts',
    category: 'colors',
    slides: 5,
    folder: 'contrasts'
  },
  {
    id: 'color-wheel',
    title: 'Color wheel',
    category: 'colors',
    slides: 9,
    folder: 'color-wheel'
  },
  {
    id: 'complementary-colors',
    title: 'Complementary colors',
    category: 'colors',
    slides: 6,
    folder: 'complementary-colors'
  },
  {
    id: 'fonts',
    title: 'Fonts',
    category: 'fonts',
    slides: 5,
    folder: 'fonts',
    pdf: 'files/carousels/fonts.pdf',
    cover: 'images/carousels/fonts-cover.webp'
  },
  {
    id: 'just-use-2-fonts',
    title: 'Just use 2 fonts',
    category: 'fonts',
    slides: 10,
    folder: 'just-use-2-fonts',
    pdf: 'files/carousels/just-use-2-fonts.pdf',
    cover: 'images/carousels/just-use-2-fonts-cover.webp'
  },
  {
    id: 'sans-serif-vs-serif',
    title: 'Sans serif vs serif',
    category: 'fonts',
    slides: 6,
    folder: 'sans-serif-vs-serif',
    pdf: 'files/carousels/sans-serif-vs-serif.pdf',
    cover: 'images/carousels/sans-serif-vs-serif-cover.webp'
  }
];
