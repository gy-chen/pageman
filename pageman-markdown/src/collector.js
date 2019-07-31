const assert = require('assert');
const MarkdownIt = require('markdown-it');

class NestStructure {
    constructor(tokens) {
        this.tokens = tokens;
    }

    getTokens() {
        return this.tokens;
    }
}

/**
 * collect nest structures from markdown text
 * 
 * @param {string} text 
 * @return {NestStructure[]}
 */
const collect = text => {
    const md = MarkdownIt();

    return collectFromTokens(md.parse(text));
};

/**
 * collect nest structures from markdown tokens
 * 
 * @param {Token[]} tokens 
 */
const collectFromTokens = tokens => {
    const nestStructures = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === 'heading_open') {
            nestStructures.push(collectHeadingNestStructure(tokens.slice(i)));
        }
        else if (token.type === 'list_item_open') {
            nestStructures.push(collectListNestStructure(tokens.slice(i)));
        }
    }
    return nestStructures;
};

const collectHeadingNestStructure = tokens => {
    assert.equal(tokens[0].type, 'heading_open');
    let i = 1;
    for (; i < tokens.length; i++) {
        if (tokens[i].type === 'heading_open') {
            break;
        }
    }
    return new NestStructure(tokens.slice(0, i));
};

const collectListNestStructure = tokens => {
    assert.equal(tokens[0].type, 'list_item_open');
    const nestLevel = tokens[0].level;
    let i = 1;
    for (; i < tokens.length; i++) {
        if (tokens[i].level === nestLevel && tokens[i].type === 'list_item_close') {
            return new NestStructure(tokens.slice(0, i + 1));
        }
    }
    throw Error(`unclosed list item at ${tokens[i].map}`);
};

module.exports = {
    collect: collect,
    collectFromTokens: collectFromTokens
}