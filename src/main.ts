import { Plugin } from 'obsidian';
import { abapLivePreviewExtension } from './abap-live-preview';
import { registerAbapReadingView } from './abap-reading-view';

export default class AbapSyntaxHighlightPlugin extends Plugin {
	onload() {
		registerAbapReadingView(this);
		this.registerEditorExtension(abapLivePreviewExtension);
	}
}
