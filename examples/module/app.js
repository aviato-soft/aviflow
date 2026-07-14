import AviFlow from '../../src/index.js';

// Instantiate with custom operational overrides
const flow = new AviFlow({
    onSuccess: (data, element) => {
        console.log('Intercepted via ES Module configuration!', data);
    }
});

// You can also capture the native bubble events emitted by AviFlow globally
document.body.addEventListener('aviflow:success', (event) => {
    console.log('Global event captured payload:', event.detail);
});