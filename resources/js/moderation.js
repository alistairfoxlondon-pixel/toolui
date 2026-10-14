import rules from '../data/moderation-rules.json';
const patterns = rules.patterns.map(pattern => new RegExp(`(?:^|[^\\p{L}\\p{M}\\p{N}])(?:${pattern})(?![\\p{L}\\p{M}\\p{N}])`, 'iu'));
export function checkMessage(text) {
    const substitutions = {0:'o',1:'i',3:'e',4:'a',5:'s',7:'t','@':'a','$':'s'};
    const normalized = text.normalize('NFKC').replace(/\p{Cf}/gu, '').toLowerCase()
        .replace(/[013457@$]/g, char => substitutions[char]).replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
    if (patterns.some(pattern => pattern.test(normalized))) throw new Error('Not sent: this text matches a hate, threat, or abuse safety rule. Please edit it.');
}
