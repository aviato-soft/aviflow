import AviFlow from '../src/AviFlow.js';

document.addEventListener('DOMContentLoaded', async () => {
    hljs.highlightAll();

    const flow = new AviFlow({
        toogleTheme: (triggerEl, flow) => {

            // Read stored preference, otherwise follow system preference
            let stored = localStorage.getItem('avi-flow-theme') || null;
            let prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            let isDark = (stored === 'dark' || (!stored && prefersDark));

            // Toggle on click
            function applyTheme() {
                isDark = !isDark;
                if (isDark) {
                    flow.tools.element.setActiveContent(triggerEl, 'dark');
                    document.documentElement.setAttribute('data-bs-theme', 'dark');
                    localStorage.setItem('avi-flow-theme', 'dark');
                } else {
                    flow.tools.element.setActiveContent(triggerEl, 'light');
                    document.documentElement.setAttribute('data-bs-theme', 'light');
                    localStorage.setItem('avi-flow-theme', 'light');
                }
            }
            applyTheme();
        },
        getSection: async (triggerEl, flow) => {
            try {
                const params = {
                    url: 'sections/' + triggerEl.dataset.section + '.html',
                    method: 'get',
                    responseType: 'text' 
                };
                const response = await fetch(url);
                if (!response.ok) throw new Error('Network response was not ok');
                const response = await response.text(); 

                const response = await flow.action.fetch(triggerEl, params);
                if (!response.ok) throw new Error('Network response was not ok');
                
                flow.tools.element.setContent(content);
            } catch (error) {
                console.error("Error fetching file:", error);
            }
        }
    });

});