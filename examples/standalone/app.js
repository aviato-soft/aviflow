
document.addEventListener('DOMContentLoaded', async () => {
    const avi = new AviFlow();

    // Custom callback shared across cases — must be on options, not the instance directly
    avi.on.success = (data, element) => { console.log('[OK]', data, element); };
    avi.on.error = (data, element, error) => { console.error('[ERR]', data, element, error); };

    avi.fn.showCards = () => {
        //get the cards:
        const grid = document.querySelector('[data-role=grid]');
        const tplCard = grid.querySelector('[data-template=true]');
        const template = tplCard.outerHTML.replace('data-template="true"', '');
        tplCard.remove();

        // Compile the HTML template string into a dynamic template literal function
        const renderCard = new Function('item', 'return `' + template + '`;');

        dataCards.forEach(item => {
            // Escape the HTML code snippet so it renders as text in the code tag
            const safeItem = {
                ...item,
                code: item.action.replace(/</g, '&lt;').replace(/>/g, '&gt;')
            };
            const html = renderCard(safeItem);
            grid.insertAdjacentHTML('beforeend', html);
        });
    }


    avi.fn.success = (data, element) => {
        alert('It works just fine!');
        console.log(data)
    }


    avi.fn.toogleTheme = () => {
        var $toggle = document.querySelector('.theme-toggle');
        if (!$toggle) return;

        // Read stored preference, otherwise follow system preference
        var stored = localStorage.getItem('avi-flow-theme') || null;
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = (stored === 'dark' || (!stored && prefersDark));
        $toggle.classList.toggle('active', isDark);

        // Apply the correct theme attribute based on current state
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }

        // Toggle on click
        function applyTheme() {
            isDark = !isDark;
            if (isDark) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('avi-flow-theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('avi-flow-theme', 'light');
            }
        }

        $toggle.addEventListener('click', applyTheme);
    }


    avi.fn.test = (element) => {
        console.log(element);
        alert('it works!');
    }

    avi.fn.testHandleCheckChange = (element) => {
        console.log('Element checked state:', element.checked);
        console.log('Element ID:', element.id);
        console.log('Element type:', element.type);
    }

    avi.init();
    avi.fn.showCards();
});