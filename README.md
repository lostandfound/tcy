# TCY

TCY is a JavaScript library for processing Japanese vertical text. It adds special classes to HTML elements for handling Tate-Chu-Yoko (vertical-in-horizontal text) and text orientation adjustments.

## Features

- Displays number sequences and exclamation marks in Tate-Chu-Yoko style
- Adjusts orientation for specific characters (kanji and symbols)
- Processes only HTML text nodes (preserves tags)
- Excludes email addresses, URLs, and character references from conversion
- Flexible configuration options

## Installation

```bash
npm install tcy
```

## Usage

```javascript
import TCY from 'tcy';

// Basic usage
const result = TCY.transformText('令和25年度の調査では、約78％の回答者が賛成しました。');
// => 令和<span class="tcy">25</span>年度の調査では、約<span class="tcy">78</span>％の回答者が賛成しました。

// With options
const result2 = TCY.transformText('第123回目の検証実験で、約456件のデータを収集。', { tcyDigit: 3 });
// => 第<span class="tcy">123</span>回目の検証実験で、約<span class="tcy">456</span>件のデータを収集。
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| tcyDigit | number | 2 | Maximum number of digits for Tate-Chu-Yoko. Set to 0 to disable number conversion. |
| autoTextOrientation | boolean | true | Enable/disable automatic text orientation adjustment. |

## Conversion Rules

### Tate-Chu-Yoko
- Number sequences (2+ digits) → `<span class="tcy">12</span>`
- Exclamation/question mark sequences → `<span class="tcy">!!</span>`

### Text Orientation
- Special symbols (÷∴≠≦≧etc.) → `<span class="sideways">÷</span>`
- Greek/Cyrillic characters → `<span class="upright">α</span>`

### Excluded Elements
- Email addresses
- URLs
- HTML character references
- Specific tags (code, pre, math, svg)
- Elements with specific classes (tcy, upright, sideways)

## Debug Mode

Set `NODE_ENV=development` during development to enable detailed debug output:

```bash
NODE_ENV=development node your-script.js
```

## Error Handling

When invalid HTML is input, the library returns the original text and outputs an error message.

## Examples

### Number Processing
```javascript
// Default behavior (tcyDigit: 2)
TCY.transformText('新宿駅の1日の利用者数は約35万人です。');
// => 新宿駅の1日の利用者数は約<span class="tcy">35</span>万人です。

// With tcyDigit: 0 (disable number conversion)
TCY.transformText('新宿駅の1日の利用者数は約35万人です。', { tcyDigit: 0 });
// => 新宿駅の1日の利用者数は約35万人です。
```

### Text Orientation
```javascript
// Automatic text orientation
TCY.transformText('÷∴≠α');
// => <span class="sideways">÷</span><span class="sideways">∴</span><span class="sideways">≠</span><span class="upright">α</span>

// Disable text orientation
TCY.transformText('÷∴≠α', { autoTextOrientation: false });
// => ÷∴≠α
```

## License

MIT
