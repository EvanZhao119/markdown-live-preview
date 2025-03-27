document.addEventListener("DOMContentLoaded", () => {
    let hasEdited = false;
    let scrollBarSync = false;

    const localStorageNamespace = 'com.markdownlivepreview';
    const localStorageKey = 'last_state';
    const localStorageScrollBarKey = 'scroll_bar_settings';
    const confirmationMessage = 'Are you sure you want to reset? Your changes will be lost.';

    // default template
    const defaultInput = `# Evan's Markdown Guide

Welcome to my Markdown Preview Tool!  
I'm **Evan**, a software developer passionate about creating useful tools and sharing knowledge.  
Visit my tech blog 👉 [evanzhao119.github.io](https://evanzhao119.github.io/)

---

## 📌 Headers

# H1 Header
## H2 Header
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header

---

## ✨ Emphasis

*Italic Text*  
_Italic Text (alternate syntax)_

**Bold Text**  
__Bold Text (alternate syntax)__

_You **can** combine them_

---

## 📋 Lists

### Unordered List
- Item A
- Item B
  - Sub-item B1
  - Sub-item B2

### Ordered List
1. First item
2. Second item
   1. Sub-item
   2. Sub-item

---

## 🖼️ Images

![Sample image](https://evanzhao119.github.io/assets/sample.png "Optional title")

---

## 🔗 Links

- [My Blog](https://evanzhao119.github.io/)
- [Markdown Guide](https://www.markdownguide.org/)

---

## 💬 Blockquotes

> This is a blockquote.  
> Markdown is lightweight and easy to learn.

> Nested blockquote:
>> This is a quote inside a quote.

---

## 📊 Tables

| Name       | Role           | Location    |
|------------|----------------|-------------|
| Evan       | Developer      | Canada      |
| GitHub     | Tech Blog Host | Online      |

---

## 🔢 Code Blocks

\`\`\`javascript
// Hello World in JavaScript
console.log("Hello, Evan!");
\`\`\`

\`\`\`python
# Hello World in Python
print("Hello, Evan!")
\`\`\`

---

## 📌 Inline Code

Use the \`console.log()\` function to print output in JavaScript.

---

## ✅ Task Lists

- [x] Create Markdown Preview Tool
- [ ] Publish a new blog post
- [ ] Add dark mode support

---

Thanks for using this tool!  
Feel free to fork or star it on [GitHub](https://github.com/evanzhao119).
`;

    let setupEditor = () => {
        let editor = ace.edit('editor');
        editor.getSession().setUseWrapMode(true);
        editor.setOptions({
            maxLines: Infinity,
            indentedSoftWrap: false,
            fontSize: 14,
            autoScrollEditorIntoView: true,
            theme: 'ace/theme/chrome',
        });

        var MarkdownMode = ace.require("ace/mode/markdown").Mode;
        editor.session.setMode(new MarkdownMode());

        editor.on('change', () => {
            let changed = editor.getValue() != defaultInput;
            if (changed) {
                hasEdited = true;
            }
            let value = editor.getValue();
            convert(value);
            saveLastContent(value);
        });

        return editor;
    };

    // Render markdown text as html
    let convert = (markdown) => {
        let options = {
            headerIds: false,
            mangle: false
        };
        let html = marked.parse(markdown, options);
        let sanitized = DOMPurify.sanitize(html);
        document.querySelector('#output').innerHTML = sanitized;
    };

    // Reset input text
    let reset = () => {
        let changed = editor.getValue() != defaultInput;
        if (hasEdited || changed) {
            var confirmed = window.confirm(confirmationMessage);
            if (!confirmed) {
                return;
            }
        }
        presetValue(defaultInput);
        document.querySelectorAll('.column').forEach((element) => {
            element.scrollTo({top: 0});
        });
    };

    let presetValue = (value) => {
        editor.setValue(value);
        editor.moveCursorTo(0, 0);
        editor.focus();
        editor.navigateLineEnd();
        hasEdited = false;
    };

    // ----- sync scroll position -----

    let initScrollBarSync = (settings) => {
        let checkbox = document.querySelector('#sync-scroll-checkbox');
        checkbox.checked = settings;
        scrollBarSync = settings;

        checkbox.addEventListener('change', (event) => {
            let checked = event.currentTarget.checked;
            scrollBarSync = checked;
            saveScrollBarSettings(checked);
        });

        document.querySelector('#edit').addEventListener('scroll', (event) => {
            if (!scrollBarSync) {
                return;
            }
            let editorElement = event.currentTarget;
            let ratio = editorElement.scrollTop / (editorElement.scrollHeight - editorElement.clientHeight);

            let previewElement = document.querySelector('#preview');
            let targetY = (previewElement.scrollHeight - previewElement.clientHeight) * ratio;
            previewElement.scrollTo(0, targetY);
        });
    };

    let enableScrollBarSync = () => {
        scrollBarSync = true;
    };

    let disableScrollBarSync = () => {
        scrollBarSync = false;
    };

    // ----- clipboard utils -----

    let copyToClipboard = (text, successHandler, errorHandler) => {
        navigator.clipboard.writeText(text).then(
            () => {
                successHandler();
            },

            () => {
                errorHandler();
            }
        );
    };

    let notifyCopied = () => {
        let labelElement = document.querySelector("#copy-button a");
        labelElement.innerHTML = "Copied!";
        setTimeout(() => {
            labelElement.innerHTML = "Copy";
        }, 1000)
    };

    // ----- setup -----

    // setup navigation actions
    let setupResetButton = () => {
        document.querySelector("#reset-button").addEventListener('click', (event) => {
            event.preventDefault();
            reset();
        });
    };

    let setupCopyButton = (editor) => {
        document.querySelector("#copy-button").addEventListener('click', (event) => {
            event.preventDefault();
            let value = editor.getValue();
            copyToClipboard(value, () => {
                notifyCopied();
            },
            () => {
                // nothing to do
            });
        });
    };

    // ----- local state -----

    let loadLastContent = () => {
        let lastContent = Storehouse.getItem(localStorageNamespace, localStorageKey);
        return lastContent;
    };

    let saveLastContent = (content) => {
        let expiredAt = new Date(2099, 1, 1);
        Storehouse.setItem(localStorageNamespace, localStorageKey, content, expiredAt);
    };

    let loadScrollBarSettings = () => {
        let lastContent = Storehouse.getItem(localStorageNamespace, localStorageScrollBarKey);
        return lastContent;
    };

    let saveScrollBarSettings = (settings) => {
        let expiredAt = new Date(2099, 1, 1);
        Storehouse.setItem(localStorageNamespace, localStorageScrollBarKey, settings, expiredAt);
    };


    // ----- entry point -----

    let lastContent = loadLastContent();
    let editor = setupEditor();
    if (lastContent) {
        presetValue(lastContent);
    } else {
        presetValue(defaultInput);
    }
    setupResetButton();
    setupCopyButton(editor);

    let scrollBarSettings = loadScrollBarSettings() || false;
    initScrollBarSync(scrollBarSettings);
});
