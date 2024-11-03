import * as cheerio from 'cheerio';

/**
 * TCY - A Japanese text processing utility class that handles text orientation and tategaki formatting
 * @class
 */
class TCY {
    /**
     * Creates a new TCY instance
     * @param {Object} options - Configuration options
     * @param {number} [options.tcyDigit=2] - Maximum number of consecutive digits to wrap in tcy
     * @param {boolean} [options.autoTextOrientation=true] - Enable automatic text orientation adjustment
     */
    constructor(options = {}) {
        this.tcyDigit = options.tcyDigit !== undefined ? options.tcyDigit : 2;
        this.autoTextOrientation = options.autoTextOrientation !== undefined ? options.autoTextOrientation : true;
        this.debug = process.env.NODE_ENV === 'development';
    }

    /**
     * デバッグ情報を出力
     * @private
     * @param {string} message - デバッグメッセージ
     * @param {*} [data] - 追加のデバッグデータ
     */
    debugLog(message, data = null) {
        if (this.debug) {
            console.log(`[TCY Debug] ${message}`);
            if (data !== null) {
                console.log(data);
            }
        }
    }

    /**
     * Transforms HTML content by applying Japanese typography rules
     * @param {string} html - HTML content to transform
     * @returns {string} Transformed HTML content
     */
    transform(html) {
        this.debugLog('Input HTML:', html);

        const $ = cheerio.load(html, {
            decodeEntities: false,
            _useHtmlParser2: true,
            xml: {
                xmlMode: false,
                decodeEntities: false
            }
        });

        this.debugLog('Cheerio options:', {
            tcyDigit: this.tcyDigit,
            autoTextOrientation: this.autoTextOrientation
        });

        if (/<[^>]*>/.test(html)) {
            this.debugLog('Processing HTML content');
            this.processNodes($('body'), $);
            const result = $('body').html();
            this.debugLog('Processed HTML result:', result);
            return result === null ? html : result;
        }

        this.debugLog('Processing plain text content');
        const wrapper = $('<div>').html(html);
        this.processNodes(wrapper, $);
        const result = wrapper.html();
        this.debugLog('Processed text result:', result);
        return result;
    }

    /**
     * Recursively processes DOM nodes and applies typography rules
     * @private
     * @param {cheerio.Cheerio} node - Current node to process
     * @param {cheerio.Root} $ - Cheerio instance
     */
    processNodes(node, $) {
        node.contents().each((_, element) => {
            const $element = $(element);

            if (this.shouldSkip($element)) {
                this.debugLog('Skipping element:', $element.toString());
                return;
            }

            if (element.type === 'text') {
                this.debugLog('Processing text node:', element.data);
                const $temp = $('<div>').html(this.processText($element.text()));
                const transformedNodes = $temp.contents();
                this.debugLog('Transformed text:', $temp.html());
                $element.replaceWith(transformedNodes);
            } else if (element.type === 'tag') {
                this.debugLog('Processing tag:', element.name);
                this.processNodes($element, $);
            }
        });
    }

    /**
     * Determines if a node should be skipped from processing
     * @private
     * @param {cheerio.Cheerio} $element - Element to check
     * @returns {boolean} True if the element should be skipped
     */
    shouldSkip($element) {
        const excludeTags = ['code', 'pre', 'math', 'svg'];
        const excludeClasses = ['tcy', 'upright', 'sideways'];

        let $parent = $element;
        while ($parent.length) {
            if ($parent.is(excludeTags.join(','))) {
                return true;
            }

            const classNames = $parent.attr('class');
            if (classNames && excludeClasses.some(cls => classNames.includes(cls))) {
                return true;
            }

            $parent = $parent.parent();
        }

        return false;
    }

    /**
     * Processes text content by applying typography rules
     * @private
     * @param {string} text - Text content to process
     * @returns {string} Processed text content
     */
    processText(text) {
        this.debugLog('Processing text:', text);

        const charRefRegex = /&#?[a-z0-9]{2,8};/gi;
        const charRefs = [];
        let processedText = text.replace(charRefRegex, match => {
            charRefs.push(match);
            this.debugLog('Found character reference:', match);
            return `\u0001${charRefs.length - 1}\u0001`;
        });

        const markers = [];
        processedText = processedText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|https?:\/\/[^\s]+/gi, match => {
            markers.push(match);
            this.debugLog('Found URL or email:', match);
            return `\u0000${markers.length - 1}\u0000`;
        });

        processedText = this.setTcy(processedText);
        if (this.autoTextOrientation) {
            processedText = this.setTextOrientation(processedText);
        }

        processedText = processedText.replace(/\u0001(\d+)\u0001/g, (_, index) => charRefs[index]);
        processedText = processedText.replace(/\u0000(\d+)\u0000/g, (_, index) => markers[index]);

        this.debugLog('Final processed text:', processedText);
        return processedText;
    }

    /**
     * Wraps appropriate numbers in tcy (horizontal-in-vertical) spans
     * @private
     * @param {string} text - Text to process
     * @returns {string} Processed text with tcy spans
     */
    setTcy(text) {
        // tcyDigitが0の場合は変換をスキップ
        if (this.tcyDigit === 0) {
            this.debugLog('tcyDigit is 0, skipping number conversion');
            return text;
        }

        let processedText = text;

        // 数字の変換処理
        const digitRegex = new RegExp(`(^|[^0-9])([0-9]{2,${this.tcyDigit}})(?![0-9])`, 'g');
        processedText = processedText.replace(digitRegex, (_, p1, p2) => {
            this.debugLog('Converting number:', p2);
            // 数字の桁数がtcyDigitの範囲内の場合のみ変換
            if (p2.length >= 2 && p2.length <= this.tcyDigit) {
                return `${p1}<span class="tcy">${p2}</span>`;
            }
            return `${p1}${p2}`;
        });

        // 感嘆符・疑問符の処理
        const emoRegex = /(^|[^!?])([!?]{2})(?![!?])/g;
        processedText = processedText.replace(emoRegex, (_, p1, p2) => {
            this.debugLog('Converting emotion marks:', p2);
            return `${p1}<span class="tcy">${p2}</span>`;
        });

        return processedText;
    }

    /**
     * Applies text orientation rules for specific characters
     * @private
     * @param {string} text - Text to process
     * @returns {string} Processed text with orientation spans
     */
    setTextOrientation(text) {
        const sidewaysRegex = /[÷∴≠≦≧∧∨＜＞‐－]/g;
        const uprightRegex = /[Α-Ωα-ωА-Яа-я]/g;

        text = text.replace(sidewaysRegex, '<span class="sideways">$&</span>');
        text = text.replace(uprightRegex, '<span class="upright">$&</span>');
        return text;
    }

    /**
     * Static utility method to transform text without creating an instance
     * @static
     * @param {string} html - HTML content to transform
     * @param {Object} [options] - Configuration options
     * @returns {string} Transformed HTML content
     */
    static transformText(html, options) {
        const tcy = new TCY(options);
        return tcy.transform(html);
    }
}

export default TCY;
