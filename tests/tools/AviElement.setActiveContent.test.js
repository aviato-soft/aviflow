import { expect, jest, test } from '@jest/globals';
import AviElement from '../../src/tools/AviElement.js';

describe('AviElement / setActiveContent', () => {
  let container;
  let result;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <div data-content="panel-a">Content A</div>
        <div data-content="panel-b">Content B</div>
        <div data-content="panel-c">Content C</div>
      </div>`;
    container = document.getElementById('container');
  });

  test('should apply default hidden class to all but the active one', () => {
    result = AviElement.setActiveContent(container, 'panel-b');

    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(true);
    expect(container.querySelector('[data-content="panel-b"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-c"]').classList.contains('hidden')).toBe(true);
    expect(result).toBe(container);
  });


  test('should handle an element with no content children', () => {
    const containerEmpty = document.createElement('div');
    document.body.appendChild(containerEmpty);

    result = AviElement.setActiveContent(containerEmpty, 'non-existent');

    expect(containerEmpty.children.length).toBe(0);
    expect(result).toBe(containerEmpty);
  });


  test('should handle an element that is null or undefined', () => {
    // Should not throw errors
    expect(() => AviElement.setActiveContent(null)).not.toThrow();
  });


  test('should handle missing or invalid activeName parameter', () => {
    const containerInnerHtml = container.innerHTML;
    result = AviElement.setActiveContent(container);
    expect(result).toBe(container);
    expect(containerInnerHtml).toBe(container.innerHTML);

    result = AviElement.setActiveContent(container, [1, , 'test']);
    expect(result).toBe(container);
    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(true);
    expect(container.querySelector('[data-content="panel-b"]').classList.contains('hidden')).toBe(true);
    expect(container.querySelector('[data-content="panel-c"]').classList.contains('hidden')).toBe(true);
    expect(container.querySelector('[data-content="panel-a"]').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-content="panel-b"]').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-content="panel-c"]').getAttribute('aria-hidden')).toBe('true');
    
    result = AviElement.setActiveContent(container, "test, panel-a, 2, ");
    expect(result).toBe(container);
    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-b"]').classList.contains('hidden')).toBe(true);
    expect(container.querySelector('[data-content="panel-c"]').classList.contains('hidden')).toBe(true);
    expect(container.querySelector('[data-content="panel-a"]').getAttribute('aria-hidden')).toBeNull();
    expect(container.querySelector('[data-content="panel-b"]').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-content="panel-c"]').getAttribute('aria-hidden')).toBe('true');

    //expect(containerInnerHtml).toBe(container.innerHTML);

  });

  
  test('should handle different types of activeName parameter', () => {
    //test for array:
    result = AviElement.setActiveContent(container, ['panel-a', 'panel-b']);
    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-b"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-c"]').classList.contains('hidden')).toBe(true);
    expect(result).toBe(container);
  });

  test('should handle various formats of activeName parameter (string, array, space-separated, comma-separated, null/empty)', () => {
    // Test string
    AviElement.setActiveContent(container, 'panel-a');
    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-b"]').classList.contains('hidden')).toBe(true);

    // Test space-separated string
    AviElement.setActiveContent(container, 'panel-a panel-c');
    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-c"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-b"]').classList.contains('hidden')).toBe(true);

    // Test comma-separated string
    AviElement.setActiveContent(container, 'panel-b, panel-c');
    expect(container.querySelector('[data-content="panel-b"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-c"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(true);

    // Test array (mixed types)
    AviElement.setActiveContent(container, ['panel-a', 'panel-b, panel-c']);
    // All should be active
    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-b"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-c"]').classList.contains('hidden')).toBe(false);

    // Test null/undefined/empty
    AviElement.setActiveContent(container, [null]);
    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(true);
    
    AviElement.setActiveContent(container, undefined);
    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(true);
  });


  test('should work with custom options (e.g., custom hidden class)', () => {
    const customClass = 'd-none';
    container.dataset.optHiddenClass = 'hide';
    result = AviElement.setActiveContent(container, 'panel-b');

    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-b"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-c"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hide')).toBe(true);
    expect(container.querySelector('[data-content="panel-b"]').classList.contains('hide')).toBe(false);
    expect(container.querySelector('[data-content="panel-c"]').classList.contains('hide')).toBe(true);

    result = AviElement.setActiveContent(container, 'panel-c', { "hidden-class": customClass });
    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hide')).toBe(true);
    expect(container.querySelector('[data-content="panel-b"]').classList.contains('hide')).toBe(false);
    expect(container.querySelector('[data-content="panel-c"]').classList.contains('hide')).toBe(true);
    expect(container.querySelector('[data-content="panel-a"]').classList.contains(customClass)).toBe(true);
    expect(container.querySelector('[data-content="panel-b"]').classList.contains(customClass)).toBe(true);
    expect(container.querySelector('[data-content="panel-c"]').classList.contains(customClass)).toBe(false);

    expect(result).toBe(container);
  });


  test('invalid hidden classes', () => {
    const containerInnerHtml = container.innerHTML;
    let customClass = '';

    result = AviElement.setActiveContent(container, 'panel-a', { "hidden-class": customClass, "hidden-aria": false });
    expect(result).toBe(container);
    expect(containerInnerHtml).toBe(container.innerHTML);

    result = AviElement.setActiveContent(container, 'panel-a', { "hidden-class": customClass });
    expect(result).toBe(container);
    expect(container.querySelector('[data-content="panel-a"]').getAttribute('aria-hidden')).toBeNull;
    expect(container.querySelector('[data-content="panel-b"]').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-content="panel-c"]').getAttribute('aria-hidden')).toBe('true');

    customClass = false;
    result = AviElement.setActiveContent(container, 'panel-a', { "hidden-class": customClass });
    expect(result).toBe(container);
    expect(container.querySelector('[data-content="panel-a"]').getAttribute('aria-hidden')).toBeNull;
    expect(container.querySelector('[data-content="panel-b"]').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-content="panel-c"]').getAttribute('aria-hidden')).toBe('true');
  })


  test('should correctly apply the hidden class when the active content matches an existing class', () => {
    const panelA = container.querySelector('[data-content="panel-a"]');
    panelA.classList.add('hidden');

    // Set 'panel-a' as active, even though it already has 'hidden' class
    result = AviElement.setActiveContent(container, 'panel-a');

    // It should remove 'hidden' regardless of its previous state
    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(false);
    expect(container.querySelector('[data-content="panel-b"]').classList.contains('hidden')).toBe(true);
    expect(container.querySelector('[data-content="panel-c"]').classList.contains('hidden')).toBe(true);

    expect(result).toBe(container);
  });

  test('should handle activeName that does not match any child content', () => {
    // Should result in all children getting the hidden class (since none are active)
    result = AviElement.setActiveContent(container, 'panel-x');

    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(true);
    expect(container.querySelector('[data-content="panel-b"]').classList.contains('hidden')).toBe(true);
    expect(container.querySelector('[data-content="panel-c"]').classList.contains('hidden')).toBe(true);

    expect(result).toBe(container);
  });


  test('should handle the case where a content element exists but lacks the data-content attribute', () => {
    const invalidPanel = document.createElement('div');
    invalidPanel.textContent = 'No data-content attribute';
    container.appendChild(invalidPanel);

    // Only the valid panel should be considered
    result = AviElement.setActiveContent(container, 'panel-a');

    expect(container.querySelector('[data-content="panel-a"]').classList.contains('hidden')).toBe(false);
    // The invalid panel should remain untouched (no hidden class added/removed)
    expect(invalidPanel.classList.contains('hidden')).toBe(false);

    expect(result).toBe(container);
  });


  test('should handle the case where no valid content element exists', () => {
    const emptyContainer = document.createElement('div');
    const emptyPanel = document.createElement('div');
    container.appendChild(emptyContainer);
    emptyContainer.appendChild(emptyPanel);

    // Only the valid panel should be considered
    result = AviElement.setActiveContent(emptyContainer, 'panel-x');

    // The invalid panel should remain untouched (no hidden class added/removed)
    expect(emptyPanel.classList.contains('hidden')).toBe(false);
    expect(result).toBe(emptyContainer);
  });


  test('different options for hidden-aria', () => {
    result = AviElement.setActiveContent(container, 'panel-b');
    expect(container.querySelector('[data-content="panel-a"]').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-content="panel-b"]').getAttribute('aria-hidden')).toBeNull();
    expect(container.querySelector('[data-content="panel-c"]').getAttribute('aria-hidden')).toBe('true');

    result = AviElement.setActiveContent(container, 'panel-a');
    expect(container.querySelector('[data-content="panel-a"]').getAttribute('aria-hidden')).toBeNull();
    expect(container.querySelector('[data-content="panel-b"]').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-content="panel-b"]').getAttribute('aria-hidden')).toBe('true');

    result = AviElement.setActiveContent(container, 'panel-c', {'hidden-aria': false}); //preserve the previous state:
    expect(container.querySelector('[data-content="panel-a"]').getAttribute('aria-hidden')).toBeNull();
    expect(container.querySelector('[data-content="panel-b"]').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-content="panel-b"]').getAttribute('aria-hidden')).toBe('true');

    expect(result).toBe(container);
  });

});