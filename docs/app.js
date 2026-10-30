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
    },
    {
      label: 'API Reference',
      page: 'main-api'
    },
    {
      label: 'Examples',
    },

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
    }
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

  changeTheme: (triggerEl) => {
    const htmlEl = document.documentElement;
    const triggerEls = triggerEl.closest('ul').querySelectorAll('button');
    let stored = localStorage.getItem('avi-flow-theme') || null;
    let prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let choice = triggerEl.dataset.bsThemeValue;
    let isDark = (choice === 'dark') || (choice === 'auto' && (stored === 'dark' || (!stored && prefersDark)));
    
    if (isDark) {
      htmlEl.setAttribute('data-bs-theme', 'dark');
      localStorage.setItem('avi-flow-theme', 'dark');
    } else {
      htmlEl.setAttribute('data-bs-theme', 'light');
      localStorage.setItem('avi-flow-theme', 'light');
    }

    const triggerThemeSelector = document.getElementById('theme-selector');
    triggerThemeSelector.querySelector('.icon-theme').classList = triggerEl.querySelector('.icon-theme').classList;


    triggerEls.forEach(el => {
      el?.classList.remove('active');
      el.querySelector('.bi-check2')?.classList.add('d-none');
    });
    
    triggerEl.classList.add('active');
    triggerEl.querySelector('.bi-check2').classList.remove('d-none');
    console.log({choice: choice, stored: stored, els: triggerEls});
  }
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
  main: document.querySelector('[data-role="main-content"]'),
  nav: document.querySelector('[data-role="main-menu"]')
}


app.fn = {
  addLabel: (label, page) => {
    if (page) {
      app.flow.tools.element.appendContent(
        app.el.nav,
        `<a class="nav-link" href="#${page}">${label}</a>`
      );
    } else {
      app.flow.tools.element.appendContent(
        app.el.nav,
        `<strong class="px-2 mb-1 mt-3">${label}</strong>`
      );
    }
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
      app.fn.addLabel(content.label, content.page);
      console.log(content);
      
      try {
        const result = await app.flow.action.fetch(app.el.nav, params);
        app.flow.tools.element.appendContent(
          app.el.main,
          `<section class="mb-5" id="${content.page}">${result}</section><hr><div class="mb-5"><p><br></p></div>`);
      } catch (err) {
        console.log(err)
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // hljs.highlightAll();

  app.flow = new AviFlow(app.actions, { autoInit: false });
  app.actions.changeTheme(document.querySelector('[data-bs-theme-value="auto"]'));

  await app.fn.loadContent();
  app.flow.register(app.examples);
  app.flow.init();


  console.log(app); //- uncomment to debug
});