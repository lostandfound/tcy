import { expect } from 'chai';
import TCY from '../src/index.mjs';

describe('TCY', () => {
    describe('transformText', () => {
        it('should convert numbers with tcyDigit: 3', () => {
            const sourceText = '12ああああ34ああ457あああ89';
            const options = { tcyDigit: 3 };
            const result = TCY.transformText(sourceText, options);
            expect(result).to.equal('<span class="tcy">12</span>ああああ<span class="tcy">34</span>ああ<span class="tcy">457</span>あああ<span class="tcy">89</span>');
        });

        it('should convert exclamation and question marks', () => {
            const sourceText = '!!ああああ!!!ああ!?あああ??';
            const result = TCY.transformText(sourceText);
            expect(result).to.equal('<span class="tcy">!!</span>ああああ!!!ああ<span class="tcy">!?</span>あああ<span class="tcy">??</span>');
        });

        it('should adjust orientation of special characters', () => {
            const sourceText = '÷∴≠≦≧∧∨＜＞‐－';
            const result = TCY.transformText(sourceText);
            expect(result).to.equal(
                '<span class="sideways">÷</span>' +
                '<span class="sideways">∴</span>' +
                '<span class="sideways">≠</span>' +
                '<span class="sideways">≦</span>' +
                '<span class="sideways">≧</span>' +
                '<span class="sideways">∧</span>' +
                '<span class="sideways">∨</span>' +
                '<span class="sideways">＜</span>' +
                '<span class="sideways">＞</span>' +
                '<span class="sideways">‐</span>' +
                '<span class="sideways">－</span>'
            );
        });

        it('should exclude email addresses from conversion', () => {
            const sourceText = '連絡先はinfo@example21.comです。';
            const result = TCY.transformText(sourceText);
            expect(result).to.equal('連絡先はinfo@example21.comです。');
        });

        it('should process text within HTML tags', () => {
            const sourceText = '<html><head><title>テスト</title></head><body>12ああああ34ああ457あああ89</body></html>';
            const result = TCY.transformText(sourceText);
            expect(result).to.equal('<span class="tcy">12</span>ああああ<span class="tcy">34</span>ああ457あああ<span class="tcy">89</span>');
        });

        it('should preserve character references in email addresses', () => {
            const sourceText = '<a href="&#109;a&#x69;&#108;&#x74;&#111;&#x3a;&#105;&#x6e;&#102;&#x6f;&#64;&#x65;&#120;&#x61;&#109;p&#108;e&#x2e;&#99;&#x6f;&#109;">&#105;&#x6e;&#102;&#x6f;&#64;&#x65;&#120;&#x61;&#109;p&#108;e&#x2e;&#99;&#x6f;&#109;</a>';
            const result = TCY.transformText(sourceText);
            expect(result).to.equal(sourceText);
        });

        it('should handle mixed character references and numbers', () => {
            const sourceText = '&#x3042;&#x3044;12&#x3046;&#x3048;34';
            const result = TCY.transformText(sourceText);
            expect(result).to.equal('&#x3042;&#x3044;<span class="tcy">12</span>&#x3046;&#x3048;<span class="tcy">34</span>');
        });
    });

    describe('Options', () => {
        it('should not convert numbers when tcyDigit is 0', () => {
            const sourceText = '12ああああ34';
            const options = { tcyDigit: 0 };
            const result = TCY.transformText(sourceText, options);
            expect(result).to.equal('12ああああ34');
        });

        it('should not adjust text orientation when autoTextOrientation is false', () => {
            const sourceText = '÷∴≠≦≧';
            const options = { autoTextOrientation: false };
            const result = TCY.transformText(sourceText, options);
            expect(result).to.equal('÷∴≠≦≧');
        });
    });

    describe('Error handling', () => {
        it('should return original text for invalid HTML', () => {
            const sourceText = '<div>テスト</div';  // Incomplete closing tag
            const result = TCY.transformText(sourceText);
            expect(result).to.equal(sourceText);
        });

        it('should return empty string for empty input', () => {
            const result = TCY.transformText('');
            expect(result).to.equal('');
        });
    });

    describe('tcyDigit: 0 behavior', () => {
        const options = { tcyDigit: 0 };

        it('should not convert any numbers regardless of digit count', () => {
            const sourceText = '1桁:1、2桁:12、3桁:123、4桁:1234';
            const result = TCY.transformText(sourceText, options);
            expect(result).to.equal('1桁:1、2桁:12、3桁:123、4桁:1234');
        });

        it('should not convert numbers within HTML tags', () => {
            const sourceText = '<div>12ああああ34</div>';
            const result = TCY.transformText(sourceText, options);
            expect(result).to.equal('<div>12ああああ34</div>');
        });
    });
});
