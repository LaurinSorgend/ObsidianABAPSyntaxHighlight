// ABAP is case-insensitive, so keyword/operator matching uses the "i" flag.

export type AbapTokenType =
	| 'comment'
	| 'string'
	| 'pragma'
	| 'keyword'
	| 'boolean'
	| 'operator'
	| 'number'
	| 'punctuation';

export interface AbapToken {
	start: number;
	end: number;
	type: AbapTokenType;
}

export const ABAP_KEYWORDS: string[] = [
	// Program / class / structure
	'REPORT', 'PROGRAM', 'CLASS', 'ENDCLASS', 'INTERFACE', 'ENDINTERFACE',
	'METHOD', 'ENDMETHOD', 'METHODS', 'CLASS-METHODS', 'CLASS-DATA',
	'CLASS-EVENTS', 'FUNCTION', 'ENDFUNCTION', 'FUNCTION-POOL', 'FORM',
	'ENDFORM', 'MODULE', 'ENDMODULE', 'DEFINITION', 'IMPLEMENTATION',
	'PUBLIC', 'PRIVATE', 'PROTECTED', 'SECTION', 'INCLUDE',

	// Declarations
	'DATA', 'CONSTANTS', 'TYPES', 'TYPE-POOLS', 'FIELD-SYMBOLS', 'TABLES',
	'RANGES', 'STATICS', 'PARAMETERS', 'SELECT-OPTIONS', 'LIKE', 'TYPE',
	'VALUE', 'REF', 'TO', 'BEGIN', 'OF', 'END', 'OCCURS', 'INITIAL', 'SIZE',
	'OPTIONAL', 'DEFAULT',

	// Object orientation
	'CREATE', 'OBJECT', 'NEW', 'ME', 'SUPER', 'FINAL', 'ABSTRACT',
	'INHERITING', 'FROM', 'REDEFINITION', 'INSTANCE', 'STATIC',
	'READ-ONLY', 'EVENTS', 'HANDLER', 'FOR', 'EVENT',

	// Control flow
	'IF', 'ELSE', 'ELSEIF', 'ENDIF', 'CASE', 'WHEN', 'OTHERS', 'ENDCASE',
	'DO', 'ENDDO', 'TIMES', 'WHILE', 'ENDWHILE', 'LOOP', 'AT', 'ENDLOOP',
	'EXIT', 'CONTINUE', 'CHECK', 'RETURN', 'STOP',

	// Exception handling
	'TRY', 'CATCH', 'CLEANUP', 'ENDTRY', 'RAISE', 'RAISING', 'EXCEPTION',
	'EXCEPTIONS', 'RESUMABLE', 'RESUME',

	// Calls / parameters
	'CALL', 'EXPORTING', 'IMPORTING', 'CHANGING', 'RETURNING', 'USING',
	'PERFORM', 'DEFINE', 'END-OF-DEFINITION',

	// Data manipulation
	'MOVE', 'ASSIGN', 'UNASSIGN', 'CLEAR', 'FREE', 'APPEND', 'INSERT',
	'MODIFY', 'DELETE', 'READ', 'SORT', 'COLLECT', 'CONCATENATE', 'SPLIT',
	'CONDENSE', 'TRANSLATE', 'SHIFT', 'REPLACE', 'FIND', 'SEARCH',

	// Open SQL
	'SELECT', 'SINGLE', 'INTO', 'GROUP', 'BY', 'ORDER', 'HAVING', 'JOIN',
	'INNER', 'LEFT', 'OUTER', 'UNION', 'UP', 'ROWS', 'ENDSELECT', 'ALL',
	'ENTRIES', 'WHERE',

	// I/O / messages
	'WRITE', 'ULINE', 'SKIP', 'NEW-LINE', 'NEW-PAGE', 'MESSAGE',
];

const ABAP_OPERATOR_WORDS = [
	'EQ', 'NE', 'LT', 'GT', 'LE', 'GE', 'CO', 'CN', 'CA', 'NA', 'CS', 'NS',
	'CP', 'NP', 'AND', 'OR', 'NOT', 'XOR', 'IS', 'BOUND', 'ASSIGNED',
	'SUPPLIED',
];

const escapeForAlternation = (word: string) =>
	word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface TokenRule {
	type: AbapTokenType;
	// Every regex here must use the sticky ("y") flag so matching is
	// anchored to the scanner's current position.
	regex: RegExp;
}

const RULES: TokenRule[] = [
	// String templates and literals (checked before comment/pragma so a
	// quote/pipe inside them is never mistaken for something else).
	{ type: 'string', regex: /\|(?:\|\||[^|\r\n])*\|/y },
	{ type: 'string', regex: /`(?:``|[^`\r\n])*`/y },
	{ type: 'string', regex: /'(?:''|[^'\r\n])*'/y },
	// Inline comment: unescaped '"' to end of line.
	{ type: 'comment', regex: /"[^\r\n]*/y },
	{ type: 'pragma', regex: /##[A-Za-z_]+/y },
	{ type: 'boolean', regex: /\b(?:ABAP_TRUE|ABAP_FALSE|ABAP_UNDEFINED)\b/iy },
	{
		type: 'keyword',
		regex: new RegExp(
			'\\b(?:' + ABAP_KEYWORDS.map(escapeForAlternation).join('|') + ')\\b',
			'iy',
		),
	},
	{
		type: 'operator',
		regex: new RegExp(
			'\\b(?:' + ABAP_OPERATOR_WORDS.join('|') + ')\\b',
			'iy',
		),
	},
	{ type: 'operator', regex: /&&|<=|>=|<>|=|<|>|\+|-|\*|\//y },
	{ type: 'number', regex: /\d+(?:\.\d+)?/y },
	{ type: 'punctuation', regex: /[.,:()[\]]/y },
];

const PLAIN_RUN = /[A-Za-z0-9_]+/y;

/**
 * Tokenizes a single line of ABAP source. Full-line comments ('*' as the
 * literal first character of the line) are detected up front since that
 * rule only applies at column 1, not wherever a '*' happens to appear.
 */
export function tokenizeAbapLine(line: string): AbapToken[] {
	if (line.startsWith('*')) {
		return line.length > 0 ? [{ start: 0, end: line.length, type: 'comment' }] : [];
	}

	const tokens: AbapToken[] = [];
	let pos = 0;

	while (pos < line.length) {
		const ch = line[pos];
		if (ch === ' ' || ch === '\t') {
			pos++;
			continue;
		}

		let matchedLength = 0;
		for (const rule of RULES) {
			rule.regex.lastIndex = pos;
			const match = rule.regex.exec(line);
			if (match && match.index === pos && match[0].length > 0) {
				tokens.push({ start: pos, end: pos + match[0].length, type: rule.type });
				matchedLength = match[0].length;
				break;
			}
		}

		if (matchedLength > 0) {
			pos += matchedLength;
			continue;
		}

		PLAIN_RUN.lastIndex = pos;
		const plainMatch = PLAIN_RUN.exec(line);
		if (plainMatch && plainMatch.index === pos) {
			pos += plainMatch[0].length;
		} else {
			pos++;
		}
	}

	return tokens;
}
