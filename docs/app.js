import AviFlow from '../src/AviFlow.js';

const app = {};
app.data = {
  content: [
    {
      label: 'Getting Started',
    },
    {
      label: 'Overview',
      page: 'main-overview'
    },
    {
      label: 'Features',
      page: 'main-features'
    },
    {
      label: 'Installation',
      page: 'main-installation'
    },
    {
      label: 'Quick Start',
      page: 'main-quick-start'
    },/*
    {
      label: 'Data flow grammar',
      page: 'main-api'
    },/*
    {
      label: 'Components',
      page: 'main-api'
    },
    {
      label: 'Event modifiers',
      page: 'main-api'
    },
    {
      label: 'Invalid flows',
      page: 'main-api'
    },
    {
      label: 'Custom actions',
      page: 'main-api'
    },
    {
      label: 'Properties',
      page: 'main-api'
    },*/
    {
      label: 'API Reference',
    },
    {
      label: 'AviFlow()',
      page: 'group'
    },
    {
      label: 'constructor',
      page: 'api-constructor'
    },
    {
      label: 'init',
      page: 'api-init'
    },
    {
      label: 'register',
      page: 'api-register'
    },
    {
      label: 'AviFlow.action',
      page: 'group'
    },
    {
      label: 'fetch',
      page: 'api-action-fetch'
    },
    {
      label: 'AviFlow.tools.element',
      page: 'group'
    },
    {
      label: 'appendContent',
      page: 'api-tools-element-appendContent'
    },
    {
      label: 'getDataset',
      page: 'api-tools-element-getDataset'
    },
    {
      label: 'getFormParams',
      page: 'api-tools-element-getFormParams'
    },
    {
      label: 'getParams',
      page: 'api-tools-element-getParams'
    },
    {
      label: 'parseContent',
      page: 'api-tools-element-parseContent'
    },
    {
      label: 'sanitizer',
      page: 'api-tools-element-sanitizer'
    },
    {
      label: 'setActiveContent',
      page: 'api-tools-element-setActiveContent'
    },
    {
      label: 'setContent',
      page: 'api-tools-element-setContent'
    },
    {
      label: 'togglePendingState',
      page: 'api-tools-element-togglePendingState'
    },
    {
      label: 'AviFlow.tools.text',
      page: 'group'
    },/*
    {
      label: 'toCamelCase',
      page: 'api-tools-text-constructor'
    },
    {
      label: 'toPascalCase',
      page: 'api-tools-text-constructor'
    },
    {
      label: 'toCapitalize',
      page: 'api-tools-text-constructor'
    },*/
    {
      label: 'Examples',
    },/*
    {
      id: 21,
      label: 'Full 3 items (event -> action -> target)',
      page: 'example-01_full_3_items'
    },
    {
      id: 22,
      label: '2 items, default event: click',
      page: 'example-02_only_2_items'
    },
    {
      id: 23,
      label: '2 items, no target use -|',
      page: 'example-03_2_items_no_target'
    },
    {
      id: 24,
      label: '1 item only - action',
      page: 'example-04_only_1_item'
    },
    {
      label: 'Contributing',
    },
    {
      label: 'Status',
    },
    {
      label: 'License',
    },
*/
  ]
}
app.actions = {
  getSection: async (triggerEl, flow) => {
    try {
      const params = {
        url: 'sections/' + (triggerEl.getAttribute('href') ?? triggerEl.dataset.section) + '.html',
        method: 'get',
        //responseType: 'text' 
      };
      const response = await flow.action.fetch(triggerEl, params);
      return response;
    } catch (error) {
      console.error("Error fetching file:", error);
      return null;
    }
  },


  goFoundNext: () => {
    app.fn.search.go(app.fn.search.cur + 1);
  },


  goFoundPrev: () => {
    app.fn.search.go(app.fn.search.cur - 1);
  },

  highlight: (triggerEl) => {
    app.fn.search.clearMarks();
    app.el.searchBoxCounter.textContent = '';

    let term = triggerEl.value;
    if (!term) return;

    const lower = term.toLowerCase();
    let nodes = [];
    let n;
    let walker = document.createTreeWalker(
      app.el.main,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (n) {
          return n.parentNode.closest('script,style')
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT
        }
      })

    while (n = walker.nextNode()) nodes.push(n);

    nodes.forEach(function (node) {
      const text = node.nodeValue;
      const low = text.toLowerCase();
      let i = low.indexOf(lower);

      if (i < 0) return;
      let frag = document.createDocumentFragment();
      let last = 0;
      while (i >= 0) {
        frag.appendChild(document.createTextNode(text.slice(last, i)));
        const markEl = document.createElement('mark');
        markEl.className = 'hl';
        markEl.textContent = text.slice(i, i + term.length);
        frag.appendChild(markEl);
        app.el.marks.push(markEl);
        last = i + term.length;
        i = low.indexOf(lower, last);
      }
      frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
    if (app.el.marks.length) {
      app.fn.search.go(0);
    } else {
      app.el.searchBoxCounter.textContent = '0/0';
    }
  },

  highlightKey: (triggerEl, flow, event) => {
    if (event.key === 'Enter' || event.key === 'F3') {
      event.preventDefault();
      app.fn.search.go(app.fn.search.cur + (event.shiftKey ? -1 : 1))
    } else if (event.key === 'Escape') {
      app.el.searchBox.value = '';
      app.actions.highlight(app.el.searchBox);
      app.el.searchBox.blur();
    }
  },

  scrollSpy: () => {
    if (!app.key.ticking) {
      app.key.ticking = true;
      requestAnimationFrame(app.fn.spy);
    }
  },


  setActive: (triggerEl) => {
    if (!triggerEl) return;

    if (triggerEl === app.el.activeLink) return;
    if (app.el.activeLink) {
      app.el.activeLink.classList.remove('active');
      app.el.activeLink.removeAttribute('aria-current');
    }
    app.el.activeLink = triggerEl;
    triggerEl.classList.add('active');
    triggerEl.setAttribute('aria-current', 'location');

    let r = triggerEl.getBoundingClientRect();
    let nr = app.el.nav.getBoundingClientRect();
    if (r.top < nr.top + 8 || r.bottom > nr.bottom - 8) {
      nav.scrollTop += r.top - nr.top - nr.height / 2 + r.height / 2;
    }
  },


  themeChange: (triggerEl) => {
    let choice = (app.el.html.dataset.theme === 'dark') ? 'light' : 'dark';
    app.fn.applyTheme(choice);
  },
}

app.examples = {
  // Action for Example 1
  transformText: (element, event) => {
    const value = element.value.trim();
    if (!value) return '<em>Output will appear here as you type...</em>';
    return `<strong>Uppercase:</strong> ${value.toUpperCase()} | <strong>Length:</strong> ${value.length}`;
  },

  // Action for Example 2
  generateTimestamp: (element, event) => {
    const now = new Date();
    return `<strong>Current Time:</strong> ${now.toLocaleTimeString()} (${now.toLocaleDateString()})`;
  }
}

app.el = {
  activeLink: null,
  html: document.documentElement,
  items: [],
  links: [],
  main: document.querySelector('[data-role="main-content"]'),
  marks: [],
  nav: document.querySelector('[data-role="main-menu"]'),
  searchBox: document.getElementById('q'),
  searchBoxCounter: document.getElementById('cnt')
}

app.fn = {
  applyTheme: (theme) => {
    if (typeof theme === 'undefined') {
      //auto logic
      if (app.el.html.dataset.theme === undefined) {
        // get it from local storage
        theme = localStorage.getItem(app.key.theme) || null;
        if (!theme) {
          // get it from local preferences
          theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
        }
      } else {
        // get it from document.dataset
        theme = app.el.html.dataset.theme;
      }
    }
    app.el.html.setAttribute('data-theme', theme);
    localStorage.setItem(app.key.theme, theme);
  },

  loadContent: async () => {
    //cleanup: 
    // app.flow.tools.element.setContent(app.el.nav, '');
    // app.flow.tools.element.setContent(app.el.main, '...');
    const params = {
      method: 'get',
    };
    let content = '';

    for (const content of app.data.content) {
      params.url = `sections/${content.page}.html`;
      app.fn.menuItem(content.label, content.page);

      if (!content.page || content.page === 'group') continue;
      //console.log(content);

      try {
        const result = await app.flow.action.fetch(app.el.nav, params);
        app.flow.tools.element.appendContent(
          app.el.main,
          `<section id="${content.page}">${result}</section><hr><div class="mb-5"><p><br></p></div>`);
      } catch (err) {
        console.log(err)
      }
    }
    app.el.links = [].slice.call(app.el.nav.querySelectorAll('a[href^="#"]'));
    app.el.items = app.el.links.map(function (a) { return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) } }).filter(function (x) { return x.el });
  },

  menuItem: (label, page) => {
    if (page) {
      if (page === 'group') {
        app.flow.tools.element.appendContent(
          app.el.nav,
          `<h4>${label}</h4>`
        );
      } else {
        app.flow.tools.element.appendContent(
          app.el.nav,
          `<a class="s" data-flow="setActive" href="#${page}">${label}</a>`
        )
      }
    } else {
      app.flow.tools.element.appendContent(
        app.el.nav,
        `<h3>${label}</h3>`
      );
    }
  },

  search: {
    clearMarks: () => {
      app.el.main.querySelectorAll('mark.hl').forEach(function (m) {
        const p = m.parentNode;
        p.replaceChild(document.createTextNode(m.textContent), m);
        p.normalize()
      });
      app.el.marks = [];
      app.fn.search.cur = -1;
    },
    cur: -1,
    go: (i) => {
      if (!app.el.marks.length) return;
      if (app.fn.search.cur >= 0) app.el.marks[app.fn.search.cur].classList.remove('cur');
      app.fn.search.cur = (i + app.el.marks.length) % app.el.marks.length;
      app.el.marks[app.fn.search.cur].classList.add('cur');
      app.el.marks[app.fn.search.cur].scrollIntoView({ block: 'center' });
      app.el.searchBoxCounter.textContent = (app.fn.search.cur + 1) + '/' + app.el.marks.length;
    },
    walker: document.createTreeWalker(
      app.el.main,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (n) {
          return n.parentNode.closest('script,style')
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT
        }
      })
  },

  spy() {
    const OFFSET = 500;
    app.key.ticking = false;
    let cur = app.el.items[0];
    let atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) {
      cur = app.el.items[app.el.items.length - 1];
    } else {
      app.el.items.forEach(function (x) { if (x.el.getBoundingClientRect().top <= OFFSET) cur = x });
    }
    app.actions.setActive(cur.a);
  },
}

app.key = {
  theme: 'aviflow-docs-theme',
  ticking: false
}


document.addEventListener('DOMContentLoaded', async () => {
  // hljs.highlightAll();

  app.flow = new AviFlow(app.actions, { autoInit: false });
  app.fn.applyTheme();

  await app.fn.loadContent();
  app.flow.register(app.examples);
  app.flow.init();

  console.log(app); //- uncomment to debug
});