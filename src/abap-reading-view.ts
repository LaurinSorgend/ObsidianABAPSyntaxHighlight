import { Plugin } from 'obsidian';
import { tokenizeAbapLine } from './abap-tokenizer';

function renderAbapSource(code: HTMLElement, source: string): void {
	const lines = source.split('\n');
	lines.forEach((line, i) => {
		let pos = 0;
		for (const token of tokenizeAbapLine(line)) {
			if (token.start > pos) {
				code.appendText(line.slice(pos, token.start));
			}
			code.createSpan({
				cls: `abap-token-${token.type}`,
				text: line.slice(token.start, token.end),
			});
			pos = token.end;
		}
		if (pos < line.length) {
			code.appendText(line.slice(pos));
		}
		if (i < lines.length - 1) {
			code.appendText('\n');
		}
	});
}

export function registerAbapReadingView(plugin: Plugin): void {
	plugin.registerMarkdownCodeBlockProcessor('abap', (source, el) => {
		const pre = el.createEl('pre');
		const code = pre.createEl('code', { cls: 'language-abap' });
		renderAbapSource(code, source);
	});
}
