import { RangeSetBuilder } from '@codemirror/state';
import {
	Decoration,
	type DecorationSet,
	EditorView,
	type PluginValue,
	ViewPlugin,
	type ViewUpdate,
} from '@codemirror/view';
import { type AbapTokenType, tokenizeAbapLine } from './abap-tokenizer';

const FENCE_OPEN = /^\s*```+\s*abap\s*$/i;
const FENCE_CLOSE = /^\s*```+\s*$/;

const decorationCache = new Map<AbapTokenType, Decoration>();
function tokenDecoration(type: AbapTokenType): Decoration {
	let decoration = decorationCache.get(type);
	if (!decoration) {
		decoration = Decoration.mark({ class: `abap-token-${type}` });
		decorationCache.set(type, decoration);
	}
	return decoration;
}

function buildAbapDecorations(view: EditorView): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	const { doc } = view.state;
	let insideAbap = false;

	for (let i = 1; i <= doc.lines; i++) {
		const line = doc.line(i);

		if (!insideAbap) {
			if (FENCE_OPEN.test(line.text)) {
				insideAbap = true;
			}
			continue;
		}

		if (FENCE_CLOSE.test(line.text)) {
			insideAbap = false;
			continue;
		}

		for (const token of tokenizeAbapLine(line.text)) {
			builder.add(line.from + token.start, line.from + token.end, tokenDecoration(token.type));
		}
	}

	return builder.finish();
}

class AbapLivePreviewPlugin implements PluginValue {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = buildAbapDecorations(view);
	}

	update(update: ViewUpdate): void {
		if (update.docChanged || update.viewportChanged) {
			this.decorations = buildAbapDecorations(update.view);
		}
	}
}

export const abapLivePreviewExtension = ViewPlugin.fromClass(AbapLivePreviewPlugin, {
	decorations: (plugin) => plugin.decorations,
});
