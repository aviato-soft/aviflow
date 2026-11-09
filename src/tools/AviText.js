/**
 * @class AviText
 * @description Text parsing utility class for AviFlow.
 */
export class AviText {

    /**
     * Converts a string to `` camelCase `` format. If the input is not a string, it returns an empty string.
     *
     * @param {string|*} ``text`` The input string to process.
     * @param {boolean} [firstLetterLower=true] Determines if the initial character should be lowercase.
     * @returns {string} The formatted string.
     */
    static toCamelCase(text, firstLetterLower = true) {
      if (typeof text !== 'string') {
        return '';
      }

      let result = text
        .trim()
        .replace(/^[-_\s]+/, '')
        .replace(/[-_\s]+(.)?/g, (_, letter) => (letter ? letter.toUpperCase() : ''));

      if (result.length === 0) return '';

      if (firstLetterLower) {
        // camelCase
        return result.charAt(0).toLowerCase() + result.slice(1);
      } else {
        // PascalCase
        return this.toCapitalize(result);
      }
    }


    /**
     * Capitalizes the first letter of the input string. If the input is not a string, it returns an empty string.
     *
     * @param {string|*} ``text`` The input string.
     * @returns {string} The string with the first letter capitalized.
     */
    static toCapitalize(text) {
      const trimText = text
        .trim()
        .replace(/^[-_\s]+/, '');
      return trimText.charAt(0).toUpperCase() + trimText.slice(1);
    }


    /**
     * Converts a string to `` PascalCase `` format (capitalizes the first letter and subsequent words). If the input is not a string, it returns an empty string.
     *
     * @param {string|*} ``text`` The input string to process.
     * @returns {string} The formatted string.
     */
    static toPascalCase(text){
      return this.toCamelCase(text, false);
    }
} 

export default AviText